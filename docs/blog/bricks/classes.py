# Classes globais do blog. Cada entrada vira uma classe do Bricks com o CSS no campo da própria classe.
import hashlib

def cid(name):
    return "s" + hashlib.md5(name.encode()).hexdigest()[:5]

C = {}

# ── Layout ──────────────────────────────────────────────────
C["sb-section"] = """.sb-section {
  width: 100%;
  padding-block: var(--section-y);
  padding-inline: var(--gutter);
}"""

C["sb-section--tight"] = """.sb-section--tight {
  padding-block: clamp(2rem, 1.4rem + 2.4vw, 3.5rem);
}"""

C["sb-section--muted"] = """.sb-section--muted {
  background-color: var(--ink-50);
  border-top: 1px solid var(--ink-200);
}"""

C["sb-container"] = """.sb-container {
  width: 100%;
  max-width: var(--container-page);
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--space-xl);
}"""

C["sb-container--article"] = """.sb-container--article {
  max-width: var(--container-article);
}"""

C["sb-section-head"] = """.sb-section-head {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-m);
  flex-wrap: wrap;
  padding-bottom: var(--space-m);
  border-bottom: 1px solid var(--ink-200);
}"""

# Grade de agenda: a textura de células do sistema "Turno Aberto", sumindo para baixo.
C["sb-grid-bg"] = """.sb-grid-bg {
  position: relative;
  isolation: isolate;
}
.sb-grid-bg::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background-image:
    linear-gradient(to right, var(--ink-200) 1px, transparent 1px),
    linear-gradient(to bottom, var(--ink-200) 1px, transparent 1px);
  background-size: 56px 56px;
  background-position: center top;
  -webkit-mask-image: linear-gradient(to bottom, rgb(0 0 0 / 0.7), transparent 80%);
  mask-image: linear-gradient(to bottom, rgb(0 0 0 / 0.7), transparent 80%);
}"""

# ── Tipografia ──────────────────────────────────────────────
C["sb-eyebrow"] = """.sb-eyebrow {
  display: inline-flex;
  align-items: center;
  margin: 0;
  font-size: var(--text-label);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: var(--tracking-label);
  text-transform: uppercase;
  color: var(--brand-600);
}
.sb-eyebrow::before {
  content: "";
  width: 0.5rem;
  height: 0.5rem;
  margin-right: 0.5rem;
  border-radius: 2px;
  background-color: currentColor;
  flex-shrink: 0;
}"""

# O ponto do logo: o único menta da composição.
C["sb-eyebrow--mint"] = """.sb-eyebrow--mint::before {
  border-radius: 50%;
  background-color: var(--mint-400);
}"""

C["sb-display"] = """.sb-display {
  margin: 0;
  max-width: 18ch;
  font-size: var(--text-display);
  font-weight: 700;
  line-height: 1.08;
  letter-spacing: var(--tracking-display);
  color: var(--ink-900);
  text-wrap: balance;
}"""

C["sb-h1"] = """.sb-h1 {
  margin: 0;
  max-width: 24ch;
  font-size: var(--text-h1);
  font-weight: 700;
  line-height: 1.12;
  letter-spacing: var(--tracking-display);
  color: var(--ink-900);
  text-wrap: balance;
}"""

C["sb-h2"] = """.sb-h2 {
  margin: 0;
  font-size: var(--text-h2);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: var(--tracking-h2);
  color: var(--ink-900);
  text-wrap: balance;
}"""

C["sb-lead"] = """.sb-lead {
  margin: 0;
  max-width: 60ch;
  font-size: var(--text-lead);
  line-height: 1.6;
  color: var(--ink-600);
  text-wrap: pretty;
}"""

C["sb-meta"] = """.sb-meta {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem 0.5rem;
  font-size: var(--text-small);
  line-height: 1.4;
  color: var(--ink-500);
}
.sb-meta > * + *::before {
  content: "·";
  margin-right: 0.5rem;
  color: var(--ink-300);
}"""

# ── Ações ───────────────────────────────────────────────────
C["sb-btn"] = """.sb-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 44px;
  padding: 0 1.25rem;
  border: 1px solid transparent;
  border-radius: var(--radius-control);
  font-size: 0.9375rem;
  font-weight: 700;
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color var(--duration-fast) ease, border-color var(--duration-fast) ease, color var(--duration-fast) ease, transform var(--duration-fast) ease;
}
.sb-btn:active {
  transform: translateY(1px);
}
.sb-btn svg,
.sb-btn i {
  width: 1em;
  height: 1em;
  font-size: 1em;
  transition: transform var(--duration-base) var(--ease-out);
}
.sb-btn:hover svg,
.sb-btn:hover i {
  transform: translateX(3px);
}"""

