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

/** 일본어 문구 */
const ja: Messages = { common, meta, home, privacy, start, capture, result, editor, catalog, admin };

export default ja;
