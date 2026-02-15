gsap.registerPlugin(Observer);

const slides = document.querySelectorAll(".slide");
const logoFixed = document.querySelector(".logo-fixed");
const aboutOverlay = document.querySelector(".about-overlay");
const aboutBack = document.querySelector(".about-back");

let currentIndex = 0;
let isAnimating = true;
let introHasPlayed = false;

const loader = document.querySelector(".loader");

const loaderSnapshot = document.createElement("div");
loaderSnapshot.className = "loader-snapshot";
loader.appendChild(loaderSnapshot);

function setLoaderSnapshotFromSlide(slideEl) {
    loaderSnapshot.innerHTML = "";
    loaderSnapshot.style.backgroundImage = "";
  
    const video = slideEl.querySelector("video");
    const poster = video?.getAttribute("poster");

    if (poster) {
      loaderSnapshot.style.backgroundImage = `url(${poster})`;
      return;
    }

    if (video && video.readyState >= 2 && video.videoWidth) {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        loaderSnapshot.style.backgroundImage = `url(${canvas.toDataURL("image/jpeg", 0.92)})`;
        return;
      } catch (e) {}
    }

    loaderSnapshot.style.backgroundImage = "";
  }

  function toggleVideo(index) {
    const slide = slides[index];
    const videos = slide.querySelectorAll("video");
    
    if (!videos.length) return;
    const isVideoPaused = videos[0].paused;
    
    if (isVideoPaused) {
        slide.classList.add("is-playing");
        videos.forEach(v => {
            const playPromise = v.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => console.log("Erreur lecture auto:", e));
            }
        });
    } else {
        slide.classList.remove("is-playing");
        videos.forEach(v => v.pause());
    }
}

slides.forEach((slide, index) => {
    slide.addEventListener("click", () => {
        if (index === currentIndex && !isAnimating && introHasPlayed) {
            toggleVideo(index);
        }
    });
});

function gotoSlide(index, direction) {
    if (isAnimating) return;
    isAnimating = true;

    let currentSlide = slides[currentIndex];
    let nextSlide = slides[index];

    currentSlide.classList.remove("is-playing");
    const currentVideos = currentSlide.querySelectorAll("video");
    currentVideos.forEach(v => {
        v.pause();
        v.load();
    });

    let yPercentNext = direction === "down" ? 100 : -100;
    nextSlide.classList.remove("is-playing");

    gsap.set(nextSlide, { 
        visibility: "visible", 
        zIndex: 2, 
        autoAlpha: 1,
        yPercent: yPercentNext 
    });
    gsap.set(currentSlide, { zIndex: 1 });

    let tl = gsap.timeline({
        onComplete: () => {
            isAnimating = false;
            gsap.set(currentSlide, { visibility: "hidden", autoAlpha: 0, yPercent: 0 });
        }
    });

    tl.to(nextSlide, {
        yPercent: 0,
        duration: 1,
        ease: "power4.inOut"
    })
    .fromTo([nextSlide.querySelector(".title"), nextSlide.querySelector(".play-button"), nextSlide.querySelector(".logo")], 
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.2, ease: "power2.out" }, 
        "-=0.5" 
    );

    currentIndex = index;
}

const slideObserver = Observer.create({
    type: "wheel,touch",
    wheelSpeed: -1,
    ignore: ".logo-fixed, .about-back, button, a", 
    onDown: () => {
        if (!isAnimating) {
            let nextIndex = currentIndex - 1;
            if (nextIndex < 0) nextIndex = slides.length - 1;
            gotoSlide(nextIndex, "up");
        }
    },
    onUp: () => {
        if (!isAnimating) {
            let nextIndex = currentIndex + 1;
            if (nextIndex >= slides.length) nextIndex = 0;
            gotoSlide(nextIndex, "down");
        }
    },
    tolerance: 10,
    preventDefault: false
});
slideObserver.disable();

