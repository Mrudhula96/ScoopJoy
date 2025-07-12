// checkout.js
document.addEventListener("DOMContentLoaded", () => {
    console.log("checkout.js loaded at", new Date().toISOString());

    // MODAL ELEMENTS
    const addressModal = document.getElementById("addressModal");
    const addAddressModal = document.getElementById("addAddressModal");

    // BUTTONS
    const proceedBtn = document.getElementById("proceedBtn");
    const closeAddressModalBtn = document.getElementById("closeModal");
    const closeAddModalBtn = document.getElementById("closeAddAddressModal");

    // ADDRESSES
    const deliverButtons = document.querySelectorAll(".deliver-btn");
    const addNewTile = document.getElementById("addNewTile");

    // SELECTED DISPLAY
    const addressBox = document.getElementById("selectedAddressBox");
    const addressInput = document.getElementById("selectedAddressInput");
    const addressLabel = document.getElementById("addressLabel");
    const fullAddressText = document.getElementById("fullAddressText");
    const addressDropdownTrigger = document.getElementById("addressDropdownTrigger");

    const selectedAddressForm = document.getElementById("selectedAddressForm");
    const modal = document.getElementById("orderPlacedModal");
    const sound = document.getElementById("orderSound");

    // Debug DOM elements
    console.log("selectedAddressForm:", selectedAddressForm);
    console.log("addressInput:", addressInput);

    // Toast function for better UX
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
        toast.style.background = type === 'error' ? '#e55648' : '#4caf50';
        toast.style.zIndex = '1000';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // === OPEN ADDRESS SELECTION MODAL ===
    proceedBtn?.addEventListener("click", () => {
        console.log("Proceed button clicked");
        addressModal.style.display = "block";
    });

    // === ALSO OPEN ADDRESS MODAL WHEN DROPDOWN IS CLICKED ===
    addressDropdownTrigger?.addEventListener("click", () => {
        console.log("Address dropdown trigger clicked");
        addressModal.style.display = "block";
    });

    // === CLOSE ADDRESS SELECTION MODAL ===
    closeAddressModalBtn?.addEventListener("click", () => {
        console.log("Close address modal clicked");
        addressModal.style.display = "none";
    });

    // === OPEN ADD ADDRESS MODAL ===
    addNewTile?.addEventListener("click", () => {
        console.log("Add new address tile clicked");
        addAddressModal.style.display = "block";
    });

    // === CLOSE ADD ADDRESS MODAL ===
    closeAddModalBtn?.addEventListener("click", () => {
        console.log("Close add address modal clicked");
        addAddressModal.style.display = "none";
    });

    // === CLOSE MODALS ON OUTSIDE CLICK ===
    window.addEventListener("click", (event) => {
        if (event.target === addressModal) {
            console.log("Clicked outside address modal");
            addressModal.style.display = "none";
        }
        if (event.target === addAddressModal) {
            console.log("Clicked outside add address modal");
            addAddressModal.style.display = "none";
        }
    });

    // === HANDLE DELIVER BUTTON SELECTION ===
    deliverButtons.forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            console.log("Deliver button clicked");
            const tile = btn.closest(".address-tile");
            const name = tile.querySelector(".name")?.textContent || "home";
            const addressText = tile.querySelector("p")?.textContent || "";
            const id = tile.dataset.id;

            addressInput.value = id;
            addressLabel.textContent = name;
            fullAddressText.textContent = addressText;

            addressBox.style.display = "block";
            proceedBtn.style.display = "none";
            addressModal.style.display = "none";
        });
    });

    // === SUBMIT ORDER FORM WITH SUCCESS MODAL & CONFETTI ===
    if (!selectedAddressForm) {
        console.error("selectedAddressForm not found in DOM");
        showToast("Form not found. Please refresh the page.");
        return;
    }

    selectedAddressForm.addEventListener("submit", async (e) => {
        console.log("Form submission intercepted");
        e.preventDefault();

        const placeOrderBtn = document.querySelector('button[form="selectedAddressForm"][type="submit"]');
        console.log("placeOrderBtn:", placeOrderBtn);
        if (!placeOrderBtn) {
            console.error("Place Order button not found");
            showToast("Place Order button not found. Please refresh the page.");
            return;
        }

        // Add loading state
        placeOrderBtn.disabled = true;
        const originalText = placeOrderBtn.textContent;
        placeOrderBtn.textContent = "Placing Order...";

        // Check if an address is selected
        if (!addressInput.value) {
            showToast("Please select a delivery address.");
            placeOrderBtn.disabled = false;
            placeOrderBtn.textContent = originalText;
            return;
        }

        // Check authentication status
        console.log("Fetching auth status from /api/check-auth/");
        try {
            const startTime = performance.now();
            const authResponse = await fetch('/api/check-auth/', {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            const authTime = performance.now() - startTime;
            console.log(`Auth check took ${authTime.toFixed(2)}ms`);
            console.log("Auth response status:", authResponse.status);
            if (!authResponse.ok) {
                throw new Error(`HTTP error! Status: ${authResponse.status}`);
            }
            const authData = await authResponse.json();
            console.log("Auth check:", authData);
            if (!authData.is_authenticated) {
                showToast("Session expired. Please log in again.");
                placeOrderBtn.disabled = false;
                placeOrderBtn.textContent = originalText;
                window.location.href = "/login/?next=/checkout/";
                return;
            }
        } catch (err) {
            console.error("Error checking auth status:", err);
            showToast("Unable to verify session. Please try again.");
            placeOrderBtn.disabled = false;
            placeOrderBtn.textContent = originalText;
            return;
        }

        // Fetch the latest cart state
        console.log("Fetching cart state from /cart/items/");
        try {
            const startTime = performance.now();
            const cartResponse = await fetch('/cart/items/', {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            const cartTime = performance.now() - startTime;
            console.log(`Cart fetch took ${cartTime.toFixed(2)}ms`);
            console.log("Cart response status:", cartResponse.status);
            if (cartResponse.redirected) {
                console.log("Cart request redirected to:", cartResponse.url);
                showToast("Session expired. Please log in again.");
                placeOrderBtn.disabled = false;
                placeOrderBtn.textContent = originalText;
                window.location.href = "/login/?next=/checkout/";
                return;
            }
            if (!cartResponse.ok) {
                throw new Error(`HTTP error! Status: ${cartResponse.status}`);
            }
            const cartData = await cartResponse.json();
            console.log("Cart state before order:", cartData);

            if (!cartData.cart || Object.keys(cartData.cart).length === 0) {
                showToast("Your cart is empty. Please add items to proceed.");
                placeOrderBtn.disabled = false;
                placeOrderBtn.textContent = originalText;
                window.location.href = "/cart/";
                return;
            }
        } catch (err) {
            console.error("Error fetching cart state:", err);
            showToast("Unable to verify cart. Please try again.");
            placeOrderBtn.disabled = false;
            placeOrderBtn.textContent = originalText;
            return;
        }

        const formData = new FormData(selectedAddressForm);
        console.log("Submitting order to /place-order/");
        try {
            const startTime = performance.now();
            const response = await fetch(selectedAddressForm.action, {
                method: "POST",
                headers: {
                    "X-Requested-With": 'XMLHttpRequest'
                },
                body: formData
            });
            const orderTime = performance.now() - startTime;
            console.log(`Order submission took ${orderTime.toFixed(2)}ms`);

            const responseData = await response.json();
            console.log(`Response status: ${response.status}, Body:`, responseData);

            if (response.ok) {
                console.log("✅ Order placed:", responseData);
                showToast("Order placed successfully!", "success");
                sound.play();
                modal.style.display = "flex";
                if (window.confetti) {
                    confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
                }
                setTimeout(() => {
                    window.location.href = "/orders/";
                }, 1500); // Reduced delay from 2500ms to 1500ms
            } else {
                console.error("❌ Order failed:", responseData);
                showToast("Failed to place order: " + (responseData.error || "Unknown error"));
                placeOrderBtn.disabled = false;
                placeOrderBtn.textContent = originalText;
            }
        } catch (err) {
            console.error("⚠️ Error during fetch:", err);
            showToast("Something went wrong. Please try again.");
            placeOrderBtn.disabled = false;
            placeOrderBtn.textContent = originalText;
        }
    });
});