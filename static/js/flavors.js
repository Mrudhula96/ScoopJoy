let currentIndex = 0;

function moveSlide(direction) {
  const slides = document.querySelectorAll('.slide');
  const totalSlides = slides.length;

  currentIndex += direction;

  if (currentIndex < 0) {
    currentIndex = totalSlides - 1;
  } else if (currentIndex >= totalSlides) {
    currentIndex = 0;
  }

  const slidesContainer = document.querySelector('.slides');
  slidesContainer.style.transform = `translateX(-${currentIndex * 100}%)`;
}

let cart = [];

function addToCart(itemName) {
  // Add item to the cart array
  cart.push(itemName);
  console.log(`${itemName} added to cart.`);

  // Optionally, display the updated cart content in the console or on the page
  alert(`${itemName} added to your cart!`);
  console.log(cart);
}

// Optional: You can add a button somewhere on the page to view the cart
// Here's how to log the cart items:
function viewCart() {
  alert('Your Cart: ' + cart.join(', '));
}