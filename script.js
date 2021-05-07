const MathEx = {
    degrees: function (radian) {
        return radian / Math.PI * 180;
    },

    radians: function (degree) {
        return degree * Math.PI / 180;
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

        geometry.addAttribute('position', baseGeometry.attributes.position);
        geometry.addAttribute('normal', baseGeometry.attributes.normal);
        geometry.setIndex(baseGeometry.index);

        const translate = new THREE.InstancedBufferAttribute(new Float32Array(this.instances * 3), 3, 1);
        const offsets = new THREE.InstancedBufferAttribute(new Float32Array(this.instances), 1, 1);
        const rotates = new THREE.InstancedBufferAttribute(new Float32Array(this.instances * 3), 3, 1);

        for(var i = 0, ul = offsets.count; i < ul; i++) {
            const polar = MathEx.polar(Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI, Math.random() * 200 + 500);
            
            translate.setXYZ(i, polar[0], polar[1], polar[2]);
            offsets.setXYZ(i, Math.random() * 40 - 20);
            rotates.setXYZ(i, Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);

        }

        geometry.addAttribute('translate', translate);
        geometry.addAttribute('offset', offsets);
        geometry.addAttribute('rotate', rotates);
        return new THREE.Mesh(
            geometry,
            new THREE.RawShaderMaterial({
                uniforms: this.uniforms,
                vertexShader: `
                    attribute vec3 position;
                    attribute vec3 normal;
                    attribute vec3 translate;
                    attribute float offset;
                    attribute vec3 rotate;

                    uniform mat4 projectionMatrix;
                    uniform mat4 modelViewMatrix;
                    uniform float time;

                    varying vec3 vNormal;

                    mat4 computeTranslateMat(vec3 v) {
                        return mat4(
                            1.0, 0.0, 0.0, 0.0,
                            0.0, 1.0, 0.0, 0.0,
                            0.0, 0.0, 1.0, 0.0,
                            v.x, v.y, v.z, 1.0
                        );
                    }

                    mat4 computeRotateMatX(float radian) {
                        return mat4(
                          1.0, 0.0, 0.0, 0.0,
                          0.0, cos(radian), -sin(radian), 0.0,
                          0.0, sin(radian), cos(radian), 0.0,
                          0.0, 0.0, 0.0, 1.0
                        );
                      }
                      mat4 computeRotateMatY(float radian) {
                        return mat4(
                          cos(radian), 0.0, sin(radian), 0.0,
                          0.0, 1.0, 0.0, 0.0,
                          -sin(radian), 0.0, cos(radian), 0.0,
                          0.0, 0.0, 0.0, 1.0
                        );
                      }
                      mat4 computeRotateMatZ(float radian) {
                        return mat4(
                          cos(radian), -sin(radian), 0.0, 0.0,
                          sin(radian), cos(radian), 0.0, 0.0,
                          0.0, 0.0, 1.0, 0.0,
                          0.0, 0.0, 0.0, 1.0
                        );
                      }
                      mat4 computeRotateMat(float radX, float radY, float radZ) {
                        return computeRotateMatX(radX) * computeRotateMatY(radY) * computeRotateMatZ(radZ);
                      }
                      
                      void main(void) {
                        float radian = radians(time);
                        mat4 rotateWorld = computeRotateMat(radian * 5.0 + rotate.x, radian * 20.0 + rotate.y, radian + rotate.z);
                        mat4 rotateSelf = computeRotateMat(radian * rotate.x * 100.0, radian * rotate.y * 100.0, radian * rotate.z * 100.0);
                        vec4 updatePosition =
                          rotateWorld
                          * computeTranslateMat(translate)
                          * rotateSelf
                          * vec4(position + normalize(position) * offset, 1.0);
                        vNormal = (rotateWorld * rotateSelf * vec4(normal, 1.0)).xyz;
                        gl_Position = projectionMatrix * modelViewMatrix * updatePosition;
                      }
                `,

                fragmentShader: `
          precision highp float;
          
          uniform float time;
          
          varying vec3 vNormal;
          
          void main() {
            gl_FragColor = vec4(vNormal, 1.0);
          }
        ` }));
    }

    render(time) {
        this.uniforms.time.value += time;
    }
}

const canvas = document.getElementById('canvas-webgl');
const renderer = new THREE.WebGLRenderer({
    antialias: false,
    canvas: canvas
});

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
const clock = new THREE.Clock();

const vectorTouchStart = new THREE.Vector2();
const vectorTouchMove = new THREE.Vector2();
const vectorTouchEnd = new THREE.Vector2();

let isDrag = false;

// process for this sketch

const debris = new Debris();

// common process 
// gul

const resizeWindow = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
};

const render = () => {
    const now = clock.getDelta();
    debris.render(now);
    renderer.render(scene, camera);
};

const renderLoop = () => {
    render();
    requestAnimationFrame(renderLoop);
};

const on = () => {
    window.addEventListener('resize', debounce(() => {
        resizeWindow();
    }), 1000);
};

const init = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1.0);
    camera.position.set(1000, 1000, 1000);
    camera.lookAt(new THREE.Vector3());

    scene.add(debris.obj);

    on();
    resizeWindow();
    renderLoop();
};

init();