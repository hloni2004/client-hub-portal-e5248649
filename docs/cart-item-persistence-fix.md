# Cart Item Persistence Fix

## Summary
When users added products to the cart, the `cart` rows were created in the database but `cart_item` rows were not. This caused the checkout to fail and the cart to appear empty on the server-side.

## Root Causes
1. Frontend payload issues
   - The frontend sometimes sent incomplete payloads (missing `quantity`) or incorrect `sizeId` keys.
   - Guest cart items were stored locally and never synced to the server; checkout reads server-side cart only.
2. Backend persistence issues
   - `Cart` was sometimes created without an initialized `items` list.
   - `CartItem` instances were created but not always linked to the `Cart` before save.
   - `addItemToCart` was not transactional in places and sometimes directly saved `CartItem` without ensuring `cart.getItems()` contained the item.
3. A syntax error in `Profile.tsx` broke reorder flow and hid payload problems.

## Fixes Applied
### Backend
- Ensure `Cart.items` is `@OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true)`.
- Ensure `CartItem.cart` is `@ManyToOne`.
- `CartController.addItemToCart`:
  - Initialize `cart.items = new ArrayList<>()` when creating a cart.
  - Create `CartItem`, set `cartItem.setCart(cart)`, add to `cart.getItems()`, and save the cart (`cartService.update(cart)`).
  - Mark `@Transactional` to ensure atomic commits.
- Ensure `CartService` returns carts with items (fetch join query handled in repository).

### Frontend
- `src/stores/ecommerce/cartStore.ts`
  - Use `useAuthStore.getState().user` to get current user instead of `localStorage['user']`.
  - Always send payload with: `{ userId, productId, colourId, sizeId, quantity }`.
  - Add `syncLocalToServer()` which posts all local items to `/carts/add-item` upon login or checkout.
- `src/stores/authStore.ts`
  - On successful login, call `syncLocalToServer()` to persist guest-cart items.
- `src/pages/ecommerce/Profile.tsx`
  - Fixed syntax error in `handleReorder` and ensured `quantity` is included.
- `src/pages/ecommerce/Checkout.tsx`
  - Call `syncLocalToServer()` before fetching cart/checkout data.

## Verification Steps
1. Add item as guest, then log in — check network tab for `/carts/add-item` calls and verify `cart_item` rows in DB.
2. Add item as logged-in user — check `cart_item` table for persisted items.
3. Reorder from profile — verify items are added to cart and show in UI.
4. Proceed to checkout and place order — verify `orders` and `order_items` are created and cart is deleted.

## Recommended Follow-ups
- Delete the old admin user with plaintext password and restart backend to recreate hashed admin (DataInitializer already changed to use hashed password).
- Add unit/integration tests for `addItemToCart` and the checkout flow.
- Add temporary server-side debug logs for `/carts/add-item` to confirm production traffic correctness (remove later).

---

If you want, I can run the end-to-end verification and collect the network requests and DB rows as evidence. Let me know which environment to run the tests in (local or staging).