C["sb-btn--primary"] = """.sb-btn--primary {
  background-color: var(--brand-600);
  color: var(--white);
}
.sb-btn--primary:hover {
  background-color: var(--brand-500);
  color: var(--white);
}"""

C["sb-btn--secondary"] = """.sb-btn--secondary {
  background-color: var(--white);
  border-color: var(--ink-300);
  color: var(--ink-900);
}
.sb-btn--secondary:hover {
  background-color: var(--ink-50);
  border-color: var(--ink-400);
  color: var(--ink-900);
}"""

C["sb-btn--inverse"] = """.sb-btn--inverse {
  background-color: var(--white);
  color: var(--brand-700);
}
.sb-btn--inverse:hover {
  background-color: var(--brand-50);
  color: var(--brand-800);
}"""

C["sb-btn--ghost-inverse"] = """.sb-btn--ghost-inverse {
  background-color: transparent;
  border-color: rgb(255 255 255 / 0.32);
  color: var(--white);
}
.sb-btn--ghost-inverse:hover {
  background-color: rgb(255 255 255 / 0.08);
  border-color: rgb(255 255 255 / 0.6);
  color: var(--white);
}"""

C["sb-link-arrow"] = """.sb-link-arrow {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--brand-600);
  text-decoration: none;
}
.sb-link-arrow:hover {
  color: var(--brand-700);
}
.sb-link-arrow .icon,
.sb-link-arrow svg,
.sb-link-arrow i {
  display: inline-flex;
  width: 1em;
  height: 1em;
  font-size: 1em;
  transition: transform var(--duration-base) var(--ease-out);
}
.sb-link-arrow:hover .icon,
.sb-link-arrow:hover svg,
.sb-link-arrow:hover i {
  transform: translateX(3px);
}"""

# ── Cabeçalho ───────────────────────────────────────────────
C["sb-header"] = """#brx-header:has(.sb-header) {
  position: sticky;
  top: var(--wp-admin--admin-bar--height, 0px);
  z-index: 999;
}
.sb-header {
  width: 100%;
  padding-inline: var(--gutter);
  background-color: rgb(255 255 255 / 0.97);
  border-bottom: 1px solid var(--ink-200);
}"""

C["sb-header__inner"] = """.sb-header__inner {
  width: 100%;
  max-width: var(--container-page);
  min-height: var(--header-h);
  margin-inline: auto;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-m);
}"""

C["sb-brand"] = """.sb-brand {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.625rem;
  width: auto;
  flex-shrink: 0;
}"""

C["sb-brand__logo"] = """.sb-brand__logo {
  display: inline-flex;
  line-height: 0;
}
.sb-brand__logo img {
  width: auto;
  height: 26px;
}"""

C["sb-brand__tag"] = """.sb-brand__tag {
  margin: 0;
  padding: 0.3125rem 0.5rem 0.25rem;
  border-radius: var(--radius-pill);
  background-color: var(--brand-50);
  font-size: 0.6875rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: var(--tracking-label);
  text-transform: uppercase;
  color: var(--brand-700);
  text-decoration: none;
}"""

C["sb-nav"] = """.sb-nav {
  margin-left: auto;
}
.sb-nav .bricks-nav-menu {
  gap: 0.25rem;
}
.sb-nav .bricks-nav-menu > li > a {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  padding: 0 0.875rem;
  border-radius: var(--radius-control);
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--ink-700);
  transition: background-color var(--duration-fast) ease, color var(--duration-fast) ease;
}
.sb-nav .bricks-nav-menu > li > a:hover {
  background-color: var(--ink-100);
  color: var(--ink-900);
}
.sb-nav .bricks-nav-menu > li.current-menu-item > a,
.sb-nav .bricks-nav-menu > li.current-category-ancestor > a,
.sb-nav .bricks-nav-menu > li > a[aria-current="page"] {
  background-color: var(--brand-50);
  color: var(--brand-700);
}
.sb-nav .bricks-mobile-menu-toggle {
  color: var(--ink-900);
}
.sb-nav .bricks-mobile-menu-wrapper {
  background-color: var(--white);
  padding: calc(var(--header-h) + 1rem) var(--gutter) 2rem;
}
.sb-nav .bricks-mobile-menu > li > a {
  display: block;
  padding: 0.875rem 0;
  border-bottom: 1px solid var(--ink-200);
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--ink-900);
}
.sb-nav .bricks-mobile-menu-overlay {
  background-color: rgb(16 24 40 / 0.4);
}"""

