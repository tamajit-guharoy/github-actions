"""Calculator module — a simple demo for GitHub Actions CI."""

def add(a: float, b: float) -> float:
    """Return the sum of two numbers."""
    return a + b


def divide(a: float, b: float) -> float:
    """Return a divided by b. Raises ValueError on division by zero."""
    if b == 0:
        raise ValueError("Division by zero is not allowed")
    return a / b


def is_even(n: int) -> bool:
    """Return True if n is even."""
    return n % 2 == 0
