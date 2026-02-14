gsap.registerPlugin(Observer);

const slides = document.querySelectorAll(".slide");
const logoFixed = document.querySelector(".logo-fixed");
const aboutOverlay = document.querySelector(".about-overlay");
const aboutBack = document.querySelector(".about-back");

let currentIndex = 0;
let isAnimating = true; // Bloqué au démarrage
let introHasPlayed = false; 

const loader = document.querySelector(".loader");

// Calque qui va afficher "la dernière image" à la place du noir
const loaderSnapshot = document.createElement("div");
loaderSnapshot.className = "loader-snapshot";
loader.appendChild(loaderSnapshot);

function setLoaderSnapshotFromSlide(slideEl) {
    loaderSnapshot.innerHTML = "";
    loaderSnapshot.style.backgroundImage = "";
  
    const video = slideEl.querySelector("video");
    const poster = video?.getAttribute("poster");
  
    // 1) Poster (fiable pendant la roulette)
    if (poster) {
      loaderSnapshot.style.backgroundImage = `url(${poster})`;
      return;
    }
  
    // 2) Sinon seulement : tentative de capture frame si possible
    if (video && video.readyState >= 2 && video.videoWidth) {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        loaderSnapshot.style.backgroundImage = `url(${canvas.toDataURL("image/jpeg", 0.92)})`;
        return;
      } catch (e) {
        console.warn("Snapshot vidéo impossible (CORS / export canvas).", e);
      }
    }
  
    // 3) fallback noir
    loaderSnapshot.style.backgroundImage = "";
  }

// --- 1. GESTION DU CLIC (PLAY/PAUSE) ---
function toggleVideo(index) {
    const slide = slides[index];
    const videos = slide.querySelectorAll("video");
    
    if (slide.classList.contains("is-playing")) return;

    // On lance la lecture
    slide.classList.add("is-playing");
    videos.forEach(v => {
        // Petite sécurité : play() renvoie une promesse, on attrape l'erreur si le chargement n'est pas fini
        const playPromise = v.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log("Lecture empêchée (attente chargement ou interaction):", error);
            });
        }
    });
}

