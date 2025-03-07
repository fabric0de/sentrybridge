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
  type: "header" | "section" | "divider";
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
  const timestamp = sentryData.timestamp
    ? new Date(sentryData.timestamp * 1000).toLocaleString()
    : "N/A";

  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `🚨 Error in ${sentryData.project || "Unknown Project"}`,
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${
          sentryData.metadata?.title || exception?.value || "Error Alert"
        }*`,
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
        { type: "mrkdwn", text: `*Level:*\n${sentryData.level}` },
        { type: "mrkdwn", text: `*Time:*\n${timestamp}` },
      ],
    },
  ];

  // Source Code Context
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

  // User Context (if available)
  if (sentryData.user) {
    blocks.push({
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*User ID:*\n${sentryData.user.id || "N/A"}` },
        {
          type: "mrkdwn",
          text: `*User Email:*\n${sentryData.user.email || "N/A"}`,
        },
      ],
    });
  }

  // URL and View in Sentry button
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

function formatDetailedMessage(sentryData: SentryEvent): {
  blocks: SlackBlock[];
} {
  const blocks = [...formatBasicMessage(sentryData).blocks];

  // Browser & OS Info
  if (sentryData.contexts) {
    const browserInfo = sentryData.contexts.browser;
    const osInfo = sentryData.contexts.os;

    blocks.push({
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Browser:*\n${browserInfo?.name} ${
            browserInfo?.version || "N/A"
          }`,
        },
        {
          type: "mrkdwn",
          text: `*OS:*\n${osInfo?.name} ${osInfo?.version || "N/A"}`,
        },
      ],
    });
  }

  // Recent Breadcrumbs
  if (sentryData.breadcrumbs?.values.length) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          "*Recent Activity:*\n```" +
          sentryData.breadcrumbs.values
            .slice(-5)
            .map(
              (b) =>
                `[${new Date(b.timestamp * 1000).toLocaleTimeString()}] ${
                  b.category
                }: ${b.message || b.type}`
            )
            .join("\n") +
          "```",
      },
    });
  }

  // Tags
  if (sentryData.tags?.length) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Tags:*\n```" + formatTags(sentryData.tags) + "```",
      },
    });
  }

  // Extra Data
  if (sentryData.extra) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          "*Additional Context:*\n```" + formatExtra(sentryData.extra) + "```",
      },
    });
  }

  // Divider before link
  blocks.push({ type: "divider" });

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
