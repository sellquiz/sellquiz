package examples;

import java.lang.Math;
import java.util.Arrays;

class MA1_meets_PI1 {

    public static void main(String[] args) {
        {
            // Summe
            int n = 23;
            int s = 0;
            for(int i=0; i<=n; i++)
                s += i;
            System.out.println("Summe");
            System.out.println(s);
        }
        System.out.println("Exponentialreihe");
        System.out.println(exp_reihe(8, 1.0));
        System.out.println("Polynom");
        double[] p = {4, -3, 0, 2};
        System.out.println(polynom(p, 2.1));
        System.out.println("Polynom ableiten");
        System.out.println(Arrays.toString(polynom_ableiten(p)));
        System.out.println("Polynom integrieren");
        System.out.println(Arrays.toString(polynom_integrieren(p)));
        System.out.println("Newton 1: f(x)");
        System.out.println(f(1.23));
        System.out.println("Newton 2: f'(x)");
        System.out.println(fd(-1.5));
        System.out.println("Newton 3: newton(..)");
        System.out.println(newton(100, 1.0));
        System.out.println("Mittelpunktregel");
        System.out.println(mpr(0.0, 1.0, 1000));
    }

    public static double exp_reihe(int n, double x) {
        double y = 0;
        for(int k=0; k<=n; k++) {
            int fak = 1;
            for(int i=1; i<=k; i++)
                fak *= i;
            y += Math.pow(x, k) / fak;
        }
        return y;
    }

    public static double polynom(double[] a, double x) {
        double y = 0.0;
        for(int i=0; i<a.length; i++) {
            y += a[i] * Math.pow(x, i);
        }
        return y;
    }

    public static double[] polynom_ableiten(double[] a) {
        // z.B. f(x) = 2*x^3       - 3*x + 4    -> a = [4, -3, 0, 2]
        //      f'(x) =      6*x^2       - 3    -> d = [-3, 0, 6]
        double d[] = new double[a.length-1];
        for(int k=0; k<d.length; k++)
            d[k] = a[k+1] * (k+1);
        return d;
    }

    public static double[] polynom_integrieren(double[] a) {
        // z.B. f(x)        = 2*x^3       - 3*x + 4   -> a = [4, -3, 0, 2]
        //      int f(x) dx = 1/2*x^4 - 3/2*x^2 + 4*x -> d = [1/2, 0, -3/2, 4, 0]
        double i[] = new double[a.length+1];
        for(int k=1; k<i.length; k++)
            i[k] = a[k-1] / k;
        return i;
    }

    public static double f(double x) {
        return x*x + 2 - Math.exp(x);
    }

    public static double fd(double x) {
        return 2*x - Math.exp(x);
    }

    public static double newton(int n, double x0) {
        double y = x0;
        for(int i=0; i<n; i++)
            y = y - f(y) / fd(y);
        return y;
    }

    public static double f_mpr(double x) {
        return Math.exp(-x*x);
    }

    public static double mpr(double a, double b, int n) {
        double y = 0.0;
        double h = (b - a) / (double)n;
        for(int k=1; k<=n; k++)
            y += f_mpr(a - h/2 + k*h);
        y = h * y;
        return y;
    }

}
