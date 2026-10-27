# SnowCut

브라우저(iPad Safari 등)에서 쓰는 네컷 사진 부스 웹앱입니다. 카메라로 여러 장을 연속 촬영하고, 프레임에 합성해 저장·인쇄합니다.

## 페이지

| 주소 | 내용 | 광고 |
|---|---|---|
| `/` | 메인 페이지 (소개 · 사용법 · 자주 묻는 질문) | 구글 애드센스 3곳 |
| `/booth` | 촬영 부스 (홈 화면에 추가하면 바로 여기로 열림) | 없음 |
| `/privacy` | 개인정보처리방침 (애드센스 쿠키 안내) | 없음 |
| `/ads.txt` | 애드센스 판매자 정보 | – |

### 구글 애드센스 설정

빌드할 때 환경 변수로 넣습니다(Vercel은 Project Settings → Environment Variables). 값이 없으면 광고를 그리지 않습니다.

```bash
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-0000000000000000   # 애드센스 게시자 ID
NEXT_PUBLIC_ADSENSE_SLOT_TOP=1111111111              # 디스플레이 광고 단위 data-ad-slot (소개 아래)
NEXT_PUBLIC_ADSENSE_SLOT_MIDDLE=2222222222           # (기능 소개 아래)
NEXT_PUBLIC_ADSENSE_SLOT_BOTTOM=3333333333           # (자주 묻는 질문 아래)
```

- 광고 스크립트는 메인 페이지에만 들어갑니다. 촬영 화면은 일반 링크(전체 새로고침)로 열려서 스크립트가 따라가지 않으므로, 애드센스의 **자동 광고**를 켜도 촬영 화면에는 광고가 나오지 않습니다.
- `/ads.txt`는 `NEXT_PUBLIC_ADSENSE_CLIENT` 값으로 빌드할 때 만들어집니다.

### 커스텀 캐릭터 (누끼 서버)

시작 화면의 **커스텀 캐릭터** 카드에서 이미지를 올리고, 남길 캐릭터 위를 눌러 점을 찍은 뒤 **누끼 따기**를 누르면 배경이 지워진 캐릭터가 프레임 위에 올라갑니다. 끌어서 옮기고, 두 손가락(또는 마우스 휠)·슬라이더로 크기와 회전을 바꾸며, 좌우 반전·흰 테두리(스티커)·맨 앞으로·삭제를 할 수 있습니다. 결과 화면 **옵션** 단계에서 실제 사진 위에 놓고 다시 고칠 수 있고, 저장·인쇄 이미지에 함께 들어갑니다.

