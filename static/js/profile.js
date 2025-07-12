document.addEventListener("DOMContentLoaded", function () {
    const menuItems = document.querySelectorAll(".menu li");
    const sections = document.querySelectorAll(".section");
    const showAddressFormBtn = document.getElementById("show-address-form");
    const addressFormContainer = document.getElementById("address-form-container");
    const cancelAddressFormBtn = document.getElementById("cancel-address-form");
    const addressList = document.querySelector(".address-list");
    const addressForm = document.getElementById("address-form");
    const formTitle = document.getElementById("form-title");
    const addressIdInput = document.getElementById("address-id");

    // Menu toggle
    menuItems.forEach(item => {
        item.addEventListener("click", () => {
            menuItems.forEach(i => i.classList.remove("active"));
            sections.forEach(s => s.classList.remove("active"));
            item.classList.add("active");
            document.getElementById(item.dataset.section).classList.add("active");

            // Reset and show address list on section switch
            if (addressFormContainer) {
                addressFormContainer.style.display = "none";
                showAddressFormBtn.style.display = "block";
                if (addressList) addressList.style.display = "block";
            }
        });
    });

    // Show add address form
    if (showAddressFormBtn && addressFormContainer) {
        showAddressFormBtn.addEventListener("click", () => {
            addressForm.reset();
            addressForm.action = ""; // clear action
            addressIdInput.value = ""; // clear hidden id
            formTitle.textContent = "Add New Address";
            addressFormContainer.style.display = "block";
            showAddressFormBtn.style.display = "none";
            if (addressList) addressList.style.display = "block"; // keep list visible when adding
        });
    }

    // Cancel form
    if (cancelAddressFormBtn && addressFormContainer) {
        cancelAddressFormBtn.addEventListener("click", () => {
            addressFormContainer.style.display = "none";
            showAddressFormBtn.style.display = "block";
            if (addressList) addressList.style.display = "block"; // show list again
            addressForm.reset();
            formTitle.textContent = "Add New Address";
        });
    }

    // Edit/Delete click delegation
    if (addressList) {
        addressList.addEventListener("click", (event) => {
            const editBtn = event.target.closest(".edit-btn");
            const deleteBtn = event.target.closest(".delete-btn");

            if (editBtn) {
                const addressId = editBtn.getAttribute("data-address-id");
                console.log(`Edit clicked for address ID: ${addressId}`);

                fetch(`/get-address/${addressId}/`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.error) {
                            alert("Failed to fetch address data.");
                            return;
                        }

                        // Pre-fill form
                        document.getElementById("id_name").value = data.full_name;
                        document.getElementById("id_phone").value = data.phone;
                        document.getElementById("id_district").value = data.street;
                        document.getElementById("id_state").value = data.city;
                        document.getElementById("id_pin_code").value = data.pincode;

                        addressIdInput.value = addressId;
                        formTitle.textContent = "Edit Address";
                        addressFormContainer.style.display = "block";
                        showAddressFormBtn.style.display = "none";
                        if (addressList) addressList.style.display = "none"; // 👈 Hide saved addresses while editing
                    });
            }

            if (deleteBtn) {
                const addressId = deleteBtn.getAttribute("data-address-id");
                console.log(`Delete clicked for address ID: ${addressId}`);
            
                fetch(`/delete-address/${addressId}/`, {
                    method: "DELETE",
                    headers: {
                        "X-CSRFToken": getCookie("csrftoken"),
                    },
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        deleteBtn.closest(".address-card").remove();
                    } else {
                        alert("Failed to delete address.");
                    }
                });
            }            
        });
    }

    // Helper to get CSRF token
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== "") {
            const cookies = document.cookie.split(";");
            for (let cookie of cookies) {
                cookie = cookie.trim();
                if (cookie.startsWith(name + "=")) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
});
