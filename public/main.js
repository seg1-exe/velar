gsap.registerPlugin(Observer);

const slides               = document.querySelectorAll(".slide");
const slidesContainer      = document.querySelector(".slides-container");
const logoFixed            = document.querySelector(".logo-fixed");
const aboutOverlay         = document.querySelector(".about-overlay");
const aboutBack            = document.querySelector(".about-back");

const desktopNav           = document.querySelector(".desktop-nav");
const desktopNavLogo       = document.querySelector(".desktop-nav__logo");
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

let isGalleryOpen          = false;
let isGalleryAnimating     = false;
let currentGalleryTab      = "index";

const projectPage          = document.getElementById("project-page");
const projectLogoBack      = document.getElementById("project-logo-back");
const projectMoreBtn       = document.getElementById("project-more-btn");
const projectInfoBtn       = document.getElementById("project-info-btn");
const projectTrack         = document.getElementById("project-track");
const projectInfoPanel     = document.getElementById("project-info-panel");
const projectInfoMediaRow  = document.getElementById("project-info-media-row");
const projectInfoMetaTitle = document.getElementById("project-info-meta-title");
const projectInfoMetaDesc  = document.getElementById("project-info-meta-desc");
const projectInfoMetaTags  = document.getElementById("project-info-meta-tags");
const projectInfoMetaDate  = document.getElementById("project-info-meta-date");

let currentIndex             = 0;
let introHasPlayed           = false;
let isDesktop                = window.innerWidth >= 768;

let projectCurrentIndex      = 0;
let isProjectPageOpen        = false;
let isProjectAnimating       = false;

let isAboutAnimating         = false;

// ── SMOOTH SCROLL + MAGNETIC SNAP ────────────────────────────────────────────
let targetScrollY  = 0;
let smoothScrollY  = 0;
let isSnapping     = false;
let snapTimeout    = null;
let scrollEnabled  = false;

const SNAP_THRESHOLD = 0.28; // fraction of a slide height → triggers snap to next

function getSlideH() { return window.innerHeight; }
function getTotal()  { return slides.length * getSlideH(); }

// Position each slide individually for infinite wrapping.
// y is unbounded; slides wrap around so the right one is always in view.
function applyScroll(y) {
    const h     = getSlideH();
    const total = getTotal();
    gsap.set(slidesContainer, { y: 0 });
    slides.forEach((s, i) => {
        let pos = ((i * h - y) % total + total) % total;
        if (pos > total / 2) pos -= total;
        gsap.set(s, { y: pos });
    });
}

// Returns the nearest snap destination for slide `index` relative to current y.
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
    const h     = getSlideH();
    const N     = slides.length;
    const total = getTotal();
    // Normalize scroll position to [0, N)
    const norm  = ((smoothScrollY / h) % N + N) % N;
    const base  = Math.floor(norm);
    const frac  = norm - base;
    const idx   = frac >= SNAP_THRESHOLD ? (base + 1) % N : base;
    snapToSlide(idx);
}

