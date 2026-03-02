// ============================================================
//  VELAR — main.js  [DEBUG VERSION]
// ============================================================

gsap.registerPlugin(Observer);

// ── DOM refs ─────────────────────────────────────────────────
const slides              = document.querySelectorAll(".slide");
const logoFixed           = document.querySelector(".logo-fixed");
const aboutOverlay        = document.querySelector(".about-overlay");
const aboutBack           = document.querySelector(".about-back");

const desktopNav          = document.querySelector(".desktop-nav");
const desktopNavLogo      = document.querySelector(".desktop-nav__logo");
const desktopNavTitle     = document.querySelector(".desktop-nav__project-title");
const navIndexCase        = document.getElementById("nav-index-case");
const navInfo             = document.getElementById("nav-info");

// ── Gallery overlay refs ──────────────────────────────────────
const galleryOverlay      = document.getElementById("gallery-overlay");
const galleryLogo         = document.getElementById("gallery-logo");
const tabIndex            = document.getElementById("tab-index");
const tabCase             = document.getElementById("tab-case");
const viewIndex           = document.getElementById("view-index");
const viewCase            = document.getElementById("view-case");
const galleryInfoBtn      = document.getElementById("gallery-info-btn");

let isGalleryOpen         = false;
let isGalleryAnimating    = false;
let currentGalleryTab     = "index"; // "index" | "case"

const projectPage         = document.getElementById("project-page");
const projectLogoBack     = document.getElementById("project-logo-back");
const projectMoreBtn      = document.getElementById("project-more-btn");
const projectInfoBtn      = document.getElementById("project-info-btn");
const projectTrack        = document.getElementById("project-track");
const projectInfoPanel    = document.getElementById("project-info-panel");
const projectInfoClose    = document.getElementById("project-info-close");
const projectInfoHeaderLogo = document.querySelector(".project-info-header__logo");
const projectInfoMediaRow = document.getElementById("project-info-media-row");
const projectInfoMetaTitle = document.getElementById("project-info-meta-title");
const projectInfoMetaDesc  = document.getElementById("project-info-meta-desc");
const projectInfoMetaTags  = document.getElementById("project-info-meta-tags");
const projectInfoMetaDate  = document.getElementById("project-info-meta-date");

// ── DEBUG: log all DOM refs on load ──────────────────────────

// ── State ─────────────────────────────────────────────────────
let currentIndex             = 0;
let isAnimating              = true;
let introHasPlayed           = false;
let isDesktop                = window.innerWidth >= 768;

let projectCurrentIndex      = 0;
let isProjectPageOpen        = false;
let isProjectAnimating       = false;
let isProjectScrollAnimating = false;

let isAboutAnimating         = false;

// ── Project data ──────────────────────────────────────────────
const projectData = [
    { title: "LIERAC",          description: "A botanical journey into the heart of LIERAC's serum. We crafted a visual narrative around transparency, purity, and the living intelligence of plants.", tags: "CGI\nAI\nArt Direction",                                    date: "2024" },
    { title: "BA&SH",           description: "Pieces that move. A social-first campaign celebrating freedom of expression through garments that live and breathe on screen.",                          tags: "Narrative Production\nSocial-First Content\nPost Production", date: "2024" },
    { title: "I KEPT MY NAME",  description: "Identity as resistance. A film exploring what it means to hold onto yourself when the world tries to rename you.",                                      tags: "Narrative Production\nArt Direction\nPost Production",         date: "2023" },
    { title: "THE MAGIC IS",    description: "The invisible made tangible. A campaign built around the sensation of transformation—before and after the moment that changes everything.",             tags: "CGI\nMotion Design\nArt Direction",                            date: "2023" },
    { title: "STOP OVERTHINKING", description: "A manifesto in motion. Structured chaos, interrupted thoughts, and the beauty of letting go—translated into a visual language for a new generation.", tags: "Social-First Content\nMotion Design\nAI",                      date: "2024" },
    { title: "RED",             description: "Paris at night, reimagined. A city that pulses with desire, tension, and color—captured in a campaign that refuses to be quiet.",                      tags: "Narrative Production\nPost Production\nArt Direction",         date: "2024" },
    { title: "SO/PARIS",        description: "Luxury hospitality seen through a new lens. An experience campaign that blurs the line between a hotel stay and a state of mind.",                     tags: "CGI\nArt Direction\nPost Production",                          date: "2023" }
];

