# Árvores de elementos dos templates do blog. Elementos nativos do Bricks; estilo só por classe global.
import hashlib, itertools
from classes import ID

HOME = "https://blog.subleasy.com.br/"
SITE = "https://subleasy.com.br/"
ARROW = {"library": "themify", "icon": "ti-arrow-right"}
SEARCH = {"library": "themify", "icon": "ti-search"}

_seq = itertools.count()
_scope = ["x"]

def scope(name):
    _scope[0] = name

def nid():
    return hashlib.md5(f"{_scope[0]}-{next(_seq)}".encode()).hexdigest()[:6]

def el(name, cls=(), settings=None, children=(), eid=None, label=None):
    s = dict(settings or {})
    if cls:
        s["_cssGlobalClasses"] = [ID[c] for c in cls]
    e = {"id": eid or nid(), "name": name, "settings": s, "children": list(children)}
    if label:
        e["label"] = label
    return e

def text(t, cls=(), tag="p", **kw):
    return el("text-basic", cls, {"text": t, "tag": tag, **kw})

def heading(t, tag, cls=(), **kw):
    return el("heading", cls, {"text": t, "tag": tag, **kw})

def link(url):
    return {"type": "external", "url": url}

def dlink(tag):
    return {"type": "meta", "useDynamicData": tag}

def button(t, url, cls, icon=True):
    s = {"text": t, "link": link(url)}
    if icon:
        s.update({"icon": ARROW, "iconPosition": "right"})
    return el("button", cls, s)

def tlink(t, url, cls, icon=False):
    s = {"text": t, "link": link(url)}
    if icon:
        s.update({"icon": ARROW, "iconPosition": "right"})
    return el("text-link", cls, s)

def block(cls=(), children=(), tag=None, **kw):
    s = dict(kw)
    if tag:
        s["tag"] = tag
    return el("block", cls, s, children)

def section(cls, children, **kw):
    return el("section", cls, dict(kw), children)

def container(cls, children):
    return el("container", cls, {}, children)

# ── Cartão de post (repete no loop) ─────────────────────────
def card_loop(query, eid=None, title_tag="h3"):
    return el("block", ["sb-card"], {"tag": "article", "hasLoop": True, "query": query}, [
        el("image", ["sb-card__media"], {
            "image": {"useDynamicData": "{featured_image}", "size": "large"},
            "caption": "none",
        }),
        block(["sb-card__body"], [
            el("post-taxonomy", ["sb-cat"], {"taxonomy": "category"}),
            heading("{post_title}", title_tag, ["sb-card__title"], link=dlink("{post_url}")),
            text("{post_excerpt:24}", ["sb-card__excerpt"]),
            block(["sb-meta"], [text("{post_date:j M Y}", tag="span")]),
        ]),
    ], eid=eid)

MAIN_QUERY = {"objectType": "post", "post_type": ["post"], "is_archive_main_query": True,
              "orderby": "date", "order": "DESC", "no_results_text": ""}

def recent_query(n, exclude_current=False):
    q = {"objectType": "post", "post_type": ["post"], "posts_per_page": n, "orderby": "date",
         "order": "DESC", "ignore_sticky_posts": True, "disable_query_merge": True}
    if exclude_current:
        q["exclude_current_post"] = True
    return q

def term_chips(eid=None):
    return block(["sb-chips"], [
        el("block", [], {"hasLoop": True, "_width": "auto", "query": {
            "objectType": "term", "taxonomy": ["category"], "orderby": "count", "order": "DESC"}}, [
            el("text-link", ["sb-chip"], {"text": "{term_name}", "link": dlink("{term_url}")}),
        ], eid=eid),
    ])

def cta():
    return section(["sb-cta"], [
        container(["sb-cta__panel"], [
            block(["sb-stack"], [
                text("Para quem tem sala", ["sb-eyebrow", "sb-eyebrow--mint", "sb-cta__eyebrow"]),
                heading("Sua sala fica vazia em algum turno?", "h2", ["sb-cta__title"]),
                text("Anuncie grátis na Subleasy. Profissionais da sua região falam direto com você pelo WhatsApp.", ["sb-cta__text"]),
            ]),
            block(["sb-actions"], [
                button("Anunciar minha sala grátis", SITE + "anunciar/", ["sb-btn", "sb-btn--inverse"]),
                button("Procurar uma sala", SITE + "anuncios", ["sb-btn", "sb-btn--ghost-inverse"], icon=False),
            ]),
        ]),
    ])

