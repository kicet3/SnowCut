import { Booth } from "@/components/Booth";
import { pageMetadata } from "@/i18n/seo";

// 촬영 화면에는 광고 자리를 두지 않는다. 광고를 켜면 다운로드·인쇄를 누를 때만 광고 창을 띄운다 (ResultScreen).
export const metadata = pageMetadata("ko", "booth");

export default function BoothPage() {
  return <Booth />;
}