// ── Loader snapshot ───────────────────────────────────────────
const loader = document.querySelector(".loader");
const loaderSnapshot = document.createElement("div");
loaderSnapshot.className = "loader-snapshot";
loader.appendChild(loaderSnapshot);

// ── Mobile: video toggle ──────────────────────────────────────
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

// ── Vertical slide navigation ─────────────────────────────────
function gotoSlide(index, direction) {
    console.log(`[VELAR DEBUG] gotoSlide(${index}, ${direction}) | isAnimating=${isAnimating}`);
    if (isAnimating) {
 return; }
    isAnimating = true;

    const currentSlide = slides[currentIndex];
    const nextSlide    = slides[index];

    currentSlide.classList.remove("is-playing");
    currentSlide.querySelectorAll("video").forEach(v => { v.pause(); v.load(); });

    gsap.set(nextSlide,    { visibility: "visible", zIndex: 2, autoAlpha: 1, yPercent: direction === "down" ? 100 : -100 });
    gsap.set(currentSlide, { zIndex: 1 });

    updateDesktopNavTitle(index);

    gsap.timeline({
        onComplete: () => {
            gsap.set(currentSlide, { visibility: "hidden", autoAlpha: 0, yPercent: 0 });
            gsap.delayedCall(0.3, () => { isAnimating = false; });
        }
    }).to(nextSlide, { yPercent: 0, duration: 1, ease: "power4.inOut" });

    currentIndex = index;
}

function updateDesktopNavTitle(index) {
    if (!desktopNavTitle) return;
    desktopNavTitle.textContent = `[${slides[index]?.dataset?.title || ""}]`;
    desktopNavTitle.classList.add("visible");
}

// ── Slide observer ────────────────────────────────────────────
const slideObserver = Observer.create({
    type: "wheel,touch",
    wheelSpeed: -1,
    ignore: ".desktop-nav, .about-overlay, button, a",
    onDown: () => {
        if (!isAnimating) gotoSlide(currentIndex - 1 < 0 ? slides.length - 1 : currentIndex - 1, "up");
    },
    onUp: () => {
        if (!isAnimating) gotoSlide(currentIndex + 1 >= slides.length ? 0 : currentIndex + 1, "down");
    },
    tolerance: 10,
    preventDefault: false
});
slideObserver.disable();

// ── Intro animation ───────────────────────────────────────────
function runIntroAnimation() {
    console.log("[VELAR DEBUG] runIntroAnimation() called");
    if (introHasPlayed) {
 return; }
    introHasPlayed = true;

    gsap.set(".loader",              { backgroundColor: "transparent", yPercent: 0, y: 0, force3D: true });
    gsap.set(".motion-blur-overlay", { yPercent: 0, force3D: true });

    const duration    = 2.5;
    const easing      = "power1.out";
    const proxy       = { frame: 0 };
    const totalFrames = slides.length * 5 - 1;
    let   lastIndex   = -1;

    gsap.set(slides, { zIndex: 1, autoAlpha: 0, scale: 1 });

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

            const firstSlide      = slides[0];
            const lastIdx         = slides.length - 1;
            const slidesContainer = document.querySelector(".slides-container");

            gsap.set(slides,          { zIndex: 1, autoAlpha: 1, scale: 1 });
            gsap.set(slides[lastIdx], { visibility: "visible", yPercent: -100, zIndex: 1 });
            gsap.set(firstSlide,      { visibility: "visible", yPercent: 0,    zIndex: 2 });
            gsap.set(slides[1],       { visibility: "visible", yPercent: 100,  zIndex: 1 });
            for (let i = 2; i < lastIdx; i++) gsap.set(slides[i], { autoAlpha: 0 });

            gsap.set(".loader",          { display: "none", opacity: 0 });
            gsap.set(".loader-snapshot", { display: "none" });

            console.log("[VELAR DEBUG] Building pressTl (scale bounce)...");

            const pressTl = gsap.timeline({
                onStart: () => {
                },
                onComplete: () => {

                    gsap.set(slidesContainer, { scale: 1 });
                    gsap.set(slides,     { yPercent: 0, zIndex: 1, autoAlpha: 0 });
                    gsap.set(firstSlide, { zIndex: 2, autoAlpha: 1, yPercent: 0 });

                    isAnimating = false;

                    slideObserver.enable();

                    currentIndex = 0;
                    updateDesktopNavTitle(0);

                    if (isDesktop && desktopNav) {
                        gsap.to(desktopNav, { autoAlpha: 1, duration: 0.5 });
                    }
                    if (!isDesktop && logoFixed) {
                        gsap.to(logoFixed, { autoAlpha: 1, duration: 0.5 });
                    }
                }
            });

            pressTl
                .to(slidesContainer, { scale: 0.8, duration: 1,   ease: "power3.inOut" })
                .to(slidesContainer, { scale: 1,   duration: 0.6, ease: "power3.out"   });

            console.log("[VELAR DEBUG] pressTl built, tweens:", pressTl.getChildren().length);
        }
    });
}

