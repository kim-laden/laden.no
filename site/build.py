#!/usr/bin/env python3
"""Write the static Laden AS site. Run from this directory: python3 build.py"""

from pathlib import Path

ROOT = Path(__file__).resolve().parent
SITE = "https://laden.no"

NAV = [
    ("/tjenester/", "Tjenester", "tjenester"),
    ("/metode/", "Metode", "metode"),
    ("/portefolje/", "Portefølje", "portefolje"),
    ("/kurs/", "Kurs", "kurs"),
    ("/om/", "Om", "om"),
    ("/kontakt/", "Kontakt", "kontakt"),
]

JSONLD = """<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "name": "Laden AS",
  "description": "Vi bygger nettsider, apper og API-er i Rust og Python, for bedrifter og privatpersoner. Fra idé til ferdig system. Kurs og foredrag om AI-verktøy.",
  "email": "post@laden.no",
  "telephone": "+4799449677",
  "taxID": "937285833",
  "url": "https://laden.no/",
  "areaServed": "NO",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Schweigaards gate 60 B",
    "postalCode": "0656",
    "addressLocality": "Oslo",
    "addressCountry": "NO"
  },
  "knowsAbout": ["Rust", "Python", "UX", "API-integrasjon", "AI-verktøy", "Electron"]
}
</script>
"""


def nav(active, path="/", lang="nb"):
    prefix = "/en" if lang == "en" else ""
    items = []
    for href, label, key in NAV:
        current = ' aria-current="page"' if key == active else ""
        items.append(f'<li><a href="{prefix}{href}"{current}>{label}</a></li>')
    current_no = ' aria-current="page"' if lang != "en" else ""
    current_en = ' aria-current="page"' if lang == "en" else ""
    en_path = "/en" + (path if path != "/" else "/")
    no_path = path
    return f"""
    <a class="skip" href="#innhold">Hopp til innhold</a>
    <header class="site-header">
      <div class="wrap header-bar">
        <a class="brand-lockup" href="{prefix}/" aria-label="Laden — BUILD YOUR DREAM">
          <img class="brand-mark" src="/images/laden-mark.svg" width="40" height="40" alt="Laden">
          <span class="brand-slogan">BUILD YOUR DREAM</span>
        </a>
        <div class="language-switch" aria-label="Språkvalg">
          <a href="{no_path}" data-language="no"{current_no}>NO</a><span aria-hidden="true">/</span><a href="{en_path}" data-language="en"{current_en}>EN</a>
        </div>
        <input class="nav-check" type="checkbox" id="nav-toggle">
        <label class="nav-toggle" for="nav-toggle" aria-controls="site-nav" aria-expanded="false">
          <span class="when-closed">Meny</span>
          <span class="when-open">Lukk</span>
        </label>
        <nav class="site-nav" id="site-nav" aria-label="Hovedmeny">
          <ul role="list">
            {''.join(items)}
          </ul>
          <a class="btn btn-primary" href="/kontakt/#skjema">Få et tilbud</a>
        </nav>
      </div>
    </header>
    """


def footer(lang="nb"):
    prefix = "/en" if lang == "en" else ""
    return f"""
    <footer class="site-footer">
      <div class="wrap">
        <div class="footer-grid">
          <div class="footer-brand">
            <a class="brand-lockup" href="{prefix}/" aria-label="Laden — BUILD YOUR DREAM">
              <img class="brand-mark" src="/images/laden-mark.svg" width="40" height="40" alt="Laden">
              <span class="brand-slogan">BUILD YOUR DREAM</span>
            </a>
            <p class="tagline">Fra idé til ferdig system.</p>
          </div>
          <nav aria-label="Tjenester i bunntekst">
            <h2>Tjenester</h2>
            <ul role="list">
              <li><a href="{prefix}/tjenester/#systemutvikling">Systemutvikling</a></li>
              <li><a href="{prefix}/tjenester/#design">Design og UX</a></li>
              <li><a href="{prefix}/tjenester/#integrasjoner">Integrasjoner</a></li>
              <li><a href="{prefix}/kontakt/#skjema">Tilbud</a></li>
            </ul>
          </nav>
          <nav aria-label="Kurs i bunntekst">
            <h2>Kurs</h2>
            <ul role="list">
              <li><a href="{prefix}/kurs/#opplaering">Opplæring i AI-verktøy</a></li>
              <li><a href="{prefix}/kurs/#foredrag">Foredrag</a></li>
              <li><a href="{prefix}/kurs/#opplegg">Be om kursforslag</a></li>
            </ul>
          </nav>
          <div>
            <h2>Kontakt</h2>
            <address>
              <ul role="list">
                <li><a class="mail" href="mailto:post@laden.no">post@laden.no</a></li>
                <li><a href="tel:+4799449677">994 49 677</a></li>
                <li>Schweigaards gate 60 B<br>0656 Oslo</li>
                <li><a href="{prefix}/kontakt/#skjema">Skriv til oss</a></li>
              </ul>
            </address>
          </div>
        </div>
        <div class="footer-base">
          <p>© 2026 Laden AS</p>
          <p>Org.nr 937 285 833</p>
          <p><a href="{prefix}/personvern/">Personvern</a></p>
        </div>
      </div>
    </footer>
    """


def layout(title, description, active, body, path, robots="index, follow", extra_head="", lang="nb"):
    prefix = "/en" if lang == "en" else ""
    canonical = SITE + prefix + path
    locale = "en_GB" if lang == "en" else "nb_NO"
    return f"""<!DOCTYPE html>
<html lang="{lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <meta name="description" content="{description}">
  <meta name="robots" content="{robots}">
  <meta name="theme-color" content="#E7F1F7">
  <link rel="canonical" href="{canonical}">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{description}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="{locale}">
  <meta property="og:url" content="{canonical}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="preload" href="/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/images/laden-mark.svg" as="image" type="image/svg+xml">
  <link rel="stylesheet" href="/css/site.css">
  {extra_head}
  <script src="/js/site.js" defer></script>
</head>
<body>
  {nav(active, path, lang)}
  <main id="innhold" tabindex="-1">
    {body}
  </main>
  {footer(lang)}
</body>
</html>
"""


def field(fid, name, label, kind="text", required=False, placeholder="", autocomplete="", options=None, maxlength=""):
    req = " required" if required else ""
    opt = "" if required else ' <span class="opt">Valgfritt</span>'
    ac = f' autocomplete="{autocomplete}"' if autocomplete else ""
    ph = f' placeholder="{placeholder}"' if placeholder else ""
    ml = f' maxlength="{maxlength}"' if maxlength else ""
    described = f' aria-describedby="{fid}-error"'
    if kind == "textarea":
        control = f'<textarea id="{fid}" name="{name}" rows="6" maxlength="2000"{req}{ph}{described}></textarea>'
    elif kind == "select":
        opts = "".join(f'<option value="{value}">{text}</option>' for value, text in options)
        control = f'<select id="{fid}" name="{name}"{req}{described}>{opts}</select>'
    elif kind == "number":
        control = f'<input id="{fid}" name="{name}" type="text" inputmode="numeric"{req}{ac}{ml}{described}>'
    else:
        control = f'<input id="{fid}" name="{name}" type="{kind}"{ac}{req}{ph}{ml}{described}>'
    return f"""<div class="field">
      <label for="{fid}">{label}{opt}</label>
      {control}
      <p class="field-error" id="{fid}-error" hidden></p>
    </div>"""


def form_shell(kind, form_id, action_subject, button, fields, mailto_subject):
    return f"""<div class="form-card">
      <form id="{form_id}" data-form="{kind}" action="mailto:post@laden.no?subject={mailto_subject}" method="post" enctype="text/plain" novalidate>
        <div class="hp" aria-hidden="true">
          <label for="{form_id}-hp">La stå tomt</label>
          <input id="{form_id}-hp" name="hp_field" type="text" tabindex="-1" autocomplete="off">
        </div>
        <div class="form-grid">
          {fields}
          <div class="form-actions">
            <button class="btn btn-primary" type="submit">{button}</button>
          </div>
        </div>
      </form>
      <div class="form-success" tabindex="-1" hidden>
        <p class="success-lead">{action_subject}</p>
        <p class="success-note">E-postprogrammet åpnes med meldingen. Send den derfra, eller skriv direkte til <a href="mailto:post@laden.no">post@laden.no</a>.</p>
      </div>
      <noscript><p class="caption">Uten JavaScript åpnes e-postprogrammet direkte.</p></noscript>
    </div>"""


def chips(pairs):
    bits = []
    for fid, label, checked in pairs:
        mark = " checked" if checked else ""
        bits.append(
            f'<div class="pick chip"><input type="radio" name="work-filter" id="{fid}"{mark}>'
            f'<label for="{fid}">{label}</label></div>'
        )
    return (
        '<fieldset class="filters"><legend class="visually-hidden">Filtrer prosjekter</legend>'
        f'<div class="filter-row">{"".join(bits)}</div></fieldset>'
    )


def download_buttons(downloads, primary=True):
    if not downloads:
        return ""
    bits = []
    for i, item in enumerate(downloads):
        cls = "btn btn-primary" if primary and i == 0 else "btn btn-secondary"
        bits.append(f'<a class="{cls}" href="{item["href"]}">{item["label"]}</a>')
    return f'<div class="download-row">{"".join(bits)}</div>'


def project_card(project, with_role=True):
    attrs = " ".join(f"data-{tag}" for tag in project["tags"])
    role = ""
    if with_role:
        role = f'<div><dt>Rolle</dt><dd>{project["role"]}</dd></div>'
    flag_cls = "flag flag-live" if project.get("live") else "flag"
    external = ""
    if project.get("external"):
        external = (
            f'<p style="margin-top:10px"><a class="link" href="{project["external"]}" '
            f'rel="noopener">{project.get("external_label", "Åpne prosjektet")}</a></p>'
        )
    downloads = ""
    if project.get("downloads"):
        downloads = download_buttons(project["downloads"], primary=False)
    demo_note = f'<p class="demo-note">{project["demo_note"]}</p>' if project.get("demo_note") else ""
    return f"""<article class="project-card" {attrs}>
      <p class="{flag_cls}">{project["flag"]}</p>
      <h3><a href="/portefolje/{project["slug"]}/">{project["title"]}</a></h3>
      {f'<p class="product-slogan">{project["slogan"]}</p>' if project.get("slogan") else ""}
      <p>{project["sentence"]}</p>
      {demo_note}
      <dl class="meta">
        <div><dt>Type</dt><dd>{project["kind"]}</dd></div>
        <div><dt>Stack</dt><dd>{project["stack"]}</dd></div>
        {role}
        <div><dt>Resultat</dt><dd class="result">{project["result"]}</dd></div>
      </dl>
      {external}
      {downloads}
    </article>"""


