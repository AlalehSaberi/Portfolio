const allSiteHeaders = [...document.querySelectorAll(".site-header")];
const sharedHeader = allSiteHeaders[0] ?? null;
const pageStage = document.querySelector(".page-stage");

if (sharedHeader && pageStage) {
  sharedHeader.classList.add("site-header--shared");
  pageStage.insertBefore(sharedHeader, pageStage.firstElementChild);

  allSiteHeaders.slice(1).forEach((header) => {
    header.setAttribute("aria-hidden", "true");
    header.inert = true;
  });
}

const headers = sharedHeader ? [sharedHeader] : allSiteHeaders;
const mobileNavigation = window.matchMedia("(max-width: 1020px)");

function getHeaderControls(header) {
  return {
    menuToggle: header.querySelector(".menu-toggle"),
    primaryNav: header.querySelector(".primary-nav"),
    experienceItem: header.querySelector(".nav-item--dropdown"),
    experienceButton: header.querySelector(".dropdown-trigger"),
  };
}

function setMainMenu(header, open) {
  const { menuToggle, primaryNav } = getHeaderControls(header);
  if (!menuToggle || !primaryNav) return;

  menuToggle.setAttribute("aria-expanded", String(open));
  primaryNav.classList.toggle("is-open", open);

  const label = menuToggle.querySelector(".sr-only");
  if (label) label.textContent = open ? "Close navigation" : "Open navigation";
}

function setExperienceMenu(header, open) {
  const { experienceItem, experienceButton } = getHeaderControls(header);
  if (!experienceItem || !experienceButton) return;

  experienceItem.classList.toggle("is-open", open);
  experienceButton.setAttribute("aria-expanded", String(open));
}

function closeAllNavigation({ returnFocus = false } = {}) {
  headers.forEach((header) => {
    const { menuToggle } = getHeaderControls(header);
    const wasOpen = menuToggle?.getAttribute("aria-expanded") === "true";

    setExperienceMenu(header, false);
    setMainMenu(header, false);

    if (returnFocus && wasOpen) menuToggle?.focus();
  });
}

headers.forEach((header) => {
  const { menuToggle, experienceButton } = getHeaderControls(header);

  menuToggle?.addEventListener("click", () => {
    const shouldOpen = menuToggle.getAttribute("aria-expanded") !== "true";
    closeAllNavigation();
    setMainMenu(header, shouldOpen);
  });

  experienceButton?.addEventListener("click", () => {
    const shouldOpen =
      experienceButton.getAttribute("aria-expanded") !== "true";
    setExperienceMenu(header, shouldOpen);
  });

  header.querySelectorAll(".nav-list a").forEach((link) => {
    link.addEventListener("click", () => closeAllNavigation());
  });
});

function scrollToPortfolioSection(sectionId, behavior = "smooth") {
  const target = document.getElementById(sectionId);
  if (!target?.classList.contains("portfolio-section")) return false;

  const root = document.documentElement;
  const previousInlineScrollBehavior = root.style.scrollBehavior;

  if (behavior === "auto") root.style.scrollBehavior = "auto";
  target.scrollIntoView({ behavior, block: "start" });

  if (behavior === "auto") {
    window.requestAnimationFrame(() => {
      root.style.scrollBehavior = previousInlineScrollBehavior;
    });
  }

  setActiveNavigation(sectionId);
  return true;
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  const sectionId = link.getAttribute("href")?.slice(1);
  if (!sectionId || !document.getElementById(sectionId)) return;

  link.addEventListener("click", (event) => {
    event.preventDefault();
    closeAllNavigation();

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (!scrollToPortfolioSection(sectionId, prefersReducedMotion ? "auto" : "smooth")) {
      return;
    }

    if (window.location.hash !== `#${sectionId}`) {
      window.history.pushState(null, "", `#${sectionId}`);
    }
  });
});

window.addEventListener("popstate", () => {
  const sectionId = window.location.hash.slice(1);
  if (sectionId) scrollToPortfolioSection(sectionId, "auto");
});

document.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;

  headers.forEach((header) => {
    const { menuToggle, primaryNav, experienceItem } =
      getHeaderControls(header);

    if (!experienceItem?.contains(event.target)) {
      setExperienceMenu(header, false);
    }

    if (
      mobileNavigation.matches &&
      !primaryNav?.contains(event.target) &&
      !menuToggle?.contains(event.target)
    ) {
      setMainMenu(header, false);
    }
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeAllNavigation({ returnFocus: true });
});

window.addEventListener("resize", () => {
  if (!mobileNavigation.matches) closeAllNavigation();
});

