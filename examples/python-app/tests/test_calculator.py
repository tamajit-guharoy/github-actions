import pytest
from calculator import add, divide, is_even


class TestAdd:
    def test_positive_numbers(self):
        assert add(2, 3) == 5

    def test_negative_numbers(self):
        assert add(-1, -4) == -5

    def test_mixed_signs(self):
        assert add(-2, 5) == 3


class TestDivide:
    def test_normal_division(self):
        assert divide(10, 2) == 5.0

    def test_zero_division_raises(self):
        with pytest.raises(ValueError, match="Division by zero"):
            divide(5, 0)


class TestIsEven:
    def test_even_number(self):
        assert is_even(4) is True

    def test_odd_number(self):
        assert is_even(7) is False

    def test_zero(self):
        assert is_even(0) is True
