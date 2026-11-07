const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const naira = n => "₦" + Number(n).toLocaleString("en-NG");
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clone = o => JSON.parse(JSON.stringify(o));
const ls = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d } catch (e) { return d } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) { toast("Browser storage is full") } },
  del(k) { try { localStorage.removeItem(k) } catch (e) {} }
};
const INBLOG = /\/blog\/[^/]*$/.test(location.pathname);
const ROOT = INBLOG ? "../" : "";
const U = u => /^(data:|https?:|\/)/.test(u) ? u : ROOT + u;
const PAGE = INBLOG ? "post" : (location.pathname.split("/").pop().replace(".html", "") || "index");

/* ---------- defaults (used when products.js has no value yet) ---------- */
const DEF_SIZES = {
  women: "XS, 60-65, 150-160\nS, 66-71, 155-165\nM, 72-77, 160-170\nL, 78-85, 162-172\nXL, 86-93, 165-175\nXXL, 94-101, 165-178",
  men: "S, 71-76, 165-172\nM, 77-82, 170-177\nL, 83-90, 173-180\nXL, 91-99, 175-183\nXXL, 100-109, 178-188\nXXXL, 110-119, 180-190"
};
const DEF_SEO = {
  url: "", name: "Aniah’s Collection", auto: true, robots: "", sitemap: "", llms: "",
  about: "Aniah’s Collection sells Ankara fabrics and styles, joggers for men and women, and jewelry, with delivery across Nigeria.",
  pages: {
    index: { title: "Aniah’s Collection | Ankara, Joggers & Jewelry in Nigeria", desc: "Shop Ankara fabrics and styles, joggers for men and women, and jewelry from Aniah’s Collection. Pay by bank transfer, delivery across Nigeria.", keywords: "ankara fabric, ankara styles, joggers for men, joggers for women, jewelry, Lagos", focus: "ankara" },
    shop: { title: "Shop Ankara, Joggers & Jewelry | Aniah’s Collection", desc: "Browse all Ankara prints, men’s and women’s joggers and jewelry. Order online and pay by bank transfer.", keywords: "buy ankara, buy joggers online, jewelry Nigeria", focus: "joggers" },
    "size-guide": { title: "Jogger Size Guide for Men & Women | Aniah’s Collection", desc: "Find your jogger size by waist and height. Size charts in cm and inches for men and women.", keywords: "jogger size guide, waist size chart, joggers size", focus: "size guide" },
    blog: { title: "Style Journal | Aniah’s Collection", desc: "Style tips, fabric guides and news from Aniah’s Collection.", keywords: "ankara style tips, fashion blog Nigeria", focus: "ankara style" }
  }
};
function norm(d) {
  d.images = d.images || {}; d.alts = d.alts || {}; d.texts = d.texts || {}; d.posts = d.posts || []; d.removed = d.removed || []; d.products = d.products || [];
  d.sizes = Object.assign({}, DEF_SIZES, d.sizes || {});
  const s = d.seo || {}; d.seo = Object.assign({}, DEF_SEO, s, { pages: Object.assign({}, DEF_SEO.pages, s.pages || {}) });
  return d;
}
let admin = false;
try { admin = sessionStorage.getItem("ac_admin") === "1" } catch (e) {}
let data = norm((admin && ls.get("ac_draft", null)) || clone(SITE));
let cart = ls.get("ac_cart", {}), wish = ls.get("ac_wish", {}), sizes = ls.get("ac_sizes", {});
let filter = new URLSearchParams(location.search).get("cat") || "all";
let editing = null, editPost = null, curSlot = null, proof = null, order = null, editMode = false;
const CLS = { ankara: "s1", "joggers-women": "s2", "joggers-men": "s3", jewelry: "s4" };
const ALT0 = { hero: "Aniah’s Collection Ankara, joggers and jewelry", c1: "Ankara prints and styles", c2: "Joggers for women", c3: "Joggers for men", c4: "Jewelry", craft: "A tailor at work", gift: "Gift ideas" };
const find = id => data.products.find(p => p.id === id);
const sizeKey = cat => cat === "joggers-women" ? "women" : cat === "joggers-men" ? "men" : null;
const saveDraft = () => ls.set("ac_draft", data);
const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "post";
function toast(t) { const e = $("#toast"); e.textContent = t; e.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove("on"), 2400) }
function shrink(file, max, cb) {
  const r = new FileReader();
  r.onload = () => { const i = new Image(); i.onload = () => {
    const k = Math.min(1, max / Math.max(i.width, i.height)), c = document.createElement("canvas");
    c.width = i.width * k; c.height = i.height * k; c.getContext("2d").drawImage(i, 0, 0, c.width, c.height);
    cb(c.toDataURL("image/jpeg", .82)) }; i.src = r.result };
  r.readAsDataURL(file);
}