// ── Desktop: init project page ────────────────────────────────
function initDesktopProjectPage() {
    if (!projectPage) return;
    gsap.set(projectPage, { autoAlpha: 1, yPercent: 100 });
    gsap.set(desktopNav,  { autoAlpha: 0 });
}

// ── Open / close project page ─────────────────────────────────
function openProjectPage(startIndex) {
    if (!isDesktop || isProjectAnimating || isProjectPageOpen) return;
    isProjectAnimating = true;

    projectCurrentIndex = startIndex;
    snapTrackToIndex(startIndex, false);

    // Clear meta fields — they only appear after clicking MORE
    projectInfoMetaTitle.textContent = "";
    projectInfoMetaDesc.textContent  = "";
    projectInfoMetaTags.innerHTML    = "";
    projectInfoMetaDate.textContent  = "";

    gsap.to(projectPage, {
        yPercent: 0,
        duration: 1,
        ease: "power4.inOut",
        onComplete: () => {
            isProjectAnimating = false;
            isProjectPageOpen  = true;
            slideObserver.disable();
            playProjectVideo(projectCurrentIndex);
            projectScrollObserver.enable();
        }
    });
}

function closeProjectPage() {
    if (!isDesktop || isProjectAnimating || !isProjectPageOpen) return;
    isProjectAnimating = true;

    stopAllProjectVideos();
    projectScrollObserver.disable();

    // Collapse info strip and reset button text
    if (isInfoExpanded) {
        isInfoExpanded = false;
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
            slideObserver.enable();
        }
    });
}

// ── Track snap ────────────────────────────────────────────────
function snapTrackToIndex(index, animate) {
    const x = -(index * window.innerWidth);
    console.log(`[VELAR DEBUG] snapTrackToIndex(${index}) → x=${x} | animate=${animate}`);
    if (animate) {
        gsap.to(projectTrack,  { x, duration: 1, ease: "power4.inOut" });
    } else {
        gsap.set(projectTrack, { x });
    }
}

// ── Video helpers ─────────────────────────────────────────────
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

// ── Horizontal scroll observer — INFINITE wrap ────────────────
const projectScrollObserver = Observer.create({
    target: projectPage,
    type: "wheel,touch",
    wheelSpeed: -1,
    lockAxis: true,
    onUp:    () => { goToProjectIndex(projectCurrentIndex + 1); },
    onDown:  () => { goToProjectIndex(projectCurrentIndex - 1); },
    onLeft:  () => { goToProjectIndex(projectCurrentIndex + 1); },
    onRight: () => { goToProjectIndex(projectCurrentIndex - 1); },
    tolerance: 10,
    preventDefault: true
});
projectScrollObserver.disable();

