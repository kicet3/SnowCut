import type { NextConfig } from "next";

// GitHub Pages처럼 하위 경로(/저장소이름)에 올릴 때는 빌드 시 NEXT_PUBLIC_BASE_PATH=/저장소이름 을 준다.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  // 서버 없이 정적 파일(out/)로 내보낸다. 카메라는 HTTPS에서만 동작하므로 HTTPS 정적 호스팅에 올린다.
  output: "export",
  basePath,
};

export default nextConfig;
