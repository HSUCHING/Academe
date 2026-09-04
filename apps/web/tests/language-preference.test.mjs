import { beforeEach, describe, expect, mock, test } from "bun:test";

const stored = new Map();
globalThis.localStorage = {
  getItem: (key) => stored.get(key) ?? null,
  setItem: (key, value) => stored.set(key, String(value)),
  removeItem: (key) => stored.delete(key),
};

const languageChanges = [];
const fakeI18n = {
  language: "en",
  use() {
    return this;
  },
  init() {
    return this;
  },
  hasResourceBundle() {
    return true;
  },
  addResourceBundle() {},
  async changeLanguage(language) {
    languageChanges.push(language);
    this.language = language;
  },
};

mock.module("i18next", () => ({ default: fakeI18n }));
mock.module("react-i18next", () => ({ initReactI18next: {} }));
mock.module("i18next-browser-languagedetector", () => ({ default: class LanguageDetector {} }));
mock.module("../lib/format.ts", () => ({ loadDateLocale: async () => {} }));

const { changeLanguage } = await import("../lib/i18n.ts");

beforeEach(() => {
  stored.clear();
  languageChanges.length = 0;
});

describe("language preference persistence", () => {
  test("remembers an explicit UI language choice across reloads", async () => {
    await changeLanguage("zh");

    expect(localStorage.getItem("i18nextLng_userPicked")).toBe("1");
    expect(languageChanges).toEqual(["zh"]);
  });

  test("does not mark an organization default as a user choice", async () => {
    await changeLanguage("en", { userInitiated: false });

    expect(localStorage.getItem("i18nextLng_userPicked")).toBeNull();
    expect(languageChanges).toEqual(["en"]);
  });
});
