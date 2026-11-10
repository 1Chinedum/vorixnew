/* VORIX — central product data. Edit this file to manage the whole site.
   ONE object = ONE clothing design. Every colour of that design goes in its `colours` list.
   price: ONE fixed price per product, shared by every colour. Change the number and it updates
          everywhere: homepage, Collections, product view and the WhatsApp message.
          NOTE: the prices below are sample presentation prices, not confirmed VORIX prices.
   colours: C(name, swatch, mainImage, backgroundColour, [extraImages])
   sizes: ["S", "M", "L"] shows size buttons. [] hides them. */
const WHATSAPP_NUMBER = "2347076316859";
const P = "assets/images/products/";
const AVAIL = "Available to order on WhatsApp";
const C = (name, swatch, image, bg, extra = []) =>
  ({ name, swatch, image: P + image, bg, additionalImages: extra.map(x => P + x) });

const products = [
  { id: 1, name: "VORIX Wear Your Vision Tee", category: "Casual Wear", price: 22000,
    description: "A relaxed, oversized graphic tee. The VORIX wordmark sits on the chest and the bold “Wear Your Vision” artwork runs across the back. Easy to wear, hard to miss.",
    colours: [
      C("Black", "#151515", "tee-wyv-black.jpg", "#cbcbcb", []),
      C("White", "#FAFAF8", "tee-wyv-white.jpg", "#cbcbcb", []),
      C("Red", "#D9291C", "tee-wyv-red.jpg", "#cccccc", []),
      C("Yellow", "#F4EB4A", "tee-wyv-yellow.jpg", "#cbcbcb", [])
    ],
    sizes: ["S", "M", "L", "XL"], availability: AVAIL, featured: true, newArrival: true, keywords: ["t-shirt", "tee", "graphic", "streetwear", "logo"] },
  { id: 2, name: "VORIX Basketball Tank", category: "Casual Wear", price: 18000,
    description: "A sleeveless basketball-style tank with contrast trim and the vertical VORIX wordmark down the front. Sporty, light and made for layering or wearing solo.",
    colours: [
      C("Black", "#151515", "tank-black.jpg", "#cccccc", []),
      C("White", "#FAFAF8", "tank-white.jpg", "#cbcbcb", []),
      C("Red", "#D9291C", "tank-red.jpg", "#cbcbcb", ["tank-red-lifestyle.jpg"])
    ],
    sizes: ["S", "M", "L", "XL"], availability: AVAIL, featured: true, newArrival: true, keywords: ["tank", "jersey", "vest", "sleeveless", "basketball"] },
  { id: 3, name: "VORIX Racer Crop Top", category: "Casual Wear", price: 16000,
    description: "A cropped, sleeveless top with clean contrast binding and the VORIX wordmark across the chest. A confident everyday piece that pairs with almost anything.",
    colours: [
      C("Black", "#151515", "croptop-black.jpg", "#c0c3bc", []),
      C("Red", "#D9291C", "croptop-red.jpg", "#b5b5b3", []),
      C("Pink", "#E8387F", "croptop-pink.jpg", "#bbbab6", [])
    ],
    sizes: ["S", "M", "L", "XL"], availability: AVAIL, featured: true, newArrival: true, keywords: ["crop top", "tank", "top", "racer"] },
  { id: 4, name: "VORIX Quarter-Zip Sweatshirt", category: "Casual Wear", price: 38000,
    description: "A comfortable quarter-zip sweatshirt with a contrast collar, a layered hem and the VORIX logo on the chest. A polished take on everyday casual.",
    colours: [
      C("White", "#FAFAF8", "sweatshirt-white.jpg", "#434442", []),
      C("Black", "#151515", "sweatshirt-black.jpg", "#444544", [])
    ],
    sizes: ["S", "M", "L", "XL"], availability: AVAIL, featured: true, newArrival: true, keywords: ["sweatshirt", "sweater", "pullover", "quarter zip", "zip"] },
  { id: 5, name: "Red & Black Track Jacket Set", category: "Sets & Jackets", price: 55000,
    description: "A two-piece track set: a zip-up jacket with contrast panels and a VORIX crest, paired with matching shorts. Head-to-toe statement dressing.",
    colours: [
      C("Red & Black", ["#D9291C", "#151515"], "trackset-red-black.jpg", "#fefefe", [])
    ],
    sizes: ["S", "M", "L", "XL"], availability: AVAIL, featured: true, newArrival: false, keywords: ["jacket", "shorts", "set", "tracksuit", "two piece"] },
  { id: 6, name: "Black & Orange Track Set", category: "Sets & Jackets", price: 58000,
    description: "A two-piece track set featuring a zip-up jacket and matching trousers, finished with bold orange panel detailing and a VORIX crest. Sharp, sporty and distinctive.",
    colours: [
      C("Black & Orange", ["#151515", "#E9822B"], "trackset-black-orange.jpg", "#fefefe", [])
    ],
    sizes: ["S", "M", "L", "XL"], availability: AVAIL, featured: true, newArrival: false, keywords: ["jacket", "trousers", "pants", "set", "tracksuit", "two piece"] }
];

function waURL(p, colour, size) {
  const msg = "Hello VORIX, I am interested in the " + p.name + (colour && !p.name.toLowerCase().includes(colour.toLowerCase()) ? " in " + colour : "") +
    (size ? ", size " + size : "") + ". I would like to confirm its availability." +
    (typeof p.price === "number" ? " The displayed price is " + fmtPrice(p.price) + "." : "");
  return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(msg);
}
function fmtPrice(n) { return typeof n === "number" ? "₦" + n.toLocaleString("en-NG") : "Price on request"; }
