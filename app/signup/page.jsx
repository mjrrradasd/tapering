"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleSignup = async () => {
    if (!email || !password) {
      setMsg("이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setMsg(`회원가입 실패: ${error.message}`);
    } else {
      setMsg("회원가입 성공! 로그인 페이지로 이동해주세요.");
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h2 className="text-2xl font-bold mb-4">회원가입</h2>
      <input
        type="email"
        placeholder="이메일"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border px-3 py-2 rounded mb-2 w-64"
      />
      <input
        type="password"
        placeholder="비밀번호"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border px-3 py-2 rounded mb-2 w-64"
      />
      <button
        onClick={handleSignup}
        className="px-4 py-2 bg-emerald-600 text-white rounded w-64"
      >
        회원가입
      </button>
      {msg && <p className="mt-2 text-sm text-red-600">{msg}</p>}
    </main>
  );
}
