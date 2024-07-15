const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const interactivePoints = [];
const backgroundPoints = [];
const popups = document.querySelectorAll('.popup');
const closeButtons = document.querySelectorAll('.close-btn');
const ripples = [];

let hoveredPoint = null;
let cursorX = -1;
let cursorY = -1;

const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const halfWidth = canvas.width * 0.375; // 75% of the viewport width
const halfHeight = canvas.height * 0.375; // 75% of the viewport height

const createPoints = () => {
    for (let i = 0; i < 5; i++) {
        interactivePoints.push({
            x: centerX - halfWidth / 2 + Math.random() * halfWidth,
            y: centerY - halfHeight / 2 + Math.random() * halfHeight,
            vx: (Math.random() * 2 - 1) * 0.5, // Slower movement
            vy: (Math.random() * 2 - 1) * 0.5, // Slower movement
            popup: popups[i],
            originalVx: null,
            originalVy: null,
            size: 15, // Original size
            hitRadius: 20, // Larger clickable area
            isInteractive: true
        });
    }
    for (let i = 0; i < 25; i++) { // Creating 25 non-interactive balls
        backgroundPoints.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: Math.random() * 2 - 1,
            vy: Math.random() * 2 - 1,
            size: Math.random() * 5 + 3, // Varying sizes between 3 and 8
            opacity: 0.5,
            isInteractive: false
        });
    }
};

const drawLines = (points, opacity = 1) => {
    for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
            const distance = Math.sqrt(Math.pow(points[i].x - points[j].x, 2) + Math.pow(points[i].y - points[j].y, 2));
            if (distance < 200) {
                ctx.strokeStyle = `rgba(204, 204, 204, ${opacity})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(points[i].x, points[i].y);
                ctx.lineTo(points[j].x, points[j].y);
                ctx.stroke();
            }
        }
    }
};

const drawPoints = (points) => {
    for (const point of points) {
        if (point.isInteractive) {
            const gradient = ctx.createRadialGradient(point.x, point.y, 5, point.x, point.y, 20);
            gradient.addColorStop(0, 'gold');
            gradient.addColorStop(1, 'orange');
            ctx.fillStyle = gradient;
            if (point === hoveredPoint) {
                ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
                ctx.shadowBlur = 20;
            } else {
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
            }
        } else {
            const gradient = ctx.createRadialGradient(point.x, point.y, 2, point.x, point.y, 10);
            gradient.addColorStop(0, 'grey');
            gradient.addColorStop(1, 'darkgrey');
            ctx.fillStyle = gradient;
            ctx.globalAlpha = point.opacity || 1;
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
        }
        ctx.beginPath();
        ctx.arc(point.x, point.y, point.size, 0, 2 * Math.PI);
        ctx.fill();
        ctx.globalAlpha = 1; // Reset alpha to default
    }
};

const updatePoints = (points) => {
    for (const point of points) {
        point.x += point.vx;
        point.y += point.vy;

        if (point.isInteractive) {
            // Constrain interactive points to the central area
            if (point.x < centerX - halfWidth / 2 || point.x > centerX + halfWidth / 2) point.vx *= -1;
            if (point.y < centerY - halfHeight / 2 || point.y > centerY + halfHeight / 2) point.vy *= -1;

            // Stop point if it's close to the cursor
            if (Math.abs(point.x - cursorX) < point.hitRadius && Math.abs(point.y - cursorY) < point.hitRadius) {
                if (point.vx !== 0 || point.vy !== 0) {
                    point.originalVx = point.vx;
                    point.originalVy = point.vy;
                }
                point.vx = 0;
                point.vy = 0;
                point.size = 22.5; // Increase the size (15 * 1.5)
            } else if (point.originalVx !== null && point.originalVy !== null) {
                point.vx = point.originalVx;
                point.vy = point.originalVy;
                point.originalVx = null;
                point.originalVy = null;
                point.size = 15; // Reset the size
            }
        } else {
            // Allow non-interactive points to move freely
            if (point.x < 0 || point.x > canvas.width) point.vx *= -1;
            if (point.y < 0 || point.y > canvas.height) point.vy *= -1;
        }
    }
};

const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updatePoints(interactivePoints);
    updatePoints(backgroundPoints);
    drawLines(interactivePoints);
    drawLines(backgroundPoints, 0.5); // Adding lines for background points with reduced opacity
    drawPoints(backgroundPoints);
    drawPoints(interactivePoints);
    drawRipples();
    requestAnimationFrame(animate);
};

const handlePopup = (e) => {
    const x = e.clientX;
    const y = e.clientY;
    let clickedOnPopup = false;
    for (const point of interactivePoints) {
        if (point.popup) {
            const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
            if (distance < point.hitRadius) { // Use hitRadius for click detection
                point.popup.style.left = `${point.x}px`;
                point.popup.style.top = `${point.y - 50}px`;
                point.popup.classList.add('show');
                clickedOnPopup = true;
            } else {
                point.popup.classList.remove('show');
            }
        }
    }
    if (!clickedOnPopup) {
        for (const popup of popups) {
            popup.classList.remove('show');
        }
    }
};

const handleMouseOver = (e) => {
    cursorX = e.clientX;
    cursorY = e.clientY;
    const x = cursorX;
    const y = cursorY;
    canvas.style.cursor = 'default';
    hoveredPoint = null;
    for (const point of interactivePoints) {
        const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
        if (distance < point.hitRadius) { // Use hitRadius for hover detection
            canvas.style.cursor = 'pointer';
            hoveredPoint = point;
            if (point.originalVx === null && point.originalVy === null) {
                point.originalVx = point.vx;
                point.originalVy = point.vy;
                point.vx = 0;
                point.vy = 0;
                point.size = 20; // Increase the size (15 * 1.5)
            }
        } else {
            if (point.originalVx !== null && point.originalVy !== null) {
                point.vx = point.originalVx;
                point.vy = point.originalVy;
                point.originalVx = null;
                point.originalVy = null;
                point.size = 15; // Reset the size
            }
        }
    }
};

// Function to close popups when close button is clicked
const closePopup = (e) => {
    e.stopPropagation(); // Prevent the click from triggering handlePopup
    e.target.closest('.popup').classList.remove('show');
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
    }
};

canvas.addEventListener('mousemove', handleMouseOver);
canvas.addEventListener('click', (e) => {
    handlePopup(e);
    createRipple(e.clientX, e.clientY);
});

// Add event listeners to close buttons
closeButtons.forEach(button => {
    button.addEventListener('click', closePopup);
});

createPoints();
animate();
