import type { Metadata, Viewport } from "next";
import { AdSlot } from "@/components/AdSlot";
import { FramePreview } from "@/components/FramePreview";
import { ADSENSE_CLIENT } from "@/lib/ads";
import { LAYOUTS, LAYOUT_KEYS } from "@/lib/frame";
import { FRAMES, FRAME_CATEGORIES } from "@/lib/frames";

export const metadata: Metadata = {
  title: "SnowCut · 브라우저로 찍는 네컷 사진",
  description:
    "설치 없이 브라우저에서 바로 찍는 네컷 사진 부스. 레이아웃 6종, 프레임 21종, 필터 11종, 촬영 영상 저장, 캐논 SELPHY 인쇄까지.",
};

// 메인 페이지만 밝은 테마라서 브라우저 상단 색도 맞춘다.
export const viewport: Viewport = { themeColor: "#fff5f7" };

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
// 촬영 화면은 일반 링크로 연다. 화면 전체를 새로 불러오므로 메인 페이지의 광고 스크립트가 촬영 화면으로 따라가지 않는다.
const BOOTH = `${BASE}/booth`;

const FEATURES = [
  { icon: "▦", title: "레이아웃 6종", body: "세로 4컷, 2×2, 세로 3컷, 6컷, 가로 4컷, 큰 1컷 + 3컷. 고른 장수만큼 찍어요." },
  { icon: "✿", title: "프레임 21종", body: "베이직 · 패턴 · 감성 · 시즌. 다 찍은 뒤에 마음에 드는 프레임으로 바꿔 보세요." },
  { icon: "◐", title: "필터 11종", body: "화사, 선명, 필름, 흑백… 필터는 사진 칸에만 들어가고 프레임 색은 그대로예요." },
  { icon: "▶", title: "촬영 영상", body: "찍는 동안의 모습이 영상으로 함께 남아요. 사진과 같이 저장할 수 있어요." },
  { icon: "⎙", title: "바로 인쇄", body: "캐논 SELPHY CP1500 엽서 용지에 맞춰 인쇄해요. 세로 스트립은 한 장에 두 개씩." },
  { icon: "★", title: "커스텀 캐릭터", body: "좋아하는 캐릭터 이미지를 올리면 배경을 지워 프레임 위에 스티커처럼 붙여요. 위치·크기·회전도 자유롭게." },
  { icon: "◎", title: "외부 카메라", body: "노트북 웹캠은 물론 USB로 연결한 카메라(니콘 Zf 등)도 골라 쓸 수 있어요." },
];

const STEPS = [
  { title: "레이아웃 고르기", body: "몇 컷을 어떤 모양으로 찍을지 고르고 타이머(기본 5초)를 정해요. 커스텀 캐릭터도 여기서 올려요." },
  { title: "포즈 잡고 촬영", body: "카운트다운이 끝나면 찰칵. 마음에 안 드는 컷은 그 컷만 다시 찍어요." },
  { title: "꾸미고 저장", body: "프레임과 필터를 고르고 사진 앱에 저장하거나 파일로 받고, 바로 인쇄해요." },
];

