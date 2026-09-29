# CEN429 code glossary — Turkish to English

Used while converting demo code, identifiers, comments and output strings to English (see
`docs/../YONERGE_CEN429_KOD_INGILIZCE.md`-style conversion passes, one week per run). Keep this list
consistent: reuse an existing mapping instead of inventing a new word for the same concept, and add new terms
here as you convert each week.

## Shared infrastructure (converted to English in the infra pass, 2026-09)

These names are used by every week's demos, so they were converted in one dedicated pass instead of
week-by-week (see the infra progress notes). Every occurrence in `code/**/*.c`, `*.h` and `CMakeLists.txt`
was mechanically updated to match — this table is the reference for anyone touching a not-yet-converted
week's build files, since the same identifiers appear there too.

`common/cen429_demo.h` (filename unchanged): `demo_hazirla()` → `demo_prepare()`;
`demo_gecersiz_parametre` → `demo_invalid_parameter_handler`; parameters `ifade/islev/dosya/satir/ayrilmis` →
`expression/function/file/line/reserved`.

`common/cen429_kripto.h` → `common/cen429_crypto.h` (renamed, `git mv`). Include guard `CEN429_KRIPTO_H` →
`CEN429_CRYPTO_H`. `kripto_sha256_ctx`→`crypto_sha256_ctx` · `kripto_sha256_basla/_ekle/_bitir`→
`crypto_sha256_init/_update/_final` · `kripto_sha256`→`crypto_sha256` · `KRIPTO_BLOK`→`CRYPTO_BLOCK` ·
`kripto_hmac_sha256`→`crypto_hmac_sha256` · `kripto_hkdf_sha256`→`crypto_hkdf_sha256` ·
`kripto_pbkdf2_sha256`→`crypto_pbkdf2_sha256` · `kripto_gcm_sifrele`→`crypto_gcm_encrypt` ·
`kripto_gcm_coz`→`crypto_gcm_decrypt` · `kripto_aes_ecb_blok`→`crypto_aes_ecb_block` ·
`kripto_rastgele`→`crypto_random` · `kripto_temizle`→`crypto_wipe`. Internal local variable names inside the
header were translated too (`tampon`→`buffer`, `anahtar`→`key`, `veri`→`data`, `parola`→`password`,
`tuz`→`salt`, `ozet`→`digest`, `cikti`→`output`, `sayac`→`counter`, `yazilan`→`written`, `blok`→`block`,
`giris`→`input`, `tur`→`rounds`, `ic`→`inner`, `boy`/`_boy`→`size`/`_len`).

`common/cen429_msvc.ps1`: comments translated; `$ortam`→`$vcvarsPath`, `$argumanlar`→`$argsLine`.
`Invoke-Cl` (already English) unchanged.

`cmake/cen429.cmake`: `cen429_ornek()`→`cen429_add_demo()`, `cen429_hafta_demolari()`→`cen429_add_week_demos()`.
Keyword arguments `KAYNAK`/`MOD`/`TANIM`/`KUTUPHANE`/`SECENEK` → `SOURCES`/`MODE`/`DEFINES`/`LIBS`/`OPTIONS`.
`MODE` value strings `korumasiz`/`denetimli`/`guvenli` → `unprotected`/`checked`/`secure` (`optimize` and
`asan` were already English). Macro `KUTUPHANE_DENETIMI` (defined by `MODE checked`) → `CHECKED_BUILD` —
also updated at its one consumer, `week-01/03-overflow-input/login.c`. Variables `CEN429_KLASOR`→
`CEN429_FOLDER` (its string *value* stays whatever language the week's own content is in — only the CMake
variable name changed), `CEN429_HAFTALAR`→`CEN429_WEEKS`, `CEN429_ASAN_VAR`→`CEN429_HAS_ASAN`,
`CEN429_ELF_SERT`→`CEN429_ELF_HARDENING` (consumed by `week-04/05-derleyici-korumalari/CMakeLists.txt`),
`CEN429_DEMO_DESENI`→`CEN429_DEMO_PATTERN`. New in this pass (testing infrastructure, not a rename):
`cen429_test()` CTest helper, `CEN429_WARNINGS_AS_ERRORS` / `ALLOW_WARNINGS` (warnings-as-errors opt-out for
an intentionally-warning target), `CEN429_UBSAN` (adds UBSan to `MODE asan` targets under `--sanitize`).

Root `code/CMakeLists.txt`, `CMakePresets.json`, `build.ps1`, `build.sh`, `code/README.md` / `README.en.md`,
root `.gitignore`: comments and descriptions translated; `build.ps1`/`build.sh`'s `temizle` argument →
`clean` (per-week `demo.ps1`/`demo.sh` scripts were NOT touched — they are week-specific, not shared infra).

## Seed glossary

