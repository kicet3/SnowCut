import type { Messages } from "../ko";

/** 메인(소개) 페이지 */
const home: Messages["home"] = {
  nav: { label: "Sections", frames: "Frames", features: "Features", how: "How to", faq: "FAQ" },
  hero: {
    eyebrow: "Right in your browser, no install",
    titleTop: "Snap your own",
    titleAccent: "4-cut photo strips",
    lead: "Got a camera? Then you've got a photo booth, anywhere. Shoot, decorate, save and print, all in one place.",
  },
  /** 검색·AI 요약용 한 문단 정의 (화면에도 보인다) */
  about: {
    title: "What is SnowCut?",
    body: "SnowCut is a free online photo booth for 4-cut photo strips that works right in your web browser, with no sign-up or app install. Take 3, 4 or 6 shots in a row with your iPad, phone or laptop camera, decorate them with frames and filters, then save to your photo library or print directly on postcard paper. Your photos and videos never leave your device.",
  },
  split: {
    howSmall: "HOW TO",
    howTitle: ["Shoot in", "3 easy steps"],
    howButton: "See how",
    printSmall: "PRINT",
    printTitle: ["Shoot, then print", "on postcards"],
    printButton: "Start shooting",
  },
  frames: { title: (n: number) => `${n} frames`, sub: "You can choose one after you shoot" },
  layouts: {
    title: (n: number) => `${n} layouts`,
    sub: "Choose how many shots and in what shape",
    cuts: (n: number) => (n === 1 ? "1 shot" : `${n} shots`),
  },
  features: {
    title: "What you can do",
    sub: "SnowCut features",
    items: [
      { icon: "▦", title: "6 layouts", body: "Vertical 4, 2×2, vertical 3, 2×3 six-shot, horizontal 4, and 1 big + 3. You take as many shots as the layout has." },
      { icon: "✿", title: "21 frames", body: "Basic · Pattern · Mood · Seasonal. Switch to any frame you like after shooting." },
      { icon: "◐", title: "11 filters", body: "Bright, vivid, film, B&W… Filters apply only to the photos, so frame colors stay the same." },
      { icon: "▶", title: "Session video", body: "A video of your shoot is recorded too. Save it along with your photos." },
      { icon: "⎙", title: "Instant printing", body: "Prints sized for postcard paper (100×148 mm). Vertical strips print two per sheet." },
      { icon: "◎", title: "External cameras", body: "Use your laptop webcam or a USB-connected camera (like the Nikon Zf)." },
    ],
    character: {
      icon: "★",
      title: "Custom characters",
      body: "Upload a favorite character image and we'll remove the background so you can stick it on the frame. Move, resize and rotate freely.",
      soonBody: "Stick character images onto your frame like stickers.",
    },
  },
  how: {
    title: "How it works",
    sub: "3 STEPS",
    step: (n: number) => `STEP ${n}`,
    steps: [
      { title: "Pick a layout", body: "Choose how many shots and in what shape, then set the timer (3 · 5 · 10 sec, 5 sec by default)." },
      { title: "Pose and shoot", body: "Snap! The photo is taken when the countdown ends. Don't like a shot? Retake just that one." },
      { title: "Decorate and save", body: "Pick a frame and filter, then save to your photo library, download the file, or print right away." },
    ],
  },
  faq: {
    title: "Frequently asked questions",
    sub: "FAQ",
    items: [
      { q: "Is SnowCut free?", a: "Yes, it's free. Just open the site in your browser and start taking photo strips, no sign-up or app install required." },
      {
        q: "Are my photos uploaded to a server?",
        a: "No. Shooting, compositing, filters and saving all happen inside your device's browser, and your photos and videos are never sent anywhere.",
      },
      {
        q: "Which devices can I use?",
        a: "Any iPad, iPhone, Android phone, laptop or PC with a camera, using the latest Safari · Chrome · Edge. On iPad, use 'Add to Home Screen' from Safari's Share menu to use it like an app.",
      },
      {
        q: "How many shots can I take?",
        a: "Choose from vertical 4, 2×2 grid, vertical 3, 2×3 six-shot, horizontal 4, or 1 big + 3. You take as many shots (3, 4 or 6) as the layout has.",
      },
      {
        q: "How do I save my photos?",
        a: "Tap Save photo on the result screen to save to your photo library from the share sheet, or download it as a file. The video recorded during the shoot can be saved too.",
      },
      {
        q: "Can I print?",
        a: "Yes. Print on postcard paper (100×148 mm, borderless). The creator uses a Canon SELPHY CP1500; with a regular printer, use glossy postcard-size photo paper. Vertical strips fit two per sheet.",
      },
      {
        q: "My camera won't turn on.",
        a: "Make sure you've allowed camera access in your browser. If a live camera isn't available, each button press opens your device's camera to take one photo at a time.",
      },
    ],
  },
  footer: { tagline: "A 4-cut photo booth that runs in your browser, no install needed. Your photos never leave your device." },
};

export default home;
