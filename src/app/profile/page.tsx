"use client";

import UserProfileForm from "../components/UserProfileForm";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const handleUserProfileSave = async (data: UserProfile) => {
    const res = await fetch("/api/user/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setUserProfile(data);
    } else {
      alert("ユーザープロファイルの保存に失敗しました");
    }
  };

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
      <h1 className="text-2xl font-bold mb-4">ユーザー情報</h1>
      <UserProfileForm onSave={handleUserProfileSave} />
      {userProfile && (
        <div>
          <h2>保存されたプロフィール:</h2>
          <p>性別: {userProfile.gender}</p>
          <p>年齢: {userProfile.age}</p>
          <p>身長: {userProfile.height} cm</p>
          <p>体重: {userProfile.weight} kg</p>
          <p>活動係数: {userProfile.activity_factor}</p>
        </div>
      )}
    </div>
  );
}

interface UserProfile {
  gender: string;
  age: number;
  height: number;
  weight: number;
  activity_factor: number;
}
