console.log("login.js loaded");

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

function togglePassword() {
    const passwordInput = document.getElementById("id_password");
    const toggleIcon = document.querySelector(".toggle-password");
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        toggleIcon.classList.remove("fa-eye");
        toggleIcon.classList.add("fa-eye-slash");
    } else {
        passwordInput.type = "password";
        toggleIcon.classList.remove("fa-eye-slash");
        toggleIcon.classList.add("fa-eye");
    }
}

function showForm(formId) {
    const forms = ["login-form", "forgot-password-form", "otp-request-form", "otp-verify-form"];
    forms.forEach(id => {
        const form = document.getElementById(id);
        if (form) form.style.display = id === formId ? "block" : "none";
    });
    // Clear messages
    const messages = ["forgot-password-message", "otp-request-message", "otp-verify-message"];
    messages.forEach(id => {
        const message = document.getElementById(id);
        if (message) message.textContent = "";
    });
}

document.addEventListener("DOMContentLoaded", () => {
    // Show OTP Request Form
    document.getElementById("login-with-otp-link")?.addEventListener("click", (e) => {
        e.preventDefault();
        showForm("otp-request-form");
        document.getElementById("login-form").style.display = "none";
        document.getElementById("login-links").style.display = "none";
    });

    // Show Forgot Password Form
    document.getElementById("forgot-password-link")?.addEventListener("click", (e) => {
        e.preventDefault();
        showForm("forgot-password-form");
        document.getElementById("login-form").style.display = "none";
        document.getElementById("login-links").style.display = "none";
    });

    // Back from OTP
    document.getElementById("back-to-login-from-otp")?.addEventListener("click", (e) => {
        e.preventDefault();
        showForm("login-form");
        document.getElementById("login-form").style.display = "block";
        document.getElementById("login-links").style.display = "block";
    });

    // Back from Forgot Password
    document.getElementById("back-to-login-from-forgot")?.addEventListener("click", (e) => {
        e.preventDefault();
        showForm("login-form");
        document.getElementById("login-form").style.display = "block";
        document.getElementById("login-links").style.display = "block";
    });

    // Forgot Password Form Submission
    document.getElementById("forgot-password-form")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("forgot-email").value;
        const message = document.getElementById("forgot-password-message");

        fetch("/auth/password/reset/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrftoken
            },
            body: JSON.stringify({ email })
        })
            .then(res => res.json())
            .then(data => {
                if (data.status === "ok") {
                    message.textContent = "Password reset link sent to your email.";
                    message.style.color = "#28a745";
                } else {
                    message.textContent = data.error || "An error occurred.";
                    message.style.color = "#ff4f81";
                }
            })
            .catch(err => {
                message.textContent = "An error occurred. Please try again.";
                message.style.color = "#ff4f81";
                console.error("Error sending reset link:", err);
            });
    });

    // OTP Request Form Submission
    document.getElementById("otp-request-form")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("otp-email").value;
        const message = document.getElementById("otp-request-message");

        fetch("/auth/send-otp/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrftoken
            },
            body: JSON.stringify({ email })
        })
            .then(res => res.json())
            .then(data => {
                if (data.status === "ok") {
                    message.textContent = "OTP sent to your email.";
                    message.style.color = "#28a745";
                    showForm("otp-verify-form");
                    document.getElementById("otp-email").dataset.lastEmail = email;
                } else {
                    message.textContent = data.error || "An error occurred.";
                    message.style.color = "#ff4f81";
                }
            })
            .catch(err => {
                message.textContent = "An error occurred. Please try again.";
                message.style.color = "#ff4f81";
                console.error("Error sending OTP:", err);
            });
    });

    // OTP Verify Form Submission
    document.getElementById("otp-verify-form")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const otp = document.getElementById("otp-code").value;
        const email = document.getElementById("otp-email").dataset.lastEmail;
        const message = document.getElementById("otp-verify-message");

        fetch("/auth/verify-otp/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrftoken
            },
            body: JSON.stringify({ email, otp })
        })
            .then(res => res.json())
            .then(data => {
                if (data.status === "ok") {
                    message.textContent = "Login successful! Redirecting...";
                    message.style.color = "#28a745";
                    setTimeout(() => window.location.href = "/", 1000);
                } else {
                    message.textContent = data.error || "Invalid OTP.";
                    message.style.color = "#ff4f81";
                }
            })
            .catch(err => {
                message.textContent = "An error occurred. Please try again.";
                message.style.color = "#ff4f81";
                console.error("Error verifying OTP:", err);
            });
    });
});


document.querySelectorAll(".login-btn").forEach(button => {
    button.addEventListener("click", function (e) {
        const ripple = document.createElement("span");
        ripple.classList.add("ripple");
        this.appendChild(ripple);
        const rect = this.getBoundingClientRect();
        ripple.style.left = `${e.clientX - rect.left}px`;
        ripple.style.top = `${e.clientY - rect.top}px`;
        setTimeout(() => ripple.remove(), 600);
    });
});
