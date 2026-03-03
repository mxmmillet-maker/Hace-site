#!/usr/bin/env python3
"""
Generate 12 translated HTML pages for HACE website.
6 languages × 2 pages (technologie + avantages)

Uses EU CSV for EN/ES/PT, complete CSV for JA/ID/VI.
"""

import csv
import os
import re
import html as html_lib

BASE = '/Users/mxmmi1/Downloads/hace_site_complet'
DOMAIN = 'https://hacewaveenergy.com'

# ================================================================
# LANGUAGE CONFIGURATIONS
# ================================================================
LANG_CONFIG = {
    'fr': {'locale': 'fr_FR', 'flag': '🇫🇷', 'name': 'Français'},
    'en': {'locale': 'en_GB', 'flag': '🇬🇧', 'name': 'English'},
    'es': {'locale': 'es_ES', 'flag': '🇪🇸', 'name': 'Español'},
    'pt': {'locale': 'pt_PT', 'flag': '🇵🇹', 'name': 'Português'},
    'ja': {'locale': 'ja_JP', 'flag': '🇯🇵', 'name': '日本語'},
    'id': {'locale': 'id_ID', 'flag': '🇮🇩', 'name': 'Bahasa Indonesia'},
    'vi': {'locale': 'vi_VN', 'flag': '🇻🇳', 'name': 'Tiếng Việt'},
}
TARGET_LANGS = ['en', 'es', 'pt', 'ja', 'id', 'vi']
FR_TECH_SLUG = 'technologie'
FR_AVT_SLUG = 'avantages'

# ================================================================
# PARSE CSVs
# ================================================================
def parse_csv(filepath):
    data = {}
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader)  # skip header
        for row in reader:
            if not row or len(row) < 5:
                continue
            rid = row[0].strip()
            if not rid or rid.startswith('===') or rid.startswith('='):
                continue
            data[rid] = [c.strip() for c in row]
    return data

print("Parsing CSVs...")
eu = parse_csv('/Users/mxmmi1/Downloads/traductions_hace_EU.csv')
apac = parse_csv('/Users/mxmmi1/Downloads/traductions_hace_APAC.csv')
co = parse_csv('/Users/mxmmi1/Downloads/traductions_hace_complete.csv')

# Build unified: T[row_id][LANG_UPPER] = text
# Priority: EU CSV for EN/ES/PT, APAC CSV for JA/ID/VI, complete CSV as fallback
T = {}
for rid in sorted(set(eu) | set(apac) | set(co)):
    t = {}
    e = eu.get(rid, [])
    a = apac.get(rid, [])
    c = co.get(rid, [])
    t['FR'] = (e[4] if len(e) > 4 and e[4] else '') or (a[4] if len(a) > 4 and a[4] else '') or (c[4] if len(c) > 4 else '')
    for lang, ei, ci in [('EN', 5, 5), ('ES', 6, 6), ('PT', 7, 7)]:
        t[lang] = (e[ei] if len(e) > ei and e[ei] else '') or (c[ci] if len(c) > ci and c[ci] else '')
    # APAC CSV: JA=col5, ID=col6, VI=col7
    for lang, ai, ci in [('JA', 5, 8), ('ID', 6, 9), ('VI', 7, 10)]:
        t[lang] = (a[ai] if len(a) > ai and a[ai] else '') or (c[ci] if len(c) > ci and c[ci] else '')
    T[rid] = t

print(f"  {len(T)} translation entries loaded")

def tr(rid, lang):
    return T.get(rid, {}).get(lang.upper(), '')

# ================================================================
# READ TEMPLATES
# ================================================================
print("Reading templates...")
with open(os.path.join(BASE, 'technologie', 'index.html'), 'r', encoding='utf-8') as f:
    TECH_TPL = f.read()
with open(os.path.join(BASE, 'avantages', 'index.html'), 'r', encoding='utf-8') as f:
    AVT_TPL = f.read()

# ================================================================
# HELPERS
# ================================================================
def get_slugs(lang):
    return (tr('slug_tech', lang) or FR_TECH_SLUG,
            tr('slug_avantages', lang) or FR_AVT_SLUG)

def build_hreflang(page_type):
    sid = 'slug_tech' if page_type == 'tech' else 'slug_avantages'
    fr_slug = tr(sid, 'fr')
    lines = [f'  <link rel="alternate" hreflang="fr" href="{DOMAIN}/{fr_slug}/">']
    for lang in TARGET_LANGS:
        s = tr(sid, lang)
        lines.append(f'  <link rel="alternate" hreflang="{lang}" href="{DOMAIN}/{lang}/{s}/">')
    lines.append(f'  <link rel="alternate" hreflang="x-default" href="{DOMAIN}/{fr_slug}/">')
    return '\n'.join(lines)

