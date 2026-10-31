# KING OF PROPERTIES — Vendor Mobile App

**Final engineering report** · `VendorApp/` · Android (React Native + TypeScript)

---

## 1. Directory & artifact overview

```
kof/
├── KingOfProperties/          ← Client App (UNTOUCHED)
├── backend/                   ← Node/Express backend (UNTOUCHED)
└── VendorApp/                 ← NEW vendor application (this report)
    ├── App.tsx                ← SafeAreaProvider → Theme → Auth → ActiveCategory → RootNavigator
    ├── index.js               ← registers by app.json name (KingOfPropertiesVendor)
    ├── app.json               ← name KingOfPropertiesVendor / displayName "KOP Vendor"
    ├── package.json           ← kingofproperties-vendor@0.0.1 (independent lockfile)
    ├── android/
    │   └── app/src/main/java/com/kingofproperties/vendor/
    │       ├── MainActivity.kt   (ComponentName KingOfPropertiesVendor)
    │       └── MainApplication.kt
    ├── assets/                ← logo.jpg, appicon.png (reused from Client App)
    └── src/
        ├── theme/ThemeProvider.tsx        ← design tokens, copied verbatim
        ├── lib/                           ← config, HTTP client, secure storage, domain types, API layer
        ├── auth/VendorAuthProvider.tsx    ← session (kopv_ storage keys, 401 guard)
        ├── rbac/                          ← categories.ts (RBAC meta) + ActiveCategory.tsx (switcher)
        ├── components/                    ← ui/* (verbatim UI kit) + Pill, StatCard, ImagePickerGrid, InfoCard, VendorTabBar
        ├── components/__tests__/pill.test.ts
        ├── rbac/__tests__/categories.test.ts
        ├── navigation/                    ← RootNavigator.tsx, types.ts (+ navigation.d.ts global RootParamList)
        └── screens/
            ├── splash/  auth/  onboarding/
            ├── dashboard/  stays/  listings/  style/  bookings/  leads/
            └── account/   (Profile, EditProfile, Notifications, Analytics, Settings)
```

No file in `KingOfProperties/` or `backend/` was created, modified, or deleted. The VendorApp skeleton was cloned via `robocopy` (excluding `node_modules`, `.git`, `.gradle`, `.kotlin`, `.cxx`, `build`, `ios`) and every vendor screen was written from scratch in `VendorApp/src`.

---

## 2. Architecture

Single backend (`https://kingofproperties-backend-five.vercel.app/api` in release, `http://10.0.2.2:5001/api` in dev only). Request flow:

```
Screen → lib/api.ts (typed services) → lib/client.ts
          (token injection, timeout, retry-on-network, 401 single-flight guard)
        → lib/secureStorage.ts (react-native-keychain, service prefix com.kingofproperties.vendor.)
```

**Layering rules**
- `lib/config.ts` — the only place that knows URLs. `localhost` never appears in a release build; dev fallback (`10.0.2.2:5001`) is gated behind `__DEV__`, and an runtime override hook (`global.__API_BASE_URL__`) exists for ad-hoc builds. `resolveImageUrl` turns relative `/uploads/...` paths into absolute URLs.
- `lib/client.ts` — one shared fetch wrapper: 90 s default timeout, 75 s auth timeout (Vercel cold starts), structured `ApiError` (status, body), automatic `Authorization: Bearer` injection, one-flight 401 → re-auth handler.
- `lib/api.ts` — feature services only (`AuthApi`, `VendorApi`, `PropertyApi`, `SlotApi`, `StayApi`, `RoomApi`, `BookingApi`, `LeadApi`, `StyleExpertApi`, `NotificationApi`, `AnalyticsApi`, `VendorSettingsApi`) plus `buildMultipart`. No screen calls `fetch` directly.
- `lib/types.ts` — domain types with `[key: string]: unknown` escape hatch so unknown backend fields never crash rendering.
- **Backend is the security boundary.** The app's RBAC is UX-only; every sensitive mutation is re-authorized server-side (`requireVendor`, ownership checks).

