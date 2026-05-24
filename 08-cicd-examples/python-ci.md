# Python CI with pytest

A complete CI pipeline for a Python package — lint with Ruff, test with pytest across 4 Python versions, coverage reports, and JUnit XML output. This page walks through the [Python example app](../examples/python-app/) workflow.

---

## The workflow at a glance

```yaml
name: Python CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/ruff-action@v3
        with:
          args: "check"

  test:
    needs: lint
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ["3.10", "3.11", "3.12", "3.13"]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}
          cache: 'pip'
      - run: python -m pip install --upgrade pip
      - run: pip install .[dev]
      - name: Run tests with coverage
        run: |
          python -m pytest tests/ -v \
            --cov=src \
            --cov-report=term-missing \
            --junitxml=test-results.xml
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results-py-${{ matrix.python-version }}
          path: test-results.xml
```

Full source: [examples/python-app/.github/workflows/ci.yml](../examples/python-app/.github/workflows/ci.yml)

---

## Why this design?

### Ruff for linting — not flake8

Ruff is a single-binary Python linter written in Rust. It replaces flake8, isort, and pyupgrade combined, and runs 10–100x faster. The `ruff-action@v3` installs nothing — it downloads a prebuilt binary.

### `pip install .[dev]` — package + dev deps

```yaml
- run: pip install .[dev]
```

This installs the package in editable mode plus the `[project.optional-dependencies]` `dev` group from `pyproject.toml`:

```toml
[project.optional-dependencies]
dev = [
    "pytest>=8",
    "pytest-cov>=5",
    "ruff>=0.6",
]
```

Your project and all test tools are installed in one command. No `requirements-dev.txt` needed.

### `--junitxml=test-results.xml`

JUnit XML is the universal test report format. GitHub Actions doesn't parse it natively, but countless tools do — CI dashboards, coverage aggregators, and code review tools. Uploading it as an artifact (`if: always()`) means you can download and analyze it even when tests fail.

### Four Python versions

Python 3.10 through 3.13 covers the supported CPython lifecycles. The matrix catches:
- `match`/`case` syntax only in 3.10+
- `Self` type only in 3.11+
- PEP 695 type aliases in 3.12+
- Free-threaded build changes in 3.13+

---

## What the app looks like

A simple calculator module:

```python
# src/calculator.py
def add(a, b):
    return a + b

def divide(a, b):
    if b == 0:
        raise ValueError("Cannot divide by zero")
    return a / b

def is_even(n):
    return n % 2 == 0
```

Tests with pytest:

```python
# tests/test_calculator.py
class TestAdd:
    def test_positive(self):
        assert add(2, 3) == 5

    def test_negative(self):
        assert add(-1, -1) == -2

class TestDivide:
    def test_normal(self):
        assert divide(10, 2) == 5

    def test_zero_division(self):
        with pytest.raises(ValueError):
            divide(5, 0)
```

---

## Adding to this workflow

### Type checking with mypy

```yaml
- run: pip install mypy
- run: mypy src/
```

### Security linting with bandit

```yaml
- run: pip install bandit
- run: bandit -r src/
```

### Upload HTML coverage report

```yaml
- run: pytest --cov=src --cov-report=html
- uses: actions/upload-artifact@v4
  with:
    name: coverage-html
    path: htmlcov/
```

### Test with multiple OSes

```yaml
strategy:
  matrix:
    python-version: ["3.12"]
    os: [ubuntu-latest, windows-latest, macos-latest]
```

---

## Key takeaways

1. **Ruff replaces flake8/isort/pyupgrade** — one tool, no pip install, Rust-fast
2. **`pip install .[dev]`** — install the package AND dev tools in one step
3. **`if: always()`** — upload test results even on failure, critical for debugging
4. **`--junitxml`** — machine-readable output that any CI tool can consume
5. **Four versions catch version-specific bugs** — especially important in Python with its 12-month release cadence

[← Back to index](../index.md)
