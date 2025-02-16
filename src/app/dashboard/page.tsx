"use client";

import React, { useEffect, useState } from "react";
import { Line, Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import Link from "next/link";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler,
  Title,
  Tooltip,
  Legend
);

interface AggregatedData {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  count: number;
  vitamin: number;
  mineral: number;
  fiber: number;
}

interface UserProfile {
  gender: string;
  age: number;
  height: number;
  weight: number;
  activity_factor: number;
}

export default function Dashboard() {
  const [data, setData] = useState<{
    daily: Record<string, AggregatedData>;
    weekly: Record<string, AggregatedData>;
    monthly: Record<string, AggregatedData>;
  } | null>(null);

  // 補正用ローカルステート（キーは日付）
  const [editing, setEditing] = useState<Record<string, AggregatedData>>({});

  // 期間選択用ステート
  const [timePeriod, setTimePeriod] = useState<"1週間" | "1ヶ月" | "半年" | "1年">("1ヶ月");

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetch("/api/nutrition")
      .then((res) => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  const dailyDates = data ? Object.keys(data.daily).sort() : [];

  // 基準カロリーと栄養素の計算
  const calculateNutritionalNeeds = () => {
    if (!userProfile) return null;

    const { gender, age, height, weight, activity_factor } = userProfile;
    let calorieNeeds = 0;

    // 改訂版Harris-Benedict式に基づく計算
    if (gender === "男性") {
      calorieNeeds = Math.round(
        88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)
      );
    } else {
      calorieNeeds = Math.round(
        447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age)
      );
    }

    // 活動係数を考慮
    calorieNeeds *= activity_factor;

    return {
      calorieNeeds,
      protein: Math.round((calorieNeeds * 0.15) / 4), // タンパク質：カロリーの15%を4で割る
      fat: Math.round((calorieNeeds * 0.25) / 9),     // 脂質：カロリーの25%を9で割る
      carbs: Math.round((calorieNeeds * 0.60) / 4),   // 炭水化物：カロリーの60%を4で割る
    };
  };

  const nutritionalNeeds = calculateNutritionalNeeds();

  // 日別カロリーの折れ線グラフデータ
  const chartData = {
    labels: dailyDates,
    datasets: [
      {
        label: "カロリー (kcal)",
        data: dailyDates.map((d) => data?.daily[d].calories || 0),
        fill: false,
        backgroundColor: "rgba(75,192,192,0.4)",
        borderColor: "rgba(75,192,192,1)",
      },
      {
        label: "基準カロリー",
        data: dailyDates.map(() => nutritionalNeeds ? nutritionalNeeds.calorieNeeds : 0),
        fill: false,
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderDash: [5, 5], // 点線
      },
    ],
  };

  // 期間に応じたレーダーチャート用データの集計（過去◯日分）
  const timePeriods: Record<string, number> = {
    "1週間": 7,
    "1ヶ月": 30,
    "半年": 182,
    "1年": 365,
  };

  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - timePeriods[timePeriod]);

  const radarAggregated = data
    ? Object.keys(data.daily)
        .filter((dateKey) => new Date(dateKey) >= startDate)
        .reduce(
          (acc, dateKey) => {
            const dayData = data.daily[dateKey];
            return {
              protein: acc.protein + dayData.protein,
              fat: acc.fat + dayData.fat,
              carbs: acc.carbs + dayData.carbs,
              vitamin: acc.vitamin + (dayData.vitamin || 0),
              mineral: acc.mineral + (dayData.mineral || 0),
              fiber: acc.fiber + (dayData.fiber || 0),
            };
          },
          { protein: 0, fat: 0, carbs: 0, vitamin: 0, mineral: 0, fiber: 0 }
        )
    : { protein: 0, fat: 0, carbs: 0, vitamin: 0, mineral: 0, fiber: 0 };

  const dailyRecommended = {
    protein: 60,   // g/日
    fat: 70,       // g/日
    carbs: 350,    // g/日
    vitamin: 50,   // 任意の単位/日
    mineral: 100,  // 任意の単位/日
    fiber: 30,     // g/日
  };
  const recommendedAggregated = {
    protein: dailyRecommended.protein * timePeriods[timePeriod],
    fat: dailyRecommended.fat * timePeriods[timePeriod],
    carbs: dailyRecommended.carbs * timePeriods[timePeriod],
    vitamin: dailyRecommended.vitamin * timePeriods[timePeriod],
    mineral: dailyRecommended.mineral * timePeriods[timePeriod],
    fiber: dailyRecommended.fiber * timePeriods[timePeriod],
  };
  const radarPercentages = {
    protein: recommendedAggregated.protein ? (radarAggregated.protein / recommendedAggregated.protein) * 100 : 0,
    fat:     recommendedAggregated.fat ? (radarAggregated.fat / recommendedAggregated.fat) * 100 : 0,
    carbs:   recommendedAggregated.carbs ? (radarAggregated.carbs / recommendedAggregated.carbs) * 100 : 0,
    vitamin: recommendedAggregated.vitamin ? (radarAggregated.vitamin / recommendedAggregated.vitamin) * 100 : 0,
    mineral: recommendedAggregated.mineral ? (radarAggregated.mineral / recommendedAggregated.mineral) * 100 : 0,
    fiber:   recommendedAggregated.fiber ? (radarAggregated.fiber / recommendedAggregated.fiber) * 100 : 0,
  };

  const radarData = {
    labels: ["タンパク質", "脂質", "炭水化物", "ビタミン", "ミネラル", "食物繊維"],
    datasets: [
      {
        label: `${timePeriod}の栄養素摂取割合 (%)`,
        data: [
          radarPercentages.protein,
          radarPercentages.fat,
          radarPercentages.carbs,
          radarPercentages.vitamin,
          radarPercentages.mineral,
          radarPercentages.fiber,
        ],
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };

  const handleEditChange = (date: string, field: keyof AggregatedData, value: number) => {
    setEditing((prev) => ({
      ...prev,
      [date]: {
        ...(prev[date] || data?.daily[date] || { calories: 0, protein: 0, fat: 0, carbs: 0, count: 0, vitamin: 0, mineral: 0, fiber: 0 }),
        [field]: value,
      },
    }));
  };

  const saveAdjustment = async (date: string) => {
    const adj = editing[date];
    const res = await fetch("/api/nutrition/adjust", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        date,
        ...adj,
      }),
    });
    if (res.ok) {
      alert("更新完了");
      const newData = await fetch("/api/nutrition").then((res) => res.json());
      setData(newData);
      setEditing((prev) => {
        const updated = { ...prev };
        delete updated[date];
        return updated;
      });
    } else {
      alert("更新失敗");
    }
  };

  // const handleUserProfileSave = async (data: UserProfile) => {
  //   const res = await fetch("/api/user/profile", {
  //     method: "PUT",
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify(data),
  //   });
  //   if (res.ok) {
  //     setUserProfile(data);
  //   } else {
  //     alert("ユーザープロファイルの保存に失敗しました");
  //   }
  // };

  useEffect(() => {
    const fetchUserProfile = async () => {
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const profile = await res.json();
        setUserProfile(profile);
      }
    };
    fetchUserProfile();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">ダッシュボード</h1>
      <Link href="/profile" className="text-blue-500 underline mb-4">ユーザー情報を編集</Link>
      {nutritionalNeeds && (
        <div>
          <h2>基準カロリー: {nutritionalNeeds.calorieNeeds} kcal</h2>
          <h3>推奨栄養素:</h3>
          <ul>
            <li>タンパク質: {nutritionalNeeds.protein} g</li>
            <li>脂質: {nutritionalNeeds.fat} g</li>
            <li>炭水化物: {nutritionalNeeds.carbs} g</li>
          </ul>
        </div>
      )}
      {data ? (
        <>
          <div className="mb-8">
            <Line data={chartData} />
          </div>
          <div className="mb-4">
            <span className="mr-2 font-semibold">期間:</span>
            {(["1週間", "1ヶ月", "半年", "1年"] as const).map((option) => (
              <button
                key={option}
                onClick={() => setTimePeriod(option)}
                className={`mr-2 px-2 py-1 rounded ${
                  option === timePeriod ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <div className="mb-8">
            <Radar data={radarData} />
          </div>
          <h2 className="text-xl font-semibold mb-2">日別データ</h2>
          <table className="min-w-full border">
            <thead>
              <tr>
                <th className="border px-2 py-1">日付</th>
                <th className="border px-2 py-1">カロリー (kcal)</th>
                <th className="border px-2 py-1">タンパク質 (g)</th>
                <th className="border px-2 py-1">脂質 (g)</th>
                <th className="border px-2 py-1">炭水化物 (g)</th>
                <th className="border px-2 py-1">操作</th>
              </tr>
            </thead>
            <tbody>
              {dailyDates.map((date) => {
                const d = data.daily[date];
                const ed = editing[date] || d;
                return (
                  <tr key={date}>
                    <td className="border px-2 py-1">{date}</td>
                    <td className="border px-2 py-1">
                      <input
                        type="number"
                        value={ed.calories}
                        onChange={(e) =>
                          handleEditChange(date, "calories", parseInt(e.target.value))
                        }
                        className="w-20"
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <input
                        type="number"
                        value={ed.protein}
                        onChange={(e) =>
                          handleEditChange(date, "protein", parseInt(e.target.value))
                        }
                        className="w-20"
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <input
                        type="number"
                        value={ed.fat}
                        onChange={(e) =>
                          handleEditChange(date, "fat", parseInt(e.target.value))
                        }
                        className="w-20"
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <input
                        type="number"
                        value={ed.carbs}
                        onChange={(e) =>
                          handleEditChange(date, "carbs", parseInt(e.target.value))
                        }
                        className="w-20"
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <button
                        onClick={() => saveAdjustment(date)}
                        className="bg-blue-500 text-white px-2 py-1 rounded"
                      >
                        保存
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      ) : (
        <p>読み込み中...</p>
      )}
    </div>
  );
} 