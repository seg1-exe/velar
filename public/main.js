gsap.registerPlugin(Observer);

// ── STATIC DOM REFERENCES ─────────────────────────────────────────────────────
const slidesContainer      = document.querySelector(".slides-container");
const logoFixed            = document.querySelector(".logo-fixed");
const aboutOverlay         = document.querySelector(".about-overlay");
const aboutBack            = document.querySelector(".about-back");

const desktopNav           = document.querySelector(".desktop-nav");
const desktopNavTitle      = document.querySelector(".desktop-nav__project-title");
const navIndexCase         = document.getElementById("nav-index-case");
const navInfo              = document.getElementById("nav-info");

const galleryOverlay       = document.getElementById("gallery-overlay");
const galleryLogo          = document.getElementById("gallery-logo");
const tabIndex             = document.getElementById("tab-index");
const tabCase              = document.getElementById("tab-case");
const viewIndex            = document.getElementById("view-index");
const viewCase             = document.getElementById("view-case");
const galleryInfoBtn       = document.getElementById("gallery-info-btn");

const projectPage          = document.getElementById("project-page");
const projectLogoBack      = document.getElementById("project-logo-back");
const projectInfoBtn       = document.getElementById("project-info-btn");
const projectTrack         = document.getElementById("project-track");
const projectInfoPanel     = document.getElementById("project-info-panel");
const projectInfoMetaTitle = document.getElementById("project-info-meta-title");
const projectInfoMetaDesc  = document.getElementById("project-info-meta-desc");
const projectInfoMetaCredits = document.getElementById("project-info-meta-credits");
const projectInfoMetaDate  = document.getElementById("project-info-meta-date");

// ── APP STATE ─────────────────────────────────────────────────────────────────
let slides      = [];   // populated after buildSlides()
let projectData = [];   // populated from data.json

let currentIndex     = 0;
let liveTitleIndex   = -1;   // nearest-slide title currently shown (live during scroll)
let introHasPlayed   = false;
let homeUIRevealed   = false;   // true once the intro reveals the nav/logo/titles
let isDesktop        = window.innerWidth >= 768;

let projectCurrentIndex = 0;
let isProjectPageOpen   = false;
let isProjectAnimating  = false;

let isAboutAnimating  = false;
let aboutVideoInited  = false;   // ASCII video is loaded lazily on first About open
let isGalleryOpen     = false;
let isGalleryAnimating = false;
let currentGalleryTab = "index";

// ── SMOOTH SCROLL + MAGNETIC SNAP (vertical) ──────────────────────────────────
let targetScrollY = 0;
let smoothScrollY = 0;
let isSnapping    = false;
let snapTween     = null;
let snapTimeout   = null;
let scrollEnabled = false;

const SNAP_THRESHOLD = 0.28;

function getSlideH() { return window.innerHeight; }
function getTotal()  { return slides.length * getSlideH(); }

function applyScroll(y) {
    const h     = getSlideH();
    const total = getTotal();
    gsap.set(slidesContainer, { y: 0 });
    slides.forEach((s, i) => {
        let pos = ((i * h - y) % total + total) % total;
        if (pos > total / 2) pos -= total;
        gsap.set(s, { y: pos, visibility: Math.abs(pos) < h ? "visible" : "hidden" });
    });
    updateLiveTitle(y);
}

// Update the project name to the nearest slide live during scroll, so names
// change at the same speed as a fast scroll instead of waiting for the snap.
function updateLiveTitle(y) {
    const h = getSlideH();
    const N = slides.length;
    if (!N) return;
    const norm = ((y / h) % N + N) % N;
    const idx  = Math.round(norm) % N;
    if (idx === liveTitleIndex) return;
    liveTitleIndex = idx;

    if (isDesktop) {
        updateDesktopNavTitle(idx);
    } else {
        slides.forEach((s, i) => {
            const title = s.querySelector(".title");
            if (!title) return;
            if (i === idx) {
                gsap.to(title, { opacity: 1, y: 0, duration: 0.2, ease: "power2.out", overwrite: true });
            } else {
                gsap.set(title, { opacity: 0, y: -15 });
            }
        });
    }
}

function getSnapDest(index) {
    const h     = getSlideH();
    const total = getTotal();
    const base  = index * h;
    const n     = Math.round((smoothScrollY - base) / total);
    return base + n * total;
}

