"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">단약 커뮤니티</h1>
      <p className="mb-6 text-gray-600">
        정신과 약 단약 경험과 정보를 함께 나누는 공간입니다.
      </p>
      <div className="flex gap-4">
        <Link href="/login">
          <button className="px-4 py-2 bg-blue-600 text-white rounded">
            로그인
          </button>
        </Link>
        <Link href="/signup">
          <button className="px-4 py-2 bg-emerald-600 text-white rounded">
            회원가입
          </button>
        </Link>
      </div>
    </main>
  );
}
