// CEN429 - Hafta 5 - Demo 2: kucuk, kontrollu "dis arac".
// Yalnizca kendisine verilen argumanlari ekrana basar; baska hicbir sey yapmaz.
// Guvenli surumde ProcessBuilder bu araci bir arguman LISTESIYLE calistirir;
// boylece kullanici girdisi tek bir arguman olarak, veri gibi gecer.
public class Yazici {
    public static void main(String[] args) {
        StringBuilder sb = new StringBuilder("ARAC CIKTISI:");
        for (String a : args) {
            sb.append(' ').append(a);
        }
        System.out.println(sb.toString());
    }
}
