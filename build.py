# Сборка сайта прототипа из mascot/lab/app4.html в один файл index.html:
# orb.js и картинка тела встраиваются (отдельные файлы блокировались, ERR_BLOCKED_BY_CLIENT).
import base64
import pathlib

here = pathlib.Path(__file__).parent
lab = here.parent / 'mascot' / 'lab'
s = (lab / 'app4.html').read_text(encoding='utf8')
orb = (lab / 'orb.js').read_text(encoding='utf8')
tag = """<script>document.write('<script src="orb.js?t=' + Date.now() + '"><\\/script>');</script>"""
assert tag in s, 'нет тега orb.js'
s = s.replace(tag, '<script>\n' + orb + '\n</script>', 1)
for name in ('body-f.png', 'body-m.png'):
    png = 'data:image/png;base64,' + base64.b64encode((lab / name).read_bytes()).decode()
    assert s.count(f'url({name})') == 2, name
    s = s.replace(f'url({name})', 'url(' + png + ')')
(here / 'index.html').write_text(s, encoding='utf8')
print('index.html', len(s))
