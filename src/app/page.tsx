import type { Metadata } from "next";
import { AdSlot } from "@/components/AdSlot";
import { ADSENSE_CLIENT } from "@/lib/ads";

export const metadata: Metadata = {
  title: "SnowCut · 브라우저로 찍는 네컷 사진",
  description:
    "설치 없이 브라우저에서 바로 찍는 네컷 사진 부스. 레이아웃 6종, 프레임 21종, 필터 11종, 촬영 영상 저장, 캐논 SELPHY 인쇄까지.",
};

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
// 촬영 화면은 일반 링크로 연다. 화면 전체를 새로 불러오므로 메인 페이지의 광고 스크립트가 촬영 화면으로 따라가지 않는다.
const BOOTH = `${BASE}/booth`;

const FEATURES = [
  { title: "레이아웃 6종", body: "세로 4컷, 2×2, 세로 3컷, 6컷, 가로 4컷, 큰 1컷 + 3컷. 고른 장수만큼 찍어요." },
  { title: "프레임 21종", body: "베이직 · 패턴 · 감성 · 시즌. 다 찍은 뒤에 마음에 드는 프레임으로 바꿔 보세요." },
  { title: "필터 11종", body: "화사, 선명, 필름, 흑백… 필터는 사진 칸에만 들어가고 프레임 색은 그대로예요." },
  { title: "촬영 영상", body: "찍는 동안의 모습이 영상으로 함께 남아요. 사진과 같이 저장할 수 있어요." },
  { title: "바로 인쇄", body: "캐논 SELPHY CP1500 엽서 용지에 맞춰 인쇄해요. 세로 스트립은 한 장에 두 개씩." },
  { title: "외부 카메라", body: "노트북 웹캠은 물론 USB로 연결한 카메라(니콘 Zf 등)도 골라 쓸 수 있어요." },
];

const STEPS = [
  { title: "레이아웃 고르기", body: "몇 컷을 어떤 모양으로 찍을지 고르고 타이머(기본 5초)를 정해요." },
  { title: "포즈 잡고 촬영", body: "카운트다운이 끝나면 찰칵. 마음에 안 드는 컷은 그 컷만 다시 찍어요." },
  { title: "꾸미고 저장", body: "프레임과 필터를 고르고 사진 앱에 저장하거나 파일로 받고, 바로 인쇄해요." },
];

const FAQ = [
  {
    q: "찍은 사진이 서버에 올라가나요?",
    a: "아니요. 촬영, 합성, 필터, 저장은 모두 사용하는 기기의 브라우저 안에서만 이뤄지고, 사진과 영상은 어디에도 전송되지 않아요.",
  },
  {
    q: "어떤 기기에서 쓸 수 있나요?",
    a: "카메라가 있는 iPad, 노트북, PC의 최신 Safari · Chrome · Edge에서 쓸 수 있어요. iPad는 Safari 공유 메뉴의 '홈 화면에 추가'로 앱처럼 쓰면 편해요.",
  },
  {
    q: "카메라가 켜지지 않아요.",
    a: "브라우저의 카메라 권한을 허용했는지 확인해 주세요. 카메라를 쓸 수 없는 환경에서는 버튼을 누를 때마다 기기의 기본 카메라로 한 장씩 찍어요.",
  },
];

export default function Home() {
  return (
    <div className="home">
      {/* 애드센스 스크립트는 메인 페이지에만 넣는다 (React가 <head>로 옮기고 한 번만 불러온다). */}
      {ADSENSE_CLIENT && (
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
        />
      )}
      <header className="home-bar">
        <a className="brand" href={`${BASE}/`}>
          VIBE <span>HERO</span>
        </a>
        <a className="btn primary small" href={BOOTH}>
          촬영하기
        </a>
      </header>

      <main className="home-main">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">설치 없이 브라우저에서</p>
            <h1>
              지금 바로 찍는
              <br />
              <span>네컷 사진</span>
            </h1>
            <p className="lead">
              카메라만 있으면 어디서든 포토부스. 찍고, 꾸미고, 저장하고, 인쇄까지 한 번에 끝나요.
            </p>
            <a className="btn primary big" href={BOOTH}>
              촬영 시작하기
            </a>
          </div>
          <div className="hero-art" aria-hidden>
            <div className="strip">
              <i />
              <i />
              <i />
              <i />
            </div>
            <div className="strip tilt">
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>
        </section>

        <AdSlot position="top" />

        <section className="home-section">
          <h2>이런 걸 할 수 있어요</h2>
          <ul className="feature-grid">
            {FEATURES.map((f) => (
              <li key={f.title}>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <AdSlot position="middle" />

        <section className="home-section">
          <h2>이렇게 찍어요</h2>
          <ol className="step-list">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <span className="step-no">{i + 1}</span>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <a className="btn primary big" href={BOOTH}>
            촬영 시작하기
          </a>
        </section>

        <section className="home-section">
          <h2>자주 묻는 질문</h2>
          <div className="faq">
            {FAQ.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <AdSlot position="bottom" />
      </main>

      <footer className="home-foot">
        <span>© SnowCut</span>
        <a href={`${BASE}/privacy`}>개인정보처리방침</a>
      </footer>
    </div>
  );
}