function snapToSlide(index) {
    if (isSnapping) return;
    isSnapping = true;

    const dest  = getSnapDest(index);
    const proxy = { val: smoothScrollY };

    gsap.to(proxy, {
        val:      dest,
        duration: 0.9,
        ease:     "power3.out",
        onUpdate: () => {
            smoothScrollY = proxy.val;
            targetScrollY = proxy.val;
            applyScroll(smoothScrollY);
        },
        onComplete: () => {
            smoothScrollY = dest;
            targetScrollY = dest;
            currentIndex  = index;
            updateDesktopNavTitle(index);
            isSnapping = false;

            // Mobile: animate title in for current slide
            if (!isDesktop) {
                slides.forEach((s, i) => {
                    const title = s.querySelector(".title");
                    if (!title) return;
                    if (i === index) {
                        gsap.fromTo(title,
                            { opacity: 0, y: -15 },
                            { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
                        );
                    } else {
                        gsap.set(title, { opacity: 0, y: -15 });
                    }
                });
            }
        }
    });
}

// Smooth ticker
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
let _touchStartX = 0;
let _touchStartY = 0;

function onTouchStart(e) {
    if (!scrollEnabled || isProjectPageOpen || isGalleryOpen) return;
    _touchStartX = e.touches[0].clientX;
    _touchStartY = e.touches[0].clientY;
}

function onTouchEnd(e) {
    if (!scrollEnabled || isProjectPageOpen || isGalleryOpen) return;
    const dx = _touchStartX - e.changedTouches[0].clientX;
    const dy = _touchStartY - e.changedTouches[0].clientY;

    // Horizontal swipe right → gallery (mobile)
    if (!isDesktop && Math.abs(dx) > Math.abs(dy) && dx < -40) {
        openGallery("case");
        return;
    }
    // Vertical swipe
    if (Math.abs(dy) < 20 || Math.abs(dy) < Math.abs(dx)) return;
    if (isSnapping) return;
    targetScrollY += dy * 1.8;
    scheduleMagneticSnap();
}

// ── HORIZONTAL SMOOTH SCROLL + MAGNETIC SNAP (PROJECT PAGE) ──────────────────
let targetScrollX        = 0;
let smoothScrollX        = 0;
let isSnappingH          = false;
let snapTimeoutH         = null;
let projectScrollEnabled = false;

function getPanelW()     { return window.innerWidth; }
function getPanelTotal() { return projectData.length * getPanelW(); }

function applyHScroll(x) {
    const w     = getPanelW();
    const total = getPanelTotal();
    const panels = document.querySelectorAll(".project-panel");
    panels.forEach((p, i) => {
        let pos = ((i * w - x) % total + total) % total;
        if (pos > total / 2) pos -= total;
        gsap.set(p, { x: pos });
    });
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
            if (isInfoExpanded) populateProjectMeta(index);
            playProjectVideo(index);
            isSnappingH = false;
        }
    });
}

// Smooth ticker — project horizontal
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

// ── PROJECT DATA ──────────────────────────────────────────────────────────────
const projectData = [
    { title: "LIERAC",            description: "A botanical journey into the heart of LIERAC's serum. We crafted a visual narrative around transparency, purity, and the living intelligence of plants.", tags: "CGI\nAI\nArt Direction",                                    date: "2024" },
    { title: "BA&SH",             description: "Pieces that move. A social-first campaign celebrating freedom of expression through garments that live and breathe on screen.",                          tags: "Narrative Production\nSocial-First Content\nPost Production", date: "2024" },
    { title: "I KEPT MY NAME",    description: "Identity as resistance. A film exploring what it means to hold onto yourself when the world tries to rename you.",                                      tags: "Narrative Production\nArt Direction\nPost Production",         date: "2023" },
    { title: "THE MAGIC IS",      description: "The invisible made tangible. A campaign built around the sensation of transformation—before and after the moment that changes everything.",             tags: "CGI\nMotion Design\nArt Direction",                            date: "2023" },
    { title: "STOP OVERTHINKING", description: "A manifesto in motion. Structured chaos, interrupted thoughts, and the beauty of letting go—translated into a visual language for a new generation.", tags: "Social-First Content\nMotion Design\nAI",                      date: "2024" },
    { title: "RED",               description: "Paris at night, reimagined. A city that pulses with desire, tension, and color—captured in a campaign that refuses to be quiet.",                      tags: "Narrative Production\nPost Production\nArt Direction",         date: "2024" },
    { title: "SO/PARIS",          description: "Luxury hospitality seen through a new lens. An experience campaign that blurs the line between a hotel stay and a state of mind.",                     tags: "CGI\nArt Direction\nPost Production",                          date: "2023" }
];

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

slides.forEach((slide, index) => {
    slide.addEventListener("click", () => {
        if (!isDesktop && index === currentIndex && introHasPlayed) toggleVideo(index);
    });
});

// ── NAV TITLE ─────────────────────────────────────────────────────────────────
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
                    // ── Switch to smooth-scroll mode ──────────────────────────
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
                    window.addEventListener("touchend",   onTouchEnd,   { passive: true });

                    updateDesktopNavTitle(0);
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

