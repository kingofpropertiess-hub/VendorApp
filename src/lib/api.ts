/**
 * Vendor App API services — one function per real backend endpoint.
 *
 * Backend is the single source of truth; every path below exists on the
 * deployed Express API (see docs in report). Error handling is centralized
 * in lib/client.ts; envelopes are normalized per response-shape quirks of
 * each controller (the backend mixes {error}, {message} and {success}).
 */

import { API_BASE_URL } from "./config";
import { AUTH_TIMEOUT_MS, REQUEST_TIMEOUT_MS } from "./config";
import { client, ApiError } from "./client";
import type {
  AnalyticsOverview,
  Lead,
  LeadStatus,
  Property,
  PropertySlot,
  Room,
  RoomType,
  Stay,
  StyleExpert,
  VendorBooking,
  VendorCategory,
  VendorNotification,
  VendorSettings,
  VendorUser,
  AuthResponse,
} from "./types";

const AUTH_TIMEOUT = AUTH_TIMEOUT_MS;

/* ───────────────────────────── helpers ───────────────────────────── */

function unwrap<T>(res: any, keys: string[]): T {
  if (Array.isArray(res)) return res as T;
  for (const k of keys) {
    if (res && res[k] !== undefined) return res[k] as T;
  }
  return (res ?? {}) as T;
}

/** Build a multipart FormData with text fields + image files. */
export function buildMultipart(
  fields: Record<string, unknown>,
  imageField: string,
  images: { uri: string; fileName?: string }[],
): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue;
    if (value === "" && key !== "description") continue;
    fd.append(key, String(value));
  }
  images.forEach((img, i) => {
    if (!img.uri || img.uri.startsWith("http") || img.uri.startsWith("data:")) {
      // Existing (already uploaded) URLs are sent as plain field values.
      fd.append(`${imageField}`, String(img.uri));
      return;
    }
    const name = img.fileName || `${imageField}_${Date.now()}_${i}.jpg`;
    fd.append(imageField, { uri: img.uri, name, type: "image/jpeg" } as any);
  });
  return fd;
}

/* ───────────────────────────── AUTH ───────────────────────────── */

export const AuthApi = {
  registerVendor(body: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    phone?: string;
    companyName?: string;
  }): Promise<AuthResponse> {
    return client.post("/auth/register/vendor", body, { timeoutMs: AUTH_TIMEOUT, skipGuard: true });
  },

  loginVendor(body: { email: string; password: string }): Promise<AuthResponse> {
    return client.post("/auth/login/vendor", body, { timeoutMs: AUTH_TIMEOUT, skipGuard: true });
  },

  /** Google sign-in for existing vendor accounts only. */
  googleVendorSession(body: {
    idToken?: string;
    email: string;
    firstName?: string;
    lastName?: string;
    uid?: string;
  }): Promise<AuthResponse> {
    return client.post(
      "/auth/google",
      { ...body, loginType: "vendor" },
      { timeoutMs: AUTH_TIMEOUT, skipGuard: true },
    );
  },

  me(): Promise<{ success: boolean; user: VendorUser }> {
    return client.get("/auth/me", { skipGuard: true });
  },

  logout(): Promise<{ success: boolean }> {
    return client.post("/auth/logout", {});
  },
};

/* ─────────────────────────── VENDOR profile ─────────────────────────── */

export interface VendorProfile extends VendorUser {}

export const VendorApi = {
  async getProfile(): Promise<{ profile: VendorProfile; user: VendorUser }> {
    const res = await client.get<any>("/vendor/profile");
    const profile = unwrap<any>(res, ["vendor", "profile", "user"]);
    return { profile, user: res?.user ?? profile };
  },

  updateProfile(
    fields: Partial<{
      fullName: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      companyName: string;
    }>,
    avatar?: { uri: string } | null,
  ): Promise<{ profile: VendorProfile; user: VendorUser }> {
    if (avatar?.uri) {
      const fd = new FormData();
      for (const [k, v] of Object.entries(fields)) {
        if (v !== undefined && v !== null) fd.append(k, String(v));
      }
      const name = avatar.uri.split("/").pop() || "avatar.jpg";
      fd.append("profileImage", { uri: avatar.uri, name, type: "image/jpeg" } as any);
      return client.put("/vendor/profile", fd, { timeoutMs: REQUEST_TIMEOUT_MS * 2 });
    }
    return client.put("/vendor/profile", fields);
  },

  async getCategories(): Promise<{ categories: VendorCategory[]; status: string }> {
    const res = await client.get<any>("/vendor/categories");
    return { categories: res?.categories ?? [], status: res?.status ?? "Active" };
  },

  updateCategories(categories: VendorCategory[]): Promise<{ categories: VendorCategory[]; user: VendorUser }> {
    return client.post("/vendor/categories", { categories });
  },

  async getDashboard(): Promise<any> {
    const res = await client.get<any>("/vendor/dashboard");
    return unwrap<any>(res, ["data", "stats"]);
  },
};

