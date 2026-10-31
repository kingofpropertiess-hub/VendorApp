# King of Properties — Client (React Native)

Customer-facing mobile app for **King of Properties**, talking to the existing
Express/Mongo backend at `backend/kingofproperties_backend`.

- **Framework:** bare React Native **0.88** (no Expo), TypeScript strict
- **Navigation:** React Navigation 7 (native stack + bottom tabs)
- **State:** React Context only (`ThemeProvider`, `AuthProvider`, `WishlistProvider`)
- **Storage:** `react-native-keychain` for the JWT, AsyncStorage for non-sensitive cache

---

## ⚠️ Why this project lives at `C:\rn\KingOfProperties`

The Android NDK/CMake build on Windows fails with
`Filename longer than 260 characters` when the project is nested inside a long
path such as `C:\Users\<user>\Desktop\kof\client app`.

Windows long paths are **disabled** on this machine and the bundled `ninja`
(1.10.2) is not long-path aware, so the only reliable fix is a short project
root. Everything else is unchanged — this *is* the `client app` project.

If you must move it, keep the absolute path short (≤ ~30 characters before
`\android`).

---

## Prerequisites

| Tool | Version used |
| --- | --- |
| Node.js | 22.11+ (24.x tested) |
| JDK | 17 (bundled with Android Studio) |
| Android SDK | compileSdk 37, build-tools 37.0.0, NDK 27.1.12297006, CMake 3.22.1 |
| Backend | `backend/kingofproperties_backend` running on port **5001** |

## Run it

```powershell
# 1. Backend (separate terminal)
cd C:\Users\iNEST\Desktop\kof\backend\kingofproperties_backend
node server.js            # or: npx nodemon server.js

# 2. Mobile app
cd C:\rn\KingOfProperties
npm start                 # Metro on :8081
npm run android           # builds + installs on the running emulator/device
```

Already-built debug APK:

```
C:\rn\KingOfProperties\android\app\build\outputs\apk\debug\app-debug.apk
```

Build only:

```powershell
cd C:\rn\KingOfProperties\android
.\gradlew.bat assembleDebug
```

## API URL configuration

Resolution order (`src/lib/config.ts`):

1. `global.__API_BASE_URL__` — set at the very top of `index.js` (runtime override)
2. `PRODUCTION_API_BASE_URL` — constant in `src/lib/config.ts` for release builds
3. Dev defaults:
   - Android emulator → `http://10.0.2.2:5001/api` (host loopback seen from the emulator)
   - iOS simulator → `http://localhost:5001/api`

**Physical Android device:** `localhost` is the *phone*, not your PC. Set your
machine's LAN IP:

```js
// index.js
global.__API_BASE_URL__ = 'http://192.168.1.5:5001/api';
```

**Release build:** fill in `PRODUCTION_API_BASE_URL` in `src/lib/config.ts`
(e.g. `https://your-backend.example.com/api`) — never ship `localhost`.

## Project layout

```
App.tsx                      providers + RootNavigator
index.js                     entry, gesture-handler import, API override hook
src/
  navigation/                stack + tabs, route param types
  auth/AuthProvider.tsx      JWT session, restore, /me revalidation
  theme/ThemeProvider.tsx    light/dark/system tokens
  context/WishlistProvider   optimistic wishlist ids
  lib/
    config.ts                API base resolution
    client.ts                fetch wrapper: 20s timeout, bearer token, 401 → sign out
    api.ts                   one typed service per backend resource
    types.ts                 backend DTOs
    secureStorage.ts         Keychain adapter
  components/                PropertyCard, buttons, inputs, skeletons, state views
  screens/
    auth/                    Welcome, Login, Register
    tabs/                    Home, Explore, Stays, Bookings, Profile
    detail/                  PropertyDetail, StayDetail, BookingDetail
    account/                 Wishlist, Notifications, MyInquiries, EditProfile
    misc/                    Experts (style service), AiChat
  utils/                     formatters + form validation
```

## Guest mode

The app can be used without an account. On the welcome screen tap
**Continue as guest** — the choice is persisted in AsyncStorage
(`kop_guest_mode`), so the welcome screen is not shown again on the next launch.

Guests can browse properties, stays, the AI assistant and design experts.
Account-only actions (wishlist, site-visit / stay bookings, inquiries,
notifications, profile editing) show a sign-in prompt that opens the
Login/Register screens as modals and then drops the user back on the same
screen. The shared guard lives in `src/auth/useAuthGate.ts`; `AuthProvider`
exposes `guestMode`, `continueAsGuest()` and `exitGuestMode()`.

## Backend endpoints used

| Screen | Endpoint |
| --- | --- |
| Register / Login | `POST /api/auth/register/user`, `POST /api/auth/login/user` |
| Session restore | `GET /api/auth/me`, `POST /api/auth/logout` |
| Home / Explore | `GET /api/properties?format=json&…` |
| Property detail | `GET /api/properties/:id` |
| Site-visit slots | `GET /api/bookings/properties/:id/slots?date=` |
| Slot booking | `POST /api/bookings/bookings` |
| Stays list / detail | `GET /api/stays`, `GET /api/stays/:id` |
| Room types | `GET /api/rooms/stays/:id/room-types` |
| Stay availability | `GET /api/bookings/stays/:id/availability` |
| Hotel booking | `POST /api/bookings/hotel-bookings` |
| My bookings | `GET /api/bookings/bookings`, `GET /api/bookings/bookings/:id` |
| Cancel / status | `PATCH /api/bookings/bookings/:id/status` |
| Wishlist | `GET /api/wishlist/saved-properties`, `GET /api/wishlist/saved-properties/items`, `POST`/`DELETE` |
| Inquiries | `POST /api/inquiries`, `GET /api/inquiries/user/inquiries` |
| Notifications | `GET /api/notifications`, `PATCH /:id/read`, `PATCH /read-all`, `DELETE /:id` |
| AI assistant | `POST /api/ai/chat` |
| Design experts | `GET /api/style/professionals`, `POST /api/style/service-requests` |
| Profile edit | `PUT /api/users/:id` |

## Not implemented (and why)

- **Google sign-in** — needs an Android OAuth client ID + `google-services.json`;
  neither exists in the repo. `AuthApi.googleAuth` is wired and ready.
- **Payments** — the backend has `POST /api/bookings/payments` but no gateway
  (Razorpay/Stripe) keys are configured, so bookings are created unpaid.
- **Push notifications** — requires FCM credentials; in-app notification centre
  is implemented instead.
- **Property reviews / chat with seller** — no matching backend routes.