PROJECTS = [
    {
        "slug": "skarverakk",
        "title": "Skarverakk",
        "slogan": "Festivalfølge, bygget for øyeblikket",
        "sentence": "En festivalflate som gjør tre dager lettere å finne fram i — live nå og neste, køstatus, kart og Rockbot samlet i samme rytme.",
        "kind": "Festivalplattform",
        "stack": "Nett, interaksjon, live data",
        "role": "Produktdesign og utvikling",
        "result": "Live demo på laden.no/demo/skarverakk/ — ikke et ferdig produkt.",
        "tags": ["nett", "api", "bedrift"],
        "flag": "Demo · ikke ferdig produkt",
        "live": False,
        "external": "/demo/skarverakk/",
        "external_label": "Åpne festival-demoen",
        "demo_note": "STRICTLY DEMO — representerer ikke et ferdig produkt.",
        "image": "/images/skarverakk-demo.png",
        "image_alt": "Skarverakk festival-demo med program, kart, køstatus og Rockbot",
        "challenge": "En festival lever i øyeblikket. Når folk må lete etter hva som skjer nå, hvor neste scene er, eller om baren har kø, forsvinner litt av kvelden. Skarverakk-demoen samler det publikum faktisk trenger — uten å gjøre festivalen til et kontrollpanel.",
        "move": "Vi gjorde programmet levende: nå skjer det her, dette kommer etterpå, og dit går du. Kart, køstatus og Rockbot ligger tett på innholdet, slik at mobilen blir en trygg følgesvenn mellom konsertene — ikke enda en app som krever oppmerksomhet.",
        "stack_prose": "En rask, responsiv nettflate med tydelig hierarki for mobil først. Live-informasjon, navigasjon og samtale er behandlet som ett produkt, med nok struktur til at arrangøren kan bygge videre når demoen blir til et reelt oppdrag.",
        "result_prose": "Skarverakk viser retningen: mindre friksjon, mer festival. Du kan åpne demoen og kjenne på flyten fra første konsert til siste natt. Dette er STRICTLY en demo — den representerer ikke et ferdig produkt, og skal ikke leses som en lansert festivalplattform.",
        "shots_note": "Skjermbilde fra Skarverakk-festivaldemoen.",
    },
    {
        "slug": "laden-labs",
        "title": "Laden Labs / LLZ",
        "sentence": "Et hacker-HQ for etisk øving: labs, forum, terminal og gear — bygget som et levende produkt, ikke en demo-side.",
        "kind": "Webplattform",
        "stack": "Nett, API, Python",
        "role": "Design, utvikling og drift",
        "result": "Live på laden.no/LLZ med labs, forum og ops-flate.",
        "tags": ["nett", "api", "python", "bedrift"],
        "flag": "Live · eget produkt",
        "live": True,
        "external": "https://laden.no/LLZ/",
        "external_label": "Åpne Laden Labs",
        "challenge": "Vi trengte et hjem for etisk hacking som føltes skarpt nok til å øve i — uten å bli et tomt markedsføringsskall. Labs, prat og gear måtte sitte i samme rytme.",
        "move": "Laden Labs (LLZ) ble bygget som én plattform: challenge-board med JWT og SQLite-API, medlemsforum, Kali-inspirert konsoll og en merch-flate. Caleb er mentor i loopen. Det er verkstedet først, landingssiden etterpå.",
        "stack_prose": "Nettflate med egen API-rygg, lab-spor fra recon til broken auth, og et visuelt språk som matcher laden.no: void, hack-green, grid. Python der data og auth må sitte stødig.",
        "result_prose": "Plattformen kjører live. Folk kan øve, snakke shop og hente gear uten å forlate samme verden. Det er produktet vi viser når noen spør hva «ferdig» faktisk betyr.",
        "shots_note": "Live produkt — åpne LLZ for den ekte flaten.",
    },
    {
        "slug": "papirglider",
        "title": "PapirGlider Klubben",
        "sentence": "Et norsk verksted for presise folder og lange glideflukter — nettside som føles som å stå ved bordet, ikke i en brosjyre.",
        "kind": "Nett",
        "stack": "Nett, HTML/CSS",
        "role": "Design og utvikling",
        "result": "Live klubbside med veiledninger, trim og video.",
        "tags": ["nett", "privat"],
        "flag": "Live · Levi",
        "live": True,
        "external": "https://laden.no/levi/",
        "external_label": "Åpne PapirGlider Klubben",
        "challenge": "Klubben trengte mer enn en velkomstside. Folk skulle folde med hendene mens de leste — dart for distanse, seilere for tid i lufta, og trim som faktisk forklarer hvorfor flyet dykker.",
        "move": "Vi bygde et verksted: hero med tydelig løfte, korte seksjoner med kicker-nummer, veiledninger og innebygde videoer. Tonen er rolig, konkret og overbevisende — aerodynamikk i lommeformat, uten å miste leken.",
        "stack_prose": "Lett, rask statisk nettflate. Typografi og bildebruk som bærer klubbens preg. Ingen unødvendig rammeverkvekt mellom brukeren og folden.",
        "result_prose": "Siden ligger live under laden.no/levi. Den selger ikke hardt — den inviterer. Samme artikulasjon vi bruker når et produkt skal overbevise uten støy.",
        "shots_note": "Live klubbside — se laden.no/levi.",
    },
    {
        "slug": "dash",
        "title": "Ldash",
        "slogan": "Everything you need",
        "sentence": "Personlig ops-dashboard i laden.no-språket: programmer, monitor, kalender, sticky notes, abonnementer — Ctrl+` og du er inne.",
        "kind": "Desktop-app",
        "stack": "Electron, React, TypeScript",
        "role": "Produktutvikling",
        "result": "Prototype klar for Mac, Windows og Linux.",
        "tags": ["app", "privat", "nett"],
        "flag": "Prototype · last ned",
        "live": True,
        "external": "/portefolje/dash/#nedlastinger",
        "external_label": "Se nedlastinger",
        "downloads": [
            {"label": "macOS Apple Silicon", "href": "/downloads/dash/Laden-Dash-macOS.zip"},
            {"label": "macOS Intel", "href": "/downloads/dash/Laden-Dash-macOS-x64.zip"},
            {"label": "Windows (.zip)", "href": "/downloads/dash/Laden-Dash-Windows.zip"},
            {"label": "Linux (.AppImage)", "href": "/downloads/dash/Laden-Dash-Linux.AppImage"},
        ],
        "challenge": "Vi ville ha et lett, hack-aktig dashboard som åpnes på snarvei: egne programmer, host-monitorering, kalender, sticky notes og abonnementsoversikt — uten tung enterprise-følelse.",
        "move": "Ldash er bygget som Electron-skall med React-UI i laden.no-paletten (void, hack-green, cyan). Widgets kan dras i edit-modus, størrelsesklasser tilpasses, og Control Panel samler innstillingene. Prototypen pakkes for tre OS slik at du kan teste den lokalt.",
        "stack_prose": "Electron + Vite + React + TypeScript + Zustand. Systemmetrikker via native bridge. Samme visuelle språk som Lab'z — Orbitron-titler, grid, scanlines — men laget for daglig drift, ikke for show.",
        "result_prose": "Du kan laste ned prototypen til Mac, Windows eller Linux. Byggene er usignerte testpakker — forvent OS-advarsler første gang. Det er meningen: rask vei til å kjenne på produktet.",
        "shots_note": "Last ned prototypen og kjør den lokalt.",
    },
]

HOME_FILTERS = [
    ("f-alle", "Alle", True),
    ("f-nett", "Nett", False),
    ("f-app", "App", False),
    ("f-api", "API", False),
    ("f-python", "Python", False),
]

PORT_FILTERS = HOME_FILTERS + [
    ("f-bedrift", "Bedrift", False),
    ("f-privat", "Privat", False),
]


def process_widget():
    steps = [
        ("1", "01", "Kundebehov", "Først lytter vi. Hva som skal bli bedre, hvem som bruker det, og hva som ligger utenfor. Når det er skrevet ned, er oppdraget begge parters."),
        ("2", "02", "Strategi og design", "Så tegner vi flyten — web, mobil, nettbrett. Du ser retningen før en eneste linje kode. Det er verkstedet, ikke en presentasjon."),
        ("3", "03", "Utvikling", "Rust når det skal være raskt og kjøre lenge. Python når det skal kobles, automatiseres og komme ut fort. Vi velger etter jobben, ikke etter vane."),
        ("4", "04", "Implementasjon og API", "Vi kobler det mot systemene du allerede har. Feil skal være til å forstå. Når det virker, er det ditt."),
        ("5", "05", "Ferdig løsning", "Du får noe som kjører, en kort dokumentasjon, og en ærlig prat om neste steg — hvis du vil videre."),
    ]
    choices = []
    panels = []
    counts = []
    for num, label_num, name, text in steps:
        checked = " checked" if num == "1" else ""
        choices.append(
            f'<div class="pick step-choice"><input type="radio" name="process-step" id="step-{num}"{checked}>'
            f'<label for="step-{num}"><span class="num">{label_num}</span>{name}</label></div>'
        )
        panels.append(f'<p class="step-panel panel-{num}">{text}</p>')
        counts.append(f'<span class="c{num}">Steg {num} av 5</span>')
    return f"""
    <fieldset class="process">
      <legend>Oppdrag</legend>
      <p class="process-top" aria-hidden="true">{''.join(counts)}</p>
      <div class="progress" aria-hidden="true"><span></span></div>
      <div class="step-list">{''.join(choices)}</div>
      <div class="step-panels" aria-live="polite">{''.join(panels)}</div>
    </fieldset>
    """


def home():
    cards = "".join(project_card(p, with_role=False) for p in PROJECTS)
    audience = field(
        "home-audience", "audience", "Bedrift eller privat", "select",
        options=[("", "Ikke oppgitt"), ("Bedrift", "Bedrift"), ("Privat", "Privat")],
    )
    fields = f"""
      <div class="form-row">
        {field("home-name", "name", "Navn", required=True, autocomplete="name", maxlength="120")}
        {field("home-email", "email", "E-post", "email", required=True, autocomplete="email", maxlength="160")}
      </div>
      {audience}
      {field("home-message", "message", "Hva dreier det seg om", "textarea", required=True, placeholder="Hva skal løses?")}
    """
    body = f"""
    <section class="hero">
      <div class="wrap hero-grid">
        <div>
          <p class="hero-brand">BUILD YOUR DREAM</p>
          <p class="eyebrow">Utvikler · Oslo</p>
          <h1>Fra idé til ferdig produkt.</h1>
          <p class="lede">Fra idé til ferdig produkt — BUILD YOUR DREAM. Hosting og drift, logo og merkevare, nettside, app eller integrasjon: Vi tar hele løpet og leverer noe som faktisk kjører.</p>
          <div class="actions">
            <a class="btn btn-primary" href="/kontakt/#skjema">Få et tilbud</a>
            <a class="btn btn-secondary" href="/portefolje/">Se porteføljen</a>
          </div>
        </div>
        {process_widget()}
      </div>
    </section>

    <section class="section" aria-labelledby="hvem">
      <div class="wrap">
        <div class="section-head">
          <h2 id="hvem">Fra idé til ferdig produkt.</h2>
          <p class="lede">Bedrift eller privat. Vi tar deg fra første tanke til merkevare, lansering og stabil drift — med samme standard hele veien.</p>
        </div>
        <div class="two">
          <article class="card">
            <h3>Bedrifter</h3>
            <p>Interne verktøy folk faktisk åpner. Kundeportaler. API-er som får systemene dine til å snakke sammen. Nettsider som tåler mandagen etter lansering — ikke bare lanseringsfesten.</p>
          </article>
          <article class="card">
            <h3>Privatpersoner</h3>
            <p>Et eget verktøy, en klubbside, en liten app, eller en idé du har gått med lenge nok. Vi tar den like alvorlig som et bedriftsoppdrag. Lite oppdrag. Samme presisjon.</p>
          </article>
        </div>
        <p class="statement">Du snakker med oss. Ikke med fire underleverandører.</p>
      </div>
    </section>

    <section class="section" aria-labelledby="tjenester">
      <div class="wrap">
        <div class="section-head">
          <h2 id="tjenester">Hele løpet. Ett sted.</h2>
          <p class="lede">Hosting, brand, web og produkter — BUILD YOUR DREAM fra første idé til ferdig drift.</p>
        </div>
        <div class="service-grid">
          <article class="card service-card">
            <p class="index">01</p>
            <h3>Hosting og drift</h3>
            <p>Vi setter opp, sikrer og drifter løsningen din. Fra domene og deploy til overvåking — stabilt når den skal brukes.</p>
            <a class="link" href="/tjenester/#hosting">Se hosting og drift</a>
          </article>
          <article class="card service-card">
            <p class="index">02</p>
            <h3>Logo og merkevare</h3>
            <p>Et tydelig uttrykk som folk kjenner igjen. Logo, identitet og grensesnitt som gjør ideen din vanskelig å overse.</p>
            <a class="link" href="/tjenester/#brand">Se merkevaren</a>
          </article>
          <article class="card service-card">
            <p class="index">03</p>
            <h3>Produkter og apper</h3>
            <p>Vi bygger det som skal selges, brukes eller få jobben gjort — nettsider, webapper, API-er og egne produkter.</p>
            <a class="link" href="/tjenester/#systemutvikling">Se hvordan vi bygger</a>
          </article>
          <article class="card service-card">
            <p class="index">04</p>
            <h3>Fra idé til drift</h3>
            <p>Du får én partner gjennom strategi, design, utvikling, lansering og videre drift. Behovet først — løsningen etterpå.</p>
            <a class="link" href="/kontakt/#skjema">Start prosjektet</a>
          </article>
        </div>
      </div>
    </section>

    <section class="proof" aria-labelledby="avgrensning">
      <div class="wrap">
        <h2 id="avgrensning" class="visually-hidden">Hvorfor oss</h2>
        <div class="proof-grid">
          <div class="proof-item">
            <h3>Idé til produkt</h3>
            <p>Strategi, brand, UX, kode, API, hosting og overlevering. Ett oppdrag. Du forholder deg til oss — hele veien.</p>
          </div>
          <div class="proof-item">
            <h3>Rust og Python</h3>
            <p>Raskt og stødig i Rust. Integrasjon, data og automatisering i Python. Vi velger, og vi kan si hvorfor.</p>
          </div>
          <div class="proof-item">
            <h3>Fysisk og digitalt</h3>
            <p>Kurs og foredrag hos dere eller på skjerm. Samme opplegg. Vi tilpasser rommet — ikke innholdet bort.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section" aria-labelledby="arbeid">
      <div class="wrap">
        <div class="section-head section-head-row">
          <div>
            <h2 id="arbeid">Utvalgt arbeid</h2>
            <p class="lede">Ekte produkter. Lab'z, PapirGlider og Ldash — Everything you need — bygget, levert, til å prøve.</p>
          </div>
          <a class="link" href="/portefolje/">Se porteføljen</a>
        </div>
        <div class="filter-group">
          {chips(HOME_FILTERS)}
          <div class="project-grid">
            {cards}
          </div>
        </div>
      </div>
    </section>

    <section class="section" aria-labelledby="metode">
      <div class="wrap">
        <div class="section-head">
          <h2 id="metode">Slik blir det gjort</h2>
          <p class="lede">Fem steg fra idé til ferdig produkt. Vi eier alle. Du slipper å koordinere fire leverandører og håpe at de mener det samme.</p>
        </div>
        <ol class="rail" role="list">
          <li><span class="num">01</span>Kundebehov</li>
          <li><span class="num">02</span>Strategi og design</li>
          <li><span class="num">03</span>Utvikling (Rust/Python)</li>
          <li><span class="num">04</span>Implementasjon og API</li>
          <li><span class="num">05</span>Ferdig løsning</li>
        </ol>
        <div class="method-note">
          <p>Fra idé til ferdig produkt — BUILD YOUR DREAM. Vi tegner, bygger, hoster, kobler og overleverer.</p>
          <a class="link" href="/metode/">Les hele løpet</a>
        </div>
      </div>
    </section>

    <section class="section" aria-labelledby="kurs-teaser">
      <div class="wrap">
        <div class="course-band">
          <div>
            <h2 id="kurs-teaser">AI-verktøy, uten mystikk.</h2>
            <p class="lede">Vi lærer teamet å bruke verktøyene de allerede betaler for. Foredrag som kan brukes mandagen etter. Hos dere, eller digitalt.</p>
          </div>
          <a class="btn btn-primary" href="/kurs/#opplegg">Be om kursforslag</a>
        </div>
      </div>
    </section>

    <section class="section" id="forespor" aria-labelledby="cta">
      <div class="wrap cta-grid">
        <div>
          <h2 id="cta">Fortell oss hva som skal løses.</h2>
          <p class="lede">Et konkret problem er perfekt. En løs idé holder også. Vi svarer med et tilbud til deg — ikke en pakke fra hylla.</p>
          <p class="method-note">Eller skriv til <a class="link" href="mailto:post@laden.no">post@laden.no</a>. Vi leser den selv.</p>
        </div>
        {form_shell("inquiry", "home-form", "Takk. Vi svarer med et forslag, ikke et nyhetsbrev.", "Få et tilbud", fields, "Foresp%C3%B8rsel%20til%20Laden%20AS")}
      </div>
    </section>
    """
    return layout(
        "Laden AS — vi bygger det ferdig",
        "Vi bygger nettsider, apper og API-er i Rust og Python, for bedrifter og privatpersoner. Fra idé til ferdig system. Kurs og foredrag om AI-verktøy.",
        "",
        body,
        "/",
        extra_head=JSONLD,
    )


