// cart.js
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

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

document.addEventListener("DOMContentLoaded", () => {
    const csrftoken = getCookie("csrftoken");
    console.log("CSRF Token:", csrftoken);
    console.log("Using cart.js version 2025-05-26-3");

    if (!csrftoken) {
        console.error("CSRF token not found");
        showToast("Session error. Please refresh the page or log in again.");
        return;
    }

    function attachButtonListeners() {
        document.querySelectorAll('.increment').forEach(button => {
            const newButton = button.cloneNode(true);
            button.replaceWith(newButton);
            newButton.addEventListener('click', debounce(() => updateQuantity(newButton.dataset.id, 'increment'), 300));
        });

        document.querySelectorAll('.decrement').forEach(button => {
            const newButton = button.cloneNode(true);
            button.replaceWith(newButton);
            newButton.addEventListener('click', debounce(() => updateQuantity(newButton.dataset.id, 'decrement'), 300));
        });
    }

    attachButtonListeners();

    function updateQuantity(productId, action) {
        console.log(`Updating quantity for product ${productId}, action: ${action}`);
        fetch(`/cart/update/${productId}/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrftoken
            },
            body: JSON.stringify({ action })
        })
        .then(res => {
            if (res.redirected || res.status === 302) {
                console.log("Redirected to:", res.url);
                window.location.href = res.url;
                return null;
            }
            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            if (!data) return;
            console.log("Update response:", data);
            if (data.error) {
                console.error("Error updating cart:", data.error);
                showToast("Failed to update cart: " + data.error);
                const cartItem = document.querySelector(`.cart-item[data-id="${productId}"]`);
                if (cartItem) {
                    const buttons = cartItem.querySelectorAll('.increment, .decrement');
                    buttons.forEach(button => button.disabled = true);
                }
                return;
            }
            if (data.message === "Updated") {
                const cartItem = document.querySelector(`.cart-item[data-id="${productId}"]`);
                if (!cartItem) {
                    console.error(`Cart item not found for product ${productId}`);
                    return;
                }
                const details = cartItem.querySelector('.details');
                const quantityControls = details.querySelector('.quantity-controls');
                const itemTotal = details.querySelector('.item-total');
                if (!details || !itemTotal) {
                    console.error(`Details or item-total not found for product ${productId}`);
                    return;
                }
                if (data.quantity > 0) {
                    if (quantityControls) {
                        const quantitySpan = quantityControls.querySelector('span');
                        if (!quantitySpan) {
                            console.error(`Quantity span not found for product ${productId}`);
                            return;
                        }
                        quantitySpan.textContent = data.quantity;
                        const itemTotalValue = parseFloat(data.item_total);
                        if (isNaN(itemTotalValue)) {
                            console.error(`Invalid item_total value for product ${productId}: ${data.item_total}`);
                            return;
                        }
                        itemTotal.textContent = `₹${itemTotalValue.toFixed(2)}`;
                        console.log(`Updated quantity to ${data.quantity} for product ${productId}`);
                    } else {
                        console.error(`Quantity controls not found for product ${productId}`);
                        return;
                    }
                } else {
                    cartItem.remove();
                    console.log(`Removed cart item for product ${productId}`);
                }
                updateCartTotalAndCount(data.cart_count);
            }
        })
        .catch(err => {
            console.error("Error updating cart:", err);
            if (err.message.includes("HTTP error")) {
                showToast("Failed to communicate with the server. Please try again.");
            } else {
                showToast("An unexpected error occurred. Please try again.");
            }
        });
    }

    function updateCartTotalAndCount(cartCount) {
        const cartTotal = document.getElementById('cart-total');
        if (!cartTotal) {
            console.error("Cart total element not found");
            return;
        }
        let total = 0;
        const cartItems = document.querySelectorAll('.cart-item');
        cartItems.forEach(item => {
            const itemTotalElement = item.querySelector('.item-total');
            if (!itemTotalElement) {
                console.error("Item total element not found in cart item");
                return;
            }
            const itemTotalText = itemTotalElement.textContent;
            const itemTotalValue = parseFloat(itemTotalText.replace('₹', '')) || 0;
            total += itemTotalValue;
        });
        cartTotal.textContent = total.toFixed(2);
        const cartCountElement = document.querySelector('.cart-count');
        if (cartCountElement) {
            cartCountElement.textContent = cartCount;
            console.log("Cart count updated to:", cartCount);
        }
        const cartItemsContainer = document.querySelector('.cart-items');
        if (!cartItemsContainer) {
            console.error("Cart items container not found");
            return;
        }
        if (cartItems.length === 0) {
            cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
            console.log("Cart is empty, displaying empty message");
            // Redirect to cart page to ensure fresh state
            setTimeout(() => {
                window.location.href = "/cart/";
            }, 1000);
        }
    }

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
        toast.style.background = type === 'error' ? '#e55648' : '#ff6f61';
        toast.style.zIndex = '1000';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
});