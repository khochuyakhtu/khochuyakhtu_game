// Input Manager - Handles touch/mouse/keyboard input for player movement

export class InputManager {
    constructor(canvas) {
        this.canvas = canvas;

        // Touch/Mouse joystick state
        this.input = {
            x: 0,
            y: 0,
            active: false,
            origin: { x: 0, y: 0 }
        };

        // Keyboard state
        this.keys = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false
        };

        this.initListeners();
    }

    initListeners() {
        // Helper to convert screen coordinates to canvas coordinates
        const getCanvasCoords = (clientX, clientY) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            return {
                x: (clientX - rect.left) * scaleX,
                y: (clientY - rect.top) * scaleY
            };
        };

        const start = (clientX, clientY) => {
            const coords = getCanvasCoords(clientX, clientY);
            this.input.active = true;
            this.input.origin = { x: coords.x, y: coords.y };
            this.input.x = coords.x;
            this.input.y = coords.y;
        };

        const move = (clientX, clientY) => {
            if (this.input.active) {
                const coords = getCanvasCoords(clientX, clientY);
                this.input.x = coords.x;
                this.input.y = coords.y;
            }
        };

        const end = () => (this.input.active = false);

        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => start(e.clientX, e.clientY));
        window.addEventListener('mousemove', (e) => move(e.clientX, e.clientY));
        window.addEventListener('mouseup', end);

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            if (e.target === this.canvas) e.preventDefault();
            start(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            if (this.input.active) {
                e.preventDefault();
                if (e.touches[0]) move(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: false });

        window.addEventListener('touchend', end);

        // Keyboard events
        window.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
                this.keys[e.key] = true;
            }
        });

        window.addEventListener('keyup', (e) => {
            if (this.keys.hasOwnProperty(e.key)) {
                this.keys[e.key] = false;
            }
        });
    }

    getJoystickInput() {
        return this.input;
    }

    getKeyboardInput() {
        return this.keys;
    }
}