def services():
    body = """
    <header class="page-head">
      <div class="wrap">
        <p class="eyebrow">Tjenester</p>
        <h1>Fra idé til ferdig produkt.</h1>
        <p class="lede">Hosting og drift, logo og merkevare, nettside, app og produkt. Vi tar hele løpet fra første skisse til stabil bruk.</p>
      </div>
    </header>

    <section class="section deep" id="hosting">
      <div class="wrap split">
        <div class="prose">
          <p class="eyebrow">01 · Hosting og drift</p>
          <h2>Fra lansering til stabil hverdag.</h2>
          <p>Vi setter opp hosting, domene, deploy, sikkerhet og backup — og holder det ryddig etter lansering. Du får en løsning som er rask å åpne og enkel å eie.</p>
          <p>Trenger du bare en trygg hjemside, eller skal et helt produkt kjøre på nett? Vi møter behovet der det er.</p>
        </div>
        <aside class="widget prose">
          <h3>Det som følger med</h3>
          <ul class="pick-list" role="list">
            <li>Hosting og deploy</li>
            <li>Domene, TLS og sikkerhet</li>
            <li>Backup og videre drift</li>
          </ul>
        </aside>
      </div>
    </section>

    <section class="section deep" id="brand">
      <div class="wrap split">
        <div class="prose">
          <p class="eyebrow">02 · Logo og merkevare</p>
          <h2>Et uttrykk som bærer produktet.</h2>
          <p>Vi lager logo, visuell retning og merkevare som gjør ideen tydelig — fra første skisse til ferdige flater. Du får en identitet som fungerer på skjerm, i salg og i hverdagen.</p>
          <p>Har du allerede en logo, bygger vi videre på den. Starter du fra blanke ark, starter vi med det som skal bli husket.</p>
        </div>
        <aside class="widget prose">
          <h3>Brand i praksis</h3>
          <ul class="pick-list" role="list">
            <li>Logo og merkevare</li>
            <li>Webdesign og UX</li>
            <li>Komponenter som kan brukes igjen</li>
          </ul>
        </aside>
      </div>
    </section>

    <section class="section deep" id="systemutvikling">
      <div class="wrap split">
        <div class="prose">
          <h2>Produkter og apper</h2>
          <p>Skreddersydde nettsider, webapper, API-er og frittstående applikasjoner — til bedrift og privat. Vi bygger selve produktet, ikke bare presentasjonen rundt det.</p>
          <p>Leveransen er kjørende programvare med en vei videre. Rust og Python velges etter krav til ytelse, integrasjon og vedlikehold — ikke etter vane.</p>
        </div>
        <fieldset class="widget stack-widget">
          <legend>Språkvalg</legend>
          <div class="seg">
            <div class="pick"><input type="radio" name="stack" id="stack-rust" checked><label for="stack-rust">Rust</label></div>
            <div class="pick"><input type="radio" name="stack" id="stack-python"><label for="stack-python">Python</label></div>
          </div>
          <div class="stack-panel panel-rust prose">
            <p>Rust brukes når tjenesten skal være rask, bruke lite ressurser og kjøre lenge uten overraskelser.</p>
            <ul class="pick-list" role="list">
              <li>Svar som må komme fort</li>
              <li>Lav ressursbruk</li>
              <li>Tjenester som skal kjøre lenge og riktig</li>
            </ul>
          </div>
          <div class="stack-panel panel-python prose">
            <p>Python brukes når arbeidet er integrasjon, automatisering, data eller en kobling mot AI-verktøy. Veien fra behov til prototyp er kortere.</p>
            <ul class="pick-list" role="list">
              <li>Integrasjoner mellom systemer</li>
              <li>Automatisering og data</li>
              <li>AI-koblinger, og en kortere vei til prototyp</li>
            </ul>
          </div>
        </fieldset>
      </div>
    </section>

    <section class="section deep" id="design">
      <div class="wrap">
        <div class="prose">
          <h2>Design og UX</h2>
          <p>Full UX for web, mobil og nettbrett. Uttrykket er rent, moderne og artikulert — det samme grepet vi bruker når en side skal overbevise uten støy.</p>
          <p>Widgets brukes kun der de viser tilstand, valg eller fremdrift. Aldri som dekor. Under er samme innhold i tre bredder.</p>
        </div>
        <div class="viewport">
          <fieldset>
            <legend class="visually-hidden">Bredde på forhåndsvisning</legend>
            <div class="seg seg-3">
              <div class="pick"><input type="radio" name="viewport" id="view-web" checked><label for="view-web">Web</label></div>
              <div class="pick"><input type="radio" name="viewport" id="view-mobile"><label for="view-mobile">Mobil</label></div>
              <div class="pick"><input type="radio" name="viewport" id="view-tablet"><label for="view-tablet">Nettbrett</label></div>
            </div>
          </fieldset>
          <div class="stage">
            <div class="device">
              <div class="device-bar">
                <span class="dlabel d-web">Web</span>
                <span class="dlabel d-mobile">Mobil</span>
                <span class="dlabel d-tablet">Nettbrett</span>
              </div>
              <div class="mini">
                <div class="mini-top">
                  <strong>Timebestilling</strong>
                  <span class="pill">Ledig i dag</span>
                </div>
                <div class="mini-body">
                  <p>Samme timer, samme tekst. Bare rammen bytter bredde.</p>
                  <ul class="slots" role="list">
                    <li><span>Tirsdag</span><span>09:00</span></li>
                    <li><span>Tirsdag</span><span>13:30</span></li>
                    <li><span>Onsdag</span><span>10:15</span></li>
                  </ul>
                </div>
                <div class="mini-action"><span class="btn btn-primary">Velg tid</span></div>
              </div>
            </div>
          </div>
          <p class="caption">Forhåndsvisning. Samme innhold i tre bredder.</p>
        </div>
      </div>
    </section>

    <section class="section deep" id="integrasjoner">
      <div class="wrap">
        <div class="prose">
          <h2>Integrasjoner</h2>
          <p>API-tilpasning og backend som får systemer til å snakke sammen.</p>
          <p>Eksempler, som byttes mot det dere faktisk bruker: CRM, betaling, booking, interne databaser.</p>
        </div>
        <fieldset class="widget api-widget">
          <legend>Fra kilde til Laden AS</legend>
          <div class="nodes">
            <div class="pick node"><input type="radio" name="api-node" id="node-kilde" checked><label for="node-kilde">Kilde</label></div>
            <div class="wire" aria-hidden="true"></div>
            <div class="pick node"><input type="radio" name="api-node" id="node-api"><label for="node-api">API</label></div>
            <div class="wire" aria-hidden="true"></div>
            <div class="pick node"><input type="radio" name="api-node" id="node-os"><label for="node-os">Laden AS</label></div>
          </div>
          <p class="conn"><span class="dot" aria-hidden="true"></span> Tilkoblet</p>
          <p class="node-panel panel-kilde">Systemet som allerede finnes. CRM, betaling, booking eller en intern database. Navnet byttes mot deres.</p>
          <p class="node-panel panel-api">Feltene, feilene og tilgangen. Her avtales hva som sendes, og hva som skjer når noe mangler.</p>
          <p class="node-panel panel-os">Tjenesten som leser, tilpasser og skriver videre. Den får systemene til å snakke sammen.</p>
        </fieldset>
      </div>
    </section>

    <section class="section page-cta">
      <div class="wrap">
        <h2>Et personlig tilbud</h2>
        <p class="lede">Tilbudet tar utgangspunkt i behovet — ikke en pakkepris-meny.</p>
        <a class="btn btn-primary" href="/kontakt/#skjema">Få et tilbud</a>
      </div>
    </section>
    """
    return layout(
        "Tjenester — Laden AS",
        "Skreddersydde nettsider, applikasjoner og API-er. Rust for ytelse, Python for integrasjon og automatisering. UX for web, mobil og nettbrett.",
        "tjenester",
        body,
        "/tjenester/",
    )


def method():
    steps = [
        ("kundebehov", "01", "Kundebehov", [
            "Vi starter med det som skal bli bedre.",
            "Hvem bruker systemet, og i hvilken situasjon.",
            "Hva som er med i oppdraget, og hva som er utenfor.",
            "Krav til drift, språk og eksisterende systemer skrives ned før noe tegnes.",
            "Du skal kjenne igjen problemet ditt i det vi skriver.",
        ]),
        ("strategi", "02", "Strategi og design", [
            "Flyten tegnes før kode.",
            "Innholdet prioriteres: hva som må være synlig, og hva som kan vente.",
            "UX lages for web, mobil og nettbrett, med de samme oppgavene i alle tre.",
            "Widgets brukes der de viser tilstand, valg eller fremdrift.",
            "Du ser retningen før utviklingen starter.",
        ]),
        ("utvikling", "03", "Utvikling (Rust/Python)", [
            "Språk velges etter krav, ikke etter vane.",
            "Rust når tjenesten skal være rask, nøktern på ressurser og kjøre lenge.",
            "Python når oppgaven er integrasjon, automatisering, data eller en AI-kobling.",
            "Omfanget holdes til det som er avtalt.",
            "Du får kjørende programvare underveis.",
        ]),
        ("implementasjon", "04", "Implementasjon og API", [
            "Det nye kobles til det som allerede finnes.",
            "API-ene tilpasses feltene, feilene og tilgangen dere faktisk har.",
            "Det kan være et CRM, betaling, booking eller en intern database.",
            "Feil skal være synlige og forståelige.",
            "Overleveringen skjer mot et miljø dere kan bruke.",
        ]),
        ("ferdig", "05", "Ferdig løsning", [
            "Du får et ferdig produkt som kjører.",
            "Hosting, deploy og en kort dokumentasjon gjør løsningen enkel å eie.",
            "Koden, innholdet og merkevaren er deres.",
            "Vi avtaler hva som skjer hvis omfanget vokser.",
            "Videre arbeid er et nytt, avklart behov.",
        ]),
    ]
    rail = []
    articles = []
    for anchor, num, title, lines in steps:
        rail.append(f'<li><a href="#{anchor}"><span class="num">{num}</span>{title}</a></li>')
        paras = "".join(f"<p>{line}</p>" for line in lines)
        articles.append(
            f'<article class="step-article" id="{anchor}"><div><p class="num">{num}</p><h2>{title}</h2></div><div class="prose">{paras}</div></article>'
        )
    body = f"""
    <header class="page-head">
      <div class="wrap">
        <p class="eyebrow">Metode</p>
        <h1>Fra idé til ferdig produkt.</h1>
        <p class="lede">BUILD YOUR DREAM: Vi eier hele løpet — hosting, brand, web, app og drift — så du slipper å koordinere fire leverandører.</p>
      </div>
    </header>
    <section class="section">
      <div class="wrap">
        <nav aria-label="Stegene">
          <ol class="rail" role="list">{''.join(rail)}</ol>
        </nav>
        {''.join(articles)}
      </div>
    </section>
    <section class="section page-cta">
      <div class="wrap">
        <h2>Start med behovet</h2>
        <p class="lede">Fortell hva som skal bli bedre. Vi svarer med et personlig tilbud.</p>
        <a class="btn btn-primary" href="/kontakt/#skjema">Start med behovet</a>
      </div>
    </section>
    """
    return layout(
        "Metode — Laden AS",
        "Fra kundebehov til ferdig løsning. Strategi, design, utvikling i Rust eller Python, implementasjon og API, og overlevering.",
        "metode",
        body,
        "/metode/",
    )