function runIntroAnimation() {
    if (introHasPlayed) return;
    introHasPlayed = true;

    gsap.set(".loader", { 
        backgroundColor: "transparent",
        yPercent: 0, 
        y: 0,
        force3D: true
    });
    
    gsap.set(".motion-blur-overlay", {
        yPercent: 0, 
        force3D: true
    });

    const totalLoops = 6; 
    const duration = 3;

    const easing = "power1.out"; 

    let proxy = { frame: 0 };
    let totalFrames = slides.length * totalLoops - 1;
    let lastIndex = -1;

    gsap.set(slides, { zIndex: 1, autoAlpha: 0, scale: 1 });

    gsap.fromTo(".motion-blur-overlay", 
        {
            backdropFilter: "blur(20px)",
            webkitBackdropFilter: "blur(30px)",
            yPercent: 0
        },
        { 
            backdropFilter: "blur(0px)", 
            webkitBackdropFilter: "blur(0px)", 
            duration: duration, 
            ease: easing 
        }
    );

    gsap.fromTo(".slides-container", 
        { scaleY: 1.15 }, 
        { scaleY: 1, duration: duration, ease: easing }
    );

    gsap.to(proxy, {
        frame: totalFrames,
        duration: duration,
        ease: easing, 
        
        onUpdate: () => {
            let index = Math.floor(proxy.frame) % slides.length;
            if (index !== lastIndex) {
                gsap.set(slides[index], { zIndex: 10, autoAlpha: 1, scale: 1, overwrite: true });
                if (lastIndex >= 0 && lastIndex !== index) {
                    gsap.set(slides[lastIndex], { zIndex: 1, autoAlpha: 0 }); 
                }
                lastIndex = index;
            }
        },
        onComplete: () => {
            const firstSlide = slides[0];
            const loaderEl = document.querySelector(".loader");
            const snapshotEl = document.querySelector(".loader-snapshot");
            const slidesContainer = document.querySelector(".slides-container");

            gsap.set(slides, { zIndex: 1, autoAlpha: 1, scale: 1 });

            const lastSlideIndex = slides.length - 1;

            gsap.set(slides[lastSlideIndex], {
                visibility: "visible",
                yPercent: -100,
                zIndex: 1
            });

            gsap.set(firstSlide, {
                visibility: "visible",
                yPercent: 0,
                zIndex: 2
            });

            gsap.set(slides[1], {
                visibility: "visible",
                yPercent: 100,
                zIndex: 1
            });

            for (let i = 2; i < lastSlideIndex; i++) {
                gsap.set(slides[i], { autoAlpha: 0 });
            }

            gsap.set(loaderEl, { display: "none", opacity: 0 });
            gsap.set(snapshotEl, { display: "none" });

            let pressTl = gsap.timeline({
                onComplete: () => {
                    gsap.set(slidesContainer, { scale: 1 });
                    gsap.set(slides, { yPercent: 0, zIndex: 1, autoAlpha: 0 });
                    gsap.set(firstSlide, { zIndex: 2, autoAlpha: 1, yPercent: 0 });
                    
                    isAnimating = false;
                    slideObserver.enable();
                    currentIndex = 0;
                }
            });

            pressTl
                .to(slidesContainer, {
                    scale: 0.8,
                    duration: 1,
                    ease: "power3.inOut"
                })
                .to(slidesContainer, {
                    scale: 1,
                    duration: 0.6,
                    ease: "power3.out"
                })
                .fromTo(
                    firstSlide.querySelector(".title"),
                    { y: 50, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
                    "-=0.6"
                );
        
            if (logoFixed) gsap.to(logoFixed, { autoAlpha: 1, duration: 0.5 });
        }
    });
}

if (aboutOverlay) { gsap.set(aboutOverlay, { yPercent: 100, autoAlpha: 1, display: "block" }); }
function openAbout() { if (isAnimating) return; isAnimating = true; slideObserver.disable(); gsap.to(aboutOverlay, { yPercent: 0, duration: 1, ease: "power4.inOut", onComplete: () => { isAnimating = false; } }); }
function closeAbout() { if (isAnimating) return; isAnimating = true; gsap.to(aboutOverlay, { yPercent: 100, duration: 0.8, ease: "power4.inOut", onComplete: () => { isAnimating = false; slideObserver.enable(); } }); }
if (logoFixed) logoFixed.addEventListener("click", (e) => { e.stopPropagation(); openAbout(); });
if (aboutBack) aboutBack.addEventListener("click", (e) => { e.stopPropagation(); closeAbout(); });

window.addEventListener("load", () => {
    setTimeout(runIntroAnimation, 100);
});