document.querySelectorAll("[data-carousel]").forEach((carousel) => {
  const track = carousel.querySelector(".carousel-track");
  const slides = [...carousel.querySelectorAll(".carousel-slide")];
  const showcase = carousel.closest(".project-showcase");
  const dots = [
    ...(showcase?.querySelectorAll(".carousel-pagination button") ?? []),
  ];
  const previousButton = carousel.querySelector(".carousel-control--previous");
  const nextButton = carousel.querySelector(".carousel-control--next");

  if (!track || slides.length === 0) return;

  let activeIndex = 0;
  let touchStartX = null;

  carousel.setAttribute("aria-roledescription", "carousel");
  carousel.tabIndex = 0;

  function showSlide(index) {
    activeIndex = (index + slides.length) % slides.length;
    track.style.transform = `translateX(-${activeIndex * 100}%)`;

    slides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === activeIndex;
      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));

      if (slide.matches("a[href]")) {
        slide.setAttribute("tabindex", isActive ? "0" : "-1");
      }
    });

    dots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === activeIndex;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-current", isActive ? "true" : "false");
    });
  }

  previousButton?.addEventListener("click", () => showSlide(activeIndex - 1));
  nextButton?.addEventListener("click", () => showSlide(activeIndex + 1));

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => showSlide(index));
  });

  carousel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showSlide(activeIndex - 1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      showSlide(activeIndex + 1);
    }
  });

  carousel.addEventListener(
    "touchstart",
    (event) => {
      touchStartX = event.changedTouches[0]?.clientX ?? null;
    },
    { passive: true },
  );

  carousel.addEventListener(
    "touchend",
    (event) => {
      if (touchStartX === null) return;

      const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX;
      const distance = touchEndX - touchStartX;

      if (Math.abs(distance) > 42) {
        showSlide(activeIndex + (distance < 0 ? 1 : -1));
      }

      touchStartX = null;
    },
    { passive: true },
  );

  showSlide(0);
});

document.querySelectorAll("[data-project-slider]").forEach((slider) => {
  const track = slider.querySelector(".project-slider-track");
  const slides = [...slider.querySelectorAll(".project-slide")];
  const dots = [...slider.querySelectorAll(".project-slider-pagination button")];
  const previousButton = slider.querySelector(".project-slider-control--previous");
  const nextButton = slider.querySelector(".project-slider-control--next");

  if (!track || slides.length === 0) return;

  let activeIndex = 0;
  let touchStartX = null;

  slider.setAttribute("aria-roledescription", "carousel");

  function showProject(index) {
    activeIndex = (index + slides.length) % slides.length;
    track.style.transform = `translateX(-${activeIndex * 100}%)`;

    slides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === activeIndex;
      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));

      slide
        .querySelectorAll("a, button, input, [tabindex]")
        .forEach((control) => {
          if (control.closest(".project-slider-nav")) return;
          control.setAttribute("tabindex", isActive ? "0" : "-1");
        });
    });

    dots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === activeIndex;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-current", isActive ? "true" : "false");
    });
  }

  previousButton?.addEventListener("click", () => showProject(activeIndex - 1));
  nextButton?.addEventListener("click", () => showProject(activeIndex + 1));

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => showProject(index));
  });

  slider.addEventListener("keydown", (event) => {
    if (event.target.closest(".project-carousel")) return;

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showProject(activeIndex - 1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      showProject(activeIndex + 1);
    }
  });

  track.addEventListener(
    "touchstart",
    (event) => {
      touchStartX = event.target.closest(".project-carousel")
        ? null
        : (event.changedTouches[0]?.clientX ?? null);
    },
    { passive: true },
  );

  track.addEventListener(
    "touchend",
    (event) => {
      if (touchStartX === null || event.target.closest(".project-carousel")) {
        touchStartX = null;
        return;
      }

      const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX;
      const distance = touchEndX - touchStartX;

      if (Math.abs(distance) > 42) {
        showProject(activeIndex + (distance < 0 ? 1 : -1));
      }

      touchStartX = null;
    },
    { passive: true },
  );

  showProject(0);
});

const portraitInput = document.querySelector(".portrait-upload-input");
const portraitFrame = document.querySelector(".portrait-placeholder");
const portraitPreview = document.querySelector(".portrait-preview");
let portraitObjectUrl = null;

portraitInput?.addEventListener("change", () => {
  const [file] = portraitInput.files ?? [];
  if (!file || !file.type.startsWith("image/") || !portraitPreview) return;

  if (portraitObjectUrl) URL.revokeObjectURL(portraitObjectUrl);
  portraitObjectUrl = URL.createObjectURL(file);
  portraitPreview.src = portraitObjectUrl;
  portraitPreview.hidden = false;
  portraitFrame?.classList.add("has-image");
});

const hobbySliderInstances = [];