def portfolio():
    cards = "".join(project_card(p) for p in PROJECTS)
    body = f"""
    <header class="page-head">
      <div class="wrap">
        <p class="eyebrow">Portefølje</p>
        <h1>Arbeid som kjører.</h1>
        <p class="lede">Fire arbeider fra Laden AS: Skarverakk som festivaldemo, Lab'z for etisk øving, PapirGlider for klubben, og Ldash — Everything you need.</p>
      </div>
    </header>
    <section class="section" aria-labelledby="prosjekter">
      <div class="wrap">
        <h2 id="prosjekter" class="visually-hidden">Prosjekter</h2>
        <div class="filter-group">
          {chips(PORT_FILTERS)}
          <div class="project-grid">{cards}</div>
        </div>
      </div>
    </section>
    <section class="section page-cta">
      <div class="wrap">
        <h2>Et prosjekt som ligner</h2>
        <p class="lede">Beskriv behovet. Vi svarer med et tilbud — ikke en standardpakke.</p>
        <a class="btn btn-primary" href="/kontakt/#skjema">Beskriv et prosjekt</a>
      </div>
    </section>
    """
    return layout(
        "Portefølje — Laden AS",
        "Portefølje fra Laden AS: Skarverakk festivaldemo, Laden Labs / LLZ, PapirGlider Klubben og Ldash — Everything you need.",
        "portefolje",
        body,
        "/portefolje/",
    )


def project_page(project):
    external_block = ""
    if project.get("external") and not project["external"].startswith("/portefolje/"):
        external_block = (
            f'<p><a class="btn btn-primary" href="{project["external"]}" rel="noopener">'
            f'{project.get("external_label", "Åpne prosjektet")}</a></p>'
        )
    downloads_block = ""
    if project.get("downloads"):
        downloads_block = f"""
      <section class="case-block" id="nedlastinger">
        <h2>Last ned prototypen</h2>
        <div class="case-downloads">
          <h3>Mac · Windows · Linux</h3>
          <p>Usignerte testbygg. macOS kan spørre om Gatekeeper — høyreklikk og åpne, eller tillat under Personvern. Windows SmartScreen kan advare; velg «Mer info» og kjør likevel. Linux: gjør AppImage kjørbar (<code>chmod +x</code>).</p>
          {download_buttons(project["downloads"], primary=True)}
        </div>
      </section>
        """
    if project.get("image"):
        shots = f"""
    <div class="shots">
      <figure class="shot">
        <div class="shot-frame shot-frame-image"><img class="shot-image" src="{project["image"]}" alt="{project.get("image_alt", project["title"])}"></div>
        <figcaption>{project.get("shots_note", "Live flate.")}</figcaption>
      </figure>
    </div>
    """
    else:
        shots = f"""
    <div class="shots">
      <figure class="shot">
        <div class="shot-frame"><span>{project.get("shots_note", "Se live-produktet")}</span></div>
        <figcaption>{project.get("shots_note", "Live flate.")}</figcaption>
      </figure>
    </div>
    """
    body = f"""
    <header class="page-head">
      <div class="wrap">
        <nav aria-label="Du er her">
          <ol class="crumbs" role="list">
            <li><a href="/portefolje/">Portefølje</a></li>
            <li aria-current="page">{project["title"]}</li>
          </ol>
        </nav>
        <p class="banner">{project["flag"]}</p>
        <h1>{project["title"]}</h1>
        {f'<p class="product-slogan">{project["slogan"]}</p>' if project.get("slogan") else ""}
        <p class="lede">{project["sentence"]}</p>
        {f'<p class="demo-note">{project["demo_note"]}</p>' if project.get("demo_note") else ""}
        <dl class="fact-row">
          <div><dt>Type</dt><dd>{project["kind"]}</dd></div>
          <div><dt>Stack</dt><dd>{project["stack"]}</dd></div>
          <div><dt>Rolle</dt><dd>{project["role"]}</dd></div>
        </dl>
        {external_block}
      </div>
    </header>
    <div class="wrap case-wrap">
      <section class="case-block">
        <h2>Flate</h2>
        {shots}
      </section>
      <section class="case-block">
        <h2>Utfordring</h2>
        <div class="prose"><p>{project["challenge"]}</p></div>
      </section>
      <section class="case-block">
        <h2>Grep</h2>
        <div class="prose"><p>{project["move"]}</p></div>
      </section>
      <section class="case-block">
        <h2>Stack</h2>
        <div class="prose"><p>{project["stack_prose"]}</p></div>
      </section>
      {downloads_block}
      <section class="case-block">
        <h2>Resultat</h2>
        <div class="prose"><p>{project["result_prose"]}</p></div>
      </section>
    </div>
    <section class="section page-cta">
      <div class="wrap">
        <h2>Start med et lignende behov</h2>
        <p class="lede">Beskriv problemet. Vi svarer med et personlig tilbud.</p>
        <a class="btn btn-primary" href="/kontakt/#skjema">Start med behovet</a>
      </div>
    </section>
    """
    return layout(
        f'{project["title"]} — Portefølje — Laden AS',
        f'{project["sentence"]} Resultat: {project["result"]}',
        "portefolje",
        body,
        f'/portefolje/{project["slug"]}/',
    )


def course():
    fields = f"""
      {field("k-topic", "topic", "Tema", required=True, placeholder="For eksempel valg av AI-verktøy i kundearbeid", maxlength="200")}
      <div class="form-row">
        {field("k-count", "count", "Antall", "number", required=True, maxlength="5")}
        {field("k-place", "place", "Sted eller digitalt", required=True, placeholder="Hos dere, eller digitalt", maxlength="160")}
      </div>
      {field("k-date", "date", "Ønsket dato", "date")}
    """
    body = f"""
    <header class="page-head">
      <div class="wrap">
        <p class="eyebrow">Kurs og foredrag</p>
        <h1>AI-verktøy, uten mystikk.</h1>
        <p class="lede">Praktisk opplæring i verktøyene folk allerede har. Foredrag for team — hos dere eller digitalt. Klar til bruk mandagen etter.</p>
      </div>
    </header>
    <section class="section deep" id="opplaering">
      <div class="wrap prose">
        <h2>Opplæring i bruk av AI-verktøy</h2>
        <p>Halvdag eller dag. For team som skal bruke verktøyene i eget arbeid.</p>
        <p>Vi tar utgangspunkt i verktøyene dere allerede betaler for, og øver på oppgaver fra deres hverdag. Dette er opplæring — ikke et inspirasjonsforedrag som fordamper i pausen.</p>
      </div>
    </section>
    <section class="section deep" id="foredrag">
      <div class="wrap prose">
        <h2>Foredrag</h2>
        <p>Fysisk eller digitalt. Tema er AI i faktisk arbeid, valg av verktøy, og hva man ikke bør automatisere.</p>
        <p>Lengde og rom avtales. Innholdet tilpasses dem som skal høre på.</p>
      </div>
    </section>
    <section class="section" id="opplegg">
      <div class="wrap cta-grid">
        <div>
          <h2>Få et opplegg</h2>
          <p class="lede">Skriv tema, hvor mange som skal være med, og om det skal skje hos dere eller digitalt. Vi svarer med et opplegg — ikke et nyhetsbrev.</p>
        </div>
        {form_shell("course", "course-form", "Takk. Vi svarer med et opplegg, ikke et nyhetsbrev.", "Få et opplegg", fields, "Kurs%20og%20foredrag%20til%20Laden%20AS")}
      </div>
    </section>
    """
    return layout(
        "Kurs og foredrag — Laden AS",
        "Praktisk opplæring i AI-verktøy, og foredrag fysisk eller digitalt. For team som skal bruke verktøyene i eget arbeid.",
        "kurs",
        body,
        "/kurs/",
    )


def about():
    body = """
    <header class="page-head">
      <div class="wrap">
        <p class="eyebrow">Om oss</p>
        <h1>Utvikleren som også bygger.</h1>
        <p class="lede">Uansett om behovet er en kommersiell applikasjon, et internt verktøy eller et privat prosjekt — Laden AS bygger løsningen ferdig.</p>
      </div>
    </header>
    <section class="section">
      <div class="wrap">
        <div class="about-top">
          <figure class="portrait">
            <div class="portrait-frame">
              <img src="/images/portrett-20261001-crop.png" alt="Portrett">
            </div>
            <figcaption>AI generert bilde av daglig leder Kim Engebakken</figcaption>
          </figure>
          <div class="prose">
            <p>Laden AS er utvikleren som også bygger. Fra idé til ferdig produkt, for bedrift og privat. Design, kode og integrasjon i samme løp. Rust og Python er verktøyvalg — ikke identitet.</p>
            <p>Vi tror på verkstedet mer enn på presentasjonen: artikulert copy, skarpt UX, og programvare som tåler mandagen etter lansering.</p>
          </div>
        </div>
        <div class="trust">
          <article>
            <h2>Et oppdrag starter med behovet</h2>
            <p>Du beskriver problemet eller idéen. Vi svarer innen et par timer, stiller spørsmål om behovet, og sender deretter et personlig tilbud. Vi er åpne 24/7.</p>
          </article>
          <article>
            <h2>Det dere eier</h2>
            <p>Når arbeidet er levert, eier kunden koden og innholdet. En kort dokumentasjon sier hvordan systemet kjøres, og hva det avhenger av.</p>
          </article>
          <article>
            <h2>Slik når du oss</h2>
            <p>Skriv til <a class="link" href="mailto:post@laden.no">post@laden.no</a>, eller ring <a class="link" href="tel:+4799449677">994 49 677</a>. Adressen er Schweigaards gate 60 B, 0656 Oslo. Et menneske svarer innen et par timer. Vi er åpne 24/7. Det er ingen chatbot.</p>
          </article>
        </div>
        <section class="partner-callout" aria-labelledby="partner-title">
          <p class="eyebrow">Bli med på laget</p>
          <h2 id="partner-title">Partnere som vil bidra</h2>
          <p>Laden er alltid på utkikk etter partnere som vil bli med på laget — både økonomisk som sponsorer, og gjennom faktiske bidrag til arbeidet. <a class="link" href="mailto:post@laden.no">Skriv til oss</a> hvis du vil bidra.</p>
        </section>
      </div>
    </section>
    <section class="section page-cta">
      <div class="wrap">
        <h2>Ta kontakt</h2>
        <p class="lede">Et problem eller en idé er nok.</p>
        <a class="btn btn-primary" href="/kontakt/#skjema">Ta kontakt</a>
      </div>
    </section>
    """
    return layout(
        "Om oss — Laden AS",
        "Laden AS er utvikleren som også bygger. Design, kode og integrasjon i samme løp, for bedrift og privat.",
        "om",
        body,
        "/om/",
    )


def contact():
    fields = f"""
      <div class="form-row">
        {field("c-name", "name", "Navn", required=True, autocomplete="name", maxlength="120")}
        {field("c-email", "email", "E-post", "email", required=True, autocomplete="email", maxlength="160")}
      </div>
      <div class="form-row">
        {field("c-phone", "phone", "Telefon", "tel", autocomplete="tel", maxlength="40")}
        {field("c-audience", "audience", "Bedrift eller privat", "select", options=[("", "Ikke oppgitt"), ("Bedrift", "Bedrift"), ("Privat", "Privat")])}
      </div>
      {field("c-kind", "kind", "Type", "select", options=[("", "Velg"), ("Nett", "Nett"), ("App", "App"), ("API", "API"), ("Kurs", "Kurs"), ("Foredrag", "Foredrag"), ("Annet", "Annet")])}
      {field("c-message", "message", "Melding", "textarea", required=True, placeholder="Et konkret problem, eller en løs idé")}
    """
    body = f"""
    <header class="page-head">
      <div class="wrap">
        <p class="eyebrow">Kontakt</p>
        <h1>Et problem eller en idé er nok.</h1>
        <p class="lede">Skriv det som det er. Vi svarer med et personlig tilbud — ikke et nyhetsbrev.</p>
      </div>
    </header>
    <section class="section" id="skjema">
      <div class="wrap cta-grid contact-layout">
        {form_shell("contact", "contact-form", "Takk. Vi svarer med et personlig tilbud, ikke et nyhetsbrev.", "Be om et personlig tilbud", fields, "Tilbud%20til%20Laden%20AS")}
        <aside class="aside-note">
          <dl>
            <div>
              <dt>E-post</dt>
              <dd><a href="mailto:post@laden.no">post@laden.no</a></dd>
            </div>
            <div>
              <dt>Telefon</dt>
              <dd><a href="tel:+4799449677">994 49 677</a></dd>
            </div>
            <div>
              <dt>Adresse</dt>
              <dd>Schweigaards gate 60 B<br>0656 Oslo</dd>
            </div>
            <div>
              <dt>Svartid</dt>
              <dd>Innen et par timer. Åpent 24/7.</dd>
            </div>
          </dl>
          <p>Tilbudet tar utgangspunkt i ditt behov — ikke en fast pakke.</p>
        </aside>
      </div>
    </section>
    """
    return layout(
        "Kontakt — Laden AS",
        "Beskriv et problem eller en idé. Laden AS svarer innen et par timer med et personlig tilbud. Vi er åpne 24/7.",
        "kontakt",
        body,
        "/kontakt/",
    )


