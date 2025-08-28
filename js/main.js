// --- main.js (complete, fixed) ---
// Available sizes
const SIZE_OPTIONS = ["S", "M", "L", "XL"];

// DISPLAY NAMES (keys must match photos.json product keys)
const PRODUCT_DISPLAY_NAMES = {
  "tee-goes20": "IT ONLY GOES 20 OFFICER - BOXY TEE",
  "hoodie-speedlimit": "SPEED LIMIT? TF IS THAT - OVERSIZED HOODIE",
  "hoodie-wheelies": "WHEELIES ARE MANDATORY - OVERSIZED HOODIE",
  "longsleeve-willrun": "WILL RUN - LONGSLEEVE TEE",
  "crewneck-citizen": "LAW ABIDING CITIZEN - HEAVY CREWNECK"
};

// color swatches map
function getColorHex(name) {
  const map = {
    "black": "rgba(0,0,0,1)",
    "dark chocolate": "rgba(56,41,38,1)",
    "darkchocolate": "rgba(56,41,38,1)",
    "military green": "rgba(88,92,69,1)",
    "militarygreen": "rgba(88,92,69,1)",
    "dark grey": "rgba(85,85,85,1)",
    "darkgrey": "rgba(85,85,85,1)",
    "forest": "rgba(34,139,34,1)",
    "forest green": "rgba(37,58,41,1)",
    "forestgreen": "rgba(37,58,41,1)",
    "maroon": "rgba(128,0,0,1)",
    "royal": "rgba(65,105,225,1)",
    "navy": "rgba(0,0,128,1)",
    "charcoal": "rgba(54,69,79,1)",
    "graphite heather": "rgba(130,128,131,1)",
    "graphiteheather": "rgba(130,128,131,1)",
    "dark heather": "rgba(71,71,73,1)",
    "darkheather": "rgba(71,71,73,1)",
    "heather sport dark navy": "rgba(58,61,70,1)",
    "heathersportdarknavy": "rgba(58,61,70,1)"
  };
  return map[name.toLowerCase()] || "rgba(204,204,204,1)";
}

// localStorage helpers
function loadCart() {
  try { return JSON.parse(localStorage.getItem("cart")) || []; }
  catch { return []; }
}
function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

// fetch photos.json
async function fetchData() {
  const res = await fetch("../photos/photos.json");
  if (!res.ok) throw new Error("Failed to load photos.json");
  return res.json();
}

// basename: strip any directory prefixes (defensive)
function basename(p) {
  if (!p) return p;
  const parts = p.split("/");
  return parts[parts.length - 1];
}

// Try to load an image URL and return true/false
function tryLoadUrl(url) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

// Resolve an image path:
// - If JSON filename includes extension: try that exact file first.
// - If not found, try swapping to .png then .jpg.
// - If JSON filename has no extension: try base.png then base.jpg.
// Returns a string URL (relative) or null if not found.
async function getImagePath(type, name, fileOrBase) {
  if (!fileOrBase) return null;
  const base = basename(fileOrBase); // ensure just filename
  const hasExt = /\.[a-zA-Z0-9]+$/.test(base);

  // Build candidate URLs
  if (hasExt) {
    const exact = `../photos/${type}/${name}/${base}`;
    if (await tryLoadUrl(exact)) return exact;

    // try alternate common extensions (swap)
    const altPng = `../photos/${type}/${name}/${base.replace(/\.[^.]+$/, ".png")}`;
    if (await tryLoadUrl(altPng)) return altPng;

    const altJpg = `../photos/${type}/${name}/${base.replace(/\.[^.]+$/, ".jpg")}`;
    if (await tryLoadUrl(altJpg)) return altJpg;

    return null;
  } else {
    const png = `../photos/${type}/${name}/${base}.png`;
    if (await tryLoadUrl(png)) return png;
    const jpg = `../photos/${type}/${name}/${base}.jpg`;
    if (await tryLoadUrl(jpg)) return jpg;
    return null;
  }
}

