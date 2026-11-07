const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const naira = n => "₦" + Number(n).toLocaleString("en-NG");
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clone = o => JSON.parse(JSON.stringify(o));
const ls = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d } catch (e) { return d } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) { toast("Browser storage is full") } },
  del(k) { try { localStorage.removeItem(k) } catch (e) {} }
};
let admin = false;
try { admin = sessionStorage.getItem("ac_admin") === "1" } catch (e) {}
let data = (admin && ls.get("ac_draft", null)) || clone(SITE);
let cart = ls.get("ac_cart", {}), wish = ls.get("ac_wish", {});
let filter = new URLSearchParams(location.search).get("cat") || "all", editing = null, proof = null, order = null, curSlot = null;
const CLS = { ankara: "s1", "joggers-women": "s2", "joggers-men": "s3", jewelry: "s4" };
const find = id => data.products.find(p => p.id === id);
const bgi = u => u ? `style="background-image:url('${u}')"` : "";
const saveDraft = () => ls.set("ac_draft", data);
function toast(t) { const e = $("#toast"); e.textContent = t; e.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove("on"), 2200) }
function shrink(file, max, cb) {
  const r = new FileReader();
  r.onload = () => { const i = new Image(); i.onload = () => {
    const k = Math.min(1, max / Math.max(i.width, i.height)), c = document.createElement("canvas");
    c.width = i.width * k; c.height = i.height * k; c.getContext("2d").drawImage(i, 0, 0, c.width, c.height);
    cb(c.toDataURL("image/jpeg", .82)) }; i.src = r.result };
  r.readAsDataURL(file);
}

/* ---------- shop ---------- */
const card = p => `<article class="p"><button class="heart" data-w="${p.id}" aria-label="Save ${esc(p.name)}">♡</button>
<div class="slot ${CLS[p.cat] || "s1"}${p.img ? " has" : ""}" ${bgi(p.img)}></div><h3>${esc(p.name)}</h3>
<div class="price">${naira(p.price)}</div><button class="add" data-a="${p.id}">Add to cart</button>
${admin ? `<div class="ctl"><button data-e="${p.id}">Edit</button><button data-d="${p.id}">Delete</button></div>` : ""}</article>`;
function renderShop() {
  const page = $("#catTitle");
  if (!CATS.some(c => c[0] === filter) || !page) filter = "all";
  const tabs = $("#tabs");
  if (tabs) tabs.innerHTML = CATS.map(([k, l]) => `<button class="${k === filter ? "on" : ""}" data-f="${k}">${l}</button>`).join("");
  let list = data.products.filter(p => filter === "all" || p.cat === filter);
  if (!page) list = list.slice(0, 8);
  else {
    const t = filter === "all" ? "All products" : CATS.find(c => c[0] === filter)[1];
    $("#catTitle").textContent = t; document.title = t + " | Aniah’s Collection";
    $("#catSub").textContent = list.length + (list.length === 1 ? " item" : " items");
    try { history.replaceState(null, "", filter === "all" ? "shop.html" : "shop.html?cat=" + filter) } catch (e) {}
  }
  $("#grid").innerHTML = list.length ? list.map(card).join("") : `<p class="hint">Nothing here yet. Check back soon.</p>`;
  render();
}
function render() {
  const ids = Object.keys(cart).filter(i => cart[i] > 0 && find(i)); let t = 0, n = 0;
  $("#items").innerHTML = ids.length ? ids.map(i => { const p = find(i); t += p.price * cart[i]; n += cart[i];
    return `<div class="it"><div class="th slot ${CLS[p.cat] || "s1"}${p.img ? " has" : ""}" ${bgi(p.img)}></div>
<div class="nm">${esc(p.name)}<br><b>${naira(p.price)}</b></div>
<div class="q"><button data-m="${i}" aria-label="Fewer">−</button>${cart[i]}<button data-pl="${i}" aria-label="More">+</button></div></div>` }).join("")
    : `<p class="hint">Your cart is empty. Add a piece you love.</p>`;
  $("#total").textContent = naira(t); $("#cc").textContent = n; render.total = t;
  $("#wc").textContent = Object.keys(wish).filter(i => wish[i] && find(i)).length;
  $$(".heart").forEach(h => { const on = wish[h.dataset.w]; h.classList.toggle("on", !!on); h.textContent = on ? "♥" : "♡" });
  ls.set("ac_cart", cart); ls.set("ac_wish", wish);
}
function slots() {
  $$("[data-slot]").forEach(el => {
    const u = data.images[el.dataset.slot];
    if (u) { el.style.backgroundImage = `url("${u}")`; el.classList.add("has") }
    const old = el.querySelector(".up"); if (old) old.remove();
    if (admin) { const b = document.createElement("button"); b.className = "up"; b.textContent = "Upload photo";
      b.onclick = ev => { ev.preventDefault(); ev.stopPropagation(); curSlot = el; $("#file").click() }; el.appendChild(b) }
  });
}
$("#file").onchange = e => { const f = e.target.files[0]; if (!f || !curSlot) return;
  shrink(f, 1200, d => { data.images[curSlot.dataset.slot] = d; saveDraft(); slots(); toast("Photo updated") }); e.target.value = "" };

