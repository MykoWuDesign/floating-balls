const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const interactivePoints = [];
const backgroundPoints = [];
const whiteDots = [];
const imageElements = [];
const ripples = [];
const names = ['Nova Strider', 'Zephyr Byte', 'Orion Vanguard', 'Pixel Jester', 'Aether Monarch'];

let hoveredPoint = null;
let cursorX = -1;
let cursorY = -1;

const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const halfWidth = canvas.width * 0.375;
const halfHeight = canvas.height * 0.375;

const imageUrls = [
    'images/E_Chat_Profile.png', // Replace with your image URLs
    'images/F_Chat_Profile.png',
    'images/Hero_Chat_Profile.png',
    'images/Jester_Chat_Profile.png',
    'images/Ruler_Chat_Profile.png'
];

const descriptions = [
    'A fearless explorer of the metaverse, seeking new realms and adventures.',
    'A skilled coder and hacker, known for unlocking the deepest secrets of the digital world.',
    'A legendary hero, defending the virtual realms from all forms of digital threats.',
    'A playful trickster, using wit and charm to navigate the complexities of the gaming universe.',
    'A sovereign ruler of the metaverse, wielding unparalleled power and wisdom.'
];

const responses = {
    'Nova Strider': [
        "Exploring the metaverse has been thrilling! What's your favorite virtual realm?",
        "I recently discovered a new planet in the outer rim. It's breathtaking!",
        "Have you tried the latest VR adventure game? It's out of this world!"
    ],
    'Zephyr Byte': [
        "Just cracked the code for a new encryption algorithm. Feeling accomplished!",
        "The digital landscape is evolving rapidly. Keeping up is a challenge, but I love it.",
        "What's the latest hack you've tried? Share your experience!"
    ],
    'Orion Vanguard': [
        "Defending the virtual realms is no easy task, but it's my duty.",
        "Encountered a formidable enemy in the last battle. Victory was ours!",
        "The metaverse needs more heroes. Are you ready to join the fight?"
    ],
    'Pixel Jester': [
        "Life in the gaming universe is always fun and unpredictable!",
        "I just pulled off an epic prank on a rival gamer. Their reaction was priceless!",
        "What's the funniest glitch you've encountered in a game?"
    ],
    'Aether Monarch': [
        "Ruling the metaverse requires wisdom and strategy. It's a delicate balance.",
        "I foresee great changes coming to our virtual world. Are you prepared?",
        "Tell me, what would you change in the metaverse if you had the power?"
    ]
};

let gradientOffset = 0;
let currentZoomedImage = null;
let speedFactor = 1; // Initial speed factor
const maxSpeedFactor = 5; // Maximum speed factor

const createPoints = () => {
    for (let i = 0; i < 5; i++) {
        const point = {
            x: centerX - halfWidth / 2 + Math.random() * halfWidth,
            y: centerY - halfHeight / 2 + Math.random() * halfHeight,
            vx: (Math.random() * 2 - 1) * 0.5,
            vy: (Math.random() * 2 - 1) * 0.5,
            originalVx: null,
            originalVy: null,
            size: 10, // Smaller size
            hitRadius: 15, // Adjusted hit radius
            isInteractive: true,
            isHovered: false,
            isGlowing: false,
            name: names[i],
            description: descriptions[i]
        };
        interactivePoints.push(point);

        const img = document.createElement('img');
        img.src = imageUrls[i];
        img.classList.add('floating-image');
        img.style.position = 'absolute';
        img.style.pointerEvents = 'auto'; // Allow the image to receive mouse events
        img.dataset.zoomed = 'false'; // Initial zoom state
        img.dataset.scale = 1; // Initial scale
        document.body.appendChild(img);

        img.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent the global click event from firing
            toggleZoomImage(img, point);
            createRipple(point.x, point.y);
        });

        img.addEventListener('mouseover', () => {
            point.originalVx = point.vx;
            point.originalVy = point.vy;
            point.vx = 0;
            point.vy = 0;
            point.isHovered = true;
        });

        img.addEventListener('mouseout', () => {
            if (point.isHovered && img.dataset.zoomed !== 'true') {
                point.vx = point.originalVx;
                point.vy = point.originalVy;
                point.originalVx = null;
                point.originalVy = null;
                point.isHovered = false;
            }
        });

        imageElements.push({ img, point });
    }
    for (let i = 0; i < 25; i++) {
        backgroundPoints.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: Math.random() * 2 - 1,
            vy: Math.random() * 2 - 1,
            size: Math.random() * 5 + 3,
            opacity: 0.5,
            isInteractive: false,
            isGlowing: false
        });
    }

    // Create 100 very small white dots
    for (let i = 0; i < 100; i++) {
        whiteDots.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() * 2 - 1) * 0.1,
            vy: (Math.random() * 2 - 1) * 0.1,
            size: Math.random() * 3 + 1
        });
    }
};

