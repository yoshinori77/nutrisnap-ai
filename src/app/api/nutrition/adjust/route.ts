import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

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
    const { date, calories, protein, fat, carbs } = body;
    if (!date)
      return NextResponse.json({ error: "Date is required" }, { status: 400 });

    const adjustment = await prisma.nutritionAdjustment.upsert({
      where: { user_id_date: { user_id: userId, date } },
      update: { calories, protein, fat, carbs },
      create: { user_id: userId, date, calories, protein, fat, carbs },
    });
    return NextResponse.json({ adjustment });
  } catch (error) {
    console.error("Nutrition adjustment error:", error);
    return NextResponse.json({ error: "Failed to update nutrition adjustment" }, { status: 500 });
  }
} 