function scheduleMagneticSnap() {
    clearTimeout(snapTimeout);
    snapTimeout = setTimeout(doMagneticSnap, 160);
}

function doMagneticSnap() {
    if (isSnapping) return;
    const h    = getSlideH();
    const N    = slides.length;
    const norm = ((smoothScrollY / h) % N + N) % N;
    const base = Math.floor(norm);
    const frac = norm - base;
    const idx  = frac >= SNAP_THRESHOLD ? (base + 1) % N : base;
    snapToSlide(idx);
}

function snapToSlide(index) {
    if (isSnapping) return;
    isSnapping = true;

    const dest  = getSnapDest(index);
    const proxy = { val: smoothScrollY };

    snapTween = gsap.to(proxy, {
        val:      dest,
        duration: 0.9,
        ease:     "power3.out",
        onUpdate: () => {
            smoothScrollY = proxy.val;
            targetScrollY = proxy.val;
            applyScroll(smoothScrollY);
        },
        onComplete: () => {
            snapTween     = null;
            smoothScrollY = dest;
            targetScrollY = dest;
            currentIndex  = index;
            updateDesktopNavTitle(index);
            isSnapping = false;
            // Title visibility is handled live during scroll by updateLiveTitle().
        }
    });
}

gsap.ticker.add(() => {
    if (!scrollEnabled || isSnapping) return;
    const diff = targetScrollY - smoothScrollY;
    if (Math.abs(diff) < 0.05) { smoothScrollY = targetScrollY; return; }
    smoothScrollY += diff * 0.1;
    applyScroll(smoothScrollY);
});

// ── WHEEL HANDLER ─────────────────────────────────────────────────────────────
function onWheel(e) {
    if (!scrollEnabled || isProjectPageOpen || isGalleryOpen || isAboutAnimating) return;
    e.preventDefault();
    if (isSnapping) return;
    targetScrollY += e.deltaY;
    scheduleMagneticSnap();
}

// ── TOUCH HANDLER ─────────────────────────────────────────────────────────────
let _touchStartX       = 0;
let _touchStartY       = 0;
let _touchStartScrollY = 0;
let _touchIsVertical   = null;

function onTouchStart(e) {
    if (!scrollEnabled || isProjectPageOpen || isGalleryOpen) return;
    _touchStartX       = e.touches[0].clientX;
    _touchStartY       = e.touches[0].clientY;
    _touchStartScrollY = smoothScrollY;
    _touchIsVertical   = null;

    if (snapTween) {
        snapTween.kill();
        snapTween  = null;
        isSnapping = false;
    }
    clearTimeout(snapTimeout);
}

function onTouchMove(e) {
    if (!scrollEnabled || isProjectPageOpen || isGalleryOpen) return;
    const dx = _touchStartX - e.touches[0].clientX;
    const dy = _touchStartY - e.touches[0].clientY;

    if (_touchIsVertical === null && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
        _touchIsVertical = Math.abs(dy) >= Math.abs(dx);
    }
    if (!_touchIsVertical) return;

    e.preventDefault();
    const newY = _touchStartScrollY + dy;
    smoothScrollY = newY;
    targetScrollY = newY;
    applyScroll(newY);
}

function onTouchEnd(e) {
    if (!scrollEnabled || isProjectPageOpen || isGalleryOpen) return;
    const dx = _touchStartX - e.changedTouches[0].clientX;

    if (!isDesktop && _touchIsVertical === false && dx < -40) {
        openGallery("case");
        return;
    }
    if (_touchIsVertical) doMagneticSnap();
}

// ── HORIZONTAL SMOOTH SCROLL + MAGNETIC SNAP (project page) ──────────────────
let targetScrollX        = 0;
let smoothScrollX        = 0;
let isSnappingH          = false;
let snapTimeoutH         = null;
let projectScrollEnabled = false;

function getPanelW()     { return window.innerWidth; }
function getPanelTotal() { return projectData.length * getPanelW(); }

function applyHScroll(x) {
    const w      = getPanelW();
    const total  = getPanelTotal();
    const panels = document.querySelectorAll(".project-panel");
    panels.forEach((p, i) => {
        let pos = ((i * w - x) % total + total) % total;
        if (pos > total / 2) pos -= total;
        gsap.set(p, { x: pos });
    });
    updateLiveProjectMeta(x);
}

function getSnapDestH(index) {
    const w     = getPanelW();
    const total = getPanelTotal();
    const base  = index * w;
    const n     = Math.round((smoothScrollX - base) / total);
    return base + n * total;
}

