console.log("✅ script.js loaded");

const cart = [];
let tableCode = "Unknown";
let lineCounter = 1;

function getTableCode() {
  const params = new URLSearchParams(window.location.search);
  tableCode = params.get("table") || "Unknown";
  const el = document.getElementById("tableCode");
  if (el) el.innerText = "Table: " + tableCode;
}

function safeMoney(n){
  return Number(n || 0).toLocaleString("id-ID");
}

function shouldShowNotes(category){
  const c = (category || "").toLowerCase();
  return c.includes("combo") || c.includes("minuman");
}

function getNotePlaceholder(category) {
  const c = (category || "").toLowerCase();
  if (c.includes("minuman")) return "Comment e.g. less ice, no sugar";
  if (c.includes("combo")) return "Comment e.g. spicy level, no sambal";
  return "";
}

function renderMenu() {
  const menuEl = document.getElementById("menu");
  if (!menuEl) return;

  if (typeof menuData === "undefined") {
    menuEl.innerHTML = "<p style='padding:16px'>❌ menuData not found. Check menu.js path.</p>";
    return;
  }

  menuEl.innerHTML = "";

  const categories = [...new Set(menuData.map(i => i.category))];

  categories.forEach(cat => {
    const section = document.createElement("div");
    section.innerHTML = `<h2 class="cat-title">${cat}</h2>`;
    menuEl.appendChild(section);

    menuData
      .filter(i => i.category === cat)
      .forEach(item => {
        const card = document.createElement("div");
        card.className = "menu-item";

        card.innerHTML = `
        <div class="menu-left">
      
          <div class="menu-img-wrapper">
            ${item.badge ? `<div class="menu-badge">${item.badge}</div>` : ""}
            ${item.available === false ? `<div class="sold-overlay">Sold Out</div>` : ""}
            <img
              class="menu-img"
              src="${item.image || ""}"
              alt="${item.name}"
              onclick="openProductModal(${item.id})"
            />
          </div>
      
          <div class="menu-text">
            <div class="menu-name">${item.name}</div>
            <div class="menu-desc">${item.desc || ""}</div>
            <div class="menu-price">Rp. ${safeMoney(item.price)}</div>
          </div>
      
        </div>
      
        ${
          item.available === false
            ? `<button class="menu-add sold-out" disabled>Sold Out</button>`
            : `<button class="menu-add" onclick="addToCart(${item.id})">Add</button>`
        }
      `;
      menuEl.appendChild(card);
      });
  });
}

function addToCart(id) {
  const item = menuData.find(m => m.id === id);
  if (!item) return;

  cart.push({
    lineId: "L" + (lineCounter++),
    id: item.id,
    name: item.name,
    price: item.price,
    category: item.category,
    desc: item.desc || "",
    note: ""
  });

  updateCart();
  showToast(item.name + " added to cart ✔");
}

function updateCart() {
  // ✅ IMPORTANT: never crash even if cart empty
  const grouped = {};
  cart.forEach(line => {
    grouped[line.id] ??= { item: line, lines: [] };
    grouped[line.id].lines.push(line);
  });

  const cartCountEl = document.getElementById("cartCount");
  if (cartCountEl) cartCountEl.innerText = cart.length;

  const list = document.getElementById("cartItems");
  if (!list) return;

  list.innerHTML = "";

  let total = 0;

  Object.values(grouped).forEach(group => {
    const { item, lines } = group;
    const qty = lines.length;
    const subTotal = lines.reduce((s, l) => s + Number(l.price || 0), 0);
    total += subTotal;

    const li = document.createElement("li");
    li.className = "cart-item";

    li.innerHTML = `
      <div class="cart-top">
        <div class="cart-main">
          <div class="cart-title">${item.name}</div>
          <div class="cart-sub">${item.desc || ""}</div>
          <div class="cart-meta">Rp. ${safeMoney(item.price)} × ${qty} = <strong>Rp. ${safeMoney(subTotal)}</strong></div>
        </div>

        <div class="cart-qty">
          <div class="qty-row">
            <button class="qty-btn" onclick="removeOne(${item.id})">-</button>
            <div class="qty-num">${qty}</div>
            <button class="qty-btn" onclick="addOneMore(${item.id})">+</button>
          </div>
          <button class="remove-all" onclick="removeAllOfItem(${item.id})">🗑️ Remove All</button>
        </div>
      </div>

      ${
        shouldShowNotes(item.category)
          ? `<div class="notes-wrap">
              ${lines.map((line, idx) => `
                <div class="note-row">
                  <div class="note-idx">${idx + 1}:</div>
                  <input
                    class="note-input"
                    type="text"
                    placeholder="${getNotePlaceholder(item.category)}"
                    value="${line.note || ""}"
                    oninput="updateNote('${line.lineId}', this.value)"
                  />
                  <button class="note-del" onclick="removeLine('${line.lineId}')">✖</button>
                </div>
              `).join("")}
            </div>`
          : ``
      }
    `;

    list.appendChild(li);
  });

  const totalEl = document.getElementById("cartTotal");
  if (totalEl) totalEl.innerText = safeMoney(total);
}

function removeAllOfItem(id) {
  for (let i = cart.length - 1; i >= 0; i--) {
    if (cart[i].id === id) cart.splice(i, 1);
  }
  updateCart();
}

function addOneMore(id) { addToCart(id); }