C["sb-header__actions"] = """.sb-header__actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
  width: auto;
  flex-shrink: 0;
}
@media (max-width: 767px) {
  .sb-header__actions .sb-btn.brxe-button {
    display: none;
  }
}"""

C["sb-search-toggle"] = """.sb-search-toggle .toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-control);
  color: var(--ink-700);
  font-size: 1.125rem;
  transition: background-color var(--duration-fast) ease, color var(--duration-fast) ease;
}
.sb-search-toggle .toggle:hover {
  background-color: var(--ink-100);
  color: var(--ink-900);
}
.sb-search-toggle .bricks-search-overlay {
  background-color: rgb(255 255 255 / 0.97);
}
.sb-search-toggle .bricks-search-overlay .title {
  margin: 0 0 1.25rem;
  font-size: var(--text-h2);
  font-weight: 700;
  letter-spacing: var(--tracking-h2);
  color: var(--ink-900);
}
.sb-search-toggle .bricks-search-overlay input[type="search"] {
  height: 56px;
  padding: 0 1.25rem;
  border: 1px solid var(--ink-300);
  border-radius: var(--radius-control);
  background-color: var(--white);
  font-size: 1.125rem;
  color: var(--ink-900);
}
.sb-search-toggle .bricks-search-overlay input[type="search"]:focus {
  border-color: var(--brand-600);
  box-shadow: 0 0 0 4px var(--brand-100);
  outline: none;
}
.sb-search-toggle .bricks-search-overlay .close {
  color: var(--ink-700);
}"""

# ── Busca (campo) ───────────────────────────────────────────
C["sb-search"] = """.sb-search {
  width: 100%;
}
.sb-search form {
  position: relative;
  display: flex;
  width: 100%;
}
.sb-search input[type="search"] {
  width: 100%;
  height: 52px;
  padding: 0 3.5rem 0 1.125rem;
  border: 1px solid var(--ink-300);
  border-radius: var(--radius-control);
  background-color: var(--white);
  box-shadow: var(--shadow-xs);
  font-family: inherit;
  font-size: 1rem;
  color: var(--ink-900);
  transition: border-color var(--duration-fast) ease, box-shadow var(--duration-fast) ease;
}
.sb-search input[type="search"]::placeholder {
  color: var(--ink-400);
}
.sb-search input[type="search"]:focus {
  border-color: var(--brand-600);
  box-shadow: 0 0 0 4px var(--brand-100);
  outline: none;
}
.sb-search button {
  position: absolute;
  top: 4px;
  right: 4px;
  bottom: 4px;
  width: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 6px;
  background-color: var(--brand-600);
  color: var(--white);
  font-size: 1.0625rem;
  cursor: pointer;
  transition: background-color var(--duration-fast) ease;
}
.sb-search button:hover {
  background-color: var(--brand-500);
}"""

# ── Chips de tema ───────────────────────────────────────────
C["sb-chips"] = """.sb-chips {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 0.5rem;
}"""

C["sb-chip"] = """.sb-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  min-height: 36px;
  padding: 0 0.875rem;
  border: 1px solid var(--ink-200);
  border-radius: var(--radius-pill);
  background-color: var(--white);
  font-size: var(--text-small);
  font-weight: 700;
  line-height: 1;
  color: var(--ink-700);
  text-decoration: none;
  transition: border-color var(--duration-fast) ease, background-color var(--duration-fast) ease, color var(--duration-fast) ease;
}
.sb-chip:hover {
  border-color: var(--brand-300);
  background-color: var(--brand-50);
  color: var(--brand-700);
}"""

C["sb-tags"] = """.sb-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.sb-tags li {
  margin: 0;
}
.sb-tags .bricks-button {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 0.75rem;
  border: 1px solid var(--ink-200);
  border-radius: var(--radius-pill);
  background-color: var(--white);
  font-size: var(--text-small);
  font-weight: 700;
  line-height: 1;
  color: var(--ink-700);
  transition: border-color var(--duration-fast) ease, background-color var(--duration-fast) ease, color var(--duration-fast) ease;
}
.sb-tags .bricks-button::before {
  content: "#";
  margin-right: 0.125rem;
  color: var(--ink-400);
}
.sb-tags .bricks-button:hover {
  border-color: var(--brand-300);
  background-color: var(--brand-50);
  color: var(--brand-700);
}"""

