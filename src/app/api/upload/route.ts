import { NextResponse } from "next/server";
import { Buffer } from "buffer";
import prisma from "../../../lib/prisma";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, HumanMessagePromptTemplate } from "@langchain/core/prompts";

// API で multipart/form-data を Next.js の formData として受け取ります
export async function POST(request: Request) {
  try {
    // 1. 認証済みユーザーのセッションを取得
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "認証されていません" }, { status: 401 });
    }
    const userId = session.user.id;

    // 2. 画像ファイルおよび threadId の取得
    const formData = await request.formData();
    const file = formData.get("image");
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    const threadIdParam = formData.get("threadId");
    if (!threadIdParam || typeof threadIdParam !== "string") {
      return NextResponse.json({ error: "Thread ID is required" }, { status: 400 });
    }
    const threadId = threadIdParam;

    // 3. アップロードファイル名を生成（例：user_id/タイムスタンプ-ファイル名）
    const originalFile = file as File;
    const sanitizedFileName = originalFile.name.replace(/[^\w.-]/gi, '_');
    const fileName = `${userId}/${Date.now()}-${sanitizedFileName}`;

    // 4. Supabase Storageに画像をアップロード（認証済みユーザーのクライアントを使用）
    const { error: storageError } = await supabase.storage
      .from("upload_images")
      .upload(fileName, originalFile, { cacheControl: "3600", upsert: false });
    if (storageError) {
      console.error("Storage upload error:", storageError);
      throw storageError;
    }

    // 5. ストレージからパブリックURLを取得（認証済みユーザーのクライアントを使用）
    const { data: publicUrlData } = supabase.storage
      .from("upload_images")
      .getPublicUrl(fileName);
    // 取得結果が null または publicUrl がない場合はエラーとする
    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error("Failed to retrieve public URL");
    }

    // 6. AI解析のため、画像ファイルをBase64に変換
    // const arrayBuffer = await originalFile.arrayBuffer();
    // const base64Image = Buffer.from(arrayBuffer).toString("base64");

    // 7. langchainによる画像解析処理
    const chat = new ChatOpenAI({ temperature: 0, modelName: "gpt-4o-2024-05-13" });
    const systemPrompt =
      "あなたは有能なパーソナルトレーナーです。ユーザーから送られる画像の解析結果を元に、食事に含まれるカロリーと栄養素を回答してください。";
    const humanPrompt = "{question}";
    // const imageTemplate = { image_url: { url: `data:image/png;base64,${base64Image}` } };
    const imageTemplate = { image_url: { url: publicUrlData.publicUrl } };
    const humanMessageTemplate = HumanMessagePromptTemplate.fromTemplate([humanPrompt, imageTemplate]);
    const prompt = ChatPromptTemplate.fromMessages([
      { role: "system", content: systemPrompt },
      humanMessageTemplate,
    ]);
    const chain = prompt.pipe(chat);
    const result = await chain.invoke({
      question:
        "この画像内に食事がある場合は、カロリー、タンパク質、脂質、炭水化物を表示してください。",
    });
    const aiResult =
      result && typeof result === "object" && "text" in result ? result.text : JSON.stringify(result);

    // 8. Prisma ORM を使用してアップロード情報をデータベースに保存 (uploadテーブル)
    await prisma.upload.create({
      data: {
        image_data: publicUrlData.publicUrl,
        ai_response: aiResult,
        user_id: userId,
      },
    });

    // 9. chat_history テーブルにも画像メッセージ (ユーザー) と BOT の解析結果を保存
    await prisma.chatHistory.createMany({
      data: [
        {
          user_id: userId,
          thread_id: threadId,
          message: publicUrlData.publicUrl,
          role: "user",
          created_at: new Date(),
        },
        {
          user_id: userId,
          thread_id: threadId,
          message: aiResult,
          role: "bot",
          created_at: new Date(),
        },
      ],
    });

    return NextResponse.json({ result: aiResult, url: publicUrlData.publicUrl });
  } catch (error) {
    console.error("Upload API Error:", error);
    return NextResponse.json({ error: "画像解析およびアップロードでエラーが発生しました" }, { status: 500 });
  }
}
