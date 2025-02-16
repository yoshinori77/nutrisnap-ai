"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";

interface ChatMessage {
  id: string;
  thread_id: string;
  user_id: string;
  message: string;
  role: string;
  created_at: string;
}

interface Threads {
  [key: string]: ChatMessage[];
}

export default function ChatThreads() {
  const [threads, setThreads] = useState<Threads>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchThreads() {
      try {
        const res = await fetch("/api/chat", { method: "GET" });
        if (!res.ok) {
          throw new Error("チャット履歴の取得に失敗しました");
        }
        const data = await res.json();
        setThreads(data.threads || {});
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchThreads();
  }, []);

  if (loading) return <div className="p-4">読み込み中...</div>;
  if (error) return <div className="p-4 text-red-500">エラー: {error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">チャットスレッド</h1>
      <Link href="/chat/new">
        <button className="mb-4 py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600">
          スレッドの新規作成
        </button>
      </Link>
      <ul>
        {Object.keys(threads).map((threadId) => {
          const messages = threads[threadId];
          const firstMessage = messages[0];
          return (
            <li key={threadId} className="mb-4 border border-gray-300 p-2 rounded">
              <Link href={`/chat/${threadId}`}>
                <div>
                  <p>
                    <strong>スレッドID:</strong> {threadId}
                  </p>
                  <p>
                    <strong>最初のメッセージ:</strong> {firstMessage.message}
                  </p>
                  <p>
                    <strong>作成日時:</strong>{" "}
                    {new Date(firstMessage.created_at).toLocaleString()}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
