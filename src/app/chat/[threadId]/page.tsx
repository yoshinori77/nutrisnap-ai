"use client";
import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

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
  const [sessionUser, setSessionUser] = useState<any>(null);
  useEffect(() => {
    const supabase = createClientComponentClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionUser(session?.user ?? null);
    });
  }, []);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage, threadId }),
      });
      if (!res.ok) throw new Error("メッセージ送信に失敗しました");
      const data = await res.json();
      const userMsg: ChatMessage = {
        id: "user-" + Date.now(),
        thread_id: threadId,
        user_id: sessionUser?.id || "self",
        message: newMessage,
        role: "user",
        created_at: new Date().toISOString(),
      };
      const botMsg: ChatMessage = {
        id: "bot-" + Date.now(),
        thread_id: threadId,
        user_id: sessionUser?.id || "self",
        message: data.result,
        role: "bot",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg, botMsg]);
      setNewMessage("");
    } catch (err: any) {
      alert(err.message || "送信に失敗しました");
    }
    setSending(false);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("threadId", threadId);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("画像アップロードに失敗しました");
      const data = await res.json();
      // 画像アップロード前のユーザー側のメッセージとしてプレビューを表示
      const imageMsg: ChatMessage = {
        id: "img-" + Date.now(),
        thread_id: threadId,
        user_id: sessionUser?.id || "self",
        message: data.url,
        role: "user",
        created_at: new Date().toISOString(),
      };
      const botMsg: ChatMessage = {
        id: "ai-" + Date.now(),
        thread_id: threadId,
        user_id: sessionUser?.id || "self",
        message: data.result,
        role: "bot",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, imageMsg, botMsg]);
    } catch (err: any) {
      alert(err.message || "画像アップロードに失敗しました");
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  if (loading) return <div className="p-4">読み込み中...</div>;
  if (error) return <div className="p-4 text-red-500">エラー: {error}</div>;

  return (
    <div className="flex flex-col h-screen p-4 overflow-hidden">
      <div className="mb-4">
        <Link href="/chat">
          <button className="py-2 px-4 bg-gray-300 rounded hover:bg-gray-400">
            戻る
          </button>
        </Link>
        <h1 className="text-2xl font-bold mt-2">チャットスレッド詳細</h1>
      </div>
      <div className="flex-1 overflow-y-auto mb-4">
        <ul className="list-none p-0">
          {messages.map((msg) => (
            <li
              key={msg.id}
              className={`mb-2 p-2 rounded ${msg.role === "user" ? "self-end bg-green-100" : "self-start bg-gray-100"}`}
            >
              <p>
                <strong>{msg.role === "user" ? "あなた" : "BOT"}:</strong>{" "}
                {/\.(jpg|jpeg|png|gif|webp|pdf|heic|tiff)$/i.test(msg.message) ? (
                  <Image
                    src={msg.message}
                    alt="uploaded content"
                    width={0}
                    height={0}
                    sizes="100vw"
                    style={{ width: "auto", height: "auto" }}
                    className="max-w-xs" // 必要なら最大幅の制限などを付ける
                    unoptimized
                  />
                ) : (
                  msg.message
                )}
              </p>
              <p className="text-xs text-gray-500">{new Date(msg.created_at).toLocaleString()}</p>
            </li>
          ))}
          <div ref={messagesEndRef} />
        </ul>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-shrink-0 items-center">
        <div className="relative flex-1">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="メッセージを入力"
            className="w-full pl-10 pr-2 py-2 border border-gray-300 rounded"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute left-2 top-1/2 transform -translate-y-1/2"
          >
            <svg
              className="w-6 h-6 text-gray-800 dark:text-white"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path fillRule="evenodd" d="M13 10a1 1 0 0 1 1-1h.01a1 1 0 1 1 0 2H14a1 1 0 0 1-1-1Z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12c0 .556-.227 1.06-.593 1.422A.999.999 0 0 1 20.5 20H4a2.002 2.002 0 0 1-2-2V6Zm6.892 12 3.833-5.356-3.99-4.322a1 1 0 0 0-1.549.097L4 12.879V6h16v9.95l-3.257-3.619a1 1 0 0 0-1.557.088L11.2 18H8.892Z" clipRule="evenodd" />
            </svg>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
        <button
          type="submit"
          disabled={sending}
          className="ml-2 py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {sending ? "送信中..." : "送信"}
        </button>
      </form>
    </div>
  );
}