document.querySelectorAll(".hobby-postcard").forEach((postcard, cardIndex) => {
  const media = postcard.querySelector(".hobby-postcard__media");
  const title = postcard.querySelector("h3")?.textContent.trim() || "Hobby";
  if (!media) return;

  const slider = document.createElement("div");
  slider.className = "hobby-slider";
  slider.setAttribute("role", "region");
  slider.setAttribute("aria-label", `${title} image slider`);
  slider.tabIndex = 0;

  const track = document.createElement("div");
  track.className = "hobby-slider__track";
  slider.append(track);

  const slides = Array.from({ length: 3 }, (_, slideIndex) => {
    const slide = document.createElement("div");
    slide.className = "hobby-slide";
    slide.setAttribute("role", "group");
    slide.setAttribute("aria-label", `${title} image ${slideIndex + 1} of 3`);

    const label = document.createElement("label");
    label.className = "hobby-slide__upload";

    const input = document.createElement("input");
    input.className = "hobby-slide__input";
    input.type = "file";
    input.accept = "image/*";
    input.setAttribute(
      "aria-label",
      `Upload ${title} image ${slideIndex + 1}`,
    );

    const preview = document.createElement("img");
    preview.className = "hobby-slide__preview";
    preview.alt = `${title} image ${slideIndex + 1}`;
    preview.hidden = true;

    const placeholder = document.createElement("span");
    placeholder.className = "hobby-image-placeholder";
    placeholder.innerHTML = `
      <span class="placeholder-picture" aria-hidden="true"></span>
      <span>Upload image ${slideIndex + 1}</span>
    `;

    input.addEventListener("change", () => {
      const [file] = input.files ?? [];
      if (!file || !file.type.startsWith("image/")) return;

      const previousUrl = preview.dataset.objectUrl;
      if (previousUrl) URL.revokeObjectURL(previousUrl);

      const objectUrl = URL.createObjectURL(file);
      preview.dataset.objectUrl = objectUrl;
      preview.src = objectUrl;
      preview.hidden = false;
      slide.classList.add("has-image");
    });

    label.append(input, preview, placeholder);
    slide.append(label);
    track.append(slide);
    return slide;
  });

  const previousButton = document.createElement("button");
  previousButton.className =
    "hobby-slider__control hobby-slider__control--previous";
  previousButton.type = "button";
  previousButton.setAttribute("aria-label", `Previous ${title} image`);
  previousButton.innerHTML = '<span aria-hidden="true">‹</span>';

  const nextButton = document.createElement("button");
  nextButton.className = "hobby-slider__control hobby-slider__control--next";
  nextButton.type = "button";
  nextButton.setAttribute("aria-label", `Next ${title} image`);
  nextButton.innerHTML = '<span aria-hidden="true">›</span>';

  const dots = document.createElement("div");
  dots.className = "hobby-slider__dots";
  dots.setAttribute("role", "group");
  dots.setAttribute("aria-label", `Choose a ${title} image`);

  const dotButtons = slides.map((_, slideIndex) => {
    const dot = document.createElement("button");
    dot.className = "hobby-slider__dot";
    dot.type = "button";
    dot.setAttribute("aria-label", `Show ${title} image ${slideIndex + 1}`);
    dots.append(dot);
    return dot;
  });

  slider.append(previousButton, nextButton, dots);
  media.replaceChildren(slider);

  let activeIndex = 0;
  let touchStartX = null;

  function showHobbySlide(index) {
    activeIndex = (index + slides.length) % slides.length;
    track.style.transform = `translateX(-${activeIndex * 100}%)`;

    slides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === activeIndex;
      slide.setAttribute("aria-hidden", String(!isActive));
      const input = slide.querySelector("input");
      if (input) input.disabled = !isActive;
    });

    dotButtons.forEach((dot, dotIndex) => {
      const isActive = dotIndex === activeIndex;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-current", isActive ? "true" : "false");
    });
  }

  previousButton.addEventListener("click", () =>
    showHobbySlide(activeIndex - 1),
  );
  nextButton.addEventListener("click", () => showHobbySlide(activeIndex + 1));
  dotButtons.forEach((dot, index) => {
    dot.addEventListener("click", () => showHobbySlide(index));
  });

  slider.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showHobbySlide(activeIndex - 1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      showHobbySlide(activeIndex + 1);
    }
  });

  slider.addEventListener(
    "touchstart",
    (event) => {
      touchStartX = event.changedTouches[0]?.clientX ?? null;
    },
    { passive: true },
  );

  slider.addEventListener(
    "touchend",
    (event) => {
      if (touchStartX === null) return;
      const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX;
      const distance = touchEndX - touchStartX;

      if (Math.abs(distance) > 38) {
        showHobbySlide(activeIndex + (distance < 0 ? 1 : -1));
      }

      touchStartX = null;
    },
    { passive: true },
  );

  showHobbySlide(cardIndex * 0);
  hobbySliderInstances.push({ slider, title, slides, previousButton, nextButton, dots, dotButtons });
});

