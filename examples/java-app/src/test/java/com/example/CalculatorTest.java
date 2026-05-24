package com.example;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class CalculatorTest {

    private final Calculator calc = new Calculator();

    @Test
    void addPositiveNumbers() {
        assertEquals(5, calc.add(2, 3));
    }

    @Test
    void addNegativeNumbers() {
        assertEquals(-5, calc.add(-2, -3));
    }

    @Test
    void divideNormal() {
        assertEquals(2.5, calc.divide(5, 2));
    }

    @Test
    void divideByZeroThrows() {
        assertThrows(ArithmeticException.class, () -> calc.divide(1, 0));
    }

    @Test
    void isEvenTrue() {
        assertTrue(calc.isEven(4));
    }

    @Test
    void isEvenFalse() {
        assertFalse(calc.isEven(7));
    }
}
