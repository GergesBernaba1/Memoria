---
description: Check Memoria workspace health.
allowed-tools: Bash(memoria:*)
---

# memoria.doctor

The user invoked `/memoria.doctor`.

Run this command from the workspace root:

```bash
memoria doctor
```

Use the command output as the source of truth for the next response. If the command fails because Memoria is not installed or initialized, report the exact failure and suggest the next `memoria` command to run.