function goToProjectIndex(newIndex) {
    if (isProjectScrollAnimating) return;
    isProjectScrollAnimating = true;

    const total  = projectData.length;
    const w      = window.innerWidth;
    const panels = document.querySelectorAll(".project-panel");
    const prev   = projectCurrentIndex;
    const next   = ((newIndex % total) + total) % total;

    stopProjectVideo(prev);

    const onDone = () => {
        projectCurrentIndex = next;
        if (isInfoExpanded) populateProjectMeta(next);
        playProjectVideo(next);
        gsap.delayedCall(0.3, () => { isProjectScrollAnimating = false; });
    };

    if (prev === total - 1 && next === 0) {
        // Wrap forward: place panel 0 one slot after the last, animate there, then reset silently
        gsap.set(panels[0], { x: total * w });
        gsap.to(projectTrack, {
            x: -(total * w), duration: 1, ease: "power4.inOut",
            onComplete: () => {
                gsap.set(panels[0], { x: 0 });
                gsap.set(projectTrack, { x: 0 });
                onDone();
            }
        });
    } else if (prev === 0 && next === total - 1) {
        // Wrap backward: place last panel one slot before panel 0, animate there, then reset silently
        gsap.set(panels[total - 1], { x: -(total * w) });
        gsap.to(projectTrack, {
            x: w, duration: 1, ease: "power4.inOut",
            onComplete: () => {
                gsap.set(panels[total - 1], { x: 0 });
                gsap.set(projectTrack, { x: -((total - 1) * w) });
                onDone();
            }
        });
    } else {
        projectCurrentIndex = next;
        snapTrackToIndex(next, true);
        if (isInfoExpanded) populateProjectMeta(next);
        gsap.delayedCall(1.3, () => {
            playProjectVideo(projectCurrentIndex);
            isProjectScrollAnimating = false;
        });
    }
}

// ── Info panel state ──────────────────────────────────────────
let isInfoExpanded  = false;
let isInfoAnimating = false;

// ── Populate meta bar (text only) ─────────────────────────────

