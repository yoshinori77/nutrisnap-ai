"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface ChatMessage {
  id: string;
  thread_id: string;
  user_id: string;
  message: string;
  role: string;
  created_at: string;
}

export default function ChatThreadDetail() {
  const params = useParams();
  const threadId = params.threadId as string;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchThread() {
      try {
        const res = await fetch(`/api/chat?threadId=${threadId}`, { method: "GET" });
        if (!res.ok) {
          throw new Error("チャット履歴の取得に失敗しました");
        }
        const data = await res.json();
        setMessages(data.thread || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchThread();
  }, [threadId]);

  if (loading) return <div>読み込み中...</div>;
  if (error) return <div>エラー: {error}</div>;

  return (
    <div style={{ padding: "1rem" }}>
      <Link href="/chat">
        <button style={{ marginBottom: "1rem", padding:"0.5rem 1rem", cursor:"pointer" }}>
          戻る
        </button>
      </Link>
      <h1>チャットスレッド詳細</h1>
      <ul>
        {messages.map((msg) => (
          <li key={msg.id} style={{ marginBottom: "0.5rem", borderBottom: "1px solid #ddd", padding: "0.5rem" }}>
            <p><strong>{msg.role === "user" ? "あなた" : "BOT"}:</strong> {msg.message}</p>
            <p style={{ fontSize: "0.8rem", color: "#666" }}>{new Date(msg.created_at).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
