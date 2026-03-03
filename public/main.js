gsap.registerPlugin(Observer);

const slides              = document.querySelectorAll(".slide");
const logoFixed           = document.querySelector(".logo-fixed");
const aboutOverlay        = document.querySelector(".about-overlay");
const aboutBack           = document.querySelector(".about-back");

const desktopNav          = document.querySelector(".desktop-nav");
const desktopNavLogo      = document.querySelector(".desktop-nav__logo");
const desktopNavTitle     = document.querySelector(".desktop-nav__project-title");
const navIndexCase        = document.getElementById("nav-index-case");
const navInfo             = document.getElementById("nav-info");

const galleryOverlay      = document.getElementById("gallery-overlay");
const galleryLogo         = document.getElementById("gallery-logo");
const tabIndex            = document.getElementById("tab-index");
const tabCase             = document.getElementById("tab-case");
const viewIndex           = document.getElementById("view-index");
const viewCase            = document.getElementById("view-case");
const galleryInfoBtn      = document.getElementById("gallery-info-btn");

let isGalleryOpen         = false;
let isGalleryAnimating    = false;
let currentGalleryTab     = "index";

const projectPage         = document.getElementById("project-page");
const projectLogoBack     = document.getElementById("project-logo-back");
const projectMoreBtn      = document.getElementById("project-more-btn");
const projectInfoBtn      = document.getElementById("project-info-btn");
const projectTrack        = document.getElementById("project-track");
const projectInfoPanel    = document.getElementById("project-info-panel");
const projectInfoMediaRow = document.getElementById("project-info-media-row");
const projectInfoMetaTitle = document.getElementById("project-info-meta-title");
const projectInfoMetaDesc  = document.getElementById("project-info-meta-desc");
const projectInfoMetaTags  = document.getElementById("project-info-meta-tags");
const projectInfoMetaDate  = document.getElementById("project-info-meta-date");

let currentIndex             = 0;
let isAnimating              = true;
let introHasPlayed           = false;
let isDesktop                = window.innerWidth >= 768;

let projectCurrentIndex      = 0;
let isProjectPageOpen        = false;
let isProjectAnimating       = false;
let isProjectScrollAnimating = false;

let isAboutAnimating         = false;

const projectData = [
    { title: "LIERAC",          description: "A botanical journey into the heart of LIERAC's serum. We crafted a visual narrative around transparency, purity, and the living intelligence of plants.", tags: "CGI\nAI\nArt Direction",                                    date: "2024" },
    { title: "BA&SH",           description: "Pieces that move. A social-first campaign celebrating freedom of expression through garments that live and breathe on screen.",                          tags: "Narrative Production\nSocial-First Content\nPost Production", date: "2024" },
    { title: "I KEPT MY NAME",  description: "Identity as resistance. A film exploring what it means to hold onto yourself when the world tries to rename you.",                                      tags: "Narrative Production\nArt Direction\nPost Production",         date: "2023" },
    { title: "THE MAGIC IS",    description: "The invisible made tangible. A campaign built around the sensation of transformation—before and after the moment that changes everything.",             tags: "CGI\nMotion Design\nArt Direction",                            date: "2023" },
    { title: "STOP OVERTHINKING", description: "A manifesto in motion. Structured chaos, interrupted thoughts, and the beauty of letting go—translated into a visual language for a new generation.", tags: "Social-First Content\nMotion Design\nAI",                      date: "2024" },
    { title: "RED",             description: "Paris at night, reimagined. A city that pulses with desire, tension, and color—captured in a campaign that refuses to be quiet.",                      tags: "Narrative Production\nPost Production\nArt Direction",         date: "2024" },
    { title: "SO/PARIS",        description: "Luxury hospitality seen through a new lens. An experience campaign that blurs the line between a hotel stay and a state of mind.",                     tags: "CGI\nArt Direction\nPost Production",                          date: "2023" }
];

const loader = document.querySelector(".loader");
const loaderSnapshot = document.createElement("div");
loaderSnapshot.className = "loader-snapshot";
loader.appendChild(loaderSnapshot);

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