function scheduleMagneticSnapH() {
    clearTimeout(snapTimeoutH);
    snapTimeoutH = setTimeout(doMagneticSnapH, 160);
}

function doMagneticSnapH() {
    if (isSnappingH) return;
    const w    = getPanelW();
    const N    = projectData.length;
    const norm = ((smoothScrollX / w) % N + N) % N;
    const base = Math.floor(norm);
    const frac = norm - base;
    const idx  = frac >= SNAP_THRESHOLD ? (base + 1) % N : base;
    snapToProjectSlide(idx);
}

function snapToProjectSlide(index) {
    if (isSnappingH) return;
    isSnappingH = true;

    stopProjectVideo(projectCurrentIndex);

    const dest  = getSnapDestH(index);
    const proxy = { val: smoothScrollX };

    gsap.to(proxy, {
        val:      dest,
        duration: 0.9,
        ease:     "power3.out",
        onUpdate: () => {
            smoothScrollX = proxy.val;
            targetScrollX = proxy.val;
            applyHScroll(smoothScrollX);
        },
        onComplete: () => {
            smoothScrollX       = dest;
            targetScrollX       = dest;
            projectCurrentIndex = index;
            // MORE panel text is updated live during scroll by updateLiveProjectMeta().
            playProjectVideo(index);
            isSnappingH = false;
        }
    });
}

gsap.ticker.add(() => {
    if (!projectScrollEnabled || isSnappingH) return;
    const diff = targetScrollX - smoothScrollX;
    if (Math.abs(diff) < 0.05) { smoothScrollX = targetScrollX; return; }
    smoothScrollX += diff * 0.1;
    applyHScroll(smoothScrollX);
});

function onProjectWheel(e) {
    if (!projectScrollEnabled) return;
    e.preventDefault();
    if (isSnappingH) return;
    const delta = Math.abs(e.deltaX) >= Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    targetScrollX += delta;
    scheduleMagneticSnapH();
}

let _projTouchStartX = 0;
let _projTouchStartY = 0;

function onProjectTouchStart(e) {
    if (!projectScrollEnabled) return;
    _projTouchStartX = e.touches[0].clientX;
    _projTouchStartY = e.touches[0].clientY;
}

function onProjectTouchEnd(e) {
    if (!projectScrollEnabled) return;
    const dx = _projTouchStartX - e.changedTouches[0].clientX;
    const dy = _projTouchStartY - e.changedTouches[0].clientY;
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
    if (isSnappingH) return;
    const delta = Math.abs(dx) >= Math.abs(dy) ? dx : dy;
    targetScrollX += delta * 1.8;
    scheduleMagneticSnapH();
}

// ── HTML escape — data.json is author-controlled, escape defensively ──────────
function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, c =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ── DOM BUILDERS ──────────────────────────────────────────────────────────────
function buildSlides(projects) {
    projects.forEach((p, i) => {
        const section = document.createElement("section");
        section.className    = "slide";
        section.dataset.index = i;
        section.dataset.title = p.title;
        section.innerHTML = `
            <div class="slide-content">
                <h2 class="title">${esc(p.title)}</h2>
            </div>
            <div class="media-container">
                <video muted loop playsinline preload="none" aria-hidden="true" poster="${esc(p.thumb)}">
                    <source src="${esc(p.video)}" type="video/mp4">
                </video>
            </div>`;
        slidesContainer.appendChild(section);
    });
}

function buildProjectPanels(projects) {
    projects.forEach((p, i) => {
        const article = document.createElement("article");
        article.className       = "project-panel";
        article.dataset.project = i;

        if (Array.isArray(p.videos) && p.videos.length) {
            // ── ba&sh-style panel: N videos that rotate, one playing at a time,
            //    the others showing their poster image. ──
            const cellsHTML = p.videos.map((src, k) => {
                const poster = (p.posters && p.posters[k]) || p.thumb;
                return `
                <div class="project-cell project-cell--video${k === 0 ? " is-active" : ""}">
                    <img class="project-poster" src="${esc(poster)}" alt="${esc(p.title)} — project visual" draggable="false" loading="lazy" decoding="async">
                    <video class="project-video" muted playsinline preload="none" aria-hidden="true" poster="${esc(poster)}">
                        <source src="${esc(src)}" type="video/mp4">
                    </video>
                </div>`;
            }).join("");
            article.innerHTML = `
            <div class="project-media-grid project-media-grid--multi">
                ${cellsHTML}
            </div>`;
        } else {
            // ── Standard panel: one wide video (70%) + one photo (30%). ──
            const photo = p.photo || (p.photos && p.photos[0]);
            const photoHTML = photo ? `
                <div class="project-cell project-cell--photo">
                    <img src="${esc(photo)}" alt="${esc(p.title)} — project visual" draggable="false" loading="lazy" decoding="async">
                </div>` : "";
            article.innerHTML = `
            <div class="project-media-grid">
                <div class="project-cell project-cell--video">
                    <video class="project-video" muted loop playsinline preload="none" aria-hidden="true" poster="${esc(p.thumb)}">
                        <source src="${esc(p.video)}" type="video/mp4">
                    </video>
                </div>
                ${photoHTML}
            </div>`;
        }
        projectTrack.appendChild(article);
    });
}

