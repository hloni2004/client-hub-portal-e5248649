# Authentication (Login & Sign up)

## Overview ✅

This document summarizes how Login, Sign Up (Register), Password Reset, Token handling, and Logout are implemented in this repository. It lists the core files, UI flow, API calls, client-side state handling (Zustand), persistence, and a few security notes.

---

## Core files 🔧

- **UI pages:**
  - `src/pages/auth/Login.tsx` — Login form + validation + triggers login flow.
  - `src/pages/auth/Register.tsx` — Registration form + validation + triggers register flow.
  - `src/pages/auth/ResetPassword.tsx` — Password reset UI/flow (redirects to login after success).
- **Store & logic:**
  - `src/stores/authStore.ts` — Central auth store (Zustand) containing `login`, `register`, `logout`, `setUser`, `updateProfile`, `changePassword`.
  - `src/stores/userStore.ts` — User admin actions (create user, reset password, etc.).
- **Network layer:**
  - `src/lib/api.ts` — Axios client with request and response interceptors, refresh handling, and XSRF config.
- **Types:**
  - `src/types/index.ts` — `LoginDto`, `RegisterDto`, and `User` interface.

---

## Login flow (UI -> Store -> Server) ▶️

1. User submits the login form (`src/pages/auth/Login.tsx`):
   - Validation: `zod` schema (email format + password min length 8).
2. `login` method from `useAuthStore` is called with `{ email, password }`.
3. `authStore.login` calls `apiClient.post('/users/login', data)`.
4. Server response expected: `{ user, accessToken }` (the store reads `resp.user` and `resp.accessToken`).
5. On success, the store does `set({ user, token, isAuthenticated: true })` and persists state (`persist` middleware with name `auth-storage`).
6. Post-login side effects:
   - Attempts to sync local cart to server by calling `useCartStore.getState().syncLocalToServer()`.
   - Displays a success toast and redirects: admins to `/admin/dashboard`, others to `/`.
7. Errors from the server are bubbled as thrown Errors and shown as toast errors in the UI.

Files: `src/pages/auth/Login.tsx`, `src/stores/authStore.ts`.

---

## Registration flow (UI -> Server) 📝

1. User submits the registration form (`src/pages/auth/Register.tsx`).
   - Validation: `zod` schema with fields: `firstName`, `lastName`, `email`, `phone`, `address` fields, `password`, and `confirmPassword` (with `.refine` to ensure match).
2. The page calls `useAuthStore().register(registerData)` (which calls `apiClient.post('/users/register', data)`).
3. The register method does NOT sign in the user automatically; it returns success and the UI redirects the user to the login page with a success toast.
4. Errors are displayed via toast with message from `error.response?.data?.message` if available.

Files: `src/pages/auth/Register.tsx`, `src/stores/authStore.ts`.

---

## Password reset & forgot password 🔒

- Forgot password and reset password are implemented as a **two-step flow**:
  1. **Forgot-password** (`ForgotPasswordDialog`) — user submits their email; server issues a time-limited reset token and sends it by email (or other delivery) to the user.
  2. **Reset-password** (`src/pages/auth/ResetPassword.tsx`) — user follows the link with the token, the UI submits the token + new password to the server. The server must validate the token and expire it on use.
- After successful reset the UI redirects to `/auth/login` (some flows redirect after ~3 seconds). Ensure token validation and expiry are enforced server-side to prevent replay.

Files: `src/components/ecommerce/ForgotPasswordDialog.tsx`, `src/pages/auth/ResetPassword.tsx`.

---

## Token & Session Management (Axios + Refresh) 🔁

- `src/lib/api.ts` sets up `apiClient` with:

  - `baseURL` from `VITE_API_URL` (or fallback),
  - `Content-Type: application/json`,
  - `withCredentials: true` (expects server-set cookies, e.g., refresh token as HttpOnly cookie),
  - XSRF config: `xsrfCookieName = 'XSRF-TOKEN'` and `xsrfHeaderName = 'X-XSRF-TOKEN'`.

- Request interceptor attaches `Authorization: Bearer <token>` from `useAuthStore.getState().token` when present.

- Response interceptor behavior:
  - On 401/403 it will attempt a single refresh by POST `/users/refresh` (only once per failing request):
    - If the refresh returns a new access token (`refreshResponse.data?.accessToken`), it sets it into the store (`useAuthStore.getState().token = newAccess; useAuthStore.getState().isAuthenticated = true;`) and retries queued requests with the new token.
    - If refresh fails or returns no token, it clears/redirects to `/auth/login`.
  - Interceptor queues concurrent failed requests while refresh is in progress to avoid multiple refresh attempts.

