from pathlib import Path
import re

page_path = Path('patrocinadores.html')
page = page_path.read_text(encoding='utf-8')

# Eliminar el aviso específico sobre equipación.
page = re.sub(r'\s*<p class="sponsor-note">.*?</p>', '', page, count=1, flags=re.S)

# Simplificar el bloque de colaboradores a una única modalidad.
old_intro = '<p class="lead">Abrimos este espacio a comercios, empresas, profesionales, entidades y personas que quieran apoyar al club. La colaboración puede ser general, estar vinculada a una actividad concreta o realizarse mediante productos, material o servicios.</p>'
new_intro = '<p class="lead">Abrimos este espacio a comercios, empresas, profesionales, entidades y personas que quieran apoyar al Club Casas de Haro BTT y formar parte de su comunidad de colaboradores.</p>'
if old_intro not in page:
    raise SystemExit('No se encontró el texto de introducción de colaboradores esperado')
page = page.replace(old_intro, new_intro, 1)

page = re.sub(r'\s*<div class="support-levels".*?</div>\s*', '\n', page, count=1, flags=re.S)
page_path.write_text(page, encoding='utf-8')

# Simplificar la presentación dinámica de cada colaborador.
js_path = Path('assets/colaboradores.js')
js = js_path.read_text(encoding='utf-8')
js = re.sub(r'\n\s*const labels=\{.*?\};\n', '\n', js, count=1, flags=re.S)
js = re.sub(r"\n\s*article\.appendChild\(make\('span','collaborator-type'.*?\);", '', js, count=1)
js_path.write_text(js, encoding='utf-8')

# Quitar del panel Máster el tipo de colaboración, ya que todos los colaboradores
# pertenecen al mismo nivel.
pages_path = Path('.pages.yml')
pages = pages_path.read_text(encoding='utf-8')
field = '''      - name: collaboration_type
        label: Tipo de colaboración
        type: select
        required: true
        default: club
        options:
          values:
            - { name: club, label: Colaborador del club }
            - { name: actividad, label: Colaborador de una actividad }
            - { name: especie, label: Colaborador en especie }
'''
if field not in pages:
    raise SystemExit('No se encontró el campo collaboration_type esperado en .pages.yml')
pages = pages.replace(field, '', 1)
pages_path.write_text(pages, encoding='utf-8')

# Limpiar CSS que ya no se utiliza.
css_path = Path('assets/colaboradores.css')
css = css_path.read_text(encoding='utf-8')
for pattern in [
    r'\n?\s*\.sponsor-note\{[^}]*\}',
    r'\n?\s*\.support-levels\{[^}]*\}',
    r'\n?\s*\.support-level\{[^}]*\}',
    r'\n?\s*\.support-level>span\{[^}]*\}',
    r'\n?\s*\.support-level h3\{[^}]*\}',
    r'\n?\s*\.support-level p\{[^}]*\}',
    r'\n?\s*\.collaborator-type\{[^}]*\}',
]:
    css = re.sub(pattern, '', css)
css = css.replace('@media(max-width:900px){.support-levels,.collaborators-grid{grid-template-columns:repeat(2,1fr)}.collaboration-cta{grid-template-columns:1fr}}', '@media(max-width:900px){.collaborators-grid{grid-template-columns:repeat(2,1fr)}.collaboration-cta{grid-template-columns:1fr}}')
css = css.replace('@media(max-width:620px){.support-levels,.collaborators-grid{grid-template-columns:1fr}.collaboration-cta{padding:26px 20px;border-radius:22px}.sponsor-note{font-size:12px}}', '@media(max-width:620px){.collaborators-grid{grid-template-columns:1fr}.collaboration-cta{padding:26px 20px;border-radius:22px}}')
css_path.write_text(css, encoding='utf-8')

# Validaciones finales.
check_page = page_path.read_text(encoding='utf-8')
if 'support-levels' in check_page or 'sponsor-note' in check_page:
    raise SystemExit('La simplificación visual no se aplicó completamente')
if 'Colaborador de una actividad' in check_page or 'Colaborador en especie' in check_page:
    raise SystemExit('Quedan modalidades antiguas en la página')
if 'collaboration_type' in pages_path.read_text(encoding='utf-8'):
    raise SystemExit('El panel sigue mostrando tipos de colaboración')
if 'collaborator-type' in js_path.read_text(encoding='utf-8'):
    raise SystemExit('El JS sigue mostrando tipos de colaboración')

print('Colaboradores simplificados correctamente')