/* ---------- size charts ---------- */
const rng = s => String(s || "").split("-").map(x => parseFloat(x)).filter(x => !isNaN(x));
const parseSizes = t => String(t || "").split("\n").map(l => l.split(",").map(x => x.trim())).filter(r => r[0]).map(r => ({ size: r[0], w: rng(r[1]), h: rng(r[2]) }));
const inch = a => a.map(x => Math.round(x / 2.54)).join("-");
const sizeTable = t => `<thead><tr><th>Size</th><th>Waist (cm)</th><th>Waist (in)</th><th>Height (cm)</th></tr></thead><tbody>${parseSizes(t).map(r => `<tr><td><b>${esc(r.size)}</b></td><td>${r.w.join("-")}</td><td>${inch(r.w)}</td><td>${r.h.join("-")}</td></tr>`).join("")}</tbody>`;
const suggest = (t, w) => { const rows = parseSizes(t); if (!w || !rows.length) return null; return rows.find(r => r.w.length && w <= (r.w[1] || r.w[0])) || rows[rows.length - 1] };
function renderSizes() { if ($("#sgWomen")) { $("#sgWomen").innerHTML = sizeTable(data.sizes.women); $("#sgMen").innerHTML = sizeTable(data.sizes.men) } }

/* ---------- images ---------- */
function paintSlot(el) {
  const k = el.dataset.slot, u = data.images[k]; let img = el.querySelector("img.ph");
  if (u) { if (!img) { img = document.createElement("img"); img.className = "ph"; el.prepend(img) } img.src = U(u); img.alt = data.alts[k] || ALT0[k] || ""; el.classList.add("has") }
  else { if (img) img.remove(); el.classList.remove("has") }
}
function slots() {
  $$("[data-slot]").forEach(el => {
    paintSlot(el); const o = el.querySelector(".upbar"); if (o) o.remove();
    if (admin) { const b = document.createElement("div"); b.className = "upbar"; b.innerHTML = '<button data-sl="up">Change photo</button><button data-sl="alt">Alt text</button><button data-sl="rm">Remove</button>'; el.appendChild(b) }
  });
}
$("#file").onchange = e => { const f = e.target.files[0]; if (!f || !curSlot) return;
  shrink(f, 1200, d => { data.images[curSlot.dataset.slot] = d; saveDraft(); paintSlot(curSlot); toast("Photo updated") }); e.target.value = "" };
const pslot = p => `<div class="slot ${CLS[p.cat] || "s1"}${p.img ? " has" : ""}">${p.img ? `<img class="ph" src="${U(p.img)}" alt="${esc(p.alt || p.name)}" loading="lazy">` : ""}</div>`;

/* ---------- shop ---------- */
const card = p => `<article class="p"><button class="heart" data-w="${p.id}" aria-label="Save ${esc(p.name)}">♡</button>${pslot(p)}<h3>${esc(p.name)}</h3>
<div class="price">${naira(p.price)}</div>${sizeKey(p.cat) ? `<a class="sgl" href="${ROOT}size-guide.html">Size guide</a>` : ""}<button class="add" data-a="${p.id}">Add to cart</button>
${admin ? `<div class="ctl"><button data-e="${p.id}">Edit</button><button data-d="${p.id}">Delete</button></div>` : ""}</article>`;
function renderShop() {
  const page = $("#catTitle");
  if (!CATS.some(c => c[0] === filter) || !page) filter = "all";
  const tabs = $("#tabs");
  if (tabs) tabs.innerHTML = CATS.map(([k, l]) => `<button class="${k === filter ? "on" : ""}" data-f="${k}">${l}</button>`).join("");
  let list = data.products.filter(p => filter === "all" || p.cat === filter);
  if (!$("#grid")) return;
  if (!page) list = list.slice(0, 8);
  else {
    $("#catTitle").textContent = filter === "all" ? "All products" : CATS.find(c => c[0] === filter)[1];
    if (filter !== "all") document.title = $("#catTitle").textContent + " | " + data.seo.name;
    $("#catSub").textContent = list.length + (list.length === 1 ? " item" : " items");
    try { history.replaceState(null, "", filter === "all" ? "shop.html" : "shop.html?cat=" + filter) } catch (e) {}
  }
  $("#grid").innerHTML = list.length ? list.map(card).join("") : `<p class="hint">Nothing here yet. Check back soon.</p>`;
  render();
}
function render() {
  const ids = Object.keys(cart).filter(i => cart[i] > 0 && find(i)); let t = 0, n = 0;
  $("#items").innerHTML = ids.length ? ids.map(i => { const p = find(i); t += p.price * cart[i]; n += cart[i];
    return `<div class="it"><div class="th">${pslot(p)}</div><div class="nm">${esc(p.name)}<br><b>${naira(p.price)}</b></div>
<div class="q"><button data-m="${i}" aria-label="Fewer">−</button>${cart[i]}<button data-pl="${i}" aria-label="More">+</button></div></div>` }).join("")
    : `<p class="hint">Your cart is empty. Add a piece you love.</p>`;
  $("#total").textContent = naira(t); $("#cc").textContent = n; render.total = t;
  $("#cartBtn").classList.toggle("blink", n === 0); $("#nudge").hidden = n !== 0;
  $("#wc").textContent = Object.keys(wish).filter(i => wish[i] && find(i)).length;
  $$(".heart").forEach(h => { const on = wish[h.dataset.w]; h.classList.toggle("on", !!on); h.textContent = on ? "♥" : "♡" });
  ls.set("ac_cart", cart); ls.set("ac_wish", wish);
}

