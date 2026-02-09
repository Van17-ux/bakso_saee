console.log("✅ NEW script.js loaded (remove feature)");

const cart = [];
let tableCode = "Unknown";
let lineCounter = 1;

function getTableCode() {
  // Example paths:
  // "/" or "/index.html" or "/kk11"
  const raw = window.location.pathname.replace("/", "");

  // If user opened index.html, treat it as "Unknown" (or set default)
  if (raw === "" || raw.toLowerCase() === "index.html") {
    tableCode = "kk11"; // <-- set default for testing
  } else {
    tableCode = raw;
  }

  document.getElementById("tableCode").innerText = "Table: " + tableCode;

  // If you have checkout seat label:
  const seatEl = document.getElementById("checkoutSeat");
  if (seatEl) seatEl.innerText = tableCode;
}

function renderMenu() {
  const menuEl = document.getElementById("menu");
  menuEl.innerHTML = "";

  const categories = [...new Set(menuData.map(i => i.category))];

  categories.forEach(cat => {
    const section = document.createElement("div");
    section.innerHTML = `<h2 style="margin:16px 0 8px;">${cat}</h2>`;
    menuEl.appendChild(section);

    menuData.filter(i => i.category === cat).forEach(item => {
      const card = document.createElement("div");
      card.className = "menu-item";

      card.innerHTML = `
        <div class="menu-left">
          <img class="menu-img"
               src="${item.image || "assets/placeholder.jpg"}"
               alt="${item.name}"
               onclick="openProduct(${item.id})"
          />
          <div>
            <h3 class="menu-title">${item.name}</h3>
            <p class="menu-desc">${item.desc || ""}</p>
            <p class="menu-price">RM ${item.price}</p>
          </div>
        </div>

        <button onclick="addToCart(${item.id})">Add</button>
      `;

      menuEl.appendChild(card);
    });
  });
}

function addToCart(id) {
  const item = menuData.find(m => m.id === id);
  cart.push({
    lineId: "L" + (lineCounter++),
    id: item.id,
    name: item.name,
    price: item.price,
    category: item.category,
    note: ""
  });
  updateCart();
}

function allowNote(category){
  const c = (category || "").toLowerCase();
  return c.includes("combo") || c.includes("minuman");
}

function getNotePlaceholder(category) {
  const c = (category || "").toLowerCase();
  if (c.includes("minuman")) return "Comment e.g. less ice, no sugar";
  if (c.includes("combo")) return "Comment e.g. spicy level, no sambal";
  return ""; // not used
}

function openProduct(id){
  const item = menuData.find(x => x.id === id);
  if (!item) return;

  const modal = document.getElementById("productModal");
  const content = document.getElementById("productModalContent");
  const overlay = document.getElementById("overlay");

  content.innerHTML = `
    <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;">
      <div>
        <div style="font-size:22px;font-weight:900;">${item.name}</div>
        <div style="opacity:.75;margin-top:6px;font-size:14px;">${item.desc || ""}</div>
        <div style="margin-top:10px;font-weight:800;">RM ${item.price}</div>
        <div style="margin-top:6px;opacity:.7;font-size:13px;">Category: ${item.category}</div>
      </div>
      <button onclick="closeProduct()" style="border-radius:12px;padding:8px 12px;">✖</button>
    </div>

    <img src="${item.image || "assets/placeholder.jpg"}"
         alt="${item.name}"
         style="width:100%;border-radius:14px;margin-top:12px;object-fit:cover;"
    />

    <div style="margin-top:14px;display:flex;gap:10px;">
      <button onclick="addToCart(${item.id}); closeProduct();" style="flex:1;">Add to Cart</button>
      <button onclick="closeProduct()" style="flex:1;">Close</button>
    </div>
  `;

  modal.classList.remove("hidden");
  overlay.classList.remove("hidden");
}

function closeProduct(){
  document.getElementById("productModal")?.classList.add("hidden");
  // overlay might still be needed if cart is open, so check:
  const cartOpen = !document.getElementById("cartModal")?.classList.contains("hidden");
  if (!cartOpen) document.getElementById("overlay")?.classList.add("hidden");
}

function closeAllModals(){
  document.getElementById("cartModal")?.classList.add("hidden");
  document.getElementById("productModal")?.classList.add("hidden");
  document.getElementById("overlay")?.classList.add("hidden");
}

