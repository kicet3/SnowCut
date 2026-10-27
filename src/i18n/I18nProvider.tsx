"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_LOCALE, type Locale } from "./config";
import { getMessages, type Messages } from "./messages";

interface I18n {
  locale: Locale;
  /** 현재 언어의 문구 */
  m: Messages;
}

const I18nContext = createContext<I18n>({ locale: DEFAULT_LOCALE, m: getMessages(DEFAULT_LOCALE) });

// 문구에 함수(개수 등 끼워 넣기)가 있어서 서버에서 넘겨받지 않고, 언어 코드만 받아 여기서 고른다.
export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <I18nContext.Provider value={{ locale, m: getMessages(locale) }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  return useContext(I18nContext);
}