# Categoria como rótulo (sem cara de botão).
C["sb-cat"] = """.sb-cat {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.sb-cat li {
  margin: 0;
}
.sb-cat .bricks-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0;
  min-height: 0;
  border: 0;
  background: none;
  font-size: var(--text-label);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: var(--tracking-label);
  text-transform: uppercase;
  color: var(--brand-600);
}
.sb-cat .bricks-button::before {
  content: "";
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 2px;
  background-color: currentColor;
}
.sb-cat .bricks-button:hover {
  color: var(--brand-800);
}"""

# ── Masthead da página inicial ──────────────────────────────
C["sb-masthead"] = """.sb-masthead {
  width: 100%;
  padding-top: clamp(3rem, 2rem + 4vw, 5.5rem);
  padding-bottom: clamp(2.5rem, 2rem + 2vw, 3.5rem);
  padding-inline: var(--gutter);
}"""

C["sb-masthead__grid"] = """.sb-masthead__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
  align-items: end;
  gap: var(--space-xl) clamp(2rem, 1rem + 4vw, 5rem);
}"""

C["sb-stack"] = """.sb-stack {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.25rem;
}"""

C["sb-stack--s"] = """.sb-stack--s {
  gap: 0.75rem;
}"""

C["sb-panel"] = """.sb-panel {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: clamp(1.25rem, 1rem + 1vw, 1.75rem);
  border: 1px solid var(--ink-200);
  border-radius: var(--radius-panel);
  background-color: var(--white);
  box-shadow: var(--shadow-raised);
}"""

C["sb-panel__label"] = """.sb-panel__label {
  margin: 0;
  font-size: var(--text-small);
  font-weight: 700;
  color: var(--ink-900);
}"""

# ── Grade de posts e cartão ─────────────────────────────────
C["sb-post-grid"] = """.sb-post-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(2.5rem, 2rem + 1.5vw, 3.5rem) clamp(1.25rem, 0.8rem + 1.5vw, 2rem);
  width: 100%;
}"""

# Na primeira página da home, o post mais recente abre a grade em largura total.
C["sb-post-grid--lead"] = """body:not(.paged) .sb-post-grid--lead > .sb-card:first-child {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  align-items: center;
  gap: clamp(1.5rem, 1rem + 3vw, 4rem);
  padding-bottom: clamp(2.5rem, 2rem + 1.5vw, 3.5rem);
  border-bottom: 1px solid var(--ink-200);
}
body:not(.paged) .sb-post-grid--lead > .sb-card:first-child .sb-card__media {
  aspect-ratio: 16 / 10;
  border-radius: var(--radius-panel);
}
body:not(.paged) .sb-post-grid--lead > .sb-card:first-child .sb-card__body {
  gap: 1rem;
}
body:not(.paged) .sb-post-grid--lead > .sb-card:first-child .sb-card__title {
  font-size: var(--text-h1);
  line-height: 1.12;
  letter-spacing: var(--tracking-display);
}
body:not(.paged) .sb-post-grid--lead > .sb-card:first-child .sb-card__excerpt {
  font-size: var(--text-lead);
  -webkit-line-clamp: 4;
}
@media (max-width: 991px) {
  body:not(.paged) .sb-post-grid--lead > .sb-card:first-child {
    grid-template-columns: minmax(0, 1fr);
  }
}"""

C["sb-card"] = """.sb-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1.125rem;
  width: 100%;
  min-width: 0;
}"""

C["sb-card__media"] = """.sb-card__media {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  border-radius: var(--radius-card);
  background-color: var(--brand-50);
  transition: transform var(--duration-base) var(--ease-out), box-shadow var(--duration-base) var(--ease-out);
}
.sb-card:hover .sb-card__media {
  transform: translateY(-3px);
  box-shadow: var(--shadow-raised);
}"""

C["sb-card__body"] = """.sb-card__body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.625rem;
  width: 100%;
}"""

C["sb-card__title"] = """.sb-card__title {
  margin: 0;
  font-size: var(--text-h3);
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.01em;
  color: var(--ink-900);
  text-wrap: balance;
}
.sb-card__title a {
  color: inherit;
  text-decoration: none;
  transition: color var(--duration-fast) ease;
}
.sb-card__title a::after {
  content: "";
  position: absolute;
  inset: 0;
}
.sb-card:hover .sb-card__title a {
  color: var(--brand-600);
}
.sb-card__title a:focus-visible {
  outline: none;
}
.sb-card:has(.sb-card__title a:focus-visible) {
  outline: 2px solid var(--brand-600);
  outline-offset: 6px;
  border-radius: var(--radius-card);
}"""

