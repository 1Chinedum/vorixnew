# VORIX website
Open `index.html` in any browser. No install or build step.

## Replace the logo
Replace `assets/images/logo.png` (same name; a transparent PNG with dark lettering works on the light site). `logo-light.png` is a white version for dark backgrounds. Favicon: `assets/icons/favicon.png`.

## Replace homepage photography
Hero: `assets/images/hero.jpg`. Editorial/brand photos: `assets/images/brand/` (`brand-01.jpg` homepage, `brand-02.jpg` and `brand-03.jpg` About page). Keep the file names or edit the `src` in the HTML.

## Add or edit products (all in `js/products.js`)
One object in the `products` array = ONE clothing design. Its colours live inside it, so a shirt in four colours is still one card.
1. Save every colour photo in `assets/images/products/` (e.g. `shirt-black.jpg`, `shirt-white.jpg`).
2. Copy a product object, give it a new unique `id`, and edit `name`, `category`, `description`.
3. List each colour with `C("Colour name", swatch, "file.jpg", "#backgroundHex", ["extra-photo.jpg"])`.
   - `swatch` is the colour dot: one hex like `"#151515"`, or two for two-tone: `["#D9291C", "#151515"]`.
   - `"#backgroundHex"` is the colour at the edge of the photo (it fills any empty space around tall images).
   - The extra photos list is optional (`[]` if none). Extra photos appear in the slider under that colour.
4. `price`: ONE fixed price per product, shared by every colour (a number like `25000`, or `null` for "Price on request").
5. `sizes`: `["M", "L", "XL"]` shows size buttons; `[]` hides them. `availability`: any text.
6. `featured: true` shows it on the homepage (first 8). `newArrival: true` adds it to New Arrivals.
7. `category` creates the homepage tile and the Collections filter automatically.
To change a price or description later, just edit that product's line.
The prices in the file are sample presentation prices (not confirmed VORIX prices). Change any price by editing that one number: it updates everywhere automatically.

## Change WhatsApp details
In `js/products.js` change `WHATSAPP_NUMBER` (international format, no +, e.g. `2347076316859`). Also edit the visible number `07076316859` in `contact.html` (the `tel:` link and text) and in the footer of each HTML page.
