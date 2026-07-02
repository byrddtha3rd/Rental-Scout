import { describe, expect, it } from "vitest";
import { calculateProperty } from "../calculations";
import { emptyDraft, type Property } from "../types";
import {
  createBackup,
  parseBackup,
  propertyFingerprint,
  TRANSFER_FORMAT,
} from "./transfer";

function fixture(): Property {
  const draft = {
    ...emptyDraft(),
    nickname: "Brick duplex",
    full_address: "123 Main St",
    city: "Lancaster",
    state: "PA",
    zip_code: "17602",
    asking_price: 245000,
    estimated_monthly_rent: 2600,
  };
  return {
    ...draft,
    ...calculateProperty(draft),
    id: "property-1",
    user_id: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  };
}

describe("Rental Scout data transfer", () => {
  it("round-trips a complete backup into an importable draft", () => {
    const backup = createBackup([fixture()]);
    expect(JSON.parse(backup).format).toBe(TRANSFER_FORMAT);
    const [draft] = parseBackup(backup);
    expect(draft.nickname).toBe("Brick duplex");
    expect(draft.asking_price).toBe(245000);
    expect(draft.estimated_monthly_rent).toBe(2600);
  });

  it("accepts a legacy raw property array", () => {
    const [draft] = parseBackup(JSON.stringify([fixture()]));
    expect(draft.full_address).toBe("123 Main St");
  });

  it("rejects invalid and unrelated files", () => {
    expect(() => parseBackup("not-json")).toThrow("not valid JSON");
    expect(() =>
      parseBackup(JSON.stringify({ format: "another-app", properties: [] })),
    ).toThrow("not a Rental Scout");
  });

  it("normalizes addresses for duplicate detection", () => {
    const first = fixture();
    const second = {
      ...first,
      full_address: "  123   MAIN ST ",
      city: "lancaster",
      state: "pa",
    };
    expect(propertyFingerprint(first)).toBe(propertyFingerprint(second));
  });
});