/* ─────────────────────────── Vendor settings ─────────────────────────── */

export const VendorSettingsApi = {
  get(): Promise<VendorSettings> {
    return client.get("/vendor/settings").then((res) => unwrap<VendorSettings>(res, ["settings"]));
  },
  update(fields: Partial<VendorSettings>): Promise<VendorSettings> {
    return client.put("/vendor/settings", fields).then((res) => unwrap<VendorSettings>(res, ["settings"]));
  },
};

/* ─────────────────────────── Notifications ─────────────────────────── */

export const NotificationApi = {
  list(): Promise<{ count: number; unreadCount: number; notifications: VendorNotification[] }> {
    return client.get("/notifications").then((res) => ({
      count: res?.count ?? 0,
      unreadCount: res?.unreadCount ?? 0,
      notifications: res?.notifications ?? [],
    }));
  },
  readAll(): Promise<{ success: boolean }> {
    return client.patch("/notifications/read-all", {});
  },
  readOne(id: string): Promise<{ success: boolean }> {
    return client.patch(`/notifications/${id}/read`, {});
  },
  remove(id: string): Promise<{ success: boolean }> {
    return client.del(`/notifications/${id}`);
  },
};

/* ───────────────────────────── Analytics ───────────────────────────── */

export const AnalyticsApi = {
  overview(): Promise<AnalyticsOverview> {
    return client.get("/analytics/overview").then((res) => res?.analytics ?? res);
  },
  earnings(): Promise<{ totalEarnings: number; currency: string; paidTransactionsCount: number }> {
    return client.get("/analytics/earnings").then((res) => res?.analytics ?? res);
  },
  bookings(): Promise<any> {
    return client.get("/analytics/bookings").then((res) => res?.analytics ?? res);
  },
  leads(): Promise<any> {
    return client.get("/analytics/leads").then((res) => res?.analytics ?? res);
  },
};

/* ─────────────────────── Properties (To-Let rentals) ─────────────────────── */

