import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SnowCut",
    short_name: "SnowCut",
    description: "iPad에서 네 컷을 찍어 한 장의 사진으로 저장하는 포토부스",
    // basePath(GitHub Pages 하위 경로)에서도 동작하도록 상대 경로를 쓴다.
    // 홈 화면에서 열면 메인 페이지 대신 바로 촬영 화면으로 들어간다.
    start_url: "./booth",
    scope: "./",
    display: "standalone",
    background_color: "#1a1315",
    theme_color: "#1a1315",
    icons: [
      { src: "./icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "./icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
