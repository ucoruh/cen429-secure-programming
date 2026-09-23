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


def on_post_build(config, **kwargs):
    """Hafta görsellerini her dil derlemesine kopyalar.

    Sunum HTML'i (marp çıktısı) statik bir dosyadır; MkDocs içindeki
    `assets/...` yollarını yeniden yazmaz. i18n eklentisi ise dil eki
    taşımayan dosyaları yalnız varsayılan dilin derlemesine koyar. Bu ikisi
    birleşince Türkçe sitede slayt görselleri 404 veriyordu. Burada her
    `week-NN/assets` klasörünü, o hafta klasörünün bulunduğu her derlemeye
    kaynaktan kopyalıyoruz.
    """
    import os
    import shutil

    docs = config['docs_dir']
    site = config['site_dir']

    # i18n eklentisi dil derlemelerini site kökünün altındaki klasörlere yazar
    # (ör. site/tr) ama config['site_dir'] hep kök kalır; bu yüzden kökü ve bir
    # seviye altındaki dil klasörlerini birlikte hedefliyoruz.
    kokler = [site]
    for ad in os.listdir(site):
        yol = os.path.join(site, ad)
        if os.path.isdir(yol) and len(ad) <= 5:
            kokler.append(yol)

    kopyalanan = 0
    for hafta in os.listdir(docs):
        kaynak = os.path.join(docs, hafta, 'assets')
        if not os.path.isdir(kaynak):
            continue
        for kok in kokler:
            hedef_klasor = os.path.join(kok, hafta)
            if not os.path.isdir(hedef_klasor):
                continue
            shutil.copytree(kaynak, os.path.join(hedef_klasor, 'assets'), dirs_exist_ok=True)
            kopyalanan += 1
    if kopyalanan:
        print(f'[hooks] {kopyalanan} hafta/dil klasörüne görseller kopyalandı')
