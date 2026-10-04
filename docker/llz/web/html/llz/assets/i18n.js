/*! Laden Labs i18n — EN / Norwegian Bokmål */
(function () {
  'use strict';

  var STORAGE = 'laden_lang';
  var DICT = { en: {}, no: {} };

  /* ── English ── */
  Object.assign(DICT.en, {
    'lang.label': 'Language',

    'nav.home': 'Home',
    'nav.forum': 'Forum',
    'nav.gear': 'Gear',
    'nav.oracle': 'Oracle',
    'nav.challenges': 'Challenges',
    'nav.community': 'Community',
    'nav.messages': 'Messages',
    'nav.login': 'Login',
    'nav.account': 'Account',
    'nav.lounge': 'Lounge',
    'nav.cart': 'Cart',
    'nav.checkout': 'Checkout',
    'nav.clear': 'Clear',
    'nav.total': 'Total',
    'nav.tips': 'Tips',

    'meta.home.title': 'Laden AS — Hunt ethically',
    'meta.home.desc': 'Laden AS public gateway for ethical hackers and bug hunters. Forum, Laden Labs, Gear (LLG), Caleb Labs mentor.',

    'hero.eyebrow': 'Public gateway · learn in process · authorized only',
    'hero.title': 'Step on.<br><em>Hunt ethically.</em>',
    'hero.lead': 'Hacker-ish HQ for ethical hackers and bug hunters. Practice in Laden Labs, talk shop on the forum, gear up in LLG — with Caleb as your mentor.',
    'hero.enter': 'Enter Laden Labs',
    'hero.ask': 'Ask Caleb',
    'hero.forum': 'Browse forum',

    'stats.labs': 'Labs · JWT+DB',
    'stats.threads': 'Forum threads',
    'stats.gear': 'Gear drops',

    'feed.title': 'Live ops feed',
    'feed.gateway': 'Gateway',
    'feed.live': '● live',
    'feed.caleb': 'Caleb ready',
    'feed.justNow': 'just now',
    'feed.e0': 'solved Easy Pickings (+50)',
    'feed.e1': 'posted in Web Exploitation',
    'feed.e2': 'bought Laden Hoodie',
    'feed.e3': 'dropped a gentle JWT hint',
    'feed.e4': 'started Hard: Broken Auth',
    'feed.e5': 'unlocked badge: First Blood',
    'feed.e6': 'replied in OpSec Lounge',
    'feed.e7': 'checked out Sticker Pack',
    'feed.e8': '24 challenges online · JWT+DB',

    'jump.title': 'Jump in',
    'jump.lead': 'Three surfaces, one vibe — practice, talk, gear up.',
    'jump.forum.title': 'Member forum',
    'jump.forum.body': 'OpSec lounge, web writeups, Oslo meetups, and ask-anything threads.',
    'jump.forum.meta1': '12 threads',
    'jump.forum.meta2': 'Preview',
    'jump.labs.title': 'Challenge board',
    'jump.labs.body': '24 packed labs with JWT auth + SQLite API. Tracks from recon to broken auth.',
    'jump.labs.meta1': 'Easy → Hard',
    'jump.term.title': 'Laden Labs Console',
    'jump.term.body': 'LLC — Kali-style console with fictional nets + <b>lmap</b>. Starts full-screen on top.',
    'jump.gear.title': 'Laden Labs Gear',
    'jump.gear.body': 'Hoodies, stickers, caps, and joke USB drops. Cart is demo-only.',
    'jump.gear.meta1': 'NOK pricing',
    'jump.gear.meta2': 'No real charge',

    'chal.home.title': 'New challenges every week!',
    'chal.home.lead': 'Three free rotators — earn <b>Laden Labs Tokens (LLT)</b>. <span class="mono">1 LLT = 1 NOK</span>.',
    'chal.home.all': 'All free challenges →',
    'chal.home.loading': 'Loading challenges…',
    'chal.home.allBtn': 'All',
    'chal.home.guestTitle': 'New challenges every week!',
    'chal.home.guestLead': 'Free rotators · earn <b>Laden Labs Tokens (LLT)</b> · <span class="mono">1 LLT = 1 NOK</span>. <a href="/challenges/">Play &amp; earn</a> · <a href="/account/">account</a> for full Labs + XP.',
    'chal.home.memberTitle': 'Your challenge board',
    'chal.home.memberLead': 'Members: play here or in <a href="/labs/">Labs</a> — {n} challenges, submit <span class="mono">LLZ{…}</span>, bank XP.',
    'chal.home.empty': 'No challenges in this track.',
    'chal.home.error': 'Could not load challenges. <a href="/labs/">Open Laden Labs</a> directly.',
    'chal.tryFree': 'Try free',
    'chal.page.eyebrow': 'Fresh drops · every week',
    'chal.page.title': 'New challenges every week!',
    'chal.page.lead': 'Three free rotators on deck right now. Crack them, bank <strong>Laden Labs Tokens (LLT)</strong>, flex in the mini-game — then spend tokens on spicy hints or this week’s merch drop. <span class="mono">1 LLT = 1 NOK</span>. Want to keep your LLT? <a href="/account/">Create an account</a>.',
    'chal.nick': 'Session nickname',
    'chal.nick.ph': 'pick a handle…',
    'chal.nick.save': 'Save',
    'chal.nick.clear': 'Clear',
    'chal.nick.hint': 'Guests only — stays in this browser tab. Caleb & LLC will use it.',
    'chal.game.eyebrow': 'Mini-game · earn LLT',
    'chal.game.title': 'Tool Drop',
    'chal.game.start': 'Start',
    'chal.game.cashout': 'Cash out',

    'gear.strip.title': 'Gear strip · LLG',
    'gear.strip.lead': 'Same vibe as the merch desk — demo cart, no charge.',
    'gear.strip.all': 'Full gear →',
    'gear.add': 'Add',
    'gear.page.eyebrow': 'Laden Labs Gear · LLG · demo cart',
    'gear.page.title': 'Laden Labs Gear',
    'gear.page.lead': 'Laden Labs Gear (LLG) for operators. Prices in NOK. Checkout is fake — nothing is charged.',

    'discord.title': 'Community',
    'discord.body': 'Writeups, Oslo hangs, gentle hints — spoilers tagged.',
    'discord.join': 'Join Discord',

    'footer.tagline': 'Oslo · Authorized security work only',
    'footer.demo': 'Demo portal — not production auth / payments. Flags: ',
    'footer.members': 'Members online:',
    'footer.ethical': 'Ethical use only',
    'footer.legal': '© 2026 Laden AS · Org.nr. 937 285 833',

    'cart.empty': 'Empty',
    'cart.added': 'Added: {name}',
    'cart.cleared': 'Cart cleared',
    'cart.isEmpty': 'Cart is empty',
    'cart.checkout': 'Demo checkout — no charge. Thanks!',

    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.create': 'Create',
    'auth.logout': 'Logout',
    'auth.password': 'Password',
    'auth.email': 'Email',
    'auth.username': 'Username',
    'auth.forgot': 'Forgot password',
    'auth.forgotShort': 'Forgot',
    'auth.save': 'Save',
    'auth.dashboard': 'Dashboard',
    'auth.daily': 'Daily signal',
    'auth.userOrEmail': 'Username or email',
    'auth.displayName': 'Display name',
    'auth.passwordMin': 'Password (min 8)',
    'auth.enterLounge': 'Enter the lounge',
    'auth.claimBooth': 'Claim a booth',
    'auth.loungeInstead': 'Lounge instead',
    'auth.openLounge': 'Open Lab Lounge',
    'auth.accountOf': 'Account: {name}',

    'labs.eyebrow': 'Members only · ethical ops · demo DB',
    'labs.title': 'Lab Lounge',
    'labs.titleHtml': 'Lab <em>Lounge</em>',
    'labs.lead': 'Dim booths. Soft neon. Real bug classes. Step in, badge up, pick a station — hunt ethically, submit <span class="mono">LLZ{…}</span>, ask <strong style="color:var(--cyan)">Caleb</strong> when the trail goes cold.',
    'labs.room.eyebrow': 'Lab room',
    'labs.crumb': 'Breadcrumb',

    'forum.eyebrow': 'Members · demo threads · same cyber vibe',
    'forum.title': 'Forum',
    'forum.lead': 'Talk shop, share writeups, plan Oslo hangs. Full API threads live inside Laden Labs after login.',
    'forum.replies': 'replies',

    'comm.eyebrow': 'LLZ · LabZocial · ethical · Oslo',
    'comm.title': 'LLZ LabZocial<br><em>social as hell.</em>',
    'comm.lead': 'LLZ LabZocial — short posts, emoji tapbacks, friends-first feed, LabNewz tabloid, tips, and tool boards. Guests read everything; members post, react, and friend for real.',
    'comm.tabs': 'Community sections',
    'comm.friends': 'Friends',
    'comm.tips': 'Tips & tricks',
    'comm.discussions': 'Discussions',
    'comm.friendsGate': 'Login to manage friends.',
    'comm.compose': 'Drop a signal',
    'comm.compose.ph': 'Say something short. Ethical vibes only…',
    'comm.post': 'Post to LLZ',
    'comm.status': 'Community status',
    'comm.session': 'Session',
    'comm.channel': 'Channel',
    'comm.stream': 'Stream',

    'msg.gate': 'Login to read inbox, open threads, and DM any member.',
    'msg.title': 'Messages',
    'msg.inbox': 'Inbox',
    'msg.empty': 'No conversations yet.',
    'msg.compose': 'New message',
    'msg.send': 'Send',
    'msg.placeholder': 'Write a DM…',

    'oracle.tagline': 'GitHub is the force behind the search for knowledge. Speak a query — the Oracle listens across code, repos, and issues. Caleb stands ready to interpret what returns.',
    'oracle.label': 'consult · query',
    'oracle.ask': 'Ask the Oracle',
    'oracle.code': 'Code',
    'oracle.repos': 'Repos',
    'oracle.issues': 'Issues',
    'oracle.ph': 'e.g. XSS writeup, JWT none, laden labs…',
    'oracle.search': 'Oracle search',

    'tips.eyebrow': 'Operator guides',
    'tips.title': 'Tips & tricks',
    'tips.lead': 'Full writeups grown from the Community tip cards — nmap, Burp, Wireshark, msfconsole, aircrack-ng, Hydra, sqlmap, john, hashcat, ffuf. Ethical / authorized targets only.',
    'tips.open': 'Open guide →',
    'tips.guides': '16 guides',

    'term.home': 'Home',
    'term.console': 'Console',
    'llc.toggle': 'Laden Labs Console',
    'llc.placeholder': 'type help',
    'llc.clear': 'Clear screen',
    'llc.close': 'Close console',
    'llc.home': 'Home',
    'llc.resize': 'Resize console',

    'common.save': 'Save',
    'common.clear': 'Clear',
    'common.start': 'Start',
    'common.loading': 'Loading…',
    'common.error': 'Something went wrong',
    'common.back': 'Back',
    'common.all': 'All',
    'room.learn': 'Learn',
    'room.bench': 'Lab bench',
    'room.openLlc': 'Open LLC',
    'room.submit': 'Submit flag',
    'room.specialHint': 'Special hint',
    'room.specialHintUnlocked': 'Special hint unlocked',
    'room.askCaleb': 'Ask Caleb',
    'room.freeHint': 'Free hint: {hint}',
    'room.notFound': 'Lab not found',
    'room.unknownSlug': 'Unknown slug: {slug}',
    'room.membersLab': 'Members lab',
    'room.membersBody': 'This room is on the full Labs board. Free starters stay playable logged-out; everything else needs an account.',
    'room.loginViaLabs': 'Login via Labs',
    'room.freeChallenges': 'Free challenges',
    'room.loading': 'Loading…',
    'room.freeStarter': 'free starter',
    'room.membersLabMeta': 'members lab',
    'room.metaLine': '/labs/{slug}/ · {kind} · flag format LLZ{…}',
    'room.hintBuy': 'Special hint · {cost} LLT',
    'room.hintUnlockedMsg': 'Special hint unlocked (−{cost} LLT). Balance: {bal} LLT',
    'room.signInHints': 'Sign in to unlock special hints on your account.',
    'room.notEnoughLlt': 'Not enough LLT — play Tool Drop or solve a challenge first.',
    'room.loginSubmit': 'Login to submit on member labs — <a href="/account/" style="color:var(--cyan)">account</a>.',
    'room.niceFlag': 'Nice! Flag accepted.',
    'room.keepLlt': ' Want to keep your LLT? Create an account.',
    'room.alreadyBanked': ' (already banked)',
    'room.nopeHint': 'Nope — keep hunting, or buy a special hint.',
    'room.specialHintLabel': 'Special hint:',
    'room.spoilerFallback': 'Ask Caleb with the word spoiler for a stronger nudge.',
    'room.docTitle': '{title} — Labs · Laden Labs',
    'chal.learnLabel': 'Learn:',
    'chal.hintLabel': 'Hint: {hint}',
    'chal.freeHint': 'Free hint: {hint}',
    'chal.close': 'Close',
    'tip.guide': 'Guide',
    'tip.why': 'Why it matters',
    'tip.howto': 'How-to',
    'tip.examples': 'Examples',
    'tip.operator': 'Operator tip',
  });

  /* ── Norwegian Bokmål ── */
  Object.assign(DICT.no, {
    'lang.label': 'Språk',

    'nav.home': 'Home',
    'nav.forum': 'Forum',
    'nav.gear': 'Gear',
    'nav.oracle': 'Oracle',
    'nav.challenges': 'Challenges',
    'nav.community': 'Community',
    'nav.messages': 'Messages',
    'nav.login': 'Logg inn',
    'nav.account': 'Konto',
    'nav.lounge': 'Lounge',
    'nav.cart': 'Handlekurv',
    'nav.checkout': 'Til kassen',
    'nav.clear': 'Tøm',
    'nav.total': 'Totalt',
    'nav.tips': 'Tips',

    'meta.home.title': 'Laden AS — Jakt etisk',
    'meta.home.desc': 'Laden AS offentlig inngang for etiske hackere og bug hunters. Forum, Laden Labs, Gear (LLG), Caleb Labs-mentor.',

    'hero.eyebrow': 'Offentlig inngang · lær underveis · kun autorisert',
    'hero.title': 'Steg på.<br><em>Jakt etisk.</em>',
    'hero.lead': 'Hacker-HQ for etiske hackere og bug hunters. Øv i Laden Labs, snakk shop på forumet, gear opp i LLG — med Caleb som mentor.',
    'hero.enter': 'Åpne Laden Labs',
    'hero.ask': 'Spør Caleb',
    'hero.forum': 'Utforsk forum',

    'stats.labs': 'Labs · JWT+DB',
    'stats.threads': 'Forumtråder',
    'stats.gear': 'Gear-drops',

    'feed.title': 'Live ops-feed',
    'feed.gateway': 'Gateway',
    'feed.live': '● live',
    'feed.caleb': 'Caleb klar',
    'feed.justNow': 'akkurat nå',
    'feed.e0': 'løste Easy Pickings (+50)',
    'feed.e1': 'postet i Web Exploitation',
    'feed.e2': 'kjøpte Laden Hoodie',
    'feed.e3': 'slapp et mildt JWT-hint',
    'feed.e4': 'startet Hard: Broken Auth',
    'feed.e5': 'låste opp badge: First Blood',
    'feed.e6': 'svarte i OpSec Lounge',
    'feed.e7': 'sjekket ut Sticker Pack',
    'feed.e8': '24 utfordringer online · JWT+DB',

    'jump.title': 'Hopp inn',
    'jump.lead': 'Tre flater, én vibe — øv, snakk, gear opp.',
    'jump.forum.title': 'Medlemsforum',
    'jump.forum.body': 'OpSec-lounge, web-writeups, Oslo-treff og spør-om-alt-tråder.',
    'jump.forum.meta1': '12 tråder',
    'jump.forum.meta2': 'Forhåndsvisning',
    'jump.labs.title': 'Utfordringstavle',
    'jump.labs.body': '24 pakka labs med JWT-auth + SQLite-API. Spor fra recon til broken auth.',
    'jump.labs.meta1': 'Easy → Hard',
    'jump.term.title': 'Laden Labs Console',
    'jump.term.body': 'LLC — Kali-stil konsoll med fiktive nett + <b>lmap</b>. Starter fullskjerm på toppen.',
    'jump.gear.title': 'Laden Labs Gear',
    'jump.gear.body': 'Hoodies, stickers, caps og joke-USB. Handlekurv er kun demo.',
    'jump.gear.meta1': 'NOK-priser',
    'jump.gear.meta2': 'Ingen ekte trekk',

    'chal.home.title': 'Nye utfordringer hver uke!',
    'chal.home.lead': 'Tre gratis rotatorer — tjen <b>Laden Labs Tokens (LLT)</b>. <span class="mono">1 LLT = 1 NOK</span>.',
    'chal.home.all': 'Alle gratis utfordringer →',
    'chal.home.loading': 'Laster utfordringer…',
    'chal.home.allBtn': 'Alle',
    'chal.home.guestTitle': 'Nye utfordringer hver uke!',
    'chal.home.guestLead': 'Gratis rotatorer · tjen <b>Laden Labs Tokens (LLT)</b> · <span class="mono">1 LLT = 1 NOK</span>. <a href="/challenges/">Spill &amp; tjen</a> · <a href="/account/">konto</a> for fulle Labs + XP.',
    'chal.home.memberTitle': 'Din utfordringstavle',
    'chal.home.memberLead': 'Medlemmer: spill her eller i <a href="/labs/">Labs</a> — {n} utfordringer, send inn <span class="mono">LLZ{…}</span>, bank XP.',
    'chal.home.empty': 'Ingen utfordringer i dette sporet.',
    'chal.home.error': 'Kunne ikke laste utfordringer. <a href="/labs/">Åpne Laden Labs</a> direkte.',
    'chal.tryFree': 'Prøv gratis',
    'chal.page.eyebrow': 'Ferske drops · hver uke',
    'chal.page.title': 'Nye utfordringer hver uke!',
    'chal.page.lead': 'Tre gratis rotatorer på dekk nå. Knekk dem, bank <strong>Laden Labs Tokens (LLT)</strong>, flex i mini-spillet — bruk tokens på spicy hints eller ukas merch-drop. <span class="mono">1 LLT = 1 NOK</span>. Vil du beholde LLT? <a href="/account/">Opprett konto</a>.',
    'chal.nick': 'Sesjonskallenavn',
    'chal.nick.ph': 'velg et handle…',
    'chal.nick.save': 'Lagre',
    'chal.nick.clear': 'Tøm',
    'chal.nick.hint': 'Kun gjester — blir i denne fanen. Caleb & LLC bruker det.',
    'chal.game.eyebrow': 'Mini-spill · tjen LLT',
    'chal.game.title': 'Tool Drop',
    'chal.game.start': 'Start',
    'chal.game.cashout': 'Ta ut',

    'gear.strip.title': 'Gear-stripe · LLG',
    'gear.strip.lead': 'Samme vibe som merch-disken — demo-kurv, ingen trekk.',
    'gear.strip.all': 'All gear →',
    'gear.add': 'Legg i kurv',
    'gear.page.eyebrow': 'Laden Labs Gear · LLG · demo-kurv',
    'gear.page.title': 'Laden Labs Gear',
    'gear.page.lead': 'Laden Labs Gear (LLG) for operatorer. Priser i NOK. Kassen er fake — ingen trekk.',

    'discord.title': 'Community',
    'discord.body': 'Writeups, Oslo-treff, milde hints — spoilers tagget.',
    'discord.join': 'Bli med på Discord',

    'footer.tagline': 'Oslo · Kun autorisert sikkerhetsarbeid',
    'footer.demo': 'Demo-portal — ikke produksjonsauth / betaling. Flagg: ',
    'footer.members': 'Medlemmer online:',
    'footer.ethical': 'Kun etisk bruk',
    'footer.legal': '© 2026 Laden AS · Org.nr. 937 285 833',

    'cart.empty': 'Tom',
    'cart.added': 'Lagt til: {name}',
    'cart.cleared': 'Handlekurv tømt',
    'cart.isEmpty': 'Handlekurven er tom',
    'cart.checkout': 'Demo-kasse — ingen trekk. Takk!',

    'auth.login': 'Logg inn',
    'auth.register': 'Registrer',
    'auth.create': 'Opprett',
    'auth.logout': 'Logg ut',
    'auth.password': 'Passord',
    'auth.email': 'E-post',
    'auth.username': 'Brukernavn',
    'auth.forgot': 'Glemt passord',
    'auth.forgotShort': 'Glemt',
    'auth.save': 'Lagre',
    'auth.dashboard': 'Dashboard',
    'auth.daily': 'Daglig signal',
    'auth.userOrEmail': 'Brukernavn eller e-post',
    'auth.displayName': 'Visningsnavn',
    'auth.passwordMin': 'Passord (min 8)',
    'auth.enterLounge': 'Gå inn i loungen',
    'auth.claimBooth': 'Ta en booth',
    'auth.loungeInstead': 'Hellre Lounge',
    'auth.openLounge': 'Åpne Lab Lounge',
    'auth.accountOf': 'Konto: {name}',

    'labs.eyebrow': 'Kun medlemmer · etiske ops · demo-DB',
    'labs.title': 'Lab Lounge',
    'labs.titleHtml': 'Lab <em>Lounge</em>',
    'labs.lead': 'Duse booths. Myk neon. Ekte bug-klasser. Steg inn, badge opp, velg stasjon — jakt etisk, send inn <span class="mono">LLZ{…}</span>, spør <strong style="color:var(--cyan)">Caleb</strong> når sporet blir kaldt.',
    'labs.room.eyebrow': 'Lab-rom',
    'labs.crumb': 'Brødsmule',

    'forum.eyebrow': 'Medlemmer · demo-tråder · samme cyber-vibe',
    'forum.title': 'Forum',
    'forum.lead': 'Snakk shop, del writeups, planlegg Oslo-treff. Fulll API-tråder lever inne i Laden Labs etter innlogging.',
    'forum.replies': 'svar',

    'comm.eyebrow': 'LLZ · LabZocial · etisk · Oslo',
    'comm.title': 'LLZ LabZocial<br><em>sosialt som faen.</em>',
    'comm.lead': 'LLZ LabZocial — korte poster, emoji-tapbacks, venner-først-feed, LabNewz-tabloid, tips og tool-boards. Gjester leser alt; medlemmer poster, reagerer og friend for real.',
    'comm.tabs': 'Community-seksjoner',
    'comm.friends': 'Friends',
    'comm.tips': 'Tips & triks',
    'comm.discussions': 'Diskusjoner',
    'comm.friendsGate': 'Logg inn for å administrere venner.',
    'comm.compose': 'Slipp et signal',
    'comm.compose.ph': 'Si noe kort. Kun etiske vibes…',
    'comm.post': 'Post til LLZ',
    'comm.status': 'Community-status',
    'comm.session': 'Sesjon',
    'comm.channel': 'Kanal',
    'comm.stream': 'Stream',

    'msg.gate': 'Logg inn for å lese innboks, åpne tråder og DM-e medlemmer.',
    'msg.title': 'Messages',
    'msg.inbox': 'Innboks',
    'msg.empty': 'Ingen samtaler ennå.',
    'msg.compose': 'Ny melding',
    'msg.send': 'Send',
    'msg.placeholder': 'Skriv en DM…',

    'oracle.tagline': 'GitHub er kraften bak jakten på kunnskap. Si en spørring — Oracle lytter på tvers av kode, repos og issues. Caleb står klar til å tolke det som kommer tilbake.',
    'oracle.label': 'konsult · spørring',
    'oracle.ask': 'Spør Oracle',
    'oracle.code': 'Kode',
    'oracle.repos': 'Repos',
    'oracle.issues': 'Issues',
    'oracle.ph': 'f.eks. XSS writeup, JWT none, laden labs…',
    'oracle.search': 'Oracle-søk',

    'tips.eyebrow': 'Operator-guider',
    'tips.title': 'Tips & triks',
    'tips.lead': 'Fulll writeups fra Community tip-kort — nmap, Burp, Wireshark, msfconsole, aircrack-ng, Hydra, sqlmap, john, hashcat, ffuf. Kun etiske / autoriserte mål.',
    'tips.open': 'Åpne guide →',
    'tips.guides': '16 guider',

    'term.home': 'Home',
    'term.console': 'Konsoll',
    'llc.toggle': 'Laden Labs Console',
    'llc.placeholder': 'skriv help',
    'llc.clear': 'Tøm skjerm',
    'llc.close': 'Lukk konsoll',
    'llc.home': 'Home',
    'llc.resize': 'Endre størrelse',

    'common.save': 'Lagre',
    'common.clear': 'Tøm',
    'common.start': 'Start',
    'common.loading': 'Laster…',
    'common.error': 'Noe gikk galt',
    'common.back': 'Tilbake',
    'common.all': 'Alle',
    'room.learn': 'Lær',
    'room.bench': 'Lab bench',
    'room.openLlc': 'Åpne LLC',
    'room.submit': 'Send inn flagg',
    'room.specialHint': 'Spesialhint',
    'room.specialHintUnlocked': 'Spesialhint låst opp',
    'room.askCaleb': 'Spør Caleb',
    'room.freeHint': 'Gratis hint: {hint}',
    'room.notFound': 'Lab ikke funnet',
    'room.unknownSlug': 'Ukjent slug: {slug}',
    'room.membersLab': 'Medlemslab',
    'room.membersBody': 'Dette rommet er på den fulle Labs-tavla. Gratis startere kan spilles utlogget; alt annet krever konto.',
    'room.loginViaLabs': 'Logg inn via Labs',
    'room.freeChallenges': 'Gratis utfordringer',
    'room.loading': 'Laster…',
    'room.freeStarter': 'gratis starter',
    'room.membersLabMeta': 'medlemslab',
    'room.metaLine': '/labs/{slug}/ · {kind} · flaggformat LLZ{…}',
    'room.hintBuy': 'Spesialhint · {cost} LLT',
    'room.hintUnlockedMsg': 'Spesialhint låst opp (−{cost} LLT). Saldo: {bal} LLT',
    'room.signInHints': 'Logg inn for å låse opp spesialhints på kontoen din.',
    'room.notEnoughLlt': 'Ikke nok LLT — spill Tool Drop eller løs en utfordring først.',
    'room.loginSubmit': 'Logg inn for å sende inn på medlemslabs — <a href="/account/" style="color:var(--cyan)">konto</a>.',
    'room.niceFlag': 'Nice! Flagg godtatt.',
    'room.keepLlt': ' Vil du beholde LLT? Opprett konto.',
    'room.alreadyBanked': ' (allerede banket)',
    'room.nopeHint': 'Nope — fortsett jakten, eller kjøp et spesialhint.',
    'room.specialHintLabel': 'Spesialhint:',
    'room.spoilerFallback': 'Spør Caleb med ordet spoiler for et sterkere dytt.',
    'room.docTitle': '{title} — Labs · Laden Labs',
    'chal.learnLabel': 'Lær:',
    'chal.hintLabel': 'Hint: {hint}',
    'chal.freeHint': 'Gratis hint: {hint}',
    'chal.close': 'Lukk',
    'tip.guide': 'Guide',
    'tip.why': 'Hvorfor det gjelder',
    'tip.howto': 'How-to',
    'tip.examples': 'Eksempler',
    'tip.operator': 'Operator-tips',
  });

  function normalize(lang) {
    if (!lang) return 'en';
    lang = String(lang).toLowerCase().slice(0, 2);
    return lang === 'no' || lang === 'nb' || lang === 'nn' ? 'no' : 'en';
  }

  function getLang() {
    try {
      var q = new URLSearchParams(location.search).get('lang');
      if (q === 'en' || q === 'no') {
        try { localStorage.setItem(STORAGE, q); } catch (e) {}
        try {
          var u = new URL(location.href);
          u.searchParams.delete('lang');
          history.replaceState(null, '', u.pathname + u.search + u.hash);
        } catch (e2) {}
        return q;
      }
    } catch (e3) {}
    try {
      var stored = localStorage.getItem(STORAGE);
      if (stored) return normalize(stored);
    } catch (e4) {}
    return 'en';
  }

  function t(key, vars) {
    var lang = window.__ladenLang || getLang();
    var dict = DICT[lang] || DICT.en;
    var s = dict[key];
    if (s == null) s = DICT.en[key];
    if (s == null) s = key;
    if (vars && typeof vars === 'object') {
      s = String(s).replace(/\{(\w+)\}/g, function (_, k) {
        return vars[k] != null ? String(vars[k]) : '{' + k + '}';
      });
    }
    return s;
  }

  function apply(root) {
    root = root || document;
    var lang = window.__ladenLang || getLang();
    if (root.documentElement) root.documentElement.lang = lang === 'no' ? 'nb' : 'en';
    else if (document.documentElement) document.documentElement.lang = lang === 'no' ? 'nb' : 'en';

    root.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (!key) return;
      el.textContent = t(key);
    });
    root.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-html');
      if (!key) return;
      el.innerHTML = t(key);
    });
    root.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      if (!key) return;
      el.setAttribute('placeholder', t(key));
    });
    root.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-aria');
      if (!key) return;
      el.setAttribute('aria-label', t(key));
    });
    root.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-title');
      if (!key) return;
      if (el.tagName === 'TITLE') document.title = t(key);
      else el.setAttribute('title', t(key));
    });

    /* meta description on home */
    var metaKey = document.documentElement.getAttribute('data-i18n-meta');
    if (metaKey) {
      var m = document.querySelector('meta[name="description"]');
      if (m) m.setAttribute('content', t(metaKey));
    }

    syncSwitcher();
  }

  function syncSwitcher() {
    var lang = window.__ladenLang || getLang();
    document.querySelectorAll('.lang-switch .lang-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });
  }

  /* Bind explicitly authored controls; language UI is account-page only. */
  function bindSwitchers() {
    document.querySelectorAll('.lang-switch .lang-btn').forEach(function (btn) {
      if (btn.getAttribute('data-laden-lang-bound') === '1') return;
      btn.setAttribute('data-laden-lang-bound', '1');
      btn.addEventListener('click', function () {
        setLang(btn.getAttribute('data-lang'));
      });
    });
    syncSwitcher();
  }

  function setLang(lang) {
    lang = normalize(lang);
    window.__ladenLang = lang;
    try { localStorage.setItem(STORAGE, lang); } catch (e) {}
    if (document.documentElement) document.documentElement.lang = lang === 'no' ? 'nb' : 'en';
    apply(document);
    try {
      document.dispatchEvent(new CustomEvent('laden:lang', { detail: { lang: lang } }));
    } catch (e2) {}
  }

  function localizeLab(c) {
    if (!c || getLang() !== 'no') return c;
    var pack = (window.LadenI18nContent && LadenI18nContent.no && LadenI18nContent.no.labs && LadenI18nContent.no.labs[c.slug]) || null;
    if (!pack) return c;
    return Object.assign({}, c, pack);
  }

  window.LadenI18n = {
    DICT: DICT,
    getLang: getLang,
    setLang: setLang,
    t: t,
    apply: apply,
    localizeLab: localizeLab,
  };

  window.__ladenLang = getLang();

  function boot() {
    if (document.documentElement) {
      document.documentElement.lang = window.__ladenLang === 'no' ? 'nb' : 'en';
    }
    bindSwitchers();
    apply(document);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