def build_lang_selector(cur_lang, page_type):
    sid = 'slug_tech' if page_type == 'tech' else 'slug_avantages'
    ind = '          '
    lines = []
    # FR
    fr_slug = tr(sid, 'fr')
    act = ' active' if cur_lang == 'fr' else ''
    lines.append(f'{ind}<a href="../../{fr_slug}/" class="lang-option{act}"><span class="lang-flag">🇫🇷</span><span class="lang-name">Français</span></a>')
    # Others
    for lang in TARGET_LANGS:
        s = tr(sid, lang)
        cfg = LANG_CONFIG[lang]
        act = ' active' if cur_lang == lang else ''
        href = f'../{s}/' if lang == cur_lang else f'../../{lang}/{s}/'
        lines.append(f'{ind}<a href="{href}" class="lang-option{act}"><span class="lang-flag">{cfg["flag"]}</span><span class="lang-name">{cfg["name"]}</span></a>')
    return '\n'.join(lines)

# ================================================================
# META TAG REPLACEMENT (regex-based — handles avt meta bug)
# ================================================================
def replace_meta_tag(h, attr_type, attr_name, value):
    """Replace a meta tag's content attribute value."""
    if not value:
        return h
    v = html_lib.escape(value, quote=True)
    if attr_type == 'property':
        return re.sub(
            rf'(<meta property="{re.escape(attr_name)}" content=").*?(")',
            rf'\g<1>{v}\2', h, count=1)
    else:
        return re.sub(
            rf'(<meta name="{re.escape(attr_name)}" content=").*?(")',
            rf'\g<1>{v}\2', h, count=1)

def phase_meta(h, page_type, lang):
    """Phase 1: Replace all meta tag content values."""
    pf = 'tech' if page_type == 'tech' else 'avt'

    # <title>
    title = tr(f'{pf}_title', lang)
    if title:
        h = re.sub(r'<title>.*?</title>', f'<title>{html_lib.escape(title)}</title>', h, count=1)

    # Standard meta
    h = replace_meta_tag(h, 'name', 'description', tr(f'{pf}_description', lang))

    # Open Graph
    h = replace_meta_tag(h, 'property', 'og:title', tr(f'{pf}_og_title', lang))
    h = replace_meta_tag(h, 'property', 'og:description', tr(f'{pf}_og_description', lang))
    h = replace_meta_tag(h, 'property', 'og:image:alt', tr(f'{pf}_og_image_alt', lang))

    # Twitter (twitter:title = og:title)
    og_t = tr(f'{pf}_og_title', lang)
    if og_t:
        h = replace_meta_tag(h, 'name', 'twitter:title', og_t)
    h = replace_meta_tag(h, 'name', 'twitter:description', tr(f'{pf}_twitter_description', lang))
    # twitter:image:alt = og:image:alt
    img_alt = tr(f'{pf}_og_image_alt', lang)
    if img_alt:
        h = replace_meta_tag(h, 'name', 'twitter:image:alt', img_alt)

    # Dublin Core
    dc_title = tr(f'{pf}_dc_title', lang) or tr('tech_dc_title', lang)
    dc_desc = tr(f'{pf}_dc_description', lang) or tr('tech_dc_description', lang)
    h = replace_meta_tag(h, 'name', 'DC.title', dc_title)
    h = replace_meta_tag(h, 'name', 'DC.description', dc_desc)
    h = replace_meta_tag(h, 'name', 'DC.coverage', tr('tech_dc_coverage', lang))
    h = replace_meta_tag(h, 'name', 'DC.language', lang)

    # Citation
    cit = tr(f'{pf}_citation_title', lang) or tr('tech_citation_title', lang)
    h = replace_meta_tag(h, 'name', 'citation_title', cit)
    h = re.sub(r'(<meta name="citation_language" content=").*?(")', rf'\g<1>{lang}\2', h, count=1)

    # Additional semantic
    h = replace_meta_tag(h, 'name', 'subject', tr('tech_subject', lang))
    h = replace_meta_tag(h, 'name', 'topic', tr('tech_topic', lang))
    h = replace_meta_tag(h, 'name', 'classification', tr('tech_classification', lang))

    return h

