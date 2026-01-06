# Registration and Login Flow (Technical Overview)

This document explains how user registration and login work across the **React frontend** and **Spring Boot backend** in this project.

---

## 1. High-Level Architecture

- **Frontend (React + Vite)**: `client-hub-portal-e5248649`

  - State management: Zustand store in [`src/stores/authStore.ts`](../src/stores/authStore.ts)
  - Auth pages:
    - Login: [`src/pages/auth/Login.tsx`](../src/pages/auth/Login.tsx)
    - Register: [`src/pages/auth/Register.tsx`](../src/pages/auth/Register.tsx)
  - HTTP client: Axios instance in [`src/lib/api.ts`](../src/lib/api.ts)

- **Backend (Spring Boot)**: `E_Commerce`
  - Controller: [`src/main/java/za/ac/styling/controller/UserController.java`](../../E_Commerce/src/main/java/za/ac/styling/controller/UserController.java)
  - Service: [`src/main/java/za/ac/styling/service/impl/UserServiceImpl.java`](../../E_Commerce/src/main/java/za/ac/styling/service/impl/UserServiceImpl.java)
  - Security:
    - Security config: [`SecurityConfig`](../../E_Commerce/src/main/java/za/ac/styling/config/SecurityConfig.java)
    - JWT filter: [`JwtAuthenticationFilter`](../../E_Commerce/src/main/java/za/ac/styling/security/JwtAuthenticationFilter.java)

Auth is **stateless**: access is controlled with JWTs; Spring Security sessions are disabled.

---

## 2. Registration Flow

### 2.1 Frontend: Register Page

File: [`src/pages/auth/Register.tsx`](../src/pages/auth/Register.tsx)

1. **Form & Validation**

   - Uses `react-hook-form` + `zod` (`registerSchema`) for validation.
   - Fields include personal info (first/last name, phone, address) and credentials (email, password, confirm password).
   - Password rules:
     - At least 8 characters
     - Must contain uppercase, lowercase, and a number
   - Confirms that `password === confirmPassword`.

2. **Submit Handler**

   - On submit, the component calls the `register` function from the Zustand auth store:
     - Source: [`authStore.register`](../src/stores/authStore.ts)
   - It sends a `POST /api/users/register` request via the Axios client.
   - If successful:
     - Shows a success toast: “Registration successful! Please log in.”
     - Redirects user to `/auth/login`.
   - **Important**: The frontend does **not** auto-login the user after registration.

3. **State Handling**
   - Registration itself does not mutate `user` or `token` in the auth store.
   - Authentication state is only set during login or session refresh.

### 2.2 Backend: Registration Endpoint

File: [`UserController.register`](../../E_Commerce/src/main/java/za/ac/styling/controller/UserController.java)

1. **Endpoint**

   - `POST /api/users/register`
   - Accepts a `RegisterRequest` JSON body (email, password, first name, last name, username, phone, etc.).

2. **Validation & Uniqueness Checks**

   - Returns `400 Bad Request` if email or password are missing.
   - Uses `UserService` to check:
     - If email already exists → returns `409 Conflict` with message “User with this email already exists”.
     - If username already exists (when provided) → `409 Conflict` with message “Username already taken”.

3. **Role Assignment**

   - Looks up default role `CUSTOMER` via `RoleService`.
   - If it doesn’t exist, it creates a new `Role` record with role name `CUSTOMER`.

4. **Password Hashing & User Creation**

   - Password is hashed using `BCryptPasswordEncoder`.
   - A new `User` entity is built and saved via `UserService.create`.
   - `isActive` is set to `true` by default.

5. **Response**
   - On success, returns a JSON body indicating success and user details.
   - **No JWT tokens or cookies are issued** during registration.

---

## 3. Login Flow

### 3.1 Frontend: Login Page

File: [`src/pages/auth/Login.tsx`](../src/pages/auth/Login.tsx)

1. **Form & Validation**

   - Uses `react-hook-form` + `zod` (`loginSchema`).
   - Fields: `email`, `password`.
   - Validates:
     - Email has valid format.
     - Password length ≥ 8.

