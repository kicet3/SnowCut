import type { Metadata, Viewport } from "next";
import { Black_Han_Sans, IBM_Plex_Sans_KR, Jua } from "next/font/google";
import "./globals.css";

// 한글 글꼴은 미리 불러올 subset이 없어서 preload를 끈다. 필요한 글자 범위만 그때그때 받는다.
const display = Black_Han_Sans({ weight: "400", preload: false, display: "swap", variable: "--font-display-face" });
const body = IBM_Plex_Sans_KR({ weight: ["400", "500", "700"], preload: false, display: "swap", variable: "--font-body-face" });
const print = Jua({ weight: "400", preload: false, display: "swap", variable: "--font-print-face" });

export const metadata: Metadata = {
  title: "SnowCut",
  description: "iPad에서 네 컷을 찍어 한 장의 사진으로 저장하는 포토부스",
  appleWebApp: {
    capable: true,
    title: "SnowCut",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1a1315",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${display.variable} ${body.variable} ${print.variable}`}>
      <body>{children}</body>
    </html>
  );
}