function openProjectInfo() {
    if (isInfoAnimating || isInfoExpanded) return;
    isInfoAnimating = true;
    isInfoExpanded  = true;

    if (projectMoreBtn) projectMoreBtn.textContent = "CLOSE";

    // Capture the current resting height (padding strip) before populating
    const restingH = projectInfoPanel.offsetHeight;

    populateProjectMeta(projectCurrentIndex);

    // Measure full target height while invisible
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

    // Clear text immediately so we can measure the resting height (padding only)
    projectInfoMetaTitle.textContent = "";
    projectInfoMetaDesc.textContent  = "";
    projectInfoMetaTags.innerHTML    = "";
    projectInfoMetaDate.textContent  = "";

    // Measure the empty panel height (just the padding strip)
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

// ── Populate meta bar ─────────────────────────────────────────
function populateProjectMeta(index) {
    const data = projectData[index];
    if (!data) return;
    projectInfoMetaTitle.textContent = data.title;
    projectInfoMetaDesc.textContent  = data.description;
    projectInfoMetaTags.innerHTML    = data.tags.split("\n").map(t => `<div>${t}</div>`).join("");
    projectInfoMetaDate.textContent  = data.date;
}

// ── Slide click → project page (desktop) ─────────────────────
slides.forEach((slide, index) => {
    slide.addEventListener("click", () => {
        console.log(`[VELAR DEBUG] Slide ${index} clicked (desktop handler) | isDesktop=${isDesktop} | introHasPlayed=${introHasPlayed} | index===currentIndex: ${index===currentIndex} | isAnimating=${isAnimating}`);
        if (!isDesktop || !introHasPlayed || index !== currentIndex || isAnimating) return;
        openProjectPage(index);
    });
});

// ── About overlay ─────────────────────────────────────────────
if (aboutOverlay) {
    gsap.set(aboutOverlay, { yPercent: 100, autoAlpha: 1 });
} else {
}

function openAbout() {
    console.log(`[VELAR DEBUG] openAbout() | isAboutAnimating=${isAboutAnimating}`);
    if (isAboutAnimating) {
 return; }
    isAboutAnimating = true;
    slideObserver.disable();
    if (isDesktop && isProjectPageOpen) projectScrollObserver.disable();
    gsap.to(aboutOverlay, {
        yPercent: 0, duration: 1, ease: "power4.inOut",
        onComplete: () => {
 isAboutAnimating = false; }
    });
}

function closeAbout() {
    console.log(`[VELAR DEBUG] closeAbout() | isAboutAnimating=${isAboutAnimating}`);
    if (isAboutAnimating) {
 return; }
    isAboutAnimating = true;
    gsap.to(aboutOverlay, {
        yPercent: 100, duration: 0.8, ease: "power4.inOut",
        onComplete: () => {
            isAboutAnimating = false;
            if (!isAnimating) {
                if (isProjectPageOpen) projectScrollObserver.enable();
                else slideObserver.enable();
            }
        }
    });
}

// ── Gallery: populate INDEX and CASE grids ─────────────────────
(function initGalleryGrids() {
    const indexImages = [
        { src: "public/medias/BOTANIQUE.png",      title: "LIERAC" },
        { src: "public/medias/PIECES.png",          title: "BA&SH" },
        { src: "public/medias/I_KEPT_MY_NAME.png",  title: "I KEPT MY NAME" },
        { src: "public/medias/TELES.png",           title: "THE MAGIC IS" },
        { src: "public/medias/OVERTHINK.png",       title: "STOP OVERTHINKING" },
        { src: "public/medias/VILLE.png",           title: "RED" },
        { src: "public/medias/SOPARIS.png",         title: "SO/PARIS" },
    ];

    const caseImages = Array.from({ length: 15 }, (_, i) => ({
        src: `public/medias/case/image${i + 1}.jpg`,
        title: null
    }));

    const ratios = ['portrait', 'landscape', 'square'];

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
            const div   = document.createElement('div');
            div.className = `case-item case-item--${ratio}`;
            div.style.gridColumn = String(col);
            const img = document.createElement('img');
            img.src = item.src;
            img.alt = item.title || '';
            img.draggable = false;
            div.appendChild(img);
            if (item.title) {
                const span = document.createElement('span');
                span.className = 'case-item__title';
                span.textContent = item.title;
                div.appendChild(span);
            }
            container.appendChild(div);
        });
    }

    buildGrid('index-grid', indexImages);
    buildGrid('case-grid', caseImages);
})();

// ── Gallery overlay ───────────────────────────────────────────
function openGallery(tab = "index") {
    if (isGalleryAnimating || isGalleryOpen) return;
    isGalleryAnimating = true;
    isGalleryOpen = true;
    switchGalleryTab(tab, false);
    slideObserver.disable();
    gsap.to(galleryOverlay, {
        yPercent: 0, autoAlpha: 1, duration: 0.9, ease: "power4.inOut",
        onComplete: () => { isGalleryAnimating = false; }
    });
}

function closeGallery() {
    if (isGalleryAnimating || !isGalleryOpen) return;
    isGalleryAnimating = true;
    isGalleryOpen = false;
    gsap.to(galleryOverlay, {
        yPercent: 100, duration: 0.7, ease: "power4.inOut",
        onComplete: () => {
            gsap.set(galleryOverlay, { autoAlpha: 0 });
            isGalleryAnimating = false;
            if (!isAnimating) slideObserver.enable();
        }
    });
}

function switchGalleryTab(tab, animate = true) {
    currentGalleryTab = tab;
    // Update tab underlines
    if (tabIndex) tabIndex.classList.toggle("is-active", tab === "index");
    if (tabCase)  tabCase.classList.toggle("is-active",  tab === "case");
    // Logo toujours visible dans la gallery overlay
    if (galleryLogo) galleryLogo.classList.remove("hidden");
    // Switch views
    if (viewIndex) viewIndex.style.display = tab === "index" ? "" : "none";
    if (viewCase)  viewCase.style.display  = tab === "case"  ? "" : "none";
}

// ── Gallery event listeners ───────────────────────────────────
if (galleryOverlay) {
    // Park below viewport initially
    gsap.set(galleryOverlay, { yPercent: 100, autoAlpha: 0 });
}