/* ---------- blog ---------- */
const md = t => esc(t || "").split(/\n{2,}/).map(b => { b = b.trim(); if (!b) return "";
  if (b.startsWith("## ")) return `<h2>${b.slice(3)}</h2>`; if (b.startsWith("# ")) return `<h2>${b.slice(2)}</h2>`;
  return `<p>${b.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>")}</p>` }).join("");
const postHTML = p => `<div class="kick">${esc(p.date || "")}</div><h1>${esc(p.title)}</h1>${p.img ? `<img class="cover" src="${U(p.img)}" alt="${esc(p.alt || p.title)}">` : ""}<div class="body">${md(p.body)}</div><p><a class="btn line" href="${ROOT}blog.html">← Back to the blog</a></p>`;
const curPost = () => { const slug = new URLSearchParams(location.search).get("p") || location.pathname.split("/").pop().replace(".html", ""); return data.posts.find(x => x.slug === slug) };
function renderBlog() {
  const el = $("#posts"); if (!el) return;
  const list = [...data.posts].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  el.innerHTML = list.length ? list.map(p => `<a class="pc" href="${p.live ? `${ROOT}blog/${p.slug}.html` : `${ROOT}post.html?p=${p.slug}`}"><div class="slot s1${p.img ? " has" : ""}">${p.img ? `<img class="ph" src="${U(p.img)}" alt="${esc(p.alt || p.title)}" loading="lazy">` : ""}</div><div class="kick">${esc(p.date || "")}</div><h3>${esc(p.title)}</h3><p>${esc(p.excerpt || "")}</p><span class="more">Read more →</span></a>`).join("") : `<p class="hint">No posts yet. Check back soon.</p>`;
}
function renderPost() {
  const el = $("#post"); if (!el) return; const p = curPost();
  if (p) el.innerHTML = postHTML(p); else if (!el.textContent.trim()) el.innerHTML = `<h1>Post not found</h1><p><a class="btn line" href="${ROOT}blog.html">Back to the blog</a></p>`;
}

/* ---------- SEO ---------- */
const setMeta = (n, c) => { if (!c) return; let m = document.querySelector(`meta[name="${n}"]`); if (!m) { m = document.createElement("meta"); m.name = n; document.head.appendChild(m) } m.content = c };
function applySEO() {
  let t, d, k;
  if (PAGE === "post") { const p = curPost(); if (p) { t = p.metaTitle || p.title + " | " + data.seo.name; d = p.metaDesc || p.excerpt; k = p.keywords } }
  else { const g = data.seo.pages[PAGE]; if (g) { t = g.title; d = g.desc; k = g.keywords } }
  if (t) document.title = t; setMeta("description", d); setMeta("keywords", k);
}
const PATHS = { index: "/", shop: "/shop.html", "size-guide": "/size-guide.html", blog: "/blog.html" };
function seoBlock(key, o = {}) {
  const s = data.seo, g = Object.assign({}, s.pages[key], o), site = (s.url || "").replace(/\/$/, ""), path = o.path || PATHS[key] || "/";
  const t = esc(g.title || s.name), d = esc(g.desc || ""), url = site ? site + path : "";
  let h = `<title>${t}</title>\n<meta name="description" content="${d}">\n`;
  if (g.keywords) h += `<meta name="keywords" content="${esc(g.keywords)}">\n`;
  if (url) h += `<link rel="canonical" href="${url}">\n<meta property="og:url" content="${url}">\n`;
  h += `<meta property="og:title" content="${t}">\n<meta property="og:description" content="${d}">\n<meta property="og:type" content="${o.type || "website"}">\n<meta property="og:site_name" content="${esc(s.name)}">\n`;
  if (site) h += `<meta property="og:image" content="${site}/images/logo.png">\n`;
  h += `<meta name="twitter:card" content="summary">\n`;
  if (key === "index") h += `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "Store", name: s.name, description: s.about, url: site || undefined, logo: site ? site + "/images/logo.png" : undefined, areaServed: "NG" })}<\/script>\n`;
  return "<!--seo-->\n" + h + "<!--/seo-->";
}
function genSitemap() {
  const site = (data.seo.url || "").replace(/\/$/, ""), today = new Date().toISOString().slice(0, 10);
  const urls = ["/", "/shop.html", "/size-guide.html", "/blog.html", ...CATS.slice(1).map(c => "/shop.html?cat=" + c[0]), ...data.posts.map(p => `/blog/${p.slug}.html`)];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` + urls.map(u => `  <url><loc>${esc(site + u)}</loc><lastmod>${today}</lastmod></url>`).join("\n") + `\n</urlset>\n`;
}
const genRobots = () => "User-agent: *\nAllow: /\n" + (data.seo.url ? `\nSitemap: ${data.seo.url.replace(/\/$/, "")}/sitemap.xml\n` : "");
function genLlms() {
  const s = data.seo, site = (s.url || "").replace(/\/$/, "");
  return `# ${s.name}\n\n> ${s.about}\n\n## Pages\n- [Home](${site}/): ${s.pages.index.desc}\n- [Shop](${site}/shop.html): ${s.pages.shop.desc}\n- [Size guide](${site}/size-guide.html): ${s.pages["size-guide"].desc}\n- [Blog](${site}/blog.html): ${s.pages.blog.desc}\n` +
    (data.posts.length ? `\n## Blog posts\n${data.posts.map(p => `- [${p.title}](${site}/blog/${p.slug}.html): ${p.excerpt || ""}`).join("\n")}\n` : "") +
    (data.products.length ? `\n## Products\n${data.products.map(p => `- ${p.name}: ${naira(p.price)} (${(CATS.find(c => c[0] === p.cat) || ["", p.cat])[1]})`).join("\n")}\n` : "");
}

