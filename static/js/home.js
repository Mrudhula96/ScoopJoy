document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM fully loaded");

    // Slider Functionality
    const slides = document.querySelectorAll(".slide");
    let currentIndex = 0;
    let interval;

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.toggle("active", i === index);
        });
    }

    function nextSlide() {
        currentIndex = (currentIndex + 1) % slides.length;
        showSlide(currentIndex);
    }

    function startAutoplay() {
        interval = setInterval(nextSlide, 5000);
    }

    const slider = document.querySelector(".slider");
    if (slider) {
        slider.addEventListener("mouseleave", startAutoplay);
    }

    if (slides.length > 0) {
        showSlide(currentIndex);
        startAutoplay();
    }

    // Menu Item Slide-In Animation
    const menuImages = document.querySelectorAll(".menu-item[data-type='image'] img");
    menuImages.forEach((img, index) => {
        setTimeout(() => {
            img.classList.add("slide-in");
        }, index * 20);
    });
});
