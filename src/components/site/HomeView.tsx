import type { ReactNode } from "react";
import { AdSlot, AdsenseLoader } from "@/components/AdSlot";
import { FramePreview } from "@/components/FramePreview";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { localePath, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { LAYOUTS, LAYOUT_KEYS } from "@/lib/frame";
import { FRAMES, FRAME_CATEGORIES } from "@/lib/frames";
import { CHARACTER_ENABLED, homeJsonLd, jsonLdScript } from "@/lib/site";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// 히어로 콜라주에 흩어 놓는 실제 프레임 견본
const HERO_STRIPS = [
  { frame: "pastel", layout: "strip", cls: "hs-1" },
  { frame: "film", layout: "strip", cls: "hs-2" },
  { frame: "hearts", layout: "grid", cls: "hs-3" },
  { frame: "dots", layout: "strip", cls: "hs-4" },
] as const;

function Section({ id, title, sub, children, tint }: { id?: string; title: string; sub: string; children: ReactNode; tint?: boolean }) {
  return (
    <section id={id} className={`home-section${tint ? " tint" : ""}`} aria-labelledby={id ? `${id}-title` : undefined}>
      <div className="home-inner">
        <header className="sec-head">
          <h2 id={id ? `${id}-title` : undefined}>{title}</h2>
          <p>- {sub} -</p>
        </header>
        {children}
      </div>
    </section>
  );
}

/** 메인(소개) 페이지. 언어마다 같은 화면을 그린다. */
export function HomeView({ locale }: { locale: Locale }) {
  const msg = getMessages(locale);
  const { common, home: m, catalog } = msg;
  // 촬영 화면은 일반 링크로 연다. 화면 전체를 새로 불러오므로 메인 페이지의 광고 스크립트(자동 광고)가 촬영 화면으로 따라가지 않는다.
  const booth = BASE + localePath(locale, "/booth");
  const homeHref = BASE + localePath(locale, "/");
  const character = m.features.character;
  const features = [
    ...m.features.items.map((f) => ({ ...f, soon: false })),
    CHARACTER_ENABLED ? { ...character, soon: false } : { ...character, body: `${character.soonBody} ${common.comingSoon}`, soon: true },
  ];

  return (
    <div className="home light">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(homeJsonLd(locale, msg)) }} />
      {/* 애드센스 스크립트는 관리자 모드에서 광고를 켰을 때만 브라우저에서 넣는다 (기본 꺼짐). 소유 확인은 메타 태그로 한다. */}
      <AdsenseLoader />
      <header className="home-bar">
        <nav className="home-nav" aria-label={m.nav.label}>
          <a href="#frames">{m.nav.frames}</a>
          <a href="#features">{m.nav.features}</a>
          <a href="#how">{m.nav.how}</a>
          <a href="#faq">{m.nav.faq}</a>
        </nav>
        <a className="brand" href={homeHref}>
          {/* 정적 내보내기라 next/image 최적화를 쓰지 않는다. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${BASE}/icons/icon-192.png`} alt="" width={30} height={30} />
          <span className="brand-word">
            Snow<span>Cut</span>
          </span>
        </a>
        <div className="home-bar-end">
          <LanguageSwitcher />
          <a className="btn primary small" href={booth}>
            {common.shoot}
          </a>
        </div>
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
            <p className="eyebrow">{m.hero.eyebrow}</p>
            <h1>
              {m.hero.titleTop}
              <br />
              <span>{m.hero.titleAccent}</span>
            </h1>
            <p className="lead">{m.hero.lead}</p>
            <a className="btn primary big" href={booth}>
              {common.startShooting}
            </a>
          </div>
        </section>

        <div className="split-banner">
          <a className="split pink" href="#how">
            <small>{m.split.howSmall}</small>
            <strong>
              {m.split.howTitle[0]}
              <br />
              {m.split.howTitle[1]}
            </strong>
            <span className="split-btn">{m.split.howButton}</span>
          </a>
          <a className="split peach" href={booth}>
            <small>{m.split.printSmall}</small>
            <strong>
              {m.split.printTitle[0]}
              <br />
              {m.split.printTitle[1]}
            </strong>
            <span className="split-btn dark">{m.split.printButton}</span>
          </a>
        </div>

        {/* 검색엔진·AI 요약이 그대로 인용할 수 있는 정의 문단 */}
        <section className="about" aria-labelledby="about-title">
          <div className="home-inner">
            <h2 id="about-title">{m.about.title}</h2>
            <p>{m.about.body}</p>
          </div>
        </section>

        <div className="home-inner">
          <AdSlot position="top" />
        </div>

        <Section id="frames" title={m.frames.title(FRAMES.length)} sub={m.frames.sub}>
          {FRAME_CATEGORIES.map((c) => (
            <div key={c.id} className="frame-row">
              <h3>{catalog.frameCategories[c.id]}</h3>
              <ul className="frame-strip-list">
                {FRAMES.filter((f) => f.category === c.id).map((f) => (
                  <li key={f.id}>
                    <FramePreview frame={f.id} layout="strip" width={96} className="frame-card" />
                    <span>{catalog.frames[f.id]}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Section>

        <Section id="layouts" title={m.layouts.title(LAYOUT_KEYS.length)} sub={m.layouts.sub} tint>
          <ul className="layout-list">
            {LAYOUT_KEYS.map((k) => (
              <li key={k}>
                <FramePreview frame="white" layout={k} width={k === "wide" ? 200 : k.startsWith("strip") ? 70 : 104} />
                <b>{catalog.layouts[k].title}</b>
                <span>
                  {m.layouts.cuts(LAYOUTS[k].count)} · {catalog.layouts[k].paper}
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="features" title={m.features.title} sub={m.features.sub}>
          <ul className="feature-grid">
            {features.map((f) => (
              <li key={f.title} className={f.soon ? "soon" : undefined}>
                <span className="feature-icon" aria-hidden>
                  {f.icon}
                </span>
                <h3>
                  {f.title}
                  {f.soon && <span className="soon-badge">{common.soonBadge}</span>}
                </h3>
                <p>{f.body}</p>
              </li>
            ))}
          </ul>
        </Section>

        <div className="home-inner">
          <AdSlot position="middle" />
        </div>

        <Section id="how" title={m.how.title} sub={m.how.sub}>
          <ol className="step-list">
            {m.how.steps.map((s, i) => (
              <li key={s.title}>
                <span className="step-no">{m.how.step(i + 1)}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
          <div className="center">
            <a className="btn primary big" href={booth}>
              {common.startShooting}
            </a>
          </div>
        </Section>

        <Section id="faq" title={m.faq.title} sub={m.faq.sub} tint>
          <div className="faq">
            {m.faq.items.map((f) => (
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
            <a href={booth}>{common.shoot}</a>
            <a href={BASE + localePath(locale, "/privacy")}>{common.privacy}</a>
          </nav>
          <p className="foot-brand">
            Snow<span>Cut</span>
          </p>
          <p>{m.footer.tagline}</p>
          <p>© SnowCut</p>
        </div>
      </footer>
    </div>
  );
}
