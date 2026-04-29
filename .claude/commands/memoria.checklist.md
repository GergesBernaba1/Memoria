---
description: Refresh the checklist for a Memoria brief.
allowed-tools: Bash(memoria:*)
---

# memoria.checklist

The user invoked `/memoria.checklist <task>`.

Run this command from the workspace root:

```bash
memoria brief checklist "$ARGUMENTS"
```

Use the command output as the source of truth for the next response. If the command fails because Memoria is not installed or initialized, report the exact failure and suggest the next `memoria` command to run.
