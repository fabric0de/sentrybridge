import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const [webhooksResult, eventsResult] = await Promise.all([
      supabase.from("webhooks").select("*", { count: "exact", head: true }),
      supabase
        .from("webhook_events")
        .select("*", { count: "exact", head: true }),
    ]);

    return NextResponse.json({
      webhookCount: webhooksResult.count || 0,
      eventCount: eventsResult.count || 0,
    });
  } catch (error) {
    console.error("통계 조회 에러:", error);
    return NextResponse.json(
      { error: "통계 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
