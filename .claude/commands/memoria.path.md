---
description: Refresh the implementation path for a Memoria brief.
allowed-tools: Bash(memoria:*)
---

# memoria.path

The user invoked `/memoria.path <task>`.

Run this command from the workspace root:

```bash
memoria brief path "$ARGUMENTS"
```

Use the command output as the source of truth for the next response. If the command fails because Memoria is not installed or initialized, report the exact failure and suggest the next `memoria` command to run.
