# PageForge Restaurant Studio — install

## Files
Upload these 6 frontend files into the SAME directory as your existing PageForge `index.html`:
- `config.js`
- `restaurant-builder.html`
- `restaurant-builder.js`
- `restaurant-menu.html`
- `restaurant-menu.js`
- `restaurant.css`

The SQL file is **not** uploaded to the public website. Paste `restaurant-schema.sql` into Supabase Dashboard → SQL Editor and run it once. Do not run it twice because CREATE POLICY statements are not idempotent.

## Add Restaurant Studio to existing dashboard
In your existing `index.html`, insert this link somewhere inside the logged-in editor/dashboard (`<div id="editor" ...>`):

```html
<a href="./restaurant-builder.html" class="btn">🍽️ Restaurant Studio — Create QR Menu</a>
```

The existing PageForge `script.js` and `style.css` do NOT need replacement. Authentication is shared automatically through the same Supabase project and browser origin. The link will only be visible after login because `#editor` is hidden otherwise.

## Use
1. Sign in on PageForge using its existing login.
2. Tap Restaurant Studio.
3. Create restaurant, enter reception WhatsApp number with country code (India example `919876543210`), save.
4. Tap Add Indian categories; add dishes and photos. Set original MRP and discounted price.
5. Tap Publish. Copy the permanent URL or download the QR code.
6. Customer opens public menu, searches food, adds items to cart, enters name/phone/table, taps Continue to WhatsApp and **presses Send in WhatsApp**.

## Important notes
- Host all files on the same HTTPS website/path (GitHub Pages is okay). Don't use `file://` preview for login or public QR links.
- The menu QR is permanent even when restaurant content changes.
- No secret Supabase key belongs in `config.js`.
- Public RLS allows reading only published restaurants; restaurant owners alone can modify their records. Existing `pages` table is untouched.
- Uploads are limited to 5 MB each in the restaurant bucket. Free storage/egress quotas apply.
- Uploaded images for a deleted restaurant and replaced images can remain in Storage and should be cleaned up from the dashboard; this version cleans up images on individual dish deletion.
- Order references are informational only, not guaranteed unique IDs. No orders are stored or auto-sent; WhatsApp requires the customer to press Send.
- Existing auth redirect configuration must point to your hosted PageForge URL.
- Restaurant logos are supported; cover image can be added in a future update.
- This is an MVP. Test SQL policies and publishing with two different accounts before commercial use.