/* ---------- editable text (owner only) ---------- */
const SKIP = "#grid,#posts,#post,#tabs,table,.adm,.modal,.drawer,.toast,.stars,.cnt,.heart,.add,.upbar,.ctl,.price,.arr,.x,button,#catTitle,#catSub,script,style,.sgl";
const editables = () => $$("header nav a,header .nudge,.bar,main *,footer *").filter(el => !el.children.length && el.textContent.trim() && !el.closest(SKIP));
function applyTexts() { editables().forEach(el => { const o = el.textContent.trim(); el.dataset.o = o; if (data.texts[o]) el.textContent = data.texts[o] }) }
function setEdit(on) { editMode = on; editables().forEach(el => { if (on) { el.contentEditable = "true"; el.classList.add("ed") } else { el.removeAttribute("contenteditable"); el.classList.remove("ed") } }) }
document.addEventListener("focusout", e => { const el = e.target; if (!editMode || !el.dataset || el.dataset.o === undefined) return;
  const v = el.textContent.trim(), o = el.dataset.o; if (v && v !== o) data.texts[o] = v; else delete data.texts[o]; saveDraft() });
document.addEventListener("keydown", e => { if (editMode && e.key === "Enter" && e.target.classList && e.target.classList.contains("ed")) { e.preventDefault(); e.target.blur() } });
document.addEventListener("click", e => { if (editMode && e.target.closest(".ed")) e.preventDefault() }, true);

/* ---------- "added to cart" flashing pop-up ---------- */
function popAdd(p) {
  const e = $("#pop"); e.innerHTML = `<span class="dot"></span><span><b>Added:</b> ${esc(p.name)}</span><button type="button" class="mini" data-vc="1">View cart</button><button type="button" class="px" data-pc="1" aria-label="Close">×</button>`;
  e.classList.remove("on"); void e.offsetWidth; e.classList.add("on");
  clearTimeout(popAdd.t); popAdd.t = setTimeout(() => e.classList.remove("on"), 7000);
}

/* ---------- clicks ---------- */
const drawer = v => { $("#drawer").classList.toggle("on", v); $("#shade").classList.toggle("on", v) };
document.addEventListener("click", e => {
  const t = e.target.closest("button,a"); if (!t) return; const d = t.dataset;
  if (d.f) { filter = d.f; renderShop() }
  if (d.a) { cart[d.a] = (cart[d.a] || 0) + 1; render(); popAdd(find(d.a)) }
  if (d.vc) { $("#pop").classList.remove("on"); drawer(true) }
  if (d.pc) $("#pop").classList.remove("on")
  if (d.pl) { cart[d.pl]++; render() }
  if (d.m) { if (--cart[d.m] <= 0) delete cart[d.m]; render() }
  if (d.w) { wish[d.w] = !wish[d.w]; render(); toast(wish[d.w] ? "Saved to wishlist" : "Removed from wishlist") }
  if (d.e) { const p = find(d.e); editing = p.id; $("#pn").value = p.name; $("#pp").value = p.price; $("#pc").value = p.cat; $("#pa").value = p.alt || ""; openPanel("prod"); $("#pn").focus() }
  if (d.d) { if (d.sure) { data.products = data.products.filter(p => p.id !== d.d); delete cart[d.d]; saveDraft(); renderShop() } else { d.sure = 1; t.textContent = "Confirm?" } }
  if (d.copy) { try { navigator.clipboard.writeText(d.copy); toast("Copied") } catch (er) { toast(d.copy) } }
  if (d.sl) { const el = t.closest("[data-slot]"), k = el.dataset.slot;
    if (d.sl === "up") { curSlot = el; $("#file").click() }
    if (d.sl === "alt") { const v = prompt("Describe this photo (for Google and screen readers):", data.alts[k] || ALT0[k] || ""); if (v !== null) { data.alts[k] = v.trim(); saveDraft(); paintSlot(el); toast("Alt text saved") } }
    if (d.sl === "rm") { delete data.images[k]; saveDraft(); paintSlot(el); toast("Photo removed") } }
  if (d.pe) { const p = data.posts.find(x => x.id === d.pe); editPost = p.id; $("#bt").value = p.title; $("#be").value = p.excerpt || ""; $("#bb").value = p.body || ""; $("#ba").value = p.alt || ""; $("#bmt").value = p.metaTitle || ""; $("#bmd").value = p.metaDesc || ""; $("#bk").value = p.keywords || ""; $("#bt").focus() }
  if (d.pd) { if (d.sure) { const p = data.posts.find(x => x.id === d.pd); if (p.live) data.removed.push(p.slug); data.posts = data.posts.filter(x => x.id !== d.pd); saveDraft(); renderBlogList(); renderBlog() } else { d.sure = 1; t.textContent = "Confirm?" } }
});
$("#cartBtn").onclick = () => drawer(true);
$("#close").onclick = $("#shade").onclick = () => drawer(false);
$("#wishBtn").onclick = () => { const n = Object.keys(wish).filter(i => wish[i] && find(i)).length; toast(n ? n + " saved item" + (n > 1 ? "s" : "") : "No saved items yet") };

