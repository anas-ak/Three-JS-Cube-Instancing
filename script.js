const MathEx = {
    degrees: function (radian) {
        return radian / Math.PI * 180;
    },

    radians: function (degree) {
        return degree * Math.PI  / 180;
    },

    clamp: function (value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    mix: function (x1, x2, a) {
        return x1 * (1 - a) + x2 * a;
    },

    polar: function (radian1, radian2, radius) {
        return [
            Math.cos(radian1) * Math.cos(radian2) * radius,
            Math.sin(radian1) * radius,
            Math.cos(radian1) * Math.sin(radian2) * radius 
        ];
    }
};

const debounce = function (callback, duration) {
    var timer;
    return function (event) {
        clearTimeout(timer);
        timer = setTimeout(function() {
            callback(event);
        }, duration);
    };
};

class Debris {
    constructor() {
        this.uniforms = {
            time: {
                type: 'f',
                value: 0
            }
        };

        this.instances = 300;   // number of cubes
        this.obj = this.createObj();
    }

    createObj(renderer) {
        const geometry = new THREE.InstancedBufferGeometry();
        const baseGeometry = new THREE.BoxBufferGeometry(40, 40, 40);
    }
}