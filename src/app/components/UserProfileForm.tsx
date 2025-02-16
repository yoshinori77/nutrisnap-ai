"use client";

import { useState } from "react";

export default function UserProfileForm({ onSave }: { onSave: (data: UserProfile) => void }) {
  const [gender, setGender] = useState<string>("");
  const [age, setAge] = useState<number | "">("");
  const [height, setHeight] = useState<number | "">("");
  const [weight, setWeight] = useState<number | "">("");
  const [activityFactor, setActivityFactor] = useState<number | "">("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      gender,
      age: Number(age),
      height: Number(height),
      weight: Number(weight),
      activity_factor: Number(activityFactor),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md">
      <h1 className="text-2xl mb-4">ユーザー情報</h1>
      <div>
        <label className="block mb-2">性別:</label>
        <select value={gender} onChange={(e) => setGender(e.target.value)} className="border rounded p-2 mb-4">
          <option value="">選択してください</option>
          <option value="男性">男性</option>
          <option value="女性">女性</option>
        </select>
      </div>
      <div>
        <label className="block mb-2">年齢:</label>
        <input
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className="border rounded p-2 mb-4"
          placeholder="年齢"
          min="0"
        />
      </div>
      <div>
        <label className="block mb-2">身長 (cm):</label>
        <input
          type="number"
          value={height}
          onChange={(e) => setHeight(e.target.value)}
          className="border rounded p-2 mb-4"
          placeholder="身長"
          min="0"
        />
      </div>
      <div>
        <label className="block mb-2">体重 (kg):</label>
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="border rounded p-2 mb-4"
          placeholder="体重"
          min="0"
        />
      </div>
      <div>
        <label className="block mb-2">運動レベル:</label>
        <select value={activityFactor} onChange={(e) => setActivityFactor(Number(e.target.value))} className="border rounded p-2 mb-4">
          <option value="">選択してください</option>
          <option value={1.2}>ほとんど運動しない</option>
          <option value={1.375}>軽い運動（週1-3日）</option>
          <option value={1.55}>中程度の運動（週3-5日）</option>
          <option value={1.725}>激しい運動（週6-7日）</option>
          <option value={1.9}>非常に激しい運動（肉体労働やトレーニング）</option>
        </select>
      </div>
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        保存
      </button>
    </form>
  );
}

interface UserProfile {
  gender: string;
  age: number;
  height: number;
  weight: number;
  activity_factor: number;
}
