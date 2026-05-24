package com.example;

public class Calculator {

    public int add(int a, int b) {
        return a + b;
    }

    public double divide(int a, int b) {
        if (b == 0) {
            throw new ArithmeticException("Division by zero");
        }
        return (double) a / b;
    }

    public boolean isEven(int n) {
        return n % 2 == 0;
    }
}