// Ajout des écouteurs sur chaque slide
slides.forEach((slide, index) => {
    slide.addEventListener("click", () => {
        // On vérifie les conditions
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

    // A. RESET DE L'ANCIENNE SLIDE
    currentSlide.classList.remove("is-playing");
    const currentVideos = currentSlide.querySelectorAll("video");
    currentVideos.forEach(v => {
        v.pause();
        v.load(); // Retour au poster
    });

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
    // C'EST ICI LA CORRECTION PRINCIPALE 👇
    preventDefault: false // On laisse le navigateur gérer le clic, sinon il l'intercepte
});
slideObserver.disable();

function runIntroAnimation() {
    if (introHasPlayed) return;
    introHasPlayed = true;

    console.log("Démarrage Intro...");

    // 1. PRÉPARATION
    // On enlève juste la couleur noire pour voir à travers, 
    // mais on garde la div ".loader" présente (display: block) pour pouvoir l'animer à la fin.
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

    // --- CONFIGURATION ---
    const totalLoops = 6; 
    const duration = 3;  
    
    // Ton choix : power1.out (Rapide et sec) pour la roulette
    const easing = "power1.out"; 

    let proxy = { frame: 0 };
    let totalFrames = slides.length * totalLoops - 1;
    let lastIndex = -1;

    // État initial des slides
    gsap.set(slides, { zIndex: 1, autoAlpha: 0, scale: 1 });

    // --- A. ANIMATION DU FLOU (SYNCHRONISÉE) ---
    // Le flou diminue de 30px à 0px PENDANT que ça tourne.
    gsap.fromTo(".motion-blur-overlay", 
        { 
            backdropFilter: "blur(20px)", 
            webkitBackdropFilter: "blur(30px)",
            yPercent: 0 // On s'assure qu'il est bien à sa place
        },
        { 
            backdropFilter: "blur(0px)", 
            webkitBackdropFilter: "blur(0px)", 
            duration: duration, 
            ease: easing 
        }
    );

    // L'étirement (Stretch)
    gsap.fromTo(".slides-container", 
        { scaleY: 1.15 }, 
        { scaleY: 1, duration: duration, ease: easing }
    );

    // --- B. LA ROULETTE ---
    gsap.to(proxy, {
        frame: totalFrames,
        duration: duration,
        ease: easing, 
        
        onUpdate: () => {
            let index = Math.floor(proxy.frame) % slides.length;
            if (index !== lastIndex) {
                // Affichage net
                gsap.set(slides[index], { zIndex: 10, autoAlpha: 1, scale: 1, overwrite: true });
                // Masquage du précédent
                if (lastIndex >= 0 && lastIndex !== index) {
                    gsap.set(slides[lastIndex], { zIndex: 1, autoAlpha: 0 }); 
                }
                lastIndex = index;
            }
        },
        onComplete: () => {
            console.log("Lancement du rebond élastique...");
        
            const firstSlide = slides[0];
            const loaderEl = document.querySelector(".loader");
            const snapshotEl = document.querySelector(".loader-snapshot");
            const slidesContainer = document.querySelector(".slides-container");
        
            // 1. On prépare TOUTES les slides (pas juste la première)
            gsap.set(slides, { zIndex: 1, autoAlpha: 1, scale: 1 });
        
            // 2. 🔥 On positionne les slides adjacentes AUTOUR de la première
            const lastSlideIndex = slides.length - 1;
            
            gsap.set(slides[lastSlideIndex], { 
                visibility: "visible",
                yPercent: -100,  // Slide du HAUT
                zIndex: 1
            });
            
            gsap.set(firstSlide, { 
                visibility: "visible", 
                yPercent: 0,     // Slide du MILIEU (visible)
                zIndex: 2
            });
            
            gsap.set(slides[1], { 
                visibility: "visible",
                yPercent: 100,   // Slide du BAS
                zIndex: 1
            });
            
            // Les autres slides restent cachées
            for (let i = 2; i < lastSlideIndex; i++) {
                gsap.set(slides[i], { autoAlpha: 0 });
            }
        
            // 3. 🔥 ON CACHE LE LOADER IMMÉDIATEMENT
            gsap.set(loaderEl, { display: "none", opacity: 0 });
            gsap.set(snapshotEl, { display: "none" });
        
            // 4. Timeline : RECUL puis RETOUR fluide (sans rebond)
            let pressTl = gsap.timeline({
                onComplete: () => {
                    // Nettoyage final
                    gsap.set(slidesContainer, { scale: 1 });
                    gsap.set(slides, { yPercent: 0, zIndex: 1, autoAlpha: 0 });
                    gsap.set(firstSlide, { zIndex: 2, autoAlpha: 1, yPercent: 0 });
                    
                    isAnimating = false;
                    slideObserver.enable();
                    currentIndex = 0;
                    console.log("Effet terminé, interaction réactivée.");
                }
            });
        
            pressTl
                // A. 🔥 RECUL : Plus lent maintenant
                .to(slidesContainer, {
                    scale: 0.8,
                    duration: 1,        // Plus long qu'avant (0.4 → 0.6)
                    ease: "power3.inOut"  // Courbe douce
                })
                
                // B. 🔥 RETOUR à 100% : Fluide, sans rebond
                .to(slidesContainer, {
                    scale: 1,
                    duration: 0.6,        // Retour un peu plus lent
                    ease: "power3.out"    // Sortie douce (pas d'elastic)
                })
                
                // C. TITRE apparaît pendant le retour
                .fromTo(
                    firstSlide.querySelector(".title"), 
                    { y: 50, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
                    "-=0.6"  // Commence un peu avant la fin du retour
                );
        
            if (logoFixed) gsap.to(logoFixed, { autoAlpha: 1, duration: 0.5 });
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
window.addEventListener("load", () => {
    setTimeout(runIntroAnimation, 100);
});