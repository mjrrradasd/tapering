import './globals.css';

export const metadata = {
  title: '단약 커뮤니티',
  description: '정신과 약 단약을 위한 정보 공유 커뮤니티입니다.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
