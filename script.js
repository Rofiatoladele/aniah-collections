// ===== 1. YOUR PRODUCTS: add or edit items here =====
// "i" is the image file name inside the images folder (p1 means images/p1.jpg)
const PRODUCTS = [
  { id: 1, n: "Royal Ankara, 6 yards",  p: 18500, i: "p1" },
  { id: 2, n: "Floral Lace, 5 yards",   p: 45000, i: "p2" },
  { id: 3, n: "Indigo Adire, 5 yards",  p: 22000, i: "p3" },
  { id: 4, n: "Aso-oke Set",            p: 60000, i: "p4" },
  { id: 5, n: "Pink Satin Ankara",      p: 20000, i: "p5" }
];

// ===== 2. YOUR WHATSAPP NUMBER: country code first, no + sign =====
const WHATSAPP = "234XXXXXXXXXX";

const $ = s => document.querySelector(s);
const naira = n => "₦" + n.toLocaleString();
let cart = {};
try { cart = JSON.parse(localStorage.getItem("aniahCart")) || {}; } catch (e) {}

// Build the product cards
$("#grid").innerHTML = PRODUCTS.map(p => `
  <article class="card">
    <button class="heart" aria-label="Save to wishlist">♡</button>
    <div class="ph" style="--img:url(images/${p.i}.jpg)"></div>
    <div class="info">
      <h3>${p.n}</h3>
      <p>${naira(p.p)}</p>
      <button class="add" data-id="${p.id}">Add to cart</button>
    </div>
  </article>`).join("");

// Redraw the cart and save it so it survives a refresh
function update() {
  try { localStorage.setItem("aniahCart", JSON.stringify(cart)); } catch (e) {}
  const rows = PRODUCTS.filter(p => cart[p.id]);
  const count = rows.reduce((s, p) => s + cart[p.id], 0);
  const total = rows.reduce((s, p) => s + cart[p.id] * p.p, 0);
  $("#count").textContent = count;
  $("#total").textContent = naira(total);
  $("#items").innerHTML = rows.length
    ? rows.map(p => `<li>
        <div><b>${p.n}</b><br>${naira(p.p)}</div>
        <div class="qty">
          <button data-id="${p.id}" data-d="-1" aria-label="Remove one">−</button>${cart[p.id]}
          <button data-id="${p.id}" data-d="1" aria-label="Add one">+</button>
        </div></li>`).join("")
    : "<li>Your cart is empty. Add a fabric to get started.</li>";
  const msg = "Hello Aniah's Collection, I would like to order:\n" +
    rows.map(p => `${cart[p.id]} x ${p.n}`).join("\n") + "\nTotal: " + naira(total);
  $("#wa").href = `https://wa.me/${WHATSAPP}?text=` + encodeURIComponent(msg);
  $("#wa").style.display = rows.length ? "block" : "none";
}

function openCart(open) {
  $("#drawer").classList.toggle("open", open);
  $("#drawer").setAttribute("aria-hidden", !open);
  $("#overlay").hidden = !open;
}

document.addEventListener("click", e => {
  const t = e.target;
  if (t.matches(".add")) { cart[t.dataset.id] = (cart[t.dataset.id] || 0) + 1; update(); openCart(true); }
  if (t.dataset.d) {
    const id = t.dataset.id;
    cart[id] = (cart[id] || 0) + Number(t.dataset.d);
    if (cart[id] <= 0) delete cart[id];
    update();
  }
  if (t.matches(".heart")) t.textContent = t.textContent === "♡" ? "♥" : "♡";
});

$("#cartBtn").onclick = () => openCart(true);
$("#close").onclick = $("#overlay").onclick = () => openCart(false);
document.addEventListener("keydown", e => { if (e.key === "Escape") openCart(false); });

// Mobile menu
$("#menuBtn").onclick = () => {
  const show = $("#links").classList.toggle("show");
  $("#menuBtn").setAttribute("aria-expanded", show);
};

// Review slider arrows
$("#prev").onclick = () => $("#rev").scrollBy({ left: -340, behavior: "smooth" });
$("#next").onclick = () => $("#rev").scrollBy({ left: 340, behavior: "smooth" });

// Newsletter (shows a message only; connect a real service later)
$("#sub").onsubmit = e => {
  e.preventDefault();
  $("#subMsg").textContent = "Thank you for subscribing.";
  e.target.reset();
};

update();
