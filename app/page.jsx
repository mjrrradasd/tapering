"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// Supabase 클라이언트 (환경변수 필요)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function HomePage() {
  // 인증/폼 상태
  const [session, setSession] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMsg, setAuthMsg] = useState("");

  // 글/댓글 상태
  const [posts, setPosts] = useState([]); // 최신순
  const [loadingPosts, setLoadingPosts] = useState(false);

  // 새 글 작성
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [postMsg, setPostMsg] = useState("");

  // 댓글: 글별로 상태 관리 (postId -> 댓글 배열)
  const [commentsByPost, setCommentsByPost] = useState({});
  const [commentInput, setCommentInput] = useState({}); // postId -> 입력값
  const [commentLoading, setCommentLoading] = useState({}); // postId -> 로딩여부

  // ─────────────────────────────────────────────────────────
  // 인증 세션 감시
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ─────────────────────────────────────────────────────────
  // 글 목록 불러오기 (최신순)
  const fetchPosts = useCallback(async () => {
    setLoadingPosts(true);
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(data)) {
      setPosts(data);
    }
    setLoadingPosts(false);
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // ─────────────────────────────────────────────────────────
  // 특정 글의 댓글 불러오기
  const fetchComments = useCallback(async (postId) => {
    setCommentLoading((prev) => ({ ...prev, [postId]: true }));
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (!error && Array.isArray(data)) {
      setCommentsByPost((prev) => ({ ...prev, [postId]: data }));
    }
    setCommentLoading((prev) => ({ ...prev, [postId]: false }));
  }, []);

  // 화면에 보이는 모든 글에 대해 댓글을 처음 1회 로드 (필요 시)
  useEffect(() => {
    posts.forEach((p) => {
      if (!commentsByPost[p.id]) fetchComments(p.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts]);

  // ─────────────────────────────────────────────────────────
  // 회원가입
  const handleSignup = async () => {
    setAuthMsg("");
    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthMsg("이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }
    const { error } = await supabase.auth.signUp({
      email: authEmail.trim(),
      password: authPassword,
    });
    if (error) {
      setAuthMsg(`회원가입 실패: ${error.message}`);
      return;
    }
    setAuthMsg("회원가입 완료! 로그인해주세요.");
    setShowSignup(false);
    setShowLogin(true);
  };

  // 로그인
  const handleLogin = async () => {
    setAuthMsg("");
    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthMsg("이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: authEmail.trim(),
      password: authPassword,
    });
    if (error) {
      setAuthMsg(`로그인 실패: ${error.message}`);
      return;
    }
    setAuthEmail("");
    setAuthPassword("");
    setShowLogin(false);
    setAuthMsg("");
  };

  // 로그아웃
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // ─────────────────────────────────────────────────────────
  // 새 글 작성
  const handleCreatePost = async () => {
    setPostMsg("");
    if (!session) {
      setPostMsg("로그인 후 이용할 수 있습니다.");
      return;
    }
    if (!title.trim() || !content.trim()) {
      setPostMsg("제목과 내용을 모두 입력해주세요.");
      return;
    }
    const user = session.user;
    const { data, error } = await supabase
      .from("posts")
      .insert([
        {
          title: title.trim(),
          content: content.trim(),
          user_id: user.id,
          user_email: user.email,
        },
      ])
      .select()
      .single();

    if (error) {
      setPostMsg(`작성 실패: ${error.message}`);
      return;
    }

    // 목록 맨 위에 추가
    setPosts((prev) => [data, ...prev]);
    setTitle("");
    setContent("");
    setPostMsg("게시글이 등록되었습니다.");
    // 해당 글의 댓글 영역 초기화
    setCommentsByPost((prev) => ({ ...prev, [data.id]: [] }));
  };

  // 댓글 작성
  const handleCreateComment = async (postId) => {
    if (!session) return alert("로그인 후 이용할 수 있습니다.");
    const text = (commentInput[postId] || "").trim();
    if (!text) return;

    const user = session.user;
    const { data, error } = await supabase
      .from("comments")
      .insert([
        {
          content: text,
          post_id: postId,
          user_id: user.id,
          user_email: user.email,
        },
      ])
      .select()
      .single();

    if (error) {
      alert(`댓글 작성 실패: ${error.message}`);
      return;
    }

    // 해당 글의 댓글 목록에 추가
    setCommentsByPost((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), data],
    }));
    // 입력창 비우기
    setCommentInput((prev) => ({ ...prev, [postId]: "" }));
  };

  // ─────────────────────────────────────────────────────────
  // UI 컴포넌트

  const AuthBox = () => (
    <div className="w-full max-w-xl mx-auto border rounded-lg p-4 bg-white">
      {!session ? (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">로그인 또는 회원가입</h2>

          <div className="flex gap-2">
            <button
              className={`px-4 py-2 rounded bg-blue-600 text-white`}
              onClick={() => {
                setShowLogin(true);
                setShowSignup(false);
                setAuthMsg("");
              }}
            >
              로그인
            </button>
            <button
              className={`px-4 py-2 rounded bg-emerald-600 text-white`}
              onClick={() => {
                setShowSignup(true);
                setShowLogin(false);
                setAuthMsg("");
              }}
            >
              회원가입
            </button>
          </div>

          {(showLogin || showSignup) && (
            <div className="space-y-2">
              <input
                type="email"
                placeholder="이메일"
                className="w-full border rounded px-3 py-2"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="비밀번호"
                className="w-full border rounded px-3 py-2"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
              />

              {showLogin && (
                <button
                  className="w-full px-4 py-2 rounded bg-blue-600 text-white"
                  onClick={handleLogin}
                >
                  로그인하기
                </button>
              )}
              {showSignup && (
                <button
                  className="w-full px-4 py-2 rounded bg-emerald-600 text-white"
                  onClick={handleSignup}
                >
                  회원가입하기
                </button>
              )}

              {authMsg && (
                <p className="text-sm text-red-600 whitespace-pre-line">
                  {authMsg}
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">{session.user.email}</span> 님 환영합니다.
          </p>
          <button
            className="px-3 py-2 rounded bg-gray-800 text-white"
            onClick={handleLogout}
          >
            로그아웃
          </button>
        </div>
      )}
    </div>
  );

  const NewPostBox = () =>
    session ? (
      <div className="w-full max-w-xl mx-auto border rounded-lg p-4 bg-white space-y-2">
        <h3 className="text-lg font-semibold">새 글 작성</h3>
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="w-full border rounded px-3 py-2 min-h-[120px]"
          placeholder="내용을 입력하세요"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button
          className="w-full px-4 py-2 rounded bg-blue-600 text-white"
          onClick={handleCreatePost}
        >
          글 올리기
        </button>
        {postMsg && <p className="text-sm text-gray-700">{postMsg}</p>}
      </div>
    ) : null;

  const PostItem = ({ post }) => {
    const postComments = commentsByPost[post.id] || [];
    const loading = commentLoading[post.id];

    return (
      <div className="border rounded-lg p-4 bg-white space-y-3">
        <div>
          <h4 className="text-lg font-semibold">{post.title}</h4>
          <p className="text-sm text-gray-500">
            작성자: {post.user_email} · {new Date(post.created_at).toLocaleString()}
          </p>
        </div>
        <p className="whitespace-pre-line">{post.content}</p>

        <div className="pt-2 border-t">
          <p className="font-semibold mb-2">댓글</p>

          {loading ? (
            <p className="text-sm text-gray-500">댓글을 불러오는 중…</p>
          ) : postComments.length === 0 ? (
            <p className="text-sm text-gray-500">아직 댓글이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {postComments.map((c) => (
                <div key={c.id} className="border rounded p-2">
                  <p>{c.content}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {c.user_email} · {new Date(c.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}

          {session && (
            <div className="mt-3 flex gap-2">
              <input
                className="flex-1 border rounded px-3 py-2"
                placeholder="댓글을 입력하세요"
                value={commentInput[post.id] || ""}
                onChange={(e) =>
                  setCommentInput((prev) => ({ ...prev, [post.id]: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleCreateComment(post.id);
                  }
                }}
              />
              <button
                className="px-4 py-2 rounded bg-emerald-600 text-white"
                onClick={() => handleCreateComment(post.id)}
              >
                등록
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const PostList = () => (
    <div className="w-full max-w-xl mx-auto space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">게시글 목록</h3>
        <button
          className="text-sm text-blue-600 underline"
          onClick={() => fetchPosts()}
        >
          새로고침
        </button>
      </div>

      {loadingPosts ? (
        <p className="text-sm text-gray-500">글을 불러오는 중…</p>
      ) : posts.length === 0 ? (
        <p className="text-sm text-gray-500">아직 작성된 글이 없습니다.</p>
      ) : (
        posts.map((p) => <PostItem key={p.id} post={p} />)
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────────
  // 화면
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">단약 커뮤니티</h1>
          <span className="text-sm text-gray-600">
            정신과 약 단약 정보를 함께 나누는 공간
          </span>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <AuthBox />
        <NewPostBox />
        <PostList />
      </section>

      <footer className="mt-10 py-6 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} 단약 커뮤니티
      </footer>
    </main>
  );
}
