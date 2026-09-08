#!/usr/bin/env python3
import html
import json
import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE_JSON = ROOT / "data" / "site.json"
INDEX_HTML = ROOT / "index.html"

START = "<!-- NEXT_ROUTE_FALLBACK_START -->"
END = "<!-- NEXT_ROUTE_FALLBACK_END -->"

WEEKDAYS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]
MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]


def e(value):
    return html.escape(str(value or ""), quote=True)


def fmt_date(value):
    if not value:
        return "Fecha por confirmar"
    try:
        d = date.fromisoformat(str(value))
    except ValueError:
        return str(value)
    return f"{WEEKDAYS[d.weekday()]}, {d.day} de {MONTHS[d.month - 1]}"


def fmt_num(value):
    if value is None or value == "":
        return "—"
    try:
        n = float(value)
        if n.is_integer():
            return f"{int(n):,}".replace(",", ".")
        return (f"{n:g}").replace(".", ",")
    except (TypeError, ValueError):
        return str(value)


def build_fallback(route):
    title = e(route.get("title") or "Próxima ruta")
    description = e(route.get("description") or "Ruta con salida desde Casas de Haro.")
    image = e(route.get("image") or "assets/camino-atardecer.jpg")
    image_alt = e(route.get("image_alt") or "Próxima ruta del Club Casas de Haro BTT")
    discipline = e(str(route.get("discipline") or "BTT").upper())
    when = e(fmt_date(route.get("date")))
    if route.get("time"):
        when += " · " + e(route.get("time"))

    actions = []
    gpx = route.get("gpx")
    if gpx:
        actions.append(f'<a class="btn" href="{e(str(gpx).lstrip("/"))}" download>Descargar GPX</a>')
    track = route.get("track_url")
    if track:
        actions.append(f'<a class="btn secondary" href="{e(track)}" target="_blank" rel="noopener">Ver track</a>')
    actions.append('<button class="btn secondary signup-open" type="button">¡Me apunto!</button>')

    return (
        START + "\n"
        f'<article class="route" data-next-route><img src="{image}" alt="{image_alt}" loading="lazy" decoding="async">'
        f'<div class="info"><span class="pill">Próxima salida</span><p class="next-route-date">{when}</p>'
        f'<h3>{title}</h3><p>{description}</p><div class="stats">'
        f'<div class="stat"><b>{e(fmt_num(route.get("distance_km")))} km</b><span>DISTANCIA</span></div>'
        f'<div class="stat"><b>+{e(fmt_num(route.get("elevation_m")))} m</b><span>DESNIVEL</span></div>'
        f'<div class="stat"><b>{discipline}</b><span>MODALIDAD</span></div></div>'
        f'<div class="route-actions-wide">{"".join(actions)}</div></div></article>\n'
        + END
    )


def main():
    data = json.loads(SITE_JSON.read_text(encoding="utf-8"))
    route = data.get("next_route", {})
    source = INDEX_HTML.read_text(encoding="utf-8")
    replacement = build_fallback(route)

    marker_pattern = re.compile(re.escape(START) + r".*?" + re.escape(END), re.S)
    if marker_pattern.search(source):
        updated = marker_pattern.sub(replacement, source, count=1)
    else:
        article_pattern = re.compile(r'<article class="route" data-next-route>.*?</article>', re.S)
        if not article_pattern.search(source):
            raise SystemExit("No se encontró el bloque estático de próxima salida en index.html")
        updated = article_pattern.sub(replacement, source, count=1)

    if updated != source:
        INDEX_HTML.write_text(updated, encoding="utf-8")
        print("index.html sincronizado con data/site.json")
    else:
        print("index.html ya estaba sincronizado")


if __name__ == "__main__":
    main()
