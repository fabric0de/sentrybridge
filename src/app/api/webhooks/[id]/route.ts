import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type {
  SentryEvent,
  SentryException,
  SentryStackFrame,
} from "@/types/sentry";

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

function formatSourceCode(frame: SentryStackFrame): string {
  if (!frame.context_line) return "";

  const lines: string[] = [];

  frame.pre_context?.forEach((line, i) => {
    lines.push(
      `${frame.lineno - (frame.pre_context?.length ?? 0) + i}  ${line}`
    );
  });

  lines.push(`${frame.lineno}* ${frame.context_line}`);

  frame.post_context?.forEach((line, i) => {
    lines.push(`${frame.lineno + i + 1}  ${line}`);
  });

  return "```typescript\n" + lines.join("\n") + "\n```";
}

function formatErrorContext(exception: SentryException): string {
  const frame = exception.stacktrace?.frames?.[0];
  if (!frame) return "";

  return (
    `*Error Location*\n` +
    `File: \`${frame.filename}\`\n` +
    `Function: \`${frame.function}\`\n\n` +
    `*Source Code*\n${formatSourceCode(frame)}`
  );
}

function formatStackTrace(
  exception: SentryException | undefined,
  detailed = false
): string {
  if (!exception?.stacktrace?.frames) return "No stack trace available";

  const frames = detailed
    ? exception.stacktrace.frames
    : exception.stacktrace.frames.slice(-3);

  return (
    "```" +
    frames
      .map(
        (frame) =>
          `at ${frame.function} (${frame.filename}:${frame.lineno}:${frame.colno})`
      )
      .join("\n") +
    "```"
  );
}

function formatTags(tags?: [string, string][]): string {
  if (!tags || tags.length === 0) return "No tags";
  return tags.map(([key, value]) => `${key}: ${value}`).join("\n");
}

function formatExtra(extra?: Record<string, unknown>): string {
  if (!extra) return "No extra data";
  return Object.entries(extra)
    .map(([key, value]) => {
      const formattedValue =
        typeof value === "object" ? JSON.stringify(value, null, 2) : value;
      return `${key}: ${formattedValue}`;
    })
    .join("\n");
}

function formatBasicMessage(sentryData: SentryEvent): { blocks: SlackBlock[] } {
  const exception = sentryData.exception?.values?.[0];

  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `🚨 Error: ${sentryData.metadata?.title || "Error Alert"}`,
        emoji: true,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Type:*\n${exception?.type || "Unknown"}` },
        {
          type: "mrkdwn",
          text: `*Environment:*\n${sentryData.environment || "N/A"}`,
        },
      ],
    },
  ];

  if (exception) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: formatErrorContext(exception),
      },
    });

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Stack Trace:*\n" + formatStackTrace(exception, false),
      },
    });
  }

  return { blocks };
}

function formatDetailedMessage(sentryData: SentryEvent): {
  blocks: SlackBlock[];
} {
  const blocks = [...formatBasicMessage(sentryData).blocks];

  if (sentryData.tags?.length) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Tags:*\n```" + formatTags(sentryData.tags) + "```",
      },
    });
  }

  if (sentryData.contexts) {
    blocks.push({
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Browser:*\n${sentryData.contexts.browser?.name} ${sentryData.contexts.browser?.version}`,
        },
        {
          type: "mrkdwn",
          text: `*OS:*\n${sentryData.contexts.os?.name} ${sentryData.contexts.os?.version}`,
        },
      ],
    });
  }

  if (sentryData.extra) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Extra Data:*\n```" + formatExtra(sentryData.extra) + "```",
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

    const { data: webhook } = await supabase
      .from("webhooks")
      .select("slack_webhook_url, message_format")
      .eq("id", id)
      .single();

    if (!webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    const sentryData = await request.json();
    const slackMessage =
      webhook.message_format === "detailed"
        ? formatDetailedMessage(sentryData)
        : formatBasicMessage(sentryData);

    const response = await fetch(webhook.slack_webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(slackMessage),
    });

    if (!response.ok) {
      throw new Error("Failed to send to Slack");
    }

    await supabase.from("webhook_events").insert([
      {
        webhook_id: id,
        event_type: sentryData.level || "unknown",
      },
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "An error occurred while processing the webhook" },
      { status: 500 }
    );
  }
}
