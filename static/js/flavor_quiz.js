document.addEventListener("DOMContentLoaded", () => {
    const questions = [
        {
            text: "How do you unwind after a long day?",
            options: [
                { answer: "relax", text: "Reading a book", img: "books.jpg" },
                { answer: "exercise", text: "Going for a run", img: "running.jpg" },
                { answer: "social", text: "Chatting with friends", img: "friends.jpg" },
                { answer: "creative", text: "Doing something crafty", img: "craft.jpg" },
            ]
        },
        {
            text: "What's your go-to weekend activity?",
            options: [
                { answer: "chill", text: "Netflix and chill", img: "netflix.jpg" },
                { answer: "outdoors", text: "Nature walk", img: "nature_walk.jpg" },
                { answer: "party", text: "Party all night", img: "party.jpg" },
                { answer: "learn", text: "Learning a new skill", img: "learning.jpg" },
            ]
        },
        {
            text: "Pick your ideal vacation spot.",
            options: [
                { answer: "beach", text: "Sunny beach", img: "sunnyBeach.jpg" },
                { answer: "mountain", text: "Mountain retreat", img: "mountains.jpg" },
                { answer: "city", text: "City adventures", img: "city.jpg" },
                { answer: "home", text: "Staycation at home", img: "staycation.jpg" },
            ]
        },
        {
            text: "Which describes your personality best?",
            options: [
                { answer: "calm", text: "Calm and composed", img: "calm.jpg" },
                { answer: "bold", text: "Bold and brave", img: "bold.jpg" },
                { answer: "friendly", text: "Friendly and warm", img: "warm.webp" },
                { answer: "fun", text: "Fun and playful", img: "fun.jpeg" },
            ]
        },
        {
            text: "Choose a dessert.",
            options: [
                { answer: "vanilla", text: "Classic Vanilla", img: "classicVanilla.jpg" },
                { answer: "chocolate", text: "Rich Chocolate", img: "rich_chocolate.jpg" },
                { answer: "strawberry", text: "Fresh Strawberry", img: "fresh_strawberry.jpg" },
                { answer: "mint", text: "Cool Mint", img: "mint.jpg" },
            ]
        }
    ];

    const flavorMap = {
        relax: "Vanilla",
        exercise: "Mango",
        social: "Strawberry",
        creative: "Pistachio",
        chill: "Vanilla",
        outdoors: "Mint",
        party: "Chocolate",
        learn: "Coffee",
        beach: "Strawberry",
        mountain: "Pistachio",
        city: "CookieDough",
        home: "Vanilla",
        calm: "Vanilla",
        bold: "Chocolate",
        friendly: "Strawberry",
        fun: "Mango",
        vanilla: "Vanilla",
        chocolate: "Chocolate",
        strawberry: "Strawberry",
        mint: "Mint"
    };

    const flavorImages = {
        Vanilla: "vanilla_result.jpg",
        Mango: "mangoicecream_result.webp",
        Strawberry: "strawberry.jpg",
        Pistachio: "pistachio_result.jpg",
        Chocolate: "chocolate.jpg",
        Coffee: "coffee_result.jpg",
        Mint: "mint.jpg",
        CookieDough: "cookieDough.jpg"
    };

    let currentQuestion = 0;
    let selectedAnswers = [];

    const quizContent = document.getElementById("quiz-content");

    function showQuestion() {
        const q = questions[currentQuestion];
        quizContent.innerHTML = `
            <h2 class="question-title">${q.text}</h2>
            <div class="options-container">
                ${q.options.map(option => `
                    <div class="option" data-answer="${option.answer}">
                        <img src="${staticPath}${option.img}" alt="${option.text}">
                        <p>${option.text}</p>
                    </div>
                `).join('')}
            </div>
        `;
    
        document.querySelectorAll(".option").forEach(opt => {
            opt.addEventListener("click", () => {
                selectedAnswers.push(opt.getAttribute("data-answer"));
                currentQuestion++;
                if (currentQuestion < questions.length) {
                    showQuestion();
                } else {
                    showResult();
                }
            });
        });
    }   

    function showResult() {
        const flavorScores = {};
        selectedAnswers.forEach(ans => {
            const flavor = flavorMap[ans] || "Chocolate";
            flavorScores[flavor] = (flavorScores[flavor] || 0) + 1;
        });

        const resultFlavor = Object.entries(flavorScores).sort((a, b) => b[1] - a[1])[0][0];
        const resultImg = flavorImages[resultFlavor] || "quiz_chocolate_result.jpg";

        quizContent.innerHTML = `
            <div class="result">
                <h2>You got ${resultFlavor}!</h2>
                <p>This flavor matches your vibe perfectly!</p>
                <img src="${staticPath}${resultImg}" alt="${resultFlavor} Image">
                <button class="retry-btn">Take Quiz Again</button>
            </div>
        `;

        document.querySelector(".retry-btn").addEventListener("click", () => {
            currentQuestion = 0;
            selectedAnswers = [];
            showQuestion();
        });
    }

    showQuestion();
});

