// CEN429 - Week 5 - Demo 7 unit test (plain Java, no framework/dependency needed).
//
// All checks work entirely in memory (byte arrays via ObjectOutputStream /
// ObjectInputStream): no file, network or process is ever touched. Confirms
// that the unfiltered stream accepts any class (the vulnerability) and that
// the allow-list filter accepts only the expected class (the fix) while still
// allowing ordinary java.base classes such as String through.
import java.io.ByteArrayInputStream;
import java.io.InvalidClassException;
import java.io.ObjectInputStream;
import java.io.Serializable;

public class TestSerializationDemo {
    static int checks = 0;
    static int failures = 0;

    static void check(boolean condition, String what) {
        checks++;
        if (!condition) {
            failures++;
            System.out.println("FAIL: " + what);
        }
    }

    static Object readUnfiltered(byte[] data) throws Exception {
        try (ObjectInputStream ois = new ObjectInputStream(new ByteArrayInputStream(data))) {
            return ois.readObject();
        }
    }

    static Object readFiltered(byte[] data) throws Exception {
        try (ObjectInputStream ois = new ObjectInputStream(new ByteArrayInputStream(data))) {
            ois.setObjectInputFilter(SerializationDemo.buildAllowListFilter());
            return ois.readObject();
        }
    }

    public static void main(String[] args) throws Exception {
        // --- serialize()/deserialize() round-trips the expected class ---
        byte[] setting1 = SerializationDemo.serialize(new SerializationDemo.Setting("timeout", 30));
        Object back1 = readUnfiltered(setting1);
        check(back1 instanceof SerializationDemo.Setting, "unfiltered: a Setting round-trips as a Setting");
        check(((SerializationDemo.Setting) back1).name.equals("timeout"),
                "unfiltered: the Setting's name field survives the round trip");
        check(((SerializationDemo.Setting) back1).value == 30,
                "unfiltered: the Setting's value field survives the round trip");

        // --- A few more Setting values, still round-tripping correctly ---
        for (Object[] pair : new Object[][] {{"", 0}, {"a", -1}, {"long-name-xyz", 999999}}) {
            byte[] data = SerializationDemo.serialize(
                    new SerializationDemo.Setting((String) pair[0], (Integer) pair[1]));
            SerializationDemo.Setting back = (SerializationDemo.Setting) readUnfiltered(data);
            check(back.name.equals(pair[0]) && back.value == (Integer) pair[1],
                    "unfiltered: Setting(" + pair[0] + "," + pair[1] + ") round-trips correctly");
        }

        // --- THE VULNERABILITY: the unfiltered stream builds ANY serialized
        //     class, not just the one the program expected. ---
        byte[] other = SerializationDemo.serialize(new SerializationDemo.OtherClass());
        Object back2 = readUnfiltered(other);
        check(back2 instanceof SerializationDemo.OtherClass,
                "unfiltered: an UNEXPECTED class is built too -- this is the vulnerability");

        // --- THE FIX: the allow-list filter accepts the expected class ---
        Object back3 = readFiltered(setting1);
        check(back3 instanceof SerializationDemo.Setting,
                "filtered: the expected Setting class is still accepted");

        // --- THE FIX: the allow-list filter rejects the unexpected class ---
        boolean rejected = false;
        try {
            readFiltered(other);
        } catch (InvalidClassException expected) {
            rejected = true;
        }
        check(rejected, "filtered: the unexpected OtherClass is rejected with InvalidClassException");

        // --- The filter still allows ordinary java.base classes (e.g. String),
        //     because the allow-list pattern includes 'java.base/*' -- the
        //     filter targets classes, not just "our one type". ---
        byte[] plainString = SerializationDemo.serialize("hello");
        Object back4 = readFiltered(plainString);
        check("hello".equals(back4), "filtered: a plain java.lang.String (java.base) still passes");

        // --- buildAllowListFilter() is a fresh, working filter every call ---
        check(SerializationDemo.buildAllowListFilter() != null,
                "buildAllowListFilter: returns a non-null filter");
        check(SerializationDemo.buildAllowListFilter() != SerializationDemo.buildAllowListFilter(),
                "buildAllowListFilter: returns a distinct filter instance per call (no shared mutable state)");

        // --- toString()/serialize() sanity checks ---
        check(new SerializationDemo.Setting("timeout", 30).toString()
                .equals("Setting(name=timeout, value=30)"),
                "Setting.toString: formats name and value as expected");
        check(new SerializationDemo.OtherClass().toString()
                .equals("OtherClass(payload=unexpected-class)"),
                "OtherClass.toString: formats its payload as expected");
        check(setting1.length > 0, "serialize: produces a non-empty byte stream");
        byte[] setting2 = SerializationDemo.serialize(new SerializationDemo.Setting("other", 1));
        check(!java.util.Arrays.equals(setting1, setting2),
                "serialize: different Setting values produce different byte streams");

        System.out.println(checks + " checks, " + failures + " failures");
        if (failures > 0) {
            System.exit(1);
        }
    }
}