# ================================================================
# BODY CONTENT REPLACEMENT
# ================================================================
def phase_body(h, page_type, lang):
    """Phase 2: Replace body text via find-and-replace."""
    lc = lang.upper()
    skip = {'slug_tech', 'slug_avantages'}

    pairs = []
    for rid, t in T.items():
        if page_type == 'tech' and rid.startswith('avt_'):
            continue
        if page_type == 'avt' and rid.startswith('tech_'):
            continue
        if rid in skip:
            continue
        fr = t.get('FR', '')
        tgt = t.get(lc, '')
        if fr and tgt and fr != tgt:
            pairs.append((fr, tgt, rid))

    # Longest first
    pairs.sort(key=lambda x: len(x[0]), reverse=True)

    ok = 0
    missed = []
    for fr, tgt, rid in pairs:
        if fr in h:
            h = h.replace(fr, tgt)
            ok += 1
        else:
            # Try HTML-entity version (< > → &lt; &gt;)
            fr_esc = fr.replace('<', '&lt;').replace('>', '&gt;')
            if fr_esc != fr and fr_esc in h:
                tgt_esc = tgt.replace('<', '&lt;').replace('>', '&gt;')
                h = h.replace(fr_esc, tgt_esc)
                ok += 1
            else:
                # Only flag as missed if it's a body content entry
                meta_suffixes = ('_title', '_description', '_og_title', '_og_description',
                    '_og_image_alt', '_twitter_description', '_dc_title', '_dc_description',
                    '_dc_coverage', '_citation_title', '_subject', '_topic', '_classification')
                if not any(rid.endswith(s) for s in meta_suffixes) and not rid.startswith('home_cta'):
                    missed.append(rid)

    status = f"{ok} replaced"
    if missed:
        status += f", {len(missed)} missed: {', '.join(missed[:5])}"
    print(f"    Body: {status}")
    return h

# ================================================================
# FIXUP: Handle entries with inline HTML tags (<em>, <strong>, <br>)
# ================================================================
def add_strong_first_clause(text):
    """Wrap text up to the first major clause break in <strong>."""
    for sep in [': ', ', ', '. ']:
        pos = text.find(sep)
        if 10 < pos < len(text) - 10:
            return f"<strong>{text[:pos]}</strong>{text[pos:]}"
    return text

def format_tech_hero_h1(tgt):
    """Format tech hero H1: wrap middle portion in <em>.
    FR: 'Comment HACE <em>transforme les vagues</em> en électricité'
    Pattern: first 2 words + <em>middle words</em> + last 2 words.
    For JA (no spaces): use character ratio from FR (~30%-70%)."""
    words = tgt.split()
    if len(words) > 4:
        first = ' '.join(words[:2])
        middle = ' '.join(words[2:-2])
        last = ' '.join(words[-2:])
        return f'{first} <em>{middle}</em> {last}'
    # Fallback for languages without spaces (JA): ratio-based
    n = len(tgt)
    start = int(n * 0.30)
    end = int(n * 0.70)
    return f'{tgt[:start]}<em>{tgt[start:end]}</em>{tgt[end:]}'

def format_avt_hero_h1(tgt):
    """Format avt hero H1: 'Sentence one. Word. Word. Word.' →
    'Sentence<br>one.<br><em>Word. Word.<br>Word.</em>'"""
    # Split into sentences
    parts = re.split(r'(?<=[\.\。])\s*', tgt)
    parts = [p for p in parts if p.strip()]
    if len(parts) < 3:
        return tgt
    # First sentence split roughly in half by words
    main = parts[0]
    words = main.split()
    if len(words) >= 2:
        mid = len(words) // 2
        line1 = ' '.join(words[:mid])
        line2 = ' '.join(words[mid:])
        first_part = f'{line1}<br>{line2}'
    else:
        # No spaces (e.g. JA) — use full sentence without break
        first_part = main
    # Accent sentences (2+): wrap in <em>, <br> before last
    accent = parts[1:]
    if len(accent) >= 2:
        em_content = ' '.join(accent[:-1]) + '<br>' + accent[-1]
    else:
        em_content = accent[0]
    return f'{first_part}<br><em>{em_content}</em>'

