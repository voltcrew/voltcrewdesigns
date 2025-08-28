// --- CONFIG ---
// Available sizes
const SIZE_OPTIONS = ["S", "M", "L", "XL"];

// Map folder/product keys to display names
const PRODUCT_DISPLAY_NAMES = {
  tee: "IT ONLY GOES 20 OFFICER - BOXY TEE",
  hoodie: "SPEED LIMIT? TF IS THAT - OVERSIZED HOODIE",
  longsleeve: "WILL RUN - LONGSLEEVE TEE",
  crewneck: "LAW ABIDING CITIZEN - HEAVY CREWNECK"
};

// Map color names to hex (for swatches)
function getColorHex(name) {
  const map = {
    "black": "rgba(0,0,0,1)",
    "darkchocolate": "rgba(56,41,38,1)",
    "militarygreen": "rgba(88,92,69,1)",
    "darkgrey": "rgba(85,85,85,1)",
    "forest": "rgba(34,139,34,1)",
    "forestgreen": "rgba(37,58,41,1)",
    "maroon": "rgba(128,0,0,1)",
    "royal": "rgba(65,105,225,1)",
    "navy": "rgba(0,0,128,1)",
    "charcoal": "rgba(54,69,79,1)",
    "graphiteheather": "rgba(130,128,131,1)",
    "darkheather": "rgba(71,71,73,1)",
    "heathersportdarknavy": "rgba(58,61,70,1)"
  };
  return map[name.toLowerCase()] || "rgba(204,204,204,1)"; // fallback light grey
}


// Utility: load cart from localStorage
function loadCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

// Utility: save cart
function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

// -------------------- HOMEPAGE --------------------
if (document.getElementById("product-grid")) {
  fetch("../photos/photos.json")
    .then(res => res.json())
    .then(data => {
      const grid = document.getElementById("product-grid");

      Object.keys(data).forEach(product => {
        const colors = Object.keys(data[product].colors);
        const firstColor = colors[0];
        const firstImage = data[product].colors[firstColor][0];

        const card = document.createElement("div");
        card.classList.add("product-card");
        card.innerHTML = `
          <a href="product.html?item=${product}">
            <img src="../photos/${product}/${firstImage}" alt="${product}">
            <h2>${PRODUCT_DISPLAY_NAMES[product]}</h2>
            <p>$${data[product].price.toFixed(2)}</p>
          </a>`;
        grid.appendChild(card);
      });
    });
}

// -------------------- PRODUCT PAGE --------------------
if (document.getElementById("product-name")) {
  const urlParams = new URLSearchParams(window.location.search);
  const productName = urlParams.get("item");

  let selectedColor = null;
  let selectedSize = null;
  let allImages = {}; // store all images per color
  let currentColor = "black"; // default

  fetch("../photos/photos.json")
    .then(res => res.json())
    .then(data => {
      const productData = data[productName];
      document.getElementById("product-name").textContent = PRODUCT_DISPLAY_NAMES[productName];
      document.getElementById("product-price").textContent = `$${productData.price.toFixed(2)}`;

      // Populate allImages
      Object.keys(productData.colors).forEach(color => {
        allImages[color] = productData.colors[color];
      });

      const colors = Object.keys(productData.colors);

      // Render color swatches
      const colorDiv = document.getElementById("color-options");
      colors.forEach((color, idx) => {
        const circle = document.createElement("div");
        circle.classList.add("color-circle");
        circle.style.background = getColorHex(color);
        circle.setAttribute("data-color", color);
        circle.onclick = () => {
          showImages(color);
          selectedColor = color;
        };
        colorDiv.appendChild(circle);

        // default select first color
        if (idx === 0) {
          showImages(color);
          selectedColor = color;
        }
      });

      // Render size buttons
      const sizeDiv = document.getElementById("size-options");
      SIZE_OPTIONS.forEach(size => {
        const btn = document.createElement("button");
        btn.textContent = size;
        btn.onclick = () => {
          document.querySelectorAll("#size-options button").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          selectedSize = size;
        };
        sizeDiv.appendChild(btn);
      });
    });

  // --- Updated showImages function ---
  function showImages(selectedColorParam) {
    const container = document.getElementById("product-images");
    container.innerHTML = ""; // clear gallery

    // Add the first image of the selected color first
    const firstImg = document.createElement("img");
    firstImg.src = `../photos/${productName}/${allImages[selectedColorParam][0]}`;
    container.appendChild(firstImg);

    // Add all other images from all colors (skip the one we just added)
    Object.keys(allImages).forEach(color => {
      allImages[color].forEach(img => {
        if (color === selectedColorParam && img === allImages[selectedColorParam][0]) return; // skip first image
        const el = document.createElement("img");
        el.src = `../photos/${productName}/${img}`;
        container.appendChild(el);
      });
    });

    currentColor = selectedColorParam; // update current color
  }

  // Add to Cart
  document.getElementById("add-to-cart").addEventListener("click", () => {
    if (!selectedColor || !selectedSize) {
      alert("Please select a color and size.");
      return;
    }

    fetch("../photos/photos.json")
      .then(res => res.json())
      .then(data => {
        const productData = data[productName];
        const cart = loadCart();

        cart.push({
          name: productName,
          color: selectedColor,
          size: selectedSize,
          price: productData.price,
          img: productData.colors[selectedColor][0] // first image for that color
        });

        saveCart(cart);
        alert("Added to cart!");
      });
  });
}

// -------------------- CHECKOUT PAGE --------------------
if (document.getElementById("cart-items")) {
  const cart = loadCart();
  const cartContainer = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total");

  let total = 0;

  if (cart.length === 0) {
    cartContainer.innerHTML = "<p>Your cart is empty.</p>";
  } else {
    cart.forEach((item, idx) => {
      total += item.price;

      const div = document.createElement("div");
      div.classList.add("cart-item");
      div.innerHTML = `
        <div style="display:flex;align-items:center;">
          <img src="../photos/${item.name}/${item.img}" alt="${item.name}">
          <div>
            <h3>${PRODUCT_DISPLAY_NAMES[item.name]}</h3>
            <p>Color: ${item.color}</p>
            <p>Size: ${item.size}</p>
          </div>
        </div>
        <div>
          <p>$${item.price.toFixed(2)}</p>
          <button data-idx="${idx}" class="remove-btn">Remove</button>
        </div>
      `;
      cartContainer.appendChild(div);
    });
  }

  totalEl.textContent = `$${total.toFixed(2)}`;

  // Remove items
  document.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      const idx = e.target.getAttribute("data-idx");
      const cart = loadCart();
      cart.splice(idx, 1);
      saveCart(cart);
      location.reload();
    });
  });

  // Fake checkout
  document.getElementById("checkout-btn").addEventListener("click", () => {
    document.getElementById("checkout-message").classList.remove("hidden");
  });
}
