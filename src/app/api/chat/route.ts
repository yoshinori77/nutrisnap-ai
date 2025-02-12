import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, HumanMessagePromptTemplate } from "@langchain/core/prompts";

export const config = {
  api: {
    bodyParser: true,
  },
};

export async function POST(request: Request) {
  try {
    const { message, userId } = await request.json();

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

    // Supabase Admin Client を利用してチャット履歴を保存
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: dbError } = await supabaseAdmin
      .from("chat_history")
      .insert([
        { user_id: userId || null, message: message, role: "user" },
        { user_id: userId || null, message: output, role: "bot" }
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