const germanTranslations = {
  "Open navigation": "Navigation öffnen",
  "Close navigation": "Navigation schließen",
  Home: "Start",
  Experience: "Erfahrung",
  Professional: "Beruflich",
  Academic: "Akademisch",
  Skills: "Kompetenzen",
  Hobbies: "Hobbys",
  Ambitions: "Ziele",
  "Hello, I’m": "Hallo, ich bin",
  "Media Engineering student moving towards":
    "Studentin der Medientechnik mit dem Ziel:",
  "Front-end Development, UX Research &":
    "Frontend-Entwicklung, UX-Forschung &",
  "Usability Engineering": "Usability Engineering",
  "Through user research, empathy, accessibility, and thoughtful":
    "Durch Nutzerforschung, Empathie, Barrierefreiheit und",
  "interface design, I turn complex problems into clear, usable,":
    "durchdachtes Interface-Design verwandle ich komplexe Probleme in klare,",
  "and meaningful solutions.": "nutzbare und sinnvolle Lösungen.",
  "Discover my work": "Meine Arbeit entdecken",
  "Upload portrait": "Porträt hochladen",
  "Master’s Student": "Masterstudentin",
  "Media Engineering,": "Medientechnik,",
  Focus: "Schwerpunkt",
  "Front-end Web Development": "Frontend-Webentwicklung",
  "UX Research &": "UX-Forschung &",
  "Ilmenau, Germany": "Ilmenau, Deutschland",
  "Just an old soul trying to survive in the modern world":
    "Nur eine alte Seele, die versucht, in der modernen Welt zu bestehen",
  "Featured project": "Ausgewähltes Projekt",
  Experience: "Erfahrung",
  "Professional Experience": "Berufserfahrung",
  "Over two years (2022–2024), I worked and gained experience as a front-end web designer and developer in my home country. This experience helped me gain a better understanding of end users, leading me to continue my education at":
    "Über zwei Jahre (2022–2024) arbeitete ich in meinem Heimatland als Frontend-Webdesignerin und -entwicklerin. Dabei entwickelte ich ein tieferes Verständnis für Endnutzer und entschied mich, mein Studium fortzusetzen an der",
  "Visit AutoSell": "AutoSell besuchen",
  Current: "Aktuell",
  "Featured academic project": "Ausgewähltes Hochschulprojekt",
  "Project title to be added": "Projekttitel ergänzen",
  "Academic project": "Hochschulprojekt",
  "Project image": "Projektbild",
  "Your first selected project image will be added here.":
    "Das erste ausgewählte Projektbild wird hier eingefügt.",
  "Your second selected project image will be added here.":
    "Das zweite ausgewählte Projektbild wird hier eingefügt.",
  "Your third selected project image will be added here.":
    "Das dritte ausgewählte Projektbild wird hier eingefügt.",
  "Method / Tool": "Methode / Tool",
  Skill: "Kompetenz",
  "(Germany)": "(Deutschland)",
  "Dates to be added": "Daten ergänzen",
  "This space is ready for the final description of your academic experience and selected university project. The layout, carousel, and responsive behavior are complete; only your final content needs to replace these placeholders.":
    "Dieser Bereich ist für die endgültige Beschreibung deiner akademischen Erfahrung und deines ausgewählten Hochschulprojekts vorbereitet. Layout, Karussell und responsives Verhalten sind fertig; nur der endgültige Inhalt muss die Platzhalter ersetzen.",
  "Project link to be added": "Projektlink ergänzen",
  "How I Work": "So arbeite ich",
  "From an idea to an experience": "Von einer Idee zu einem Erlebnis",
  "people can trust.": "dem Menschen vertrauen können.",
  Understand: "Verstehen",
  Shape: "Gestalten",
  Build: "Umsetzen",
  Testing: "Testen",
  "Main-Character": "Hauptfiguren",
  Energy: "Energie",
  "A scrapbook of everything": "Ein Sammelalbum mit allem,",
  "that makes life more fun.": "was das Leben schöner macht.",
  "Upload image 1": "Bild 1 hochladen",
  "Upload image 2": "Bild 2 hochladen",
  "Upload image 3": "Bild 3 hochladen",
  Fashion: "Mode",
  "Shoes, styling, and never a boring office fit.":
    "Schuhe, Styling und niemals ein langweiliges Büro-Outfit.",
  Books: "Bücher",
  "Nothing lifts my mood like getting cozy with a good book.":
    "Nichts hebt meine Stimmung so sehr wie ein gutes Buch.",
  Cinema: "Kino",
  "My favorite escape from everyday life.":
    "Meine liebste Auszeit vom Alltag.",
  Music: "Musik",
  "Creating my own soundtrack—because I am that girl.":
    "Meinen eigenen Soundtrack schaffen – weil ich genau diese Frau bin.",
  Travel: "Reisen",
  "Widening my horizons through new countries and cultures.":
    "Meinen Horizont durch neue Länder und Kulturen erweitern.",
  Food: "Kochen",
  "I started cooking after moving out—and discovered I love it.":
    "Nach meinem Auszug begann ich zu kochen – und entdeckte meine Liebe dazu.",
  Sports: "Sport",
  "Pilates three days a week, plus swimming.":
    "Dreimal pro Woche Pilates und zusätzlich Schwimmen.",
  Animals: "Tiere",
  "Proud cat mom to a tabby Persian boy since 2021.":
    "Seit 2021 stolze Katzenmama eines getigerten Perserkaters.",
  "The Next": "Die nächsten",
  Chapters: "Kapitel",
  "Progress, with purpose.": "Fortschritt mit Sinn.",
  Now: "Jetzt",
  "Short term": "Kurzfristig",
  Next: "Als Nächstes",
  "Long term": "Langfristig",
  "Find a student job aligned with my experiences and interests":
    "Eine studentische Stelle finden, die zu meinen Erfahrungen und Interessen passt",
  "Improve my German": "Mein Deutsch verbessern",
  "Finish my Studies": "Mein Studium abschließen",
  "Graduate from my Master's program": "Mein Masterstudium abschließen",
  "Build a Usability career in Germany":
    "Eine Karriere im Bereich Usability in Deutschland aufbauen",
  "Let’s create useful, human-centered experiences.":
    "Lassen Sie uns nützliche, menschenzentrierte Erlebnisse schaffen.",
  "Get in touch": "Kontakt aufnehmen",
  "Email copied": "E-Mail kopiert",
  English: "Englisch",
  // Complete German equivalents for the current English portfolio copy.
  "UX Research & Usability Engineering": "UX-Forschung & Usability Engineering",
  "Over two years (2022–2024), I worked as a front-end web designer and developer in Iran, running requirements interviews with clients and translating their goals into interface decisions. This included AutoSell, a five-page car-dealership site with a right-to-left Persian layout, custom dropdown filters, an image gallery, and a favorites toggle. Presenting concepts to clients and iterating on their feedback is what first pulled me toward UX research, and led me to continue my education at": "Über zwei Jahre (2022–2024) arbeitete ich im Iran als Frontend-Webdesignerin und -entwicklerin. Dabei führte ich Anforderungsinterviews mit Kund:innen und übertrug ihre Ziele in Entscheidungen für die Benutzeroberfläche. Dazu gehörte AutoSell, eine fünfseitige Website für einen Autohändler mit persischem Rechts-nach-links-Layout, benutzerdefinierten Dropdown-Filtern, einer Bildergalerie und einer Favoritenfunktion. Das Präsentieren von Konzepten vor Kund:innen und die iterative Weiterentwicklung auf Basis ihres Feedbacks weckten erstmals mein Interesse an UX Research und führten dazu, dass ich mein Studium fortsetzte an der",
  "Research Seminar": "Forschungsseminar",
  "Humanizing LLM Inference Visualization": "Menschlichere Visualisierung der LLM-Inferenz",
  "UX Research": "UX-Forschung",
  "Usability Testing Methods": "Methoden des Usability-Testings",
  "Data Visualization": "Datenvisualisierung",
  "Oct 2025 - Feb 2026": "Okt. 2025 – Feb. 2026",
  "Our team studied how inference-time animations affect how people experience waiting for an LLM's response. I helped design 24 experimental conditions by adapting an existing web-based LLM emulator. After running individual sessions with 20 participants, I analyzed the Likert-scale ratings in Python using repeated-measures ANOVA and 95% confidence intervals, and visualized results with matplotlib. Longer waits significantly reduced satisfaction, and where the animation appeared mattered more than expected — placing it inside the chat felt clearer, but occasionally more distracting.": "Unser Team untersuchte, wie Animationen während der Inferenz beeinflussen, wie Menschen das Warten auf die Antwort eines LLM erleben. Ich half dabei, 24 Versuchsbedingungen zu entwerfen, indem wir einen bestehenden webbasierten LLM-Emulator anpassten. Nach Einzelsitzungen mit 20 Teilnehmenden analysierte ich die Bewertungen auf Likert-Skalen in Python mithilfe einer ANOVA mit Messwiederholung und 95-%-Konfidenzintervallen und visualisierte die Ergebnisse mit matplotlib. Längere Wartezeiten verringerten die Zufriedenheit deutlich, und die Position der Animation spielte eine größere Rolle als erwartet – innerhalb des Chats wirkte sie klarer, gelegentlich jedoch auch ablenkender.",
  "Full report available on request": "Vollständiger Bericht auf Anfrage verfügbar",
  "Usability Engineering Project": "Usability-Engineering-Projekt",
  "Passenger Information Display for Autonomous Buses": "Fahrgastinformationsanzeige für autonome Busse",
  "Questionnaires": "Fragebögen",
  "Think-Aloud Testing": "Think-Aloud-Tests",
  "Jun 2025 - Jul 2025": "Juni 2025 – Juli 2025",
  "Our team designed an in-vehicle information display to help passengers understand what's happening during autonomous-bus emergencies. I ran a requirements study with a 17-question survey, synthesized the responses into four personas and built a horizontal Figma prototype covering three scenarios: ticket control, delays, and accidents. Think-aloud testing with five participants showed that simple, clear displays gave passengers a sense of orientation and trust, and pointed us toward working professionals as a group worth testing next.": "Unser Team entwarf eine Informationsanzeige im Fahrzeug, die Fahrgästen helfen sollte, Notfallsituationen in autonomen Bussen besser zu verstehen. Ich führte eine Anforderungsstudie mit einem Fragebogen aus 17 Fragen durch, fasste die Antworten in vier Personas zusammen und erstellte einen horizontalen Figma-Prototyp für drei Szenarien: Fahrkartenkontrolle, Verspätungen und Unfälle. Think-Aloud-Tests mit fünf Teilnehmenden zeigten, dass einfache und klare Anzeigen den Fahrgästen Orientierung und Vertrauen vermittelten, und deuteten darauf hin, dass Berufstätige eine sinnvolle Zielgruppe für weitere Tests wären.",
  "people can enjoy": "das Menschen gerne nutzen.",
  "Requirement Analysis": "Anforderungsanalyse",
  "User Research": "Nutzerforschung",
  "Interviews & Questionnaires": "Interviews & Fragebögen",
  "Participant Recruitment": "Rekrutierung von Teilnehmenden",
  "Wireframing": "Wireframing",
  "Prototyping": "Prototyping",
  "Human-Centered Design": "Menschzentriertes Design",
  "Usability Evaluation": "Usability-Evaluation",
  "Quantitative Tests": "Quantitative Tests",
  "Qualitative Tests": "Qualitative Tests",
  "Think-Aloud Method": "Think-Aloud-Methode",
  "Repeated-Measures ANOVA": "ANOVA mit Messwiederholung",
  "that makes life more fun": "was das Leben schöner macht",
  "Add fashion image": "Modebild hinzufügen",
  "Never a boring fit": "Nie ein langweiliges Outfit",
  "Add books image": "Bücherbild hinzufügen",
  "Nothing lifts my mood like getting cozy with a good book": "Nichts hebt meine Stimmung so sehr, wie es mir mit einem guten Buch gemütlich zu machen",
  "Add cinema image": "Kinobild hinzufügen",
  "My favorite escape from everyday life": "Meine liebste Auszeit vom Alltag",
  "Add music image": "Musikbild hinzufügen",
  "Creating my own background-music because I am that girl": "Meinen eigenen Soundtrack schaffen – weil ich genau diese Frau bin",
  "Add travel image": "Reisebild hinzufügen",
  "Widening my horizons through cultures": "Meinen Horizont durch andere Kulturen erweitern",
  "Add food image": "Essensbild hinzufügen",
  "I started cooking after moving out and discovered I love it": "Nach meinem Auszug begann ich zu kochen und entdeckte, dass ich es liebe",
  "Add animals image": "Tierbild hinzufügen",
  "Proud cat mom to a tabby Persian boy since 2021": "Seit 2021 stolze Katzenmama eines getigerten Perserkaters",
  "Progress, with purpose": "Fortschritt mit Sinn",
  "Alaleh Saberilemraski — Home": "Alaleh Saberilemraski — Startseite",
  "AS monogram surrounded by a burgundy laurel wreath": "AS-Monogramm, umgeben von einem burgunderroten Lorbeerkranz",
  "Home page navigation": "Navigation der Startseite",
  "Social and language links": "Links zu sozialen Netzwerken und Sprachauswahl",
  "Open Alaleh's LinkedIn profile": "Alalehs LinkedIn-Profil öffnen",
  "Open Alaleh's GitHub profile": "Alalehs GitHub-Profil öffnen",
  "Profile at a glance": "Profil auf einen Blick",
  "Upload your portrait": "Porträt hochladen",
  "Uploaded portrait of Alaleh Saberilemraski": "Hochgeladenes Porträt von Alaleh Saberilemraski",
  "Professional experience navigation": "Navigation der Berufserfahrung",
  "LinkedIn profile link will be added here": "Der Link zum LinkedIn-Profil wird hier ergänzt",
  "LinkedIn profile link to be added": "Link zum LinkedIn-Profil wird ergänzt",
  "AutoSell project screenshots": "Screenshots des AutoSell-Projekts",
  "View the AutoSell home page on the live website": "AutoSell-Startseite auf der Live-Website ansehen",
  "AutoSell home page with a black sports car, Persian navigation, and a vehicle browsing button": "AutoSell-Startseite mit schwarzem Sportwagen, persischer Navigation und einer Schaltfläche zum Durchsuchen von Fahrzeugen",
  "View the AutoSell sign-in page on the live website": "AutoSell-Anmeldeseite auf der Live-Website ansehen",
  "AutoSell Persian sign-in page with username and password fields": "Persische AutoSell-Anmeldeseite mit Feldern für Benutzername und Passwort",
  "View the AutoSell vehicle listings page on the live website": "AutoSell-Fahrzeugübersicht auf der Live-Website ansehen",
  "AutoSell Persian vehicle listings page with filters and a car listing card": "Persische AutoSell-Fahrzeugübersicht mit Filtern und einer Fahrzeugkarte",
  "View the AutoSell vehicle details page on the live website": "AutoSell-Fahrzeugdetailseite auf der Live-Website ansehen",
  "AutoSell Persian vehicle details page with a large car photo, gallery thumbnails, and specifications": "Persische AutoSell-Fahrzeugdetailseite mit großem Fahrzeugfoto, Galerie-Vorschaubildern und technischen Daten",
  "Show previous AutoSell screenshot": "Vorherigen AutoSell-Screenshot anzeigen",
  "Show next AutoSell screenshot": "Nächsten AutoSell-Screenshot anzeigen",
  "Choose an AutoSell screenshot": "AutoSell-Screenshot auswählen",
  "Show screenshot 1": "Screenshot 1 anzeigen",
  "Show screenshot 2": "Screenshot 2 anzeigen",
  "Show screenshot 3": "Screenshot 3 anzeigen",
  "Show screenshot 4": "Screenshot 4 anzeigen",
  "Continue to Academic Experience": "Weiter zur akademischen Erfahrung",
  "Academic experience navigation": "Navigation der akademischen Erfahrung",
  "Academic projects": "Akademische Projekte",
  "Academic project 1 image placeholders": "Bildplatzhalter für akademisches Projekt 1",
  "Show previous image for academic project 1": "Vorheriges Bild für akademisches Projekt 1 anzeigen",
  "Show next image for academic project 1": "Nächstes Bild für akademisches Projekt 1 anzeigen",
  "Choose an image for academic project 1": "Bild für akademisches Projekt 1 auswählen",
  "Show image 1": "Bild 1 anzeigen",
  "Show image 2": "Bild 2 anzeigen",
  "Show image 3": "Bild 3 anzeigen",
  "Academic project 2 image placeholders": "Bildplatzhalter für akademisches Projekt 2",
  "Show previous image for academic project 2": "Vorheriges Bild für akademisches Projekt 2 anzeigen",
  "Show next image for academic project 2": "Nächstes Bild für akademisches Projekt 2 anzeigen",
  "Choose an image for academic project 2": "Bild für akademisches Projekt 2 auswählen",
  "Show previous academic project": "Vorheriges akademisches Projekt anzeigen",
  "Choose an academic project": "Akademisches Projekt auswählen",
  "Show project 1": "Projekt 1 anzeigen",
  "Show project 2": "Projekt 2 anzeigen",
  "Show next academic project": "Nächstes akademisches Projekt anzeigen",
  "Continue to Skills": "Weiter zu den Kompetenzen",
  "Skills page navigation": "Navigation der Kompetenzseite",
  "Four-stage working process": "Vierstufiger Arbeitsprozess",
  "Understand skill placeholders": "Kompetenzen im Bereich Verstehen",
  "Shape skill placeholders": "Kompetenzen im Bereich Gestalten",
  "Build skill placeholders": "Kompetenzen im Bereich Umsetzen",
  "Testing skill placeholders": "Kompetenzen im Bereich Testen",
  "Continue to Hobbies": "Weiter zu den Hobbys",
  "Hobbies page navigation": "Navigation der Hobbyseite",
  "Hobby postcards": "Hobby-Postkarten",
  "Fashion image placeholder": "Platzhalter für Modebild",
  "Books image placeholder": "Platzhalter für Bücherbild",
  "Cinema image placeholder": "Platzhalter für Kinobild",
  "Music image placeholder": "Platzhalter für Musikbild",
  "Travel image placeholder": "Platzhalter für Reisebild",
  "Food image placeholder": "Platzhalter für Essensbild",
  "Animals image placeholder": "Platzhalter für Tierbild",
  "Continue to Ambitions": "Weiter zu den Zielen",
  "Ambitions page navigation": "Navigation der Zieleseite",
  "Ambition journey": "Weg zu meinen Zielen",
  "Short-term ambition text placeholders": "Textplatzhalter für kurzfristige Ziele",
  "Long-term ambition text placeholders": "Textplatzhalter für langfristige Ziele",

};

