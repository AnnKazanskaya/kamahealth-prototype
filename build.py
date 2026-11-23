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
# словарь и движок перевода тоже внутри страницы
tag2 = """<script>document.write('<script src="i18n-dict.js?t=' + Date.now() + '"><\\/script><script src="i18n.js?t=' + Date.now() + '"><\\/script>');</script>"""
assert tag2 in s, 'нет тега i18n'
s = s.replace(tag2, '<script>\n' + (lab / 'i18n-dict.js').read_text(encoding='utf8') + '\n</script>\n<script>\n' + (lab / 'i18n.js').read_text(encoding='utf8') + '\n</script>', 1)
for name, mime in (('body-f.png', 'png'), ('body-m.png', 'png'), ('map-p10.jpg', 'jpeg')):
    png = f'data:image/{mime};base64,' + base64.b64encode((lab / name).read_bytes()).decode()
    assert f'url({name})' in s, name
    s = s.replace(f'url({name})', 'url(' + png + ')')
(here / 'index.html').write_text(s, encoding='utf8')
print('index.html', len(s))