function openProjectPage(startIndex, onOpened) {
    if (!isDesktop || isProjectAnimating || isProjectPageOpen) return;
    isProjectAnimating = true;
    scrollEnabled      = false;

    projectCurrentIndex = startIndex;
    smoothScrollX       = startIndex * getPanelW();
    targetScrollX       = smoothScrollX;
    applyHScroll(smoothScrollX);

    projectInfoMetaTitle.textContent = "";
    projectInfoMetaDesc.textContent  = "";
    projectInfoMetaTags.innerHTML    = "";
    projectInfoMetaDate.textContent  = "";

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
            if (onOpened) onOpened();
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

    if (isInfoExpanded) {
        isInfoExpanded  = false;
        isInfoAnimating = false;
        if (projectMoreBtn) projectMoreBtn.textContent = "MORE";
        if (projectInfoMediaRow) {
            gsap.set(projectInfoMediaRow, { height: 0 });
            projectInfoMediaRow.innerHTML = "";
        }
    }

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
    const v = panel.querySelector(".project-video");
    if (v) { const p = v.play(); if (p) p.catch(() => {}); }
}

function stopProjectVideo(index) {
    const panel = document.querySelectorAll(".project-panel")[index];
    if (!panel) return;
    const v = panel.querySelector(".project-video");
    if (v) v.pause();
}

function stopAllProjectVideos() {
    document.querySelectorAll(".project-panel .project-video").forEach(v => v.pause());
}


// ── PROJECT INFO PANEL ────────────────────────────────────────────────────────
let isInfoExpanded  = false;
let isInfoAnimating = false;

function openProjectInfo() {
    if (isInfoAnimating || isInfoExpanded) return;
    isInfoAnimating = true;
    isInfoExpanded  = true;

    if (projectMoreBtn) projectMoreBtn.textContent = "CLOSE";

    const restingH = projectInfoPanel.offsetHeight;
    populateProjectMeta(projectCurrentIndex);

    gsap.set(projectInfoPanel, { height: "auto", visibility: "hidden" });
    const targetH = projectInfoPanel.offsetHeight;
    gsap.set(projectInfoPanel, { height: restingH, visibility: "visible" });

    gsap.to(projectInfoPanel, {
        height: targetH,
        duration: 0.65,
        ease: "power3.inOut",
        onComplete: () => {
            gsap.set(projectInfoPanel, { height: "auto" });
            isInfoAnimating = false;
        }
    });
}

function closeProjectInfo() {
    if (isInfoAnimating || !isInfoExpanded) return;
    isInfoAnimating = true;
    isInfoExpanded  = false;

    if (projectMoreBtn) projectMoreBtn.textContent = "MORE";

    const currentH = projectInfoPanel.offsetHeight;
    gsap.set(projectInfoPanel, { height: currentH });

    projectInfoMetaTitle.textContent = "";
    projectInfoMetaDesc.textContent  = "";
    projectInfoMetaTags.innerHTML    = "";
    projectInfoMetaDate.textContent  = "";

    gsap.set(projectInfoPanel, { height: "auto", visibility: "hidden" });
    const restingH = projectInfoPanel.offsetHeight;
    gsap.set(projectInfoPanel, { height: currentH, visibility: "visible" });

    gsap.to(projectInfoPanel, {
        height: restingH,
        duration: 0.5,
        ease: "power3.inOut",
        onComplete: () => {
            gsap.set(projectInfoPanel, { height: "auto" });
            isInfoAnimating = false;
        }
    });
}

function populateProjectMeta(index) {
    const data = projectData[index];
    if (!data) return;
    projectInfoMetaTitle.textContent = data.title;
    projectInfoMetaDesc.textContent  = data.description;
    projectInfoMetaTags.innerHTML    = data.tags.split("\n").map(t => `<div>${t}</div>`).join("");
    projectInfoMetaDate.textContent  = data.date;
}

// ── SLIDE CLICK → PROJECT PAGE (desktop) ─────────────────────────────────────
slides.forEach((slide, index) => {
    slide.addEventListener("click", () => {
        if (!isDesktop || !introHasPlayed || index !== currentIndex) return;
        openProjectPage(index);
    });
});

