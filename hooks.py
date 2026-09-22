from markdown.extensions.toc import slugify as _slugify

# Başlık çapaları (#...) Türkçe harfleri Latin karşılığına çevirerek üretilir. Varsayılan üretici
# "ı" harfini düşürür ("Yayılma" -> "yaylma"); bu dönüşümle "yayilma" olur ve bağlantılar doğal yazılır.
_TURKCE = str.maketrans({'ı': 'i', 'İ': 'i', 'ş': 's', 'Ş': 's', 'ğ': 'g', 'Ğ': 'g',
                         'ç': 'c', 'Ç': 'c', 'ö': 'o', 'Ö': 'o', 'ü': 'u', 'Ü': 'u'})


def slugify_tr(value, separator):
    return _slugify(value.translate(_TURKCE), separator)


def on_config(config, **kwargs):
    config['mdx_configs'].setdefault('toc', {})['slugify'] = slugify_tr
    return config


def on_env(env, config, files):
    env.add_extension('jinja2.ext.do')