C["sb-card__excerpt"] = """.sb-card__excerpt {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--ink-600);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}"""

C["sb-pagination"] = """.sb-pagination {
  width: 100%;
}
.sb-pagination .page-numbers {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.sb-pagination li {
  margin: 0;
}
.sb-pagination a.page-numbers,
.sb-pagination span.page-numbers {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  height: 44px;
  padding: 0 0.875rem;
  border: 1px solid var(--ink-200);
  border-radius: var(--radius-control);
  background-color: var(--white);
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--ink-700);
  transition: background-color var(--duration-fast) ease, border-color var(--duration-fast) ease, color var(--duration-fast) ease;
}
.sb-pagination a.page-numbers:hover {
  border-color: var(--ink-300);
  background-color: var(--ink-50);
  color: var(--ink-900);
}
.sb-pagination span.page-numbers.current {
  border-color: var(--brand-600);
  background-color: var(--brand-600);
  color: var(--white);
}
.sb-pagination span.page-numbers.dots {
  border-color: transparent;
  background: none;
}"""

C["sb-empty"] = """.sb-empty {
  width: 100%;
  padding: clamp(2rem, 1.5rem + 2vw, 3rem);
  border: 1px dashed var(--ink-300);
  border-radius: var(--radius-panel);
  background-color: var(--ink-50);
  font-size: 1rem;
  line-height: 1.6;
  color: var(--ink-600);
  text-align: center;
}"""

# ── Chamada para anunciar ───────────────────────────────────
C["sb-cta"] = """.sb-cta {
  width: 100%;
  padding-top: clamp(0.5rem, 0.2rem + 1.2vw, 1.5rem);
  padding-bottom: var(--section-y);
  padding-inline: var(--gutter);
}"""

C["sb-cta__panel"] = """.sb-cta__panel {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  width: 100%;
  max-width: var(--container-page);
  margin-inline: auto;
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) auto;
  align-items: center;
  gap: var(--space-l);
  padding: clamp(2rem, 1.2rem + 3.4vw, 4rem);
  border-radius: var(--radius-panel);
  background-color: var(--brand-600);
  box-shadow: var(--shadow-brand);
  color: var(--white);
}
.sb-cta__panel::before {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 55%;
  z-index: -1;
  background-image:
    linear-gradient(to right, var(--brand-600) 6px, transparent 6px),
    linear-gradient(to bottom, var(--brand-600) 6px, transparent 6px);
  background-color: var(--brand-500);
  background-size: 30px 30px;
  background-position: -3px -3px;
  -webkit-mask-image: linear-gradient(to left, rgb(0 0 0 / 0.55), transparent 85%);
  mask-image: linear-gradient(to left, rgb(0 0 0 / 0.55), transparent 85%);
}
@media (max-width: 767px) {
  .sb-cta__panel::before {
    width: 100%;
    -webkit-mask-image: linear-gradient(to top, rgb(0 0 0 / 0.45), transparent 70%);
    mask-image: linear-gradient(to top, rgb(0 0 0 / 0.45), transparent 70%);
  }
}"""

C["sb-cta__eyebrow"] = """.sb-cta__eyebrow {
  color: var(--brand-100);
}"""

C["sb-cta__title"] = """.sb-cta__title {
  margin: 0;
  max-width: 22ch;
  font-size: var(--text-h2);
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: var(--tracking-h2);
  color: var(--white);
  text-wrap: balance;
}"""

C["sb-cta__text"] = """.sb-cta__text {
  margin: 0;
  max-width: 52ch;
  font-size: 1.0625rem;
  line-height: 1.6;
  color: var(--brand-100);
}"""

C["sb-actions"] = """.sb-actions {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  width: auto;
}"""

# ── Cabeçalho de arquivo e busca ────────────────────────────
C["sb-archive-head"] = """.sb-archive-head {
  width: 100%;
  padding-top: clamp(2.5rem, 1.8rem + 3vw, 4.5rem);
  padding-bottom: clamp(2rem, 1.6rem + 1.6vw, 3rem);
  padding-inline: var(--gutter);
  border-bottom: 1px solid var(--ink-200);
}"""