def privacy():
    body = """
    <header class="page-head">
      <div class="wrap">
        <p class="eyebrow">Personvern</p>
        <h1>Personvern</h1>
        <p class="lede">Kort om hva som skjer med det du sender inn. Sist oppdatert 1. oktober 2026.</p>
      </div>
    </header>
    <section class="section">
      <div class="wrap legal">
        <h2>Ansvarlig</h2>
        <p>Laden AS, Schweigaards gate 60 B, 0656 Oslo. Org.nr 937 285 833. Telefon <a class="link" href="tel:+4799449677">994 49 677</a>. E-post <a class="link" href="mailto:post@laden.no">post@laden.no</a>.</p>
        <h2>Det du sender inn</h2>
        <p>Navn, e-post, og det du selv skriver. Telefon, bedrift eller privat, type oppdrag, kursdetaljer og dato hvis du fyller dem inn.</p>
        <h2>Hvordan det sendes</h2>
        <p>Skjemaet åpner e-postprogrammet ditt med meldingen til post@laden.no. Ingenting lagres på nettstedet. Vi leser meldingen for å svare på det du spør om.</p>
        <h2>Det vi ikke gjør</h2>
        <p>Ingen sporingskapsler. Ingen eksterne sporingscript. Ingen nyhetsbrev. Opplysningene selges ikke.</p>
        <h2>Hvor lenge</h2>
        <p>E-posten ligger i postkassen vår så lenge henvendelsen er aktuell, og slettes når den ikke lenger trengs.</p>
        <h2>Dine rettigheter</h2>
        <p>Du kan be om innsyn, retting eller sletting. Skriv til <a class="link" href="mailto:post@laden.no">post@laden.no</a>.</p>
        <p><a class="btn btn-primary" href="/kontakt/#skjema">Spørsmål om personvern</a></p>
      </div>
    </section>
    """
    return layout(
        "Personvern — Laden AS",
        "Slik behandler Laden AS opplysninger du sender. Ingen sporingskapsler og ingen nyhetsbrev.",
        "",
        body,
        "/personvern/",
    )


def missing():
    body = """
    <div class="wrap missing">
      <p class="eyebrow">404</p>
      <h1>Siden finnes ikke.</h1>
      <p class="lede">Adressen stemmer ikke, eller siden er flyttet.</p>
      <a class="btn btn-primary" href="/">Til forsiden</a>
    </div>
    """
    return layout(
        "Siden finnes ikke — Laden AS",
        "Siden finnes ikke.",
        "",
        body,
        "/404.html",
        robots="noindex",
    )