2. **Submit Handler**

   - On submit, calls `login` from the auth store:
     - `await login({ email, password })`.
   - After successful login:
     - Reads `user` from `useAuthStore.getState()`.
     - If `user.roleName === 'ADMIN'` → navigates to `/admin/dashboard`.
     - Else → navigates to `/` (main storefront/home).
   - On error:
     - Shows a toast with the backend error message or a generic “Login failed” message.

3. **Session Expiry Handling**
   - If the user is redirected to `/auth/login?sessionExpired=1`, the component detects the query parameter and shows a toast: “Your session expired. Please sign in again.”

### 3.2 Frontend: Auth Store (State + API Calls)

File: [`src/stores/authStore.ts`](../src/stores/authStore.ts)

The Zustand store manages `user`, `token`, and `isAuthenticated`.

Key behaviours:

1. **State Shape**

   - `user: User | null` – non-sensitive user profile, persisted to `localStorage`.
   - `token: string | null` – **access token stored in memory only**, not persisted.
   - `isAuthenticated: boolean` – derived from `token` and login status.

2. **login(data: LoginDto)**

   - Calls `POST /api/users/login` via `apiClient`.
   - Backend responds with:
     - `user` (a `UserResponse` DTO)
     - `accessToken` (JWT string) – same as the cookie token but also returned in the JSON body.
   - Store updates:
     - `set({ user })` – persists user profile to `localStorage` via `zustand/persist`.
     - `setToken(accessToken)` – stored **only in memory** for attaching `Authorization` headers.
     - `set({ isAuthenticated: true })`.
   - After login, it attempts to sync any local cart data to the server (`syncLocalToServer` in `cartStore`).

3. **register(data: RegisterDto)**

   - Sends `POST /users/register`.
   - Does **not** automatically log in the user.

4. **tryRestoreSession()**

   - Intended to run on app startup (called in `App.tsx`).
   - Calls `POST /users/refresh`.
   - If refresh succeeds:
     - Reads `accessToken` and `user` from the response.
     - Calls `setToken(accessToken)` (memory-only).
     - Updates `user` if provided.
     - Sets `isAuthenticated = true`.
   - If refresh fails or returns no token:
     - Clears `user`, `token`, and `isAuthenticated`.
     - Clears `auth-storage` from `localStorage` to avoid stale UI.

5. **logout()**

   - Calls `POST /users/logout` (backend endpoint not shown here but expected to clear cookies).
   - Clears `user`, `token`, `isAuthenticated`.
   - Clears cart state and related persisted storage.
   - Removes `auth-storage` and `luxury-cart-storage` from `localStorage`.

6. **clearAuth()**
   - Similar to `logout` but **does not** call the logout endpoint.
   - Used when refresh fails and we need to force the client into a logged-out state.

### 3.3 Frontend: API Client & Token Handling

File: [`src/lib/api.ts`](../src/lib/api.ts)

1. **Base Axios Client**

   - `baseURL` points to the backend API (Render or configured via `VITE_API_URL`).
   - `withCredentials: true` so that HttpOnly cookies (`access_token`, `refresh_token`) are sent automatically.

2. **Request Interceptor**

   - Reads `token` from `useAuthStore.getState().token`.
   - If present, sets `Authorization: Bearer <token>` header on outgoing requests.

3. **Response Interceptor & Auto-Refresh**
   - For **401/403** responses (unauthorized/forbidden), excluding auth-specific endpoints (`/users/login`, `/users/register`, `/users/refresh`, `/users/logout`, and password reset flows):
     - It attempts a refresh by calling `POST /users/refresh`.
     - On successful refresh:
       - Updates the auth store with new `accessToken` and (optionally) updated `user`.
       - Replays all queued failed requests with the new Authorization header.
     - On failure:
       - Calls `clearAuth('refresh_failed')` on the store.
       - Redirects to `/auth/login?sessionExpired=1`.

This design lets you combine **HttpOnly cookies** for security with an in-memory `Authorization` header for convenience.

---

## 4. Backend: Login & JWT Handling

### 4.1 Login Endpoint

File: [`UserController.login`](../../E_Commerce/src/main/java/za/ac/styling/controller/UserController.java)

1. **Endpoint**

   - `POST /api/users/login`
   - Accepts `LoginRequest` with `email` and `password`.

