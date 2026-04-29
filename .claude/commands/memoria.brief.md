---
description: Create a compact Memoria task brief.
allowed-tools: Bash(memoria:*)
---

# memoria.brief

The user invoked `/memoria.brief <task>`.

Run this command from the workspace root:

```bash
memoria brief create "$ARGUMENTS"
```

Use the command output as the source of truth for the next response. If the command fails because Memoria is not installed or initialized, report the exact failure and suggest the next `memoria` command to run.
