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

  if (loading) return <div>読み込み中...</div>;
  if (error) return <div>エラー: {error}</div>;

  return (
    <div style={{ padding: "1rem" }}>
      <h1>チャットスレッド</h1>
      <Link href="/chat/new">
        <button style={{ marginBottom: "1rem", padding:"0.5rem 1rem", cursor:"pointer" }}>
          スレッドの新規作成
        </button>
      </Link>
      <ul>
        {Object.keys(threads).map((threadId) => {
          const messages = threads[threadId];
          const firstMessage = messages[0];
          return (
            <li key={threadId} style={{ marginBottom: "1rem", border: "1px solid #ccc", padding: "0.5rem" }}>
              <Link href={`/chat/${threadId}`}>
                <div>
                  <p><strong>スレッドID:</strong> {threadId}</p>
                  <p><strong>最初のメッセージ:</strong> {firstMessage.message}</p>
                  <p><strong>作成日時:</strong> {new Date(firstMessage.created_at).toLocaleString()}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