if (galleryLogo) galleryLogo.addEventListener("click", e => { e.stopPropagation(); closeGallery(); });
if (tabIndex) tabIndex.addEventListener("click", e => { e.stopPropagation(); switchGalleryTab("index"); });
if (tabCase)  tabCase.addEventListener("click",  e => { e.stopPropagation(); switchGalleryTab("case");  });

if (galleryInfoBtn) {
    galleryInfoBtn.addEventListener("click", e => { e.stopPropagation(); openAbout(); });
}

// Click on a CASE item → navigate to that project
document.querySelectorAll(".case-item").forEach(item => {
    item.addEventListener("click", e => {
        e.stopPropagation();
        const projectIndex = parseInt(item.dataset.project, 10);
        if (isNaN(projectIndex)) return;
        closeGallery();
        // Small delay to let gallery close before opening project
        gsap.delayedCall(0.4, () => openProjectPage(projectIndex));
    });
});

// ── Event listeners ───────────────────────────────────────────
if (logoFixed) {
    logoFixed.addEventListener("click", e => { e.stopPropagation();
 openAbout(); });
}

if (aboutBack) {
    aboutBack.addEventListener("click", e => { e.stopPropagation();
 closeAbout(); });
} else {
}

if (navInfo) {
    navInfo.addEventListener("click", e => { e.stopPropagation();
 openAbout(); });
} else {
}

if (navIndexCase) {
    navIndexCase.addEventListener("click", e => {
        e.stopPropagation();
        if (isProjectPageOpen) closeProjectPage();
        else openGallery(currentGalleryTab);
    });
}

if (projectLogoBack) {
    projectLogoBack.addEventListener("click", e => { e.stopPropagation();
 if (isProjectPageOpen) closeProjectPage(); });
}

if (projectMoreBtn) {
    projectMoreBtn.addEventListener("click", e => {
        e.stopPropagation();
        if (isInfoExpanded) closeProjectInfo();
        else openProjectInfo();
    });
}

if (projectInfoBtn) {
    projectInfoBtn.addEventListener("click", e => { e.stopPropagation(); openAbout(); });
}

// ── Email: built at runtime — never a static address in HTML ─
// PERMANENT FIX for Cloudflare obfuscation:
//   Cloudflare Dashboard → Scrape Shield → Email Address Obfuscation → OFF
//
// This code also handles the case where CF already rewrote the DOM
// before this script ran (CF injects its own __cf_email__ span).
(function setupEmail() {
    const part1 = "hello";
    const at    = String.fromCharCode(64);
    const part2 = "velar-studio.com";
    const full  = part1 + at + part2;

    // Nuke whatever Cloudflare put in the about-footer first link position
    const footer = document.querySelector(".about-footer");
    if (!footer) {
 return; }

    // Remove every child that is NOT the instagram link
    Array.from(footer.children).forEach(child => {
        if (!child.href || !child.href.includes("instagram")) {
            footer.removeChild(child);
        }
    });

    // Build our clean span from scratch
    const emailSpan = document.createElement("span");
    emailSpan.className = "contact-link";
    emailSpan.style.cursor = "pointer";
    emailSpan.textContent = full + " \u2197";

    emailSpan.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = "mai" + "lto:" + full;
    });

    // Insert before the instagram link
    footer.insertBefore(emailSpan, footer.firstElementChild);
})();

// ── Resize ────────────────────────────────────────────────────
window.addEventListener("resize", () => {
    const wasDesktop = isDesktop;
    isDesktop = window.innerWidth >= 768;
    if (wasDesktop !== isDesktop) { location.reload(); return; }
    if (isDesktop && isProjectPageOpen) snapTrackToIndex(projectCurrentIndex, false);
});

// ── Init ──────────────────────────────────────────────────────
window.addEventListener("load", () => {

    if (isDesktop) initDesktopProjectPage();
    setTimeout(() => {
        console.log("[VELAR DEBUG] setTimeout fired → runIntroAnimation()");
        runIntroAnimation();
    }, 100);
});