anahtar→key · metin→text · hata→error · dosya→file · sonuc→result · kullanici→user · deger→value · tampon→buffer ·
yaz→write · oku→read · uzunluk→length · dogrula→verify · sifreli→encrypted · sifre→cipher (parola→password) ·
kontrol→check · sayac→counter · dizi→array · boyut→size · imza→signature · ozet→digest · tuz→salt · gizli→secret ·
acik→plain/public · sabit→constant · cagri→call · yansima→reflection · lisans denetimi→license check · yazici→printer ·
yol→path · komut→command · seri(lestirme)→serialization · agac→tree · ayristir→parse · banka→bank · bellek→memory ·
butunluk→integrity · calis→run · cesit(lendirme)→diversification · entropi→entropy · erisim→access · giris→input ·
gomulu→embedded · gunluk→log · gunluk_zinciri→log_chain · izin→permission · kabuk→(security) layer · kanca→hook ·
sahte kanca→fake_hook · kapsul→capsule · kopya→copy · motor→engine · ornek→sample · ornek_uret→generate_samples ·
ortak→common · ortam→environment · oyuncak→toy · rapor→report · saldiri_potansiyeli→attack_potential ·
salgin→outbreak · sizinti→leak · tarayici→scanner · tasma→overflow · temiz→clean · istemci→client · sunucu→server ·
cikti→output · tohum→seeds · veri→data · path-kandirma→path-spoofing · bellekte-parola→password-in-memory ·
tasma-giris→overflow-input · isaretli-uzunluk→signed-length · imza-tarayici→signature-scanner ·
erisim-modeli→access-model · saldiri-agaci→attack-tree · salgin-simulasyonu→outbreak-simulation ·
ace-degerlendirme→ace-evaluation · butunluk-izleme→integrity-monitoring · unix-izin-umask→unix-permissions-umask ·
kural-motoru→rule-engine · gunluk-enjeksiyonu→log-injection · kurcalamaya-dayanikli-gunluk→tamper-evident-log ·
aes-gcm-dosya→aes-gcm-file · nonce-tekrari→nonce-reuse · ecb-desen→ecb-pattern · parola-anahtar→password-to-key ·
hkdf-oturum→hkdf-session · sqlite-alan→sqlite-field · bellek-silme→memory-wipe · guvenlik-kabugu→security-layers ·
kullanim-sonrasi→use-after-free · tanimsiz-davranis→undefined-behavior · derleyici-korumalari→compiler-protections ·
sembol-dize→symbol-strings · akis-duzlestirme→flow-flattening · sql-enjeksiyonu→sql-injection ·
komut-enjeksiyonu→command-injection · yol-gecisi→path-traversal · gizleme→obfuscation.

## Week 4 additions

