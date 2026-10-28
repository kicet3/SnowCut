import type { Messages } from "../ko";
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

/** 영어(미국) 문구 */
const en: Messages = { common, meta, home, privacy, start, capture, result, editor, catalog, admin };

export default en;
