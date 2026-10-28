(() => {
    const root = document.documentElement;
    const themeToggle = document.querySelector(".theme-toggle");
    const themeLabel = document.querySelector(".theme-label");
    const menuToggle = document.querySelector(".menu-toggle");
    const siteNav = document.querySelector("#site-nav");

    const currentTheme = () => root.dataset.theme === "dark" ? "dark" : "light";

    const syncThemeControl = () => {
        const dark = currentTheme() === "dark";
        themeToggle.setAttribute("aria-pressed", String(dark));
        themeLabel.textContent = dark ? "Dark mode" : "Light mode";
        document.querySelector('meta[name="theme-color"]').content = dark ? "#101d26" : "#f5f7f4";
    };

    themeToggle.addEventListener("click", () => {
        const nextTheme = currentTheme() === "dark" ? "light" : "dark";
        root.dataset.theme = nextTheme;
        try {
            localStorage.setItem("raven-portfolio-theme", nextTheme);
        } catch {
            // The theme still changes for this page view if storage is unavailable.
        }
        syncThemeControl();
    });

    const closeMenu = () => {
        siteNav.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
    };

    menuToggle.addEventListener("click", () => {
        const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
        menuToggle.setAttribute("aria-expanded", String(!isOpen));
        siteNav.classList.toggle("is-open", !isOpen);
    });

    siteNav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
            closeMenu();
            menuToggle.focus();
        }
    });

    // Hero project card carousel
    const slides = [...document.querySelectorAll(".index-slide")];
    const nextButton = document.querySelector(".index-next");
    let activeIndex = 0;
    let isAnimating = false;

    const sheetOf = (slide) => slide.querySelector(".index-sheet");

    const syncStack = () => {
        const nextIndex = (activeIndex + 1) % slides.length;
        slides.forEach((slide, i) => {
            slide.classList.toggle("is-active", i === activeIndex);
            slide.classList.toggle("is-hidden", i !== activeIndex && i !== nextIndex);
            slide.inert = i !== activeIndex;
        });
        const upcoming = slides[nextIndex];
        nextButton.setAttribute("aria-label", "Show next project: " + upcoming.dataset.title);
    };

    const showNextProject = () => {
        if (isAnimating || slides.length < 2) return;
        isAnimating = true;

        const outgoing = slides[activeIndex];
        activeIndex = (activeIndex + 1) % slides.length;
        const incoming = slides[activeIndex];

        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const duration = reduceMotion ? 0 : 750;
        const easing = "cubic-bezier(0.45, 0, 0.2, 1)";
        const back = getComputedStyle(outgoing).getPropertyValue("--back-transform").trim();

        // Front card lifts off to the right, then tucks behind the next card.
        const out = outgoing.animate([
            { transform: "none", zIndex: 2, backgroundColor: "var(--surface)", offset: 0 },
            { transform: "translateX(58%) rotate(9deg)", zIndex: 2, offset: 0.42 },
            { transform: "translateX(58%) rotate(9deg)", zIndex: 1, offset: 0.43 },
            { transform: back, zIndex: 1, backgroundColor: "var(--amber-soft)", offset: 1 }
        ], { duration, easing, fill: "forwards" });

        // Back card rises to the front.
        const inn = incoming.animate([
            { transform: back, zIndex: 1, backgroundColor: "var(--amber-soft)", offset: 0 },
            { transform: "translate(-0.6rem, -0.25rem) rotate(-2deg)", zIndex: 1, offset: 0.42 },
            { transform: "translate(-0.6rem, -0.25rem) rotate(-2deg)", zIndex: 2, offset: 0.43 },
            { transform: "none", zIndex: 2, backgroundColor: "var(--surface)", offset: 1 }
        ], { duration, easing, fill: "forwards" });

        // Swap the contents while the cards cross.
        const fadeOut = sheetOf(outgoing).animate(
            [{ opacity: 1 }, { opacity: 0 }],
            { duration: duration * 0.5, easing: "ease-out", fill: "forwards" });
        const fadeIn = sheetOf(incoming).animate(
            [{ opacity: 0 }, { opacity: 0, offset: 0.4 }, { opacity: 1 }],
            { duration, easing: "ease-out", fill: "forwards" });

        const animations = [out, inn, fadeOut, fadeIn];
        Promise.all(animations.map((a) => a.finished)).catch(() => { }).then(() => {
            syncStack();
            animations.forEach((a) => a.cancel());
            isAnimating = false;
        });
    };

    nextButton.addEventListener("click", showNextProject);
    syncStack();

    // Highlight the nav link for the section currently in view.
    const navLinks = [...siteNav.querySelectorAll('a[href^="#"]')];
    const navSections = navLinks
        .map((link) => ({ link, section: document.querySelector(link.getAttribute("href")) }))
        .filter((item) => item.section);
    let navTicking = false;

    const updateActiveNav = () => {
        navTicking = false;
        const line = window.innerHeight * 0.35;
        const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
        let current = null;
        navSections.forEach((item) => {
            if (item.section.getBoundingClientRect().top <= line) current = item;
        });
        if (atBottom) current = navSections[navSections.length - 1];
        navSections.forEach((item) => {
            if (item === current) item.link.setAttribute("aria-current", "true");
            else item.link.removeAttribute("aria-current");
        });
    };

    window.addEventListener("scroll", () => {
        if (!navTicking) {
            navTicking = true;
            requestAnimationFrame(updateActiveNav);
        }
    }, { passive: true });
    window.addEventListener("resize", updateActiveNav);
    updateActiveNav();

    syncThemeControl();
})();