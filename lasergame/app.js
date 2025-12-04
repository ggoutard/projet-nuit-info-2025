// Utilitaires
function qs(sel, ctx = document) { return ctx.querySelector(sel); }
function qsa(sel, ctx = document) { return Array.from(ctx.querySelectorAll(sel)); }
function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name) || "";
}

// Suggestions rapides sur la home
document.addEventListener("DOMContentLoaded", () => {
  const form = qs("#search-form");
  const input = qs("#q");
  const suggestButtons = qsa(".quick-suggestions button");
  const toggleTheme = qs("#toggle-theme");

  suggestButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      input.value = btn.dataset.suggestion;
      form.requestSubmit();
    });
  });

  if (toggleTheme) {
    toggleTheme.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      const next = current === "polar-night" ? null : "polar-night";
      document.documentElement.setAttribute("data-theme", next || "");
      toggleTheme.textContent = next ? "Désactiver le mode Nuit Polaire" : "Activer le mode Nuit Polaire";
    });
  }

  // Pré-remplir le champ si on a un paramètre q
  const q = getQueryParam("q");
  if (q && input) input.value = q;

  // Page résultats: remplir la liste
  const list = qs("#results-list");
  if (list) {
    renderResults(q);
  }
});

// Génère des résultats parodiques
function renderResults(query) {
  const list = qs("#results-list");
  const infoCard = qs("#info-card");
  const count = qs("#results-count");

  const safeQuery = (query || "tux").trim();
  if (count) {
    count.textContent = `Environ 42 résultats pour “${safeQuery}” (en 0,007 s) — pure magie polaire.`;
  }

  const templates = [
    {
      title: `Guide ultime: ${safeQuery} pour les manchots`,
      url: "https://tux.tux/go/guide",
      snippet: "Apprenez à maîtriser la banquise, à optimiser vos glissades, et à configurer votre shell… de mer."
    },
    {
      title: `Comparatif: ${safeQuery} vs. un bon gros poisson`,
      url: "https://tux.tux/go/comparatif",
      snippet: "Lequel est le plus satisfaisant? Indices: calories, croustillant, et disponibilité saisonnière."
    },
    {
      title: `${safeQuery} — Astuces de performance à -20°C`,
      url: "https://tux.tux/go/perf",
      snippet: "Benchmark des glissades, latence du vent, tuning des plumes, et caches de sardines."
    },
    {
      title: `FAQ: Pourquoi les pingouins ne volent pas avec ${safeQuery}?`,
      url: "https://tux.tux/go/faq",
      snippet: "La gravité, le design, et une préférence marquée pour le style."
    },
    {
      title: `Tutoriel vidéo: ${safeQuery} en mode Nuit Polaire`,
      url: "https://tux.tux/go/video",
      snippet: "Regardez Tux optimiser la lisibilité à la lueur des aurores boréales."
    }
  ];

  list.innerHTML = "";
  templates.forEach(t => {
    const li = document.createElement("li");
    li.className = "result-item";

    const a = document.createElement("a");
    a.href = t.url;
    a.className = "result-title";
    a.textContent = t.title;

    const p = document.createElement("p");
    p.className = "result-snippet";
    p.textContent = t.snippet;

    li.appendChild(a);
    li.appendChild(p);
    list.appendChild(li);
  });

  if (infoCard) {
    infoCard.textContent = `Astuce liée à “${safeQuery}”: mettez de la cire sur la banquise (attention, ça glisse vraiment).`;
  }
}

// Interactions filtres (fun)
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-filter]");
  if (!btn) return;
  const type = btn.getAttribute("data-filter");
  alert(`Filtre “${type}” activé. Les résultats seront encore plus givrés.`);
});

