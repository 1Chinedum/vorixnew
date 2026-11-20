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
All prices in the file are the official VORIX prices (see PRICE_UPDATES.md). To change a price, edit that one number: it updates everywhere automatically.

## Change WhatsApp details
In `js/products.js` change `WHATSAPP_NUMBER` (international format, no +, e.g. `2347076316859`). Also edit the visible number `07076316859` in `contact.html` (the `tel:` link and text) and in the footer of each HTML page.

## Product photo slider (autoplay)
In the full-screen product view the photos change automatically every 3 seconds with a fade. The interval is `AUTOPLAY_MS` (3000) near the top of the product-view code in `js/collections.js`. Autoplay pauses while the pointer is over the photo (desktop), while a finger is on it (mobile), and when the tab is hidden. It stops when the view closes, never runs for single-photo products, and is switched off for visitors who prefer reduced motion. Arrows, dots, colour swatches, keyboard arrows and swipes all work and restart the 3-second countdown.

## Social media links
Open `js/products.js` and edit `SOCIAL_LINKS` at the top: put the official VORIX Instagram, TikTok and Facebook profile addresses between the quotes. The three "Follow" cards on the homepage update automatically and open in a new tab. Until you replace them, each card opens that platform's home page.

## Order / enquiry page (order.html)
Every "Order Now" button opens `order.html?product=ID&colour=NAME&size=SIZE&qty=N`. The page reads the product, price and photos straight from `js/products.js` (nothing is repeated on the page), shows the selected colour, size and quantity, totals the price, and on "Submit Order via WhatsApp" opens WhatsApp at the number in `WHATSAPP_NUMBER` with the full order message ready to send. The customer must press Send in WhatsApp; nothing is sent automatically. Invalid or unknown product links show a friendly "couldn't find that product" message.

## Shopping bag (cart.html)
- **Add to Cart** is on every product card and in the full-screen product view. Cards ask for a size first when a product has sizes; the product view also has a quantity control.
- The bag is saved in the browser (`localStorage`), so it survives page changes, refreshes and closing the browser. Only the product number, colour, size, quantity and tick state are saved. Names, photos and **prices are always read from `js/products.js`**, so changing a price there updates every bag.
- On `cart.html` customers tick the items to order now. Totals count ticked items only, and **Proceed to Checkout** opens `order.html?cart=1` with only those items. Unticked items stay in the bag. WhatsApp only ever receives the ticked items.
- After sending, the checkout page offers "remove these items from my bag". Items are never removed automatically, because the order isn't confirmed until the customer presses Send in WhatsApp.
- Delivery fee: set `DELIVERY_FEE` in `js/products.js` (for example `3000`). Leave it `null` to show "To be confirmed".
- Note: if you open the files straight from a folder, some browsers (for example Firefox) store data separately for each file, which can empty the bag when changing pages. Chrome and Edge work, and any normal web hosting works in every browser.