def grid_section(loop_id, query, head_title, lead=False, count=True, extra_head=None):
    head_children = [heading(head_title, "h2", ["sb-h2"])]
    if count:
        head_children.append(text("{query_results_count:%s} artigos" % loop_id, ["sb-count"]))
    grid_cls = ["sb-post-grid", "sb-post-grid--lead"] if lead else ["sb-post-grid"]
    return section(["sb-section"], [
        container(["sb-container"], [
            block(["sb-section-head"], head_children),
            block(grid_cls, [card_loop(query, eid=loop_id)]),
            el("pagination", ["sb-pagination"], {"queryId": loop_id}),
        ]),
    ])

# ── Cabeçalho ───────────────────────────────────────────────
def header():
    scope("header")
    return [section(["sb-header"], [
        block(["sb-header__inner"], [
            block(["sb-brand"], [
                el("logo", ["sb-brand__logo"], {"logo": {"id": 5518, "url": "https://blog.subleasy.com.br/wp-content/uploads/2026/10/logo-subleasy.png", "full": "https://blog.subleasy.com.br/wp-content/uploads/2026/10/logo-subleasy.png"},
                    "logoText": "Subleasy", "logoUrl": link(HOME), "logoHeight": "26px", "logoLoading": "eager"}),
                tlink("Blog", HOME, ["sb-brand__tag"]),
            ]),
            el("nav-menu", ["sb-nav"], {"menu": 17, "mobileMenu": "tablet_portrait"}),
            block(["sb-header__actions"], [
                el("search", ["sb-search-toggle"], {"searchType": "overlay", "icon": SEARCH,
                    "ariaLabel": "Buscar no blog", "searchOverlayTitle": "O que você quer ler?",
                    "placeholder": "Ex.: consultório por hora"}),
                button("Anunciar sala", SITE + "anunciar/", ["sb-btn", "sb-btn--primary"], icon=False),
            ]),
        ]),
    ])]

# ── Rodapé ──────────────────────────────────────────────────
def footer():
    scope("footer")
    col = lambda title, links: block(["sb-footer__col"], [text(title, ["sb-footer__title"])] + links)
    return [section(["sb-footer"], [
        block(["sb-footer__grid"], [
            block(["sb-footer__brand"], [
                el("logo", [], {"logo": {"id": 5519, "url": "https://blog.subleasy.com.br/wp-content/uploads/2026/10/logo-subleasy-branco.png", "full": "https://blog.subleasy.com.br/wp-content/uploads/2026/10/logo-subleasy-branco.png"},
                    "logoText": "Subleasy", "logoUrl": link(SITE), "logoHeight": "30px"}),
                text("O blog da Subleasy, a plataforma para sublocar salas por hora, turno ou mês. Guias práticos para quem tem sala e para quem procura uma.", ["sb-footer__text"]),
            ]),
            col("Temas", [
                el("block", [], {"hasLoop": True, "query": {"objectType": "term", "taxonomy": ["category"], "orderby": "name", "order": "ASC"}}, [
                    el("text-link", ["sb-footer__link"], {"text": "{term_name}", "link": dlink("{term_url}")}),
                ]),
            ]),
            col("Subleasy", [
                tlink("Anunciar minha sala", SITE + "anunciar/", ["sb-footer__link"]),
                tlink("Ver salas disponíveis", SITE + "anuncios", ["sb-footer__link"]),
                tlink("Perguntas frequentes", SITE + "perguntas-frequentes/", ["sb-footer__link"]),
                tlink("Sobre nós", SITE + "sobre-nos/", ["sb-footer__link"]),
            ]),
            col("Ajuda", [
                tlink("Fale conosco", SITE + "fale-conosco/", ["sb-footer__link"]),
                tlink("Política de privacidade", SITE + "politica-de-privacidade/", ["sb-footer__link"]),
                tlink("Termos de uso", SITE + "termos-de-uso/", ["sb-footer__link"]),
            ]),
        ]),
        block(["sb-footer__bottom"], [
            text("© {current_date:Y} Subleasy. Todos os direitos reservados.", tag="p"),
            block(["sb-footer__legal"], [
                tlink("subleasy.com.br", SITE, ["sb-footer__link"]),
            ]),
        ]),
    ])]

