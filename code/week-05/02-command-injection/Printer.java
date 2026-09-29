// CEN429 - Week 5 - Demo 2: a small, controlled "external tool".
// It only prints the arguments it was given to the screen; nothing else.
// In the secure version, ProcessBuilder runs this tool with an argument LIST,
// so user input passes through as a single argument, as data.
public class Printer {
    public static void main(String[] args) {
        StringBuilder sb = new StringBuilder("TOOL OUTPUT:");
        for (String a : args) {
            sb.append(' ').append(a);
        }
        System.out.println(sb.toString());
    }
}
