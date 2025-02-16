import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }
    const userId = session.user.id;

    const userProfile = await prisma.userProfile.findUnique({
      where: { user_id: userId },
    });

    return NextResponse.json(userProfile);
  } catch (error) {
    console.error("UserProfile GET error:", error);
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }
    const userId = session.user.id;
    const body = await request.json();

    // リクエストボディの検証
    console.log("Request Body:", body);
    const { gender, age, height, weight, activity_factor } = body; // activityFactor を取得
    if (typeof activity_factor !== "number") {
      return NextResponse.json({ error: "Invalid activity factor" }, { status: 400 });
    }

    const userProfile = await prisma.userProfile.upsert({
      where: { user_id: userId },
      update: { gender, age, height, weight, activity_factor },
      create: { user_id: userId, gender, age, height, weight, activity_factor },
    });

    if (!userProfile) {
      return NextResponse.json({ error: "Failed to update user profile" }, { status: 500 });
    }

    return NextResponse.json(userProfile);
  } catch (error) {
    console.error("UserProfile update error:", error);
    return NextResponse.json({ error: "Failed to update user profile" }, { status: 500 });
  }
}