// ---------------- HOMEPAGE ----------------
async function createProductCards(data) {
  const container = document.getElementById("product-grid") || document.getElementById("product-list");
  if (!container) return;

  // iterate deterministically
  for (const productKey of Object.keys(data)) {
    const product = data[productKey];
    const colorKeys = Object.keys(product.colors || {});
    const firstColor = colorKeys[0];
    const firstImageRaw = firstColor ? product.colors[firstColor][0] : null;
    const firstBase = basename(firstImageRaw);

    let imgSrc = "";
    if (firstBase) {
      try {
        const path = await getImagePath(product.type, product.name, firstBase);
        imgSrc = path || "";
      } catch {
        imgSrc = "";
      }
    }

    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <a href="product.html?item=${productKey}">
        ${imgSrc ? `<img src="${imgSrc}" alt="${PRODUCT_DISPLAY_NAMES[productKey] || productKey}">` : `<div class="no-image">No image</div>`}
        <h2>${PRODUCT_DISPLAY_NAMES[productKey] || productKey}</h2>
        <p>$${(product.price || 0).toFixed(2)}</p>
      </a>
    `;
    container.appendChild(card);
  }
}

// ---------------- PRODUCT PAGE ----------------
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

async function showProductPage(data) {
  const productKey = getQueryParam("item");
  if (!productKey || !data[productKey]) return;
  const product = data[productKey];

  // elements
  const nameEl = document.getElementById("product-name");
  const priceEl = document.getElementById("product-price");
  const imagesContainer = document.getElementById("product-images");
  const colorOptions = document.getElementById("color-options");
  const sizeOptions = document.getElementById("size-options");

  if (nameEl) nameEl.textContent = PRODUCT_DISPLAY_NAMES[productKey] || productKey;
  if (priceEl) priceEl.textContent = `$${(product.price || 0).toFixed(2)}`;

  if (!imagesContainer || !colorOptions || !sizeOptions) {
    return; // page not matching expected layout
  }

  // initial selections
  let selectedColor = Object.keys(product.colors || {})[0];
  let selectedSize = SIZE_OPTIONS[0];

  // sizes
  SIZE_OPTIONS.forEach(s => {
    const btn = document.createElement("button");
    btn.textContent = s;
    btn.addEventListener("click", () => {
      sizeOptions.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedSize = s;
    });
    sizeOptions.appendChild(btn);
  });

  // colors (swatches)
  const colorKeys = Object.keys(product.colors || {});
  for (let i = 0; i < colorKeys.length; i++) {
    const color = colorKeys[i];
    const sw = document.createElement("div");
    sw.className = "color-circle";
    sw.style.background = getColorHex(color);
    sw.title = color;
    sw.addEventListener("click", () => {
      selectedColor = color;
      renderImagesForColor(product, color, imagesContainer);
    });
    colorOptions.appendChild(sw);

    if (i === 0) {
      // initial render
      renderImagesForColor(product, color, imagesContainer);
    }
  }

  // add to cart
  const addBtn = document.getElementById("add-to-cart");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      if (!selectedColor || !selectedSize) {
        alert("Choose color and size.");
        return;
      }
      const cart = loadCart();
      cart.push({
        id: productKey,
        type: product.type,
        name: product.name,
        color: selectedColor,
        size: selectedSize,
        price: product.price,
        img: product.colors[selectedColor][0] // raw filename as stored in JSON
      });
      saveCart(cart);
      alert("Added to cart!");
    });
  }
}

// render all images (gallery) for a color
// Replace your old renderImagesForColor(...) with this function
async function renderImagesForColor(product, color, container) {
  // defensive
  if (!product || !product.colors || !container) return;

  // clear current gallery
  container.innerHTML = "";

  // Build ordered list of all images with their color
  const all = [];
  const colorKeys = Object.keys(product.colors || {});
  colorKeys.forEach(c => {
    (product.colors[c] || []).forEach(img => {
      all.push({ color: c, img });
    });
  });

  // Identify the selected color's first image (if exists)
  const selectedFirst = (product.colors[color] && product.colors[color][0]) || null;
  const selectedFirstBase = selectedFirst ? basename(selectedFirst) : null; // use basename helper already in main.js

  // final order: selected color's first image first, then all others (skip duplicate of that exact file)
  const finalList = [];
  if (selectedFirstBase) {
    finalList.push({ color, img: selectedFirstBase });
  }
  all.forEach(entry => {
    const entryBase = basename(entry.img);
    // skip if this is the same file as selectedFirst (avoid duplicate)
    if (selectedFirstBase && entry.color === color && entryBase === selectedFirstBase) return;
    finalList.push({ color: entry.color, img: entryBase });
  });

  // Resolve all image paths in parallel (getImagePath returns a promise)
  const pathPromises = finalList.map(e => getImagePath(product.type, product.name, e.img));
  const resolvedPaths = await Promise.all(pathPromises);

  // Append images in order (only those that resolved successfully)
  for (let i = 0; i < finalList.length; i++) {
    const path = resolvedPaths[i];
    if (!path) continue; // skip missing images gracefully
    const imgEl = document.createElement("img");
    imgEl.src = path;
    imgEl.alt = `${product.name} - ${finalList[i].color}`;
    imgEl.className = "product-thumb";
    container.appendChild(imgEl);
  }

  // Optional: ensure container is scrolled to the first image (useful on small screens)
  if (container.firstElementChild) {
    container.firstElementChild.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
  }
}


// ---------------- CART PAGE ----------------
async function renderCartPage() {
  const container = document.getElementById("cart-items");
  if (!container) return;

  const cart = loadCart();
  container.innerHTML = "";

  if (cart.length === 0) {
    container.innerHTML = "<p>Your cart is empty.</p>";
    const totalEl = document.getElementById("cart-total");
    if (totalEl) totalEl.textContent = "$0.00";
    return;
  }

  let total = 0;
  for (let idx = 0; idx < cart.length; idx++) {
    const item = cart[idx];
    total += (item.price || 0);

    const fileBase = basename(item.img);
    const src = await getImagePath(item.type, item.name, fileBase);

    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <div style="display:flex;align-items:center;">
        <img src="${src || ''}" alt="${item.id}" style="width:80px;height:auto;margin-right:12px;">
        <div>
          <h3>${PRODUCT_DISPLAY_NAMES[item.id] || item.id}</h3>
          <p>Color: ${item.color}</p>
          <p>Size: ${item.size}</p>
        </div>
      </div>
      <div>
        <p>$${(item.price || 0).toFixed(2)}</p>
        <button data-idx="${idx}" class="remove-btn">Remove</button>
      </div>
    `;
    container.appendChild(div);

    // attach remove handler for this specific index
    div.querySelector(".remove-btn").addEventListener("click", () => {
      const c = loadCart();
      c.splice(idx, 1);
      saveCart(c);
      renderCartPage();
    });
  }

  const totalEl = document.getElementById("cart-total");
  if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;

  const checkoutBtn = document.getElementById("checkout-btn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      const msg = document.getElementById("checkout-message");
      if (msg) msg.classList.remove("hidden");
    });
  }
}

// ---------------- BOOT ----------------
document.addEventListener("DOMContentLoaded", async () => {
  let data = {};
  try {
    data = await fetchData();
  } catch (err) {
    console.error("Could not load photos.json:", err);
    return;
  }

  // Homepage
  if (document.getElementById("product-grid") || document.getElementById("product-list")) {
    await createProductCards(data);
  }

  // Product page
  if (document.getElementById("product-detail") || document.getElementById("product-images")) {
    await showProductPage(data);
  }

  // Cart page
  if (document.getElementById("cart-items")) {
    await renderCartPage();
  }
});