# English is a deliberate mirror of the Norwegian routes. Keeping the source
# content together makes it harder for the two versions to drift structurally.
EN_TRANSLATIONS = [
    ("Hopp til innhold", "Skip to content"), ("Språkvalg", "Language"),
    ("Meny", "Menu"), ("Lukk", "Close"), ("Hovedmeny", "Main menu"),
    ("Tjenester", "Services"), ("Metode", "Method"), ("Portefølje", "Portfolio"),
    ("Kurs", "Courses"), ("Om oss", "About"), ("Om", "About"), ("Kontakt", "Contact"),
    ("Få et tilbud", "Get a proposal"), ("Tilbud", "Proposal"),
    ("Fra idé til ferdig system.", "From first idea to a working system."),
    ("Tjenester i bunntekst", "Services in footer"), ("Kurs i bunntekst", "Courses in footer"),
    ("Systemutvikling", "Software development"), ("Design og UX", "Design and UX"),
    ("Integrasjoner", "Integrations"), ("Opplæring i AI-verktøy", "AI tool training"),
    ("Foredrag", "Talks"), ("Be om kursforslag", "Ask for a course proposal"),
    ("Skriv til oss", "Write to us"), ("Personvern", "Privacy"),
    ("BUILD YOUR DREAM", "BUILD YOUR DREAM"),
    ("Ta kontakt", "Get in touch"),
    ("Fra idé til ferdig produkt.", "From idea to finished product."),
    ("Fra idé til ferdig produkt — BUILD YOUR DREAM. Hosting og drift, logo og merkevare, nettside, app eller integrasjon: Vi tar hele løpet og leverer noe som faktisk kjører.", "From idea to finished product — BUILD YOUR DREAM. Hosting and operations, logo and brand, website, app or integration: we own the whole journey and deliver something that actually runs."),
    ("Bedrift eller privat. Vi tar deg fra første tanke til merkevare, lansering og stabil drift — med samme standard hele veien.", "Business or personal. We take you from first thought to brand, launch and stable operations — to the same standard all the way."),
    ("Hele løpet. Ett sted.", "The whole journey. One place."),
    ("Hosting, brand, web og produkter — BUILD YOUR DREAM fra første idé til ferdig drift.", "Hosting, brand, web and products — BUILD YOUR DREAM from first idea to finished operations."),
    ("Hosting og drift", "Hosting and operations"),
    ("Vi setter opp, sikrer og drifter løsningen din. Fra domene og deploy til overvåking — stabilt når den skal brukes.", "We set up, secure and run your solution. From domain and deployment to monitoring — stable when it needs to be used."),
    ("Se hosting og drift", "See hosting and operations"),
    ("Logo og merkevare", "Logo and brand"),
    ("Et tydelig uttrykk som folk kjenner igjen. Logo, identitet og grensesnitt som gjør ideen din vanskelig å overse.", "A clear identity people recognise. Logo, visual identity and interfaces that make your idea hard to overlook."),
    ("Se merkevaren", "See the brand"),
    ("Produkter og apper", "Products and apps"),
    ("Vi bygger det som skal selges, brukes eller få jobben gjort — nettsider, webapper, API-er og egne produkter.", "We build what needs to be sold, used or get the job done — websites, web apps, APIs and products of your own."),
    ("Fra idé til drift", "From idea to operations"),
    ("Du får én partner gjennom strategi, design, utvikling, lansering og videre drift. Behovet først — løsningen etterpå.", "You get one partner through strategy, design, development, launch and ongoing operations. The need first — the solution after."),
    ("Start prosjektet", "Start the project"),
    ("Hosting og drift, logo og merkevare, nettside, app og produkt. Vi tar hele løpet fra første skisse til stabil bruk.", "Hosting and operations, logo and brand, website, app and product. We own the whole journey from first sketch to stable use."),
    ("01 · Hosting og drift", "01 · Hosting and operations"),
    ("Fra lansering til stabil hverdag.", "From launch to a stable everyday."),
    ("Vi setter opp hosting, domene, deploy, sikkerhet og backup — og holder det ryddig etter lansering. Du får en løsning som er rask å åpne og enkel å eie.", "We set up hosting, domains, deployment, security and backups — and keep it tidy after launch. You get a solution that is quick to open and easy to own."),
    ("Trenger du bare en trygg hjemside, eller skal et helt produkt kjøre på nett? Vi møter behovet der det er.", "Do you need a simple, reliable website, or should a whole product run online? We meet the need where it is."),
    ("Det som følger med", "What is included"),
    ("Hosting og deploy", "Hosting and deployment"),
    ("Domene, TLS og sikkerhet", "Domain, TLS and security"),
    ("Backup og videre drift", "Backups and ongoing operations"),
    ("02 · Logo og merkevare", "02 · Logo and brand"),
    ("Et uttrykk som bærer produktet.", "An identity that carries the product."),
    ("Vi lager logo, visuell retning og merkevare som gjør ideen tydelig — fra første skisse til ferdige flater. Du får en identitet som fungerer på skjerm, i salg og i hverdagen.", "We create the logo, visual direction and brand that make the idea clear — from first sketch to finished surfaces. You get an identity that works on screen, in sales and in everyday use."),
    ("Har du allerede en logo, bygger vi videre på den. Starter du fra blanke ark, starter vi med det som skal bli husket.", "Already have a logo? We build on it. Starting from a blank page? We start with what should be remembered."),
    ("Brand i praksis", "Brand in practice"),
    ("Logo og merkevare", "Logo and brand"),
    ("Webdesign og UX", "Web design and UX"),
    ("Komponenter som kan brukes igjen", "Components that can be reused"),
    ("Strategi, brand, UX, kode, API, hosting og overlevering. Ett oppdrag. Du forholder deg til oss — hele veien.", "Strategy, brand, UX, code, API, hosting and handover. One project. You deal with us — all the way."),
    ("Fem steg fra idé til ferdig produkt. Vi eier alle. Du slipper å koordinere fire leverandører og håpe at de mener det samme.", "Five steps from idea to finished product. We own all of them. You do not have to coordinate four vendors and hope they mean the same thing."),
    ("Fra idé til ferdig produkt — BUILD YOUR DREAM. Vi tegner, bygger, hoster, kobler og overleverer.", "From idea to finished product — BUILD YOUR DREAM. We design, build, host, connect and hand over."),
    ("BUILD YOUR DREAM: Vi eier hele løpet — hosting, brand, web, app og drift — så du slipper å koordinere fire leverandører.", "BUILD YOUR DREAM: We own the whole journey — hosting, brand, web, app and operations — so you do not have to coordinate four vendors."),
    ("Du får et ferdig produkt som kjører.", "You get a finished product that runs."),
    ("Hosting, deploy og en kort dokumentasjon gjør løsningen enkel å eie.", "Hosting, deployment and short documentation make the solution easy to own."),
    ("Koden, innholdet og merkevaren er deres.", "The code, content and brand are yours."),
    ("Org.nr", "Company no."),
    ("Valgfritt", "Optional"), ("Navn", "Name"), ("E-post", "Email"),
    ("Telefon", "Phone"), ("Bedrift eller privat", "Business or personal"),
    ("Ikke oppgitt", "Not specified"), ("Bedrift", "Business"), ("Privat", "Personal"),
    ("Melding", "Message"), ("Tema", "Topic"), ("Antall", "Number of people"),
    ("Sted eller digitalt", "Location or online"), ("Ønsket dato", "Preferred date"),
    ("Hva dreier det seg om", "What is this about"), ("Hva skal løses?", "What needs solving?"),
    ("Få et opplegg", "Get a session plan"), ("Be om et personlig tilbud", "Ask for a personal proposal"),
    ("Et konkret problem, eller en løs idé", "A concrete problem, or a rough idea"),
    ("For eksempel valg av AI-verktøy i kundearbeid", "For example, choosing AI tools for customer work"),
    ("Hos dere, eller digitalt", "At your place, or online"),
    ("E-postprogrammet åpnes med meldingen. Send den derfra, eller skriv direkte til", "Your email app will open with the message. Send it from there, or write directly to"),
    ("Uten JavaScript åpnes e-postprogrammet direkte.", "Without JavaScript, your email app opens directly."),
    ("Takk. Vi svarer med et forslag, ikke et nyhetsbrev.", "Thanks. We reply with a proposal, not a newsletter."),
    ("Takk. Vi svarer med et personlig tilbud, ikke et nyhetsbrev.", "Thanks. We reply with a personal proposal, not a newsletter."),
    ("Takk. Vi svarer med et opplegg, ikke et nyhetsbrev.", "Thanks. We reply with a session plan, not a newsletter."),
    ("Filtrer prosjekter", "Filter projects"), ("Alle", "All"), ("Nett", "Web"),
    ("App", "App"), ("API", "API"), ("Python", "Python"), ("Type", "Type"),
    ("Stack", "Stack"), ("Rolle", "Role"), ("Resultat", "Result"),
    ("Åpne prosjektet", "Open the project"), ("Åpne Laden Labs", "Open Laden Labs"),
    ("Åpne PapirGlider Klubben", "Open PapirGlider Klubben"), ("Se nedlastinger", "See downloads"),
    ("Live · eget produkt", "Live · own product"), ("Live · Levi", "Live · Levi"),
    ("Prototype · last ned", "Prototype · download"),
    ("macOS Apple Silicon", "macOS Apple Silicon"), ("macOS Intel", "macOS Intel"),
    ("Windows (.zip)", "Windows (.zip)"), ("Linux (.AppImage)", "Linux (.AppImage)"),
    ("Laden AS — vi bygger det ferdig", "Laden AS — we build it all the way"),
    ("Vi bygger nettsider, apper og API-er i Rust og Python, for bedrifter og privatpersoner. Fra idé til ferdig system. Kurs og foredrag om AI-verktøy.", "We build websites, apps and APIs in Rust and Python, for businesses and people with a project. From first idea to a working system. Courses and talks about AI tools."),
    ("Utvikler · Oslo", "Developer · Oslo"), ("Vi bygger det ferdig.", "We build it all the way."),
    ("Et konkret problem. En løs idé. Begge deler holder. Vi bygger nettsiden, appen eller integrasjonen — og du får noe som faktisk kjører. Rust når det må være raskt. Python når det må være fleksibelt. Et grensesnitt folk orker å åpne mandagen etter.", "A concrete problem. A rough idea. Either is enough. We build the website, app or integration — and you get something that actually runs. Rust when it needs to be fast. Python when it needs to stay flexible. An interface people will still want to open on Monday morning."),
    ("Se porteføljen", "See the portfolio"), ("Ett oppdrag. Ett godt system.", "One project. One solid system."),
    ("Bedrift eller privat. Stort system eller liten idé. Hvis det skal bygges, bygger vi det — med samme standard.", "Business or personal. Big system or small idea. If it needs building, we build it — to the same standard."),
    ("Interne verktøy folk faktisk åpner. Kundeportaler. API-er som får systemene dine til å snakke sammen. Nettsider som tåler mandagen etter lansering — ikke bare lanseringsfesten.", "Internal tools people actually open. Customer portals. APIs that get your systems talking. Websites that hold up on the Monday after launch — not just at the launch party."),
    ("Et eget verktøy, en klubbside, en liten app, eller en idé du har gått med lenge nok. Vi tar den like alvorlig som et bedriftsoppdrag. Lite oppdrag. Samme presisjon.", "A tool of your own, a club site, a small app, or an idea you have carried around long enough. We take it as seriously as a business project. Small project. Same precision."),
    ("Du snakker med oss. Ikke med fire underleverandører.", "You talk to us. Not four subcontractors."),
    ("Dette kan vi gjøre for deg", "Here is what we can do for you"),
    ("Fire ting. Ingen av dem er en pakke du må presse behovet inn i.", "Four things. None of them is a package you have to squeeze your needs into."),
    ("Programvare", "Software"), ("Skreddersydd nett med API i ryggen. Apper for bedrift og privat. Rust og Python — valgt fordi de passer til jobben, ikke fordi det står i en pitch.", "A tailored web build with an API behind it. Apps for business and personal projects. Rust and Python — chosen because they fit the job, not because they look good in a pitch."),
    ("Se hvordan vi bygger", "See how we build"), ("UX for web, mobil og nettbrett. Rent, moderne, artikulert. Widgets der de gjør en jobb — aldri som pynt.", "UX for web, mobile and tablet. Clean, modern, articulate. Widgets where they do a job — never as decoration."),
    ("Se designet", "See the design"), ("Kurs og foredrag", "Courses and talks"),
    ("Vi lærer teamet AI-verktøyene de allerede betaler for. Foredrag hos dere, eller på skjerm. Klar til bruk mandagen etter.", "We teach teams the AI tools they already pay for. Talks at your place or on screen. Ready to use the following Monday."),
    ("Et tilbud skrevet til deg. Ikke en meny med pakkepriser. Behovet først — prisen etterpå.", "A proposal written for you. Not a menu of package prices. The need first — the price after."),
    ("Be om tilbudet", "Ask for a proposal"), ("Idé til produkt", "Idea to product"),
    ("Strategi, UX, kode, API og overlevering. Ett oppdrag. Du forholder deg til oss — hele veien.", "Strategy, UX, code, API and handover. One project. You deal with us — all the way."),
    ("Raskt og stødig i Rust. Integrasjon, data og automatisering i Python. Vi velger, og vi kan si hvorfor.", "Fast and steady in Rust. Integration, data and automation in Python. We choose, and we can tell you why."),
    ("Fysisk og digitalt", "In person and online"), ("Kurs og foredrag hos dere eller på skjerm. Samme opplegg. Vi tilpasser rommet — ikke innholdet bort.", "Courses and talks at your place or on screen. Same setup. We adapt to the room — not away the substance."),
    ("Utvalgt arbeid", "Selected work"), ("Ekte produkter. Lab'z, PapirGlider og Ldash — Everything you need — bygget, levert, til å prøve.", "Real products. Lab'z, PapirGlider and Ldash — Everything you need — built, delivered, ready to try."),
    ("Slik blir det gjort", "How it gets done"), ("Fem steg. Vi eier alle. Du slipper å håpe at fire leverandører mener det samme.", "Five steps. We own all of them. You do not have to hope four vendors mean the same thing."),
    ("Kundebehov", "Customer need"), ("Utvikling (Rust/Python)", "Development (Rust/Python)"),
    ("Implementasjon og API", "Implementation and API"), ("Ferdig løsning", "Working solution"),
    ("Les hele løpet", "Read the full process"), ("AI-verktøy, uten mystikk.", "AI tools, without the mystery."),
    ("Vi lærer teamet å bruke verktøyene de allerede betaler for. Foredrag som kan brukes mandagen etter. Hos dere, eller digitalt.", "We teach teams to use the tools they already pay for. Talks you can use the following Monday. At your place or online."),
    ("Fortell oss hva som skal løses.", "Tell us what needs solving."), ("Et konkret problem er perfekt. En løs idé holder også. Vi svarer med et tilbud til deg — ikke en pakke fra hylla.", "A concrete problem is perfect. A rough idea works too. We reply with a proposal for you — not an off-the-shelf package."),
    ("Vi leser den selv.", "We read it ourselves."), ("Be om kursforslag", "Ask for a course proposal"),
    ("Fra behov til ferdig løsning.", "From need to working solution."), ("Vi eier hele løpet, så du slipper å koordinere fire leverandører og håpe at de mener det samme.", "We own the whole process, so you do not have to coordinate four vendors and hope they mean the same thing."),
    ("Stegene", "The steps"), ("Start med behovet", "Start with the need"), ("Fortell hva som skal bli bedre. Vi svarer med et personlig tilbud.", "Tell us what should get better. We reply with a personal proposal."),
    ("Arbeid som kjører.", "Work that runs."), ("Tre produkter fra Laden AS: Lab'z for etisk øving, PapirGlider for klubben, og Ldash — Everything you need: et ops-dashboard du kan laste ned og teste.", "Three products from Laden AS: Lab'z for ethical practice, PapirGlider for the club, and Ldash — Everything you need: an ops dashboard you can download and try."),
    ("Prosjekter", "Projects"), ("Et prosjekt som ligner", "A similar project"), ("Beskriv behovet. Vi svarer med et tilbud — ikke en standardpakke.", "Describe the need. We reply with a proposal — not a standard package."), ("Beskriv et prosjekt", "Describe a project"),
    ("Fra idé til noe som kjører.", "From idea to something that runs."), ("Laden AS dekker hele løpet. Du får ikke en skisse og et håp — du får et produkt.", "Laden AS covers the whole process. You do not get a sketch and a hope — you get a product."),
    ("Språkvalg", "Language choice"), ("Skreddersydde nettsider, webapplikasjoner og frittstående applikasjoner. Til bedrift og privat.", "Tailored websites, web applications and standalone apps. For business and personal projects."),
    ("Leveransen er kjørende programvare. Språket velges etter krav til ytelse, integrasjon og vedlikehold — ikke etter det som sto i fjorårets pitchdeck.", "The delivery is working software. The language follows your needs for performance, integration and maintenance — not last year's pitch deck."),
    ("Rust brukes når tjenesten skal være rask, bruke lite ressurser og kjøre lenge uten overraskelser.", "Rust is for services that need to be fast, light on resources and steady over time."),
    ("Python brukes når arbeidet er integrasjon, automatisering, data eller en kobling mot AI-verktøy. Veien fra behov til prototyp er kortere.", "Python is for integration, automation, data or an AI connection. The path from need to prototype is shorter."),
    ("Svar som må komme fort", "Responses that need to be fast"), ("Lav ressursbruk", "Low resource use"), ("Tjenester som skal kjøre lenge og riktig", "Services that should run for a long time, correctly"),
    ("Integrasjoner mellom systemer", "Integrations between systems"), ("Automatisering og data", "Automation and data"), ("AI-koblinger, og en kortere vei til prototyp", "AI connections, and a shorter path to prototype"),
    ("Full UX for web, mobil og nettbrett. Uttrykket er rent, moderne og artikulert — det samme grepet vi bruker når en side skal overbevise uten støy.", "Full UX for web, mobile and tablet. Clean, modern and articulate — the same approach we use when a page needs to persuade without noise."),
    ("Widgets brukes kun der de viser tilstand, valg eller fremdrift. Aldri som dekor. Under er samme innhold i tre bredder.", "Widgets belong where they show state, choices or progress. Never as decoration. Below is the same content at three widths."),
    ("Bredde på forhåndsvisning", "Preview width"), ("Mobil", "Mobile"), ("Nettbrett", "Tablet"), ("Timebestilling", "Appointment booking"), ("Ledig i dag", "Available today"),
    ("Samme timer, samme tekst. Bare rammen bytter bredde.", "Same slots, same copy. Only the frame changes width."), ("Tirsdag", "Tuesday"), ("Onsdag", "Wednesday"), ("Velg tid", "Choose a time"), ("Forhåndsvisning. Samme innhold i tre bredder.", "Preview. Same content at three widths."),
    ("API-tilpasning og backend som får systemer til å snakke sammen.", "API adaptation and backend that get systems talking."), ("Eksempler, som byttes mot det dere faktisk bruker: CRM, betaling, booking, interne databaser.", "Examples, swapped for what you actually use: CRM, payments, booking, internal databases."),
    ("Fra kilde til Laden AS", "From source to Laden AS"), ("Kilde", "Source"), ("Tilkoblet", "Connected"), ("Systemet som allerede finnes. CRM, betaling, booking eller en intern database. Navnet byttes mot deres.", "The system already in place. CRM, payments, booking or an internal database. The name is swapped for yours."), ("Feltene, feilene og tilgangen. Her avtales hva som sendes, og hva som skjer når noe mangler.", "The fields, errors and access. This is where we decide what gets sent, and what happens when something is missing."), ("Tjenesten som leser, tilpasser og skriver videre. Den får systemene til å snakke sammen.", "The service that reads, adapts and passes things on. It gets the systems talking."),
    ("Et personlig tilbud", "A personal proposal"), ("Tilbudet tar utgangspunkt i behovet — ikke en pakkepris-meny.", "The proposal starts with the need — not a package-price menu."),
    ("Strategi og design", "Strategy and design"), ("Flyten tegnes før kode.", "The flow is drawn before code."), ("Innholdet prioriteres: hva som må være synlig, og hva som kan vente.", "The content is prioritised: what must be visible, and what can wait."), ("UX lages for web, mobil og nettbrett, med de samme oppgavene i alle tre.", "UX is made for web, mobile and tablet, with the same jobs across all three."), ("Du ser retningen før utviklingen starter.", "You see the direction before development starts."),
    ("Språk velges etter krav, ikke etter vane.", "Languages are chosen for the requirements, not habit."), ("Rust når tjenesten skal være rask, nøktern på ressurser og kjøre lenge.", "Rust when the service needs to be fast, lean on resources and run for a long time."), ("Python når oppgaven er integrasjon, automatisering, data eller en AI-kobling.", "Python when the task is integration, automation, data or an AI connection."), ("Omfanget holdes til det som er avtalt.", "The scope stays within what we agreed."), ("Du får kjørende programvare underveis.", "You get working software along the way."),
    ("Det nye kobles til det som allerede finnes.", "The new connects to what is already there."), ("API-ene tilpasses feltene, feilene og tilgangen dere faktisk har.", "The APIs are adapted to the fields, errors and access you actually have."), ("Det kan være et CRM, betaling, booking eller en intern database.", "That might be a CRM, payments, booking or an internal database."), ("Feil skal være synlige og forståelige.", "Errors should be visible and understandable."), ("Overleveringen skjer mot et miljø dere kan bruke.", "The handover happens into an environment you can use."),
    ("Du får et produkt som kjører.", "You get a product that runs."), ("En kort dokumentasjon sier hvordan det startes, hva det avhenger av, og hvor koden ligger.", "Short documentation says how to start it, what it depends on and where the code lives."), ("Koden og innholdet er deres.", "The code and content are yours."), ("Vi avtaler hva som skjer hvis omfanget vokser.", "We agree what happens if the scope grows."), ("Videre arbeid er et nytt, avklart behov.", "Further work is a new, clearly defined need."),
    ("Utfordring", "Challenge"), ("Grep", "Move"), ("Flate", "Surface"), ("Live produkt — åpne LLZ for den ekte flaten.", "Live product — open LLZ for the real thing."), ("Live klubbside — se laden.no/levi.", "Live club site — see laden.no/levi."), ("Last ned prototypen", "Download the prototype"), ("Mac · Windows · Linux", "Mac · Windows · Linux"), ("Usignerte testbygg. macOS kan spørre om Gatekeeper — høyreklikk og åpne, eller tillat under Personvern. Windows SmartScreen kan advare; velg «Mer info» og kjør likevel. Linux: gjør AppImage kjørbar (", "Unsigned test builds. macOS may ask about Gatekeeper — right-click and open, or allow it under Privacy. Windows SmartScreen may warn; choose ‘More info’ and run it anyway. Linux: make the AppImage executable ("), ("Live flate.", "Live surface."), ("Last ned prototypen og kjør den lokalt.", "Download the prototype and run it locally."), ("Start med et lignende behov", "Start with a similar need"), ("Beskriv problemet. Vi svarer med et personlig tilbud.", "Describe the problem. We reply with a personal proposal."),
    ("Utvikleren som også bygger.", "The developer who builds too."), ("Uansett om behovet er en kommersiell applikasjon, et internt verktøy eller et privat prosjekt — Laden AS bygger løsningen ferdig.", "Whether it is a commercial application, an internal tool or a personal project — Laden AS builds the solution all the way."), ("Bildet settes inn her. Ingen stock-foto.", "Portrait goes here. No stock photo."), ("Portrett", "Portrait"), ("AI generert bilde av daglig leder Kim Engebakken", "AI-generated image of managing director Kim Engebakken"), ("Laden AS er utvikleren som også bygger. Fra idé til ferdig produkt, for bedrift og privat. Design, kode og integrasjon i samme løp. Rust og Python er verktøyvalg — ikke identitet.", "Laden AS is the developer who builds too. From first idea to finished product, for business and personal projects. Design, code and integration in one process. Rust and Python are tools — not an identity."), ("Vi tror på verkstedet mer enn på presentasjonen: artikulert copy, skarpt UX, og programvare som tåler mandagen etter lansering.", "We believe in the workshop more than the presentation: articulate copy, sharp UX and software that holds up on the Monday after launch."), ("Et oppdrag starter med behovet", "A project starts with the need"), ("Du beskriver problemet eller idéen. Vi svarer innen et par timer, stiller spørsmål om behovet, og sender deretter et personlig tilbud. Vi er åpne 24/7.", "You describe the problem or idea. We reply within a couple of hours, ask about the need, then send a personal proposal. We are open 24/7."), ("Det dere eier", "What you own"), ("Når arbeidet er levert, eier kunden koden og innholdet. En kort dokumentasjon sier hvordan systemet kjøres, og hva det avhenger av.", "When the work is delivered, the customer owns the code and content. Short documentation says how to run the system and what it depends on."), ("Bli med på laget", "Join the team"), ("Partnere som vil bidra", "Partners who want to contribute"), ("Laden er alltid på utkikk etter partnere som vil bli med på laget — både økonomisk som sponsorer, og gjennom faktiske bidrag til arbeidet.", "Laden is always looking for partners who want to join the team — through financial support as sponsors, and through hands-on contributions to the work."), ("Slik når du oss", "How to reach us"), ("hvis du vil bidra.", "if you would like to contribute."), ("Skriv til", "Write to"), ("Adressen er Schweigaards gate 60 B, 0656 Oslo. Et menneske svarer innen et par timer. Vi er åpne 24/7. Det er ingen chatbot.", "The address is Schweigaards gate 60 B, 0656 Oslo. A person replies within a couple of hours. We are open 24/7. There is no chatbot."), ("Ta kontakt", "Get in touch"), ("Et problem eller en idé er nok.", "A problem or an idea is enough."),
    ("Et problem eller en idé er nok.", "A problem or an idea is enough."), ("Skriv det som det er. Vi svarer med et personlig tilbud — ikke et nyhetsbrev.", "Tell it like it is. We reply with a personal proposal — not a newsletter."), ("Velg", "Choose"), ("Annet", "Other"), ("Innen et par timer. Åpent 24/7.", "Within a couple of hours."), ("Tilbudet tar utgangspunkt i ditt behov — ikke en fast pakke.", "The proposal starts with your need — not a fixed package."),
    ("Praktisk opplæring i verktøyene folk allerede har. Foredrag for team — hos dere eller digitalt. Klar til bruk mandagen etter.", "Practical training in tools people already have. Talks for teams — at your place or online. Ready to use the following Monday."), ("Opplæring i bruk av AI-verktøy", "Training in using AI tools"), ("Halvdag eller dag. For team som skal bruke verktøyene i eget arbeid.", "Half-day or full-day. For teams that will use the tools in their own work."), ("Vi tar utgangspunkt i verktøyene dere allerede betaler for, og øver på oppgaver fra deres hverdag. Dette er opplæring — ikke et inspirasjonsforedrag som fordamper i pausen.", "We start with the tools you already pay for and practise tasks from your everyday work. This is training — not an inspirational talk that evaporates during the break."), ("Fysisk eller digitalt. Tema er AI i faktisk arbeid, valg av verktøy, og hva man ikke bør automatisere.", "In person or online. Topics include AI in real work, choosing tools and what should not be automated."), ("Lengde og rom avtales. Innholdet tilpasses dem som skal høre på.", "Length and setting are agreed. The content is shaped for the people listening."), ("Skriv tema, hvor mange som skal være med, og om det skal skje hos dere eller digitalt. Vi svarer med et opplegg — ikke et nyhetsbrev.", "Tell us the topic, how many people will join and whether it should happen at your place or online. We reply with a session plan — not a newsletter."),
    ("Kort om hva som skjer med det du sender inn. Sist oppdatert 1. oktober 2026.", "A short note on what happens to what you send us. Last updated 1 October 2026."), ("Ansvarlig", "Controller"), ("Det du sender inn", "What you send"), ("Navn, e-post, og det du selv skriver. Telefon, bedrift eller privat, type oppdrag, kursdetaljer og dato hvis du fyller dem inn.", "Your name, email and what you write. Phone, business or personal, project type, course details and date if you fill them in."), ("Hvordan det sendes", "How it is sent"), ("Skjemaet åpner e-postprogrammet ditt med meldingen til post@laden.no. Ingenting lagres på nettstedet. Vi leser meldingen for å svare på det du spør om.", "The form opens your email app with the message addressed to post@laden.no. Nothing is stored on the site. We read the message to answer your question."), ("Det vi ikke gjør", "What we do not do"), ("Ingen sporingskapsler. Ingen eksterne sporingsscript. Ingen nyhetsbrev. Opplysningene selges ikke.", "No tracking cookies. No external tracking scripts. No newsletters. Your information is not sold."), ("Hvor lenge", "How long"), ("E-posten ligger i postkassen vår så lenge henvendelsen er aktuell, og slettes når den ikke lenger trengs.", "The email stays in our inbox while the enquiry is active, and is deleted when it is no longer needed."), ("Dine rettigheter", "Your rights"), ("Du kan be om innsyn, retting eller sletting. Skriv til", "You can ask for access, correction or deletion. Write to"), ("Spørsmål om personvern", "Privacy questions"),
    ("Siden finnes ikke.", "This page does not exist."), ("Adressen stemmer ikke, eller siden er flyttet.", "The address is wrong, or the page has moved."), ("Til forsiden", "Back to the home page"), ("Siden finnes ikke — Laden AS", "Page not found — Laden AS"),
    ("La stå tomt", "Leave blank"),
    ("Først lytter vi. Hva som skal bli bedre, hvem som bruker det, og hva som ligger utenfor. Når det er skrevet ned, er oppdraget begge parters.", "First we listen. What should get better, who uses it and what is out of scope. Once it is written down, the project belongs to both sides."),
    ("Så tegner vi flyten — web, mobil, nettbrett. Du ser retningen før en eneste linje kode. Det er verkstedet, ikke en presentasjon.", "Then we draw the flow — web, mobile, tablet. You see the direction before a single line of code. This is a workshop, not a presentation."),
    ("Rust når det skal være raskt og kjøre lenge. Python når det skal kobles, automatiseres og komme ut fort. Vi velger etter jobben, ikke etter vane.", "Rust when it needs to be fast and run for a long time. Python when it needs to connect, automate and ship quickly. We choose for the job, not out of habit."),
    ("Vi kobler det mot systemene du allerede har. Feil skal være til å forstå. Når det virker, er det ditt.", "We connect it to the systems you already have. Errors should make sense. When it works, it is yours."),
    ("Du får noe som kjører, en kort dokumentasjon, og en ærlig prat om neste steg — hvis du vil videre.", "You get something that runs, short documentation and an honest conversation about the next step — if you want one."),
    ("Et hacker-HQ for etisk øving: labs, forum, terminal og gear — bygget som et levende produkt, ikke en demo-side.", "A hacker HQ for ethical practice: labs, forum, terminal and gear — built as a living product, not a demo page."),
    ("Live på laden.no/LLZ med labs, forum og ops-flate.", "Live at laden.no/LLZ with labs, forum and an ops surface."),
    ("Et norsk verksted for presise folder og lange glideflukter — nettside som føles som å stå ved bordet, ikke i en brosjyre.", "A Norwegian workshop for precise folds and long glides — a website that feels like standing at the table, not reading a brochure."),
    ("Live klubbside med veiledninger, trim og video.", "Live club site with guides, trim and video."),
    ("Personlig ops-dashboard i laden.no-språket: programmer, monitor, kalender, sticky notes, abonnementer — Ctrl+` og du er inne.", "A personal ops dashboard in the laden.no language: apps, monitor, calendar, sticky notes and subscriptions — Ctrl+` and you are in."),
    ("Prototype klar for Mac, Windows og Linux.", "Prototype ready for Mac, Windows and Linux."),
    ("Vi trengte et hjem for etisk hacking som føltes skarpt nok til å øve i — uten å bli et tomt markedsføringsskall. Labs, prat og gear måtte sitte i samme rytme.", "We needed a home for ethical hacking that felt sharp enough to practise in — without becoming an empty marketing shell. Labs, conversation and gear had to move in the same rhythm."),
    ("Laden Labs (LLZ) ble bygget som én plattform: challenge-board med JWT og SQLite-API, medlemsforum, Kali-inspirert konsoll og en merch-flate. Caleb er mentor i loopen. Det er verkstedet først, landingssiden etterpå.", "Laden Labs (LLZ) was built as one platform: a challenge board with JWT and a SQLite API, member forum, Kali-inspired console and merch surface. Caleb is in the loop as mentor. Workshop first, landing page second."),
    ("Nettflate med egen API-rygg, lab-spor fra recon til broken auth, og et visuelt språk som matcher laden.no: void, hack-green, grid. Python der data og auth må sitte stødig.", "A web surface with its own API backbone, lab tracks from recon to broken auth and a visual language that matches laden.no: void, hack-green, grid. Python where data and auth need to stay solid."),
    ("Plattformen kjører live. Folk kan øve, snakke shop og hente gear uten å forlate samme verden. Det er produktet vi viser når noen spør hva «ferdig» faktisk betyr.", "The platform is live. People can practise, talk shop and pick up gear without leaving the same world. This is the product we show when someone asks what ‘finished’ really means."),
    ("Klubben trengte mer enn en velkomstside. Folk skulle folde med hendene mens de leste — dart for distanse, seilere for tid i lufta, og trim som faktisk forklarer hvorfor flyet dykker.", "The club needed more than a welcome page. People should fold with their hands while reading — darts for distance, gliders for time aloft and trim that actually explains why the plane dives."),
    ("Vi bygde et verksted: hero med tydelig løfte, korte seksjoner med kicker-nummer, veiledninger og innebygde videoer. Tonen er rolig, konkret og overbevisende — aerodynamikk i lommeformat, uten å miste leken.", "We built a workshop: a hero with a clear promise, short sections with kicker numbers, guides and embedded videos. The tone is calm, concrete and persuasive — pocket-sized aerodynamics without losing the play."),
    ("Lett, rask statisk nettflate. Typografi og bildebruk som bærer klubbens preg. Ingen unødvendig rammeverkvekt mellom brukeren og folden.", "A light, fast static web surface. Typography and imagery carry the club's character. No unnecessary framework weight between the user and the fold."),
    ("Siden ligger live under laden.no/levi. Den selger ikke hardt — den inviterer. Samme artikulasjon vi bruker når et produkt skal overbevise uten støy.", "The site is live at laden.no/levi. It does not sell hard — it invites. The same articulation we use when a product needs to persuade without noise."),
    ("Vi ville ha et lett, hack-aktig dashboard som åpnes på snarvei: egne programmer, host-monitorering, kalender, sticky notes og abonnementsoversikt — uten tung enterprise-følelse.", "We wanted a light, hack-like dashboard that opens on a shortcut: your apps, host monitoring, calendar, sticky notes and subscription overview — without the heavy enterprise feel."),
    ("Ldash er bygget som Electron-skall med React-UI i laden.no-paletten (void, hack-green, cyan). Widgets kan dras i edit-modus, størrelsesklasser tilpasses, og Control Panel samler innstillingene. Prototypen pakkes for tre OS slik at du kan teste den lokalt.", "Ldash is built as an Electron shell with a React UI in the laden.no palette (void, hack-green, cyan). Widgets can be dragged in edit mode, size classes adapt and Control Panel gathers the settings. The prototype is packaged for three OSes so you can test it locally."),
    ("Electron + Vite + React + TypeScript + Zustand. Systemmetrikker via native bridge. Samme visuelle språk som Lab'z — Orbitron-titler, grid, scanlines — men laget for daglig drift, ikke for show.", "Electron + Vite + React + TypeScript + Zustand. System metrics via a native bridge. The same visual language as Lab'z — Orbitron titles, grid, scanlines — made for daily use, not show."),
    ("Du kan laste ned prototypen til Mac, Windows eller Linux. Byggene er usignerte testpakker — forvent OS-advarsler første gang. Det er meningen: rask vei til å kjenne på produktet.", "Download the prototype for Mac, Windows or Linux. The builds are unsigned test packages — expect OS warnings the first time. That is the point: a fast way to feel the product."),
    ("Fra kundebehov til ferdig løsning. Strategi, design, utvikling i Rust eller Python, implementasjon og API, og overlevering.", "From customer need to working solution. Strategy, design, development in Rust or Python, implementation and API, and handover."),
    ("Praktisk opplæring i verktøyene folk allerede har. Foredrag for team — hos dere eller digitalt. Klar til bruk mandagen etter.", "Practical training in tools people already have. Talks for teams — at your place or online. Ready to use the following Monday."),
    ("Laden AS er utvikleren som også bygger. Design, kode og integrasjon i samme løp, for bedrift og privat.", "Laden AS is the developer who builds too. Design, code and integration in one process, for business and personal projects."),
    ("Skreddersydde nettsider, applikasjoner og API-er. Rust for ytelse, Python for integrasjon og automatisering. UX for web, mobil og nettbrett.", "Tailored websites, applications and APIs. Rust for performance, Python for integration and automation. UX for web, mobile and tablet."),
    ("Praktisk opplæring i AI-verktøy, og foredrag fysisk eller digitalt. For team som skal bruke verktøyene i eget arbeid.", "Practical training in AI tools, plus talks in person or online. For teams using the tools in their own work."),
    ("Vi starter med det som skal bli bedre.", "We start with what should get better."),
    ("Hvem bruker systemet, og i hvilken situasjon.", "Who uses the system, and in what situation."),
    ("Hva som er med i oppdraget, og hva som er utenfor.", "What is part of the project, and what is out of scope."),
    ("Krav til drift, språk og eksisterende systemer skrives ned før noe tegnes.", "Requirements for operations, language and existing systems are written down before anything is drawn."),
    ("Du skal kjenne igjen problemet ditt i det vi skriver.", "You should recognise your problem in what we write."),
    ("Widgets brukes der de viser tilstand, valg eller fremdrift.", "Widgets belong where they show state, choices or progress."),
    ("Du snakker med oss. Vi tegner, bygger, kobler og overleverer. Det er hele løpet.", "You talk to us. We draw, build, connect and hand over. That is the whole process."),
    ("Steg 1 av 5", "Step 1 of 5"), ("Steg 2 av 5", "Step 2 of 5"), ("Steg 3 av 5", "Step 3 of 5"), ("Steg 4 av 5", "Step 4 of 5"), ("Steg 5 av 5", "Step 5 of 5"),
    ("Utvikling</label>", "Development</label>"), ("Se kursene", "See the courses"), ("Rust og Python", "Rust and Python"), ("Eller skriv til", "Or write to"),
    ("Du er her", "You are here"), ("Design, utvikling og drift", "Design, development and operations"), ("Design og utvikling", "Design and development"),
    ("Portefølje fra Laden AS: Laden Labs / LLZ, PapirGlider Klubben og Ldash — Everything you need — med nedlasting for Mac, Windows og Linux.", "Portfolio from Laden AS: Laden Labs / LLZ, PapirGlider Klubben and Ldash — Everything you need — with downloads for Mac, Windows and Linux."),
    ("Slik behandler Laden AS opplysninger du sender. Ingen sporingskapsler og ingen nyhetsbrev.", "How Laden AS handles the information you send. No tracking cookies and no newsletters."),
    ("Beskriv et problem eller en idé. Laden AS svarer innen et par timer med et personlig tilbud. Vi er åpne 24/7.", "Describe a problem or an idea. Laden AS replies within a couple of hours with a personal proposal. We are open 24/7."),
    ("API-integrasjon", "API integration"), ("AI-verktøy", "AI tools"),

    ("Fire arbeider fra Laden AS: Skarverakk som festivaldemo, Lab'z for etisk øving, PapirGlider for klubben, og Ldash — Everything you need.", "Four pieces of work from Laden AS: Skarverakk as a festival demo, Lab'z for ethical practice, PapirGlider for the club, and Ldash — Everything you need."),
    ("Portefølje fra Laden AS: Skarverakk festivaldemo, Laden Labs / LLZ, PapirGlider Klubben og Ldash — Everything you need.", "Portfolio from Laden AS: the Skarverakk festival demo, Laden Labs / LLZ, PapirGlider Klubben and Ldash — Everything you need."),
    ("Festivalfølge, bygget for øyeblikket", "Festival companion, built for the moment"),
    ("En festivalflate som gjør tre dager lettere å finne fram i — live nå og neste, køstatus, kart og Rockbot samlet i samme rytme.", "A festival companion that makes three days easier to navigate — live now and next, queue status, maps and Rockbot in one clear rhythm."),
    ("Festivalplattform", "Festival platform"),
    ("Nett, interaksjon, live data", "Web, interaction, live data"),
    ("Produktdesign og utvikling", "Product design and development"),
    ("Live demo på laden.no/demo/skarverakk/ — ikke et ferdig produkt.", "Live demo at laden.no/demo/skarverakk/ — not a finished product."),
    ("Demo · ikke ferdig produkt", "Demo · not a finished product"),
    ("Åpne festival-demoen", "Open the festival demo"),
    ("STRICTLY DEMO — representerer ikke et ferdig produkt.", "STRICTLY DEMO — does not represent a finished product."),
    ("Skarverakk festival-demo med program, kart, køstatus og Rockbot", "Skarverakk festival demo with programme, maps, queue status and Rockbot"),
    ("Skjermbilde fra Skarverakk-festivaldemoen.", "Screenshot from the Skarverakk festival demo."),
    ("En festival lever i øyeblikket. Når folk må lete etter hva som skjer nå, hvor neste scene er, eller om baren har kø, forsvinner litt av kvelden. Skarverakk-demoen samler det publikum faktisk trenger — uten å gjøre festivalen til et kontrollpanel.", "A festival lives in the moment. When people have to search for what is happening now, where the next stage is or whether the bar has a queue, part of the evening disappears. The Skarverakk demo gathers what the audience actually needs — without turning the festival into a control panel."),
    ("Vi gjorde programmet levende: nå skjer det her, dette kommer etterpå, og dit går du. Kart, køstatus og Rockbot ligger tett på innholdet, slik at mobilen blir en trygg følgesvenn mellom konsertene — ikke enda en app som krever oppmerksomhet.", "We made the programme feel alive: this is happening now, this comes next and that is where you go. Maps, queue status and Rockbot stay close to the content, so the phone becomes a calm companion between concerts — not another app demanding attention."),
    ("En rask, responsiv nettflate med tydelig hierarki for mobil først. Live-informasjon, navigasjon og samtale er behandlet som ett produkt, med nok struktur til at arrangøren kan bygge videre når demoen blir til et reelt oppdrag.", "A fast, responsive web surface with a clear mobile-first hierarchy. Live information, navigation and conversation are treated as one product, with enough structure for an organiser to build on when the demo becomes a real engagement."),
    ("Skarverakk viser retningen: mindre friksjon, mer festival. Du kan åpne demoen og kjenne på flyten fra første konsert til siste natt. Dette er STRICTLY en demo — den representerer ikke et ferdig produkt, og skal ikke leses som en lansert festivalplattform.", "Skarverakk shows the direction: less friction, more festival. Open the demo and feel the flow from the first concert to the last night. This is STRICTLY a demo — it does not represent a finished product and must not be read as a launched festival platform."),
]


