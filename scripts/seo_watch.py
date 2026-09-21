#!/usr/bin/env python3
import json
import os
import re
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import quote, urljoin
from xml.etree import ElementTree as ET

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
BASE_URL = "https://casasdeharobtt.es/"
DOMAIN = "casasdeharobtt.es"
SITEMAP_URL = urljoin(BASE_URL, "sitemap.xml")

TARGET_KEYWORDS = [
    "casas de haro",
    "casas de haro cuenca",
    "btt casas de haro",
    "rutas casas de haro",
    "ciclismo casas de haro",
    "club casas de haro btt",
]

PRIORITY_PAGES = [
    "index.html",
    "historia.html",
    "rutas.html",
    "galeria.html",
    "news.html",
    "patrocinadores.html",
]


def norm(value):
    return re.sub(r"\s+", " ", (value or "").strip().lower())


def md_escape(value):
    return str(value).replace("|", "\\|").replace("\n", " ")


def page_url(path):
    return BASE_URL if path == "index.html" else urljoin(BASE_URL, path)


def load_sitemap():
    path = ROOT / "sitemap.xml"
    if not path.exists():
        return []
    root = ET.fromstring(path.read_text(encoding="utf-8"))
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    return [loc.text.strip() for loc in root.findall(".//sm:loc", ns) if loc.text]


def static_audit():
    sitemap_urls = set(load_sitemap())
    rows = []
    warnings = []

    for rel in PRIORITY_PAGES:
        path = ROOT / rel
        if not path.exists():
            rows.append((rel, "ERROR", "Archivo no encontrado"))
            warnings.append(f"{rel}: archivo no encontrado")
            continue

        soup = BeautifulSoup(path.read_text(encoding="utf-8", errors="replace"), "html.parser")
        title = soup.title.get_text(" ", strip=True) if soup.title else ""
        desc_tag = soup.find("meta", attrs={"name": re.compile("^description$", re.I)})
        desc = desc_tag.get("content", "").strip() if desc_tag else ""
        canonical_tag = soup.find("link", attrs={"rel": lambda x: x and "canonical" in x})
        canonical = canonical_tag.get("href", "").strip() if canonical_tag else ""
        h1s = soup.find_all("h1")
        robots_tag = soup.find("meta", attrs={"name": re.compile("^robots$", re.I)})
        robots = robots_tag.get("content", "").lower() if robots_tag else ""
        missing_alt = sum(1 for img in soup.find_all("img") if not img.has_attr("alt") or not img.get("alt", "").strip())
        body_text = soup.get_text(" ", strip=True)
        issues = []

        if not title:
            issues.append("sin title")
        if not desc:
            issues.append("sin meta description")
        if len(h1s) != 1:
            issues.append(f"{len(h1s)} H1")
        if not canonical:
            issues.append("sin canonical")
        elif canonical != page_url(rel):
            issues.append("canonical no coincide")
        if "noindex" in robots:
            issues.append("noindex")
        if page_url(rel) not in sitemap_urls:
            issues.append("fuera del sitemap")
        if missing_alt:
            issues.append(f"{missing_alt} img sin alt")

        local_mentions = norm(title + " " + body_text).count("casas de haro")
        if rel in {"index.html", "historia.html", "rutas.html"} and local_mentions < 2:
            issues.append("poca señal 'Casas de Haro'")

        status = "OK" if not issues else "REVISAR"
        detail = "Sin incidencias básicas" if not issues else ", ".join(issues)
        rows.append((rel, status, detail))
        if issues:
            warnings.append(f"{rel}: {detail}")

    robots_path = ROOT / "robots.txt"
    robots = robots_path.read_text(encoding="utf-8", errors="replace") if robots_path.exists() else ""
    if SITEMAP_URL not in robots:
        warnings.append("robots.txt no declara el sitemap")

    return rows, warnings


def auth_session():
    raw = os.getenv("GSC_SERVICE_ACCOUNT_JSON", "").strip()
    if not raw:
        return None, "No está configurado GSC_SERVICE_ACCOUNT_JSON"
    try:
        from google.oauth2 import service_account
        from google.auth.transport.requests import AuthorizedSession
        info = json.loads(raw)
        creds = service_account.Credentials.from_service_account_info(
            info,
            scopes=["https://www.googleapis.com/auth/webmasters"],
        )
        return AuthorizedSession(creds), None
    except Exception as exc:
        return None, f"Error de autenticación: {exc}"


def resolve_site_property(session):
    preferred = os.getenv("GSC_SITE_URL", "").strip()
    response = session.get("https://www.googleapis.com/webmasters/v3/sites", timeout=30)
    response.raise_for_status()
    entries = response.json().get("siteEntry", [])
    allowed = [
        e.get("siteUrl", "")
        for e in entries
        if e.get("permissionLevel") not in {None, "siteUnverifiedUser"}
    ]

    if preferred and preferred in allowed:
        return preferred

    for candidate in [f"sc-domain:{DOMAIN}", BASE_URL, BASE_URL.rstrip("/")]:
        if candidate in allowed:
            return candidate

    for site in allowed:
        if DOMAIN in site:
            return site

    raise RuntimeError("La cuenta no tiene acceso a una propiedad de Search Console para casasdeharobtt.es")