/* ---------- clicks ---------- */
const drawer = v => { $("#drawer").classList.toggle("on", v); $("#shade").classList.toggle("on", v) };
document.addEventListener("click", e => {
  const t = e.target.closest("button,a"); if (!t) return; const d = t.dataset;
  if (d.cat) { filter = d.cat; renderShop() }
  if (d.f) { filter = d.f; renderShop() }
  if (d.a) { cart[d.a] = (cart[d.a] || 0) + 1; render(); toast("Added to cart") }
  if (d.pl) { cart[d.pl]++; render() }
  if (d.m) { if (--cart[d.m] <= 0) delete cart[d.m]; render() }
  if (d.w) { wish[d.w] = !wish[d.w]; render(); toast(wish[d.w] ? "Saved to wishlist" : "Removed from wishlist") }
  if (d.e) { const p = find(d.e); editing = p.id; $("#pn").value = p.name; $("#pp").value = p.price; $("#pc").value = p.cat; $("#adm").hidden = false; $("#pn").focus() }
  if (d.d) { if (d.sure) { data.products = data.products.filter(p => p.id !== d.d); delete cart[d.d]; saveDraft(); renderShop() } else { d.sure = 1; t.textContent = "Confirm?" } }
  if (d.copy) { try { navigator.clipboard.writeText(d.copy); toast("Copied") } catch (er) { toast(d.copy) } }
});
$("#cartBtn").onclick = () => drawer(true);
$("#close").onclick = $("#shade").onclick = () => drawer(false);
$("#wishBtn").onclick = () => { const n = Object.keys(wish).filter(i => wish[i] && find(i)).length; toast(n ? n + " saved item" + (n > 1 ? "s" : "") : "No saved items yet") };

