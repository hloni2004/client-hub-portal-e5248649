# Security Plan and Implementation Guide 🔒

This document describes how the application implements security controls and recommendations to make the frontend and backend secure, resilient, and maintainable. It's intended as a living document: keep it up to date with architecture, dependencies, and deployment changes.

---

## 1. Overview

- Scope: Frontend (React + Vite), Backend (Spring Boot APIs in E_Commerce module), Storage (Supabase), CI/CD pipelines.  
- Goals: Ensure confidentiality, integrity, availability, and traceability of user data and system behavior.

---

## 2. Authentication & Authorization ✅

Frontend:
- Use JWTs issued by the backend on sign-in. Prefer storing tokens in **HTTP-only, Secure cookies** (not localStorage) when the frontend and API share a domain — this reduces XSS risk.
- If tokens are stored in cookies, implement CSRF protection (double-submit cookie or CSRF token endpoints) or use SameSite=Lax/Strict as appropriate.

Decision (JWT + cookie strategy):
- Use **JWT stored in HTTP-only, Secure cookies** with **SameSite=Lax** for normal browsing. Require a CSRF token for POST/PUT/DELETE requests.
- Reason: reduces XSS risk compared to localStorage and is compatible with an SPA front-end and Spring Boot backend.
- Token lifecycle: **Access token** short-lived (e.g., 15 minutes). **Refresh token** long-lived (e.g., 7 days), rotated on refresh and stored in an HTTP-only cookie. Refresh endpoint issues a new access token and a rotated refresh token.

**Note:** in development we may set cookie Secure=false; in production ensure `Secure=true`, `HttpOnly=true`, and `SameSite=Lax` or `Strict` as required.

Backend:
- Use Spring Security to validate JWTs and enforce roles/authorities (ROLE_ADMIN, ROLE_USER, etc.).
- Protect endpoints with method-level security (`@PreAuthorize`) where appropriate.
- Implement rate limiting per IP or per user for sensitive endpoints (login, review create, image upload) — use libraries like Bucket4j or a Redis-backed approach.

Rate Limiting Rules (suggested):
- `POST /api/auth/login` → 5 requests / minute / IP
- `POST /api/reviews/create` → 10 requests / minute / user
- `POST /api/uploads` → 3 requests / minute / user
- Apply stricter limits for administrative endpoints and increase logging/alerting on repeated throttling.

Session & 2FA:
- Consider optional 2FA for admin users or high-value accounts.

---

## Spring Security Configuration (example)

- **Session management**: stateless (SessionCreationPolicy.STATELESS) for APIs.
- **Filter order**: register a `JwtAuthenticationFilter` **before** `UsernamePasswordAuthenticationFilter` to validate access tokens for each request.
- **Method-level security**: enable `@EnableMethodSecurity` and use `@PreAuthorize` for fine-grained control.
- **CSRF**: when using cookies for auth, enable CSRF protection and use a `CookieCsrfTokenRepository` or equivalent; if purely token-based (Authorization: Bearer) for non-cookie flows, CSRF can be configured differently.

Minimal configuration snippet (Spring Boot 3 style):

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http, JwtAuthenticationFilter jwtFilter) throws Exception {
    http
      .csrf(csrf -> csrf.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse()))
      .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
      .authorizeHttpRequests(auth -> auth
          .requestMatchers("/api/admin/**").hasRole("ADMIN")
          .anyRequest().permitAll()
      )
      .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
    return http.build();
  }
}
```

- Provide a dedicated `/api/auth/refresh` endpoint to handle refresh token rotation securely.

## 3. Passwords & Accounts 🔐

- Hash passwords with a strong algorithm (bcrypt or Argon2) using secure parameters (salt + cost).  
- Enforce password policies and lockout on repeated failed logins.
- Never log full passwords or secrets.

---

## 4. API Security & Transport Layer 🚦

- Enforce HTTPS everywhere (TLS 1.2+). In deployment, enable HSTS and redirect HTTP to HTTPS.
- Use strict CORS settings on backend (allow known origins only).
- Validate and sanitize all inputs on server side using strong validation libraries (e.g., Bean Validation with DTOs in Spring Boot, or libraries like Joi for Node if used).
- Return minimal error information to clients—avoid leaking internal details.

Content-Security-Policy (CSP) — example baseline:

- `default-src 'self'`
- `img-src 'self' https://*.supabase.co https://images.unsplash.com`  
- `script-src 'self'`  
- `style-src 'self' 'unsafe-inline'`  
- `object-src 'none'`