C["sb-archive-head__grid"] = """.sb-archive-head__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 22rem);
  align-items: end;
  gap: var(--space-l) var(--space-2xl);
}"""

C["sb-breadcrumbs"] = """.sb-breadcrumbs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--text-small);
  line-height: 1.4;
  color: var(--ink-500);
}
.sb-breadcrumbs a {
  color: var(--ink-600);
  text-decoration: none;
}
.sb-breadcrumbs a:hover {
  color: var(--brand-600);
}
.sb-breadcrumbs .separator {
  color: var(--ink-300);
}
.sb-breadcrumbs [aria-current="page"] {
  max-width: 40ch;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--ink-900);
}"""

C["sb-count"] = """.sb-count {
  margin: 0;
  font-size: var(--text-small);
  font-weight: 700;
  color: var(--ink-500);
}"""

# ── Post individual ─────────────────────────────────────────
C["sb-progress"] = """.sb-progress {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
  width: 100%;
  height: 3px;
  border: 0;
  background: transparent;
  color: var(--brand-600);
  -webkit-appearance: none;
  appearance: none;
}
.sb-progress::-webkit-progress-bar {
  background: transparent;
}
.sb-progress::-webkit-progress-value {
  background-color: var(--brand-600);
}
.sb-progress::-moz-progress-bar {
  background-color: var(--brand-600);
}"""

C["sb-article-head"] = """.sb-article-head {
  width: 100%;
  padding-top: clamp(2rem, 1.4rem + 2.6vw, 4rem);
  padding-bottom: clamp(1.5rem, 1.2rem + 1.4vw, 2.5rem);
  padding-inline: var(--gutter);
}"""

C["sb-article-title"] = """.sb-article-title {
  margin: 0;
  max-width: 22ch;
  font-size: clamp(2.125rem, 1.5rem + 2.6vw, 3rem);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: var(--tracking-display);
  color: var(--ink-900);
  text-wrap: balance;
}"""

C["sb-article-lead"] = """.sb-article-lead {
  margin: 0;
  max-width: 62ch;
  font-size: var(--text-lead);
  line-height: 1.6;
  color: var(--ink-600);
}
.sb-article-lead p {
  margin: 0;
}"""

C["sb-byline"] = """.sb-byline {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem 1.25rem;
  width: 100%;
  padding-top: 1.25rem;
  border-top: 1px solid var(--ink-200);
}
.sb-byline .brxe-post-author {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}
.sb-byline .avatar,
.sb-byline img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
}
.sb-byline .post-author-name,
.sb-byline .author-name {
  margin: 0;
  font-size: var(--text-small);
  font-weight: 700;
  color: var(--ink-900);
}"""

C["sb-article-cover"] = """.sb-article-cover {
  width: 100%;
  padding-inline: var(--gutter);
}"""

C["sb-article-cover__img"] = """.sb-article-cover__img {
  display: block;
  width: 100%;
  max-width: 70rem;
  height: auto;
  margin-inline: auto;
  aspect-ratio: 2 / 1;
  object-fit: cover;
  border-radius: var(--radius-panel);
  background-color: var(--brand-50);
}"""

C["sb-article-body"] = """.sb-article-body {
  width: 100%;
  padding-top: clamp(2.5rem, 2rem + 2vw, 4rem);
  padding-bottom: var(--section-y);
  padding-inline: var(--gutter);
}"""

C["sb-article-layout"] = """.sb-article-layout {
  width: 100%;
  max-width: var(--container-page);
  margin-inline: auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, var(--container-text)) minmax(0, 1fr);
  column-gap: clamp(2rem, 1rem + 3vw, 4rem);
  align-items: start;
}
.sb-article-layout > .sb-article-main {
  grid-column: 2;
}
@media (min-width: 992px) and (max-width: 1100px) {
  .sb-article-layout.sb-article-layout.sb-article-layout {
    grid-template-columns: minmax(0, 14rem) minmax(0, var(--container-text));
    justify-content: center;
  }
}
@media (max-width: 991px) {
  .sb-article-layout > .sb-article-main {
    grid-column: 1;
  }
}"""

C["sb-article-aside"] = """.sb-article-aside {
  grid-column: 1;
  grid-row: 1;
  position: sticky;
  top: calc(var(--header-h) + 2rem);
  justify-self: end;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
  max-width: 15rem;
}"""

C["sb-aside-label"] = """.sb-aside-label {
  margin: 0 0 0.75rem;
  font-size: var(--text-label);
  font-weight: 700;
  letter-spacing: var(--tracking-label);
  text-transform: uppercase;
  color: var(--ink-900);
}"""

