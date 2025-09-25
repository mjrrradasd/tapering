"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// 환경변수에서 Supabase 클라이언트 생성
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Page() {
  // 인증 관련 상태
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 게시글/댓글 상태
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  // 초기 세션 확인
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 게시글 불러오기
  const fetchPosts = useCallback(async () => {
    let { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setPosts(data);
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // 특정 글의 댓글 불러오기
  const fetchComments = useCallback(async (postId) => {
    let { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    if (!error) setComments(data);
  }, []);

  // 회원가입
  const handleSignup = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert("회원가입 실패: " + error.message);
    else alert("회원가입 성공! 이메일을 확인하세요.");
  };

  // 로그인
  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("로그인 실패: " + error.message);
  };

  // 로그아웃
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // 게시글 작성
  const handlePostSubmit = async () => {
    if (!session) {
      alert("로그인 후 이용 가능합니다.");
      return;
    }
    const { user } = session;
    const { error } = await supabase.from("posts").insert([
      {
        title: newPostTitle,
        content: newPostContent,
        user_id: user.id,
        user_email: user.email,
      },
    ]);
    if (error) {
      alert("게시글 작성 실패: " + error.message);
    } else {
      setNewPostTitle("");
      setNewPostContent("");
      fetchPosts();
    }
  };

  // 댓글 작성
  const handleCommentSubmit = async () => {
    if (!session) {
      alert("로그인 후 이용 가능합니다.");
      return;
    }
    const { user } = session;
    const { error } = await supabase.from("comments").insert([
      {
        content: newComment,
        post_id: selectedPost.id,
        user_id: user.id,
        user_email: user.email,
      },
    ]);
    if (error) {
      alert("댓글 작성 실패: " + error.message);
    } else {
      setNewComment("");
      fetchComments(selectedPost.id);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center">단약 커뮤니티</h1>

      {/* 인증 영역 */}
      {!session ? (
        <div className="space-y-2 p-4 border rounded">
          <h2 className="font-semibold">로그인 / 회원가입</h2>
          <input
            className="border p-2 w-full"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="border p-2 w-full"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              onClick={handleLogin}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              로그인
            </button>
            <button
              onClick={handleSignup}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              회원가입
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-center p-4 border rounded">
          <span>{session.user.email} 님 환영합니다!</span>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-3 py-1 rounded"
          >
            로그아웃
          </button>
        </div>
      )}

      {/* 글 작성 */}
      {session && (
        <div className="space-y-2 p-4 border rounded">
          <h2 className="font-semibold">새 글 작성</h2>
          <input
            className="border p-2 w-full"
            placeholder="제목"
            value={newPostTitle}
            onChange={(e) => setNewPostTitle(e.target.value)}
          />
          <textarea
            className="border p-2 w-full"
            placeholder="내용"
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
          />
          <button
            onClick={handlePostSubmit}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            글 올리기
          </button>
        </div>
      )}

      {/* 글 목록 */}
      {!selectedPost && (
        <div className="space-y-2">
          <h2 className="font-semibold">게시글 목록</h2>
          {posts.map((post) => (
            <div
              key={post.id}
              className="p-3 border rounded cursor-pointer hover:bg-gray-50"
              onClick={() => {
                setSelectedPost(post);
                fetchComments(post.id);
              }}
            >
              <h3 className="font-bold">{post.title}</h3>
              <p className="text-sm text-gray-600">
                작성자: {post.user_email} | {new Date(post.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 글 상세 */}
      {selectedPost && (
        <div className="space-y-4">
          <button
            onClick={() => setSelectedPost(null)}
            className="text-blue-600 underline"
          >
            ← 목록으로
          </button>
          <h2 className="text-xl font-bold">{selectedPost.title}</h2>
          <p className="whitespace-pre-line">{selectedPost.content}</p>
          <p className="text-sm text-gray-600">
            작성자: {selectedPost.user_email} |{" "}
            {new Date(selectedPost.created_at).toLocaleString()}
          </p>

          {/* 댓글 목록 */}
          <div className="space-y-2">
            <h3 className="font-semibold">댓글</h3>
            {comments.map((c) => (
              <div key={c.id} className="border p-2 rounded">
                <p>{c.content}</p>
                <p className="text-xs text-gray-500">
                  {c.user_email} | {new Date(c.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {/* 댓글 작성 */}
          {session && (
            <div className="space-y-2">
              <textarea
                className="border p-2 w-full"
                placeholder="댓글을 입력하세요"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <button
                onClick={handleCommentSubmit}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                댓글 달기
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
