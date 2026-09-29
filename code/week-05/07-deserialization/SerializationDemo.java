// CEN429 - Week 5 - Demo 7: safe deserialization
//
// Deserializing untrusted data without a filter is DANGEROUS: the incoming
// byte stream can construct classes we never expected (a gadget chain ->
// remote code execution). This demo does NOT write a malicious chain; it only
// shows the fix: use ObjectInputFilter to allow-list only the EXPECTED
// classes and reject everything else.
//
// Every class here is harmless (it only holds data). Nothing touches disk,
// network or the system.
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InvalidClassException;
import java.io.ObjectInputFilter;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.io.Serializable;

public class SerializationDemo {

    // EXPECTED (allowed) class: holds just two fields.
    static class Setting implements Serializable {
        private static final long serialVersionUID = 1L;
        String name;
        int value;
        Setting(String name, int value) { this.name = name; this.value = value; }
        public String toString() { return "Setting(name=" + name + ", value=" + value + ")"; }
    }

    // UNEXPECTED class: in a real attack this would be a "gadget"; harmless here.
    static class OtherClass implements Serializable {
        private static final long serialVersionUID = 1L;
        String payload = "unexpected-class";
        public String toString() { return "OtherClass(payload=" + payload + ")"; }
    }

    static void line() {
        System.out.println("--------------------------------------------"
                + "------------------");
    }

    static byte[] serialize(Object o) throws Exception {
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        try (ObjectOutputStream oos = new ObjectOutputStream(bos)) {
            oos.writeObject(o);
        }
        return bos.toByteArray();
    }

    // BAD: no filter. EVERY class in the stream gets instantiated.
    static void deserializeBad(byte[] data, String label) {
        try (ObjectInputStream ois = new ObjectInputStream(
                new ByteArrayInputStream(data))) {
            Object o = ois.readObject();
            System.out.println("   [" + label + "] ACCEPTED -> " + o
                    + "  (" + o.getClass().getSimpleName() + ")");
        } catch (Exception e) {
            System.out.println("   [" + label + "] error: " + e.getClass()
                    .getSimpleName());
        }
    }

    // GOOD (the allow-list itself, as a pure function so it is unit-testable
    // without needing a stream): only Setting + java.base classes are allowed,
    // everything else is rejected.
    static ObjectInputFilter buildAllowListFilter() {
        return ObjectInputFilter.Config.createFilter(
                "SerializationDemo$Setting;java.base/*;!*");
    }

    // GOOD: only allow Setting + java.base classes; reject everything else.
    static void deserializeSecure(byte[] data, String label) {
        ObjectInputFilter filter = buildAllowListFilter();
        try (ObjectInputStream ois = new ObjectInputStream(
                new ByteArrayInputStream(data))) {
            ois.setObjectInputFilter(filter);
            Object o = ois.readObject();
            System.out.println("   [" + label + "] ACCEPTED -> " + o);
        } catch (InvalidClassException e) {
            System.out.println("   [" + label + "] REJECTED (filter): "
                    + "unexpected class blocked.");
        } catch (Exception e) {
            System.out.println("   [" + label + "] REJECTED: "
                    + e.getClass().getSimpleName());
        }
    }

    public static void main(String[] args) throws Exception {
        byte[] expected = serialize(new Setting("timeout", 30));
        byte[] unexpected = serialize(new OtherClass());

        line();
        System.out.println("STEP 1 - UNFILTERED deserialization (bad): every class accepted");
        deserializeBad(expected, "expected Setting");
        deserializeBad(unexpected, "unexpected OtherClass");
        System.out.println("   ^ Without a filter, EVERY class in the stream is built;");
        System.out.println("     in a real attack this could have been a gadget chain.");

        line();
        System.out.println("STEP 2 - With ObjectInputFilter (good): allow-list");
        deserializeSecure(expected, "expected Setting");
        deserializeSecure(unexpected, "unexpected OtherClass");
        System.out.println("   ^ Only the expected class got through; the other was rejected.");

        line();
        System.out.println("Result: do not deserialize untrusted data without a filter.");
        System.out.println("Best: use a DATA format like JSON instead of Java serialization;");
        System.out.println("if you must, allow-list the classes with ObjectInputFilter.");
    }
}
