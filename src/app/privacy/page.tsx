import type { Metadata } from "next";

export const metadata: Metadata = { title: "개인정보처리방침 · SnowCut" };

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function Privacy() {
  return (
    <div className="home">
      <header className="home-bar">
        <a className="brand" href={`${BASE}/`}>
          VIBE <span>HERO</span>
        </a>
      </header>
      <main className="home-main doc">
        <h1>개인정보처리방침</h1>
        <h2>사진과 영상</h2>
        <p>
          촬영한 사진과 영상은 사용하는 기기의 브라우저 안에서만 처리됩니다. 서버로 전송하거나 저장하지 않으며, 페이지를
          닫으면 저장하지 않은 사진은 사라집니다. 선택한 카메라는 다음 방문 때 다시 고르지 않도록 브라우저(localStorage)에만
          기억합니다.
        </p>
        <h2>광고와 쿠키</h2>
        <p>
          메인 페이지에는 Google AdSense 광고가 표시됩니다. Google을 비롯한 제3자 공급업체는 쿠키를 사용해 이 사이트나 다른
          사이트를 방문한 기록을 바탕으로 광고를 게재할 수 있습니다. 촬영 화면에는 광고를 표시하지 않습니다.
        </p>
        <p>
          맞춤 광고는{" "}
          <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer">
            Google 광고 설정
          </a>
          에서 끌 수 있고, Google의 데이터 사용 방식은{" "}
          <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">
            Google 광고 정책
          </a>
          에서 확인할 수 있습니다.
        </p>
      </main>
      <footer className="home-foot">
        <a href={`${BASE}/`}>메인으로</a>
      </footer>
    </div>
  );
}
