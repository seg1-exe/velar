// ── ASCII-ON-VIDEO EFFECT ─────────────────────────────────────────────────────
// Adapted from /Documents/velar/ascii-images (ascii.js + renderer.js), scoped to
// a single <div> container. Differences from the original demo:
//   1. Transparent canvas (no dark fill) + dark ink characters, so it sits on the
//      light ABOUT page and the darkThreshold visibly drops the video's black
//      background instead of hiding it behind a dark block.
//   2. No mouse interactions — the ASCII just plays as a static, monochrome render.
//   3. The render loop only runs while the container is on screen
//      (IntersectionObserver), so it stays idle until INFO is opened.
(function () {
    const CONFIG = {
        cellSize:      8,
        charset:       ' .,:;i1tfLCG08@',
        fontFamily:    'monospace',
        // Cells whose average luminance is below this are dropped (rendered as
        // nothing → transparent). Use it to suppress a dark background.
        darkThreshold: 0,
        // Cells whose average luminance is above this are dropped. Use it to
        // suppress a light/white background (256 = disabled).
        lightThreshold: 256,
        // When true, characters keep the video's real colours; otherwise they
        // are drawn in a single ink colour.
        colored:       false,
        // Monochrome ink used when `colored` is false.
        ink:           '#141314',
    };

    // Samples an already-drawn canvas context into a 2D grid of ASCII cells.
    function sampleFrame(ctx, width, height, cfg) {
        const { cellSize, charset, darkThreshold, lightThreshold } = cfg;
        const cols  = Math.floor(width  / cellSize);
        const rows  = Math.floor(height / cellSize);
        const cells = [];

        for (let row = 0; row < rows; row++) {
            const line = [];
            for (let col = 0; col < cols; col++) {
                const x = col * cellSize;
                const y = row * cellSize;
                const sampleW = Math.min(cellSize, width  - x);
                const sampleH = Math.min(cellSize, height - y);
                const { data } = ctx.getImageData(x, y, sampleW, sampleH);

                let luminanceSum = 0, rSum = 0, gSum = 0, bSum = 0;
                const pixelCount = sampleW * sampleH;
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i], g = data[i + 1], b = data[i + 2];
                    luminanceSum += 0.299 * r + 0.587 * g + 0.114 * b;
                    rSum += r; gSum += g; bSum += b;
                }
                const L = luminanceSum / pixelCount;
                const char = (L < darkThreshold || L > lightThreshold)
                    ? ' '
                    : charset[Math.floor((L / 255) * (charset.length - 1))];
                line.push({ char, r: rSum / pixelCount, g: gSum / pixelCount, b: bSum / pixelCount });
            }
            cells.push(line);
        }
        return { cells, cols, rows };
    }

    // Draws one ASCII frame. Background stays transparent; empty/dropped cells
    // simply aren't painted.
    function drawCells(ctx, cells, cols, rows, cellSize, colored, ink) {
        ctx.clearRect(0, 0, cols * cellSize, rows * cellSize);
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const { char, r, g, b } = cells[row][col];
                if (char === ' ') continue;
                ctx.fillStyle = colored
                    ? `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`
                    : ink;
                ctx.fillText(char, col * cellSize, row * cellSize);
            }
        }
    }

    async function initAsciiVideo(container, videoSrc, config = {}) {
        if (!container) return;
        const cfg = { ...CONFIG, ...config };

        // ── Video source (off-DOM, used only as a frame source) ──────────────
        const video = document.createElement('video');
        video.src         = videoSrc;
        video.loop        = true;
        video.muted       = true;
        video.playsInline = true;
        video.crossOrigin = 'anonymous';

        await new Promise((resolve, reject) => {
            video.addEventListener('loadedmetadata', resolve, { once: true });
            video.addEventListener('error', () => reject(new Error(`Cannot load: ${videoSrc}`)), { once: true });
            video.load();
        });

        // ── Offscreen sampler canvas ─────────────────────────────────────────
        const maxH  = cfg.maxHeight ?? Infinity;
        const scale = video.videoHeight > maxH ? maxH / video.videoHeight : 1;
        const offscreen  = document.createElement('canvas');
        offscreen.width  = Math.round(video.videoWidth  * scale);
        offscreen.height = Math.round(video.videoHeight * scale);
        const ctxOff = offscreen.getContext('2d', { willReadFrequently: true });

        const cellSize = cfg.cellSize;
        const cols = Math.floor(offscreen.width  / cellSize);
        const rows = Math.floor(offscreen.height / cellSize);
        const W = cols * cellSize;
        const H = rows * cellSize;

        // ── Output canvas (single layer, transparent) ────────────────────────
        const canvas = document.createElement('canvas');
        canvas.width = W; canvas.height = H;
        canvas.className = 'ascii-layer';
        const ctxA = canvas.getContext('2d');
        ctxA.font = `${cellSize}px ${cfg.fontFamily}`;
        ctxA.textBaseline = 'top';

        container.innerHTML = '';
        container.appendChild(canvas);

        // ── Render loop, gated to only run while the container is on screen ───
        let running = false, rafId = null;
        function renderFrame() {
            ctxOff.drawImage(video, 0, 0, offscreen.width, offscreen.height);
            const { cells } = sampleFrame(ctxOff, offscreen.width, offscreen.height, cfg);
            drawCells(ctxA, cells, cols, rows, cellSize, cfg.colored, cfg.ink);
            rafId = requestAnimationFrame(renderFrame);
        }
        function start() {
            if (running) return;
            running = true;
            const p = video.play(); if (p) p.catch(() => {});
            rafId = requestAnimationFrame(renderFrame);
        }
        function stop() {
            running = false;
            if (rafId) cancelAnimationFrame(rafId);
            video.pause();
        }

        const io = new IntersectionObserver(
            entries => entries.forEach(en => (en.isIntersecting ? start() : stop())),
            { threshold: 0.01 }
        );
        io.observe(container);
    }

    window.initAsciiVideo = initAsciiVideo;
})();
