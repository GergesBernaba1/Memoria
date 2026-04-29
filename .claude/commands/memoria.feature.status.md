---
description: Show Feature Memory Packet status.
allowed-tools: Bash(memoria:*)
---

# memoria.feature.status

The user invoked `/memoria.feature.status <feature>`.

Run this command from the workspace root:

```bash
memoria feature status "$ARGUMENTS"
```

Use the command output as the source of truth for the next response. If the command fails because Memoria is not installed or initialized, report the exact failure and suggest the next `memoria` command to run.
