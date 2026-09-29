// CEN429 - Week 5 - Demo 4: bytecode and decompiling
//
// A small "license/PIN check". Purpose: to show how openly a compiled .class
// file reads even without source, using 'javap -c -p'. Constant strings (PIN,
// license key), private field/method names and the branch logic are all
// plainly visible in the bytecode.
//
// ALL values are synthetic; none of them is a real product/key.
public class LicenseCheck {

    // Secrets EMBEDDED in the code: plainly visible in the bytecode (bad example).
    private static final String VALID_PIN = "4729";
    private static final String LICENSE_KEY = "PRO-2026-DEMO";

    static boolean pinCorrect(String entered) {
        return VALID_PIN.equals(entered);
    }

    static boolean licenseValid(String key) {
        return LICENSE_KEY.equals(key);
    }

    public static void main(String[] args) {
        String pin = (args.length > 0) ? args[0] : "0000";
        System.out.println("Entered PIN     : " + pin);
        System.out.println("PIN correct?    : " + pinCorrect(pin));
        System.out.println("License PRO?    : "
                + (licenseValid(LICENSE_KEY) ? "YES (PRO)" : "NO"));
    }
}