def english_html(html):
    for norwegian, english in sorted(EN_TRANSLATIONS, key=lambda pair: len(pair[0]), reverse=True):
        html = html.replace(norwegian, english)
    html = html.replace('<html lang="nb">', '<html lang="en">')
    html = html.replace('content="nb_NO"', 'content="en_GB"')
    html = html.replace('"url": "https://laden.no/"', '"url": "https://laden.no/en/"')
    # Prefix only site routes; assets, downloads and the two live products remain shared.
    import re
    def prefix_href(match):
        value = match.group(1)
        if value.startswith(("/en/", "/css/", "/js/", "/fonts/", "/favicon", "/downloads/", "/LLZ/", "/levi/", "/demo/")):
            return 'href="' + value + '"'
        return 'href="/en' + value + '"'
    html = re.sub(r'href="(/[^"]*)"', prefix_href, html)
    html = re.sub(r'(<a href=")/en([^"#]*" data-language="no")', r'\1\2', html)
    html = html.replace('data-language="no" aria-current="page"', 'data-language="no"')
    html = html.replace('data-language="en">EN', 'data-language="en" aria-current="page">EN')
    html = html.replace('https://laden.no/portefolje/', 'https://laden.no/en/portefolje/')
    html = html.replace('https://laden.no/tjenester/', 'https://laden.no/en/tjenester/')
    html = html.replace('https://laden.no/metode/', 'https://laden.no/en/metode/')
    html = html.replace('https://laden.no/kurs/', 'https://laden.no/en/kurs/')
    html = html.replace('https://laden.no/om/', 'https://laden.no/en/om/')
    html = html.replace('https://laden.no/kontakt/', 'https://laden.no/en/kontakt/')
    html = html.replace('https://laden.no/personvern/', 'https://laden.no/en/personvern/')
    # Keep no-JavaScript mailto fallbacks in English too.
    html = html.replace('subject=Proposal%20til%20Laden%20AS', 'subject=Proposal%20for%20Laden%20AS')
    html = html.replace('subject=Courses%20og%20foredrag%20til%20Laden%20AS', 'subject=Courses%20and%20talks%20for%20Laden%20AS')
    html = html.replace('subject=Foresp%C3%B8rsel%20til%20Laden%20AS', 'subject=Enquiry%20to%20Laden%20AS')
    # Root canonical/og URL is the only remaining bare site root.
    html = html.replace('href="https://laden.no/"', 'href="https://laden.no/en/"')
    html = html.replace('content="https://laden.no/"', 'content="https://laden.no/en/"')
    return html