/* ---------- checkout: size, delivery, bank transfer, proof ---------- */
const PANES = ["fs", "f1", "f2", "f3"];
const step = n => PANES.forEach((id, i) => { $("#" + id).hidden = i !== n; $("#s" + i).classList.toggle("on", i === n) });
const closeCo = () => $("#co").classList.remove("on");
const jogs = () => Object.keys(cart).filter(i => cart[i] > 0 && find(i) && sizeKey(find(i).cat));
function renderSizeStep(j) {
  $("#szItems").innerHTML = j.map(i => { const p = find(i), rows = parseSizes(data.sizes[sizeKey(p.cat)]), s = sizes[i] || {};
    return `<div class="sz" data-id="${i}"><b>${esc(p.name)}</b> <span class="hint">× ${cart[i]}</span><div class="two3">
<label>Waist (cm)<input type="number" min="40" max="200" data-k="waist" value="${esc(s.waist || "")}"></label>
<label>Height (cm)<input type="number" min="100" max="230" data-k="height" value="${esc(s.height || "")}"></label>
<label>Size<select data-k="size"><option value="">Choose</option>${rows.map(r => `<option${s.size === r.size ? " selected" : ""}>${esc(r.size)}</option>`).join("")}</select></label></div><div class="hint sug"></div></div>` }).join("");
  $("#szCharts").innerHTML = [...new Set(j.map(i => sizeKey(find(i).cat)))].map(k => `<h3>${k === "women" ? "Joggers for Her" : "Joggers for Him"} size chart</h3><div class="tw"><table>${sizeTable(data.sizes[k])}</table></div>`).join("");
}
$("#szItems").addEventListener("input", e => {
  const row = e.target.closest(".sz"); if (!row) return; const id = row.dataset.id, st = sizes[id] = sizes[id] || {}, k = e.target.dataset.k; st[k] = e.target.value;
  if (k === "waist" || k === "height") {
    const r = suggest(data.sizes[sizeKey(find(id).cat)], parseFloat(st.waist)); let msg = "";
    if (r && k === "waist") { row.querySelector("select").value = r.size; st.size = r.size }
    if (r && st.waist) msg = `Suggested size for a ${st.waist} cm waist: ${r.size}.`;
    const h = parseFloat(st.height); if (r && h && r.h.length && h > (r.h[1] || r.h[0]) + 4) msg += " You are taller than usual for this size, so message us about a longer length.";
    row.querySelector(".sug").textContent = msg;
  }
  ls.set("ac_sizes", sizes);
});
$("#szNext").onclick = () => { const miss = jogs().filter(i => !(sizes[i] && sizes[i].size)); if (miss.length) return toast("Please choose a size for each jogger"); step(1) };
$("#checkout").onclick = () => {
  if (!render.total) return toast("Your cart is empty"); drawer(false);
  const j = jogs(); $("#s0").hidden = !j.length; if (j.length) { renderSizeStep(j); step(0) } else step(1);
  $("#co").classList.add("on");
};
$("#coX").onclick = closeCo; $("#back").onclick = () => step(1);
document.addEventListener("keydown", e => { if (e.key === "Escape") { closeCo(); drawer(false) } });
const sizeNote = i => { const s = sizes[i]; return s && s.size ? ` · Size ${s.size}${s.waist ? ` (waist ${s.waist}cm${s.height ? ", height " + s.height + "cm" : ""})` : ""}` : "" };
$("#f1").onsubmit = e => {
  e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
  const items = Object.keys(cart).filter(i => cart[i] > 0 && find(i)).map(i => ({ name: find(i).name + sizeNote(i), qty: cart[i], sum: find(i).price * cart[i] }));
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
  $("#doneBtn").onclick = closeCo; cart = {}; sizes = {}; ls.set("ac_sizes", {}); render(); step(3);
};

