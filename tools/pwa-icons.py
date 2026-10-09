from PIL import Image, ImageOps, ImageDraw
from pathlib import Path

root = Path(__file__).resolve().parents[1]
source = root / "assets/logo-cdh-oficial-2026.png"
logo = Image.open(source).convert("RGBA")
print("Logo oficial:", logo.size)
for old in ("icon-192.png","icon-512.png"):
    p = root/old
    if p.exists():
        print("Icono anterior",old,Image.open(p).size)
# Fondo azul del sitio, escudo oficial completo y sin recortes.
for size in (192, 512):
    canvas = Image.new("RGBA", (size,size), (6,38,75,255))
    emblem = logo.copy()
    emblem.thumbnail((round(size*.82),round(size*.82)), Image.Resampling.LANCZOS)
    canvas.alpha_composite(emblem, ((size-emblem.width)//2,(size-emblem.height)//2))
    canvas.convert("RGB").save(root/f"icon-{size}.png",format="PNG",optimize=True)
    print("Generado",size,Image.open(root/f"icon-{size}.png").size)
# Maskable: escudo en el centro, dentro de la zona segura.
size=512
canvas=Image.new("RGBA",(size,size),(6,38,75,255))
emblem=logo.copy()
emblem.thumbnail((round(size*.64), round(size*.64)), Image.Resampling.LANCZOS)
canvas.alpha_composite(emblem, ((size-emblem.width)//2,(size-emblem.height)//2))
canvas.convert("RGB").save(root/"assets/icon-maskable-512.png",format="PNG",optimize=True)
