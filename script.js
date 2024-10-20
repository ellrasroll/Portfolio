window.onload = function() {
    // Toggle Menu Function
    function toggleMenu() {
        const menu = document.querySelector(".menu-links");
        const icon = document.querySelector(".hamburger-icon");
        menu.classList.toggle("open");
        icon.classList.toggle("open");
    }

    const canvasEl = document.querySelector("canvas#neuro");
    const devicePixelRatio = Math.min(window.devicePixelRatio, 2);

    const pointer = { x: 0, y: 0, tX: 0, tY: 0 };
    let uniforms;
    let gl;  // Declare `gl` here but don't initialize it yet

    gl = initShader(); // Initialize `gl` inside initShader and use it afterward

    setupEvents();
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    render();

    function initShader() {
        const vsSource = document.getElementById("vertShader").innerHTML;
        const fsSource = document.getElementById("fragShader").innerHTML;

        gl = canvasEl.getContext("webgl") || canvasEl.getContext("experimental-webgl"); // Initialize `gl` here

        if (!gl) {
            alert("WebGL is not supported by your browser.");
            return;
        }

        const vertexShader = createShader(gl, vsSource, gl.VERTEX_SHADER);
        const fragmentShader = createShader(gl, fsSource, gl.FRAGMENT_SHADER);

        const shaderProgram = createShaderProgram(gl, vertexShader, fragmentShader);
        uniforms = getUniforms(gl, shaderProgram); // Pass `gl` to getUniforms

        const vertices = new Float32Array([-1., -1., 1., -1., -1., 1., 1., 1.]);
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        gl.useProgram(shaderProgram);
        const positionLocation = gl.getAttribLocation(shaderProgram, "a_position");
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        return gl; // Return the initialized `gl`
    }

    function render() {
        const currentTime = performance.now();

        pointer.x += (pointer.tX - pointer.x) * 0.5;
        pointer.y += (pointer.tY - pointer.y) * 0.5;

        gl.uniform1f(uniforms.u_time, currentTime);
        gl.uniform2f(uniforms.u_pointer_position, pointer.x / window.innerWidth, 1 - pointer.y / window.innerHeight);
        gl.uniform1f(uniforms.u_scroll_progress, window.pageYOffset / (2 * window.innerHeight));

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        requestAnimationFrame(render);
    }

    function resizeCanvas() {
        canvasEl.width = window.innerWidth * devicePixelRatio;
        canvasEl.height = window.innerHeight * devicePixelRatio;
        gl.uniform1f(uniforms.u_ratio, canvasEl.width / canvasEl.height);
        gl.viewport(0, 0, canvasEl.width, canvasEl.height);
    }

    function setupEvents() {
        window.addEventListener("pointermove", e => updateMousePosition(e.clientX, e.clientY));
        window.addEventListener("touchmove", e => updateMousePosition(e.targetTouches[0].clientX, e.targetTouches[0].clientY));
        window.addEventListener("click", e => updateMousePosition(e.clientX, e.clientY));
    }

    function updateMousePosition(eX, eY) {
        pointer.tX = eX;
        pointer.tY = eY;
    }

    function createShader(gl, sourceCode, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, sourceCode);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    function createShaderProgram(gl, vertexShader, fragmentShader) {
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error("Unable to initialize the shader program: " + gl.getProgramInfoLog(program));
            return null;
        }

        return program;
    }

    function getUniforms(gl, program) {  // Pass `gl` as an argument
        let uniforms = {};
        let uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < uniformCount; i++) {
            let uniformName = gl.getActiveUniform(program, i).name;
            uniforms[uniformName] = gl.getUniformLocation(program, uniformName);
        }
        return uniforms;
    }
};
