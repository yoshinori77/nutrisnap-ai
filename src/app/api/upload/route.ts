import { NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, HumanMessagePromptTemplate } from "@langchain/core/prompts";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    // Next.js の Request から formData を取得
    const formData = await request.formData();
    const file = formData.get("image");
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // file は File オブジェクトなので、arrayBuffer() で内容を取得
    const arrayBuffer = await (file as File).arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");

    // AI 解析処理（ChatOpenAI の利用例）
    const chat = new ChatOpenAI({ temperature: 0, modelName: "gpt-4o-2024-05-13" });
    const system = "あなたは有能なパーソナルトレーナーです。ユーザーの問いに回答してください";
    const humanPrompt = "{question}";

    // 画像も含む情報としてテンプレートを作成（必要に応じて調整してください）
    const imageTemplate = { image_url: { url: `data:image/png;base64,${base64Image}` } };
    const humanMessageTemplate = HumanMessagePromptTemplate.fromTemplate([humanPrompt, imageTemplate]);
    const prompt = ChatPromptTemplate.fromMessages([
      { role: "system", content: system },
      humanMessageTemplate,
    ]);
    const chain = prompt.pipe(chat);

    const result = await chain.invoke({
      question:
        "この画像内に食事がある場合はカロリーと栄養素を表示してください。カロリー：xx kcal, タンパク質：xx g, 脂質：xx g, 炭水化物：xx gの順を表示してください。ビタミン・ミネラルなどの栄養素も表示してください。",
    });

    const output =
      result && typeof result === "object" && "text" in result
        ? result.text
        : JSON.stringify(result);

    // Supabase Admin Client を利用して DB に画像と解析結果を保存
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: dbError } = await supabaseAdmin
      .from("uploads")
      .insert([{ image_data: `data:image/png;base64,${base64Image}`, ai_response: output }]);
    if (dbError) {
      console.error("DB Insert Error:", dbError);
    }

    return NextResponse.json({ result: output });
  } catch (error) {
    console.error("Upload API Error:", error);
    return NextResponse.json({ error: "Error processing the image" }, { status: 500 });
  }
}