/* ---------- checkout: delivery, bank transfer, proof ---------- */
const step = n => [1, 2, 3].forEach(i => { $("#f" + i).hidden = i !== n; $("#s" + i).classList.toggle("on", i === n) });
const closeCo = () => $("#co").classList.remove("on");
$("#checkout").onclick = () => { if (!render.total) return toast("Your cart is empty"); drawer(false); step(1); $("#co").classList.add("on") };
$("#coX").onclick = closeCo; $("#back").onclick = () => step(1);
document.addEventListener("keydown", e => { if (e.key === "Escape") { closeCo(); drawer(false) } });
$("#f1").onsubmit = e => {
  e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
  const items = Object.keys(cart).filter(i => cart[i] > 0 && find(i)).map(i => ({ name: find(i).name, qty: cart[i], sum: find(i).price * cart[i] }));
  order = { ref: "AC-" + Date.now().toString().slice(-6), items, total: render.total, customer: f, date: new Date().toISOString() };
  $("#sum").innerHTML = items.map(i => `<div class="ln"><span>${i.qty} × ${esc(i.name)}</span><span>${naira(i.sum)}</span></div>`).join("") + `<div class="ln tt"><span>Total to pay</span><span>${naira(order.total)}</span></div>`;
  const b = CONFIG.bank;
  $("#bank").innerHTML = `<div class="ln"><span>Bank</span><b>${esc(b.name)}</b></div>
<div class="ln"><span>Account number</span><b>${esc(b.number)} <button type="button" class="mini" data-copy="${esc(b.number)}">Copy</button></b></div>
<div class="ln"><span>Account name</span><b>${esc(b.accountName)}</b></div>
<div class="ln"><span>Transfer narration</span><b>${order.ref} <button type="button" class="mini" data-copy="${order.ref}">Copy</button></b></div>`;
  $("#sendHint").textContent = `On your phone, choose WhatsApp and send to ${CONFIG.whatsappDisplay}.`;
  proof = null; $("#proofIn").value = ""; $("#pfn").textContent = "No file chosen"; $("#send").disabled = true; step(2);
};
$("#proofIn").onchange = e => { proof = e.target.files[0] || null; $("#pfn").textContent = proof ? proof.name : "No file chosen"; $("#send").disabled = !proof };
function orderText() {
  const c = order.customer;
  return `New order ${order.ref}\n` + order.items.map(i => `${i.qty} x ${i.name} (${naira(i.sum)})`).join("\n") +
    `\nTotal: ${naira(order.total)}\n\nName: ${c.name}\nPhone: ${c.phone}\nAddress: ${c.address}, ${c.city}, ${c.state}` +
    (c.notes ? `\nNotes: ${c.notes}` : "") + `\n\nI have paid by bank transfer. Payment proof attached.`;
}
$("#send").onclick = async () => {
  if (!proof) return; const text = orderText(); let manual = false;
  try {
    if (navigator.canShare && navigator.canShare({ files: [proof] })) await navigator.share({ files: [proof], text, title: "Order " + order.ref });
    else throw new Error("no-file-share");
  } catch (er) {
    if (er && er.name === "AbortError") return;
    manual = true; window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`, "_blank");
  }
  const all = ls.get("ac_orders", []); all.push({ ...order, status: "Awaiting confirmation" }); ls.set("ac_orders", all);
  $("#done").innerHTML = `<h2>Order ${order.ref} received</h2><p>Status: <b>Awaiting payment confirmation</b></p>
<p>We will check your transfer and confirm it before we process your delivery. We will contact you on ${esc(order.customer.phone)}.</p>
<p>${manual ? "WhatsApp opened with your order details. Attach your payment screenshot to that chat and send it, so we can confirm your payment." : `Make sure the message reached ${CONFIG.whatsappDisplay} on WhatsApp.`}</p>
<button class="btn" type="button" id="doneBtn">Back to shop</button>`;
  $("#doneBtn").onclick = closeCo; cart = {}; render(); step(3);
};

/* ---------- newsletter + testimonials ---------- */
$("#nf").onsubmit = e => { e.preventDefault(); $("#msg").textContent = "Thank you. " + $("#em").value + " is on the list."; $("#em").value = "" };
if ($("#track")) {
  const tr = $("#track"), stepW = () => tr.firstElementChild.offsetWidth + 20;
  $("#tn").onclick = () => { tr.scrollLeft + stepW() >= tr.scrollWidth - tr.clientWidth - 5 ? tr.scrollTo(0, 0) : tr.scrollBy(stepW(), 0) };
  $("#tp").onclick = () => { tr.scrollLeft < 5 ? tr.scrollTo(tr.scrollWidth, 0) : tr.scrollBy(-stepW(), 0) };
}

/* ---------- owner panel ---------- */
$("#pc").innerHTML = CATS.slice(1).map(([k, l]) => `<option value="${k}">${l}</option>`).join("");
$("#admX").onclick = () => $("#adm").hidden = true;
const showOwner = () => { if (location.hash === "#" + CONFIG.ownerHash) $("#adm").hidden = false };
showOwner(); addEventListener("hashchange", showOwner);
$("#pin").onsubmit = e => { e.preventDefault();
  if ($("#pinIn").value !== CONFIG.ownerPin) return toast("Wrong PIN");
  admin = true; try { sessionStorage.setItem("ac_admin", "1") } catch (er) {}
  data = ls.get("ac_draft", null) || clone(SITE); $("#pinIn").value = ""; adminUI() };
$("#pi").onchange = e => $("#pname").textContent = e.target.files[0] ? e.target.files[0].name : "";
$("#pf").onsubmit = e => { e.preventDefault();
  const v = { name: $("#pn").value.trim(), price: Number($("#pp").value), cat: $("#pc").value };
  const finish = img => {
    if (editing) Object.assign(find(editing), v, img ? { img } : {}); else data.products.unshift({ id: "p" + Date.now(), ...v, img: img || "" });
    saveDraft(); editing = null; e.target.reset(); $("#pname").textContent = ""; renderShop(); toast("Saved. Download products.js to publish it.") };
  const f = $("#pi").files[0]; f ? shrink(f, 800, finish) : finish("") };
const fileText = d => "// Your products and site photos. The owner panel's Publish button rewrites this file.\nconst SITE = " + JSON.stringify(d, null, 1) + ";\n";
$("#exp").onclick = () => {
  const b = new Blob([fileText(data)], { type: "text/javascript" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "products.js"; a.click() };
$("#rst").onclick = () => { ls.del("ac_draft"); data = clone(SITE); editing = null; adminUI(); toast("Changes discarded") };


/* ---------- publish to GitHub ---------- */
const b64 = s => btoa(unescape(encodeURIComponent(s)));
const say = t => $("#pubmsg").textContent = t;
function ghFetch(path, opts = {}) {
  const g = ls.get("ac_gh", {});
  return fetch(`https://api.github.com/repos/${g.user}/${g.repo}/contents/${path}` + (opts.method === "PUT" ? "" : `?ref=${g.branch}`),
    { ...opts, headers: { Authorization: "Bearer " + g.token, Accept: "application/vnd.github+json" } });
}
async function put(path, content, msg) {
  const g = ls.get("ac_gh", {}); let sha;
  const h = await ghFetch(path);
  if (h.ok) sha = (await h.json()).sha;
  else if (h.status !== 404) throw new Error(`GitHub error ${h.status}. Check your username, repository name and token.`);
  const r = await ghFetch(path, { method: "PUT", body: JSON.stringify({ message: msg, content, branch: g.branch, ...(sha ? { sha } : {}) }) });
  if (!r.ok) throw new Error(`Could not save ${path} (error ${r.status}). Does the token have Contents: Read and write?`);
}
$("#pub").onclick = async () => {
  const old = ls.get("ac_gh", {});
  const g = { user: $("#ghu").value.trim(), repo: $("#ghr").value.trim(), branch: $("#ghb").value.trim() || "main", token: $("#ght").value.trim() || old.token || "" };
  if (!g.user || !g.repo || !g.token) return say("Fill in your GitHub username, repository name and token.");
  ls.set("ac_gh", g); $("#pub").disabled = true;
  try {
    const out = clone(data); let n = 0;
    const up = async (du, name) => { const path = `images/${name}-${Date.now().toString(36)}.jpg`; say(`Uploading photo ${++n}...`); await put(path, du.split(",")[1], "Add photo " + name); return path };
    for (const p of out.products) if ((p.img || "").startsWith("data:")) p.img = await up(p.img, p.id);
    for (const k of Object.keys(out.images)) if (out.images[k].startsWith("data:")) out.images[k] = await up(out.images[k], k);
    say("Saving products..."); await put("products.js", b64(fileText(out)), "Update products");
    data = out; saveDraft(); renderShop(); slots();
    say("Published. Your website updates in 1 to 2 minutes. Refresh the site then.");
  } catch (e) { say(e.message || "Publish failed. Please try again.") }
  $("#pub").disabled = false;
};
function adminUI() { const g = ls.get("ac_gh", {}); $("#ghu").value = g.user || ""; $("#ghr").value = g.repo || ""; $("#ghb").value = g.branch || "main"; $("#ght").placeholder = g.token ? "Token saved on this device" : "GitHub token"; $("#pin").hidden = admin; $("#tools").hidden = !admin; slots(); renderShop() }
adminUI();
