import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { slackWebhookUrl, messageFormat } = await request.json();

    // 이미 등록된 webhook URL인지 확인
    const { data: existingWebhook } = await supabase
      .from("webhooks")
      .select("id")
      .eq("slack_webhook_url", slackWebhookUrl)
      .single();

    if (existingWebhook) {
      return NextResponse.json(
        { error: "This Slack webhook URL is already registered" },
        { status: 400 }
      );
    }

    // 새 webhook 생성
    const { data, error } = await supabase
      .from("webhooks")
      .insert([
        {
          slack_webhook_url: slackWebhookUrl,
          message_format: messageFormat,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase 에러:", error);
      throw error;
    }

    const newWebhookUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/webhooks/${data.id}`;

    return NextResponse.json({
      webhookUrl: newWebhookUrl,
    });
  } catch (error) {
    console.error("웹훅 생성 에러:", error);
    return NextResponse.json(
      { error: "Failed to create webhook" },
      { status: 500 }
    );
  }
}
