import admin from "./admin";
import capture from "./capture";
import catalog from "./catalog";
import common from "./common";
import editor from "./editor";
import home from "./home";
import meta from "./meta";
import privacy from "./privacy";
import result from "./result";
import start from "./start";

/** 한국어 문구. 다른 언어는 이 구조(Messages)를 그대로 따라야 빌드된다. */
const ko = { common, meta, home, privacy, start, capture, result, editor, catalog, admin };

export type Messages = typeof ko;
export default ko;
