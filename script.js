// ======================================
// ANIAH'S COLLECTION - STORE SETTINGS
// ======================================

// EDIT THESE DETAILS WITH YOUR BANK INFORMATION

const STORE = {
  accountName: "YOUR PERSONAL ACCOUNT NAME",
  bankName: "YOUR BANK NAME",
  accountNumber: "0000000000",
  whatsapp: "2348012345678"
};

// ======================================
// DEMO PRODUCTS
// ======================================

const products = [
  {
    id: 1,
    name: "Royal Bloom Ankara",
    category: "Ankara",
    price: 18500,
    unit: "Per 6 yards",
    image: "",
    description: "Beautiful floral-inspired Ankara print."
  },
  {
    id: 2,
    name: "Golden Petals Ankara",
    category: "Ankara",
    price: 20000,
    unit: "Per 6 yards",
    image: "",
    description: "A beautiful fabric for special occasions."
  },
  {
    id: 3,
    name: "Classic Akwete",
    category: "Akwete",
    price: 35000,
    unit: "Per piece",
    image: "",
    description: "Traditional woven Akwete material."
  },
  {
    id: 4,
    name: "Heritage Akwete",
    category: "Akwete",
    price: 42000,
    unit: "Per piece",
    image: "",
    description: "Beautiful traditional-inspired weave."
  },
  {
    id: 5,
    name: "Premium Senator",
    category: "Senator",
    price: 28000,
    unit: "Per 6 yards",
    image: "",
    description: "Quality Senator material."
  },
  {
    id: 6,
    name: "Everyday Senator",
    category: "Senator",
    price: 24000,
    unit: "Per 6 yards",
    image: "",
    description: "A versatile fabric for everyday outfits."
  },
  {
    id: 7,
    name: "Colour Story Ankara",
    category: "Ankara",
    price: 16500,
    unit: "Per 6 yards",
    image: "",
    description: "A colourful print for your wardrobe."
  },
  {
    id: 8,
    name: "Blush Garden",
    category: "Other",
    price: 19000,
    unit: "Per 6 yards",
    image: "",
    description: "A beautiful fabric for different occasions."
  }
];

// ======================================
// VARIABLES
// ======================================

let cart = [];
let selectedCategory = "All";
let customer = {};
let orderNumber = "";

const productGrid = document.getElementById("productGrid");

const formatMoney = amount =>
  "₦" + Number(amount).toLocaleString("en-NG");

// ======================================
// DISPLAY PRODUCTS
// ======================================

function displayProducts() {

  const search =
    document.getElementById("searchInput").value.toLowerCase();

  const filteredProducts = products.filter(product => {

    const categoryMatch =
      selectedCategory === "All" ||
      product.category === selectedCategory;

    const searchMatch =
      product.name.toLowerCase().includes(search) ||
      product.category.toLowerCase().includes(search);

    return categoryMatch && searchMatch;
  });

  if (!filteredProducts.length) {
    productGrid.innerHTML =
      '<p class="empty-message">No fabrics found. Try another search.</p>';
    return;
  }

  productGrid.innerHTML = filteredProducts.map(product => {

    const image = product.image
      ? `<img src="${product.image}" alt="${product.name}">`
      : `<div class="product-placeholder ${product.category.toLowerCase()}">✿</div>`;

    return `
      <div class="product-card">

        <div class="product-image">
          ${image}
        </div>

        <div class="product-info">

          <span class="category-label">
            ${product.category.toUpperCase()}
          </span>

          <h3>${product.name}</h3>

          <p class="price">
            ${formatMoney(product.price)}
          </p>

          <p class="unit">${product.unit}</p>

          <button
            class="add-button"
            onclick="addToCart(${product.id})">

            ADD TO CART +

          </button>

        </div>

      </div>
    `;

  }).join("");
}

// ======================================
// FILTER PRODUCTS
// ======================================

