/**
 * 색 필터 셰이더 (WebGL2 / GLSL ES 3.00). 오버레이 색을 블렌드한 뒤 CSS 필터 함수들을 합친 행렬을 곱하고,
 * 비네팅·그레인을 더한다 (CSSgram과 같은 순서).
 */

export const VERTEX = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

export const FILTER = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;

uniform sampler2D uSrc;
/** 원본에서 그릴 영역 (xy: 시작, zw: 크기, 0..1). 칸에 보이는 부분만 처리한다. */
uniform vec4 uCrop;

uniform vec4 uOv1;
uniform vec4 uOv2;
uniform int uOv1Mode;
uniform int uOv2Mode;
uniform vec4 uRow0;
uniform vec4 uRow1;
uniform vec4 uRow2;
uniform float uVig;
uniform float uGrain;
uniform float uSeed;

float softLight(float b, float s) {
  float d = b <= 0.25 ? ((16.0 * b - 12.0) * b + 4.0) * b : sqrt(b);
  return s <= 0.5 ? b - (1.0 - 2.0 * s) * b * (1.0 - b) : b + (2.0 * s - 1.0) * (d - b);
}

// W3C Compositing 1 블렌드 모드. 번호는 presets.ts의 BLEND와 같다.
vec3 blendMode(vec3 b, vec3 s, int m) {
  if (m == 1) return b * s;
  if (m == 2) return b + s - b * s;
  if (m == 3) return mix(2.0 * b * s, 1.0 - 2.0 * (1.0 - b) * (1.0 - s), step(0.5, b));
  if (m == 4) return vec3(softLight(b.r, s.r), softLight(b.g, s.g), softLight(b.b, s.b));
  if (m == 5) return min(b, s);
  if (m == 6) return max(b, s);
  return s;
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233)) + uSeed) * 43758.5453);
}

void main() {
  // 텍스처는 위쪽 행이 v=0이므로 화면에 그릴 때 뒤집는다.
  vec2 p = uCrop.xy + vec2(vUv.x, 1.0 - vUv.y) * uCrop.zw;
  vec3 c = texture(uSrc, p).rgb;

  c = mix(c, blendMode(c, uOv1.rgb, uOv1Mode), uOv1.a);
  c = mix(c, blendMode(c, uOv2.rgb, uOv2Mode), uOv2.a);
  c = vec3(dot(uRow0.rgb, c) + uRow0.a, dot(uRow1.rgb, c) + uRow1.a, dot(uRow2.rgb, c) + uRow2.a);
  c = clamp(c, 0.0, 1.0);

  // 비네팅·그레인은 칸(출력) 기준
  float d = distance(vUv, vec2(0.5)) / 0.7071;
  c *= 1.0 - uVig * smoothstep(0.45, 1.0, d);
  c += (hash(gl_FragCoord.xy) - 0.5) * uGrain * 2.0;
  o = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;