function gotoSlide(index, direction) {
    if (isAnimating) return;
    isAnimating = true;

    const currentSlide = slides[currentIndex];
    const nextSlide    = slides[index];

    currentSlide.classList.remove("is-playing");
    currentSlide.querySelectorAll("video").forEach(v => { v.pause(); v.load(); });

    gsap.set(nextSlide,    { visibility: "visible", zIndex: 2, autoAlpha: 1, yPercent: direction === "down" ? 100 : -100 });
    gsap.set(currentSlide, { zIndex: 1 });

    updateDesktopNavTitle(index);

    const nextTitle = !isDesktop ? nextSlide.querySelector(".title") : null;
    if (nextTitle) gsap.set(nextTitle, { opacity: 0, y: -15 });

    gsap.timeline({
        onComplete: () => {
            gsap.set(currentSlide, { visibility: "hidden", autoAlpha: 0, yPercent: 0 });
            if (nextTitle) gsap.to(nextTitle, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" });
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

let slideGestureActive  = false;
let slideGestureTimer   = null;

function onSlideScroll(direction) {
    if (!slideGestureActive) {
        slideGestureActive = true;
        if (!isAnimating) {
            direction > 0
                ? gotoSlide(currentIndex + 1 >= slides.length ? 0 : currentIndex + 1, "down")
                : gotoSlide(currentIndex - 1 < 0 ? slides.length - 1 : currentIndex - 1, "up");
        }
    }
    clearTimeout(slideGestureTimer);
    slideGestureTimer = setTimeout(() => { slideGestureActive = false; }, 200);
}

const slideObserver = Observer.create({
    type: "wheel,touch",
    wheelSpeed: -1,
    lockAxis: true,
    ignore: ".desktop-nav, .about-overlay, button, a",
    onDown:  () => onSlideScroll(-1),
    onUp:    () => onSlideScroll(+1),
    onRight: () => { if (!isDesktop) openGallery("case"); },
    tolerance: 10,
    preventDefault: false
});
slideObserver.disable();

function runIntroAnimation() {
    if (introHasPlayed) return;
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

            const pressTl = gsap.timeline({
                onComplete: () => {
                    gsap.set(slidesContainer, { scale: 1 });
                    gsap.set(slides,     { yPercent: 0, zIndex: 1, autoAlpha: 0 });
                    gsap.set(firstSlide, { zIndex: 2, autoAlpha: 1, yPercent: 0 });

                    isAnimating = false;
                    slideObserver.enable();
                    currentIndex = 0;
                    updateDesktopNavTitle(0);

                    if (isDesktop && desktopNav) gsap.to(desktopNav, { autoAlpha: 1, duration: 0.5 });
                    if (!isDesktop && logoFixed)  gsap.to(logoFixed,  { autoAlpha: 1, duration: 0.5 });

                    if (!isDesktop) {
                        const firstTitle = firstSlide.querySelector(".title");
                        if (firstTitle) gsap.fromTo(firstTitle, { opacity: 0, y: -15 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", delay: 0.2 });
                    }
                }
            });

            pressTl
                .to(slidesContainer, { scale: 0.8, duration: 1,   ease: "power3.inOut" })
                .to(slidesContainer, { scale: 1,   duration: 0.6, ease: "power3.out"   });
        }
    });
}

function initDesktopProjectPage() {
    if (!projectPage) return;
    gsap.set(projectPage, { autoAlpha: 1, yPercent: 100 });
    gsap.set(desktopNav,  { autoAlpha: 0 });
}

function openProjectPage(startIndex) {
    if (!isDesktop || isProjectAnimating || isProjectPageOpen) return;
    isProjectAnimating = true;

    projectCurrentIndex = startIndex;
    snapTrackToIndex(startIndex, false);

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

function snapTrackToIndex(index, animate) {
    const x = -(index * window.innerWidth);
    if (animate) {
        gsap.to(projectTrack,  { x, duration: 1, ease: "power4.inOut" });
    } else {
        gsap.set(projectTrack, { x });
    }
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

let projGestureActive = false;
let projGestureTimer  = null;

function onProjectScroll(direction) {
    if (!projGestureActive) {
        projGestureActive = true;
        goToProjectIndex(projectCurrentIndex + direction);
    }
    clearTimeout(projGestureTimer);
    projGestureTimer = setTimeout(() => { projGestureActive = false; }, 200);
}

const projectScrollObserver = Observer.create({
    target: projectPage,
    type: "wheel,touch",
    wheelSpeed: -1,
    lockAxis: true,
    onUp:    () => onProjectScroll(+1),
    onDown:  () => onProjectScroll(-1),
    onLeft:  () => onProjectScroll(+1),
    onRight: () => onProjectScroll(-1),
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

slides.forEach((slide, index) => {
    slide.addEventListener("click", () => {
        if (!isDesktop || !introHasPlayed || index !== currentIndex || isAnimating) return;
        openProjectPage(index);
    });
});

if (aboutOverlay) gsap.set(aboutOverlay, { yPercent: 100, autoAlpha: 1 });

function openAbout() {
    if (isAboutAnimating) return;
    isAboutAnimating = true;
    slideObserver.disable();
    if (isDesktop && isProjectPageOpen) projectScrollObserver.disable();
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
            if (!isAnimating) {
                if (isProjectPageOpen) projectScrollObserver.enable();
                else slideObserver.enable();
            }
        }
    });
}

(function initGalleryGrids() {
    const indexImages = [
        { src: "medias/BOTANIQUE.png",      title: "LIERAC" },
        { src: "medias/PIECES.png",          title: "BA&SH" },
        { src: "medias/I_KEPT_MY_NAME.png",  title: "I KEPT MY NAME" },
        { src: "medias/TELES.png",           title: "THE MAGIC IS" },
        { src: "medias/OVERTHINK.png",       title: "STOP OVERTHINKING" },
        { src: "medias/VILLE.png",           title: "RED" },
        { src: "medias/SOPARIS.png",         title: "SO/PARIS" },
    ];

    const caseImages = Array.from({ length: 15 }, (_, i) => ({
        src: `medias/case/image${i + 1}.jpg`,
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

function switchGalleryTab(tab) {
    currentGalleryTab = tab;
    if (tabIndex) tabIndex.classList.toggle("is-active", tab === "index");
    if (tabCase)  tabCase.classList.toggle("is-active",  tab === "case");
    if (galleryLogo) galleryLogo.classList.remove("hidden");
    if (viewIndex) viewIndex.style.display = tab === "index" ? "" : "none";
    if (viewCase)  viewCase.style.display  = tab === "case"  ? "" : "none";
}

if (galleryOverlay) gsap.set(galleryOverlay, { yPercent: 100, autoAlpha: 0 });

if (galleryLogo)   galleryLogo.addEventListener("click",   e => { e.stopPropagation(); closeGallery(); });
if (tabIndex)      tabIndex.addEventListener("click",      e => { e.stopPropagation(); switchGalleryTab("index"); });
if (tabCase)       tabCase.addEventListener("click",       e => { e.stopPropagation(); switchGalleryTab("case"); });
if (galleryInfoBtn) galleryInfoBtn.addEventListener("click", e => { e.stopPropagation(); openAbout(); });

if (galleryOverlay) {
    Observer.create({
        target: galleryOverlay,
        type: "touch",
        lockAxis: true,
        onLeft: () => { if (!isDesktop) closeGallery(); },
        tolerance: 20,
        preventDefault: false
    });
}

document.querySelectorAll(".case-item").forEach(item => {
    item.addEventListener("click", e => {
        e.stopPropagation();
        const projectIndex = parseInt(item.dataset.project, 10);
        if (isNaN(projectIndex)) return;
        closeGallery();
        gsap.delayedCall(0.4, () => openProjectPage(projectIndex));
    });
});

if (logoFixed)       logoFixed.addEventListener("click",       e => { e.stopPropagation(); openAbout(); });
if (aboutBack)       aboutBack.addEventListener("click",       e => { e.stopPropagation(); closeAbout(); });
if (navInfo)         navInfo.addEventListener("click",         e => { e.stopPropagation(); openAbout(); });
if (projectInfoBtn)  projectInfoBtn.addEventListener("click",  e => { e.stopPropagation(); openAbout(); });

if (navIndexCase) {
    navIndexCase.addEventListener("click", e => {
        e.stopPropagation();
        if (isProjectPageOpen) closeProjectPage();
        else openGallery(currentGalleryTab);
    });
}

if (projectLogoBack) {
    projectLogoBack.addEventListener("click", e => { e.stopPropagation(); if (isProjectPageOpen) closeProjectPage(); });
}

if (projectMoreBtn) {
    projectMoreBtn.addEventListener("click", e => {
        e.stopPropagation();
        if (isInfoExpanded) closeProjectInfo();
        else openProjectInfo();
    });
}

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
    emailSpan.className = "contact-link";
    emailSpan.style.cursor = "pointer";
    emailSpan.textContent = full + " \u2197";

    emailSpan.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = "mai" + "lto:" + full;
    });

    footer.insertBefore(emailSpan, footer.firstElementChild);
})();

window.addEventListener("resize", () => {
    const wasDesktop = isDesktop;
    isDesktop = window.innerWidth >= 768;
    if (wasDesktop !== isDesktop) { location.reload(); return; }
    if (isDesktop && isProjectPageOpen) snapTrackToIndex(projectCurrentIndex, false);
});

window.addEventListener("load", () => {
    if (isDesktop) initDesktopProjectPage();
    setTimeout(runIntroAnimation, 100);
});