document.querySelectorAll(".filter").forEach(button => {

  button.addEventListener("click", () => {

    document.querySelectorAll(".filter").forEach(btn =>
      btn.classList.remove("active")
    );

    button.classList.add("active");

    selectedCategory = button.dataset.filter;

    displayProducts();

  });

});

// COLLECTION CLICKS

document.querySelectorAll(".collection-card").forEach(card => {

  card.addEventListener("click", () => {

    selectedCategory = card.dataset.category;

    document.querySelectorAll(".filter").forEach(btn => {

      btn.classList.toggle(
        "active",
        btn.dataset.filter === selectedCategory
      );

    });

    displayProducts();

    document.getElementById("shop").scrollIntoView();

  });

});

// SEARCH

document.getElementById("searchInput")
  .addEventListener("input", displayProducts);

// ======================================
// SHOPPING CART
// ======================================

function addToCart(id) {

  const existing = cart.find(item => item.id === id);

  if (existing) {
    existing.quantity++;
  } else {
    cart.push({
      id,
      quantity: 1
    });
  }

  updateCart();

}

function updateCart() {

  const cartItems = document.getElementById("cartItems");

  let total = 0;
  let count = 0;

  if (cart.length === 0) {

    cartItems.innerHTML =
      "<p>Your shopping cart is empty.</p>";

  } else {

    cartItems.innerHTML = cart.map(item => {

      const product = products.find(p => p.id === item.id);

      if (!product) return "";

      const subtotal = product.price * item.quantity;

      total += subtotal;
      count += item.quantity;

      return `

        <div class="cart-item">

          <h4>${product.name}</h4>

          <p>${formatMoney(product.price)}</p>

          <div class="quantity-controls">

            <button onclick="changeQuantity(${product.id}, -1)">
              -
            </button>

            <span>${item.quantity}</span>

            <button onclick="changeQuantity(${product.id}, 1)">
              +
            </button>

            <button
              class="remove-button"
              onclick="removeFromCart(${product.id})">

              Remove

            </button>

          </div>

          <p>Subtotal: ${formatMoney(subtotal)}</p>

        </div>

      `;

    }).join("");

  }

  document.getElementById("cartCount").textContent = count;

  document.getElementById("cartTotal").textContent =
    formatMoney(total);

}

function changeQuantity(id, amount) {

  const item = cart.find(product => product.id === id);

  if (!item) return;

  item.quantity += amount;

  if (item.quantity <= 0) {
    cart = cart.filter(product => product.id !== id);
  }

  updateCart();

}

function removeFromCart(id) {

  cart = cart.filter(item => item.id !== id);

  updateCart();

}

// ======================================
// OPEN AND CLOSE CART
// ======================================

const cartPanel = document.getElementById("cartPanel");
const overlay = document.getElementById("overlay");

document.getElementById("cartButton")
  .addEventListener("click", () => {

    cartPanel.classList.add("open");
    overlay.classList.add("show");

  });

function closeCart() {

  cartPanel.classList.remove("open");
  overlay.classList.remove("show");

}

document.getElementById("closeCart")
  .addEventListener("click", closeCart);

overlay.addEventListener("click", closeCart);

// ======================================
// CHECKOUT
// ======================================

const checkoutModal =
  document.getElementById("checkoutModal");

document.getElementById("checkoutButton")
  .addEventListener("click", () => {

    if (cart.length === 0) {
      alert("Please add a fabric to your cart first.");
      return;
    }

    closeCart();

    checkoutModal.classList.add("open");

  });

document.getElementById("closeCheckout")
  .addEventListener("click", () => {

    checkoutModal.classList.remove("open");

  });

// ======================================
// CUSTOMER DETAILS
// ======================================

