"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  // createClientComponentClient() を利用してSupabaseクライアントを生成
  const supabase = createClientComponentClient();

  // ログイン用ハンドラ
  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage("サインイン成功");
      // ログイン成功後のクライアント側リダイレクト
      router.push("/");
    }
  };

  // サインアップ用ハンドラ
  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // client-side なので window.location.origin を利用してリダイレクト先を指定
    const emailRedirectTo = window.location.origin + "/auth/callback";
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo }
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("サインアップ成功。メールをご確認ください。");
      router.push("/");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <form onSubmit={isSignUp ? handleSignUp : handleSignIn}>
          <h2 className="text-2xl font-bold text-center mb-6">
            {isSignUp ? "サインアップ" : "サインイン"}
          </h2>
          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4 w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4 w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded transition-colors duration-200"
          >
            {isSignUp ? "サインアップ" : "ログイン"}
          </button>
        </form>
        <div className="mt-4 text-center">
          {isSignUp ? (
            <>
              <span>既にアカウントをお持ちですか？</span>
              <span
                className="text-blue-500 cursor-pointer ml-2 hover:underline"
                onClick={() => setIsSignUp(false)}
              >
                ログインはこちら
              </span>
            </>
          ) : (
            <>
              <span>アカウントをお持ちでないですか？</span>
              <span
                className="text-blue-500 cursor-pointer ml-2 hover:underline"
                onClick={() => setIsSignUp(true)}
              >
                サインアップはこちら
              </span>
            </>
          )}
        </div>
        {message && <p className="mt-4 text-center text-sm text-gray-600">{message}</p>}
      </div>
    </div>
  );
}