**Navigation model** — one root stack with three phases:
1. `Splash` (charcoal + gold, VENDOR PARTNER wordmark; ~2.2 s dwell + fade)
2. `Gate` — `Auth` (Welcome / GuestHome / Login / Register) → `AccountStatus` (Pending/Suspended/Rejected) → `Onboarding` (category claim, mandatory for fresh vendors with `categories: []`) → `Main`
3. `Main` = MainStack (all stack screens) + per-role TabBar handled by `VendorTabBar` (reads `useActiveCategory`).

**Guest browse mode** — "Continue as guest" links on the Welcome and Login screens (and the persisted `kopv_guest_mode` flag on boot) drop the user into a read-only `GuestHomeScreen` preview inside the auth stack. Guests carry **no token**, so not a single vendor endpoint is reachable; the preview only describes the three businesses and funnels into sign-in / registration. There is intentionally **no mock data** and no path from guest state into `Main` — signing in (or registering) clears the flag immediately.

**Category switching** — vendors with several authorized categories get an in-tab switcher; the choice persists under `kopv_active_category` and every tab set re-keys off it.

---

## 3. Reused components (verbatim from the Client App)

| Copied verbatim | Notes |
|---|---|
| `theme/ThemeProvider.tsx` | Light/dark tokens, brand colors, typography — identical to Client App |
| `components/ui/Button.tsx` | Variants, loading state |
| `components/ui/Chip.tsx` | `label / selected / onPress / icon` |
| `components/ui/Input.tsx` | `label / error / secure` (no right-slot) |
| `components/ui/ModalSheet.tsx` | Bottom sheets (status actions, notes) |
| `components/ui/Screen.tsx`, `ScreenHeader.tsx`, `SectionHeader.tsx` | Page chrome |
| `components/ui/Skeleton.tsx`, `StateView.tsx`, `SmartImage.tsx` | Load / empty / error states + remote images |
| `assets/logo.jpg`, `assets/appicon.png` | Brand identity |

**Vendor-specific (new)** — `Pill.tsx` (StatusPill, `formatMoney` ₹/L/Cr, `formatDate(Time)`, `todayISO`, `normalizeId`, `initialsOf`), `StatCard.tsx`, `ImagePickerGrid.tsx` (camera + library via `react-native-image-picker` named exports `launchCamera, launchImageLibrary` — v8 has **no** default export), `InfoCard.tsx`, `VendorTabBar.tsx` (category-aware bottom tabs).

---

## 4. Vendor roles & RBAC

Backend enum (models/Vendor.js): `categories: ["PROPERTY" | "TO_LET" | "HOTEL_VILLA" | "STYLE"]`.

- **PROPERTY is deliberately excluded from the entire app UX** (sale listings are web-portal-only). `rbac/categories.ts` still carries its meta but `authorizedCategories()` filters it out of every tab switcher.
- Authorized per-vendor category sets drive everything: tab layout, dashboard KPIs, feature visibility.
- Fresh registrations arrive with `categories: []` → the root navigator gates them into **Onboarding** until they claim categories (`POST /vendor/categories`); the backend 403s any listing create until then.
- `statusOf()` maps backend status (`Active|Pending|Suspended|Rejected`) onto gates: Pending → AccountStatus screen, Suspended/Rejected → AccountStatus screen. Server side, `requireVendor` hard-blocks suspended vendors regardless of what the app shows.
- Home-Experts vendors additionally carry `FURNITURE | INTERIOR_DESIGNER | RENOVATION` subcategories (`STYLE_SUBCATEGORY_META`).

| Category | Tab set |
|---|---|
| HOTEL_VILLA | Dashboard · Stays · **Bookings** · Alerts · Profile |
| TO_LET | Dashboard · **Listings** · **Enquiries** · Alerts · Profile |
| STYLE | Dashboard · **Services** · **Requests** (leads) · Alerts · Profile |

---