def main():
    # Remove old placeholder project dirs if present
    old = ["driftsverktoy", "systembro", "bestillingsflate"]
    for slug in old:
        d = ROOT / "portefolje" / slug
        if d.exists():
            for f in d.rglob("*"):
                if f.is_file():
                    f.unlink()
            for f in sorted(d.rglob("*"), reverse=True):
                if f.is_dir():
                    f.rmdir()
            d.rmdir()

    pages = {
        "index.html": home(),
        "tjenester/index.html": services(),
        "metode/index.html": method(),
        "portefolje/index.html": portfolio(),
        "kurs/index.html": course(),
        "om/index.html": about(),
        "kontakt/index.html": contact(),
        "personvern/index.html": privacy(),
        "404.html": missing(),
    }
    for project in PROJECTS:
        pages[f"portefolje/{project['slug']}/index.html"] = project_page(project)

    # Generate an English mirror under /en/ without duplicating the page structure.
    english_pages = {f"en/{rel}": english_html(html) for rel, html in pages.items()}
    all_pages = {**pages, **english_pages}
    for rel, html in all_pages.items():
        path = ROOT / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(html, encoding="utf-8")
        text = html
        if text.count("<h1") != 1:
            raise SystemExit(f"{rel} has {text.count('<h1')} h1")
    # sitemap
    urls = ["/", "/tjenester/", "/metode/", "/portefolje/", "/kurs/", "/om/", "/kontakt/", "/personvern/"]
    for p in PROJECTS:
        urls.append(f"/portefolje/{p['slug']}/")
    urls += ["/en/" + u.lstrip("/") for u in urls]
    sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u in urls:
        sm.append(f"  <url><loc>{SITE}{u}</loc></url>")
    sm.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(sm) + "\n", encoding="utf-8")
    print(f"wrote {len(all_pages)} pages")


if __name__ == "__main__":
    main()