/* ---------- newsletter + auto-sliding testimonials ---------- */
$("#nf").onsubmit = e => { e.preventDefault(); $("#msg").textContent = "Thank you. " + $("#em").value + " is on the list."; $("#em").value = "" };
if ($("#track")) {
  const tr = $("#track"), sl = tr.parentElement, stepW = () => tr.firstElementChild.offsetWidth + 20;
  const next = () => tr.scrollLeft + stepW() >= tr.scrollWidth - tr.clientWidth - 5 ? tr.scrollTo(0, 0) : tr.scrollBy(stepW(), 0);
  const prev = () => tr.scrollLeft < 5 ? tr.scrollTo(tr.scrollWidth, 0) : tr.scrollBy(-stepW(), 0);
  let timer; const stop = () => clearInterval(timer);
  const start = () => { stop(); if (!matchMedia("(prefers-reduced-motion: reduce)").matches) timer = setInterval(next, 4000) };
  $("#tn").onclick = () => { next(); start() }; $("#tp").onclick = () => { prev(); start() };
  ["mouseenter", "focusin", "touchstart"].forEach(ev => sl.addEventListener(ev, stop, { passive: true }));
  ["mouseleave", "focusout", "touchend"].forEach(ev => sl.addEventListener(ev, start, { passive: true }));
  if ("IntersectionObserver" in window) new IntersectionObserver(es => es.forEach(x => { sl.classList.toggle("in", x.isIntersecting); x.isIntersecting ? start() : stop() }), { threshold: .25 }).observe(sl);
  else { sl.classList.add("in"); start() }
}

/* ---------- owner dashboard ---------- */
$("#pc").innerHTML = CATS.slice(1).map(([k, l]) => `<option value="${k}">${l}</option>`).join("");
const openPanel = tab => { $("#adm").hidden = false; if (tab) $(`[data-tab="${tab}"]`).click() };
$$("[data-tab]").forEach(b => b.onclick = () => { $$("[data-tab]").forEach(x => x.classList.toggle("on", x === b)); $$("[data-pane]").forEach(p => p.hidden = p.dataset.pane !== b.dataset.tab) });
$("#admX").onclick = () => $("#adm").hidden = true;
const showOwner = () => { if (location.hash === "#" + CONFIG.ownerHash) $("#adm").hidden = false };
showOwner(); addEventListener("hashchange", showOwner);
$("#pin").onsubmit = e => { e.preventDefault();
  if ($("#pinIn").value !== CONFIG.ownerPin) return toast("Wrong PIN");
  admin = true; try { sessionStorage.setItem("ac_admin", "1") } catch (er) {}
  data = norm(ls.get("ac_draft", null) || clone(SITE)); $("#pinIn").value = ""; adminUI(); applyTexts() };
$("#editMode").onchange = e => setEdit(e.target.checked);
// products
$("#pi").onchange = e => $("#pname").textContent = e.target.files[0] ? e.target.files[0].name : "";
$("#pcancel").onclick = () => { editing = null; $("#pf").reset(); $("#pname").textContent = "" };
$("#pf").onsubmit = e => { e.preventDefault();
  const v = { name: $("#pn").value.trim(), price: Number($("#pp").value), cat: $("#pc").value, alt: $("#pa").value.trim() };
  const finish = img => {
    if (editing) Object.assign(find(editing), v, img ? { img } : {}); else data.products.unshift({ id: "p" + Date.now(), ...v, img: img || "" });
    saveDraft(); editing = null; e.target.reset(); $("#pname").textContent = ""; renderShop(); toast("Saved. Open the Publish tab to put it live.") };
  const f = $("#pi").files[0]; f ? shrink(f, 800, finish) : finish("") };
// blog
function renderBlogList() {
  $("#blist").innerHTML = data.posts.map(p => `<div class="bl"><span>${esc(p.title)}</span><span><button data-pe="${p.id}">Edit</button><button data-pd="${p.id}">Delete</button></span></div>`).join("") || `<p class="hint">No posts yet.</p>`;
}
$("#bi").onchange = e => $("#bname").textContent = e.target.files[0] ? e.target.files[0].name : "";
$("#bcancel").onclick = () => { editPost = null; $("#bf").reset(); $("#bname").textContent = "" };
$("#bf").onsubmit = e => { e.preventDefault();
  const v = { title: $("#bt").value.trim(), excerpt: $("#be").value.trim(), body: $("#bb").value, alt: $("#ba").value.trim(), metaTitle: $("#bmt").value.trim(), metaDesc: $("#bmd").value.trim(), keywords: $("#bk").value.trim() };
  const finish = img => {
    if (editPost) Object.assign(data.posts.find(x => x.id === editPost), v, img ? { img } : {});
    else { let slug = slugify(v.title), n = 2; while (data.posts.some(x => x.slug === slug)) slug = slugify(v.title) + "-" + n++; data.posts.unshift({ id: "b" + Date.now(), slug, date: new Date().toISOString().slice(0, 10), ...v, img: img || "" }) }
    saveDraft(); editPost = null; e.target.reset(); $("#bname").textContent = ""; renderBlogList(); renderBlog(); toast("Post saved. Open the Publish tab to put it live.") };
  const f = $("#bi").files[0]; f ? shrink(f, 1000, finish) : finish("") };
