const repoUser = "waleed-code360";
const projectList = document.querySelector("#project-list");
const glow = document.querySelector(".cursor-glow");
const sections = [...document.querySelectorAll(".content-section")];
const navLinks = [...document.querySelectorAll(".section-nav a")];

window.addEventListener("pointermove", (event) => {
  if (!glow) return;
  glow.style.setProperty("--x", `${event.clientX}px`);
  glow.style.setProperty("--y", `${event.clientY}px`);
});

const observer = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;

    navLinks.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `#${visible.target.id}`);
    });
  },
  { rootMargin: "-25% 0px -55% 0px", threshold: [0.2, 0.4, 0.6] }
);

sections.forEach((section) => observer.observe(section));

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(dateString) {
  try {
    return new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(new Date(dateString));
  } catch {
    return "Recent";
  }
}

function formatProjectName(name = "") {
  return name
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getRepoPreviewUrl(repo) {
  const stamp = String(repo.updated_at || repo.name || "portfolio").replace(/\W/g, "");
  return `https://opengraph.githubassets.com/${stamp}/${repoUser}/${encodeURIComponent(repo.name)}`;
}

function buildFallbackVisual(repo) {
  const title = escapeHtml(formatProjectName(repo.name));
  const language = escapeHtml(repo.language || "Project");

  return `
    <div class="project-visual-fallback" aria-hidden="true">
      <span>${language}</span>
      <strong>${title}</strong>
    </div>
  `;
}

function buildProjectCard(repo) {
  const title = formatProjectName(repo.name);
  const description = repo.description || "A public GitHub project by Waleed Sohail.";
  const language = repo.language || "Code";
  const topics = Array.isArray(repo.topics) && repo.topics.length ? repo.topics.slice(0, 5) : [language];
  const liveLink = repo.homepage && repo.homepage.startsWith("http") ? repo.homepage : repo.html_url;
  const sourceLink = repo.html_url;
  const previewUrl = getRepoPreviewUrl(repo);

  return `
    <article class="project-card">
      <a class="project-visual" href="${escapeHtml(liveLink)}" target="_blank" rel="noreferrer" aria-label="Open ${escapeHtml(title)}">
        <img
          src="${escapeHtml(previewUrl)}"
          alt="${escapeHtml(title)} project preview"
          loading="lazy"
          onerror="this.closest('.project-visual').innerHTML = this.closest('.project-visual').dataset.fallback"
        />
      </a>

      <a href="${escapeHtml(liveLink)}" target="_blank" rel="noreferrer">
        <p class="project-meta">Updated ${escapeHtml(formatDate(repo.updated_at))}</p>
        <h3>${escapeHtml(title)} <span aria-hidden="true">↗</span></h3>
        <p>${escapeHtml(description)}</p>
      </a>

      <div class="project-footer">
        <ul class="pill-list" aria-label="Project tags">
          ${topics.map((topic) => `<li>${escapeHtml(topic)}</li>`).join("")}
        </ul>
        <a class="muted" href="${escapeHtml(sourceLink)}" target="_blank" rel="noreferrer">GitHub</a>
      </div>
    </article>
  `.replace('<a class="project-visual"', `<a class="project-visual" data-fallback="${escapeHtml(buildFallbackVisual(repo))}"`);
}

async function loadProjects() {
  if (!projectList) return;

  try {
    const response = await fetch(`https://api.github.com/users/${repoUser}/repos?sort=updated&per_page=100`);

    if (!response.ok) {
      throw new Error("GitHub response was not OK");
    }

    const repos = await response.json();
    const publicRepos = repos.filter((repo) => !repo.fork);
    const portfolioRepos = publicRepos.filter((repo) => Array.isArray(repo.topics) && repo.topics.includes("portfolio"));
    const selectedRepos = portfolioRepos.length ? portfolioRepos : publicRepos;

    if (!selectedRepos.length) {
      projectList.innerHTML = `<p class="muted">No public projects found yet. Add a GitHub repo and refresh this page.</p>`;
      return;
    }

    projectList.innerHTML = selectedRepos.map(buildProjectCard).join("");
  } catch (error) {
    projectList.innerHTML = `
      <p class="muted">Projects could not load right now. You can still view them on GitHub.</p>
      <a class="button ghost" href="https://github.com/${repoUser}" target="_blank" rel="noreferrer">Open GitHub</a>
    `;
  }
}

loadProjects();
