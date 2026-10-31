/** Unit tests for the vendor RBAC layer — the security-relevant pure logic. */
import {
  CATEGORY_META,
  STYLE_SUBCATEGORY_META,
  authorizedCategories,
  hasCategory,
  statusOf,
  vendorName,
  bookingStatusMeta,
  listingStatusMeta,
} from "../categories";
import type { VendorCategory } from "../../lib/types";

const ALL: VendorCategory[] = ["PROPERTY", "TO_LET", "HOTEL_VILLA", "STYLE"];
const SHOWABLE: VendorCategory[] = ["HOTEL_VILLA", "TO_LET", "STYLE"];

describe("CATEGORY_META", () => {
  it("defines metadata for every backend category, with PROPERTY excluded from the UX", () => {
    for (const key of ALL) {
      expect(CATEGORY_META[key]).toBeDefined();
    }
  });

  it("the app-wide authorized set only ever yields the three showable categories", () => {
    const authorized = authorizedCategories({ categories: ALL });
    expect(authorized).toEqual(SHOWABLE);
    expect(authorized).not.toContain("PROPERTY");
  });
});

describe("hasCategory (user-object based)", () => {
  it("returns true for an authorized category", () => {
    expect(hasCategory({ categories: ["TO_LET", "STYLE"] }, "TO_LET")).toBe(true);
    expect(hasCategory({ categories: ["HOTEL_VILLA"] }, "HOTEL_VILLA")).toBe(true);
    expect(hasCategory({ categories: ["STYLE"] }, "STYLE")).toBe(true);
  });

  it("returns false when the category is missing", () => {
    expect(hasCategory({ categories: ["TO_LET"] }, "HOTEL_VILLA")).toBe(false);
  });

  it("returns false for fresh vendors whose categories are empty (onboarding gate)", () => {
    expect(hasCategory({ categories: [] }, "TO_LET")).toBe(false);
  });

  it("returns false when there is no user / no categories array", () => {
    expect(hasCategory(null, "TO_LET")).toBe(false);
    expect(hasCategory(undefined, "TO_LET")).toBe(false);
    expect(hasCategory({}, "TO_LET")).toBe(false);
  });
});

describe("authorizedCategories", () => {
  it("strips PROPERTY from the granted list", () => {
    expect(authorizedCategories({ categories: ALL })).toEqual(["HOTEL_VILLA", "TO_LET", "STYLE"]);
  });

  it("returns [] for fresh vendors", () => {
    expect(authorizedCategories({ categories: [] })).toEqual([]);
    expect(authorizedCategories(undefined)).toEqual([]);
  });
});

describe("statusOf", () => {
  it("maps backend vendor status strings onto UX gates", () => {
    expect(statusOf("Active")).toBe("approved");
    expect(statusOf("Pending")).toBe("pending");
    expect(statusOf("Suspended")).toBe("suspended");
    expect(statusOf("Rejected")).toBe("rejected");
  });

  it("marks unknown / missing statuses", () => {
    expect(statusOf(undefined)).toBe("unknown");
    expect(statusOf("SomethingElse" as never)).toBe("unknown");
  });
});

describe("vendorName", () => {
  it("prefers fullName over first/last name and company", () => {
    expect(vendorName({ fullName: "Aman Verma", firstName: "Aman", companyName: "KOP" })).toBe("Aman Verma");
  });

  it("falls back to first + last name, then company name", () => {
    expect(vendorName({ firstName: "Aman", lastName: "Verma" })).toBe("Aman Verma");
    expect(vendorName({ companyName: "Sunset Villa LLP" })).toBe("Sunset Villa LLP");
  });

  it("handles missing user", () => {
    expect(vendorName(null)).toBe("Vendor");
    expect(vendorName({})).toBe("Vendor");
  });
});

describe("booking / listing status metadata", () => {
  it("known booking statuses resolve to usable meta (label + colors)", () => {
    for (const s of ["Pending", "Confirmed", "Booked", "Completed", "Cancelled", "Rejected"]) {
      const meta = bookingStatusMeta(s);
      expect(meta.label).toBeTruthy();
      expect(meta.color).toBeTruthy();
      expect(meta.bg).toBeTruthy();
    }
  });

  it("unknown booking status falls back to a safe default", () => {
    expect(bookingStatusMeta("Mystery").label).toBeTruthy();
  });

  it("known listing statuses resolve to usable meta", () => {
    for (const s of ["DRAFT", "PENDING_APPROVAL", "PUBLISHED", "REJECTED", "Active", "Inactive"]) {
      const meta = listingStatusMeta(s);
      expect(meta.label).toBeTruthy();
    }
  });

  it("unknown listing status falls back to a safe default", () => {
    expect(listingStatusMeta("Mystery").label).toBeTruthy();
  });
});

describe("STYLE_SUBCATEGORY_META", () => {
  it("covers the furniture / interior / renovation style families", () => {
    expect(Object.keys(STYLE_SUBCATEGORY_META)).toEqual(
      expect.arrayContaining(["FURNITURE", "INTERIOR_DESIGNER", "RENOVATION"]),
    );
  });
});