Files: `src/lib/api.ts`.

---

## Logout flow 🚪

- `authStore.logout` calls `apiClient.post('/users/logout')` (errors ignored), then clears the volatile state: `set({ user: null, token: null, isAuthenticated: false })`.
- It also clears the cart store (`useCartStore.getState().clearCart()`) and attempts to remove `luxury-cart-storage` from `localStorage`.

Files: `src/stores/authStore.ts`.

---

## Data Types 📐

From `src/types/index.ts`:

- `LoginDto`:
  - `email: string`
  - `password: string`
- `RegisterDto` includes: `email`, `password`, `firstName`, `lastName`, optional `username`, optional `phone`. The register UI includes a larger address block as well but server DTO here lists the core fields.
- `User` interface contains fields like `userId`, `email`, `username?`, `firstName?`, `lastName?`, `phone?`, `roleName?`, `lastLogin?`, `createdAt?`.

Files: `src/types/index.ts`.

---

## Notes & Security Considerations ⚠️

- The app uses `Zustand` with `persist` (`name: 'auth-storage'`). Persisted state can end up in `localStorage` by default — be cautious storing long-lived access tokens there.
- `apiClient` uses `withCredentials: true` and a `/users/refresh` endpoint to support cookie-based refresh tokens; this is good practice if the refresh token is stored as an HttpOnly cookie on the server (preferred).
- Current code sets `accessToken` into the store and may persist it. Consider keeping only a short-lived access token in memory and relying on a refresh token stored as HttpOnly cookie on the server, to reduce XSS risk.
- XSRF protection is enabled via axios XSRF settings; ensure the server sets the `XSRF-TOKEN` cookie appropriately.

---

## Quick troubleshooting tips 🩺

- If login silently redirects to login after a while, check the refresh endpoint behavior and/or cookie domain settings.
- If `Authorization` header is not sent, verify `useAuthStore.getState().token` has the value and that `apiClient` request interceptor is executed.
- If cart doesn't sync post-login, check `useCartStore.getState().syncLocalToServer()` and error logs in console.

---

## Where to change behavior 💡

- To change validation rules: edit the Zod schemas in `src/pages/auth/Login.tsx` and `src/pages/auth/Register.tsx`.
- To change redirect logic after login: edit `src/pages/auth/Login.tsx` (lines that check `user.roleName === 'ADMIN'`).
- To change token storage/persistence: update `src/stores/authStore.ts` and how persistent `persist` is configured (e.g., blacklist `token` or use custom storage adapter).
- To modify refresh logic: update interceptors in `src/lib/api.ts`.

---

## Improvements implemented ✅

- **Removed access token from persisted storage**: Zustand `persist` now partializes state to persist only the `user` profile. Access token is kept in memory only.
- **Auth store API improvements**: Added `setToken`, `clearAuth`, and `tryRestoreSession` to manage token/state safely and to restore sessions via `/users/refresh` on app start.
- **Secure refresh logic**: Axios refresh interceptor now uses the store setters (no direct mutations), guarantees a single refresh in flight, queues concurrent failed requests, and fully clears auth on refresh failure (redirects to `/auth/login?sessionExpired=1`).
- **Logout hardening**: `logout` and `clearAuth` clear in-memory state, persisted user, and persisted cart, and handle API failures gracefully.
- **UX**: Login page shows a clear "session expired" message if redirected due to refresh failure.

## Why these changes improve security 🔐

- Keeping access tokens memory-only eliminates a large XSS attack surface when compared to storing them in `localStorage`.
- Using proper setters in Zustand ensures reactivity and prevents bugs that come from direct assignment of store internals.
- Reliable single-refresh + queueing avoids race conditions and reduces risk of sending requests with stale/invalid tokens.

---

## Concise authentication architecture summary (for docs / interviews) 🧾

- Client: React + TypeScript, state via Zustand (persisted: user profile only), requests via Axios.
- Tokens: short-lived access token (memory-only) + refresh token stored server-side in an HttpOnly cookie.
- Flow: login -> server returns access token (set in memory) & user profile (persisted); on 401/403 Axios interceptor POSTs `/users/refresh`, sets a new access token in memory and retries queued requests; on refresh failure client clears state and redirects to login.

---

If you'd like, I can also:

- Create a pull request with these changes, plus a short test for refresh behavior (recommended), or
- Add unit/integration tests that exercise `tryRestoreSession`, the refresh queueing, and logout clearing, or
- Add a short security checklist and CI check to assert we aren't persisting tokens anymore.

Which would you like next?
