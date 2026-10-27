// 언어별 공유 미리보기 이미지(1200×630)를 만든다: public/og/og-<언어>.png
//   node scripts/og-images.mjs
// 글자는 시스템 글꼴로 그리므로 macOS에서 실행한다 (Apple SD Gothic Neo · Hiragino · PingFang).
import { mkdirSync } from "node:fs";
import sharp from "sharp";

const OG = {
  ko: { font: "Apple SD Gothic Neo", line1: "설치 없이 브라우저로 찍는", line2: "무료 네컷 사진 부스" },
  en: { font: "Helvetica Neue", line1: "Free photo booth", line2: "right in your browser" },
  ja: { font: "Hiragino Sans", line1: "ブラウザで撮れる", line2: "無料4コマフォトブース" },
  zh: { font: "PingFang SC", line1: "浏览器里直接拍", line2: "免费四格照片亭" },
};
const CELLS = [
  ["#ffd3e0", "#ffadc6"],
  ["#d6e8ff", "#a9c4ff"],
  ["#d9f5e6", "#9fdcc0"],
  ["#efe1ff", "#c9adff"],
];

/** 사진 네 칸짜리 세로 스트립 */
function strip(x, y, rot, paper) {
  const w = 170, pad = 12, cell = 112, gap = 9;
  const cells = CELLS.map(([a, b], i) => {
    const cy = pad + i * (cell + gap);
    return `<rect x="${pad}" y="${cy}" width="${w - pad * 2}" height="${cell}" rx="5" fill="url(#g${i})"/>
      <circle cx="${w / 2}" cy="${cy + 44}" r="17" fill="#fff" opacity=".9"/>
      <path d="M${w / 2 - 34} ${cy + cell} a34 30 0 0 1 68 0z" fill="#fff" opacity=".9"/>`;
  }).join("");
  const h = pad + 4 * (cell + gap) + 30;
  return `<g transform="translate(${x} ${y}) rotate(${rot})">
    <rect width="${w}" height="${h}" rx="8" fill="${paper}" filter="url(#sh)"/>${cells}
    <text x="${w / 2}" y="${h - 14}" text-anchor="middle" font-family="Helvetica Neue" font-weight="700" font-size="15" fill="${paper === "#fff" ? "#2b1d22" : "#fff"}">SnowCut</text>
  </g>`;
}

function svg({ font, line1, line2 }) {
  const grads = CELLS.map(([a, b], i) => `<linearGradient id="g${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>${grads}
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffdbe5"/><stop offset=".5" stop-color="#ffeef3"/><stop offset="1" stop-color="#efe7ff"/></linearGradient>
    <filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="14" stdDeviation="16" flood-color="#5a1e32" flood-opacity=".22"/></filter>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1090" cy="560" r="170" fill="#e9e2ff"/>
  ${strip(780, 70, -8, "#fff")}
  ${strip(965, 110, 7, "#1f1a1c")}
  <g transform="translate(84 150)">
    <rect width="64" height="64" rx="15" fill="#1a1315"/>
    <g fill="#ffb547"><rect x="12" y="12" width="18" height="18" rx="4"/><rect x="34" y="12" width="18" height="18" rx="4"/><rect x="12" y="34" width="18" height="18" rx="4"/><rect x="34" y="34" width="18" height="18" rx="4"/></g>
    <text x="84" y="50" font-family="Helvetica Neue" font-weight="800" font-size="52" fill="#2b1d22">Snow<tspan fill="#d81b60">Cut</tspan></text>
  </g>
  <text x="84" y="320" font-family="${font}" font-weight="800" font-size="56" fill="#2b1d22">${line1}</text>
  <text x="84" y="392" font-family="${font}" font-weight="800" font-size="56" fill="#d81b60">${line2}</text>
  <text x="84" y="470" font-family="Helvetica Neue" font-weight="600" font-size="26" fill="#7d6870">✦ 6 layouts · 21 frames · 11 filters · SELPHY print</text>
  <text x="84" y="560" font-family="Helvetica Neue" font-weight="700" font-size="26" fill="#d81b60">snowcut.vercel.app</text>
</svg>`;
}

mkdirSync("public/og", { recursive: true });
for (const [locale, o] of Object.entries(OG)) {
  await sharp(Buffer.from(svg(o))).png({ compressionLevel: 9 }).toFile(`public/og/og-${locale}.png`);
  console.log(`public/og/og-${locale}.png`);
}