// ── ABOUT ─────────────────────────────────────────────────────────────────────
if (aboutOverlay) gsap.set(aboutOverlay, { yPercent: 100, autoAlpha: 1 });

function openAbout() {
    if (isAboutAnimating) return;
    isAboutAnimating = true;
    scrollEnabled        = false;
    projectScrollEnabled = false;
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

// ── GALLERY GRIDS ─────────────────────────────────────────────────────────────
(function initGalleryGrids() {
    const indexImages = [
        { src: "medias/BOTANIQUE.png",     title: "LIERAC",            projectIndex: 0 },
        { src: "medias/PIECES.png",         title: "BA&SH",             projectIndex: 1 },
        { src: "medias/I_KEPT_MY_NAME.png", title: "I KEPT MY NAME",    projectIndex: 2 },
        { src: "medias/TELES.png",          title: "THE MAGIC IS",      projectIndex: 3 },
        { src: "medias/OVERTHINK.png",      title: "STOP OVERTHINKING", projectIndex: 4 },
        { src: "medias/VILLE.png",          title: "RED",               projectIndex: 5 },
        { src: "medias/SOPARIS.png",        title: "SO/PARIS",          projectIndex: 6 },
    ];

    const caseImages = Array.from({ length: 15 }, (_, i) => ({
        src: `medias/case/image${i + 1}.jpg`,
        title: null
    }));

    const ratios = ["portrait", "landscape", "square"];

    function shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    function buildGrid(containerId, images) {
        const container = document.getElementById(containerId);
        if (!container) return;
        shuffle(images).forEach((item, i) => {
            const ratio = ratios[Math.floor(Math.random() * ratios.length)];
            const col   = (i % 5) + 1;
            const div   = document.createElement("div");
            div.className = `case-item case-item--${ratio}`;
            div.style.gridColumn = String(col);
            if (item.projectIndex !== undefined) div.dataset.project = item.projectIndex;
            const img = document.createElement("img");
            img.src = item.src;
            img.alt = item.title || "";
            img.draggable = false;
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

    buildGrid("index-grid", indexImages);
    buildGrid("case-grid",  caseImages);
})();

function openGallery(tab = "index") {
    if (isGalleryAnimating || isGalleryOpen) return;
    isGalleryAnimating = true;
    isGalleryOpen      = true;
    switchGalleryTab(tab, false);
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

if (galleryLogo)    galleryLogo.addEventListener("click",  e => { e.stopPropagation(); closeGallery(); });
if (tabIndex)       tabIndex.addEventListener("click",     e => { e.stopPropagation(); switchGalleryTab("index"); });
if (tabCase)        tabCase.addEventListener("click",      e => { e.stopPropagation(); switchGalleryTab("case"); });
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

document.querySelectorAll(".case-item").forEach(item => {
    item.addEventListener("click", e => {
        e.stopPropagation();
        const projectIndex = parseInt(item.dataset.project, 10);
        if (isNaN(projectIndex)) return;
        closeGallery();
        gsap.delayedCall(0.4, () => openProjectPage(projectIndex, openProjectInfo));
    });
});

// ── GLOBAL EVENT BINDINGS ─────────────────────────────────────────────────────
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

if (projectMoreBtn) {
    projectMoreBtn.addEventListener("click", e => {
        e.stopPropagation();
        if (isInfoExpanded) closeProjectInfo();
        else openProjectInfo();
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

    const emailSpan = document.createElement("span");
    emailSpan.className    = "contact-link";
    emailSpan.style.cursor = "pointer";
    emailSpan.textContent  = full + " \u2197";

    emailSpan.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = "mai" + "lto:" + full;
    });

    footer.insertBefore(emailSpan, footer.firstElementChild);
})();

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

// ── INIT ──────────────────────────────────────────────────────────────────────
window.addEventListener("load", () => {
    if (isDesktop) initDesktopProjectPage();
    setTimeout(runIntroAnimation, 100);
});
