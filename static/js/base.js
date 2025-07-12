document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM fully loaded");

    // Menu toggle
    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");
    const dropdowns = document.querySelectorAll(".dropdown");

    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", () => {
            navLinks.classList.toggle("active");
        });
    }

    if (dropdowns.length > 0) {
        dropdowns.forEach(dropdown => {
            const dropdownToggle = dropdown.querySelector(".dropdown-toggle");
            if (dropdownToggle) {
                dropdownToggle.addEventListener("click", (e) => {
                    e.preventDefault();
                    if (window.innerWidth <= 768) {
                        dropdown.classList.toggle("active");
                    }
                });
            }
        });
    }

    document.addEventListener("click", (e) => {
        if (window.innerWidth <= 768) {
            const navbar = document.querySelector(".navbar");
            const isClickInsideNav = navbar && navbar.contains(e.target);
            if (!isClickInsideNav) {
                navLinks.classList.remove("active");
                dropdowns.forEach(dropdown => dropdown.classList.remove("active"));
            }
        }
    });

    // Get CSRF token
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    const csrftoken = getCookie('csrftoken');

    // Cart count
    fetch("/cart/count/")
        .then(res => res.json())
        .then(data => {
            document.querySelector(".cart-count").textContent = data.count || 0;
        })
        .catch(err => console.error("Cart count fetch failed", err));

    // Add to Cart handler
    const addToCartButtons = document.querySelectorAll(".add-to-cart-btn");
    if (addToCartButtons.length > 0) {
        addToCartButtons.forEach(button => {
            button.addEventListener("click", function (e) {
                e.preventDefault();
                const productId = button.getAttribute("data-product-id");
                fetch(`/cart/add/${productId}/`, {
                    method: "POST",
                    headers: {
                        "X-CSRFToken": csrftoken,
                        "Content-Type": "application/json"
                    }
                })
                .then(response => {
                    // Check if the response is a redirect (status 302) to the login page or product page
                    if (response.redirected || response.status === 302) {
                        window.location.href = response.url;
                    }
                })
                .catch(err => {
                    console.error("Add to cart request failed", err);
                });
            });
        });
    }

    // Search submit
    const searchForm = document.getElementById("search-form");
    const searchInput = document.getElementById("searchInput");

    if (searchForm && searchInput) {
        searchForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (query) {
                window.location.href = `/search/?q=${encodeURIComponent(query)}`;
            }
        });
    }

    // Live Search Suggestions
    if (searchInput) {
        searchInput.addEventListener("input", function () {
            const query = searchInput.value.trim();
            const searchResults = document.getElementById("searchResults");

            if (query.length < 2) {
                searchResults.innerHTML = "";
                return;
            }

            fetch(`/api/search/?q=${encodeURIComponent(query)}`)
                .then(response => response.json())
                .then(data => {
                    searchResults.innerHTML = "";

                    if (data.results.length === 0) {
                        const li = document.createElement("li");
                        li.textContent = "No results found";
                        searchResults.appendChild(li);
                        return;
                    }

                    data.results.forEach(item => {
                        const li = document.createElement("li");
                        const link = document.createElement("a");
                        link.href = item.url;
                        link.textContent = item.name;
                        li.appendChild(link);
                        searchResults.appendChild(li);
                    });
                })
                .catch(err => {
                    console.error("Live search failed", err);
                    searchResults.innerHTML = "";
                });
        });
    }  

    // Close search results when clicking outside
    document.addEventListener("click", function (event) {
        const searchResults = document.getElementById("searchResults");
        const isClickInsideSearch = searchInput.contains(event.target) || searchResults.contains(event.target);
        if (!isClickInsideSearch) {
            searchResults.innerHTML = "";
        }
    });
});