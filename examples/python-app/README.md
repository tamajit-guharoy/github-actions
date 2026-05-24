# Python CI Demo

A simple Python calculator module with a working GitHub Actions CI workflow.

## What the workflow does

1. **Lint** — Ruff checks code quality on every push/PR to `main`
2. **Test** — pytest runs on Python 3.10–3.13 (matrix strategy)
3. **Artifacts** — test results uploaded even if tests fail (`if: always()`)

## Run locally

```
python -m pip install -e .[dev]
python -m pytest tests/ -v --cov=src
ruff check
```

## Workflow file

See [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

## Key concepts demonstrated

- `actions/setup-python@v5` with `cache: 'pip'`
- `strategy.matrix` across 4 Python versions
- `if: always()` to upload artifacts even on failure
- `--junitxml` for machine-readable test output

[← Back to index](../../index.md)