// Wire up the rotation controller for a multi-video (ba&sh) panel. Stores
// a { play, stop } controller on panel._rotation. Only one video plays at a
// time; when it ends the next cell starts and the previous reverts to its
// poster image.
function setupPanelRotation(panel) {
    const cells = Array.from(panel.querySelectorAll(".project-cell--video"));
    if (cells.length < 2) return;
    const videos = cells.map(c => c.querySelector("video"));
    let running = false;

    function show(idx) {
        cells.forEach((c, k) => {
            const v = videos[k];
            if (k === idx) {
                c.classList.add("is-active");
                try { v.currentTime = 0; } catch (e) {}
                const pr = v.play(); if (pr) pr.catch(() => {});
            } else {
                c.classList.remove("is-active");
                v.pause();
            }
        });
    }

    videos.forEach((v, k) => {
        v.addEventListener("ended", () => {
            if (!running) return;
            show((k + 1) % videos.length);
        });
    });

    panel._rotation = {
        play() { running = true; show(0); },
        stop() {
            running = false;
            videos.forEach(v => v.pause());
            cells.forEach((c, k) => c.classList.toggle("is-active", k === 0));
        }
    };
}

// ── LOADER ────────────────────────────────────────────────────────────────────
const loader = document.querySelector(".loader");
const loaderSnapshot = document.createElement("div");
loaderSnapshot.className = "loader-snapshot";
loader.appendChild(loaderSnapshot);

// ── VIDEO HELPERS ─────────────────────────────────────────────────────────────
function toggleVideo(index) {
    const slide  = slides[index];
    const videos = slide.querySelectorAll("video");
    if (!videos.length) return;
    if (videos[0].paused) {
        slide.classList.add("is-playing");
        videos.forEach(v => { const p = v.play(); if (p) p.catch(() => {}); });
    } else {
        slide.classList.remove("is-playing");
        videos.forEach(v => v.pause());
    }
}

function updateDesktopNavTitle(index) {
    if (!desktopNavTitle) return;
    desktopNavTitle.textContent = `[${slides[index]?.dataset?.title || ""}]`;
    desktopNavTitle.classList.add("visible");
}

