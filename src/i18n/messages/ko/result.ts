/** 꾸미기 · 저장 · 인쇄 화면 문구 */
const result = {
  steps: { frame: "프레임", filter: "필터", text: "옵션", save: "저장" },
  photoAlt: "완성된 네컷 사진",
  rendering: "사진을 만드는 중…",
  renderFailed: "사진을 만들지 못했어요. 설정을 바꾸면 다시 시도합니다.",
  decorate: "꾸미기",
  stepsLabel: "단계",
  layoutsLabel: "레이아웃",
  frameCategoriesLabel: "프레임 종류",
  filterNote: "필터는 사진 칸에만 적용돼요.",
  options: {
    showDate: "날짜 표시",
    characters: "커스텀 캐릭터",
    characterCount: (n: number) => `${n}개`,
    noCharacters: "없음",
    editCharacters: "캐릭터 위치 · 크기 바꾸기",
    addCharacters: "캐릭터 추가하기",
    retake: "다시 찍기",
    retakeShot: (n: number) => `${n}번 사진 다시 찍기`,
  },
  savePhoto: "사진 저장",
  downloadPhoto: "파일로 다운로드",
  print: {
    title: "프린터 인쇄 (캐논 SELPHY CP1500)",
    countLabel: "인쇄 수량",
    decrease: "수량 줄이기",
    increase: "수량 늘리기",
    count: (n: number) => `${n}개`,
    pages: (n: number) => `(용지 ${n}장)`,
    print: "인쇄",
    printFile: "인쇄용 이미지",
    // 인쇄 안내: "인쇄 창에서 프린터 <b>SELPHY CP1500</b>, 용지 <b>엽서(100×148mm)</b>, <b>테두리 없음</b>을 고르세요."
    guide: {
      beforePrinter: "인쇄 창에서 프린터 ",
      printer: "SELPHY CP1500",
      beforePaper: ", 용지 ",
      paper: "엽서(100×148mm)",
      beforeBorderless: ", ",
      borderless: "테두리 없음",
      after: "을 고르세요.",
    },
    twoPerSheet: " 한 장에 두 개씩 나오니 가운데 표시를 따라 잘라 주세요.",
  },
  video: {
    title: "촬영 영상",
    save: "영상 저장",
    download: "영상 다운로드",
  },
  // 저장 안내: "iPad에서는 사진 저장 → 공유 시트의 <b>이미지 저장</b>을 고르면 사진 앱에 들어가요. ..."
  iosNote: {
    before: "iPad에서는 사진 저장 → 공유 시트의 ",
    action: "이미지 저장",
    after: "을 고르면 사진 앱에 들어가요. 사진을 길게 눌러도 저장돼요.",
  },
  prev: "이전",
  next: "다음",
  newShoot: "새로 찍기",
  /** 저장 · 다운로드 결과 (src/lib/saveImage.ts) */
  save: {
    shared: {
      image: "공유 시트에서 이미지 저장을 골랐다면 사진 앱에 저장됐어요.",
      video: "공유 시트에서 동영상 저장을 골랐다면 사진 앱에 저장됐어요.",
    },
    shareFailed: {
      image: "공유 시트를 열지 못했어요. 다시 누르거나 사진을 길게 눌러 사진 앱에 저장할 수 있어요.",
      video: "공유 시트를 열지 못했어요. 다시 누르거나 파일로 다운로드를 눌러 주세요.",
    },
    longPress: "사진을 길게 눌러 사진 앱에 저장할 수 있어요.",
    downloadedIOS: "다운로드했어요. 파일 앱의 다운로드 폴더에서 볼 수 있어요.",
    downloadStarted: "다운로드를 시작했어요.",
  },
};

export default result;