function updateCart() {
  // group lines by product id
  const grouped = {};
  cart.forEach(line => {
    grouped[line.id] ??= { item: line, lines: [] };
    grouped[line.id].lines.push(line);
  });

  // total qty = total lines
  document.getElementById("cartCount").innerText = cart.length;

  const list = document.getElementById("cartItems");
  list.innerHTML = "";

  let total = 0;

  Object.values(grouped).forEach(group => {
    const { item, lines } = group;
    const qty = lines.length;
    const subTotal = lines.reduce((s, l) => s + l.price, 0);
    total += subTotal;

    const li = document.createElement("li");
    li.style.listStyle = "none";
    li.style.padding = "16px 0";
    li.style.borderBottom = "1px solid #eee";

    // BIG title + qty aligned right
    li.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;">
        <div style="flex:1;">
          <div style="font-size:28px;font-weight:800;line-height:1.2;">${item.name}</div>
          <div style="font-size:18px;opacity:.85;margin-top:6px;">
            Rp. ${item.price} × ${qty} = <strong>Rp. ${subTotal.toFixed(2)}</strong>
          </div>
        </div>

        <!-- qty column rightmost -->
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:10px;min-width:160px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <button onclick="removeOne(${item.id})" style="width:54px;height:54px;border-radius:14px;font-size:22px;">-</button>
            <div style="font-size:26px;font-weight:900;min-width:24px;text-align:center;">${qty}</div>
            <button onclick="addOneMore(${item.id})" style="width:54px;height:54px;border-radius:14px;font-size:22px;">+</button>
          </div>
          <button onclick="removeAllOfItem(${item.id})" style="border-radius:14px;padding:10px 14px;font-size:16px;">
            🗑️ Remove All
          </button>
        </div>
      </div>

      ${allowNote(item.category) ? `
  <div style="margin-top:14px;display:flex;flex-direction:column;gap:10px;">
    ${lines.map((line, idx) => `
      <div style="display:flex;align-items:center;gap:10px;">
        <div class="noteRowLabel">${idx + 1}:</div>
        <input
          type="text"
          placeholder="${getNotePlaceholder(item.category)}"
          value="${line.note || ""}"
          oninput="updateNote('${line.lineId}', this.value)"
          style="flex:1;padding:12px;border:1px solid #ddd;border-radius:14px;font-size:15px;"
        />
        <button onclick="removeLine('${line.lineId}')" style="border-radius:14px;padding:10px 12px;">
          ✖
        </button>
      </div>
    `).join("")}
  </div>
` : ``}

    `;

    list.appendChild(li);
  });

  document.getElementById("cartTotal").innerText = total.toFixed(2);
}

function removeAllOfItem(id) {
  for (let i = cart.length - 1; i >= 0; i--) {
    if (cart[i].id === id) cart.splice(i, 1);
  }
  updateCart();
}

function addOneMore(id) {
  addToCart(id);
}

function removeOne(id) {
  // remove the last matching line for this product
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

function removeItem(id) {
  const idx = cart.findIndex(c => c.id === id);
  if (idx !== -1) cart.splice(idx, 1);
  updateCart();
}

function submitOrder() {
  if (cart.length === 0) return alert("Cart is empty.");

  const grouped = {};
  cart.forEach(line => {
    grouped[line.id] ??= { name: line.name, price: line.price, lines: [] };
    grouped[line.id].lines.push(line);
  });

  let total = 0;

  const summary = Object.values(grouped).map(g => {
    const qty = g.lines.length;
    const sub = g.lines.reduce((s, l) => s + l.price, 0);
    total += sub;

    const notes = g.lines.map((l, idx) => {
    const noteText = l.note?.trim() ? l.note.trim() : "(no note)";
    return `   ${idx + 1}: ${noteText}`;
    }).join("\n");


    return `- ${g.name} x${qty}\n${notes}`;
  }).join("\n\n");

  alert(`✅ Order placed!\nTable: ${tableCode}\n\n${summary}\n\nTotal: Rp. ${total.toFixed(2)}`);

  cart.length = 0;
  updateCart();
  toggleCart();
}

function toggleCart() {
  const modal = document.getElementById("cartModal");
  const overlay = document.getElementById("overlay");
  const productModal = document.getElementById("productModal");

  // if product modal open, close it first
  if (productModal && !productModal.classList.contains("hidden")) {
    closeProduct();
    return;
  }

  modal.classList.toggle("hidden");
  overlay.classList.toggle("hidden");
}

function openCart() {
  document.getElementById("cartModal")?.classList.remove("hidden");
  document.getElementById("overlay")?.classList.remove("hidden");
}

function closeCart() {
  document.getElementById("cartModal")?.classList.add("hidden");
  document.getElementById("overlay")?.classList.add("hidden");
}


cart.length = 0;
updateCart();
closeCart();
getTableCode();
renderMenu();
updateCart();