const drawWhiteDots = () => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    whiteDots.forEach(dot => {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.size, 0, 2 * Math.PI);
        ctx.fill();

        // Update dot position
        dot.x += dot.vx * speedFactor;
        dot.y += dot.vy * speedFactor;

        // Wrap around canvas edges
        if (dot.x < -dot.size) dot.x = canvas.width + dot.size;
        if (dot.x > canvas.width + dot.size) dot.x = -dot.size;
        if (dot.y < -dot.size) dot.y = canvas.height + dot.size;
        if (dot.y > canvas.height + dot.size) dot.y = -dot.size;
    });
};

const drawLines = (points, opacity = 1) => {
    for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
            const distance = Math.sqrt(Math.pow(points[i].x - points[j].x, 2) + Math.pow(points[i].y - points[j].y, 2));
            if (distance < 300) {
                ctx.strokeStyle = points[i].isGlowing || points[j].isGlowing ? `rgba(255, 215, 0, ${opacity})` : `rgba(204, 204, 204, ${opacity})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(points[i].x, points[i].y);
                ctx.lineTo(points[j].x, points[j].y);
                ctx.stroke();
            }
        }
    }
    // Draw lines between gold balls and their corresponding images
    imageElements.forEach(({ img, point }) => {
        const imgCenterX = img.offsetLeft + img.width / 2;
        const imgCenterY = img.offsetTop + img.height / 2;
        ctx.strokeStyle = 'rgba(255, 215, 0, 1)'; // Gold color
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(imgCenterX, imgCenterY);
        ctx.stroke();
    });
};

const drawPoints = (points) => {
    for (const point of points) {
        const gradient = ctx.createRadialGradient(point.x, point.y, point.isInteractive ? 5 : 2, point.x, point.y, point.isInteractive ? 20 : 10);
        gradient.addColorStop(0, point.isInteractive ? 'gold' : 'grey');
        gradient.addColorStop(1, point.isInteractive ? 'orange' : 'darkgrey');
        ctx.fillStyle = point.isGlowing ? 'rgba(255, 215, 0, 0.1)' : gradient;
        ctx.shadowColor = point.isGlowing ? 'rgba(255, 215, 0, 0.1)' : point === hoveredPoint ? 'rgba(255, 215, 0, 0.8)' : 'transparent';
        ctx.shadowBlur = point.isGlowing ? 20 : point === hoveredPoint ? 20 : 0;
        ctx.globalAlpha = point.opacity || 1;
        ctx.beginPath();
        ctx.arc(point.x, point.y, point.size, 0, 2 * Math.PI);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
};

const updatePoints = (points) => {
    points.forEach((point, index) => {
        point.x += point.vx * speedFactor;
        point.y += point.vy * speedFactor;
        if (point.isInteractive) {
            updateInteractivePoints(point, index);
        } else {
            if (point.x < 0 || point.x > canvas.width) point.vx *= -1;
            if (point.y < 0 || point.y > canvas.height) point.vy *= -1;
        }
    });
};

const updateInteractivePoints = (point, index) => {
    if (point.x < centerX - halfWidth / 2 || point.x > centerX + halfWidth / 2) point.vx *= -1;
    if (point.y < centerY - halfHeight / 2 || point.y > centerY + halfHeight / 2) point.vy *= -1;
    if (Math.abs(point.x - cursorX) < point.hitRadius && Math.abs(point.y - cursorY) < point.hitRadius) {
        if (!point.isHovered) {
            point.vx = 0;
            point.vy = 0;
            point.size = 10; // Smaller size
        }
    } else if (!point.isHovered && point.originalVx !== null && point.originalVy !== null) {
        point.vx = point.originalVx;
        point.vy = point.originalVy;
        point.originalVx = null;
        point.originalVy = null;
        point.size = 10; // Smaller size
    }

    // Update the position of the floating image
    const imgObj = imageElements[index];
    imgObj.img.style.left = `${point.x - imgObj.img.width / 2}px`;
    imgObj.img.style.top = `${point.y - imgObj.img.height + 25}px`; // Adjust the -10 to position the image above the ball
};

const animate = () => {
    // Set background to very light gray
    ctx.fillStyle = 'rgba(240, 240, 240, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawWhiteDots();

    updatePoints(interactivePoints);
    updatePoints(backgroundPoints);
    drawLines(interactivePoints); // Existing lines between gold balls
    drawLines(backgroundPoints, 0.5);
    drawPoints(backgroundPoints);
    drawPoints(interactivePoints);
    drawRipples();
    requestAnimationFrame(animate);
};

const toggleZoomImage = (img, point) => {
    const isZoomed = img.dataset.zoomed === 'true';
    if (isZoomed) {
        img.style.transition = 'transform 0.5s, left 0.5s, top 0.5s';
        img.style.transform = 'scale(1)'; // Reset the scale
        img.style.left = `${point.x - img.width / 2}px`;
        img.style.top = `${point.y - img.height + 25}px`;
        img.style.zIndex = 1;
        img.dataset.zoomed = 'false';
        currentZoomedImage = null;

        const overlay = document.getElementById(`overlay-${point.name}`);
        if (overlay) {
            overlay.style.opacity = 0;
            setTimeout(() => {
                overlay.remove();
            }, 500);
        }
    } else {
        if (currentZoomedImage) {
            toggleZoomImage(currentZoomedImage.img, currentZoomedImage.point); // Reset the currently zoomed image
        }
        img.style.transition = 'transform 0.5s, left 0.5s, top 0.5s';
        img.style.transform = 'scale(3)'; // Adjust the scale as needed
        img.style.left = '50%';
        img.style.top = '50%';
        img.style.transform = 'translate(-50%, -50%) scale(3)';
        img.style.zIndex = 1000;
        img.dataset.zoomed = 'true';
        currentZoomedImage = { img, point };

        showOverlay(img, point);
    }
};

const showOverlay = (img, point) => {
    let overlay = document.getElementById(`overlay-${point.name}`);
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = `overlay-${point.name}`;
        overlay.classList.add('overlay');
        overlay.innerHTML = `
            <h2>${point.name}</h2>
            <p>${point.description}</p>
            <div class="chat-box">
                <div class="chat-messages" id="chat-messages-${point.name}"></div>
                <div class="chat-input-container">
                    <input type="text" class="chat-input" id="chat-input-${point.name}" placeholder="Type a message..." onkeydown="handleKeyPress(event, '${point.name}')"/>
                    <button class="send-button" onclick="sendMessage('${point.name}')">Send</button>
                </div>
            </div>
        `;
        overlay.style.position = 'absolute';
        overlay.style.background = 'rgba(255, 255, 255, 0.9)';
        overlay.style.padding = '20px';
        overlay.style.borderRadius = '10px';
        overlay.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
        overlay.style.transition = 'opacity 0.5s';
        overlay.style.opacity = 0;
        overlay.style.textAlign = 'center'; // Center align text and button
        overlay.style.zIndex = 1001; // Ensure the overlay is above the image

        document.body.appendChild(overlay);

        setTimeout(() => {
            overlay.style.opacity = 1;
        }, 0);
    } else {
        overlay.style.zIndex = 1001; // Ensure the overlay is above the image
    }

    overlay.style.left = `${img.offsetLeft + img.offsetWidth / 2 - overlay.offsetWidth / 2}px`;
    overlay.style.top = `${img.offsetTop + img.offsetHeight + 20}px`;
};

const getRandomResponse = (name) => {
    const characterResponses = responses[name];
    return characterResponses[Math.floor(Math.random() * characterResponses.length)];
};

const sendMessage = (name) => {
    const input = document.getElementById(`chat-input-${name}`);
    const message = input.value;
    if (message.trim() !== "") {
        const chatMessages = document.getElementById(`chat-messages-${name}`);
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message');
        messageElement.innerText = message;
        chatMessages.appendChild(messageElement);
        input.value = "";
        chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to the bottom

        // Simulate a response
        setTimeout(() => {
            const botMessage = getRandomResponse(name);
            const responseElement = document.createElement('div');
            responseElement.classList.add('chat-message', 'response');
            responseElement.innerText = botMessage;
            chatMessages.appendChild(responseElement);
            chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to the bottom
        }, 1000);
    }
};

const handleKeyPress = (event, name) => {
    if (event.key === "Enter") {
        sendMessage(name);
    }
};

window.sendMessage = sendMessage;
window.handleKeyPress = handleKeyPress;

const handleMouseOver = (e) => {
    cursorX = e.clientX;
    cursorY = e.clientY;
    canvas.style.cursor = 'default';
    hoveredPoint = null;
    interactivePoints.forEach(point => {
        const distance = Math.sqrt(Math.pow(point.x - cursorX, 2) + Math.pow(point.y - cursorY, 2));
        if (distance < point.hitRadius) {
            canvas.style.cursor = 'pointer';
            hoveredPoint = point;
            if (point.originalVx === null && point.originalVy === null) {
                point.originalVx = point.vx;
                point.originalVy = point.vy;
                point.vx = 0;
                point.vy = 0;
                point.size = 10; // Smaller size
            }
        } else {
            if (point.originalVx !== null && point.originalVy !== null) {
                point.vx = point.originalVx;
                point.vy = point.originalVy;
                point.originalVx = null;
                point.originalVy = null;
                point.size = 10; // Smaller size
            }
        }
    });
};

const createRipple = (x, y) => {
    ripples.push({ x, y, radius: 0, alpha: 1 });
};

const drawRipples = () => {
    for (let i = ripples.length - 1; i >= 0; i--) {
        const ripple = ripples[i];
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, 2 * Math.PI);
        ctx.strokeStyle = `rgba(255, 215, 0, ${ripple.alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ripple.radius += 2;
        ripple.alpha -= 0.02;
        if (ripple.alpha <= 0) {
            ripples.splice(i, 1);
        }
        interactivePoints.forEach(point => {
            const distance = Math.sqrt(Math.pow(point.x - ripple.x, 2) + Math.pow(point.y - ripple.y, 2));
            if (distance < ripple.radius) {
                point.isGlowing = true;
            } else {
                point.isGlowing = false;
            }
        });
        backgroundPoints.forEach(point => {
            const distance = Math.sqrt(Math.pow(point.x - ripple.x, 2) + Math.pow(point.y - ripple.y, 2));
            if (distance < ripple.radius) {
                point.isGlowing = true;
            } else {
                point.isGlowing = false;
            }
        });
    }
};

const handleClick = (e) => {
    if (currentZoomedImage) {
        toggleZoomImage(currentZoomedImage.img, currentZoomedImage.point);
    } else {
        createRipple(e.clientX, e.clientY);
        if (!removeNonInteractiveDot(e.clientX, e.clientY)) {
            createNonInteractiveDot(e.clientX, e.clientY);
        }
    }
};

const createNonInteractiveDot = (x, y) => {
    backgroundPoints.push({
        x: x,
        y: y,
        vx: Math.random() * 2 - 1,
        vy: Math.random() * 2 - 1,
        size: Math.random() * 5 + 3,
        opacity: 0.5,
        isInteractive: false,
        isGlowing: false
    });
};

const removeNonInteractiveDot = (x, y) => {
    for (let i = 0; i < backgroundPoints.length; i++) {
        const point = backgroundPoints[i];
        const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
        if (distance < point.size) {
            backgroundPoints.splice(i, 1);
            return true;
        }
    }
    return false;
};

canvas.addEventListener('mousemove', handleMouseOver);
canvas.addEventListener('click', handleClick);
canvas.addEventListener('wheel', (e) => {
    adjustSpeed(e);
});

const adjustSpeed = (e) => {
    const delta = e.deltaY * -0.01;
    speedFactor += delta;
    speedFactor = Math.max(0.5, Math.min(speedFactor, maxSpeedFactor)); // Limit the speed factor between 0.5 and maxSpeedFactor
};

createPoints();
animate();