# ── Página inicial ──────────────────────────────────────────
def home():
    scope("home")
    loop = "hmloop"
    return [
        section(["sb-masthead", "sb-grid-bg"], [
            container(["sb-container"], [
                block(["sb-masthead__grid"], [
                    block(["sb-stack"], [
                        text("Blog da Subleasy", ["sb-eyebrow", "sb-eyebrow--mint"]),
                        heading("Leitura para quem aluga por turno.", "h1", ["sb-display"]),
                        text("Guias, preços reais e ideias para profissionais de saúde, bem-estar e coworkings que dividem salas por hora, turno ou mês.", ["sb-lead"]),
                    ]),
                    block(["sb-panel"], [
                        block(["sb-stack", "sb-stack--s"], [
                            text("Buscar no blog", ["sb-panel__label"]),
                            el("search", ["sb-search"], {"placeholder": "Ex.: consultório por hora", "icon": SEARCH, "ariaLabel": "Buscar no blog", "buttonAriaLabel": "Buscar"}),
                        ]),
                        block(["sb-stack", "sb-stack--s"], [
                            text("Temas", ["sb-panel__label"]),
                            term_chips(),
                        ]),
                    ]),
                ]),
            ]),
        ]),
        grid_section(loop, MAIN_QUERY, "Artigos recentes", lead=True),
        cta(),
    ]

# ── Arquivos (categoria, tag e genérico) ────────────────────
def archive(kind):
    scope("archive-" + kind)
    loop = {"category": "ctloop", "tag": "tgloop", "any": "arloop"}[kind]
    eyebrow = {"category": "Tema", "tag": "Tag", "any": "Arquivo"}[kind]
    title = "{archive_title}" if kind == "any" else "{term_name}"
    if kind == "tag":
        title = "#{term_name}"
    left = [
        el("breadcrumbs", ["sb-breadcrumbs"], {"homeLabel": "Blog"}),
        text(eyebrow, ["sb-eyebrow"]),
        heading(title, "h1", ["sb-h1"]),
    ]
    if kind != "any":
        left.append(text("{archive_description}", ["sb-lead"], tag="div"))
    right = [block(["sb-stack", "sb-stack--s"], [
        text("Outros temas", ["sb-panel__label"]),
        term_chips(),
    ])]
    return [
        section(["sb-archive-head", "sb-grid-bg"], [
            container(["sb-container"], [
                block(["sb-archive-head__grid"], [
                    block(["sb-stack"], left),
                    block([], right),
                ]),
            ]),
        ]),
        grid_section(loop, {**MAIN_QUERY, "no_results_text": "Ainda não há artigos aqui."}, "Artigos"),
        cta(),
    ]

# ── Busca ───────────────────────────────────────────────────
def search():
    scope("search")
    loop = "srloop"
    return [
        section(["sb-archive-head", "sb-grid-bg"], [
            container(["sb-container"], [
                block(["sb-archive-head__grid"], [
                    block(["sb-stack"], [
                        el("breadcrumbs", ["sb-breadcrumbs"], {"homeLabel": "Blog"}),
                        text("Busca", ["sb-eyebrow"]),
                        heading("Resultados para “{search_term}”", "h1", ["sb-h1"]),
                    ]),
                    block(["sb-stack", "sb-stack--s"], [
                        text("Buscar de novo", ["sb-panel__label"]),
                        el("search", ["sb-search"], {"placeholder": "Ex.: consultório por hora", "icon": SEARCH, "ariaLabel": "Buscar no blog", "buttonAriaLabel": "Buscar"}),
                    ]),
                ]),
            ]),
        ]),
        grid_section(loop, {**MAIN_QUERY, "no_results_text": "Nenhum artigo encontrado. Tente outra palavra, como “psicólogo”, “estética” ou “preço”."}, "Artigos encontrados"),
        cta(),
    ]

