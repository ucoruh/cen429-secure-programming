# CEN429 - Hafta 5 - Demo 5: ornek ProGuard yapilandirmasi
# Bu dosya demo.sh / demo.ps1 tarafindan (ProGuard indirildiyse) kullanilir.
# Amac: 'DogrudanCagri.main' korunurken kullanilmayan private uye (gizliIslem)
# kucultme/optimizasyon ile kaldirilir, kalan uyeler kisa adlarla gizlenir.

-injars  cikti/ornek.jar
-outjars cikti/ornek-gizli.jar
# JDK 9+ modul sistemi: java.base'i kutuphane olarak ver.
-libraryjars <java.home>/jmods/java.base.jmod(!**.jar;!module-info.class)
-dontwarn

# GIRIS NOKTASINI koru; gerisi kucultulur/gizlenir.
-keep public class DogrudanCagri {
    public static void main(java.lang.String[]);
}

-optimizationpasses 3
-repackageclasses ''
-allowaccessmodification
-dontusemixedcaseclassnames