const translatableTextNodes = [];
const textWalker = document.createTreeWalker(
  document.body,
  NodeFilter.SHOW_TEXT,
  {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || parent.closest("script, style, [data-no-translate], [data-language]")) {
        return NodeFilter.FILTER_REJECT;
      }

      return node.nodeValue?.trim()
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  },
);

while (textWalker.nextNode()) {
  const node = textWalker.currentNode;
  translatableTextNodes.push({ node, original: node.nodeValue });
}

const translatableAttributes = [];
document
  .querySelectorAll("[aria-label], [title], [alt], [placeholder]")
  .forEach((element) => {
    ["aria-label", "title", "alt", "placeholder"].forEach((attribute) => {
      if (!element.hasAttribute(attribute)) return;
      translatableAttributes.push({
        element,
        attribute,
        original: element.getAttribute(attribute),
      });
    });
  });

function translatedValue(value, language) {
  if (language !== "de" || !value) return value;
  const normalized = value.trim().replace(/\s+/g, " ");
  return germanTranslations[normalized] ?? value;
}

function replacePreservingWhitespace(original, replacement) {
  const leading = original.match(/^\s*/)?.[0] ?? "";
  const trailing = original.match(/\s*$/)?.[0] ?? "";
  return `${leading}${replacement}${trailing}`;
}

