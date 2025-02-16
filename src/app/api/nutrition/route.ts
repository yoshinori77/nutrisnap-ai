import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

// ai_response のテキストから各栄養素の数値を抽出する簡易パーサー
function parseAiResponse(text: string) {
  const caloriesMatch = text.match(/カロリー[:：]\s*(\d+)/);
  const proteinMatch = text.match(/タンパク質[:：]\s*(\d+)/);
  const fatMatch = text.match(/脂質[:：]\s*(\d+)/);
  const carbMatch = text.match(/炭水化物[:：]\s*(\d+)/);
  const vitaminMatch = text.match(/ビタミン[:：]\s*(\d+)/);
  const mineralMatch = text.match(/ミネラル[:：]\s*(\d+)/);
  const fiberMatch = text.match(/食物繊維[:：]\s*(\d+)/);
  return {
    calories: caloriesMatch ? parseInt(caloriesMatch[1], 10) : 0,
    protein: proteinMatch ? parseInt(proteinMatch[1], 10) : 0,
    fat: fatMatch ? parseInt(fatMatch[1], 10) : 0,
    carbs: carbMatch ? parseInt(carbMatch[1], 10) : 0,
    vitamin: vitaminMatch ? parseInt(vitaminMatch[1], 10) : 0,
    mineral: mineralMatch ? parseInt(mineralMatch[1], 10) : 0,
    fiber: fiberMatch ? parseInt(fiberMatch[1], 10) : 0,
  };
}

// ISO 週番号を簡易算出（例："2023-W41"）
function getWeekKey(date: Date): string {
  const year = date.getFullYear();
  const firstThursday = new Date(date.getFullYear(), 0, 4);
  const dayDiff = (date.getTime() - firstThursday.getTime()) / (1000 * 60 * 60 * 24);
  const week = Math.ceil((dayDiff + firstThursday.getDay() + 1) / 7);
  return `${year}-W${week}`;
}

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
    const uploads = await prisma.upload.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "asc" },
    });

    const daily: Record<string, { calories: number; protein: number; fat: number; carbs: number; vitamin: number; mineral: number; fiber: number; count: number }> = {};
    const weekly: Record<string, { calories: number; protein: number; fat: number; carbs: number; vitamin: number; mineral: number; fiber: number; count: number }> = {};
    const monthly: Record<string, { calories: number; protein: number; fat: number; carbs: number; vitamin: number; mineral: number; fiber: number; count: number }> = {};

    uploads.forEach((upload) => {
      const parsed = parseAiResponse(upload.ai_response);
      const date = new Date(upload.created_at);
      const dayKey = date.toISOString().slice(0, 10);
      const weekKey = getWeekKey(date);
      const monthKey = date.toISOString().slice(0, 7);

      if (!daily[dayKey])
        daily[dayKey] = { calories: 0, protein: 0, fat: 0, carbs: 0, vitamin: 0, mineral: 0, fiber: 0, count: 0 };
      daily[dayKey].calories += parsed.calories;
      daily[dayKey].protein += parsed.protein;
      daily[dayKey].fat += parsed.fat;
      daily[dayKey].carbs += parsed.carbs;
      daily[dayKey].vitamin += parsed.vitamin;
      daily[dayKey].mineral += parsed.mineral;
      daily[dayKey].fiber += parsed.fiber;
      daily[dayKey].count++;

      if (!weekly[weekKey])
        weekly[weekKey] = { calories: 0, protein: 0, fat: 0, carbs: 0, vitamin: 0, mineral: 0, fiber: 0, count: 0 };
      weekly[weekKey].calories += parsed.calories;
      weekly[weekKey].protein += parsed.protein;
      weekly[weekKey].fat += parsed.fat;
      weekly[weekKey].carbs += parsed.carbs;
      weekly[weekKey].vitamin += parsed.vitamin;
      weekly[weekKey].mineral += parsed.mineral;
      weekly[weekKey].fiber += parsed.fiber;
      weekly[weekKey].count++;

      if (!monthly[monthKey])
        monthly[monthKey] = { calories: 0, protein: 0, fat: 0, carbs: 0, vitamin: 0, mineral: 0, fiber: 0, count: 0 };
      monthly[monthKey].calories += parsed.calories;
      monthly[monthKey].protein += parsed.protein;
      monthly[monthKey].fat += parsed.fat;
      monthly[monthKey].carbs += parsed.carbs;
      monthly[monthKey].vitamin += parsed.vitamin;
      monthly[monthKey].mineral += parsed.mineral;
      monthly[monthKey].fiber += parsed.fiber;
      monthly[monthKey].count++;
    });

    // 補正値があれば上書き（NutritionAdjustment テーブルから当該ユーザーの補正値を取得）
    const adjustments = await prisma.nutritionAdjustment.findMany({
      where: { user_id: userId },
    });
    adjustments.forEach((adj) => {
      if (daily[adj.date]) {
        daily[adj.date] = { ...daily[adj.date], ...adj };
      } else {
        daily[adj.date] = { calories: adj.calories, protein: adj.protein, fat: adj.fat, carbs: adj.carbs, vitamin: adj.vitamin, mineral: adj.mineral, fiber: adj.fiber, count: 1 };
      }
    });

    return NextResponse.json({ daily, weekly, monthly });
  } catch (error) {
    console.error("Nutrition GET error:", error);
    return NextResponse.json({ error: "Failed to fetch nutrition data" }, { status: 500 });
  }
} 