function removeOne(id) {
  const idx = [...cart].map((x, i) => ({x, i}))
    .reverse()
    .find(obj => obj.x.id === id)?.i;

  if (idx !== undefined) cart.splice(idx, 1);
  updateCart();
}

function removeLine(lineId) {
  const idx = cart.findIndex(x => x.lineId === lineId);
  if (idx !== -1) cart.splice(idx, 1);
  updateCart();
}

function updateNote(lineId, value) {
  const line = cart.find(x => x.lineId === lineId);
  if (!line) return;
  line.note = value;
}

function submitOrder() {
  if (cart.length === 0) return alert("Cart is empty.");

  // group by product id
  const grouped = {};
  cart.forEach(line => {
    grouped[line.id] ??= { name: line.name, price: line.price, category: line.category, lines: [] };
    grouped[line.id].lines.push(line);
  });

  let total = 0;

  const summary = Object.values(grouped).map(g => {
    const qty = g.lines.length;
    const sub = g.lines.reduce((s, l) => s + Number(l.price || 0), 0);
    total += sub;

    // notes section (only if notes are enabled for that category)
    let notesBlock = "";
    if (typeof shouldShowNotes === "function" && shouldShowNotes(g.category)) {
      const notes = g.lines.map((l, idx) => {
        const noteText = (l.note || "").trim() ? (l.note || "").trim() : "(no note)";
        return `   ${idx + 1}: ${noteText}`;
      }).join("\n");

      notesBlock = `\n${notes}`;
    }

    return `- ${g.name} x${qty}${notesBlock}`;
  }).join("\n\n");

  let lastOrderNumber = Number(localStorage.getItem("lastOrderNumber") || 0);
  lastOrderNumber += 1;
  localStorage.setItem("lastOrderNumber", lastOrderNumber);
  
  const orderId = "ORD-" + String(lastOrderNumber).padStart(12, "0");
  
  const timestamp = new Date().toLocaleString("id-ID");

  showOrderModal(orderId, timestamp, summary, total);

  const existing = JSON.parse(localStorage.getItem("orders") || "[]");

existing.push({
  orderId,
  table: tableCode,
  timestamp,
  summary,
  total
});

localStorage.setItem("orders", JSON.stringify(existing));

  // reset
  cart.length = 0;
  updateCart();
  toggleCart();
}

function showOrderModal(orderId, timestamp, summary, total){
  const overlay = document.getElementById("orderOverlay");
  const modal = document.getElementById("orderModal");
  const content = document.getElementById("orderSummaryContent");

  content.innerHTML = `
    <p><strong>Order ID:</strong> ${orderId}</p>
    <p><strong>Table:</strong> ${tableCode}</p>
    <p><strong>Time:</strong> ${timestamp}</p>
    <hr/>
    <pre>${summary}</pre>
    <hr/>
    <p><strong>Total:</strong> Rp. ${safeMoney(total)}</p>
  `;

  overlay.classList.remove("hidden");
  modal.classList.remove("hidden");

  window.lastOrderData = { orderId, timestamp, summary, total };
}

function closeOrderModal(){
  document.getElementById("orderOverlay")?.classList.add("hidden");
  document.getElementById("orderModal")?.classList.add("hidden");
}

function toggleCart() {
  const modal = document.getElementById("cartModal");
  const overlay = document.getElementById("overlay");
  if (!modal || !overlay) return;

  modal.classList.toggle("hidden");
  overlay.classList.toggle("hidden");
}

function openProductModal(itemId){
  const item = menuData.find(x => x.id === itemId);
  if(!item) return;

  const overlay = document.getElementById("productOverlay");
  const modal = document.getElementById("productModal");
  const content = document.getElementById("productModalContent");
  if(!overlay || !modal || !content) return;

  content.innerHTML = `
    <div class="pm-title">${item.name}</div>
    <div class="pm-price">Rp. ${safeMoney(item.price)}</div>
    <div class="pm-cat">Category: ${item.category}</div>
    <div class="pm-desc">${item.desc || ""}</div>

    <img class="pm-img" src="${item.image || ""}" alt="${item.name}" />

    <div class="pm-actions">
      <button class="pm-add" onclick="addToCart(${item.id})">Add to Cart</button>
      <button class="pm-close" onclick="closeProductModal()">Close</button>
    </div>
  `;

  overlay.classList.remove("hidden");
  modal.classList.remove("hidden");
}

function closeProductModal(){
  document.getElementById("productOverlay")?.classList.add("hidden");
  document.getElementById("productModal")?.classList.add("hidden");
}

document.addEventListener("DOMContentLoaded", () => {
  getTableCode();
  renderMenu();
  updateCart();

  // Close product modal
  document.getElementById("productOverlay")?.addEventListener("click", closeProductModal);
  document.getElementById("productCloseBtn")?.addEventListener("click", closeProductModal);

  // Close cart when clicking overlay
  document.getElementById("overlay")?.addEventListener("click", () => {
    const modal = document.getElementById("cartModal");
    if (modal && !modal.classList.contains("hidden")) {
      toggleCart();
    }
  });

  // WhatsApp button
  document.getElementById("sendWhatsAppBtn")?.addEventListener("click", () => {
    if (!window.lastOrderData) return;

    const phone = "628990866716";

    const message =
`New Order
Order ID: ${window.lastOrderData.orderId}
Table: ${tableCode}

${window.lastOrderData.summary}

Total: Rp. ${safeMoney(window.lastOrderData.total)}`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`)
  });

});

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerText = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 50);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}















