# Security Test Plan — E-Commerce Application

## Overview
This document lists the **security features already implemented** in the application, explains **why they matter**, and provides **step-by-step tests** (manual and automated) to validate each feature. It also includes quick remediation recommendations and references to the code locations where those features are implemented.

---

## 1) Authentication & Session Management

Features present
- JWT-based authentication with access and refresh tokens. (Files: `security/JwtUtil.java`, `security/JwtAuthenticationFilter.java`)
- Tokens sent to client as HttpOnly cookies on login. (File: `controller/UserController.java`)
- Stateless session management (SecurityConfig uses STATELESS). (File: `config/SecurityConfig.java`)

Why it matters
- JWT reduces session storage on server and supports stateless APIs.
- HttpOnly cookies mitigate XSS risks by preventing JS access to tokens.

Manual tests
- Login happy path
  1. POST /api/users/login with valid credentials. Observe response headers include `Set-Cookie` for `access_token` and `refresh_token`.
  2. Confirm cookies have `HttpOnly` and `SameSite=Lax` flags. (Browser DevTools > Network > Response Headers)
- Token usage
  1. Make an authenticated request without `Authorization` header but with cookies present — request should succeed.
  2. Try the request with cookies removed — should fail (401).
- Token expiration
  1. Reduce `security.jwt.expirationMillis` temporarily in `application.properties` to e.g., 3000 (3s). Log in and wait beyond expiry then try an authenticated request — it should fail.
  2. Validate refresh endpoint (if implemented) returns new access token when refresh cookie used.

Automated tests/tools
- Use Postman test scripts and Newman for CI tests.
- Use unit tests for JwtUtil (validate token generation and expiration).

Recommendations
- In production, set `secure=true` on cookies and use `SameSite=Strict` if feasible.
- Keep `security.jwt.secret` in env and rotate regularly.

---

## 2) Password Security

Features present
- BCrypt password hashing for all user passwords (`SecurityConfig.passwordEncoder()`, `UserFactory` hashes on create). (Files: `config/SecurityConfig.java`, `factory/UserFactory.java`)
- Password strength validation on create. (File: `util/ValidationHelper.java`)
- Password reset with secure token + OTP with expiry. (Files: `service/PasswordResetService.java`, entity `PasswordResetToken`)

Tests
- Password storage
  1. Create a user and confirm the `users.password` column stores a BCrypt hash (starts with `$2a$` or `$2b$`).
- Password verification
  1. Attempt login with wrong password — should 401.
  2. Attempt password reset flow: request token for email, verify token creativity/expiry, use token to set new password, then login with new password.
- Password policy validation
  1. Attempt to register with weak password — should be rejected.

Automated tests/tools
- Unit tests for password hashing/verification.
- Integration tests for password reset flow.

Recommendations
- Enforce rate limits on password reset and login endpoints (already rate-limited for login via `RateLimitFilter`).
- Consider account lockout after multiple failed attempts.

---

## 3) Rate Limiting & Abuse Protection

Features present
- IP-based rate limiting using Bucket4j (`RateLimitFilter`) with special rules for login and uploads. (File: `filter/RateLimitFilter.java`)

Tests
- Login rate-limiting
  1. Send > 5 login attempts/min from the same IP — the endpoint should return 429.
- Upload rate-limiting
  1. Post > 3 uploads (or review create posts) within a minute — expect 429.

Automated tests/tools
- Use a simple script (curl loop) or Gatling load scenario to trigger limits.

Recommendations
- Monitor rate limit metrics and tune per traffic patterns.

---

## 4) CORS and CSRF

Features present
- CORS is configured to allow known frontend origins and allow credentials. (File: `config/CorsConfig.java`)
- CSRF protection is disabled at Spring Security level because auth is token-based; front-end has XSRF token config for safe usage of non-idempotent requests. (File: `config/SecurityConfig.java`, `client: src/lib/api.ts`)

Tests
- CORS
  1. From an allowed origin (e.g., `http://localhost:8081`) call `/api/*` — should be allowed.
  2. From other origins — should be blocked by the browser (CORS preflight) or return no credentials.
- CSRF
  1. Verify that cookie-based login is used and the client sets XSRF token (client axios configured with xsrfCookieName and header name). Confirm server behavior on state-changing requests from other origins.

