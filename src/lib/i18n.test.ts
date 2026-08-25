import { describe, expect, it } from "vitest";
import { STRINGS, t, type StringKey } from "./i18n";

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
});
