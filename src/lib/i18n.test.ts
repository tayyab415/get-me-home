import { describe, expect, it } from "vitest";
import { LEDGER_NOTE_KEYS, STRINGS, formatTravel, t, type StringKey } from "./i18n";

describe("bilingual copy", () => {
  it("keeps the same keys in English and Hindi", () => {
    const enKeys = Object.keys(STRINGS.en).sort();
    const hiKeys = Object.keys(STRINGS.hi).sort();
    expect(hiKeys).toEqual(enKeys);
  });

  it("switches recovery, empty, error, and story strings with the language toggle", () => {
    const keys: StringKey[] = [
      "recoveryTitle",
      "recoveryBody",
      "emptyDest",
      "noneCatchable",
      "noneBody",
      "errorTitle",
      "errorBody",
      "storyCaption",
      "playingStory",
      "skipMotion",
      "mapsEnhance",
      "mapAria",
    ];
    for (const key of keys) {
      expect(t("en", key).length).toBeGreaterThan(4);
      expect(t("hi", key).length).toBeGreaterThan(4);
      expect(t("hi", key)).not.toBe(t("en", key));
    }
  });

  it("formats travel time in both languages", () => {
    expect(formatTravel("en", 18)).toBe("18 min");
    expect(formatTravel("hi", 18)).toBe("18 मिनट");
    expect(formatTravel("en", 75)).toBe("1 h 15 min");
    expect(formatTravel("hi", 75)).toBe("1 घंटे 15 मिनट");
  });

  it("maps payment-machine ledger notes to bilingual keys", () => {
    expect(Object.keys(LEDGER_NOTE_KEYS)).toHaveLength(4);
    for (const key of Object.values(LEDGER_NOTE_KEYS)) {
      expect(t("hi", key)).not.toBe(t("en", key));
    }
  });
});