Recommendations
- If HttpOnly cookies are used, consider enabling CSRF with double-submit cookie pattern or sameSite=strict.

---

## 5) Input Validation & Business Logic Checks

Features present
- Validation utility for usernames, emails, password strength, phone formats (File: `util/ValidationHelper.java`).
- Domain factories (e.g., `UserFactory`) perform validation on create.
- Controllers check existence and validity of referenced entities (e.g., product, size, colour) before operations such as add-to-cart, checkout.

Tests
- Attempt invalid inputs for registration, product creation, cart operations — endpoints should return 4xx.
- Try SQL injection payloads in text fields (simple tests) — queries use parameter binding via JPA so injection should fail; confirm by testing.

Automated tests/tools
- Fuzzing with OWASP ZAP or Burp to detect validation gaps.

Recommendations
- Harden validation where user-generated HTML or file uploads are accepted.

---

## 6) Inventory & Business Logic Safety (Anti-Race)

Features present
- Inventory checks in checkout flow and stock reservation/commit logic in `InventoryService`.

Tests
- Simulate concurrent checkout attempts to ensure `reserveStock` fails in case of insufficient stock (returns informative 400 with `INSUFFICIENT_STOCK`).

Recommendations
- Add integration tests for concurrent order processing.

---

## 7) Content Security & HTTPS

Features present / TODOs
- Security config refers to an HTTPS enforcement filter and a CSP filter (check or implement these before production). (File: `config/SecurityConfig.java` references filters)

Tests
- Confirm application served over HTTPS in production (HSTS header present).
- Review CSP headers and tighten to block inline scripts where possible.

Recommendations
- Add or verify existing `CspFilter` to set a restrictive CSP.
- Enforce HTTPS (HSTS) and set `secure=true` on cookies in production.

---

## 8) Password Reset & Email Security

Features present
- Password reset uses a one-time token and optional OTP, with expiration and used flag (`PasswordResetToken` entity).
- Email sending is asynchronous for order confirmations (non-blocking).

Tests
- Request password reset and attempt token reuse; token should be single-use and expired after time window.

---

## 9) Additional Recommendations
- Secrets & configuration
  - Ensure `security.jwt.secret` and other secrets are not checked into source control and are loaded from environment variables in production.
- Cookie hardening
  - Use `secure=true` in production and consider `SameSite=Strict` for auth cookies.
- Logging & monitoring
  - Add audit logs for authentication events (login success/fail, password resets, admin actions).
- WAF & vulnerability scanning
  - Run regular scans (OWASP ZAP) and consider WAF rules in front of the app.

---

## Tools & Test Scripts suggested
- Postman / Newman (API functional tests)
- curl (quick manual checks)
- OWASP ZAP / Burp Suite (security scanning and fuzzing)
- sqlmap (SQL injection tests - use only on test/staging)
- GitHub Actions / Jenkins for integration tests

---

## Quick Checklist (can be used for PR reviews or deploy gating)
- [ ] JWT secret configured in environment for production
- [ ] Cookies `secure=true` in production
- [ ] Rate limits configured for critical endpoints
- [ ] Password reset token expiry and single-use verified
- [ ] CSP header present and tested in browsers
- [ ] All major endpoints return proper 4xx/5xx on invalid/malicious input
- [ ] Automated security pipeline (OWASP ZAP) runs on PRs and nightly

---

## References (code locations)
- JWT: `src/main/java/za/ac/styling/security/JwtUtil.java`, `JwtAuthenticationFilter.java`
- Auth controller: `src/main/java/za/ac/styling/controller/UserController.java`
- Rate limiting: `src/main/java/za/ac/styling/filter/RateLimitFilter.java`
- Password reset: `src/main/java/za/ac/styling/service/PasswordResetService.java` and `domain/PasswordResetToken.java`
- Validation helpers: `src/main/java/za/ac/styling/util/ValidationHelper.java`
- CORS config: `src/main/java/za/ac/styling/config/CorsConfig.java`
- Security config: `src/main/java/za/ac/styling/config/SecurityConfig.java`
- Cart & checkout protections: `src/main/java/za/ac/styling/controller/CartController.java`, `CheckoutController.java`

---

If you want, I can:
- Generate a checklist as a GitHub issue template, or
- Create Postman collections and automated Newman tests for the authentication and checkout security checks.

Which would you like me to prepare next?