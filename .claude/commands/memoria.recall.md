---
description: Recall token-budgeted Memoria context for a task.
allowed-tools: Bash(memoria:*)
---

# memoria.recall

The user invoked `/memoria.recall <task>`.

Run this command from the workspace root:

```bash
memoria recall "$ARGUMENTS" --budget 4000 --explain
```

Use the command output as the source of truth for the next response. If the command fails because Memoria is not installed or initialized, report the exact failure and suggest the next `memoria` command to run.
