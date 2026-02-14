gsap.registerPlugin(Observer);

const slides = document.querySelectorAll(".slide");
const logoFixed = document.querySelector(".logo-fixed");
const aboutOverlay = document.querySelector(".about-overlay");
const aboutBack = document.querySelector(".about-back");

let currentIndex = 0;
let isAnimating = true;
let introHasPlayed = false;

function gotoSlide(index, direction) {
    if (isAnimating) return;
    isAnimating = true;

    let currentSlide = slides[currentIndex];
    let nextSlide = slides[index];

    let yPercentCurrent = direction === "down" ? -100 : 100;
    let yPercentNext = direction === "down" ? 100 : -100;

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
    .fromTo([nextSlide.querySelector(".title"), nextSlide.querySelector(".logo")], 
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.2, ease: "power2.out" }, 
        "-=0.5"
    );

    currentIndex = index;
}

const slideObserver = Observer.create({
    type: "wheel,touch,pointer",
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
    preventDefault: true 
});

slideObserver.disable();

function runIntroAnimation() {
    if (introHasPlayed) return;
    introHasPlayed = true;
    gsap.set(".loader", { display: "none" });

    const totalLoops = 5; 
    const duration = 2.5; 
    let proxy = { frame: 0 };
    let totalFrames = slides.length * totalLoops;
    let lastIndex = -1;

    gsap.set(slides, { zIndex: 1, autoAlpha: 0, scale: 1 });

    gsap.to(proxy, {
        frame: totalFrames,
        duration: duration,
        ease: "circ.out",
        onUpdate: () => {
            let index = Math.floor(proxy.frame) % slides.length;
            
            if (index !== lastIndex) {
                gsap.set(slides[index], { 
                    zIndex: 10,       
                    autoAlpha: 1,     
                    scale: 1.05,
                    overwrite: true 
                });

                if (lastIndex >= 0 && lastIndex !== index) {
                    gsap.set(slides[lastIndex], { zIndex: 5 }); 
                    gsap.to(slides[lastIndex], { 
                        autoAlpha: 0, 
                        scale: 1,
                        duration: 0.5, 
                        overwrite: "auto" 
                    });
                }
                lastIndex = index;
            }
        },
        onComplete: () => {
            gsap.killTweensOf(slides);

            gsap.set(slides, { zIndex: 1, autoAlpha: 0, scale: 1, clearProps: "transform" });

            const firstSlide = slides[0];
            gsap.set(firstSlide, {
                zIndex: 2,
                autoAlpha: 1
            });

            currentIndex = 0;
            isAnimating = false; 
            slideObserver.enable();

            const title = firstSlide.querySelector(".title");
            if (title) {
                gsap.fromTo(title, 
                    { y: 50, opacity: 0 },
                    { y: 0, opacity: 1, duration: 1, ease: "power2.out" }
                );
            }
        }
    });
}

if (aboutOverlay) {
    gsap.set(aboutOverlay, { yPercent: 100, autoAlpha: 1, display: "block" });
}

function openAbout() {
    if (isAnimating) return;
    isAnimating = true; 
    slideObserver.disable();

    gsap.to(aboutOverlay, { 
        yPercent: 0, 
        duration: 1, 
        ease: "power4.inOut",
        onComplete: () => { isAnimating = false; }
    });
}

function closeAbout() {
    if (isAnimating) return;
    isAnimating = true;

    gsap.to(aboutOverlay, {
        yPercent: 100,
        duration: 0.8,
        ease: "power4.inOut",
        onComplete: () => {
            isAnimating = false;
            slideObserver.enable();
        }
    });
}

if (logoFixed) logoFixed.addEventListener("click", (e) => { e.stopPropagation(); openAbout(); });
if (aboutBack) aboutBack.addEventListener("click", (e) => { e.stopPropagation(); closeAbout(); });

function checkVideoStatus() {
    const videos = document.querySelectorAll("video");
    let loadedVideos = 0;

    if (videos.length === 0) {
        runIntroAnimation();
        return;
    }

    function checkIfAllReady() {
        if (loadedVideos === videos.length) {
            setTimeout(() => {
                runIntroAnimation();
            }, 500);
        }
    }

    videos.forEach(video => {
        if (video.readyState >= 3) { 
            loadedVideos++;
            checkIfAllReady();
        } else {
            video.addEventListener('canplaythrough', () => {
                loadedVideos++;
                checkIfAllReady();
            }, { once: true });
            video.load(); 
        }
    });

    setTimeout(() => {
        if (!introHasPlayed) {
             runIntroAnimation();
        }
    }, 5000);
}

document.addEventListener("DOMContentLoaded", checkVideoStatus);