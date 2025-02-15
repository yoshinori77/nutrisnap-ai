import { NextResponse } from "next/server";
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, HumanMessagePromptTemplate } from "@langchain/core/prompts";
import { randomUUID } from "crypto"; // NEW: スレッドID生成用
// Prisma クライアントのインポート（プロジェクト構成に合わせて調整）
import prisma from "../../../lib/prisma";

export const config = {
  api: {
    bodyParser: true,
  },
};

// POST エンドポイント: 新規メッセージ送信（オプションで threadId を受け取る）
export async function POST(request: Request) {
  try {
    const { message, threadId } = await request.json();
    // 既存の threadId がなければ新規生成
    const finalThreadId = threadId || randomUUID();

    // AI チャット設定
    const chat = new ChatOpenAI({ temperature: 0, modelName: "gpt-4o-2024-05-13" });
    const system = "あなたは有能なパーソナルトレーナーであり、ユーザーと対話しながらパーソナルなアドバイスを提供します。";
    const humanPrompt = "{question}";
    const humanMessageTemplate = HumanMessagePromptTemplate.fromTemplate([humanPrompt]);
    const prompt = ChatPromptTemplate.fromMessages([
      { role: "system", content: system },
      humanMessageTemplate,
    ]);
    const chain = prompt.pipe(chat);
    const result = await chain.invoke({ question: message });
    const output =
      result && typeof result === "object" && "text" in result
        ? result.text
        : JSON.stringify(result);

    // ユーザー認証情報の取得（Supabase の認証）
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "認証されていません" }, { status: 401 });
    }
    const userId = session.user.id;

    // ユーザーのメッセージをチャット履歴に記録
    await prisma.chatHistory.create({
      data: {
        user_id: userId,
        message: message,
        role: "user",
        thread_id: finalThreadId,
      },
    });
    // BOT の応答をチャット履歴に記録
    await prisma.chatHistory.create({
      data: {
        user_id: userId,
        message: output,
        role: "bot",
        thread_id: finalThreadId,
      },
    });

    return NextResponse.json({ result: output, threadId: finalThreadId });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Error processing chat" }, { status: 500 });
  }
}

// GET エンドポイント: チャット履歴の取得（全スレッド or 特定スレッド）
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const requestedThreadId = url.searchParams.get("threadId");

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "認証されていません" }, { status: 401 });
    }
    const userId = session.user.id;

    if (requestedThreadId) {
      // クエリパラメータで指定されたスレッドのメッセージを取得
      const threadMessages = await prisma.chatHistory.findMany({
        where: { user_id: userId, thread_id: requestedThreadId },
        orderBy: { created_at: "asc" },
      });
      return NextResponse.json({ thread: threadMessages });
    } else {
      // 全チャット履歴を取得し、スレッドごとにグループ化
      const chatHistories = await prisma.chatHistory.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "asc" },
      });
      const threads = chatHistories.reduce((acc: Record<string, any[]>, curr) => {
        if (!acc[curr.thread_id]) {
          acc[curr.thread_id] = [];
        }
        acc[curr.thread_id].push(curr);
        return acc;
      }, {});
      return NextResponse.json({ threads });
    }
  } catch (error) {
    console.error("Chat GET API Error:", error);
    return NextResponse.json({ error: "チャット履歴の取得に失敗しました" }, { status: 500 });
  }
}
