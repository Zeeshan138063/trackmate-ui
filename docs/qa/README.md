# QA

The standing rule: **"the tests are green" and "a person can do this" are different claims.** QA
checks the second one, by driving the real product, and writes down what it found.

Every finding is written as: what it is, the evidence, the root cause at `file:line`, the fix, and
the command that verifies it. Read the register before fixing anything it names.

- `coverage-matrix.md`: every REQ and its acceptance criteria, mapped to the test that proves it.
- `findings-YYYY-MM-DD.md`: one register per QA run.
