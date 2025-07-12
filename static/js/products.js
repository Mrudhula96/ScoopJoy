console.log("products.js loaded");

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
        const cookies = document.cookie.split(";");
        for (let cookie of cookies) {
            const trimmed = cookie.trim();
            if (trimmed.startsWith(name + "=")) {
                cookieValue = decodeURIComponent(trimmed.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

const csrftoken = getCookie("csrftoken");
let cartItems = {};
let products = [];
let isAuthenticated = false;

async function checkAuthStatus() {
    try {
        const response = await fetch("/api/check-auth/");
        const data = await response.json();
        isAuthenticated = data.is_authenticated;
    } catch (error) {
        console.error("Error checking auth status:", error);
        isAuthenticated = false;
    }
}

function setCartCount(count) {
    localStorage.setItem("cartCount", count);
    const cartCount = document.querySelector(".cart-count");
    if (cartCount) {
        cartCount.textContent = count;
        console.log("Cart count updated to:", count);
    }
    updateViewCartBar();
}

function updateViewCartBar() {
    const viewCartBar = document.getElementById("viewCartBar");
    const cartTotalItems = document.getElementById("cartTotalItems");
    const cartTotalPrice = document.getElementById("cartTotalPrice");

    let totalItems = 0;
    let totalPrice = 0;

    for (const [productId, quantity] of Object.entries(cartItems)) {
        const product = products.find(p => p.id == productId);
        if (product) {
            totalItems += quantity;
            totalPrice += quantity * product.price;
        }
    }

    cartTotalItems.textContent = `${totalItems} item${totalItems !== 1 ? 's' : ''}`;
    cartTotalPrice.textContent = `₹${totalPrice}`;

    if (totalItems > 0) {
        viewCartBar.classList.remove("hidden");
    } else {
        viewCartBar.classList.add("hidden");
    }
}

function fetchCartItems() {
    return fetch("/cart/items/", {
        method: "GET",
        headers: {
            "X-CSRFToken": csrftoken
        }
    })
    .then(res => {
        if (res.redirected || res.status === 302) {
            return { cart: {} };
        }
        return res.json();
    })
    .then(data => {
        cartItems = data.cart || {};
        console.log("Fetched cart items:", cartItems);
        updateViewCartBar();
    })
    .catch(err => {
        console.error("Error fetching cart items:", err);
        cartItems = {};
        updateViewCartBar();
    });
}

async function fetchProducts() {
    try {
        const currentPath = window.location.pathname;
        let category = null;
        if (currentPath.includes('/sticks/')) {
            category = 'sticks';
        } else if (currentPath.includes('/cones/')) {
            category = 'cones';
        } else if (currentPath.includes('/tubs/')) {
            category = 'tubs';
        }

        let url = "/api/products/";
        if (category) {
            url += `?category=${category}`;
        }

        const response = await fetch(url);
        const data = await response.json();
        products = data.products || [];
    } catch (error) {
        console.error("Error fetching products:", error);
        products = [];
    }
}

const container = document.getElementById("productsContainer");

// Add toast function for better UX
function showToast(message, type = 'error') {
    console.log(`Showing toast: ${message}, type: ${type}`);
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '8px';
    toast.style.color = 'white';
    toast.style.background = type === 'error' ? '#e85c5c' : '#FF6B6B';
    toast.style.zIndex = '1000';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function createProductCard(product) {
    const card = document.createElement("div");
    card.classList.add("product-card");

    card.innerHTML = `
        <img src="${product.image}" alt="${product.name}">
        <h3>${product.name}</h3>
        <p>₹${product.price}</p>
        <button class="add-to-cart-btn" data-product-id="${product.id}">Add to Cart</button>
    `;

    const addButton = card.querySelector(".add-to-cart-btn");
    addButton.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated) {
            showToast("Please log in to add items to your cart.");
            const returnUrl = window.location.pathname;
            window.location.href = `/login/?next=${encodeURIComponent(returnUrl)}`;
            return;
        }
        const productId = addButton.getAttribute("data-product-id");
        fetch(`/cart/add/${productId}/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrftoken
            },
            body: JSON.stringify({})
        })
        .then((res) => {
            if (res.redirected || res.status === 302) {
                window.location.href = res.url;
                return;
            }
            return res.json();
        })
        .then((data) => {
            if (data && data.message === "Added") {
                cartItems[productId] = (cartItems[productId] || 0) + 1;
                setCartCount(data.cart_count);
                showToast("Item added to cart!", "success");
                showQuantityControls(card, productId, cartItems[productId]);
            } else {
                showToast(data.error || "Failed to add item to cart.", "error");
            }
        })
        .catch((error) => {
            console.error("Error adding to cart:", error);
            showToast("Something went wrong. Please try again.", "error");
        });
    });

    return card;
}

function showQuantityControls(card, productId, quantity = 1) {
    const addButton = card.querySelector(".add-to-cart-btn");
    if (addButton) addButton.remove();

    const wrapper = document.createElement("div");
    wrapper.classList.add("cart-buttons");

    const decrementBtn = document.createElement("button");
    decrementBtn.textContent = "−";
    decrementBtn.className = "quantity-btn decrement-btn";

    const quantitySpan = document.createElement("span");
    quantitySpan.className = "quantity-value";
    quantitySpan.textContent = quantity;

    const incrementBtn = document.createElement("button");
    incrementBtn.textContent = "+";
    incrementBtn.className = "quantity-btn increment-btn";

    wrapper.appendChild(decrementBtn);
    wrapper.appendChild(quantitySpan);
    wrapper.appendChild(incrementBtn);
    card.appendChild(wrapper);

    incrementBtn.addEventListener("click", () => {
        fetch(`/cart/add/${productId}/`, {
            method: "POST",
            headers: {
                "X-CSRFToken": csrftoken
            },
            body: JSON.stringify({})
        })
        .then(res => {
            if (res.redirected || res.status === 302) {
                window.location.href = res.url;
                return;
            }
            return res.json();
        })
        .then(data => {
            if (data) {
                let val = parseInt(quantitySpan.textContent);
                quantitySpan.textContent = val + 1;
                cartItems[productId] = val + 1;
                setCartCount(data.cart_count);
                showToast("Item quantity increased!", "success");
            } else {
                showToast(data.error || "Failed to update quantity.", "error");
            }
        })
        .catch(err => {
            console.error("Error incrementing quantity:", err);
            showToast("Something went wrong. Please try again.", "error");
        });
    });

    decrementBtn.addEventListener("click", () => {
        fetch(`/cart/update/${productId}/`, {
            method: "POST",
            headers: {
                "X-CSRFToken": csrftoken,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ action: "decrement" })
        })
        .then(res => {
            if (res.redirected || res.status === 302) {
                window.location.href = res.url;
                return;
            }
            return res.json();
        })
        .then(data => {
            if (data) {
                let val = parseInt(quantitySpan.textContent);
                if (val > 1) {
                    quantitySpan.textContent = val - 1;
                    cartItems[productId] = val - 1;
                    showToast("Item quantity decreased!", "success");
                } else {
                    delete cartItems[productId];
                    wrapper.remove();
                    const btn = document.createElement("button");
                    btn.className = "add-to-cart-btn";
                    btn.textContent = "Add to Cart";
                    btn.setAttribute("data-product-id", productId);
                    card.appendChild(btn);
                    btn.addEventListener("click", () => {
                        fetch(`/cart/add/${productId}/`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "X-CSRFToken": csrftoken
                            },
                            body: JSON.stringify({})
                        })
                        .then((res) => {
                            if (res.redirected || res.status === 302) {
                                window.location.href = res.url;
                                return;
                            }
                            return res.json();
                        })
                        .then(data => {
                            if (data) {
                                cartItems[productId] = 1;
                                setCartCount(data.cart_count);
                                showToast("Item added to cart!", "success");
                                showQuantityControls(card, productId, 1);
                            } else {
                                showToast(data.error || "Failed to add item to cart.", "error");
                            }
                        })
                        .catch(err => {
                            console.error("Error re-adding to cart:", err);
                            showToast("Something went wrong. Please try again.", "error");
                        });
                    });
                }
                setCartCount(data.cart_count);
            } else {
                showToast(data.error || "Failed to update quantity.", "error");
            }
        })
        .catch(err => {
            console.error("Error decrementing quantity:", err);
            showToast("Something went wrong. Please try again.", "error");
        });
    });
}

async function loadProducts() {
    await checkAuthStatus();
    await fetchProducts();

    try {
        if (isAuthenticated) {
            await fetchCartItems();
        } else {
            cartItems = {};
            updateViewCartBar();
        }
    } catch (error) {
        console.error("Failed to fetch cart items, proceeding without cart data:", error);
        cartItems = {};
        updateViewCartBar();
    }

    if (products.length === 0) {
        container.innerHTML = "<p>No products available at the moment. Please try again later.</p>";
        return;
    }

    products.forEach((product, index) => {
        const card = createProductCard(product);
        container.appendChild(card);
        setTimeout(() => card.classList.add("visible"), index * 100);

        if (cartItems[product.id] && isAuthenticated) {
            showQuantityControls(card, product.id, cartItems[product.id]);
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    loadProducts();
    fetch("/cart/count/")
        .then(res => res.json())
        .then(data => setCartCount(data.count))
        .catch(err => console.error("Error fetching cart count:", err));
});