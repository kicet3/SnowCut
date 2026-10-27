import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { localePath, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { CHARACTER_ENABLED } from "@/lib/site";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function PrivacyView({ locale }: { locale: Locale }) {
  const { common, privacy: m } = getMessages(locale);
  const home = BASE + localePath(locale, "/");
  const [before, settings, middle, policy, after] = m.adsLinks;
  return (
    <div className="home light">
      <header className="home-bar">
        <a className="brand" href={home}>
          <span className="brand-word">
            Snow<span>Cut</span>
          </span>
        </a>
        <div className="home-bar-end">
          <LanguageSwitcher />
        </div>
      </header>
      <main className="home-main doc">
        <h1>{m.title}</h1>
        <h2>{m.photosTitle}</h2>
        <p>{m.photos}</p>
        {/* 누끼 기능을 켰을 때만 캐릭터 이미지 전송을 안내한다 (꺼져 있으면 아무것도 보내지 않는다). */}
        {CHARACTER_ENABLED && (
          <>
            <h2>{m.characterTitle}</h2>
            <p>{m.character}</p>
          </>
        )}
        <h2>{m.adsTitle}</h2>
        <p>{m.ads}</p>
        <p>
          {before}
          <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer">
            {settings}
          </a>
          {middle}
          <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">
            {policy}
          </a>
          {after}
        </p>
      </main>
      <footer className="home-foot">
        <a href={home}>{common.backHome}</a>
      </footer>
    </div>
  );
}