document.getElementById("customerForm")
  .addEventListener("submit", function(event) {

    event.preventDefault();

    customer = {

      name: document.getElementById("customerName").value,

      phone: document.getElementById("customerPhone").value,

      email: document.getElementById("customerEmail").value,

      address: document.getElementById("customerAddress").value,

      city: document.getElementById("customerCity").value,

      state: document.getElementById("customerState").value

    };

    // Calculate order total

    const total = cart.reduce((sum, item) => {

      const product = products.find(p => p.id === item.id);

      return sum + product.price * item.quantity;

    }, 0);

    // Display bank details

    document.getElementById("accountName").textContent =
      STORE.accountName;

    document.getElementById("bankName").textContent =
      STORE.bankName;

    document.getElementById("accountNumber").textContent =
      STORE.accountNumber;

    document.getElementById("paymentTotal").textContent =
      formatMoney(total);

    document.getElementById("customerDetails").hidden = true;

    document.getElementById("paymentSection").hidden = false;

  });

// ======================================
// PAYMENT PROOF UPLOAD
// ======================================

document.getElementById("proofForm")
  .addEventListener("submit", function(event) {

    event.preventDefault();

    const proof =
      document.getElementById("paymentProof").files[0];

    if (!proof) {

      alert("Please upload your proof of payment.");

      return;

    }

    if (proof.size > 5 * 1024 * 1024) {

      alert("Your file must not exceed 5MB.");

      return;

    }

    if (
      !proof.type.startsWith("image/") &&
      proof.type !== "application/pdf"
    ) {

      alert("Please upload an image or PDF file.");

      return;

    }

    orderNumber =
      "ANIAH-" + Date.now().toString().slice(-8);

    const total = cart.reduce((sum, item) => {

      const product = products.find(p => p.id === item.id);

      return sum + product.price * item.quantity;

    }, 0);

    const order = {

      orderNumber,

      customer,

      items: cart.map(item => {

        const product = products.find(p => p.id === item.id);

        return {
          name: product.name,
          quantity: item.quantity,
          price: product.price
        };

      }),

      total,

      proofFileName: proof.name,

      transferReference:
        document.getElementById("transferReference").value,

      status: "Awaiting payment verification",

      date: new Date().toISOString()

    };

    // DEMO ONLY:
    // Save order details locally.
    // A production backend must receive the actual proof file.

    const previousOrders =
      JSON.parse(localStorage.getItem("aniahOrders") || "[]");

    previousOrders.push(order);

    localStorage.setItem(
      "aniahOrders",
      JSON.stringify(previousOrders)
    );

    // Display confirmation

    document.getElementById("orderNumber").textContent =
      orderNumber;

    document.getElementById("paymentSection").hidden = true;

    document.getElementById("orderSuccess").hidden = false;

    cart = [];

    updateCart();

  });

// ======================================
// FINISH ORDER
// ======================================

document.getElementById("finishShopping")
  .addEventListener("click", () => {

    checkoutModal.classList.remove("open");

    document.getElementById("customerForm").reset();

    document.getElementById("proofForm").reset();

    document.getElementById("customerDetails").hidden = false;

    document.getElementById("paymentSection").hidden = true;

    document.getElementById("orderSuccess").hidden = true;

  });

// ======================================
// MOBILE NAVIGATION
// ======================================

document.getElementById("menuToggle")
  .addEventListener("click", () => {

    document.getElementById("navigation")
      .classList.toggle("open");

  });

// ======================================
// SEARCH BUTTON
// ======================================

document.getElementById("searchButton")
  .addEventListener("click", () => {

    document.getElementById("shop").scrollIntoView();

    document.getElementById("searchInput").focus();

  });

// ======================================
// NEWSLETTER DEMO
// ======================================

document.getElementById("newsletterForm")
  .addEventListener("submit", function(event) {

    event.preventDefault();

    alert("Thank you for joining Aniah's Collection!");

    this.reset();

  });

// ======================================
// FOOTER AND WHATSAPP
// ======================================

document.getElementById("year").textContent =
  new Date().getFullYear();

document.getElementById("whatsappLink").href =
  "https://wa.me/" + STORE.whatsapp;

// ======================================
// INITIALISE WEBSITE
// ======================================

displayProducts();

updateCart();