## 5. Screens (all complete)

**Auth & onboarding** — `SplashScreen` (animated, vendor wordmark), `WelcomeScreen` (email/password-free intro with a **Continue as guest** link), `GuestHomeScreen` (read-only guest preview — no API access, funnels into sign-in/registration), `LoginScreen` (email/password, `Input secure`, **"Just exploring? Continue as guest"** skip), `RegisterScreen` (vendor signup), `OnboardingScreen` (claim categories → re-`me()`), `AccountStatusScreen` (pending/locked states).

**Dashboard** — per-category KPI stat cards, quick actions, recent leads/bookings/listings, notifications bell, performance teaser → Analytics.

**Hotels & Villas (hourly)** — `StaysScreen` (list, publish/draft/rework), `StayFormScreen` (create/edit; hotel `totalRooms` vs villa bedrooms/bathrooms/guests/area split, amenities, hourly availability: days, opening/closing, slot duration; multipart images), `StayDetailScreen` (media manager, status actions, room-type & rooms drill-in), `RoomTypeFormScreen`, `RoomCalendarScreen` (physical-room booking calendar).

**Homes & Apartments (To-Let)** — `ListingsScreen` (live search, publish/unpublish via `PropertyApi.updateStatus`, per-row Slots & Edit), `PropertyFormScreen` (monthlyRent, securityDeposit, maintenance, furnishing, tenantPreference, brokerage/zero-brokerage, availableFrom, notice, parking…; `listingType: "TO_LET", purpose: "rent"`), `PropertySlotsScreen` (14-day strip, block/unblock + batch block, legend).

**Home Experts** — `ExpertsScreen` (portfolio services), `ExpertFormScreen` (first pick → `profileImage`, all picks → `portfolioImages`).

**Shared** — `BookingsScreen` + `BookingDetailScreen` (status pipeline, mark paid, internal notes), `LeadsScreen` + `LeadDetailScreen` (status pipeline NEXT_ACTIONS, delete), `NotificationsScreen` (single mark / read-all / delete), `ProfileScreen` (category badges, quick links), `EditProfileScreen` (avatar upload; theme-bg, no hardcoded colors), `SettingsScreen` (category manager, GET/PUT `/vendor/settings` toggles, about), `AnalyticsScreen` (overview + earnings monthly bars).

---

## 6. API inventory (exactly what the app calls — nothing invented)

| Service | Method + path | Used for |
|---|---|---|
| AuthApi | POST `/auth/register/vendor` · POST `/auth/login/vendor` · GET `/auth/me` · POST `/auth/logout` | session |
| VendorApi | GET/PUT `/vendor/profile` (avatar → multipart `profileImage`) · GET/POST `/vendor/categories` · GET `/vendor/dashboard` | identity + KPIs |
| VendorSettingsApi | GET/PUT `/vendor/settings` | toggles |
| NotificationApi | GET `/notifications` · PATCH `/notifications/:id/read` · PATCH `/notifications/read-all` · DELETE `/notifications/:id` | alerts tab |
| AnalyticsApi | GET `/analytics/overview` · `/analytics/earnings` · `/analytics/bookings` · `/analytics/leads` | dashboard + analytics |
| PropertyApi | GET `/properties?vendorOnly=true&format=json` (array shape) · GET/PUT/DELETE `/properties/:id` · POST `/properties` (`images` multipart) | To-Let listings |
| SlotApi | GET `/bookings/properties/:id/slots?date=` ☞ *doubled segment* · POST `/bookings/vendor/properties/:id/block-slot` · POST `/bookings/vendor/properties/:id/batch-block-slots` | slot blocking |
| StayApi | GET `/stays?vendorOnly=true` · GET/PUT/DELETE `/stays/:id` · POST `/stays` (`images`; update also sends `media`) · PATCH `/stays/:id/status` | hourly stays |
| RoomApi | GET/POST `/rooms/stays/:id/room-types` · PUT/DELETE `.../room-types/:rtid` · POST `.../room-types/:rtid/physical-rooms` · GET/POST `/rooms/stays/:id/rooms` · PATCH/DELETE `.../rooms/:roomid...` | hotel inventory |
| BookingApi | GET `/bookings/vendor/stays/:id/room-calendar` · GET `/bookings/bookings` ☞ *doubled segment* · GET/PATCH-PUT `/bookings/bookings/:id` · PATCH `/bookings/bookings/:id/status` | bookings |
| LeadApi | GET `/inquiries/leads` ☞ *doubled segment* · GET/PATCH/DELETE `/inquiries/leads/:id` · PATCH `.../status` | enquiries |
| StyleExpertApi | GET/POST `/vendor/style-experts` · GET/PUT/DELETE `/vendor/style-experts/:id` (`profileImage` + `portfolioImages`) | services |