C["sb-toc"] = """.sb-toc {
  width: 100%;
}
.sb-toc .toc-list {
  margin: 0;
  padding: 0;
  list-style: none;
}
.sb-toc .toc-list .toc-list {
  padding-left: 0.75rem;
}
.sb-toc .toc-list-item {
  margin: 0;
}
.sb-toc .toc-link {
  display: block;
  padding: 0.4375rem 0 0.4375rem 0.875rem;
  border-left: 2px solid var(--ink-200);
  font-size: var(--text-small);
  line-height: 1.4;
  color: var(--ink-500);
  text-decoration: none;
  transition: color var(--duration-fast) ease, border-color var(--duration-fast) ease;
}
.sb-toc .toc-link::before {
  display: none;
}
.sb-toc .toc-link:hover {
  color: var(--ink-900);
}
.sb-toc .toc-link.is-active-link {
  border-left-color: var(--brand-600);
  font-weight: 700;
  color: var(--brand-700);
}"""

C["sb-share"] = """.sb-share {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.sb-share li {
  margin: 0;
  background: none;
}
.sb-share a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid var(--ink-200);
  border-radius: var(--radius-control);
  background-color: var(--white);
  color: var(--ink-700);
  transition: border-color var(--duration-fast) ease, background-color var(--duration-fast) ease, color var(--duration-fast) ease;
}
.sb-share a:hover {
  border-color: var(--brand-300);
  background-color: var(--brand-50);
  color: var(--brand-700);
}
.sb-share svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
}"""

C["sb-article-main"] = """.sb-article-main {
  display: flex;
  flex-direction: column;
  gap: 3rem;
  width: 100%;
  min-width: 0;
}"""

# Tipografia de leitura: 720px de medida, entrelinha generosa.
C["sb-prose"] = """.sb-prose {
  width: 100%;
  font-size: var(--text-prose);
  line-height: 1.75;
  color: var(--ink-700);
}
.sb-prose > * {
  margin-top: 0;
  margin-bottom: 0;
}
.sb-prose > * + * {
  margin-top: 1.25em;
}
.sb-prose h2,
.sb-prose h3,
.sb-prose h4 {
  scroll-margin-top: calc(var(--header-h) + 1.5rem);
  font-weight: 700;
  color: var(--ink-900);
  text-wrap: balance;
}
.sb-prose h2 {
  margin-top: 2.25em;
  font-size: clamp(1.5rem, 1.3rem + 0.8vw, 1.875rem);
  line-height: 1.2;
  letter-spacing: var(--tracking-h2);
}
.sb-prose h3 {
  margin-top: 1.75em;
  font-size: clamp(1.25rem, 1.15rem + 0.4vw, 1.4375rem);
  line-height: 1.3;
  letter-spacing: -0.01em;
}
.sb-prose h4 {
  margin-top: 1.5em;
  font-size: 1.125rem;
  line-height: 1.35;
}
.sb-prose h2 + *,
.sb-prose h3 + *,
.sb-prose h4 + * {
  margin-top: 0.75em;
}
.sb-prose a {
  color: var(--brand-600);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
  text-decoration-color: var(--brand-300);
  transition: text-decoration-color var(--duration-fast) ease, color var(--duration-fast) ease;
}
.sb-prose a:hover {
  color: var(--brand-700);
  text-decoration-color: currentColor;
}
.sb-prose strong,
.sb-prose b {
  font-weight: 700;
  color: var(--ink-900);
}
.sb-prose ul,
.sb-prose ol {
  padding-left: 1.375em;
}
.sb-prose li + li {
  margin-top: 0.5em;
}
.sb-prose li::marker {
  color: var(--brand-600);
  font-weight: 700;
}
.sb-prose blockquote {
  margin-inline: 0;
  padding: 0.25em 0 0.25em 1.25em;
  border-left: 3px solid var(--brand-600);
  font-size: 1.1875em;
  line-height: 1.55;
  color: var(--ink-900);
}
.sb-prose blockquote p {
  margin: 0;
}
.sb-prose img {
  display: block;
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-card);
}
.sb-prose figure {
  margin-inline: 0;
}
.sb-prose figcaption {
  margin-top: 0.75em;
  font-size: var(--text-small);
  line-height: 1.5;
  color: var(--ink-500);
  text-align: center;
}
.sb-prose hr {
  margin-block: 2.5em;
  border: 0;
  border-top: 1px solid var(--ink-200);
}
.sb-prose table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9375em;
  line-height: 1.5;
}
.sb-prose th,
.sb-prose td {
  padding: 0.75em 1em;
  border-bottom: 1px solid var(--ink-200);
  text-align: left;
  vertical-align: top;
}
.sb-prose th {
  background-color: var(--ink-50);
  font-weight: 700;
  color: var(--ink-900);
}
.sb-prose .wp-block-table {
  overflow-x: auto;
}"""

