"use client";

import ChatThreads from "../components/ChatThreads";
import ChatWindow from "../components/ChatWindow";

export default function ChatPage() {
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* 左サイドバー：チャットスレッド一覧 */}
      <div style={{ width: "300px", borderRight: "1px solid #ccc", overflowY: "auto" }}>
        <ChatThreads />
      </div>

      {/* 右エリア：チャット画面 */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <ChatWindow />
      </div>
    </div>
  );
}
