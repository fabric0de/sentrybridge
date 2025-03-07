import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface SentryEvent {
  event_id: string;
  level: string;
  message?: string;
  exception?: {
    values?: Array<{
      type: string;
      value: string;
      stacktrace?: {
        frames?: Array<{
          filename: string;
          function: string;
          lineno: number;
          colno: number;
        }>;
      };
    }>;
  };
  metadata?: {
    title?: string;
  };
  platform?: string;
  environment?: string;
  project?: string;
  timestamp?: string;
  url?: string;
}

function formatStackTrace(exception: SentryEvent["exception"]) {
  if (!exception?.values?.[0]?.stacktrace?.frames) return "";

  const frames = exception.values[0].stacktrace.frames
    .slice(-3) // 마지막 3개의 스택트레이스만 표시
    .map(
      (frame) =>
        `at ${frame.function} (${frame.filename}:${frame.lineno}:${frame.colno})`
    )
    .join("\n");

  return "```" + frames + "```";
}

function convertSentryToSlackMessage(sentryData: SentryEvent) {
  const errorTitle =
    sentryData.metadata?.title || sentryData.message || "알 수 없는 에러";
  const errorType = sentryData.exception?.values?.[0]?.type || "";
  const errorValue = sentryData.exception?.values?.[0]?.value || "";
  const stackTrace = formatStackTrace(sentryData.exception);

  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "🚨 Sentry 알림",
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*에러:* ${errorTitle}`,
      },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*프로젝트:*\n${sentryData.project || "N/A"}`,
        },
        {
          type: "mrkdwn",
          text: `*환경:*\n${sentryData.environment || "N/A"}`,
        },
        {
          type: "mrkdwn",
          text: `*레벨:*\n${sentryData.level || "N/A"}`,
        },
        {
          type: "mrkdwn",
          text: `*플랫폼:*\n${sentryData.platform || "N/A"}`,
        },
      ],
    },
  ];

  if (errorType || errorValue) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*에러 상세:*\n${errorType}: ${errorValue}`,
      },
    });
  }

  if (stackTrace) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*스택트레이스:*\n${stackTrace}`,
      },
    });
  }

  if (sentryData.url) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `<${sentryData.url}|Sentry에서 자세히 보기 >`,
      },
    });
  }

  return {
    blocks: blocks,
  };
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Supabase에서 웹훅 URL 조회
    const { data: webhook, error } = await supabase
      .from("webhooks")
      .select("slack_webhook_url")
      .eq("id", id)
      .single();

    if (error || !webhook) {
      return NextResponse.json(
        { error: "웹훅을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Sentry 데이터 파싱
    const sentryData: SentryEvent = await request.json();
    const slackMessage = convertSentryToSlackMessage(sentryData);

    // Slack으로 메시지 전송
    const slackResponse = await fetch(webhook.slack_webhook_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(slackMessage),
    });

    if (!slackResponse.ok) {
      throw new Error("Slack 메시지 전송 실패");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("웹훅 처리 에러:", error);
    return NextResponse.json(
      { error: "웹훅 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