// sizes
$("#szSave").onclick = () => { data.sizes.women = $("#szW").value; data.sizes.men = $("#szM").value; saveDraft(); renderSizes(); toast("Size charts saved") };
// SEO
let seoCur = "index";
function seoCheck() {
  const f = $("#sFocus").value.trim().toLowerCase(), t = $("#sTitle").value, d = $("#sDesc").value;
  $("#sTc").textContent = t.length + "/60 characters"; $("#sDc").textContent = d.length + "/160 characters";
  $("#sChk").textContent = f ? `Focus keyword: ${t.toLowerCase().includes(f) ? "✓ in title" : "✗ not in title"} · ${d.toLowerCase().includes(f) ? "✓ in description" : "✗ not in description"}` : "Add a focus keyword to check it.";
}
function loadSeo() { const s = data.seo, p = s.pages[seoCur] || {};
  $("#sUrl").value = s.url; $("#sName").value = s.name; $("#sAbout").value = s.about; $("#sTitle").value = p.title || ""; $("#sDesc").value = p.desc || ""; $("#sKey").value = p.keywords || ""; $("#sFocus").value = p.focus || "";
  $("#sAuto").checked = s.auto !== false; $("#sMap").value = s.sitemap; $("#sRobots").value = s.robots; $("#sLlms").value = s.llms; seoCheck() }
function saveSeoFields() { const s = data.seo;
  s.url = $("#sUrl").value.trim().replace(/\/$/, ""); s.name = $("#sName").value.trim() || s.name; s.about = $("#sAbout").value.trim();
  s.pages[seoCur] = { title: $("#sTitle").value.trim(), desc: $("#sDesc").value.trim(), keywords: $("#sKey").value.trim(), focus: $("#sFocus").value.trim() };
  s.auto = $("#sAuto").checked; s.sitemap = $("#sMap").value; s.robots = $("#sRobots").value; s.llms = $("#sLlms").value; saveDraft() }
