/** Unit tests for the Pill formatting helpers (money / dates / initials). */
import {
  formatMoney,
  formatDate,
  formatDateTime,
  initialsOf,
  normalizeId,
  todayISO,
} from "../Pill";

describe("formatMoney", () => {
  it("formats plain INR amounts with Indian digit grouping", () => {
    expect(formatMoney(1500)).toBe("₹1,500");
  });

  it("lakh / crore shorthand for large amounts", () => {
    expect(formatMoney(125000)).toBe("₹1.3 L");
    expect(formatMoney(15000000)).toBe("₹1.5 Cr");
  });

  it("falls back to ₹0 for non-numeric input", () => {
    expect(formatMoney(undefined)).toBe("₹0");
    expect(formatMoney("abc")).toBe("₹0");
  });

  it("parses numeric strings", () => {
    expect(formatMoney("2500")).toBe("₹2,500");
  });
});

describe("formatDate / formatDateTime", () => {
  it("renders a date string in en-IN style", () => {
    expect(formatDate("2026-03-14T10:30:00Z")).toMatch(/2026/);
  });

  it("renders datetime with a time component", () => {
    const out = formatDateTime("2026-03-14T10:30:00Z");
    expect(out).toMatch(/2026/);
    expect(out).toMatch(/:|AM|PM/i);
  });

  it("passes unparseable values through unchanged", () => {
    expect(formatDate("not-a-date")).toBe("not-a-date");
  });

  it("returns empty string for missing values (not a crash)", () => {
    expect(formatDate(undefined)).toBe("");
    expect(formatDateTime(undefined)).toBe("");
  });
});

describe("todayISO", () => {
  it("produces a YYYY-MM-DD string", () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("equals today's local date", () => {
    const d = new Date();
    const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
    expect(todayISO()).toBe(expected);
  });
});

describe("normalizeId", () => {
  it("extracts _id from nested object references (backend populated refs)", () => {
    expect(normalizeId({ _id: "abc123" })).toBe("abc123");
  });

  it("stringifies plain scalar ids", () => {
    expect(normalizeId("xyz")).toBe("xyz");
    expect(normalizeId(42)).toBe("42");
  });

  it("returns undefined for missing values", () => {
    expect(normalizeId(undefined)).toBeUndefined();
    expect(normalizeId(null)).toBeUndefined();
  });
});

describe("initialsOf", () => {
  it("takes the first letters of the first two words", () => {
    expect(initialsOf("King Properties")).toBe("KP");
    expect(initialsOf("Single")).toBe("S");
  });

  it("falls back to V for vendor avatars without a name", () => {
    expect(initialsOf("")).toBe("V");
    expect(initialsOf(undefined)).toBe("V");
  });
});