const languageSwitcher = document.querySelector(".language-switcher");
const languageTrigger = document.querySelector(".language-trigger");
const languageMenu = document.querySelector(".language-menu");
const languageCurrent = document.querySelector(".language-current");
const languageButtons = [
  ...document.querySelectorAll(".language-menu [data-language]"),
];
let currentLanguage = "en";

function setLanguageMenu(open) {
  if (!languageSwitcher || !languageTrigger || !languageMenu) return;
  languageSwitcher.classList.toggle("is-open", open);
  languageTrigger.setAttribute("aria-expanded", String(open));
  languageMenu.hidden = !open;
}

function applyLanguage(language) {
  currentLanguage = language === "de" ? "de" : "en";
  document.documentElement.lang = currentLanguage;

  translatableTextNodes.forEach(({ node, original }) => {
    const key = original.trim().replace(/\s+/g, " ");
    const translation = translatedValue(key, currentLanguage);
    node.nodeValue = replacePreservingWhitespace(original, translation);
  });

  translatableAttributes.forEach(({ element, attribute, original }) => {
    element.setAttribute(
      attribute,
      translatedValue(original, currentLanguage),
    );
  });

  if (languageCurrent) {
    languageCurrent.textContent = currentLanguage === "de" ? "DE" : "Eng";
  }

  languageButtons.forEach((button) => {
    if (button.dataset.language === "en") {
      button.textContent = currentLanguage === "de" ? "Englisch" : "English";
    } else if (button.dataset.language === "de") {
      button.textContent = "Deutsch";
    }
  });

  languageButtons.forEach((button) => {
    button.setAttribute(
      "aria-current",
      String(button.dataset.language === currentLanguage),
    );
  });

  document.title =
    currentLanguage === "de"
      ? "Alaleh Saberilemraski | Portfolio"
      : "Alaleh Saberilemraski | Portfolio";

  const description = document.querySelector('meta[name="description"]');
  description?.setAttribute(
    "content",
    currentLanguage === "de"
      ? "Portfolio von Alaleh Saberilemraski, Studentin der Medientechnik mit Schwerpunkt Frontend-Entwicklung, UX-Forschung und Usability Engineering."
      : "Portfolio of Alaleh Saberilemraski, a Media Engineering student focused on front-end development, UX research, and usability engineering.",
  );

  try {
    window.localStorage.setItem("portfolio-language", currentLanguage);
  } catch {
    // The selected language still works when storage is unavailable.
  }
}