def search_analytics(session, site_url, start_date, end_date):
    endpoint = f"https://www.googleapis.com/webmasters/v3/sites/{quote(site_url, safe='')}/searchAnalytics/query"
    body = {
        "startDate": start_date.isoformat(),
        "endDate": end_date.isoformat(),
        "dimensions": ["query", "page"],
        "dimensionFilterGroups": [{
            "filters": [{
                "dimension": "query",
                "operator": "contains",
                "expression": "casas de haro",
            }]
        }],
        "rowLimit": 25000,
        "dataState": "final",
    }
    response = session.post(endpoint, json=body, timeout=60)
    response.raise_for_status()
    return response.json().get("rows", [])


def aggregate_targets(rows):
    result = {}
    for keyword in TARGET_KEYWORDS:
        matches = [r for r in rows if norm((r.get("keys") or [""])[0]) == keyword]
        clicks = sum(float(r.get("clicks", 0)) for r in matches)
        impressions = sum(float(r.get("impressions", 0)) for r in matches)
        pos_num = sum(
            float(r.get("position", 0)) * float(r.get("impressions", 0))
            for r in matches
        )
        result[keyword] = {
            "clicks": clicks,
            "impressions": impressions,
            "ctr": clicks / impressions if impressions else 0,
            "position": pos_num / impressions if impressions else None,
        }
    return result


def top_queries(rows, limit=10):
    agg = defaultdict(lambda: {"clicks": 0.0, "impressions": 0.0, "pos_num": 0.0})
    for row in rows:
        keys = row.get("keys") or []
        if not keys:
            continue
        query = keys[0]
        impressions = float(row.get("impressions", 0))
        agg[query]["clicks"] += float(row.get("clicks", 0))
        agg[query]["impressions"] += impressions
        agg[query]["pos_num"] += float(row.get("position", 0)) * impressions

    data = []
    for query, values in agg.items():
        position = values["pos_num"] / values["impressions"] if values["impressions"] else None
        data.append((query, values["clicks"], values["impressions"], position))
    data.sort(key=lambda item: (item[2], item[1]), reverse=True)
    return data[:limit]


def inspect_urls(session, site_url):
    endpoint = "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect"
    results = []

    for rel in PRIORITY_PAGES:
        url = page_url(rel)
        body = {"inspectionUrl": url, "siteUrl": site_url, "languageCode": "es-ES"}
        try:
            response = session.post(endpoint, json=body, timeout=45)
            if response.status_code >= 400:
                results.append((url, "ERROR", f"HTTP {response.status_code}"))
                continue

            status = response.json().get("inspectionResult", {}).get("indexStatusResult", {})
            verdict = status.get("verdict", "UNKNOWN")
            coverage = status.get("coverageState", "")
            google_canonical = status.get("googleCanonical", "")
            user_canonical = status.get("userCanonical", "")
            crawl = status.get("lastCrawlTime", "")
            detail = coverage or verdict

            if google_canonical and user_canonical and google_canonical != user_canonical:
                detail += " | canonical Google distinto"
            if crawl:
                detail += f" | rastreo {crawl[:10]}"

            results.append((url, verdict, detail))
        except Exception as exc:
            results.append((url, "ERROR", str(exc)[:120]))

    return results


def submit_sitemap(session, site_url):
    endpoint = (
        "https://www.googleapis.com/webmasters/v3/sites/"
        + quote(site_url, safe="")
        + "/sitemaps/"
        + quote(SITEMAP_URL, safe="")
    )
    response = session.put(endpoint, timeout=30)
    if response.status_code not in {200, 204}:
        raise RuntimeError(f"HTTP {response.status_code}: {response.text[:200]}")


