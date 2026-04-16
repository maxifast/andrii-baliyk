/* ===== THREE.JS — Neural Network Particle System ===== */

(function() {
    'use strict';

    // ===== HERO SCENE =====
    const heroCanvas = document.getElementById('heroCanvas');
    if (!heroCanvas) return;

    // Device detection for performance tuning
    const isMobile = window.innerWidth < 768;
    const isLowPower = isMobile || navigator.hardwareConcurrency <= 4;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({
        canvas: heroCanvas,
        alpha: true,
        antialias: !isMobile,
        powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));

    // Mouse tracking
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    // --- Particle system: Neural network nodes ---
    const PARTICLE_COUNT = isMobile ? 60 : 180;
    const FIELD_SIZE = 28;
    const CONNECTION_DISTANCE = isMobile ? 5 : 6;
    const CONNECTION_UPDATE_FRAMES = isMobile ? 8 : 3;

    // Create particles
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = [];
    const sizes = new Float32Array(PARTICLE_COUNT);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    // Color palette
    const palette = [
        { r: 0.424, g: 0.361, b: 0.906 },  // #6C5CE7
        { r: 0.635, g: 0.608, b: 0.996 },  // #A29BFE
        { r: 0.455, g: 0.725, b: 1.0 },    // #74B9FF
        { r: 0.384, g: 0.447, b: 0.906 },  // #6272E7
    ];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;

        // Distribute in sphere-ish volume
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const radius = FIELD_SIZE * Math.pow(Math.random(), 0.5);

        positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i3 + 2] = (Math.random() - 0.5) * 12;

        velocities.push({
            x: (Math.random() - 0.5) * 0.015,
            y: (Math.random() - 0.5) * 0.015,
            z: (Math.random() - 0.5) * 0.008
        });

        sizes[i] = Math.random() * 2.5 + 0.8;

        const color = palette[Math.floor(Math.random() * palette.length)];
        colors[i3] = color.r;
        colors[i3 + 1] = color.g;
        colors[i3 + 2] = color.b;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Custom shader material for particles
    const particleMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
        },
        vertexShader: `
            attribute float size;
            attribute vec3 color;
            varying vec3 vColor;
            varying float vAlpha;
            uniform float uTime;
            uniform float uPixelRatio;

            void main() {
                vColor = color;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                float dist = length(mvPosition.xyz);
                vAlpha = smoothstep(40.0, 5.0, dist) * 0.9;
                gl_PointSize = size * uPixelRatio * (12.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            varying vec3 vColor;
            varying float vAlpha;

            void main() {
                float d = length(gl_PointCoord - vec2(0.5));
                if (d > 0.5) discard;
                float alpha = smoothstep(0.5, 0.0, d) * vAlpha * 1.4;
                vec3 brightColor = vColor * 1.3;
                gl_FragColor = vec4(brightColor, alpha);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particlesGeometry, particleMaterial);
    scene.add(particles);

    // --- Connection lines ---
    const linesMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uOpacity: { value: 0.35 }
        },
        vertexShader: `
            attribute vec3 color;
            varying vec3 vColor;
            varying float vDist;

            void main() {
                vColor = color;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                vDist = length(mvPosition.xyz);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform float uOpacity;
            varying vec3 vColor;
            varying float vDist;

            void main() {
                float alpha = smoothstep(40.0, 5.0, vDist) * uOpacity;
                gl_FragColor = vec4(vColor, alpha);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    let linesGeometry = new THREE.BufferGeometry();
    let lines = new THREE.LineSegments(linesGeometry, linesMaterial);
    scene.add(lines);

    // (central sphere and orbital rings removed)

    // --- Update connections ---
    function updateConnections() {
        const pos = particlesGeometry.attributes.position.array;
        const col = particlesGeometry.attributes.color.array;
        const linePositions = [];
        const lineColors = [];

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            for (let j = i + 1; j < PARTICLE_COUNT; j++) {
                const i3 = i * 3;
                const j3 = j * 3;
                const dx = pos[i3] - pos[j3];
                const dy = pos[i3 + 1] - pos[j3 + 1];
                const dz = pos[i3 + 2] - pos[j3 + 2];
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (dist < CONNECTION_DISTANCE) {
                    linePositions.push(pos[i3], pos[i3 + 1], pos[i3 + 2]);
                    linePositions.push(pos[j3], pos[j3 + 1], pos[j3 + 2]);

                    // Average color of both particles
                    const r = (col[i3] + col[j3]) * 0.5;
                    const g = (col[i3 + 1] + col[j3 + 1]) * 0.5;
                    const b = (col[i3 + 2] + col[j3 + 2]) * 0.5;
                    lineColors.push(r, g, b, r, g, b);
                }
            }
        }

        scene.remove(lines);
        linesGeometry.dispose();
        linesGeometry = new THREE.BufferGeometry();
        if (linePositions.length > 0) {
            linesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
            linesGeometry.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));
        }
        lines = new THREE.LineSegments(linesGeometry, linesMaterial);
        scene.add(lines);
    }

    // --- Animation loop ---
    let time = 0;
    let frame = 0;
    let isVisible = true;

    // Stop rendering when hero is off-screen (huge perf win on scroll)
    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            isVisible = entries[0].isIntersecting;
        }, { threshold: 0 });
        io.observe(heroCanvas);
    }

    function animate() {
        requestAnimationFrame(animate);
        if (!isVisible) return;
        time += 0.016;
        frame++;

        // Smooth mouse follow
        mouse.x += (mouse.targetX - mouse.x) * 0.05;
        mouse.y += (mouse.targetY - mouse.y) * 0.05;

        // Update particle positions
        const pos = particlesGeometry.attributes.position.array;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const i3 = i * 3;
            pos[i3] += velocities[i].x;
            pos[i3 + 1] += velocities[i].y;
            pos[i3 + 2] += velocities[i].z;

            // Boundary wrap
            const dist = Math.sqrt(pos[i3] * pos[i3] + pos[i3 + 1] * pos[i3 + 1]);
            if (dist > FIELD_SIZE) {
                velocities[i].x *= -1;
                velocities[i].y *= -1;
            }
            if (Math.abs(pos[i3 + 2]) > 8) {
                velocities[i].z *= -1;
            }

            // Mouse attraction
            const mx = mouse.x * 15;
            const my = -mouse.y * 15;
            const dmx = mx - pos[i3];
            const dmy = my - pos[i3 + 1];
            const mouseDist = Math.sqrt(dmx * dmx + dmy * dmy);
            if (mouseDist < 12 && mouseDist > 0.1) {
                pos[i3] += dmx * 0.001;
                pos[i3 + 1] += dmy * 0.001;
            }
        }
        particlesGeometry.attributes.position.needsUpdate = true;

        // Update connections with adaptive frequency
        if (frame % CONNECTION_UPDATE_FRAMES === 0) {
            updateConnections();
        }

        // Update uniforms
        particleMaterial.uniforms.uTime.value = time;

        // Rotate scene subtly based on mouse
        scene.rotation.y = mouse.x * 0.15;
        scene.rotation.x = mouse.y * 0.08;

        renderer.render(scene, camera);
    }

    animate();

    // --- Event listeners ---
    document.addEventListener('mousemove', (e) => {
        mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.targetY = (e.clientY / window.innerHeight) * 2 - 1;
    });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        particleMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
    });

    // ===== METHODOLOGY SECTION - Floating particles background =====
    const methodCanvas = document.getElementById('methodCanvas');
    if (methodCanvas) {
        const mScene = new THREE.Scene();
        const mCamera = new THREE.PerspectiveCamera(60, methodCanvas.parentElement.offsetWidth / methodCanvas.parentElement.offsetHeight, 0.1, 100);
        mCamera.position.z = 20;

        const mRenderer = new THREE.WebGLRenderer({
            canvas: methodCanvas,
            alpha: true,
            antialias: !isMobile
        });
        mRenderer.setSize(methodCanvas.parentElement.offsetWidth, methodCanvas.parentElement.offsetHeight);
        mRenderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));

        // Floating DNA-like helix
        const helixParticles = isMobile ? 60 : 120;
        const helixGeo = new THREE.BufferGeometry();
        const helixPos = new Float32Array(helixParticles * 3);
        const helixSizes = new Float32Array(helixParticles);
        const helixColors = new Float32Array(helixParticles * 3);

        for (let i = 0; i < helixParticles; i++) {
            const t = (i / helixParticles) * Math.PI * 6;
            const i3 = i * 3;
            helixPos[i3] = Math.cos(t) * 6;
            helixPos[i3 + 1] = (i / helixParticles - 0.5) * 30;
            helixPos[i3 + 2] = Math.sin(t) * 6;
            helixSizes[i] = Math.random() * 1.5 + 0.5;

            const c = palette[Math.floor(Math.random() * palette.length)];
            helixColors[i3] = c.r;
            helixColors[i3 + 1] = c.g;
            helixColors[i3 + 2] = c.b;
        }

        helixGeo.setAttribute('position', new THREE.BufferAttribute(helixPos, 3));
        helixGeo.setAttribute('size', new THREE.BufferAttribute(helixSizes, 1));
        helixGeo.setAttribute('color', new THREE.BufferAttribute(helixColors, 3));

        const helixMat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                varying float vAlpha;
                uniform float uTime;
                uniform float uPixelRatio;

                void main() {
                    vColor = color;
                    vec3 pos = position;
                    pos.x = cos((position.y * 0.2) + uTime * 0.3) * 6.0;
                    pos.z = sin((position.y * 0.2) + uTime * 0.3) * 6.0;

                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    vAlpha = smoothstep(30.0, 5.0, length(mvPosition.xyz)) * 0.7;
                    gl_PointSize = size * uPixelRatio * (10.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vAlpha;

                void main() {
                    float d = length(gl_PointCoord - vec2(0.5));
                    if (d > 0.5) discard;
                    float alpha = smoothstep(0.5, 0.1, d) * vAlpha;
                    gl_FragColor = vec4(vColor, alpha);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        const helixPoints = new THREE.Points(helixGeo, helixMat);
        mScene.add(helixPoints);

        // Only render methodology canvas when visible
        let mVisible = false;
        if ('IntersectionObserver' in window) {
            const mio = new IntersectionObserver((entries) => {
                mVisible = entries[0].isIntersecting;
            }, { threshold: 0 });
            mio.observe(methodCanvas);
        } else {
            mVisible = true;
        }

        function animateMethod() {
            requestAnimationFrame(animateMethod);
            if (!mVisible) return;
            helixMat.uniforms.uTime.value += 0.016;
            helixPoints.rotation.y += 0.002;
            mRenderer.render(mScene, mCamera);
        }
        animateMethod();

        window.addEventListener('resize', () => {
            const w = methodCanvas.parentElement.offsetWidth;
            const h = methodCanvas.parentElement.offsetHeight;
            mCamera.aspect = w / h;
            mCamera.updateProjectionMatrix();
            mRenderer.setSize(w, h);
        });
    }
})();