2. **Validation**

   - Returns `400 Bad Request` if email/password missing.
   - Looks up user by email via `UserService.findByEmail`.
   - If user not found → `401 Unauthorized` with message “Invalid email or password”.
   - If user `isActive == false` → `403 Forbidden` (“Account is inactive”).

3. **Password Check**

   - Uses `BCryptPasswordEncoder.matches(rawPassword, hashedPassword)`.
   - If it fails → `401 Unauthorized` with “Invalid email or password”.

4. **Building UserResponse DTO**

   - Maps `User` entity to a lightweight `UserResponse` object.
   - Includes fields such as `userId`, `firstName`, `lastName`, `email`, `phone`, and `roleName`.

5. **JWT Creation & Cookies**

   - The `subject` of the token is the `userId` (as a string).
   - Role is read from `user.getRole().getRoleName()` or defaults to `CUSTOMER`.
   - `JwtUtil` creates:
     - **Access token** (short-lived, e.g. 15 minutes)
     - **Refresh token** (long-lived, e.g. 7 days)
   - Two HttpOnly cookies are set:
     - `access_token` cookie:
       - `httpOnly: true`
       - `secure: request.isSecure()`
       - `path: /`
       - `maxAge: 900` seconds (15 minutes)
       - `SameSite=None`
     - `refresh_token` cookie:
       - `httpOnly: true`
       - `secure: request.isSecure()`
       - `path: /api/users/refresh`
       - `maxAge: 7 days`
       - `SameSite=None`

6. **Response Body**
   - Includes:
     - `user`: `UserResponse` DTO
     - `accessToken`: the same JWT as in the `access_token` cookie

The frontend uses the `accessToken` in memory for `Authorization` headers while the cookies support silent refresh.

### 4.2 JWT Authentication Filter

File: [`JwtAuthenticationFilter`](../../E_Commerce/src/main/java/za/ac/styling/security/JwtAuthenticationFilter.java)

For every incoming request:

1. Tries to read a token from the `Authorization: Bearer <token>` header.
2. If none, falls back to the `access_token` cookie.
3. If a token is found and `jwtUtil.validateToken(token)` is `true`:
   - Gets subject (`userId`) and roles from the token.
   - Converts roles to `SimpleGrantedAuthority` instances (e.g. `ROLE_ADMIN`, `ROLE_CUSTOMER`).
   - Builds a `UsernamePasswordAuthenticationToken` with these authorities.
   - Stores it in `SecurityContextHolder`, making the user authenticated for downstream controllers.

### 4.3 Security Configuration

File: [`SecurityConfig`](../../E_Commerce/src/main/java/za/ac/styling/config/SecurityConfig.java)

Key points:

- `SessionCreationPolicy.STATELESS` – no HTTP session is used.
- Form login and basic auth are disabled.
- `/api/users/register`, `/api/users/login`, `/api/users/refresh`, and password-reset endpoints are `permitAll`.
- All other `/api/**` endpoints require a valid JWT (either via header or cookie).

---

## 5. How It All Fits Together

1. **User registers** on the React frontend → POST `/api/users/register` → new user with role `CUSTOMER` is saved in the DB, but they are **not logged in yet**.
2. **User logs in** using email + password → POST `/api/users/login`:
   - Backend validates credentials and issues:
     - `accessToken` (JWT) in JSON response and in `access_token` cookie.
     - `refresh_token` cookie for long-lived sessions.
   - Frontend stores `user` (persisted) and `accessToken` (memory-only), sets `isAuthenticated = true`.
3. **Subsequent API calls** from the frontend automatically include:
   - `Authorization: Bearer <accessToken>` (from Zustand state).
   - Cookies (`access_token`, `refresh_token`) due to `withCredentials: true`.
4. **When access token expires**:
   - Backend returns `401/403` for protected endpoints.
   - Axios interceptor calls `/users/refresh` to get a new `accessToken` using the `refresh_token` cookie.
   - On success, store is updated and the original requests are retried.
   - On failure, auth state is cleared and the user is redirected to the login page.

This gives you a secure, stateless authentication system with:

- Hashed passwords (BCrypt)
- HttpOnly cookies for tokens
- Memory-only access tokens on the frontend
- Automatic token refresh and graceful session expiry handling.
