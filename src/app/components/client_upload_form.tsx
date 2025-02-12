"use client";

import dynamic from "next/dynamic";

// upload-form をクライアント専用で動的にインポート（SSR無効）
const UploadForm = dynamic(() => import("./upload-form"), { ssr: false });

export default function ClientUploadForm() {
  return <UploadForm />;
}
