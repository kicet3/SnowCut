import { BLEND, filterDef, filterMatrix, type FilterId, type Overlay } from "./presets";
import { FILTER, VERTEX } from "./shaders";

export interface RenderOptions {
  filter: FilterId;
  /** 그레인 무늬. 같은 값이면 같은 결과가 나온다. */
  seed: number;
  /** 원본에서 그릴 영역 (px). 없으면 전체. 비네팅·그레인은 이 영역 기준이다. */
  crop?: { x: number; y: number; w: number; h: number };
}

// iPad Safari의 셰이더 컴파일러가 주석 속 한글을 거부할 수 있어서 넘기기 전에 주석을 지운다.
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

/**
 * 촬영본에 색 필터를 입힌다. iPad WebKit의 WebGL 컨텍스트 수 제한 때문에 앱 전체에서 하나만 만든다 (getLookRenderer).
 */
export class LookRenderer {
  readonly canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private lost = false;
  private prog!: WebGLProgram;
  private loc = new Map<string, WebGLUniformLocation | null>();
  private srcTex!: WebGLTexture;

  constructor(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext) {
    this.canvas = canvas;
    this.gl = gl;
    this.init();
    canvas.addEventListener("webglcontextlost", (e) => {
      // 기본 동작을 막아야 restored 이벤트가 온다.
      e.preventDefault();
      this.lost = true;
    });
    canvas.addEventListener("webglcontextrestored", () => {
      this.loc.clear();
      try {
        this.init();
        this.lost = false;
      } catch {
        this.lost = true;
      }
    });
  }

  get ok(): boolean {
    return !this.lost && !this.gl.isContextLost();
  }

  private init(): void {
    const gl = this.gl;
    const make = (type: number, text: string) => {
      const s = gl.createShader(type);
      if (!s) throw new Error("shader");
      gl.shaderSource(s, stripComments(text));
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS) && !gl.isContextLost()) {
        throw new Error(gl.getShaderInfoLog(s) ?? "shader compile");
      }
      return s;
    };
    const prog = gl.createProgram();
    if (!prog) throw new Error("program");
    gl.attachShader(prog, make(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(prog, make(gl.FRAGMENT_SHADER, FILTER));
    gl.bindAttribLocation(prog, 0, "aPos");
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS) && !gl.isContextLost()) {
      throw new Error(gl.getProgramInfoLog(prog) ?? "program link");
    }
    this.prog = prog;

    // 화면 전체를 덮는 삼각형 하나
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const t = gl.createTexture();
    if (!t) throw new Error("texture");
    gl.bindTexture(gl.TEXTURE_2D, t);
    // 칸이 원본보다 작을 때 계단 현상이 없도록 밉맵으로 줄인다.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.srcTex = t;
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
  }

  private u(name: string): WebGLUniformLocation | null {
    if (!this.loc.has(name)) this.loc.set(name, this.gl.getUniformLocation(this.prog, name));
    return this.loc.get(name) ?? null;
  }

  /**
   * src를 필터를 입혀 canvas에 outW×outH로 그린다. 그린 내용은 같은 작업(task) 안에서만 읽을 수 있다
   * (preserveDrawingBuffer를 끈 대신 메모리를 아낀다). 실패하면 false.
   */
  render(src: HTMLCanvasElement, outW: number, outH: number, o: RenderOptions): boolean {
    if (!this.ok) return false;
    const srcW = src.width;
    const srcH = src.height;
    if (!srcW || !srcH || !outW || !outH) return false;
    const gl = this.gl;
    if (this.canvas.width !== outW || this.canvas.height !== outH) {
      this.canvas.width = outW;
      this.canvas.height = outH;
    }
    const filter = filterDef(o.filter);

    gl.useProgram(this.prog);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.srcTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.uniform1i(this.u("uSrc"), 0);

    const crop = o.crop ?? { x: 0, y: 0, w: srcW, h: srcH };
    gl.uniform4f(this.u("uCrop"), crop.x / srcW, crop.y / srcH, crop.w / srcW, crop.h / srcH);
    const setOverlay = (name: string, mode: string, ov?: Overlay) => {
      if (ov) gl.uniform4f(this.u(name), ov.color[0] / 255, ov.color[1] / 255, ov.color[2] / 255, ov.alpha);
      else gl.uniform4f(this.u(name), 0, 0, 0, 0);
      gl.uniform1i(this.u(mode), ov ? BLEND[ov.mode] : 0);
    };
    setOverlay("uOv1", "uOv1Mode", filter.overlays[0]);
    setOverlay("uOv2", "uOv2Mode", filter.overlays[1]);
    const m = filterMatrix(filter.ops);
    gl.uniform4f(this.u("uRow0"), m[0], m[1], m[2], m[3]);
    gl.uniform4f(this.u("uRow1"), m[4], m[5], m[6], m[7]);
    gl.uniform4f(this.u("uRow2"), m[8], m[9], m[10], m[11]);
    gl.uniform1f(this.u("uVig"), filter.vignette ?? 0);
    gl.uniform1f(this.u("uGrain"), filter.grain ?? 0);
    gl.uniform1f(this.u("uSeed"), o.seed % 1000);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, outW, outH);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return !gl.isContextLost();
  }
}

let shared: LookRenderer | null | undefined;

/** 앱 전체에서 쓰는 렌더러. WebGL2가 없거나 만들 수 없으면 null (필터 없이 원본 사용). */
export function getLookRenderer(): LookRenderer | null {
  if (shared !== undefined) return shared;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      premultipliedAlpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
    });
    shared = gl ? new LookRenderer(canvas, gl) : null;
  } catch (err) {
    console.warn("필터 렌더러를 만들지 못했어요", err);
    shared = null;
  }
  return shared;
}
