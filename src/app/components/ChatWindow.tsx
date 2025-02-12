"use client";

import { useState } from "react";

interface Message {
  role: 'user' | 'bot';
  content: string;
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    // ユーザーのメッセージを追加
    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);

    // /api/chat にメッセージを送信
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input.trim() })
    });
    const data = await res.json();
    const botMessage: Message = { role: 'bot', content: data.result };
    setMessages((prev) => [...prev, botMessage]);
    setInput("");
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-4 rounded shadow">
      <h2 className="text-xl font-bold mb-4 text-center">チャット</h2>
      <div className="h-80 overflow-y-auto border p-2 mb-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`p-2 mb-2 rounded ${msg.role === 'user' ? 'bg-blue-100 text-right' : 'bg-green-100 text-left'}`}>
            <p className="text-sm">{msg.content}</p>
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} className="flex">
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-grow p-2 border rounded-l"
          placeholder="メッセージを入力..."
        />
        <button type="submit" className="bg-blue-500 text-white px-4 rounded-r">
          送信
        </button>
      </form>
    </div>
  );
}
