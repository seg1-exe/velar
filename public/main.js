gsap.registerPlugin(Observer);

const slides = document.querySelectorAll(".slide");
const logoFixed = document.querySelector(".logo-fixed");
const aboutOverlay = document.querySelector(".about-overlay");
const aboutBack = document.querySelector(".about-back");

let currentIndex = 0;
let isAnimating = true; // Bloqué au démarrage
let introHasPlayed = false; 

// --- 1. GESTION DU CLIC (PLAY/PAUSE) ---
function toggleVideo(index) {
    const slide = slides[index];
    const videos = slide.querySelectorAll("video");
    
    // Si la slide joue déjà, on ne fait rien (ou on peut mettre pause si tu préfères)
    if (slide.classList.contains("is-playing")) return;

    // On lance la lecture
    slide.classList.add("is-playing");
    videos.forEach(v => v.play());
}

// Ajout des écouteurs sur chaque slide
slides.forEach((slide, index) => {
    slide.addEventListener("click", () => {
        // On ne permet le clic que si c'est la slide active et que l'intro est finie
        if (index === currentIndex && !isAnimating && introHasPlayed) {
            toggleVideo(index);
        }
    });
});

// --- 2. FONCTION DE CHANGEMENT DE SLIDE (SCROLL) ---
function gotoSlide(index, direction) {
    if (isAnimating) return;
    isAnimating = true;

    let currentSlide = slides[currentIndex];
    let nextSlide = slides[index];

    // A. RESET DE L'ANCIENNE SLIDE (Arrêt vidéo + Retour Poster)
    // On retire la classe is-playing pour réafficher le bouton Play
    currentSlide.classList.remove("is-playing");
    const currentVideos = currentSlide.querySelectorAll("video");
    currentVideos.forEach(v => {
        v.pause();
        v.load(); // On rembobine pour la prochaine fois
    });

    // Sens du mouvement
    let yPercentCurrent = direction === "down" ? -100 : 100;
    let yPercentNext = direction === "down" ? 100 : -100;

    // B. PRÉPARATION DE LA NOUVELLE
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

// --- 3. OBSERVER (SCROLL) ---
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

    // --- CONFIGURATION ---
    const totalLoops = 6; // Beaucoup de tours pour avoir de la vitesse au début
    const duration = 3;  // Durée plus longue pour apprécier le freinage
    const easing = "power1.out"; // Départ explosif, freinage très long et doux

    let proxy = { frame: 0 };
    let totalFrames = slides.length * totalLoops;
    let lastIndex = -1;

    // État initial
    gsap.set(slides, { zIndex: 1, autoAlpha: 0, scale: 1 });

    // --- A. ANIMATION DU FLOU & ÉTIREMENT (Sync avec la vitesse) ---
    
    // 1. Le Flou : Part de 30px (très flou) et arrive à 0px (net)
    // On utilise la même durée et le même easing que la roulette pour que ce soit cohérent.
    gsap.fromTo(".motion-blur-overlay", 
        { 
            backdropFilter: "blur(30px)", 
            webkitBackdropFilter: "blur(30px)" 
        },
        {
            backdropFilter: "blur(0px)",
            webkitBackdropFilter: "blur(0px)",
            duration: duration,
            ease: easing
        }
    );

    // 2. L'Étirement (Stretch) : Pour accentuer la vitesse au début
    // On étire l'image verticalement (scaleY) puis on revient à la normale
    gsap.fromTo(".slides-container", 
        { scaleY: 1.15 }, // Étiré de 15% au début
        { 
            scaleY: 1,    // Normal à la fin
            duration: duration, 
            ease: easing 
        }
    );

    // --- B. LA ROULETTE (DÉCÉLÉRATION) ---
    gsap.to(proxy, {
        frame: totalFrames,
        duration: duration,
        ease: easing, // C'est ici que se joue l'effet "Slow Down"
        
        onUpdate: () => {
            let index = Math.floor(proxy.frame) % slides.length;
            
            if (index !== lastIndex) {
                // Affichage net (le flou est géré par l'overlay)
                gsap.set(slides[index], { zIndex: 10, autoAlpha: 1, scale: 1, overwrite: true });
                
                // Masquage du précédent
                if (lastIndex >= 0 && lastIndex !== index) {
                    gsap.set(slides[lastIndex], { zIndex: 1, autoAlpha: 0 }); 
                }
                lastIndex = index;
            }
        },
        onComplete: () => {
            // --- C. NETTOYAGE & DÉVERROUILLAGE ---
            
            gsap.killTweensOf(slides);
            gsap.set(slides, { zIndex: 1, autoAlpha: 0, scale: 1 });
            
            // Affichage Slide 1
            const firstSlide = slides[0];
            gsap.set(firstSlide, { zIndex: 2, autoAlpha: 1 });

            currentIndex = 0;
            isAnimating = false; 
            slideObserver.enable();

            // Anim Titre & Bouton Play (Apparition douce)
            const elementsToAnimate = firstSlide.querySelectorAll(".title, .play-button");
            if (elementsToAnimate.length > 0) {
                gsap.fromTo(elementsToAnimate, 
                    { y: 30, opacity: 0 },
                    { y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: "power2.out" }
                );
            }
        }
    });
}

// --- 5. LOGIQUE ABOUT ---
if (aboutOverlay) { gsap.set(aboutOverlay, { yPercent: 100, autoAlpha: 1, display: "block" }); }
function openAbout() { if (isAnimating) return; isAnimating = true; slideObserver.disable(); gsap.to(aboutOverlay, { yPercent: 0, duration: 1, ease: "power4.inOut", onComplete: () => { isAnimating = false; } }); }
function closeAbout() { if (isAnimating) return; isAnimating = true; gsap.to(aboutOverlay, { yPercent: 100, duration: 0.8, ease: "power4.inOut", onComplete: () => { isAnimating = false; slideObserver.enable(); } }); }
if (logoFixed) logoFixed.addEventListener("click", (e) => { e.stopPropagation(); openAbout(); });
if (aboutBack) aboutBack.addEventListener("click", (e) => { e.stopPropagation(); closeAbout(); });

// --- 6. CHARGEMENT SIMPLE ---
// Plus besoin de vérifier le chargement des vidéos, on attend juste que le DOM et les images soient là
window.addEventListener("load", () => {
    setTimeout(runIntroAnimation, 100);
});