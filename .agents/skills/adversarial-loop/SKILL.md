---
name: adversarial-loop
description: Orchestrates iterative Red-Team / Blue-Team blind fuzzing and repair loops on isolated code modules until code reaches zero defects.
---

# Adversarial Red / Blue Team Orchestrator

This skill orchestrates iterative testing cycles between `adversarial-breaker` and `adversarial-fixer`.

## The Loop Lifecycle
1. **Isolation**: Extract target function or module contract into test harness.
2. **Round N - Breaker**: Invoke `adversarial-breaker` to find flaws and produce failing tests + failure report.
3. **Check Convergence**: If Breaker fails to find any new failing test, the code is declared Battle-Tested and the loop terminates.
4. **Round N - Fixer**: Invoke `adversarial-fixer` with the failure report. Fixer updates the implementation until all tests are green.
5. **Repeat**: Go back to Step 2 for Round N+1 until Breaker yields or max iterations reached.
