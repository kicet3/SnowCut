import { createHash } from "node:crypto";
import type { NextConfig } from "next";
import { ADMIN_HASH_PREFIX, ADMIN_PASSWORD_LENGTH } from "./src/lib/admin";

// GitHub Pages처럼 하위 경로(/저장소이름)에 올릴 때는 빌드 시 NEXT_PUBLIC_BASE_PATH=/저장소이름 을 준다.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

// 관리자 모드 비밀번호(8자리). 평문은 번들에 넣지 않고 빌드할 때 해시로 바꿔 넣는다 (src/lib/admin.ts).
// 정적 사이트라 해시는 브라우저에서 볼 수 있으므로, 추측하기 어려운 값을 쓴다.
function adminPasswordHash(): string {
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!password) return "";
  if ([...password].length !== ADMIN_PASSWORD_LENGTH) {
    console.warn(`ADMIN_PASSWORD는 ${ADMIN_PASSWORD_LENGTH}자리여야 합니다. 관리자 모드 로그인을 끕니다.`);
    return "";
  }
  return createHash("sha256").update(ADMIN_HASH_PREFIX + password).digest("hex");
}

const nextConfig: NextConfig = {
  // 서버 없이 정적 파일(out/)로 내보낸다. 카메라는 HTTPS에서만 동작하므로 HTTPS 정적 호스팅에 올린다.
  output: "export",
  basePath,
  env: {
    NEXT_PUBLIC_ADMIN_PASSWORD_HASH: adminPasswordHash(),
  },
};

export default nextConfig;
