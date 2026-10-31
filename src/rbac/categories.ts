/**
 * Vendor RBAC — business categories & permission management.
 *
 * The backend stores the authoritative `categories[]` on each vendor and
 * re-checks category membership + ownership inside every service. This
 * module maps those roles into the mobile UX: what tabs, dashboards and
 * management screens a vendor may see. The FIRST source of permissions is
 * always the user object returned by the backend (`GET /auth/me`).
 *
 * Frontend RBAC is UX, not security: no sensitive call is hidden merely by
 * hiding a button — ownership stays server-enforced.
 */

import type { StyleExpertCategory, VendorCategory, VendorStatus } from "../lib/types";

export const VENDOR_CATEGORY_IDS = {
  toLet: "TO_LET",
  hotelVilla: "HOTEL_VILLA",
  style: "STYLE",
} as const;

/** Category metadata (labels, icon names, blurbs). */
export const CATEGORY_META: Record<
  VendorCategory,
  { label: string; badge: string; icon: string; description: string }
> = {
  PROPERTY: {
    label: "Properties (Sale)",
    badge: "Sale Listings",
    icon: "business-outline",
    description: "Sale listings are managed from the web portal.",
  },
  TO_LET: {
    label: "Homes & Apartments",
    badge: "Rental / To-Let",
    icon: "home-outline",
    description: "List residential rentals and receive tenant enquiries.",
  },
  HOTEL_VILLA: {
    label: "Hotels & Villas",
    badge: "Stays & Hospitality",
    icon: "bed-outline",
    description: "Hourly stays with rooms, slot pricing and bookings.",
  },
  STYLE: {
    label: "Home Experts",
    badge: "Services",
    icon: "sparkles-outline",
    description: "Interior, furniture & renovation services for homeowners.",
  },
};

/** Home-Experts vendor subcategory metadata (`FURNITURE | INTERIOR_DESIGNER | RENOVATION`). */
export const STYLE_SUBCATEGORY_META: Record<
  StyleExpertCategory,
  { label: string; icon: string; services: string[] }
> = {
  FURNITURE: {
    label: "Furniture Expert",
    icon: "cube-outline",
    services: [
      "Custom Furniture",
      "Modular Furniture",
      "Wooden Furniture",
      "Bedroom Furniture",
      "Living Room Furniture",
      "Office Furniture",
      "Kitchen Furniture",
      "Wardrobes",
      "Tables & Chairs",
      "Sofas & Recliners",
      "Dining Sets",
    ],
  },
  INTERIOR_DESIGNER: {
    label: "Interior Designer",
    icon: "color-palette-outline",
    services: [
      "Residential Interior",
      "Commercial Interior",
      "Modular Kitchen",
      "Bedroom Design",
      "Living Room Design",
      "Office Interior",
      "Full Home Interior",
      "Space Planning",
      "3D Visualization & Design",
      "Design Consultation",
    ],
  },
  RENOVATION: {
    label: "Renovation Expert",
    icon: "hammer-outline",
    services: [
      "Full Home Renovation",
      "Kitchen Renovation",
      "Bathroom Renovation",
      "Office Renovation",
      "Flooring & Tiling",
      "Painting & Wall Decor",
      "Electrical Work",
      "Plumbing Services",
      "Civil Construction Work",
      "Waterproofing & Repairs",
    ],
  },
};

export function vendorName(
  user?: { fullName?: string; firstName?: string; lastName?: string; companyName?: string } | null,
): string {
  if (!user) return "Vendor";
  return (
    user.fullName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.companyName ||
    "Vendor"
  );
}

/** Does the vendor own this business category? */
export function hasCategory(user: { categories?: string[] } | null | undefined, category: VendorCategory): boolean {
  return Array.isArray(user?.categories) && user.categories.includes(category);
}

/** All authorized categories, in priority order (Property-sale excluded from the app UX). */
export function authorizedCategories(user: { categories?: string[] } | null | undefined): VendorCategory[] {
  const order: VendorCategory[] = ["HOTEL_VILLA", "TO_LET", "STYLE"];
  return order.filter((c) => hasCategory(user, c));
}

export function canManage(user: { categories?: string[] } | null | undefined): boolean {
  return authorizedCategories(user).length > 0;
}

/** Vendor account approval status semantics. */
export function statusOf(status?: VendorStatus): "approved" | "pending" | "suspended" | "rejected" | "unknown" {
  switch (status) {
    case "Active":
      return "approved";
    case "Pending":
      return "pending";
    case "Suspended":
      return "suspended";
    case "Rejected":
      return "rejected";
    default:
      return "unknown";
  }
}

/** Listing approval status → pill colors + labels. */
export function listingStatusMeta(status?: string): { label: string; color: string; bg: string } {
  switch (status) {
    case "PUBLISHED":
    case "Published":
    case "Active":
      return { label: "Published", color: "#0E9F6E", bg: "rgba(14,159,110,0.12)" };
    case "PENDING_APPROVAL":
      return { label: "Pending approval", color: "#D97706", bg: "rgba(217,119,6,0.12)" };
    case "DRAFT":
    case "Draft":
      return { label: "Draft", color: "#6C757D", bg: "rgba(108,117,125,0.14)" };
    case "REJECTED":
      return { label: "Rejected", color: "#DC2626", bg: "rgba(220,38,38,0.12)" };
    case "Inactive":
      return { label: "Inactive", color: "#2563EB", bg: "rgba(37,99,235,0.10)" };
    case "Maintenance":
      return { label: "Maintenance", color: "#D97706", bg: "rgba(217,119,6,0.12)" };
    default:
      return { label: status ?? "Unknown", color: "#6C757D", bg: "rgba(108,117,125,0.12)" };
  }
}

export function bookingStatusMeta(status?: string): { label: string; color: string; bg: string } {
  switch (status) {
    case "Confirmed":
      return { label: "Confirmed", color: "#0E9F6E", bg: "rgba(14,159,110,0.12)" };
    case "Completed":
      return { label: "Completed", color: "#2563EB", bg: "rgba(37,99,235,0.10)" };
    case "Pending":
      return { label: "Pending", color: "#D97706", bg: "rgba(217,119,6,0.12)" };
    case "Cancelled":
      return { label: "Cancelled", color: "#DC2626", bg: "rgba(220,38,38,0.12)" };
    case "Rejected":
      return { label: "Rejected", color: "#DC2626", bg: "rgba(220,38,38,0.12)" };
    default:
      return { label: status ?? "Unknown", color: "#6C757D", bg: "rgba(108,117,125,0.12)" };
  }
}

export function leadStatusMeta(status?: string): { label: string; color: string; bg: string } {
  switch (status) {
    case "Pending":
      return { label: "New", color: "#D97706", bg: "rgba(217,119,6,0.12)" };
    case "Contacted":
      return { label: "Contacted", color: "#2563EB", bg: "rgba(37,99,235,0.10)" };
    case "Accepted":
      return { label: "Accepted", color: "#0E9F6E", bg: "rgba(14,159,110,0.12)" };
    case "Closed":
      return { label: "Closed", color: "#6C757D", bg: "rgba(108,117,125,0.12)" };
    default:
      return { label: status ?? "Unknown", color: "#6C757D", bg: "rgba(108,117,125,0.12)" };
  }
}