Apply CSP via HTTP response headers (e.g., `Content-Security-Policy`) or via a middleware/filter in the backend. Keep the policy minimal and extend it only for necessary third-party domains.

---

## 5. Image Uploads & Media Handling (reviews, product images) 🖼️

Server-side checks (already partly implemented):
- Accept images only if content-type matches `image/*` and check actual mime by examining file headers.
- Limit file size (e.g., 5 MB) and number of files (e.g., max 5 per review).
- Strip EXIF metadata and re-encode images server-side to safe formats (JPEG/PNG) to reduce risks of embedded exploits.
- Scan uploaded images for malware if possible (optional automation step).
- Store images in Supabase (or cloud storage) and use `supabaseUrl` to serve images. Use signed URLs (time-limited) for private images if required.

Supabase Storage Strategy:
- **Public bucket**: product catalog images (browsable by any user). OK to serve via public URLs for performance and caching.
- **Private bucket**: review images (if moderation or privacy is needed). Serve these using short-lived signed URLs (e.g., 5–15 minutes expiry) to prevent leakage.
- **Naming hygiene**: generate storage paths server-side using product/review IDs and random UUIDs to avoid collisions or accidental reuse of the same path.

Client-side:
- Render images using `supabaseUrl` or validated base64/legacy URLs. Use `onError` fallback images. Prefer `https://` and avoid injecting untrusted `data:` URLs unless validated.

---

## 6. File & Path Security

- Avoid serving uploaded files directly from the server filesystem; prefer object storage (Supabase storage) with controlled access.
- Never allow users to specify storage paths directly. Generate storage paths server-side with safe prefixes.

---

## 7. Secrets & Environment Variables 🔑

- Do NOT commit secrets to repository. Use environment variables or secret stores (GitHub Secrets, Azure Key Vault, AWS Secrets Manager, or Hashicorp Vault).
- Local dev: use `.env.local` but add it to `.gitignore` and provide an `.env.example` with placeholders.
- CI: use encrypted secrets and avoid printing secrets in job logs.

---

## 8. Dependency & Supply-chain Security 🛡️

- Enable Dependabot or similar automatic dependency update tooling.
- Run `npm audit` and `mvn dependency:check` regularly. Use Snyk or OWASP Dependency-Check in CI.
- Periodically scan containers with Trivy or similar.

---

## 9. CI/CD Security Checks 🔁

Add pipeline steps to:
- Run tests and linting.  
- Run static analysis & SAST tools (SpotBugs, SonarQube, or Snyk).  
- Run dependency vulnerability scan (Snyk/OWASP ZAP for web scans).  
- Ensure PRs require reviews before merging; protect main branches and require passing checks.

Example GitHub Actions steps:
- Checkout, install, run `npm test`, run `mvn -DskipTests=false test`, then run `snyk test` and `trivy` scanning.

---

## 10. Logging, Monitoring & Incident Response 📈

- Use structured logs with appropriate log levels. Mask or redact any sensitive data (PII, tokens) from logs.
- Send logs to centralized system (ELK, Datadog, or similar) and set alerts for suspicious activity (excess failed logins, spikes in error rates).
- Prepare an incident response checklist: we must revoke keys, rotate secrets, identify affected users, and notify stakeholders.

---

## Error Handling & API Responses

- Use a **consistent error DTO** structure (timestamp, correlationId, status, error, message, path) for all API errors.
- **Do not** return stack traces or internal exception messages to clients in production; log them server-side with a correlation ID.
- Return appropriate HTTP status codes (400, 401, 403, 404, 429, 500) and a user-friendly message.
- Include a `X-Correlation-ID` (or `correlationId`) header to trace requests across services; surface this in logs for faster incident triage.

