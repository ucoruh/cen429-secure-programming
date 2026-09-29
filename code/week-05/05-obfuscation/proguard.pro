# CEN429 - Week 5 - Demo 5: sample ProGuard configuration
# Used by demo.sh / demo.ps1 (when ProGuard has been downloaded).
# Goal: 'DirectCall.main' is kept while the unused private member
# (hiddenOperation) is removed by shrinking/optimization, and the remaining
# members are renamed to short, obfuscated names.

-injars  output/sample.jar
-outjars output/sample-obfuscated.jar
# JDK 9+ module system: provide java.base as a library.
-libraryjars <java.home>/jmods/java.base.jmod(!**.jar;!module-info.class)
-dontwarn

# KEEP the entry point; everything else is shrunk/obfuscated.
-keep public class DirectCall {
    public static void main(java.lang.String[]);
}

-optimizationpasses 3
-repackageclasses ''
-allowaccessmodification
-dontusemixedcaseclassnames
