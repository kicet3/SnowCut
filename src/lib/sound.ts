/**
 * 셔터 소리. 파일 없이 Web Audio로 만든다 (짧은 잡음 두 번 = 기계식 셔터 "찰칵").
 * iPad Safari는 사용자가 누른 순간에만 소리를 켤 수 있어서, 촬영 버튼을 누를 때 unlockSound()를 부른다.
 */

type AudioCtor = typeof AudioContext;

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;

/** iPad 무음 모드에서도 셔터 소리가 나도록 오디오 세션을 재생용으로 둔다 (Safari 16.4+). */
function playbackSession(): void {
  try {
    const s = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
    if (s && s.type !== "playback") s.type = "playback";
  } catch {}
}

function audio(): AudioContext | null {
  if (ctx) return ctx;
  playbackSession();
  const Ctor: AudioCtor | undefined =
    typeof window === "undefined"
      ? undefined
      : (window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext);
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
  } catch {
    ctx = null;
  }
  return ctx;
}

/** 사용자 조작(클릭) 안에서 불러야 iOS에서 소리가 난다. */
export function unlockSound(): void {
  playbackSession();
  const a = audio();
  if (a && a.state !== "running") void a.resume().catch(() => {});
}

function noiseBuffer(a: AudioContext): AudioBuffer {
  if (noise && noise.sampleRate === a.sampleRate) return noise;
  const len = Math.round(a.sampleRate * 0.12);
  noise = a.createBuffer(1, len, a.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return noise;
}

function click(a: AudioContext, at: number, gain: number, freq: number, length: number): void {
  const src = a.createBufferSource();
  src.buffer = noiseBuffer(a);
  const band = a.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = freq;
  band.Q.value = 0.8;
  const g = a.createGain();
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(gain, at + 0.002);
  g.gain.exponentialRampToValueAtTime(0.001, at + length);
  src.connect(band).connect(g).connect(a.destination);
  src.start(at);
  src.stop(at + length + 0.02);
}

/** 찰칵 */
export function playShutter(): void {
  const a = audio();
  if (!a) return;
  const fire = () => {
    const t = a.currentTime + 0.005;
    click(a, t, 0.9, 3200, 0.05);
    click(a, t + 0.075, 0.6, 1800, 0.07);
  };
  if (a.state === "running") {
    fire();
    return;
  }
  // 카메라 앱을 다녀오면 멈춰(interrupted) 있을 수 있어서 다시 켜 본다.
  a.resume()
    .then(() => {
      if (a.state === "running") fire();
    })
    .catch(() => {});
}