def format_arg_title_last_em(tgt):
    """Arg title: break ~midway, last word in <em>.
    'Oversized by design.' → 'Oversized<br>by <em>design.</em>'"""
    words = tgt.split()
    if len(words) < 2:
        return tgt
    last_word = words[-1]
    rest = words[:-1]
    mid = max(1, len(rest) // 2)
    line1 = ' '.join(rest[:mid])
    line2 = ' '.join(rest[mid:])
    if line2:
        return f'{line1}<br>{line2} <em>{last_word}</em>'
    return f'{line1}<br><em>{last_word}</em>'

def format_arg_title_first_em(tgt):
    """Arg title: first word in <em>, break after.
    'Scalable without friction.' → '<em>Scalable</em><br>without friction.'
    Works for single-word or multi-word first part followed by rest."""
    words = tgt.split()
    if len(words) < 2:
        return tgt
    return f'<em>{words[0]}</em><br>{" ".join(words[1:])}'

def format_arg_title_last_phrase_em(tgt):
    """Arg title with multiple breaks, last phrase in <em>.
    'The building block of a more ambitious ecosystem.' →
    'The building<br>block of a<br><em>more ambitious ecosystem.</em>'
    Split into 3 roughly equal parts, last in <em>."""
    words = tgt.split()
    n = len(words)
    if n < 4:
        return tgt
    third = max(1, n // 3)
    line1 = ' '.join(words[:third])
    line2 = ' '.join(words[third:third*2])
    line3 = ' '.join(words[third*2:])
    return f'{line1}<br>{line2}<br><em>{line3}</em>'

def add_para_break(tgt_text, fr_html):
    """Insert <br><br> in target text at equivalent paragraph boundary."""
    br_idx = fr_html.find('<br><br>')
    if br_idx < 0:
        return tgt_text
    before = re.sub(r'<[^>]+>', '', fr_html[:br_idx])
    after = re.sub(r'<[^>]+>', '', fr_html[br_idx + 8:])
    total = len(before) + len(after)
    if total == 0:
        return tgt_text
    ratio = len(before) / total
    target_pos = int(ratio * len(tgt_text))
    best_pos = -1
    best_dist = 99999
    for m in re.finditer(r'\. ', tgt_text):
        dist = abs(m.start() + 1 - target_pos)
        if dist < best_dist:
            best_dist = dist
            best_pos = m.start() + 1
    if 0 < best_pos < len(tgt_text) - 5:
        return tgt_text[:best_pos] + '<br><br>' + tgt_text[best_pos + 1:]
    return tgt_text

# Exact FR HTML patterns extracted from templates
TECH_FIXUP_DEFS = [
    ('tech_hero_h1',
     'Comment HACE <em>transforme les vagues</em> en \u00e9lectricit\u00e9',
     'tech_hero_h1'),
    ('tech_pillar1_solution_text',
     "<strong>Chaque syst\u00e8me est con\u00e7u sur mesure pour son site</strong>"
     " afin de maximiser le facteur de charge. Cest la cl\u00e9 de la r\u00e9ussite"
     " \u00e9conomique. Le faible co\u00fbt de l'\u00e9lectricit\u00e9 est la"
     " cons\u00e9quence directe de cette approche.",
     'strong'),
    ('tech_pillar2_solution_text',
     "<strong>HACE produit dans les pires conditions</strong>"
     " : cyclones, vagues sc\u00e9l\u00e9rates, tsunamis. Plus la mer est forte,"
     " plus la production augmente. Le syst\u00e8me est insubmersible et con\u00e7u"
     " pour durer plus de 50 ans.",
     'strong'),
    ('tech_pillar3_solution_text',
     "<strong>HACE se fabrique dans n'importe quel chantier naval</strong>,"
     " sans moyen lourd. Colonnes d'eau oscillantes en acier standard,"
     " approche industrielle de production de masse. Plus de 95% recyclable.",
     'strong'),
]

AVT_FIXUP_DEFS = [
    ('avt_hero_h1',
     'Sur-dimensionn\u00e9<br>par design.<br><em>Scalable. Cumulable.<br>Int\u00e9grable.</em>',
     'avt_hero_h1'),
    ('avt_arg1_title', 'Sur-dimensionn\u00e9<br>par <em>design.</em>', 'arg_title_last_em'),
    ('avt_arg2_title', '<em>Scalable</em><br>sans friction.', 'arg_title_first_em'),
    ('avt_arg3_title', 'Les usages<br>se <em>cumulent.</em>', 'arg_title_last_em'),
    ('avt_arg4_title', "La brique<br>d'un \u00e9cosyst\u00e8me<br><em>plus ambitieux.</em>", 'arg_title_last_phrase_em'),
    ('avt_arg1_text',
     "La turbine HACE est dimensionn\u00e9e \u00e0 1 MW nominal alors que le"
     " syst\u00e8me peut th\u00e9oriquement produire 9 MW. Ce n'est pas une"
     " contrainte \u2014 c'est une d\u00e9cision strat\u00e9gique"
     " d\u00e9lib\u00e9r\u00e9e.<br><br>R\u00e9sultat : la turbine tourne en"
     " permanence \u00e0 saturation, quelle que soit la mer. Par 5 cm de houle"
     " comme par gros temps. C'est ce ratio qui garantit un facteur de charge de"
     " 50 \u00e0 90% \u2014 l\u00e0 o\u00f9 l'\u00e9olien plafonne \u00e0 30%.",
     'para_break'),
    ('avt_arg2_text',
     "Un seul module. Une seule technologie. Un seul process de fabrication \u2014"
     " dans n'importe quel chantier naval mondial, sans moyen"
     " lourd.<br><br>Du d\u00e9monstrateur \u00e0 l'\u00eele"
     " diesel-d\u00e9pendante, du projet c\u00f4tier au parc de plusieurs GW :"
     " la m\u00eame brique. Pas de rupture technologique. Pas de nouveau risque"
     " industriel \u00e0 chaque \u00e9tape. C'est la m\u00eame machine qu'on"
     " multiplie.",
     'para_break'),
    ('avt_arg3_text',
     "Une m\u00eame installation HACE peut simultan\u00e9ment produire de"
     " l'\u00e9lectricit\u00e9, prot\u00e9ger un littoral, alimenter un"
     " \u00e9lectrolyseur et s\u00e9curiser un port. Chaque usage"
     " suppl\u00e9mentaire am\u00e9liore le ROI global sans co\u00fbt"
     " additionnel majeur.<br><br>C'est la logique inverse des autres"
     " \u00e9nergies : ici, plus vous utilisez, plus c'est rentable.",
     'para_break'),
    ('avt_arg2_img_overlay2', '1 MW<br>\u2192 plusieurs GW', 'overlay_arrow'),
    ('avt_arg2_img_overlay3',
     'M\u00eame module.<br>M\u00eame technologie.<br>Toutes \u00e9chelles.',
     'overlay_sentences'),
    ('avt_scale1_label', 'Module<br>unitaire', 'scale_label'),
    ('avt_scale2_label', 'Ligne<br>c\u00f4ti\u00e8re', 'scale_label'),
    ('avt_scale3_label', 'Parc<br>r\u00e9gional', 'scale_label'),
    ('avt_scale4_label', 'Ferme<br>offshore', 'scale_label'),
]

def phase_fixup(h, page_type, lang):
    """Phase 2b: Fix entries that phase_body missed due to inline HTML tags."""
    defs = TECH_FIXUP_DEFS if page_type == 'tech' else AVT_FIXUP_DEFS
    count = 0
    missed = []

    for csv_id, fr_html, fmt_type in defs:
        tgt = tr(csv_id, lang)
        if not tgt:
            continue
        if fr_html not in h:
            missed.append(csv_id)
            continue

        if fmt_type == 'strong':
            tgt_html = add_strong_first_clause(tgt)
        elif fmt_type == 'para_break':
            tgt_html = add_para_break(tgt, fr_html)
        elif fmt_type == 'scale_label':
            tgt_html = tgt.replace(' ', '<br>', 1)
        elif fmt_type == 'overlay_arrow':
            tgt_html = tgt.replace(' \u2192', '<br>\u2192') if ' \u2192' in tgt else tgt.replace('\u2192', '<br>\u2192', 1) if '\u2192' in tgt else tgt
        elif fmt_type == 'overlay_sentences':
            tgt_html = tgt.replace('. ', '.<br>')
        elif fmt_type == 'tech_hero_h1':
            tgt_html = format_tech_hero_h1(tgt)
        elif fmt_type == 'avt_hero_h1':
            tgt_html = format_avt_hero_h1(tgt)
        elif fmt_type == 'arg_title_last_em':
            tgt_html = format_arg_title_last_em(tgt)
        elif fmt_type == 'arg_title_first_em':
            tgt_html = format_arg_title_first_em(tgt)
        elif fmt_type == 'arg_title_last_phrase_em':
            tgt_html = format_arg_title_last_phrase_em(tgt)
        else:  # plain
            tgt_html = tgt

        h = h.replace(fr_html, tgt_html, 1)
        count += 1

    status = f"{count} tagged entries fixed"
    if missed:
        status += f", {len(missed)} not found: {', '.join(missed[:5])}"
    print(f"    Fixup: {status}")
    return h

# ================================================================
# STRUCTURAL CHANGES
# ================================================================
def phase_struct(h, page_type, lang):
    """Phase 3: Structural HTML changes."""
    cfg = LANG_CONFIG[lang]
    ts, avs = get_slugs(lang)
    cur_slug = ts if page_type == 'tech' else avs
    canonical = f'{DOMAIN}/{lang}/{cur_slug}/'

    # html lang
    h = re.sub(r'<html lang="fr">', f'<html lang="{lang}">', h, count=1)

    # content-language
    h = re.sub(r'(<meta http-equiv="content-language" content=").*?(")', rf'\g<1>{lang}\2', h, count=1)

    # Hreflang block
    hb = build_hreflang(page_type)
    h = re.sub(
        r'(\s*<link rel="alternate" hreflang="[^"]*" href="[^"]*">\s*)+',
        '\n' + hb + '\n', h, count=1)

    # Canonical
    h = re.sub(r'(<link rel="canonical" href=").*?(")', rf'\g<1>{canonical}\2', h, count=1)

    # og:url
    h = re.sub(r'(<meta property="og:url" content=").*?(")', rf'\g<1>{canonical}\2', h, count=1)

    # og:locale
    h = re.sub(r'(<meta property="og:locale" content=").*?(")', rf'\g<1>{cfg["locale"]}\2', h, count=1)

    # DC.identifier
    h = re.sub(r'(<meta name="DC.identifier" content=").*?(")', rf'\g<1>{canonical}\2', h, count=1)

    # Asset paths: ../assets/ → ../../assets/ (pages are 2 levels deep)
    h = h.replace('../assets/', '../../assets/')

    # Nav links: replace FR slugs with translated slugs
    h = h.replace(f'../{FR_TECH_SLUG}/', f'../{ts}/')
    h = h.replace(f'../{FR_AVT_SLUG}/', f'../{avs}/')

    # Language selector button label
    h = re.sub(
        r'(class="lang-btn"[^>]*>)\s*FR\s',
        rf'\g<1>\n          {lang.upper()}\n          ',
        h, count=1)

    # Language selector dropdown content
    new_sel = build_lang_selector(lang, page_type)
    h = re.sub(
        r'(<div class="lang-dropdown">)\s*(.*?)\s*(\n\s*</div>)',
        rf'\1\n{new_sel}\n        \3',
        h, flags=re.DOTALL, count=1)

    # JSON-LD: update inLanguage
    h = re.sub(r'"inLanguage"\s*:\s*"fr-FR"', f'"inLanguage":"{lang}"', h)
    h = re.sub(r'"inLanguage"\s*:\s*"fr"', f'"inLanguage":"{lang}"', h)

    # JSON-LD: update page URLs
    h = h.replace(f'{DOMAIN}/{FR_TECH_SLUG}/', f'{DOMAIN}/{lang}/{ts}/')
    h = h.replace(f'{DOMAIN}/{FR_AVT_SLUG}/', f'{DOMAIN}/{lang}/{avs}/')

    return h

# ================================================================
# MAIN
# ================================================================
print("\n" + "=" * 60)
print("GENERATING 12 TRANSLATED PAGES")
print("=" * 60)

created = []
errors = []

for lang in TARGET_LANGS:
    ts, avs = get_slugs(lang)
    for ptype, tpl, slug in [('tech', TECH_TPL, ts), ('avt', AVT_TPL, avs)]:
        path = f'/{lang}/{slug}/'
        fpath = os.path.join(BASE, lang, slug, 'index.html')
        print(f"\n  {path}")
        try:
            h = tpl
            h = phase_meta(h, ptype, lang)
            h = phase_body(h, ptype, lang)
            h = phase_fixup(h, ptype, lang)
            h = phase_struct(h, ptype, lang)
            os.makedirs(os.path.dirname(fpath), exist_ok=True)
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(h)
            created.append(path)
            print(f"    OK → {fpath}")
        except Exception as e:
            errors.append(f'{path}: {e}')
            print(f"    ERROR: {e}")
            import traceback; traceback.print_exc()

print(f"\n{'=' * 60}")
print(f"DONE: {len(created)}/12 pages created")
if errors:
    print(f"ERRORS: {len(errors)}")
    for e in errors:
        print(f"  {e}")
print("=" * 60)