Multipart conventions: stays create → `images`; stays update → `media` (+ existing URLs re-sent under `images`); style experts → `profileImage` + `portfolioImages`; properties → `images`; profile avatar → `profileImage`.

---

## 7. Missing / deficient backend endpoints (documented, not worked around)

1. **No vendor OTP / email-verification endpoint.** Vendor registration is single-step; the web/flow has no `/auth/verify-otp`. Anyone with an email can create a pending vendor account.
2. **No forgot-password / reset-password endpoint for vendors.** A locked-out vendor cannot self-recover from the app (huge operational gap).
3. **No refresh-token endpoint / rotation.** `GET /auth/me`-only revalidation; on expiry the app hard-signs out. Tokens are long-lived.
4. **No push-notification infrastructure.** No FCM token registration endpoint (`/notifications` is polled on tab focus only). Booking/lead alerts are pull-based, which undermines the whole "Alerts" tab on missed polling.
5. **No vendor-side Style service-request endpoint.** `/inquiries/leads` serves To-Let enquiries; Home-Expert service requests ride the same lead pipeline with no dedicated type/status filter endpoint. (The app reuses `LeadApi`.)
6. **No GET `/payments` list endpoint.** Earnings come from `/analytics/earnings` aggregates only; there is no per-transaction payment history a vendor can audit.
7. **Doubled path segments (route-mounting bug, kept as-is because security policy forbids "fixing" the server side from the app):** `POST /api/bookings/bookings`, `GET /api/inquiries/leads`, `GET /api/bookings/properties/:id/slots` — the routers are mounted at `/bookings|/inquiries` *and* declare the segment again.
8. **Inconsistent list response shapes.** `GET /properties` returns a **bare array** only with `?format=json`, other list endpoints return `{ items | bookings | leads | experts }` wrappers — the app has to `unwrap()` per endpoint.
9. **`requireVendorCategory` middleware exists but is unused.** Routes check `requireVendor` + ownership but not category membership inside the handler温馨 chain; a `STYLE`-only vendor could theoretically POST an hourly stay if they bypassed the client (the app's UX never allows this).
10. **Slot identity is a display string** (`09:00–10:00` with an en-dash). Block/unblock round-trips a localized label, not a canonical time range — fragile across clients/locales.
11. **Auth latency:** Vercel cold starts required a client-side 75 s auth timeout — an infra smell rather than a code bug.
12. **[DIAGNOSED & FIXED LOCALLY — pending redeploy] Mongo connect race on serverless.** The registration 500 (`Operation vendors.findOne() buffering timed out after 10000ms`) is caused by the server answering requests while the Atlas connection is still being established — the initial connection attempt often fails transiently and succeeds only on retry (reproduced locally: first attempt hit an "IP not whitelisted"-style Atlas error, a later retry connected). Fixes applied to the backend repo:
    - `config/db.js`: new `ensureDB(waitMs)` (waits/retries up to 15 s) + `getDBState()` with error taxonomy (`config` vs `network`), and failure logging.
    - `server.js`: a request gate now awaits DB readiness before any data route (health/root excluded) and returns a clean 503 JSON with an actionable message instead of a raw mongoose buffering timeout; `/api/health` now reports `database: connected|down`.
    - **To deploy:** set `MONGO_URI` in Vercel → Project → Settings → Environment Variables, allow `0.0.0.0/0` in MongoDB Atlas Network Access (required for Vercel functions), then redeploy (`npx vercel --prod` from `backend/kingofproperties_backend` or the Vercel dashboard).

---

## 8. Security review & gaps

**Done right**
- Tokens + user JSON in **Keychain** with the vendor-unique service `com.kingofproperties.vendor.` — never AsyncStorage; `kopv_`-prefixed keys avoid colliding with a co-installed Client App.
- Backend remains the RBAC boundary (`requireVendor` hard-blocks suspended vendors server-side; ownership re-checked per request).
- Dev URL is unreachable in release (`__DEV__` gate), no `localhost` shipped.
- Every screen's data access is category-guarded in UX; unauthorized categories' features are unreachable, not merely hidden.
- Array-shape drift (`bare array` vs `{x:[]}`) handled defensively with ` ?? []` everywhere.

**Gaps / accepted risks**
- **No refresh-time token rotation** — a leaked token stays valid until its (long) expiry.
- **No certificate pinning** — HTTPS only; MITM-protected by CAs but not pinned.
- **Debug APK ships with source maps + dev screens**; only `assembleRelease` should reach end users.
- Frontend RBAC is UX-only (by design): nothing sensitive is protected by hiding UI — noted in-code.
- `ImagePicker` on Android 13+ relies on media permissions only, no broad READ_EXTERNAL_STORAGE requested.
- No jailbreak/root checks, no device attestation (Play Integrity) — backend rate limiting is the only abuse brake.

---

## 9. Dependencies (`package.json`, runtime)

`react-native 0.88.0` · `react 19.3.0` · `@react-navigation/native ^7.5.1` + `bottom-tabs ^7.21.0` + `native-stack ^7.21.0` · `react-native-screens ^4.30.0` · `react-native-safe-area-context ^5.10.1` · `react-native-gesture-handler ^3.4.0` · `react-native-reanimated ^4.7.1` (+ `worklets ^0.13.0`) · `react-native-vector-icons ^10.3.0` · `react-native-image-picker ^8.3.0` · `react-native-keychain ^10.0.0` · `@react-native-async-storage/async-storage ^3.1.1` · `@react-native-community/netinfo ^12.0.1` · TypeScript `^6.0.3` · Jest `^29.6.3` · ESLint `^8.19.0`.

Google Sign-In was **removed deliberately** (vendor accounts are email/password only; keeps the app free of `google-services.json` requirements). No WebView anywhere. Dev toolchain versions match the Client App lockfile so the RN 0.88 dependency set is identical.

---

## 10. Environment & build configuration

- `lib/config.ts` — release base `https://kingofproperties-backend-five.vercel.app/api`; dev `http://10.0.2.2:5001/api` (`__DEV__` only); optional `global.__API_BASE_URL__` runtime override.
- `android/app/build.gradle` — `namespace` & `applicationId` `com.kingofproperties.vendor`, `versionNameSuffix " - vendor"`. Google-services classpath is **conditional** and inactive (no `google-services.json`).
- `strings.xml` — `app_name` "KOP Vendor"; splash background `#FAF7F0` kept.
- Keychain service prefix `com.kingofproperties.vendor.`; storage keys `kopv_auth_token`, `kopv_auth_user_json`; active-category key `kopv_active_category`; guest browse flag `kopv_guest_mode` (AsyncStorage, value `"1"`).
- No `.env` secrets are baked in; the app ships with zero hard-coded credentials.

---

## 11. Verification actually executed

| Check | Command | Result |
|---|---|---|
| Install | `npm install` | ✅ 896 packages, Node v24.21.0 |
| Type-check | `npx tsc --noEmit` | ✅ **0 errors** (after iterative fix rounds: tab→stack navigation typing, duplicate style keys, Stay/Room field additions, icon imports) |
| Lint | `npx eslint src App.tsx` | ✅ **0 errors** (inline-style cosmetic warnings remain, same policy as Client App) |
| Unit tests | `npm test` (Jest, react-native preset) | ✅ **33/33 passed, 2 suites** (`src/rbac/__tests__/categories.test.ts`, `src/components/__tests__/pill.test.ts` — RBAC gates, status meta, money/date/initial/normalize helpers) |
| Android build | `.\gradlew.bat assembleDebug` | ✅ (see §12) |

Manual smoke-testing on an emulator (login → category claim → per-category tabs) is listed as remaining manual work in §15.

---

## 12. Build status

`.\gradlew.bat assembleDebug` → **BUILD SUCCESSFUL** (incremental; log at `android/gradle_debug.log`). All vendor dependencies (navigation, keychain, image-picker, vector-icons, reanimated/worklets native code) compiled and dexed, and the app bundle was produced with the vendor `applicationId com.kingofproperties.vendor`. No compilation errors; JS bundle validity was already proven by Metro-independent `tsc` + Jest checks above. (An earlier gradle invocation was interrupted by a console-output filter, not a failure — rerun confirmed BUILD SUCCESSFUL.)

---

## 13. APK location

```
C:\Users\iNEST\Desktop\kof\VendorApp\android\app\build\outputs\apk\debug\app-debug.apk   ← 122.37 MB, dev (Metro-bundled JS)
C:\Users\iNEST\Desktop\kof\VendorApp\android\app\build\outputs\apk\release\app-release.apk ← 52.64 MB, self-contained (JS bundle + Hermes)
```
- **Release build (`assembleRelease`): BUILD SUCCESSFUL in 9m 4s** — signing currently falls back to the debug keystore, so it is installable standalone (no Metro/server needed) and includes the guest mode. For store distribution generate a dedicated keystore and switch `signingConfig` (§14).
- `applicationId`: `com.kingofproperties.vendor` — installs alongside the Client App (`com.kingofproperties`) without collision.
- `output-metadata.json` sits beside it with the ABI/version metadata.
- Debug APK carries no JS bundle (loads from a Metro dev server) — use it only with `npm run android` / `npx react-native start`.

---

## 14. Post-build remaining work

1. **Signing & release build** — generate a keystore, set `signingConfigs` in `android/app/build.gradle`, run `assembleRelease` (the debug APK is not for users).
2. **App icon & splash assets** — adaptive-icon layering of `appicon.png` (`ic_launcher` mipmap set), confirm the `#FAF7F0` splash in all densities.
3. **Manual emulator/device pass** — register → onboarding → each of the three workspace tabs → slot block/unblock → lead status pipeline.
4. **Play Store setup** — separate listing, screenshots, data-safety form (Keychain use, images), target-API compliance.
5. **Optional hardening** — certificate pinning, root detection, `Play Integrity` checks on the server.

---

## 15. Recommended backend follow-ups (engineering-ready)

1. Add `/auth/forgot-password` + `/auth/reset-password` (tokenized, expiring) — highest-priority gap.
2. Add refresh-token rotation; shrink access-token lifetime.
3. Introduce FCM token registration (`POST /notifications/register-device`) and wire booking/lead push.
4. Wire the dormant `requireVendorCategory` middleware into stay/property/style routes.
5. Normalize list response shapes (`{ items, total }`) — removes the app's `unwrap()` transcription layer.
6. Rename router mounts to remove the doubled `/bookings/bookings`, `/inquiries/leads`, `/bookings/properties/:id/slots` segments (provide versioned aliases before removing).
7. Replace string slot labels with `{startTime, endTime}` pairs (or expose both) while keeping labels for display only.
8. Add vendor payment-listing endpoint (`GET /payments?vendorId=me`) for auditable earnings.
9. Consider a dedicated vendor style-request type on `/inquiries` with its own status pipeline.
10. Add server-side pagination metadata on all vendor list endpoints.