languageTrigger?.addEventListener("click", () => {
  setLanguageMenu(languageTrigger.getAttribute("aria-expanded") !== "true");
});

// Match the Experience menu behavior on non-mobile layouts: open on hover.
languageSwitcher?.addEventListener("mouseenter", () => {
  if (!mobileNavigation.matches) setLanguageMenu(true);
});

languageSwitcher?.addEventListener("mouseleave", () => {
  if (!mobileNavigation.matches) setLanguageMenu(false);
});

languageSwitcher?.addEventListener("focusin", () => {
  if (!mobileNavigation.matches) setLanguageMenu(true);
});

languageSwitcher?.addEventListener("focusout", (event) => {
  if (
    !mobileNavigation.matches &&
    (!event.relatedTarget || !languageSwitcher.contains(event.relatedTarget))
  ) {
    setLanguageMenu(false);
  }
});

languageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyLanguage(button.dataset.language);
    setLanguageMenu(false);
    languageTrigger?.focus();
  });
});

document.addEventListener("click", (event) => {
  if (
    event.target instanceof Node &&
    languageSwitcher &&
    !languageSwitcher.contains(event.target)
  ) {
    setLanguageMenu(false);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setLanguageMenu(false);
});

let savedLanguage = "en";
try {
  savedLanguage = window.localStorage.getItem("portfolio-language") || "en";
} catch {
  savedLanguage = "en";
}
applyLanguage(savedLanguage);

const emailButton = document.querySelector("[data-copy-email]");
const copyToast = document.querySelector(".copy-toast");
let toastTimer = null;

function fallbackCopyText(value) {
  const field = document.createElement("textarea");
  field.value = value;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.append(field);
  field.select();
  const copied = document.execCommand("copy");
  field.remove();
  return copied;
}

function showCopyConfirmation() {
  if (!copyToast) return;
  copyToast.textContent =
    currentLanguage === "de" ? "E-Mail kopiert" : "Email copied";
  copyToast.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    copyToast.hidden = true;
  }, 2600);
}

