// CEN429 - Week 5 - Demo 5b: a DIRECT call (comparison for the bad example).
// hiddenOperation() is called directly; the bytecode plainly shows
// 'invokestatic ... hiddenOperation', which cross-reference tools follow easily.
public class DirectCall {

    private static String hiddenOperation() {
        return "hidden-result-42";
    }

    public static void main(String[] args) {
        System.out.println("Direct call: " + hiddenOperation());
    }
}