$("#sPage").onchange = () => { saveSeoFields(); seoCur = $("#sPage").value; loadSeo() };
["sTitle", "sDesc", "sFocus"].forEach(id => $("#" + id).oninput = seoCheck);
$("#seoSave").onclick = () => { saveSeoFields(); applySEO(); toast("SEO saved") };
$("#seoGen").onclick = () => { saveSeoFields(); if (!data.seo.url) return toast("Type your website address first"); $("#sMap").value = genSitemap(); $("#sRobots").value = genRobots(); $("#sLlms").value = genLlms(); saveSeoFields(); toast("Files filled in") };
// backup + reset
const fileText = d => "// Your products, photos, text, blog and SEO. The owner dashboard's Publish button rewrites this file.\nconst SITE = " + JSON.stringify(d, null, 1) + ";\n";
$("#exp").onclick = () => { const b = new Blob([fileText(data)], { type: "text/javascript" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "products.js"; a.click() };
$("#rst").onclick = () => { ls.del("ac_draft"); data = norm(clone(SITE)); location.reload() };

/* ---------- publish to GitHub ---------- */
const b64 = s => btoa(unescape(encodeURIComponent(s)));
const say = t => $("#pubmsg").textContent = t;
const ghFetch = (path, opts = {}) => { const g = ls.get("ac_gh", {});
  return fetch(`https://api.github.com/repos/${g.user}/${g.repo}/contents/${path}` + (opts.method === "PUT" || opts.method === "DELETE" ? "" : `?ref=${g.branch}`),
    { ...opts, headers: { Authorization: "Bearer " + g.token, Accept: "application/vnd.github+json" } }) };
async function getFile(path) {
  const h = await ghFetch(path); if (h.status === 404) return null;
  if (!h.ok) throw new Error(`GitHub error ${h.status}. Check your username, repository name and token.`);
  const j = await h.json(); return { sha: j.sha, text: j.content ? decodeURIComponent(escape(atob(j.content.replace(/\n/g, "")))) : "" };
}
async function put(path, content, msg) {
  const g = ls.get("ac_gh", {}), f = await getFile(path);
  const r = await ghFetch(path, { method: "PUT", body: JSON.stringify({ message: msg, content, branch: g.branch, ...(f ? { sha: f.sha } : {}) }) });
  if (!r.ok) throw new Error(`Could not save ${path} (error ${r.status}). Does the token have Contents: Read and write?`);
}
async function del(path, msg) { const g = ls.get("ac_gh", {}), f = await getFile(path); if (!f) return;
  await ghFetch(path, { method: "DELETE", body: JSON.stringify({ message: msg, sha: f.sha, branch: g.branch }) }) }
$("#pub").onclick = async () => {
  const old = ls.get("ac_gh", {});
  const g = { user: $("#ghu").value.trim(), repo: $("#ghr").value.trim(), branch: $("#ghb").value.trim() || "main", token: $("#ght").value.trim() || old.token || "" };
  if (!g.user || !g.repo || !g.token) return say("Fill in your GitHub username, repository name and token.");
  ls.set("ac_gh", g); $("#pub").disabled = true; saveSeoFields();
  try {
    const out = clone(data); let n = 0;
    const up = async (du, name) => { const path = `images/${name}-${Date.now().toString(36)}.jpg`; say(`Uploading photo ${++n}...`); await put(path, du.split(",")[1], "Add photo " + name); return path };
    for (const p of out.products) if ((p.img || "").startsWith("data:")) p.img = await up(p.img, p.id);
    for (const p of out.posts) if ((p.img || "").startsWith("data:")) p.img = await up(p.img, p.id);
    for (const k of Object.keys(out.images)) if (out.images[k].startsWith("data:")) out.images[k] = await up(out.images[k], k);
    // static blog pages (so Google can read them)
    if (out.posts.length || out.removed.length) {
      say("Creating blog pages..."); const tpl = await getFile("post.html");
      if (!tpl) throw new Error("post.html is missing from your repository. Upload it first.");
      for (const p of out.posts) {
        const html = tpl.text.replace(/<!--seo-->[\s\S]*?<!--\/seo-->/, () => seoBlock("post", { title: p.metaTitle || `${p.title} | ${out.seo.name}`, desc: p.metaDesc || p.excerpt, keywords: p.keywords, path: `/blog/${p.slug}.html`, type: "article" }))
          .replace(/<!--post-->[\s\S]*?<!--\/post-->/, () => "<!--post-->" + postHTML(p) + "<!--/post-->")
          .replace(/(href|src)="(?!https?:|#|data:|mailto:|\/)([^"]*)"/g, '$1="../$2"');
        await put(`blog/${p.slug}.html`, b64(html), "Blog post: " + p.title); p.live = true;
      }
      for (const s of out.removed) await del(`blog/${s}.html`, "Remove blog post");
      out.removed = [];
    }
    // SEO files
    const prev = data; data = out;
    if (out.seo.auto !== false) { out.seo.sitemap = genSitemap(); out.seo.robots = genRobots(); out.seo.llms = genLlms() }
    say("Saving SEO files...");
    if (out.seo.sitemap) await put("sitemap.xml", b64(out.seo.sitemap), "Update sitemap");
    if (out.seo.robots) await put("robots.txt", b64(out.seo.robots), "Update robots.txt");
    if (out.seo.llms) await put("llms.txt", b64(out.seo.llms), "Update llms.txt");
    for (const [key, file] of [["index", "index.html"], ["shop", "shop.html"], ["size-guide", "size-guide.html"], ["blog", "blog.html"]]) {
      const f = await getFile(file); if (!f) continue; const nt = f.text.replace(/<!--seo-->[\s\S]*?<!--\/seo-->/, () => seoBlock(key));
      if (nt !== f.text) await put(file, b64(nt), "Update SEO tags: " + file);
    }
    say("Saving products and text..."); await put("products.js", b64(fileText(out)), "Update site content");
    saveDraft(); renderShop(); slots(); renderBlog(); renderBlogList();
    say("Published. Your website updates in 1 to 2 minutes. Refresh the site then.");
  } catch (e) { data = norm(ls.get("ac_draft", null) || data); say(e.message || "Publish failed. Please try again.") }
  $("#pub").disabled = false;
};

/* ---------- start ---------- */
function adminUI() {
  const g = ls.get("ac_gh", {}); $("#ghu").value = g.user || ""; $("#ghr").value = g.repo || ""; $("#ghb").value = g.branch || "main"; $("#ght").placeholder = g.token ? "Token saved on this device" : "GitHub token";
  $("#pin").hidden = admin; $("#tools").hidden = !admin;
  if (admin) {
    $("#szW").value = data.sizes.women; $("#szM").value = data.sizes.men; loadSeo(); renderBlogList();
    if (!$("#admOpen")) { const b = document.createElement("button"); b.id = "admOpen"; b.className = "admOpen"; b.textContent = "Owner dashboard"; b.onclick = () => openPanel(); document.body.appendChild(b) }
  }
  slots(); renderShop(); renderBlog(); renderPost(); renderSizes(); render();
}
adminUI(); applyTexts(); applySEO();
