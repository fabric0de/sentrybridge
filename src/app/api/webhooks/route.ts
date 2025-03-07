import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { slackWebhookUrl } = await request.json();

    if (!slackWebhookUrl) {
      return NextResponse.json(
        { error: "Slack 웹훅 URL이 필요합니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("webhooks")
      .insert([{ slack_webhook_url: slackWebhookUrl }])
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
      { error: "웹훅 URL 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
