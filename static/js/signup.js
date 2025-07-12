document.addEventListener("DOMContentLoaded", function () {
    const toggleIcons = document.querySelectorAll(".toggle-password");
    const passwordRules = document.getElementById("password-rules");
    const passwordInput = document.getElementById("id_password1");

    // Toggle password visibility
    toggleIcons.forEach((icon) => {
        icon.addEventListener("click", () => {
            const targetId = icon.getAttribute("data-target");
            const targetInput = document.getElementById(targetId);

            if (targetInput.type === "password") {
                targetInput.type = "text";
                icon.classList.remove("fa-eye");
                icon.classList.add("fa-eye-slash");
            } else {
                targetInput.type = "password";
                icon.classList.remove("fa-eye-slash");
                icon.classList.add("fa-eye");
            }
        });
    });

    // Show password rules only when typing starts
    if (passwordInput) {
        passwordInput.addEventListener("input", function () {
            passwordRules.style.display = "flex";
        });
    }
});
