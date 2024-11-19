window.app = window.app || {};

window.app.utils = {
    createTimerContext: function() {
        let now = 0;
    
        return {
            create: function(timeout) {
                let next = now + timeout;
    
                return {
                    time: function() {
                        if(now > next) {
                            next = now + timeout;
    
                            return true;
                        }
                    }
                };
            },
    
            update: function(time) {
                now = time;
            }
        };
    },

    createInputContext: function() {
        const state = {
            start: false,
            left: false,
            leftPressed: false,
            right: false,
            rightPressed: false,
            up: false,
            upPressed: false,
            down: false,
            downPressed: false,

            clear: function() {
                this.leftPressed = false;
                this.rightPressed = false;
                this.upPressed = false;
                this.downPressed = false;
            }
        }

        window.addEventListener("keydown", onKeyDown, true);
        window.addEventListener("keyup", onKeyUp, true);

        function onKeyDown(e) {
            switch (e.code) {
                case "KeyE":
                    state.start = true;
                    break;
                case "KeyA":
                    if(!state.left) {
                        state.leftPressed = true;
                    }

                    state.left = true;
                    break;
                case "KeyD":
                    if(!state.right) {
                        state.rightPressed = true;
                    }

                    state.right = true;
                    break;
                case "KeyW":
                    if(!state.up) {
                        state.upPressed = true;
                    }

                    state.up = true;

                    break;
                case "KeyS":
                    if(!state.down) {
                        state.downPressed = true;
                    }

                    state.down = true;
                    break;
                default:
                    break;
            }
        }

        function onKeyUp(e) {
            switch (e.code) {
                case "KeyE":
                    state.start = false;
                    break;
                case "KeyA":
                    state.left = false;
                    break;
                case "KeyD":
                    state.right = false;
                    break;
                case "KeyW":
                    state.up = false;
                    break;
                case "KeyS":
                    state.down = false;
                    break;
                default:
                    break;
            }
        }

        return state;
    }
};