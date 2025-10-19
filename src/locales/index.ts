import { en } from './en';
import { zh_CN } from './zh_CN';
import { zh_TW } from './zh_TW';
import { ja } from './ja';

export const translations = {
  en,
  zh_CN,
  zh_TW,
  ja
};

export type Language = keyof typeof translations;
export type TranslationKeys = typeof en;