# ── Post individual ─────────────────────────────────────────
def single():
    scope("single")
    share_items = [{"service": s} for s in ("whatsapp", "linkedin", "facebook", "email")]
    return [
        el("post-reading-progress-bar", ["sb-progress"], {"contentSelector": ".sb-prose"}),
        section(["sb-article-head"], [
            container(["sb-container", "sb-container--article"], [
                block(["sb-stack"], [
                    el("breadcrumbs", ["sb-breadcrumbs"], {"homeLabel": "Blog"}),
                    el("post-taxonomy", ["sb-cat"], {"taxonomy": "category"}),
                    el("post-title", ["sb-article-title"], {"tag": "h1"}),
                    el("post-excerpt", ["sb-article-lead"], {"length": 36, "more": "…"}),
                    block(["sb-byline"], [
                        block(["sb-meta"], [
                            text("Equipe Subleasy", tag="span"),
                            text("{post_date:j M Y}", tag="span"),
                            el("post-reading-time", [], {"prefix": "", "suffix": " min de leitura", "contentSelector": ".sb-prose", "wordsPerMinute": 220}),
                        ]),
                    ]),
                ]),
            ]),
        ]),
        section(["sb-article-cover"], [
            el("image", ["sb-article-cover__img"], {"image": {"useDynamicData": "{featured_image}", "size": "full"}, "loading": "eager", "caption": "none"}),
        ]),
        section(["sb-article-body"], [
            block(["sb-article-layout"], [
                block(["sb-article-aside"], [
                    block([], [
                        text("Neste artigo", ["sb-aside-label"]),
                        el("post-toc", ["sb-toc"], {"contentSelector": ".sb-prose", "headingSelectors": "h2"}),
                    ]),
                    block([], [
                        text("Compartilhe", ["sb-aside-label"]),
                        el("post-sharing", ["sb-share"], {"items": share_items, "newTab": True}),
                    ]),
                ], tag="aside"),
                block(["sb-article-main"], [
                    el("post-content", ["sb-prose"], {}),
                    block(["sb-article-foot"], [
                        block(["sb-row", "sb-tags-row"], [
                            text("Tags", ["sb-inline-label"]),
                            el("post-taxonomy", ["sb-tags"], {"taxonomy": "post_tag"}),
                        ]),
                        block(["sb-row", "sb-mobile-only"], [
                            text("Compartilhe", ["sb-inline-label"]),
                            el("post-sharing", ["sb-share"], {"items": share_items, "newTab": True}),
                        ]),
                    ]),
                ]),
            ]),
        ]),
        cta(),
        section(["sb-section", "sb-section--muted"], [
            container(["sb-container"], [
                block(["sb-related-head"], [
                    heading("Continue lendo", "h2", ["sb-h2"]),
                    tlink("Ver todos os artigos", HOME, ["sb-link-arrow"], icon=True),
                ]),
                block(["sb-post-grid"], [card_loop(recent_query(3, exclude_current=True))]),
            ]),
        ]),
    ]

# ── 404 ─────────────────────────────────────────────────────
def error():
    scope("error")
    return [
        section(["sb-error", "sb-grid-bg"], [
            container(["sb-container"], [
                block(["sb-stack", "sb-error__box"], [
                    text("404", ["sb-error__code"], tag="p"),
                    heading("Esta página saiu do turno.", "h1", ["sb-h1"]),
                    text("O endereço pode ter mudado ou o artigo foi removido. Busque pelo assunto ou volte para o início do blog.", ["sb-lead"]),
                    el("search", ["sb-search"], {"placeholder": "Ex.: consultório por hora", "icon": SEARCH, "ariaLabel": "Buscar no blog", "buttonAriaLabel": "Buscar"}),
                    block(["sb-actions"], [
                        button("Voltar para o blog", HOME, ["sb-btn", "sb-btn--primary"]),
                        button("Ver salas na Subleasy", SITE + "anuncios", ["sb-btn", "sb-btn--secondary"], icon=False),
                    ]),
                ]),
            ]),
        ]),
        section(["sb-section", "sb-section--muted"], [
            container(["sb-container"], [
                block(["sb-related-head"], [heading("Artigos recentes", "h2", ["sb-h2"])]),
                block(["sb-post-grid"], [card_loop(recent_query(3))]),
            ]),
        ]),
    ]

TEMPLATES = [
    # título, tipo, árvore, condições, configurações extras
    ("Blog — Cabeçalho", "header", header, [{"main": "any"}], {"headerSticky": True}),
    ("Blog — Rodapé", "footer", footer, [{"main": "any"}], {}),
    ("Blog — Página inicial", "archive", home, [{"main": "frontpage"}], {}),
    ("Blog — Categoria", "archive", lambda: archive("category"), [{"main": "archiveType", "archiveType": ["term"], "archiveTerms": ["category::all"]}], {}),
    ("Blog — Tag", "archive", lambda: archive("tag"), [{"main": "archiveType", "archiveType": ["term"], "archiveTerms": ["post_tag::all"]}], {}),
    ("Blog — Arquivo (autor e data)", "archive", lambda: archive("any"), [{"main": "archiveType", "archiveType": ["any"]}], {}),
    ("Blog — Busca", "search", search, [{"main": "search"}], {}),
    ("Blog — Post", "content", single, [{"main": "postType", "postType": ["post"]}], {}),
    ("Blog — 404", "error", error, [{"main": "error"}], {}),
]