배경 제거는 [Background-Remover](https://github.com/Daek-You/Background-Remover)(FastAPI + SAM 2.1)를 따로 띄워 두고 그 API(`POST /background-removal/remove`, `image` + `points=[[x,y],...]` → 투명 PNG)를 부릅니다. 코드는 가져오지 않고 HTTP로만 연동합니다(그 저장소에는 라이선스 파일이 없습니다).

```bash
# 1) 누끼 서버 실행 (NVIDIA GPU 권장, CPU면 한 장에 20~30초). 자세한 방법은 그 저장소의 README.
git clone https://github.com/Daek-You/Background-Remover.git && cd Background-Remover
docker compose -f docker-compose-local.yml up --build     # 기본 포트 5000

# 2-a) 개발: 앱이 서버를 직접 부른다. 서버 config/environments.py의 CORS_ORIGINS에 앱 주소를 넣는다.
NEXT_PUBLIC_BG_REMOVER_URL=http://localhost:5000 npm run dev

# 2-b) 배포(server.mjs): 같은 주소의 /bg-remover/* 를 누끼 서버로 넘긴다. CORS·혼합 콘텐츠 걱정이 없다.
NEXT_PUBLIC_BG_REMOVER_URL=/bg-remover npm run build
BG_REMOVER_URL=http://127.0.0.1:5000 npm run serve
```

- `NEXT_PUBLIC_BG_REMOVER_URL`이 없으면 누끼 버튼이 나오지 않고, 배경이 이미 투명한 PNG를 **배경 그대로 쓰기**로만 올릴 수 있습니다.
- 누끼를 딸 때만 올린 캐릭터 이미지(긴 변 1600px 이하)가 그 서버로 전송됩니다. 촬영한 사진·영상은 여전히 기기 밖으로 나가지 않습니다.

## 실행

Next.js 16(App Router, TypeScript) 앱이고 정적 파일로 내보냅니다(`output: "export"`). iPad Safari에서 **HTTPS 주소**로 열면 라이브 카메라와 카운트다운으로 촬영합니다.

```bash
npm install
npm run dev      # http://localhost:3000 (메인), /booth (촬영)
npm test         # 레이아웃·상태 단위 테스트
npm run build    # out/ 에 정적 파일 생성
npm run serve    # out/을 4173 포트로
```

- 레이아웃 6종: 세로 4컷 · 2×2 그리드 · 세로 3컷 · 2×3 6컷 · 가로 4컷(날짜 오른쪽) · 큰 1컷 + 3컷. 고른 레이아웃의 장수만큼 찍습니다.
- 촬영: 기본 카운트다운 5초, 찍을 때마다 셔터 소리. 처음부터 끝까지 찍는 동안 화면을 영상(Safari는 MP4)으로 녹화합니다.
- 카메라: 연결된 카메라가 둘 이상이면 촬영 화면 오른쪽 위에서 고릅니다. 고른 카메라는 기억합니다.
  - 니콘 Zf: 카메라 메뉴 **네트워크 → USB → USB 스트리밍(UVC/UAC)** 을 켜고(최신 펌웨어 필요) USB-C로 연결하면 웹캠으로 잡힙니다. 그 PC의 브라우저에서 HTTPS 주소(또는 `http://localhost`)로 엽니다.
- 결과 화면(다 찍은 뒤) 꾸미기 4단계: **프레임 → 필터 → 옵션(날짜·다시 찍기) → 저장**
  - 프레임 21종 (베이직 · 패턴 · 감성 · 시즌). 이미지 파일 없이 캔버스로 그립니다. 장수가 같은 레이아웃끼리는 여기서도 바꿀 수 있습니다.
  - 필터 11종 (CSSgram/instagram.css 수치 기반). 사진 칸에만 적용되고 프레임·문구는 그대로입니다.
  - 사진 아래 문구는 넣지 않습니다. 날짜 표시는 켜고 끌 수 있습니다.
- 저장: **사진 저장** → 공유 시트 → **이미지 저장**을 누르면 사진 앱에 들어갑니다. 사진을 길게 눌러도 저장할 수 있습니다.
  **파일로 다운로드**는 파일(iPad는 파일 앱의 다운로드 폴더)로 받습니다. 촬영 영상도 **영상 저장 / 영상 다운로드**로 받을 수 있습니다.
- 인쇄 (캐논 SELPHY CP1500, 엽서 100×148mm 테두리 없음): 저장 단계의 **인쇄** → 인쇄 창에서 프린터 SELPHY CP1500, 용지 엽서, 테두리 없음을 고릅니다.
  - 세로 4컷·세로 3컷·가로 4컷(세로로 세움)은 한 장에 두 개씩 들어가서 수량을 2의 배수로 고르고, 가운데 표시를 따라 자릅니다. 나머지 레이아웃은 한 장에 하나입니다.
  - **인쇄용 이미지**로 받은 JPEG(2362×3496)를 Canon SELPHY Photo Layout 앱으로 인쇄해도 됩니다.
- Safari 공유 → **홈 화면에 추가**를 하면 앱처럼 전체 화면으로 열립니다.
- 실시간 카메라를 쓸 수 없는 환경(HTTP 주소, 권한 거부)에서는 버튼을 누를 때마다 iPad 기본 카메라가 열려 한 장씩 찍습니다.
- 배포: Vercel에서 이 저장소를 가져오면 Next.js로 인식해 설정 없이 배포됩니다. 다른 정적 호스팅(Netlify, GitHub Pages 등)에는 `out/` 폴더를 올립니다. GitHub Pages처럼 하위 경로에 올릴 때는 `NEXT_PUBLIC_BASE_PATH=/저장소이름 npm run build`로 빌드합니다.

```
src/
  app/            layout(글꼴·메타데이터), page(메인), manifest, globals.css
  app/booth/      촬영 부스 페이지 (광고 없음)
  app/privacy/    개인정보처리방침
  app/ads.txt/    ads.txt (빌드할 때 생성)
  components/     Booth(화면 전환) · StartScreen · CaptureScreen · ResultScreen(꾸미기 4단계) · ShotThumb · AdSlot(메인 광고)
  hooks/useCamera.ts   전면 카메라 연결, 백그라운드 복귀 처리, wake lock
  lib/frame.ts         레이아웃 6종 (캔버스 크기·칸 좌표·장수)
  lib/canvas.ts        촬영본 축소, 4컷 합성
  lib/saveImage.ts     공유 시트 / 다운로드 저장
  lib/recorder.ts      촬영 영상 녹화 (거울 모드 캔버스 → MediaRecorder)
  lib/boothState.ts    화면·촬영 상태 리듀서
  lib/frames.ts        프레임 디자인 21종 (캔버스로 그림)
  lib/look/            색 필터 (WebGL2 셰이더, CSS 필터 행렬)
  lib/sound.ts         셔터 소리 (Web Audio)
  lib/print.ts         SELPHY 엽서 인쇄용 시트 (한 장에 1개 또는 2개)
  lib/ads.ts           애드센스 설정 (환경 변수)
server.mjs           out/ 정적 서버 (npm run serve)
```