C["sb-article-foot"] = """.sb-article-foot {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  padding-top: 2rem;
  border-top: 1px solid var(--ink-200);
}"""

C["sb-row"] = """.sb-row {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
}"""

C["sb-inline-label"] = """.sb-inline-label {
  margin: 0;
  font-size: var(--text-small);
  font-weight: 700;
  color: var(--ink-900);
}"""

# Compartilhar no fim do texto: só aparece quando a lateral some.
C["sb-mobile-only"] = """.sb-mobile-only {
  display: none;
}"""

# ── Rodapé ──────────────────────────────────────────────────
C["sb-footer"] = """.sb-footer {
  width: 100%;
  padding-top: clamp(3.5rem, 2.8rem + 3vw, 5rem);
  padding-bottom: 2rem;
  padding-inline: var(--gutter);
  background-color: var(--brand-900);
  color: var(--brand-200);
}"""

C["sb-footer__grid"] = """.sb-footer__grid {
  width: 100%;
  max-width: var(--container-page);
  margin-inline: auto;
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) repeat(3, minmax(0, 1fr));
  gap: 2.5rem 2rem;
}
@media (max-width: 991px) {
  .sb-footer__grid > :first-child {
    grid-column: 1 / -1;
  }
}"""

C["sb-footer__brand"] = """.sb-footer__brand {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.25rem;
}
.sb-footer__brand img {
  width: auto;
  height: 30px;
}"""

C["sb-footer__text"] = """.sb-footer__text {
  margin: 0;
  max-width: 34ch;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--brand-200);
}"""

C["sb-footer__col"] = """.sb-footer__col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
}"""

C["sb-footer__title"] = """.sb-footer__title {
  margin: 0 0 0.25rem;
  font-size: var(--text-label);
  font-weight: 700;
  letter-spacing: var(--tracking-label);
  text-transform: uppercase;
  color: var(--brand-300);
}"""

C["sb-footer__link"] = """.sb-footer__link {
  font-size: 0.9375rem;
  line-height: 1.4;
  color: var(--brand-100);
  text-decoration: none;
  transition: color var(--duration-fast) ease;
}
.sb-footer__link:hover {
  color: var(--white);
}"""

C["sb-footer__bottom"] = """.sb-footer__bottom {
  width: 100%;
  max-width: var(--container-page);
  margin: 3rem auto 0;
  padding-top: 1.5rem;
  border-top: 1px solid rgb(255 255 255 / 0.12);
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem 1.5rem;
  font-size: var(--text-small);
  color: var(--brand-300);
}"""

C["sb-footer__legal"] = """.sb-footer__legal {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 0.5rem 1.5rem;
  width: auto;
}"""

# ── 404 ─────────────────────────────────────────────────────
C["sb-error"] = """.sb-error {
  width: 100%;
  min-height: 70vh;
  display: flex;
  align-items: center;
  padding-block: var(--section-y);
  padding-inline: var(--gutter);
}"""

C["sb-error__code"] = """.sb-error__code {
  margin: 0;
  font-size: clamp(6rem, 3rem + 14vw, 11rem);
  font-weight: 700;
  line-height: 0.85;
  letter-spacing: -0.045em;
  color: var(--brand-600);
}
.sb-error__code::after {
  content: "";
  display: inline-block;
  width: 0.15em;
  height: 0.15em;
  margin-left: 0.04em;
  border-radius: 50%;
  background-color: var(--mint-400);
}"""

C["sb-error__box"] = """.sb-error__box {
  width: 100%;
  max-width: 34rem;
}"""

C["sb-related-head"] = """.sb-related-head {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}"""

ID = {n: cid(n) for n in C}
assert len(set(ID.values())) == len(ID)

# A linha de tags some quando o post não tem tags (o Bricks não renderiza a lista vazia).
C["sb-tags-row"] = """.sb-tags-row:not(:has(.sb-tags)) {
  display: none;
}"""

ID = {n: cid(n) for n in C}