sizinti→leak (demo 1 folder theme; program/file: leak.c, leak_secure.c) · gizli_deger→secret_value ·
tampon→buffer · kip→mode · cift→double (kip_cift→mode_double) · oturum (struct)→session ·
eylem (fn ptr field)→action · rol (field)→role · sahte→fake · guvenli_serbest→safe_free ·
tasma→overflow (demo 5 file: overflow.c) · zayif→weak · sert→hardened (targets giris_zayif/
giris_sert→overflow_weak/overflow_hardened) · kopyala()→copy_in() · ayristir→parse (demo 4 files:
parser.c/.h, parser_secure.c; targets ayristirici→parser, ayristirici_guvenli→parser_secure,
ayristirici_fuzz(_guvenli)→parser_fuzz(_secure)) · belge_ayristir()→parse_document() ·
tur (record field)→type · uzunluk→length · hedef (dest buffer)→dest · veri→data · calis.c→replay.c
(reproducer/replay program) · tohum/→seeds/ · cokerten.bin→crash.bin · gizli.c→secret.c (demo 6;
targets gizli_acik/gizli_kapali→secret_exposed/secret_hidden) · gizli_metin()→secret_text() ·
lisans_dogrula()→license_verify() · acik→exposed (this demo's sense; elsewhere plain/public) ·
kapali→hidden · pin_duz.c→pin_flattened.c (demo 7; targets pin_duz_degil/pin_duz→pin_plain/
pin_flattened) · pin_dogrula()→pin_verify() · durum (dispatcher state var)→state · duz→plain/
flattened (context-dependent: "duz surum"→"plain version", "duzlestirilmis"→"flattened") ·
sure (CLI mode "sure")→timing · yut (sink var)→sink · opaque predicate demo (new, opaque.c):
opak yuklem→opaque predicate, always_true/always_false→opaque_true/opaque_false, yem/tuzak
dal→decoy branch.

## Week 1 additions

sahte→fake (folder/script: PATH-spoofing demo's decoy programs) · rapor→report (demo 1 program name) ·
rapor_guvenli→report_secure · komut (macro)→COMMAND · etiket (macro)→LABEL · durum→status · sistem (dir var)→system_dir ·
program (path var)→program_path · kok (SystemRoot var)→sys_root · ortam (env block var)→env_block ·
komut_satiri→cmd_line · cikis (exit code var)→exit_code · arguman→args · temiz_ortam→clean_env · hata (err var)→err ·
parola→password (demo 2 program/file: password.c, password.txt) · parola_silmez→password_no_wipe ·
parola_memset→password_memset · parola_explicit→password_explicit · silme (macro SILME)→WIPE · dokum_al→capture_dump ·
yol (dump path var)→path · bekle()→wait_here() · anahtar_turet()→derive_key() · giris_yap()→log_in() ·
derin_cagri_zinciri()→deep_call_chain() · cerceveler→frames · dokum/ (runtime output folder)→dump/ ·
giris→login (demo 3 program name; struct/field context, not the generic "input" sense) · giris_guvenli→login_secure ·
giris_denetimli (target)→login_checked · giris_asan→login_asan · oturum (struct)→session · ad (field)→name ·
yonetici (field)→admin · ad_gecerli_mi()→name_is_valid() · kopya→copy (demo 4 program name) ·
kopya_guvenli→copy_secure · kaydi_kopyala()→copy_record() · uzunluk_oku()→read_length() · kaynak (buffer)→source ·
hedef (buffer)→dest · son (strtol end ptr)→end.

## Week 6 additions

RASP week folders: 01-butunluk-hmac→01-integrity-hmac (butunluk.c→integrity.c) ·
02-hata-ayiklayici→02-debugger-detection (antidebug.c filename already English, kept) ·
03-ortam-zamanlama→03-environment-timing (ortam.c→environment.c) ·
04-preload-kanca→04-preload-hook (kanca_ana.c→preload_hook.c · sahtekanca.c→fake_hook.c, "sahte kanca" reuses the
seed glossary's fake_hook mapping) · 05-akis-sayaci→05-flow-counter (sayac.c→flow_counter.c) ·
06-bilesen-imza→06-component-signature (imza.c→signature.c) · 07-ortam-yetki→07-environment-privilege
(yetki.c→privilege.c) · 08-tamper-yanit→08-tamper-response (rasp.c filename already English, kept).

hata ayiklayici→debugger · yetki→privilege · bilesen→component · asama→stage · hedef→target · oz (self-target
keyword)→self · altin (golden value)→golden · yama(li)→patch(ed) · dogrula→verify · kaydet→save · uret→generate ·
akis→flow · iz (bitmask of visited stages)→visited_mask · supheli→suspicious · bulunan→found · ayricalikli→elevated
· var_mi→path_exists · isaret(ler) (root/mobile indicator paths)→indicator(_paths) · cihaz→device · surum→version
· parmak izi→fingerprint · tepki (politikasi)→response (policy) · mesru→legitimate · simge→symbol · ana
surec→parent process · hipervizor→hypervisor · satici imzasi→vendor signature · zamanlama→timing · yaprak (CPUID
leaf)→leaf · tekrar (loop var)→iteration · toplam→total · sure→elapsed · bos (blank check)→blank · kontrol
noktasi→checkpoint · sir→secret · paket→packet · cozulen/acildi→plaintext/opened · sahte (decoy)→decoy.

Local variable/output-string renames worth noting for future weeks: the pattern "hedef_hmac"/"dosya_oku"/
"hex_yaz" (demo 1 and 6, near-duplicate file-hashing helpers) → "target_hmac"/"read_file"/"write_hex" in both;
CLI sub-commands translated as verbs, not literal words: "kaydet/dogrula"→"save/verify" (demo 1),
"uret/dogrula"→"generate/verify" (demo 6, kept distinct from demo 1's "save" since it signs rather than hashes a
self-target) · "atlat/kismi/sirasiz"→"skip/partial/reorder" (demo 5 flow-counter modes) ·
"tamper/baska-cihaz"→ demo 8's RASP engine was extended from a binary clean/tamper decision into an explicit
warn/degrade/lock response-policy state machine (RASP_NORMAL/RASP_WARN/RASP_DEGRADE/RASP_LOCK in rasp.c) with
modes "normal/warn/degrade/lock/other-device" (replacing the old "tamper"/"baska-cihaz").

## Week 2 additions

imza-tarayici→signature-scanner (demo 1 folder; tarayici.c→scanner.c, ornek_uret.c→generate_samples.c,
kapsul.h→capsule.h, imzalar.txt→signatures.txt) · tarayici→scanner (target) · ornek_uret→generate_samples
(target) · kapsul (struct/format)→capsule · CAPSUL_ISARETI→CAPSULE_MAGIC · entropi→entropy (demo 2; entropi.c
→entropy.c, uret.c→generate.c) · erisim-modeli→access-model (demo 3; erisim.c→access.c, politika-*.txt→
policy-*.txt) · erisim→access (target) · saldiri-agaci→attack-tree (demo 4; agac.c→tree.c, agac-{nitelikli,
odeme,savunma}.txt→tree-{attributed,payment,defense}.txt) · agac→tree (target) · HEDEF/VE/VEYA/YAPRAK→GOAL/AND/
OR/LEAF (attack-tree DSL keywords) · maliyet/sure/beceri→cost/time/skill (attack-tree leaf attributes) ·
toctou (demo 6, acronym already English, folder unchanged) · yaz.c→logwriter.c · yaz→logwriter (target) ·
saldiri.sh→attack.sh · calisma/→work/ · gizli_hedef.txt→secret_target.txt · gunluk.txt→log.txt ·
TOCTOU_GECIKME_US→TOCTOU_DELAY_US · guvensiz/guvenli→unsafe/safe (toctou and log-injection modes) ·
kural-motoru→rule-engine (demo 7; motor.c→engine.c, ornek_uret.c→generate_samples.c, kurallar.txt→rules.txt,
bozuk_kural.txt→broken_rule.txt) · kural_motoru→rule_engine (target) · kural_ornek→rule_samples (target) ·
kural (rule DSL keyword)→rule · dizge→string · kosul→condition · Kapsul_Bicimi→Capsule_Format · Isaret_Hex→
Marker_Hex · Kelime_Cifti→Word_Pair · Kelime_Baglam→Word_Context · Cok_Tekrar→Many_Repeats ·
butunluk-izleme→integrity-monitoring (demo 8; butunluk.c→integrity.c) · butunluk_izle→integrity_monitor
(target) · olustur/dogrula/muhurle/muhur-dogrula/anahtar→create/verify/seal/verify-seal/key (subcommands) ·
izlenen/→monitored/ · muhur.anahtar→seal.key · ayar.conf→config.conf · kutuphane.bin→library.bin ·
baslat.txt→start.txt · veri.txt→data.txt · gizli.bin→hidden.bin · salgin-simulasyonu→outbreak-simulation
(demo 9; salgin.c→outbreak.c) · salgin→outbreak (target) · gunluk-enjeksiyonu→log-injection (demo 10;
gunluk.c→logtool.c) · gunluk→logtool (target) · uret/yaz/say→generate/write/count (subcommands) ·
02-enjeksiyon.bin→02-injection.bin · 03-kontrol.bin→03-control.bin · 04-cok-uzun.bin→04-too-long.bin ·
kurcalamaya-dayanikli-gunluk→tamper-evident-log (demo 11; gunluk_zinciri.c→log_chain.c) ·
gunluk_zinciri→log_chain (target) · uret/dogrula/degistir/sil/yerdeg/sahtele→generate/verify/modify/delete/
swap/forge (subcommands) · statik/evrim→static/evolve (key modes) · ZINCIR/1→CHAIN/1 (file header magic) ·
erisim.zdenetim→access.auditlog · dogrulayici.anahtar→verifier.key · ele-gecirilen.anahtar→stolen.key ·
evrim/statik→evolve/static (subfolders) · ace-degerlendirme→ace-evaluation (demo 12; ace.c unchanged) ·
senaryo-*.txt→scenario-*.txt · SENARYO/BELIRTEC/YALNIZRET/BUTUNLUK/AYRICALIK/SAHIP/ETIKET/KANONIK/
KALITIM_KES/ISTE→SCENARIO/TOKEN/DENYONLY/INTEGRITY/PRIVILEGE/OWNER/LABEL/CANONICAL/BREAK_INHERITANCE/REQUEST
(ACE DSL keywords) · MIRAS→INHERITED · BOS→EMPTY · OKUMA_YOK→NO_READ · OKU/YAZ/CALISTIR/SIL/IZIN_OKU/
IZIN_YAZ/SAHIP_AL/TAM→READ/WRITE/EXECUTE/DELETE/READ_CONTROL/WRITE_DAC/TAKE_OWNER/FULL (rights) ·
SAHIPLIK_AL→TAKE_OWNERSHIP (privilege; kept distinct from the TAKE_OWNER right) · Dusuk/Orta/Yuksek/Sistem→
Low/Medium/High/System · unix-izin-umask→unix-permissions-umask (demo 13; izin.c→permissions.c) ·
izin→permissions (target) · sim/gercek→sim/real (subcommands) · kisi/dsy (structs)→person/fileobj ·
rbac-clark-wilson (demo 14, acronym already English, folder unchanged) · banka.c→bank.c ·
senaryo.txt→scenario.txt · banka→bank (target) · ROL/KALITIR/IZIN/SSD_KALDIR/KULLANICI/ATA/OTURUM/
SERTIFIKALI/SERTIFIKALA/ONAY_ESIGI/BASLA/BOLUM/CALISTIR/DOGRUDAN_YAZ/DEFTER_SIL→ROLE/INHERITS/GRANT/
SSD_REMOVE/USER/ASSIGN/SESSION/CERTIFIED/CERTIFY/APPROVAL_THRESHOLD/START/SECTION/RUN/DIRECT_WRITE/
LEDGER_DELETE (RBAC/Clark-Wilson DSL keywords; SSD/DSD/CDI/IVP kept, already English acronyms) ·
YATIR/CEK/HAVALE/ONAYLA/DEFTER_OKU/HATALI_HAVALE→DEPOSIT/WITHDRAW/TRANSFER/APPROVE/LEDGER_READ/BAD_TRANSFER
(TP names) · GISE/KIDEMLI_GISE/ONAYCI/DENETCI/SERTIFIKACI→TELLER/SENIOR_TELLER/APPROVER/AUDITOR/CERTIFIER
(roles) · hesap_A/hesap_B→account_A/account_B (CDI names) · People/groups used across week-2 demos:
mehmet/ayse/zeynep/saldirgan/yonetici/operator→mark/alice/zoe/attacker/admin/operator ·
ayse/burak/cem/deniz/ece→alice/bob/carl/dana/eve (demo 14 users) · Pazarlama/Stajyer/Kullanicilar/
Yoneticiler/Yedekciler→Marketing/Intern/Users/Administrators/BackupOperators (demo 12 groups) ·
muhasebe→accounting (demo 13 group) · AYSE/HIZMET→ALICE/SERVICE (demo 13 constants) · rapor.txt/
paradoks.txt/gizli.key→report.txt/paradox.txt/secret.key (demo 13 sample files) · cikti→output (OUTDIR
macro, demo 13) · cen429-evrim→cen429-evolve (demo 11's key-evolution HMAC context string, 12→13 bytes) ·
MAVI-KEDI-42/MAVI_KEDI-42→BLUE-CATS-42/BLUE_CATS-42 (demo 7 marker motif) · KAPSUL/1→CAPSULE/1 (demo 8
generated-content header, distinct from demo 1's CAPSULE_MAGIC/demo 11's CHAIN/1) · cuzdan acildi→
wallet opened (and similarly-translated sample log messages, demo 11).

## Week 3 additions

Folder renames already covered by the seed glossary (aes-gcm-dosya→aes-gcm-file, nonce-tekrari→nonce-reuse,
ecb-desen→ecb-pattern, parola-anahtar→password-to-key, hkdf-oturum→hkdf-session, sqlite-alan→sqlite-field,
bellek-silme→memory-wipe, guvenlik-kabugu→security-layers; 06-tls-pinning's folder name was already English).

Demo 1 (aesgcm.c→aes_gcm_file.c): NONCE_BOYU/ETIKET_BOYU/ANAHTAR_BOYU→NONCE_LEN/TAG_LEN/KEY_LEN ·
hata()→fail() · dosya_oku/dosya_yaz→read_file/write_file · sifrele/coz (subcommands + functions)→
encrypt/decrypt (encrypt_file/decrypt_file) · duz/duz_boy→plain/plain_len · cik→out · ak/ak_boy→key/key_read_len ·
ver→data · sc/sc_boy→ct/ct_len · cikti/ (runtime output folder)→output/ (matches the existing
`code/**/output/` .gitignore pattern).

Demo 2 (nonce.c→nonce_reuse.c): xor_diz→xor_bytes · yaz_hex/yaz_metin→print_hex/print_text ·
anahtar→key · iv_ayni/iv_a/iv_b→nonce_same/nonce_a/nonce_b · boy→len · m1/m2 sample messages translated
to English (equal length preserved: "Attack begins at dawn, 06:00 hours!" / "Total balance is 45000, PIN
is 1234").

Demo 3 (ecb.c→ecb_pattern.c): GEN/YUK/BLOK→WIDTH/HEIGHT/BLOCK · resim→image · ciz_sifreli→draw_encrypted ·
anahtar→key · duz→plain · iyi→good (the GCM/CTR "good mode" array and its label).

Demo 4 (pbkdf2demo.c→password_to_key.c): ANAHTAR_BOYU→KEY_LEN · yaz_hex→print_hex · parola→password
("kopek123"→"dog123", an equally weak English example password, kept short/guessable on purpose) ·
tuz_a/tuz_b→salt_a/salt_b · anahtar→key · turlar→rounds_list · simdi_ms()→now_ms().

Demo 5 (hkdf.c→hkdf_session.c): ANAHTAR_BOYU→KEY_LEN · yaz_hex→print_hex · ana_sir→master_secret ·
tuz→salt · k_sifre→k_cipher (k_mac unchanged, already English) · info label strings translated
("cen429 sifreleme anahtari v1"→"cen429 encryption key v1", "cen429 MAC anahtari v1"→"cen429 MAC key v1",
"zincir ilerleme"→"chain advance") · k/yeni→k/next · et (label buffer)→label.

Demo 6 (tls_istemci.c→tls_client.c, folder already English): tcp_baglan→tcp_connect · yaz_konu→print_subject ·
spki_ozet→spki_digest · hex_coz→hex_decode · mod→mode · dogrula (subcommand + local var)→verify ·
guvensiz→insecure · ad (X509 subject buffer)→name · cikis→exit_code.

Demo 7 (sqlite_alan.c→sqlite_field.c): hata→fail · anahtar_al→get_key · SIM_ANAHTAR (env var)→SIM_KEY ·
gcm_paketle/gcm_ac→gcm_pack/gcm_unpack · ekle→insert_row · olustur/oku (subcommands + functions)→
create/read (create_db/read_db) · musteri (table)→customer · ad (column)→name · kart_sifreli (column)→
card_encrypted · sample rows "Ayse Yilmaz"/"Mehmet Kaya"→"Jane Doe"/"John Smith" · musteri.db→customers.db.

Demo 8 (bellek.c→memory_wipe.c): BOY→BUF_LEN · dolu_bayt→nonzero_bytes · sir→secret · core_ok→core_disabled ·
kilit_ok→lock_ok · "S3ntetik-Parola-2026"→"Synthetic-Password-2026".

Demo 9 (kabuk.c→security_layers.c): sar/ac→wrap/unwrap · cihaz_anahtari()→device_key() · k_cihaz/k_cuzdan/
k_oturum/k_kanal→k_device/k_wallet/k_session/k_channel · sir→secret · bozuk→corrupted · baska→other ·
uretici=RTEU;model=DEMO;seri=SN-...→manufacturer=RTEU;model=DEMO;serial=SN-... (device fingerprint strings).

## Week 5 additions (2026-09) — Java and Python demos

Note: `kabuk` already has an entry above (→"(security) layer", from the Week-1-era device/wallet demo).
That mapping is context-specific to that one demo. In Week 5's command-injection demo, `kabuk` is used in
its ordinary operating-system sense (the `sh`/`cmd.exe` command interpreter) and is translated as **shell**,
not "security layer" — pick the translation by context, do not apply the Week-1 mapping blindly.

Folders: sql-enjeksiyonu→sql-injection · komut-enjeksiyonu→command-injection · yol-gecisi→path-traversal ·
gizleme→obfuscation (already in the seed glossary above; confirmed used as folder names this week) ·
deserializasyon→deserialization · hazirla (script)→prepare · cikti (per-demo output folder)→output.

Demo 1 (SqlDemo.java kept its name; sqli.py→sql_injection.py): giris_kotu/girisKotu→login_bad/loginBad ·
giris_guvenli/girisGuvenli→login_secure/loginSecure · sonuc_yaz/sonucYaz→print_result/printResult ·
veritabani_kur/veritabaniKur→set_up_database/setUpDatabase · kullanici (table)→user · ad (column)→name ·
rol→role · gizli_not→secret_note · sorgu→query · uretilen→generated · satir→row.

Demo 2 (KomutDemo.java→CommandDemo.java; Yazici.java→Printer.java; komut.py→command_injection.py):
komut→command · calistir_kotu/calistirKotu→run_bad/runBad · calistir_guvenli/calistirGuvenli→run_secure/
runSecure · izinli/IZINLI→allowed/ALLOWED · zararsiz→harmless · arac ciktisi→tool output · ciktiyaz→
print_output.

Demo 3 (YolDemo.java→PathDemo.java; yol.py→path_traversal.py): oku_kotu/okuKotu→read_bad/readBad ·
oku_guvenli/okuGuvenli→read_secure/readSecure · hazirla→prepare · kok/KOK→root/ROOT · taban/TABAN→base/BASE ·
gizli/GIZLI (file)→secret/SECRET · veri (root subfolder)→data · rapor.txt→report.txt · gizli.txt→secret.txt ·
kok_icinde→is_within_root · cozulen yol→resolved path.

Demo 4 (LisansDenetimi.java→LicenseCheck.java): gecerli_pin/GECERLI_PIN→valid_pin/VALID_PIN ·
lisans_anahtari/LISANS_ANAHTARI→license_key/LICENSE_KEY · pin_dogru/pinDogru→pin_correct/pinCorrect ·
lisans_gecerli/lisansGecerli→license_valid/licenseValid.

Demo 5 (AcikSabit→PlainConstant · GizliSabit→HiddenConstant · DogrudanCagri→DirectCall ·
YansimaCagri→ReflectionCall; hazirla.*→prepare.*): acik sabit→plain constant · gizli sabit→hidden constant ·
coz()→decrypt() · anahtar (XOR byte)→key · dogrudan cagri→direct call · yansima cagri→reflection call ·
gizli_islem/gizliIslem→hidden_operation/hiddenOperation · metot_adi/metotAdi→method_name/methodName ·
"sunucu-anahtari-9F3A"→"server-key-9F3A" (XOR bytes recomputed for the new string) ·
"gizli-sonuc-42"→"hidden-result-42" · ornek.jar/ornek-gizli.jar→sample.jar/sample-obfuscated.jar.

Demo 6 (sbom.py, already-English file name kept): bilesenler/BILESENLER→components/COMPONENTS ·
zafiyetli/ZAFIYETLI→vulnerable/VULNERABLE · jar_uret→build_jars · sbom_uret→build_sbom ·
zafiyet_tara→scan_for_vulnerabilities · manifesten_oku→read_manifest · duzeltilen→fixed_in ·
aciklama→description · "kayit-kutuphanesi"→"record-library" · "gunluk-cekirdek"→"log-core" ·
"json-arac"→"json-tool" · "sifreleme-yardimci"→"crypto-helper" · "ornek.grup"→"example.group" ·
"cen429-ornek-uygulama"→"cen429-sample-app".

Demo 7 (SeriDemo.java→SerializationDemo.java): Ayar (class)→Setting · BaskaSinif→OtherClass ·
serilestir→serialize · coz_kotu/cozKotu→deserialize_bad/deserializeBad ·
coz_guvenli/cozGuvenli→deserialize_secure/deserializeSecure · etiket→label · filtre→filter ·
deger (field)→value · yuk (field)→payload · "zaman-asimi"→"timeout" · "beklenmeyen-sinif"→"unexpected-class".

## Week 10 additions (2026-09) — certificates and cryptographic methods

Folders: 01-pki-zincir→01-pki-chain (demo.sh translated: kok→root, ara→intermediate, sunucu→server,
sahte→rogue, in "rogue-root.crt/.key") · 02-imza-dogrulama→02-signature-verification (demo.sh
translated and switched from Ed25519 to ECDSA P-256, since `openssl pkeyutl -sign -rawin` for Ed25519
needs OpenSSL 3.x while `openssl dgst -sign` with an EC key works identically on 1.1.1 and 3.x; imza→
signature, guncelleme→update, kurcali→tampered, saldirgan→attacker).

New demos, all pure Python (no C code this week): 03-block-cipher-modes (block_modes.py: ECB/CBC/CTR
and a simplified, illustrative "GCM-like" authenticated mode over a toy byte cipher) ·
04-pkcs7-padding (pkcs7.py) · 05-hmac-construction (hmac_construction.py) · 06-encrypt-then-mac
(ordering.py: encrypt-then-MAC vs MAC-then-encrypt) · 07-rsa-toy (rsa_toy.py: textbook RSA, toy
primes) · 08-diffie-hellman (dh_toy.py: toy DH + a man-in-the-middle simulation) · 09-ecdh-toy
(ecdh_toy.py: elliptic-curve point addition over a small prime field) · 10-revocation
(revocation.py: CRL/OCSP simulation) · 11-hsm-key-use (hsm_sim.py: simulated HSM/PKCS#11-style
key-handle API). Every new demo's identifiers, comments and output strings were written directly in
English (nothing to translate).

## Week 9 additions

Folders: manuel-gizleme→manual-obfuscation · cesitlendirme→diversification (already in the seed
glossary as gizleme→obfuscation / cesit(lendirme)→diversification; confirmed used as folder names).

Demo 1 (ortak.h→common.h; temiz.c→clean.c; gizli.c→obfuscated.c; calis.c→run.c):
erisim_ver→grant_access · jeton→token · IZIN/RED→GRANTED/DENIED · GECERLI (valid token constant)→
VALID_TOKEN · esit_sabit→constant_time_equals · fark→diff · opak_sifir→opaque_zero ·
Karar (struct)→Decision · karar_izin→decision_grants · durum→state · KOD/KOD_N→ENCODED/ENCODED_LEN ·
coz (decoded buffer)→decoded · dene→try_token · BASLA/UZUNLUK/COZ/KIYAS/IZINLI/REDDET/BITTI (enum)→
START/LENGTH/DECODE/COMPARE/GRANT/DENY/DONE · K-01..K-08 (rule ids, prose only in this demo's
comments)→R-01..R-08 · erisim_temiz/erisim_gizli (binaries)→access_clean/access_obfuscated.

Demo 2 (cesit.c→diversified.c): TOHUM→SEED · MASKE→MASK · GECERLI→VALID_TOKEN · kod→encoded ·
durum→state · sonuc→result · fark→diff · j (main's local)→token · erisim_t1/erisim_t2 (binaries)→
access_seed1001/access_seed2002 (kept the seed value in the binary name for traceability with the
demo's own printed `[seed N]` output).

## Week 11 additions

Folders: 01-oyuncak-tablo→01-toy-table (oyuncak_wb.c→toy_table.c) · 02-gomulu-anahtar→02-embedded-key
(gomulu.c→embedded_key.c).

Demo 1 (toy_table.c): tablolari_kur→build_tables · naif_tablo→naive_table · kodlu_tablo→encoded_table ·
naif_kurtar→naive_recover · k0/bulunan→k0/found (unchanged, already short/English-readable) ·
"Gizli anahtar"→"Secret key" · "NAIF tablo"/"KODLANMIS tablo"→"NAIVE table"/"ENCODED table" ·
"ANAHTAR SIZDI"→"KEY LEAKED" · "Kurtarma basarisiz"→"Recovery failed" · "DERS:"→"LESSON:".

Demo 2 (embedded_key.c): ANAHTAR→KEY · ara→search_bytes · sozde_kullan→pseudo_use · yol→path ·
(new, extracted for testability) key_checksum() — the checksum loop pseudo_use() already had, pulled
into its own pure function · "--tara"→"--scan" · "Sozde islem tamam"→"Pseudo-operation done" ·
"Ikili dosyada anahtari aramak icin"→"To search the binary file for the key" ·
"Ikili acilamadi"→"Could not open binary" · "SIZDI: ... gomulu anahtar ikilide ... bulundu"→
"LEAKED: the 16-byte embedded key was found in the binary at offset ..." ·
"Anahtar bulunamadi (beklenmeyen)"→"Key not found (unexpected)".

## Week 13 additions

Folders: 01-uyum-matrisi→01-compliance-matrix (uyum.c→compliance_matrix.c) ·
02-gereksinim-kalite→02-requirement-quality (gereksinim_kalite.c→requirement_quality.c).

Bug fixed while converting demo 1: the original `uyum.c` used `strtok_r`, which MSVC does not provide
(link error `LNK2019`). Rewritten with a small hand-written `split_fields()` tokenizer used for both
'|'-separated fields and '\n'-separated rows — no strtok/strtok_r/strtok_s anywhere, so it links and
behaves identically on MSVC, GCC (WSL) and GCC (Linux).

Demo 1 (compliance_matrix.c): uyum matrisi→compliance matrix · GOMULU→EMBEDDED_SAMPLE · kirp()→trim() ·
satir_isle()→process_line() · alan→field · bulgu→finding · say_k/say_d/say_n→count_met/count_delegated/
count_not_met · karsilandi/devredildi/karsilanmadi→met/delegated/not-met (status words; also used as the
program's own comparison strings, not just prose) · [BULGU]/[OK]/[RISK]→[FINDING]/[OK]/[RISK] ·
"Dosya acilamadi"→"Could not open file" · "Ozet: ... karsilandi, ... devredildi, ... karsilanmadi | ...
BULGU"→"Summary: ... met, ... delegated, ... not-met | ... FINDING(s)".

Demo 2 (requirement_quality.c): BELIRSIZ→VAGUE_PHRASES · SOMUT→CONCRETE_TERMS · kucult()→to_lower() ·
icerir()→contains_any() · sayi_var()→has_digit() · denetle()→check_requirement() · zayif→weak ·
belirsiz (local)→vague · olculebilir (local)→measurable · [ ZAYIF ]/[ IYI ]→[WEAK]/[ OK ] · vague-phrase
list translated word for word ("guvenli olmali"→"should be secure", "iyi yonetil"→"well managed", "iyi
olmali"→"should be good", "uygun sekilde"→"properly", "yeterince"→"sufficiently", "gerektigi gibi"→"as
required", "mumkun oldugunca"→"as much as possible", "saglam olmali"→"should be robust") · concrete-term
list translated where the term itself was Turkish ("static analiz"→"static analysis"; the rest were
already English/acronyms: aes, gcm, sha-256, sha256, relro, pie, bit, 128, 256, tls 1.3, hmac, pbkdf2,
ed25519, checksec) · sample requirement sentences translated 1:1, keeping which ones are WEAK vs OK
unchanged ("Uygulama guvenli olmali."→"The application should be secure.", "Anahtarlar iyi
yonetilmeli."→"Keys should be well managed.", "Surum derlemesi yigin koruyucu, PIE ve tam RELRO ile
uretilmelidir."→"The release build must be produced with a stack protector, PIE and full RELRO.", "C
sinifi her varlik beklemede en az 128 bit duzeyinde AES-GCM ile sifrelenmelidir."→"Every Class C asset at
rest must be encrypted with at least 128-bit AES-GCM.", "Veriler uygun sekilde saklanmali."→"Data should
be stored properly.").

Note: `docs/week-13/assets/h13-10-uyum-matrisi.{tex,svg}` (a TikZ diagram of the compliance-matrix
structure) was deliberately NOT renamed — this guide's scope is `code/**`, and that asset is a notes/
slides content diagram, not a code file; both notes still reference it by its existing path.

## Week 14 additions

Folder: `01-kaynaktan-kaynaga`→`01-source-to-source` (`ornek.c`→`source.c`, `tigress-hatti.sh` split
into the repo's normal `demo.sh`/`demo.ps1`/`demo.cmd` trio — every other demo has all three, this was
the one exception before this pass). New this week, no Turkish to translate (written directly in
English): `fallback_transform.py` (documented local fallback transform, used automatically when
Tigress is not on `PATH`), `pipeline_check.py` (the CTest end-to-end pipeline check), `CMakeLists.txt`,
`tests/test_source.c` (this folder previously had no CMake project at all).

`ornek.c`→`source.c`: `erisim_ver`→`grant_access` · `jeton`→`token` · `GECERLI`→`VALID_TOKEN` ·
`fark`→`diff` · `IZIN`/`RED`→`GRANTED`/`DENIED` — reusing week-9's identical mapping for the identical
interface on purpose (week 14's note explicitly compares "the same function by hand [week 9] vs by
tool [week 14]"); output format also aligned to week 9's `token="..."  -> GRANTED/DENIED`-style single
line (`grant_access("...") = GRANTED/DENIED`).

## Week 12 additions

Folder `01-birim-test`→`01-unit-test` (`sut.c/h`→`system_under_test.c/h`, `test.c`→`test_runner.c`,
target `birim_test`→`unit_test`): `girdi_dogrula()`→`validate_input()` · `guvenli_topla()`→`safe_add()`
· `sonuc` (out param)→`result` · `kart()` (test-card printer)→`card()` · `gecen/kalan`→`passed/failed`
· `kimlik/amac/kosul/gozlenen`→`id/purpose/condition/observed` · `karar` (`"GECTI"/"KALDI"`)→
`decision` (`"PASS"/"FAIL"`).

Folder `02-saldiri-potansiyeli`→`02-attack-potential` (`saldiri_potansiyeli.c`→`attack_potential.c`,
target `saldiri_potansiyeli`→`attack_potential`; `saldiri_potansiyeli→attack_potential` was already in
the seed glossary above): `SURE[]`→`ELAPSED_TIME[]` · `UZMAN[]`→`EXPERTISE[]` · `BILGI[]`→
`KNOWLEDGE[]` · `FIRSAT[]`→`OPPORTUNITY[]` · `EKIPMAN[]`→`EQUIPMENT[]` · `duzey()`→`rating()` ·
`guvenli_idx()`→`safe_index()` · `hesapla()`→`compute()` (plus a new pure `compute_score()`, split out
of `compute()`/`hesapla()` for unit testability — not a rename, a refactor). Rating band names (used
throughout the note's prose too, per the English-output rule):
`TEMEL`→`BASIC` · `ORTA`→`MODERATE` · `YUKSEK`→`HIGH` · `COK_YUKSEK` (ÇOK YÜKSEK)→`VERY HIGH` ·
`OTESI` (ÖTESİ)→`BEYOND`. Embedded example finding names: `"Lisans denetimi tek-bayt yama"`→
`"License check one-byte patch"` · `"WBC anahtar cikarma (DCA)"`→`"White-box key extraction (DCA)"` ·
`"Guvenli oge (SE) kirma"`→`"Secure element key extraction"`.