def build_report():
    generated = datetime.now(timezone.utc)
    static_rows, static_warnings = static_audit()

    lines = [
        "# SEO Watch — Casas de Haro",
        "",
        f"Generado: {generated.strftime('%Y-%m-%d %H:%M UTC')}",
        "",
        "Objetivo principal: ganar visibilidad orgánica para búsquedas relacionadas con **Casas de Haro** sin tráfico artificial ni técnicas de manipulación.",
        "",
        "## Auditoría técnica",
        "",
        "| Página | Estado | Detalle |",
        "|---|---|---|",
    ]

    for rel, status, detail in static_rows:
        lines.append(f"| {md_escape(rel)} | {status} | {md_escape(detail)} |")

    session, auth_error = auth_session()
    gsc_ok = False
    target_current = {}
    current_rows = []
    inspection = []

    lines += ["", "## Google Search Console", ""]

    if session is None:
        lines.append(f"**Pendiente de conexión.** {auth_error}.")
        lines.append("")
        lines.append("La auditoría técnica sí está funcionando; impresiones, clics, posición e indexación se activarán automáticamente al añadir la credencial.")
    else:
        try:
            site_url = resolve_site_property(session)
            lag_days = int(os.getenv("GSC_DATA_LAG_DAYS", "3"))
            current_end = date.today() - timedelta(days=lag_days)
            current_start = current_end - timedelta(days=27)
            previous_end = current_start - timedelta(days=1)
            previous_start = previous_end - timedelta(days=27)

            current_rows = search_analytics(session, site_url, current_start, current_end)
            previous_rows = search_analytics(session, site_url, previous_start, previous_end)
            target_current = aggregate_targets(current_rows)
            target_previous = aggregate_targets(previous_rows)
            inspection = inspect_urls(session, site_url)
            gsc_ok = True

            sitemap_status = "No reenviado en esta ejecución"
            if os.getenv("GSC_SUBMIT_SITEMAP", "false").lower() == "true":
                submit_sitemap(session, site_url)
                sitemap_status = "Enviado correctamente"

            lines.append(f"Propiedad detectada: {site_url}")
            lines.append("")
            lines.append(
                f"Periodo actual: **{current_start} → {current_end}**. "
                f"Comparativa: **{previous_start} → {previous_end}**."
            )
            lines += [
                "",
                "### Palabras clave objetivo",
                "",
                "| Consulta | Clics | Impresiones | CTR | Posición | Δ posición |",
                "|---|---:|---:|---:|---:|---:|",
            ]

            for keyword in TARGET_KEYWORDS:
                current = target_current[keyword]
                previous = target_previous[keyword]
                position = "—" if current["position"] is None else f'{current["position"]:.1f}'
                if current["position"] is None or previous["position"] is None:
                    delta = "—"
                else:
                    delta = f'{current["position"] - previous["position"]:+.1f}'

                lines.append(
                    f'| {keyword} | {current["clicks"]:.0f} | '
                    f'{current["impressions"]:.0f} | {current["ctr"]*100:.1f}% | '
                    f'{position} | {delta} |'
                )

            lines.append("")
            lines.append("_En Δ posición, un valor negativo indica mejora porque la posición media baja hacia 1._")
            lines += [
                "",
                "### Consultas con «Casas de Haro»",
                "",
                "| Consulta | Clics | Impresiones | Posición |",
                "|---|---:|---:|---:|",
            ]

            for query, clicks, impressions, position in top_queries(current_rows):
                pos_text = "—" if position is None else f"{position:.1f}"
                lines.append(
                    f"| {md_escape(query)} | {clicks:.0f} | "
                    f"{impressions:.0f} | {pos_text} |"
                )

            lines += [
                "",
                "### Estado de indexación",
                "",
                "| URL | Veredicto | Detalle |",
                "|---|---|---|",
            ]

            for url, verdict, detail in inspection:
                lines.append(
                    f"| {md_escape(url)} | {md_escape(verdict)} | {md_escape(detail)} |"
                )

            lines += ["", f"Sitemap: **{sitemap_status}**."]

        except Exception as exc:
            lines.append(f"**Error al consultar Search Console:** {md_escape(exc)}")
            lines.append("")
            lines.append("La auditoría técnica ha continuado y el workflow conserva el informe.")

    recommendations = list(static_warnings)

    if gsc_ok:
        main = target_current.get("casas de haro", {})
        impressions = main.get("impressions", 0)
        position = main.get("position")

        if impressions == 0:
            recommendations.append(
                "La consulta exacta 'casas de haro' no registra impresiones en el periodo: "
                "reforzar contenido útil y enlaces internos hacia la sección local de Historia."
            )
        elif position is not None and position > 20:
            recommendations.append(
                f"'casas de haro' aparece con posición media {position:.1f}: "
                "priorizar contenido local útil, enlaces internos y la página que Google esté mostrando."
            )

        not_indexed = [item for item in inspection if item[1] not in {"PASS", "NEUTRAL"}]
        if not_indexed:
            recommendations.append(
                f"Hay {len(not_indexed)} URL prioritarias con veredicto de indexación distinto de PASS/NEUTRAL."
            )
    else:
        recommendations.append(
            "Conectar Search Console para activar posición, impresiones, clics e inspección de URL."
        )

    lines += ["", "## Acciones recomendadas", ""]

    if recommendations:
        for recommendation in recommendations[:12]:
            lines.append(f"- {recommendation}")
    else:
        lines.append("- No se han detectado incidencias técnicas prioritarias en esta ejecución.")

    lines += [
        "",
        "## Consultas vigiladas",
        "",
        ", ".join(TARGET_KEYWORDS),
        "",
        "Este monitor no simula búsquedas, clics ni tráfico. Solo audita la web y consulta datos reales de Search Console.",
        "",
    ]

    return "\n".join(lines)


if __name__ == "__main__":
    output = Path(os.getenv("SEO_REPORT_PATH", ROOT / "seo" / "latest-report.md"))
    output.parent.mkdir(parents=True, exist_ok=True)
    report = build_report()
    output.write_text(report, encoding="utf-8")
    print(report)