const FAQ = [
  {
    q: "찍은 사진이 서버에 올라가나요?",
    a: "아니요. 촬영, 합성, 필터, 저장은 모두 사용하는 기기의 브라우저 안에서만 이뤄지고, 사진과 영상은 어디에도 전송되지 않아요. 커스텀 캐릭터의 누끼를 딸 때만 올린 캐릭터 이미지가 배경 제거 서버로 보내져요.",
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

// 히어로 콜라주에 흩어 놓는 실제 프레임 견본
const HERO_STRIPS = [
  { frame: "pastel", layout: "strip", cls: "hs-1" },
  { frame: "film", layout: "strip", cls: "hs-2" },
  { frame: "hearts", layout: "grid", cls: "hs-3" },
  { frame: "dots", layout: "strip", cls: "hs-4" },
] as const;

function Section({ id, title, sub, children, tint }: { id?: string; title: string; sub: string; children: React.ReactNode; tint?: boolean }) {
  return (
    <section id={id} className={`home-section${tint ? " tint" : ""}`}>
      <div className="home-inner">
        <header className="sec-head">
          <h2>{title}</h2>
          <p>- {sub} -</p>
        </header>
        {children}
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="home light">
      {/* 애드센스 스크립트는 메인 페이지에만 넣는다 (React가 <head>로 옮기고 한 번만 불러온다). */}
      {ADSENSE_CLIENT && (
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
        />
      )}
      <header className="home-bar">
        <nav className="home-nav" aria-label="섹션">
          <a href="#frames">프레임</a>
          <a href="#features">기능</a>
          <a href="#how">사용법</a>
          <a href="#faq">FAQ</a>
        </nav>
        <a className="brand" href={`${BASE}/`}>
          {/* 정적 내보내기라 next/image 최적화를 쓰지 않는다. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${BASE}/icons/icon-192.png`} alt="" width={30} height={30} />
          <span className="brand-word">
            Snow<span>Cut</span>
          </span>
        </a>
        <a className="btn primary small" href={BOOTH}>
          촬영하기
        </a>
      </header>

      <main>
        <section className="hero">
          <div className="hero-collage" aria-hidden>
            {HERO_STRIPS.map((s) => (
              <div key={s.cls} className={`hero-strip ${s.cls}`}>
                <FramePreview frame={s.frame} layout={s.layout} width={s.layout === "strip" ? 120 : 190} />
              </div>
            ))}
            <span className="sticker st-spark">✦</span>
            <span className="sticker st-spark2">✧</span>
            <span className="sticker st-heart">♥</span>
            <span className="sticker st-snow">❄</span>
            <span className="sticker st-badge">
              SNOW <b>♥</b> CUT
            </span>
            <span className="sticker st-cheese">say cheese!</span>
          </div>
          <div className="hero-copy">
            <p className="eyebrow">설치 없이 브라우저에서</p>
            <h1>
              지금 바로 찍는
              <br />
              <span>네컷 사진</span>
            </h1>
            <p className="lead">카메라만 있으면 어디서든 포토부스. 찍고, 꾸미고, 저장하고, 인쇄까지 한 번에.</p>
            <a className="btn primary big" href={BOOTH}>
              촬영 시작하기
            </a>
          </div>
        </section>

        <div className="split-banner">
          <a className="split pink" href="#how">
            <small>HOW TO</small>
            <strong>
              3단계로 끝나는
              <br />
              촬영 방법
            </strong>
            <span className="split-btn">방법 알아보기</span>
          </a>
          <a className="split peach" href={BOOTH}>
            <small>PRINT</small>
            <strong>
              찍고 바로
              <br />
              SELPHY 인쇄
            </strong>
            <span className="split-btn dark">지금 찍으러 가기</span>
          </a>
        </div>

        <div className="home-inner">
          <AdSlot position="top" />
        </div>

        <Section id="frames" title={`프레임 ${FRAMES.length}종`} sub="다 찍은 뒤에 골라도 돼요">
          {FRAME_CATEGORIES.map((c) => (
            <div key={c.id} className="frame-row">
              <h3>{c.name}</h3>
              <ul className="frame-strip-list">
                {FRAMES.filter((f) => f.category === c.id).map((f) => (
                  <li key={f.id}>
                    <FramePreview frame={f.id} layout="strip" width={96} className="frame-card" />
                    <span>{f.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Section>

        <Section title={`레이아웃 ${LAYOUT_KEYS.length}종`} sub="몇 컷을 어떤 모양으로 찍을지 골라요" tint>
          <ul className="layout-list">
            {LAYOUT_KEYS.map((k) => (
              <li key={k}>
                <FramePreview frame="white" layout={k} width={k === "wide" ? 200 : k.startsWith("strip") ? 70 : 104} />
                <b>{LAYOUTS[k].title}</b>
                <span>
                  {LAYOUTS[k].count}컷 · {LAYOUTS[k].paper}
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="features" title="이런 걸 할 수 있어요" sub="SnowCut 기능">
          <ul className="feature-grid">
            {FEATURES.map((f) => (
              <li key={f.title}>
                <span className="feature-icon" aria-hidden>
                  {f.icon}
                </span>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </li>
            ))}
          </ul>
        </Section>

        <div className="home-inner">
          <AdSlot position="middle" />
        </div>

        <Section id="how" title="이렇게 찍어요" sub="3 STEP">
          <ol className="step-list">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <span className="step-no">STEP {i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
          <div className="center">
            <a className="btn primary big" href={BOOTH}>
              촬영 시작하기
            </a>
          </div>
        </Section>

        <Section id="faq" title="자주 묻는 질문" sub="FAQ" tint>
          <div className="faq">
            {FAQ.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </Section>

        <div className="home-inner">
          <AdSlot position="bottom" />
        </div>
      </main>

      <footer className="home-foot">
        <div className="home-inner">
          <nav>
            <a href={BOOTH}>촬영하기</a>
            <a href={`${BASE}/privacy`}>개인정보처리방침</a>
          </nav>
          <p className="foot-brand">
            Snow<span>Cut</span>
          </p>
          <p>설치 없이 브라우저에서 찍는 네컷 사진 부스. 사진은 기기 밖으로 나가지 않아요.</p>
          <p>© SnowCut</p>
        </div>
      </footer>
    </div>
  );
}
