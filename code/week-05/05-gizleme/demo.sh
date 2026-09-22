#!/bin/sh
# CEN429 - Hafta 5 - Demo 5: Kod gizleme (Linux / WSL).
# Ana bolum (dize gizleme + yansima) INDIRME GEREKTIRMEZ.
# Istege bagli ProGuard bolumu icin: sh hazirla.sh
cd "$(dirname "$0")"
if ! command -v javac >/dev/null 2>&1; then
    echo "JDK bulunamadi (javac yok)."
    echo "Kurulum: sudo apt-get install -y openjdk-17-jdk-headless"
    exit 1
fi
cizgi() { echo "=============================================================="; }
rm -rf cikti; mkdir -p bin cikti
javac --release 17 -d bin AcikSabit.java GizliSabit.java \
    DogrudanCagri.java YansimaCagri.java || { echo "Derleme hatasi"; exit 1; }

cizgi; echo "BOLUM A - Statik dize gizleme (acik vs XOR ile gizli)"; cizgi
echo "Calisma ciktilari (ikisi de ayni dizeyi uretir):"
java -cp bin AcikSabit
java -cp bin GizliSabit
echo
echo "javap: ACIK sabit bytecode'da duz metin gorunur ->"
javap -c -p -cp bin AcikSabit | grep -i "sunucu-anahtari" | sed 's/^/   /'
echo "javap: GIZLI sabitte ayni dize ARANIYOR (bulunmamali) ->"
if javap -c -p -cp bin GizliSabit | grep -qi "sunucu-anahtari"; then
    echo "   (beklenmedik: dize gorundu)"
else
    echo "   BULUNAMADI: dize yalniz byte dizisi olarak gomulu (iyi)."
fi

cizgi; echo "BOLUM B - Yansima ile dinamik yontem gizleme"; cizgi
java -cp bin DogrudanCagri
java -cp bin YansimaCagri
echo
echo "javap: DOGRUDAN cagride 'invokestatic gizliIslem' gorunur ->"
javap -c -p -cp bin DogrudanCagri | grep -i "Method gizliIslem" | sed 's/^/   /'
echo "javap: YANSIMAda dogrudan cagri YOK; yalniz getDeclaredMethod/invoke ->"
if javap -c -p -cp bin YansimaCagri | grep -qi "invokestatic.*gizliIslem"; then
    echo "   (beklenmedik: dogrudan cagri gorundu)"
else
    echo "   Dogrudan 'invokestatic gizliIslem' cagrisi YOK."
    javap -c -p -cp bin YansimaCagri | grep -iE "getDeclaredMethod|invoke:" \
        | sed 's/^/   /'
fi
echo "   NOT (durustce): metot HALA sinifta tanimli (javap -p onu listeler);"
echo "   yansima 'cagri baglantisini' gizler, tek basina koruma degildir."

cizgi; echo "BOLUM C - ProGuard ile kucultme + gizleme (istege bagli)"; cizgi
if [ ! -f lib/proguard.jar ]; then
    echo "ProGuard yok. Etkinlestirmek icin: sh hazirla.sh"
    echo "Kural tablosu ve -keep ornekleri: README.md ve ders sayfasi."
    exit 0
fi
( cd bin && jar --create --file ../cikti/ornek.jar . )
echo "ProGuard calistiriliyor (proguard.pro)..."
java -jar lib/proguard.jar @proguard.pro 2>&1 | tail -3
echo "ONCE (uyeler):"
javap -p -cp cikti/ornek.jar DogrudanCagri | sed 's/^/   /'
mkdir -p cikti/acik && ( cd cikti/acik && jar -xf ../ornek-gizli.jar )
echo "SONRA (kullanilmayan private uye kucultme ile kalkti):"
javap -p -cp cikti/acik DogrudanCagri | sed 's/^/   /'
echo "-keep kurali 'main'i korudu; 'gizliIslem' kucultuldu/satir ici alindi."