emailButton?.addEventListener("click", async () => {
  const email = emailButton.dataset.copyEmail;
  if (!email) return;

  try {
    await navigator.clipboard.writeText(email);
  } catch {
    fallbackCopyText(email);
  }

  showCopyConfirmation();
});

const portfolioSections = [
  ...document.querySelectorAll(".portfolio-section[id]"),
];
let navigationFrame = null;

function setActiveNavigation(sectionId) {
  headers.forEach((header) => {
    const topLevelLinks = [...header.querySelectorAll(".nav-link")];
    const experienceButton = header.querySelector(".dropdown-trigger");
    const dropdownLinks = [...header.querySelectorAll(".dropdown a")];

    topLevelLinks.forEach((link) => link.classList.remove("nav-link--current"));
    dropdownLinks.forEach((link) =>
      link.classList.remove("dropdown-link--current"),
    );

    if (sectionId === "professional" || sectionId === "academic") {
      experienceButton?.classList.add("nav-link--current");
      header
        .querySelector(`.dropdown a[href="#${sectionId}"]`)
        ?.classList.add("dropdown-link--current");
      return;
    }

    header
      .querySelector(`.nav-link[href="#${sectionId}"]`)
      ?.classList.add("nav-link--current");
  });
}

function syncActiveSection() {
  navigationFrame = null;
  const viewportReference = window.innerHeight * 0.42;
  let closestSection = portfolioSections[0];
  let closestDistance = Number.POSITIVE_INFINITY;

  portfolioSections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    const visibleTop = Math.max(rect.top, 0);
    const visibleBottom = Math.min(rect.bottom, window.innerHeight);
    const isVisible = visibleBottom > visibleTop;

    if (!isVisible) return;

    const distance = Math.abs(rect.top - viewportReference);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestSection = section;
    }
  });

  if (closestSection?.id) setActiveNavigation(closestSection.id);
}

function requestNavigationSync() {
  if (navigationFrame !== null) return;
  navigationFrame = window.requestAnimationFrame(syncActiveSection);
}

window.addEventListener("scroll", requestNavigationSync, { passive: true });
window.addEventListener("resize", requestNavigationSync);
window.addEventListener("load", () => {
  const sectionId = window.location.hash.slice(1);

  if (sectionId) {
    window.requestAnimationFrame(() =>
      scrollToPortfolioSection(sectionId, "auto"),
    );
  }

  requestNavigationSync();
});
requestNavigationSync();
