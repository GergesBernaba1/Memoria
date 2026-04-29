---
description: Search durable Memoria memory records.
allowed-tools: Bash(memoria:*)
---

# memoria.memories

The user invoked `/memoria.memories <query>`.

Run this command from the workspace root:

```bash
memoria memory search "$ARGUMENTS"
```

Use the command output as the source of truth for the next response. If the command fails because Memoria is not installed or initialized, report the exact failure and suggest the next `memoria` command to run.