---

## 11. Testing & QA ✅

- Add unit and integration tests for security-critical logic (auth, file uploads, RBAC checks).  
- Add automated integration tests to reproduce attacks (e.g., SQL injection attempts should be blocked, malformed file uploads rejected).
- Use OWASP ZAP in CI for automated dynamic scans.

---

## 12. Platform & Deployment Hardening ⚙️

- Harden OS and container images (keep minimal base images and patch regularly).
- Use read-only file systems for containers where possible and least privilege for services.
- Run services under non-root users.

---

## 13. Quick Action Checklist (Prioritized) ✅

1. [High] Enforce HTTPS + HSTS on deployed domains.  
2. [High] Use HTTP-only secure cookies for tokens OR ensure robust XSS protections if using localStorage.  
3. [High] Add server-side file validation (type, size, count) and EXIF stripping for image uploads.  
4. [High] Add CORS restrictions and Content-Security-Policy headers.  
5. [Medium] Add Dependabot + run Snyk in CI.  
6. [Medium] Add rate limiting for auth and upload endpoints.  
7. [Low] Consider 2FA for admin accounts.

---

## Threats We Explicitly Mitigate

- **Cross-Site Scripting (XSS)** → mitigations: CSP, HTTP-only cookies for tokens, input/output encoding.
- **Cross-Site Request Forgery (CSRF)** → mitigations: SameSite cookies + CSRF tokens or double-submit cookie strategy.
- **SQL Injection (SQLi)** → mitigations: use JPA/parameterized queries, input validation, and ORM-level protections.
- **File upload attacks** → mitigations: MIME/type checks, size limits, EXIF stripping, re-encoding, malware scanning.
- **Brute force / credential stuffing** → mitigations: rate limiting, account lockout, and strong password policies.
- **Supply-chain attacks** → mitigations: Dependabot/Snyk, CI vulnerability scans, pinned dependency versions where necessary.

---

## 14. Notes Specific to this Codebase

- Backend uses Spring Boot and stores review/product images in Supabase; prefer storing and serving using Supabase `supabaseUrl`, use signed URLs for restricted access and validate uploads in `ReviewController`.  
- Frontend already handles base64 and Supabase URLs; ensure `src` uses `https://` and not unsafe `data:` unless explicitly validated.
- Add Spring Security if not already present; use `JwtAuthenticationFilter` and role-based `@PreAuthorize` checks.

---

## 15. References & Tools

- OWASP Top 10, CSRF, XSS, SQLi guides  
- Tools: Dependabot, Snyk, OWASP ZAP, Trivy, Bucket4j

---

## 16. Next steps

- Add practical code/config examples to the document (Spring Security config, CSP header configuration, GitHub Actions YAML for scans).  
- Run automated scans and remediate high/critical findings.

---

## Implemented changes (code)

The following high-priority fixes were implemented in the repository:

- Spring Security basic integration (`SecurityConfig`) with JWT filter (`JwtAuthenticationFilter`) and CSRF via cookies.
- JWT utilities (`JwtUtil`) for access and refresh tokens (configurable via `application.properties`).
- Login/refresh/logout endpoints updated to set `access_token` and `refresh_token` as HTTP-only cookies (`UserController`).
- File upload validation for reviews (size and MIME checks) in `ReviewController`.
- CSP header filter (`CspFilter`) and rate-limiting filter (`RateLimitFilter` using Bucket4j`), registered in `SecurityConfig`.
- Global exception handler that emits a correlation ID and a consistent error DTO (`GlobalExceptionHandler`).
- Frontend Axios client updated to use cookies for auth, automatic CSRF header support, and automatic refresh flow (`src/lib/api.ts`).
- GitHub Actions `security-scans.yml` and Dependabot config added.

> Notes:
> - In development the auth cookies are set with `Secure=false` for convenience; **set `Secure=true` in production** and provide a real `JWT_SECRET` via environment variables.

---

*Created as an initial security plan — treat as living doc and update as the architecture and requirements evolve.*
