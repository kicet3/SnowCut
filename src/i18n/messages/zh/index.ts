import type { Messages } from "../ko";
import capture from "./capture";
import catalog from "./catalog";
import common from "./common";
import editor from "./editor";
import home from "./home";
import meta from "./meta";
import privacy from "./privacy";
import result from "./result";
import start from "./start";

/** 중국어(간체) 문구 */
const zh: Messages = { common, meta, home, privacy, start, capture, result, editor, catalog };

export default zh;
