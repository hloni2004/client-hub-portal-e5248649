PR: Add NoCacheFilter and register it in SecurityConfig

Summary
-------
Adds a `NoCacheFilter` that sets strong no-cache headers for all `/api/*` responses and registers it in `SecurityConfig` so API responses are never cached by browsers or intermediate caches.

Files changed
-------------
- Added: `src/main/java/za/ac/styling/filter/NoCacheFilter.java`
- Modified: `src/main/java/za/ac/styling/config/SecurityConfig.java` (registered the filter)

Behavior
--------
- For any request path starting with `/api/`, response headers added:
  - `Cache-Control: no-store, no-cache, must-revalidate, private`
  - `Pragma: no-cache`
  - `Expires: 0`
- The filter is registered with filter order 3 (after rate limiting) and will run for `/api/*` URL patterns.

Testing steps
-------------
1. Start backend locally.
2. curl -I http://localhost:8080/api/products | grep -i cache-control
   - Expect to see `Cache-Control: no-store` in response headers.
3. Make a browser request (devtools -> network) to any `/api/*` endpoint and confirm the `Cache-Control` header is present and requests are served from NETWORK.

Notes
-----
- This change ensures fresh data for API responses while leaving static asset caching (handled elsewhere) intact.
- If you want a different ordering, adjust reg.setOrder(...) accordingly.

Commit message
--------------
Add NoCacheFilter to set no-cache headers for /api/* and register in SecurityConfig

