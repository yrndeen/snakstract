class DigitalSnake {
    constructor(canvas, ctx, color, speed, size, hasGlow = false, explicitGlowColor = null) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.color = color;
        this.speed = speed;
        this.size = size; // Diameter of the snake segment
        this.segments = [];
        this.direction = this.getRandomDirection();
        this.initialLength = 20; // Made longer
        this.minSegments = 10; // Minimum segments before decaying
        this.maxSegments = 40; // Max segments for a snake (Made longer)
        this.turnRate = 0.05; // How often the snake can change direction
        this.hasGlow = hasGlow;
        this.glowColor = explicitGlowColor || color; // Use explicit glow color or default to snake color

        // Initialize position in the middle of the canvas
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;

        // Populate initial segments
        for (let i = 0; i < this.initialLength; i++) {
            this.segments.push({ x: this.x, y: this.y });
        }
    }

    getRandomDirection() {
        const angle = Math.random() * Math.PI * 2;
        return { x: Math.cos(angle), y: Math.sin(angle) };
    }

    update() {
        // Occasionally change direction
        if (Math.random() < this.turnRate) {
            this.direction = this.getRandomDirection();
        }

        // Move head
        this.x += this.direction.x * this.speed;
        this.y += this.direction.y * this.speed;

        // Wrap around edges
        if (this.x < 0) this.x = this.canvas.width;
        else if (this.x > this.canvas.width) this.x = 0;
        if (this.y < 0) this.y = this.canvas.height;
        else if (this.y > this.canvas.height) this.y = 0;

        // Add new head segment
        this.segments.unshift({ x: this.x, y: this.y });

        // Decay segments if too long, or add if too short
        if (this.segments.length > this.maxSegments) {
            this.segments.pop();
        } else if (this.segments.length < this.minSegments && Math.random() < 0.1) {
            // Randomly grow if below min segments
            this.segments.push({ x: this.x, y: this.y }); // Just add at the end, will follow
        }
    }

    draw() {
        this.ctx.fillStyle = this.color;
        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = 1;

        // Apply glow effect if enabled
        if (this.hasGlow) {
            this.ctx.shadowBlur = 15; // Stronger glow
            this.ctx.shadowColor = this.glowColor;
        } else {
            this.ctx.shadowBlur = 0;
            this.ctx.shadowColor = 'transparent';
        }

        for (let i = 0; i < this.segments.length; i++) {
            const segment = this.segments[i];
            const opacity = 1 - (i / this.segments.length) * 0.7; // Fade effect
            this.ctx.globalAlpha = opacity;
            this.ctx.beginPath();
            this.ctx.arc(segment.x, segment.y, this.size / 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1; // Reset alpha for other drawings
        this.ctx.shadowBlur = 0; // Always reset shadow for subsequent drawings
        this.ctx.shadowColor = 'transparent';
    }
}

export default DigitalSnake; 