// ── INTRO ANIMATION ───────────────────────────────────────────────────────────
function runIntroAnimation() {
    if (introHasPlayed) return;
    introHasPlayed = true;

    gsap.set(".loader",              { backgroundColor: "transparent", yPercent: 0, y: 0, force3D: true });
    gsap.set(".motion-blur-overlay", { yPercent: 0, force3D: true });

    const duration    = 1.5;
    const easing      = "power1.out";
    const proxy       = { frame: 0 };
    const totalFrames = slides.length * 5 - 1;
    let   lastIndex   = -1;

    gsap.set(slides, { zIndex: 1, autoAlpha: 0, scale: 1, y: 0, yPercent: 0 });

    gsap.fromTo(".motion-blur-overlay",
        { backdropFilter: "blur(20px)", webkitBackdropFilter: "blur(30px)" },
        { backdropFilter: "blur(0px)",  webkitBackdropFilter: "blur(0px)",  duration, ease: easing }
    );
    gsap.fromTo(".slides-container", { scaleY: 1.15 }, { scaleY: 1, duration, ease: easing });

    gsap.to(proxy, {
        frame: totalFrames,
        duration,
        ease: easing,
        onUpdate: () => {
            const idx = Math.floor(proxy.frame) % slides.length;
            if (idx !== lastIndex) {
                gsap.set(slides[idx], { zIndex: 10, autoAlpha: 1, scale: 1, overwrite: true });
                if (lastIndex >= 0) gsap.set(slides[lastIndex], { zIndex: 1, autoAlpha: 0 });
                lastIndex = idx;
            }
        },
        onComplete: () => {
            const firstSlide = slides[0];
            const lastIdx    = slides.length - 1;

            gsap.set(slides,          { zIndex: 1, autoAlpha: 1, scale: 1 });
            gsap.set(slides[lastIdx], { visibility: "visible", yPercent: -100, zIndex: 1 });
            gsap.set(firstSlide,      { visibility: "visible", yPercent: 0,    zIndex: 2 });
            gsap.set(slides[1],       { visibility: "visible", yPercent: 100,  zIndex: 1 });
            for (let i = 2; i < lastIdx; i++) gsap.set(slides[i], { autoAlpha: 0 });

            gsap.set(".loader",          { display: "none", opacity: 0 });
            gsap.set(".loader-snapshot", { display: "none" });

            const pressTl = gsap.timeline({
                onComplete: () => {
                    gsap.set(slidesContainer, { scale: 1 });

                    slides.forEach(s => {
                        gsap.set(s, {
                            yPercent:   0,
                            autoAlpha:  1,
                            visibility: "visible",
                            zIndex:     1,
                            scale:      1
                        });
                    });

                    currentIndex  = 0;
                    targetScrollY = 0;
                    smoothScrollY = 0;
                    scrollEnabled = true;
                    applyScroll(0);

                    window.addEventListener("wheel",      onWheel,      { passive: false });
                    window.addEventListener("touchstart", onTouchStart, { passive: true });
                    window.addEventListener("touchmove",  onTouchMove,  { passive: false });
                    window.addEventListener("touchend",   onTouchEnd,   { passive: true });

                    updateDesktopNavTitle(0);
                    // Reveal nav/logo/titles — and the "CLICK FOR MORE" cursor in sync.
                    homeUIRevealed = true;
                    if (isDesktop && desktopNav) gsap.to(desktopNav, { autoAlpha: 1, duration: 0.5 });
                    if (!isDesktop && logoFixed)  gsap.to(logoFixed,  { autoAlpha: 1, duration: 0.5 });

                    if (!isDesktop) {
                        const firstTitle = firstSlide.querySelector(".title");
                        if (firstTitle) gsap.fromTo(firstTitle,
                            { opacity: 0, y: -15 },
                            { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", delay: 0.2 }
                        );
                    }
                }
            });

            pressTl
                .to(slidesContainer, { scale: 0.93, duration: 0.7, ease: "power3.inOut" })
                .to(slidesContainer, { scale: 1,    duration: 0.5, ease: "power3.out"   });
        }
    });
}

// ── PROJECT PAGE ──────────────────────────────────────────────────────────────
function initDesktopProjectPage() {
    if (!projectPage) return;
    gsap.set(projectPage, { autoAlpha: 1, yPercent: 100 });
    gsap.set(desktopNav,  { autoAlpha: 0 });
}

function openProjectPage(startIndex) {
    if (!isDesktop || isProjectAnimating || isProjectPageOpen) return;
    isProjectAnimating = true;
    scrollEnabled      = false;

    projectCurrentIndex = startIndex;
    smoothScrollX       = startIndex * getPanelW();
    targetScrollX       = smoothScrollX;
    applyHScroll(smoothScrollX);

    // Meta is always visible — populate it for the starting project.
    liveMetaIndex = startIndex;
    populateProjectMeta(startIndex);

    gsap.to(projectPage, {
        yPercent: 0,
        duration: 1,
        ease: "power4.inOut",
        onComplete: () => {
            isProjectAnimating   = false;
            isProjectPageOpen    = true;
            projectScrollEnabled = true;
            projectPage.addEventListener("wheel",      onProjectWheel,      { passive: false });
            projectPage.addEventListener("touchstart", onProjectTouchStart, { passive: true });
            projectPage.addEventListener("touchend",   onProjectTouchEnd,   { passive: true });
            playProjectVideo(projectCurrentIndex);
        }
    });
}

function closeProjectPage() {
    if (!isDesktop || isProjectAnimating || !isProjectPageOpen) return;
    isProjectAnimating   = true;
    projectScrollEnabled = false;
    projectPage.removeEventListener("wheel",      onProjectWheel);
    projectPage.removeEventListener("touchstart", onProjectTouchStart);
    projectPage.removeEventListener("touchend",   onProjectTouchEnd);

    stopAllProjectVideos();
    liveMetaIndex = -1;

    gsap.to(projectPage, {
        yPercent: 100,
        duration: 0.8,
        ease: "power4.inOut",
        onComplete: () => {
            isProjectAnimating = false;
            isProjectPageOpen  = false;
            scrollEnabled      = true;
        }
    });
}

function playProjectVideo(index) {
    const panel = document.querySelectorAll(".project-panel")[index];
    if (!panel) return;
    if (panel._rotation) { panel._rotation.play(); return; }
    const v = panel.querySelector(".project-video");
    if (v) { const p = v.play(); if (p) p.catch(() => {}); }
}

function stopProjectVideo(index) {
    const panel = document.querySelectorAll(".project-panel")[index];
    if (!panel) return;
    if (panel._rotation) { panel._rotation.stop(); return; }
    const v = panel.querySelector(".project-video");
    if (v) v.pause();
}

function stopAllProjectVideos() {
    document.querySelectorAll(".project-panel").forEach(panel => {
        if (panel._rotation) { panel._rotation.stop(); return; }
        panel.querySelectorAll(".project-video").forEach(v => v.pause());
    });
}

// ── PROJECT INFO PANEL ────────────────────────────────────────────────────────
let liveMetaIndex = -1;   // nearest-project meta currently shown (live during horizontal scroll)

// Update the meta panel to the nearest project live during horizontal scroll,
// so the meta changes at the same speed as a fast scroll. The panel is always
// visible now (no MORE/CLOSE toggle).
function updateLiveProjectMeta(x) {
    const w = getPanelW();
    const N = projectData.length;
    if (!N) return;
    const norm = ((x / w) % N + N) % N;
    const idx  = Math.round(norm) % N;
    if (idx === liveMetaIndex) return;
    liveMetaIndex = idx;
    populateProjectMeta(idx);
    gsap.fromTo(
        [projectInfoMetaTitle, projectInfoMetaDesc, projectInfoMetaCredits, projectInfoMetaDate],
        { opacity: 0 },
        { opacity: 1, duration: 0.2, ease: "power2.out", overwrite: true }
    );
}

function populateProjectMeta(index) {
    const data = projectData[index];
    if (!data) return;
    projectInfoMetaTitle.textContent   = data.title;
    projectInfoMetaDesc.textContent    = data.description;
    projectInfoMetaCredits.textContent = data.credits || "";
    projectInfoMetaDate.textContent    = data.date;
}

// ── ABOUT ─────────────────────────────────────────────────────────────────────
if (aboutOverlay) gsap.set(aboutOverlay, { yPercent: 100, autoAlpha: 1 });

function openAbout() {
    if (isAboutAnimating) return;
    isAboutAnimating     = true;
    scrollEnabled        = false;
    projectScrollEnabled = false;

    // Lazy-load the ASCII video the first time About is opened — avoids fetching
    // flowersWhite.webm (~1.8 MB) on initial page load.
    if (!aboutVideoInited && typeof initAsciiVideo === "function") {
        aboutVideoInited = true;
        initAsciiVideo(
            document.getElementById("about-ascii-video"),
            "/medias/flowersWhite.webm",
            { lightThreshold: 240, colored: false }
        );
    }
    gsap.to(aboutOverlay, {
        yPercent: 0, duration: 1, ease: "power4.inOut",
        onComplete: () => { isAboutAnimating = false; }
    });
}

function closeAbout() {
    if (isAboutAnimating) return;
    isAboutAnimating = true;
    gsap.to(aboutOverlay, {
        yPercent: 100, duration: 0.8, ease: "power4.inOut",
        onComplete: () => {
            isAboutAnimating = false;
            if (isProjectPageOpen) projectScrollEnabled = true;
            else scrollEnabled = true;
        }
    });
}

// ── GALLERY ───────────────────────────────────────────────────────────────────
function initGalleryGrids(projects, caseImages) {
    const ratios = ["portrait", "landscape", "square"];

    function shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    function buildGrid(containerId, items) {
        const container = document.getElementById(containerId);
        if (!container) return;
        shuffle(items).forEach((item, i) => {
            const ratio = ratios[Math.floor(Math.random() * ratios.length)];
            const col   = (i % 5) + 1;
            const div   = document.createElement("div");
            div.className = `case-item case-item--${ratio}`;
            div.style.gridColumn = String(col);
            if (item.projectIndex !== undefined) {
                div.dataset.project = item.projectIndex;
                div.setAttribute("role", "button");
                div.tabIndex = 0;
                div.setAttribute("aria-label", `Open project ${item.title || ""}`.trim());
            }
            const img = document.createElement("img");
            img.src = item.src;
            img.alt = item.title || "";
            img.draggable = false;
            img.loading = "lazy";
            img.decoding = "async";
            div.appendChild(img);
            if (item.title) {
                const span = document.createElement("span");
                span.className   = "case-item__title";
                span.textContent = item.title;
                div.appendChild(span);
            }
            container.appendChild(div);
        });
    }

    buildGrid("index-grid", projects.map((p, i) => ({ src: p.thumb, title: p.title, projectIndex: i })));
    buildGrid("case-grid",  caseImages.map(src => ({ src, title: null })));
}

function openGallery(tab = "index") {
    if (isGalleryAnimating || isGalleryOpen) return;
    isGalleryAnimating = true;
    isGalleryOpen      = true;
    switchGalleryTab(tab);
    scrollEnabled = false;
    gsap.to(galleryOverlay, {
        yPercent: 0, autoAlpha: 1, duration: 0.9, ease: "power4.inOut",
        onComplete: () => { isGalleryAnimating = false; }
    });
}

function closeGallery() {
    if (isGalleryAnimating || !isGalleryOpen) return;
    isGalleryAnimating = true;
    isGalleryOpen      = false;
    gsap.to(galleryOverlay, {
        yPercent: 100, duration: 0.7, ease: "power4.inOut",
        onComplete: () => {
            gsap.set(galleryOverlay, { autoAlpha: 0 });
            isGalleryAnimating = false;
            scrollEnabled      = true;
        }
    });
}

function switchGalleryTab(tab) {
    currentGalleryTab = tab;
    if (tabIndex)    tabIndex.classList.toggle("is-active", tab === "index");
    if (tabCase)     tabCase.classList.toggle("is-active",  tab === "case");
    if (galleryLogo) galleryLogo.classList.remove("hidden");
    if (viewIndex)   viewIndex.style.display = tab === "index" ? "" : "none";
    if (viewCase)    viewCase.style.display  = tab === "case"  ? "" : "none";
}

if (galleryOverlay) gsap.set(galleryOverlay, { yPercent: 100, autoAlpha: 0 });

if (galleryLogo)    galleryLogo.addEventListener("click",   e => { e.stopPropagation(); closeGallery(); });
if (tabIndex)       tabIndex.addEventListener("click",      e => { e.stopPropagation(); switchGalleryTab("index"); });
if (tabCase)        tabCase.addEventListener("click",       e => { e.stopPropagation(); switchGalleryTab("case"); });
if (galleryInfoBtn) galleryInfoBtn.addEventListener("click", e => { e.stopPropagation(); openAbout(); });

if (galleryOverlay) {
    Observer.create({
        target:         galleryOverlay,
        type:           "touch",
        lockAxis:       true,
        onLeft:         () => { if (!isDesktop) closeGallery(); },
        tolerance:      20,
        preventDefault: false
    });
}

// ── EMAIL OBFUSCATION ─────────────────────────────────────────────────────────
(function setupEmail() {
    const part1 = "hello";
    const at    = String.fromCharCode(64);
    const part2 = "velar-studio.com";
    const full  = part1 + at + part2;

    const footer = document.querySelector(".about-footer");
    if (!footer) return;

    Array.from(footer.children).forEach(child => {
        if (!child.href || !child.href.includes("instagram")) footer.removeChild(child);
    });

    const emailLink = document.createElement("a");
    emailLink.className   = "contact-link";
    emailLink.href        = "mai" + "lto:" + full;
    emailLink.textContent = full + " \u2197";

    footer.insertBefore(emailLink, footer.firstElementChild);
})();

// ── EXPLORE-THE-PROJECT CURSOR (desktop homepage) ─────────────────────────────
// A rotating "EXPLORE THE PROJECT" badge that follows the cursor while the home
// slides are showing. Sits below all overlays (z-index 150) so it's naturally
// hidden whenever a project page / gallery / about overlay is open.
const exploreCursor = document.querySelector(".explore-cursor");
if (exploreCursor) {
    let exTargetX = window.innerWidth / 2;
    let exTargetY = window.innerHeight / 2;
    let exX = exTargetX, exY = exTargetY;
    let exVisible = false;
    let mouseInWindow = false;

    // Gated on homeUIRevealed (not introHasPlayed) so it fades in at the exact
    // moment the intro reveals the logo/titles — in sync with the rest of the UI.
    const canShowExplore = () =>
        isDesktop && homeUIRevealed && mouseInWindow &&
        !isProjectPageOpen && !isGalleryOpen && !isAboutAnimating;

    const setExploreVisible = v => {
        if (v === exVisible) return;
        exVisible = v;
        exploreCursor.classList.toggle("is-visible", v);
    };

    window.addEventListener("mousemove", e => {
        exTargetX = e.clientX;
        exTargetY = e.clientY;
        mouseInWindow = true;
    });
    document.addEventListener("mouseleave", () => { mouseInWindow = false; });

    (function followExplore() {
        setExploreVisible(canShowExplore());
        exX += (exTargetX - exX) * 0.2;
        exY += (exTargetY - exY) * 0.2;
        exploreCursor.style.transform =
            `translate3d(${exX}px, ${exY}px, 0) translate(16px, 14px)`;
        requestAnimationFrame(followExplore);
    })();
}

// ── STATIC EVENT BINDINGS ─────────────────────────────────────────────────────
if (logoFixed)      logoFixed.addEventListener("click",      e => { e.stopPropagation(); openAbout(); });
if (aboutBack)      aboutBack.addEventListener("click",      e => { e.stopPropagation(); closeAbout(); });
if (navInfo)        navInfo.addEventListener("click",        e => { e.stopPropagation(); openAbout(); });
if (projectInfoBtn) projectInfoBtn.addEventListener("click", e => { e.stopPropagation(); openAbout(); });

if (navIndexCase) {
    navIndexCase.addEventListener("click", e => {
        e.stopPropagation();
        if (isProjectPageOpen) closeProjectPage();
        else openGallery(currentGalleryTab);
    });
}

if (projectLogoBack) {
    projectLogoBack.addEventListener("click", e => {
        e.stopPropagation();
        if (isProjectPageOpen) closeProjectPage();
    });
}

// ── RESIZE ────────────────────────────────────────────────────────────────────
window.addEventListener("resize", () => {
    const wasDesktop = isDesktop;
    isDesktop = window.innerWidth >= 768;
    if (wasDesktop !== isDesktop) { location.reload(); return; }

    if (isDesktop && isProjectPageOpen) {
        smoothScrollX = projectCurrentIndex * getPanelW();
        targetScrollX = smoothScrollX;
        applyHScroll(smoothScrollX);
    }
    if (scrollEnabled) {
        targetScrollY = getSnapDest(currentIndex);
        smoothScrollY = targetScrollY;
        applyScroll(smoothScrollY);
    }
});

// ── INIT — fetch data.json then build everything ──────────────────────────────
window.addEventListener("load", async () => {
    let data = { projects: [], case: [] };
    try {
        const res = await fetch("data.json");
        data = await res.json();
    } catch (e) {
        console.error("Could not load data.json:", e);
    }

    projectData = data.projects;

    buildSlides(data.projects);
    buildProjectPanels(data.projects);

    // Wire rotation controllers for any multi-video (ba&sh) panels.
    document.querySelectorAll(".project-panel").forEach(setupPanelRotation);

    // Update slides NodeList after DOM injection
    slides = Array.from(document.querySelectorAll(".slide"));

    // Gallery grids
    initGalleryGrids(data.projects, data.case || []);

    // Case item clicks (must run after grid is built)
    document.querySelectorAll(".case-item").forEach(item => {
        const openItem = () => {
            const idx = parseInt(item.dataset.project, 10);
            if (isNaN(idx)) return;
            closeGallery();
            gsap.delayedCall(0.4, () => openProjectPage(idx));
        };
        item.addEventListener("click", e => { e.stopPropagation(); openItem(); });
        item.addEventListener("keydown", e => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                openItem();
            }
        });
    });

    // Slide clicks — mobile: toggle video / desktop: open project page
    slides.forEach((slide, index) => {
        slide.addEventListener("click", () => {
            if (!introHasPlayed || index !== currentIndex) return;
            if (!isDesktop) toggleVideo(index);
            else            openProjectPage(index);
        });
    });

    if (isDesktop) initDesktopProjectPage();
    setTimeout(runIntroAnimation, 100);
});
