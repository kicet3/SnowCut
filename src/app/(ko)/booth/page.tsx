import { Booth } from "@/components/Booth";
import { pageMetadata } from "@/i18n/seo";

// 촬영 화면에는 광고를 넣지 않는다. 메인 페이지에서 일반 링크(전체 새로고침)로 들어오므로 광고 스크립트도 없다.
export const metadata = pageMetadata("ko", "booth");

export default function BoothPage() {
  return <Booth />;
}
