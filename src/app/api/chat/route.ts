import { NextResponse } from "next/server";
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, HumanMessagePromptTemplate } from "@langchain/core/prompts";

export const config = {
  api: {
    bodyParser: true,
  },
};

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

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

    // Supabase のユーザー認証情報（JWT）を利用してクライアントを作成し、セッションを取得
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "認証されていません" }, { status: 401 });
    }
    const userId = session.user.id;

    // chat_history テーブルにレコードを挿入
    const { error: dbError } = await supabase
      .from("chat_history")
      .insert([
        { user_id: userId, message: message, role: "user" },
        { user_id: userId, message: output, role: "bot" }
      ]);
    if (dbError) {
      console.error("Chat history DB insert error:", dbError);
    }

    return NextResponse.json({ result: output });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Error processing chat" }, { status: 500 });
  }
}