export interface PropertyQuery {
  search?: string;
  city?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export const PropertyApi = {
  /** Vendor-scoped listing fetch (`?vendorOnly=true`). */
  async mine(query: PropertyQuery = {}): Promise<{ items: Property[]; total: number }> {
    const params = new URLSearchParams();
    params.set("vendorOnly", "true");
    params.set("format", "json");
    if (query.search) params.set("search", query.search);
    if (query.city) params.set("city", query.city);
    if (query.status) params.set("status", query.status);
    if (query.page) params.set("page", String(query.page));
    params.set("limit", String(query.limit ?? 50));
    const res = await client.get<any>(`/properties?${params.toString()}`);
    return { items: res?.properties ?? res ?? [], total: res?.total ?? res?.count ?? 0 };
  },

  async get(id: string | number): Promise<Property> {
    const res = await client.get<any>(`/properties/${id}`);
    return res?.property ?? res ?? null;
  },

  /** Multipart create — images ride along the same request (backend multer). */
  create(fields: Record<string, unknown>, images: { uri: string }[]): Promise<{ property: Property }> {
    return client.post("/properties", buildMultipart(fields, "images", images), {
      timeoutMs: REQUEST_TIMEOUT_MS * 2,
    });
  },

  update(id: string, fields: Record<string, unknown>, newImages: { uri: string }[] = []): Promise<{ property: Property }> {
    const fd = buildMultipart(fields, "images", newImages);
    return client.put(`/properties/${id}`, fd, { timeoutMs: REQUEST_TIMEOUT_MS * 2 });
  },

  updateStatus(id: string, status: string): Promise<{ property: Property }> {
    return client.put(`/properties/${id}`, { status });
  },

  remove(id: string): Promise<{ success: boolean }> {
    return client.del(`/properties/${id}`);
  },
};

/* ─────────────────────── Slot management (properties/stays) ─────────────────────── */

export const SlotApi = {
  getSlots(id: string | number, date: string): Promise<{
    isTimeSlotEnabled: boolean;
    bookingType: string;
    openingTime: string;
    closingTime: string;
    slotDuration: number;
    isDayAvailable: boolean;
    slots: PropertySlot[];
  }> {
    return client.get(`/bookings/properties/${id}/slots?date=${date}`);
  },

  blockSlot(
    id: string | number,
    date: string,
    slotLabel: string,
    action: "block" | "unblock",
    reason?: string,
  ): Promise<{ customBlockedSlots: unknown[] }> {
    return client.post(`/bookings/vendor/properties/${id}/block-slot`, {
      date,
      slotLabel,
      action,
      reason: reason ?? "Blocked by Vendor",
    });
  },

  batchBlockSlots(
    id: string | number,
    date: string,
    blockedSlotLabels: string[],
  ): Promise<{ customBlockedSlots: unknown[] }> {
    return client.post(`/bookings/vendor/properties/${id}/batch-block-slots`, {
      date,
      blockedSlotLabels,
    });
  },
};

/* ───────────────────────────── Stays (Hotels & Villas) ────────────────────── */

export const StayApi = {
  async mine(type?: "hotel" | "villa"): Promise<Stay[]> {
    const q = new URLSearchParams({ vendorOnly: "true" });
    if (type) q.set("type", type);
    const res = await client.get<any>(`/stays?${q.toString()}`);
    const stays = res?.stays ?? (Array.isArray(res) ? res : res?.data) ?? [];
    return stays as Stay[];
  },

  async get(id: string): Promise<Stay> {
    const res = await client.get<any>(`/stays/${id}`);
    return res?.stay ?? res ?? null;
  },

  create(fields: Record<string, unknown>, images: { uri: string }[]): Promise<{ stay: Stay }> {
    return client.post("/stays", buildMultipart(fields, "images", images), {
      timeoutMs: REQUEST_TIMEOUT_MS * 2,
    });
  },

  update(id: string, fields: Record<string, unknown>, newImages: { uri: string }[] = []): Promise<{ stay: Stay }> {
    const fd = buildMultipart(fields, "media", newImages);
    return client.put(`/stays/${id}`, fd, { timeoutMs: REQUEST_TIMEOUT_MS * 2 });
  },

  updateStatus(id: string, status: string): Promise<{ stay: Stay }> {
    return client.patch(`/stays/${id}/status`, { status });
  },

  remove(id: string): Promise<{ success: boolean }> {
    return client.del(`/stays/${id}`);
  },
};

/* ─────────────────────────── Room types + physical rooms ────────────────────── */

export const RoomApi = {
  roomTypes(stayId: string): Promise<RoomType[]> {
    return client.get(`/rooms/stays/${stayId}/room-types`).then((res) => res?.roomTypes ?? res ?? []);
  },

  createRoomType(
    stayId: string,
    fields: Record<string, unknown>,
    images: { uri: string }[] = [],
  ): Promise<{ roomType: RoomType; physicalRooms: Room[] }> {
    return client.post(
      `/rooms/stays/${stayId}/room-types`,
      buildMultipart(fields, "images", images),
      { timeoutMs: REQUEST_TIMEOUT_MS * 2 },
    );
  },

  updateRoomType(
    stayId: string,
    roomTypeId: string,
    fields: Record<string, unknown>,
    images: { uri: string }[] = [],
  ): Promise<{ roomType: RoomType }> {
    return client.put(
      `/rooms/stays/${stayId}/room-types/${roomTypeId}`,
      buildMultipart(fields, "images", images),
      { timeoutMs: REQUEST_TIMEOUT_MS * 2 },
    );
  },

  deactivateRoomType(stayId: string, roomTypeId: string): Promise<{ success: boolean }> {
    return client.del(`/rooms/stays/${stayId}/room-types/${roomTypeId}`);
  },

  addPhysicalRooms(
    stayId: string,
    roomTypeId: string,
    body: { roomNumbers?: string | string[]; startNumber?: number; endNumber?: number },
  ): Promise<{ count: number; rooms: Room[] }> {
    return client.post(`/rooms/stays/${stayId}/room-types/${roomTypeId}/physical-rooms`, body);
  },

  rooms(stayId: string): Promise<Room[]> {
    return client.get(`/rooms/stays/${stayId}/rooms`).then((res) => res?.rooms ?? res ?? []);
  },

  createRoom(stayId: string, fields: Record<string, unknown>): Promise<{ room: Room }> {
    return client.post(`/rooms/stays/${stayId}/rooms`, buildMultipart(fields, "images", []), {
      timeoutMs: REQUEST_TIMEOUT_MS * 2,
    });
  },

  updateRoomStatus(stayId: string, roomId: string, status: string): Promise<{ room: Room }> {
    return client.patch(`/rooms/stays/${stayId}/rooms/${roomId}/status`, { status });
  },

  deleteRoom(stayId: string, roomId: string): Promise<{ success: boolean }> {
    return client.del(`/rooms/stays/${stayId}/rooms/${roomId}`);
  },

  /** Vendor room calendar — bookings grouped per physical room. */
  roomCalendar(stayId: string): Promise<{
    stayName?: string;
    roomTypesCount: number;
    physicalRoomsCount: number;
    schedule: Room[];
  }> {
    return client.get(`/bookings/vendor/stays/${stayId}/room-calendar`);
  },
};

/* ───────────────────────────── Bookings ───────────────────────────── */

export const BookingApi = {
  /** Vendor inbox — scoped to vendorId/email by the backend. */
  list(): Promise<VendorBooking[]> {
    return client.get("/bookings/bookings").then((res) => res?.bookings ?? res ?? []);
  },

  get(id: string): Promise<VendorBooking> {
    return client.get(`/bookings/bookings/${id}`).then((res) => res?.booking ?? res);
  },

  updateStatus(
    id: string,
    body: { bookingStatus?: string; paymentStatus?: string },
  ): Promise<VendorBooking> {
    return client.patch(`/bookings/bookings/${id}/status`, body).then((res) => res?.booking ?? res);
  },

  /** Reschedule / vendor notes / rollback payment status. */
  update(id: string, body: Record<string, unknown>): Promise<VendorBooking> {
    return client.put(`/bookings/bookings/${id}`, body).then((res) => res?.booking ?? res);
  },
};

/* ─────────────────────────── Leads / Inquiries ─────────────────────────── */

export const LeadApi = {
  list(): Promise<Lead[]> {
    return client.get("/inquiries/leads").then((res) => res?.leads ?? res ?? []);
  },

  get(id: string): Promise<Lead> {
    return client.get(`/inquiries/leads/${id}`).then((res) => res?.lead ?? res);
  },

  updateStatus(id: string, status: LeadStatus): Promise<Lead> {
    return client.patch(`/inquiries/leads/${id}/status`, { status }).then((res) => res?.lead ?? res);
  },

  remove(id: string): Promise<{ success: boolean }> {
    return client.del(`/inquiries/leads/${id}`);
  },
};

/* ─────────────────────── Style Experts (3 subcategories) ─────────────────────── */

export const StyleExpertApi = {
  mine(): Promise<StyleExpert[]> {
    return client.get("/vendor/style-experts").then((res) => res?.experts ?? res ?? []);
  },

  get(id: string): Promise<StyleExpert> {
    return client.get(`/vendor/style-experts/${id}`).then((res) => res?.expert ?? res);
  },

  create(fields: Record<string, unknown>, images: { uri: string }[]): Promise<{ expert: StyleExpert }> {
    const fd = new FormData();
    for (const [k, v] of Object.entries(fields)) {
      if (v === undefined || v === null || v === "") continue;
      fd.append(k, String(v));
    }
    images.forEach((img, i) => {
      if (img.uri.startsWith("http") || img.uri.startsWith("data:")) {
        fd.append("portfolioImages", String(img.uri));
        return;
      }
      const name = img.uri.split("/").pop() || `portfolio_${i}.jpg`;
      if (i === 0) {
        fd.append("profileImage", { uri: img.uri, name, type: "image/jpeg" } as any);
      }
      fd.append("portfolioImages", { uri: img.uri, name, type: "image/jpeg" } as any);
    });
    return client.post("/vendor/style-experts", fd, { timeoutMs: REQUEST_TIMEOUT_MS * 2 });
  },

  update(id: string, fields: Record<string, unknown>, images: { uri: string }[] = []): Promise<{ expert: StyleExpert }> {
    const fd = new FormData();
    for (const [k, v] of Object.entries(fields)) {
      if (v === undefined || v === null) continue;
      if (v === "" && k !== "description") continue;
      fd.append(k, String(v));
    }
    images.forEach((img, i) => {
      if (img.uri.startsWith("http") || img.uri.startsWith("data:")) {
        fd.append("portfolioImages", String(img.uri));
        return;
      }
      const name = img.uri.split("/").pop() || `portfolio_${i}.jpg`;
      fd.append("portfolioImages", { uri: img.uri, name, type: "image/jpeg" } as any);
    });
    return client.put(`/vendor/style-experts/${id}`, fd, { timeoutMs: REQUEST_TIMEOUT_MS * 2 });
  },

  remove(id: string): Promise<{ success: boolean }> {
    return client.del(`/vendor/style-experts/${id}`);
  },
};

export { ApiError, API_BASE_URL };
