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
          context_line?: string;
          pre_context?: string[];
          post_context?: string[];
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
  user?: {
    id?: string;
    email?: string;
    ip_address?: string;
  };
  tags?: Array<{
    key: string;
    value: string;
  }>;
  contexts?: {
    browser?: {
      name?: string;
      version?: string;
    };
    os?: {
      name?: string;
      version?: string;
    };
  };
}

type SlackBlockText = {
  type: "plain_text" | "mrkdwn";
  text: string;
  emoji?: boolean;
};

type SlackBlock = {
  type: "header" | "section";
  text?: SlackBlockText;
  fields?: Array<{
    type: "mrkdwn" | "plain_text";
    text: string;
  }>;
};

function formatStackTrace(
  exception: SentryEvent["exception"],
  detailed = false
) {
  if (!exception?.values?.[0]?.stacktrace?.frames) return "";

  const frames = exception.values[0].stacktrace.frames;
  const relevantFrames = detailed ? frames : frames.slice(-3);

  return (
    "```" +
    relevantFrames
      .map(
        (frame) =>
          `at ${frame.function} (${frame.filename}:${frame.lineno}:${frame.colno})` +
          (frame.context_line ? `\n   ${frame.context_line}` : "")
      )
      .join("\n") +
    "```"
  );
}

function convertSentryToBasicSlackMessage(sentryData: SentryEvent) {
  const errorTitle =
    sentryData.metadata?.title || sentryData.message || "Unknown Error";
  const errorType = sentryData.exception?.values?.[0]?.type || "";
  const errorValue = sentryData.exception?.values?.[0]?.value || "";
  const stackTrace = formatStackTrace(sentryData.exception);

  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "🚨 Sentry Alert",
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Error:* ${errorTitle}`,
      },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Project:*\n${sentryData.project || "N/A"}`,
        },
        {
          type: "mrkdwn",
          text: `*Environment:*\n${sentryData.environment || "N/A"}`,
        },
      ],
    },
  ];

  if (errorType || errorValue) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Error Details:*\n${errorType}: ${errorValue}`,
      },
    });
  }

  if (stackTrace) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Stack Trace:*\n${stackTrace}`,
      },
    });
  }

  if (sentryData.url) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `<${sentryData.url}|View in Sentry →>`,
      },
    });
  }

  return { blocks };
}

function convertSentryToDetailedSlackMessage(sentryData: SentryEvent) {
  const errorTitle =
    sentryData.metadata?.title || sentryData.message || "Unknown Error";
  const errorType = sentryData.exception?.values?.[0]?.type || "";
  const errorValue = sentryData.exception?.values?.[0]?.value || "";
  const stackTrace = formatStackTrace(sentryData.exception, true);

  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "🔍 Detailed Sentry Alert",
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Error:* ${errorTitle}\n*Type:* ${errorType}\n*Value:* ${errorValue}`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          "```\n" +
          `Exception\n${errorType}: ${errorValue}\n\n` +
          `Stack\n${stackTrace}\n\n` +
          `User\n${formatUserInfo(sentryData.user)}\n\n` +
          `Tags\n${formatTags(sentryData.tags)}\n\n` +
          `Context\n${formatContext(sentryData.contexts)}\n` +
          "```",
      },
    },
  ];

  if (sentryData.url) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `<${sentryData.url}|View in Sentry →>`,
      },
    });
  }

  return { blocks };
}

function formatUserInfo(user?: SentryEvent["user"]): string {
  if (!user) return "No user information";
  return Object.entries(user)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

function formatTags(tags?: SentryEvent["tags"]): string {
  if (!tags || tags.length === 0) return "No tags";
  return tags.map((tag) => `${tag.key}: ${tag.value}`).join("\n");
}

function formatContext(contexts?: SentryEvent["contexts"]): string {
  if (!contexts) return "No context information";
  return Object.entries(contexts)
    .map(([key, value]) => {
      if (typeof value === "object") {
        return `${key}:\n  ${Object.entries(value)
          .map(([k, v]) => `${k}: ${v}`)
          .join("\n  ")}`;
      }
      return `${key}: ${value}`;
    })
    .join("\n");
}

function convertSentryToGroupedSlackMessage(sentryData: SentryEvent) {
  const errorTitle =
    sentryData.metadata?.title || sentryData.message || "Unknown Error";
  const errorType = sentryData.exception?.values?.[0]?.type || "";

  // Note: In a real implementation, you would need to:
  // 1. Store error occurrences in a database
  // 2. Track frequency and trends
  // 3. Calculate affected users
  // This is a simplified version

  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "📊 Grouped Sentry Alert",
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Error Pattern:* ${errorTitle}`,
      },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Type:*\n${errorType || "Unknown"}`,
        },
        {
          type: "mrkdwn",
          text: `*Environment:*\n${sentryData.environment || "N/A"}`,
        },
        {
          type: "mrkdwn",
          text: `*Project:*\n${sentryData.project || "N/A"}`,
        },
        {
          type: "mrkdwn",
          text: `*First Seen:*\n${sentryData.timestamp || "Now"}`,
        },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Occurrence Pattern:*\n• First occurrence in this session\n• Monitoring for similar errors",
      },
    },
  ];

  if (sentryData.url) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `<${sentryData.url}|View Error Group in Sentry →>`,
      },
    });
  }

  return { blocks };
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // 웹훅 설정 조회
    const { data: webhook } = await supabase
      .from("webhooks")
      .select("slack_webhook_url, message_format")
      .eq("id", id)
      .single();

    if (!webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    const sentryData = await request.json();

    // 메시지 포맷에 따라 다른 변환 함수 사용
    let slackMessage;
    switch (webhook.message_format) {
      case "detailed":
        slackMessage = convertSentryToDetailedSlackMessage(sentryData);
        break;
      case "grouped":
        slackMessage = convertSentryToGroupedSlackMessage(sentryData);
        break;
      default:
        slackMessage = convertSentryToBasicSlackMessage(sentryData);
    }

    // Slack으로 메시지 전송
    const response = await fetch(webhook.slack_webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(slackMessage),
    });

    if (!response.ok) {
      throw new Error("Failed to send to Slack");
    }

    // 이벤트 기록
    const { error: eventError } = await supabase.from("webhook_events").insert([
      {
        webhook_id: id,
        event_type: sentryData.level || "unknown",
      },
    ]);

    if (eventError) {
      console.error("이벤트 기록 실패:", eventError);
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
