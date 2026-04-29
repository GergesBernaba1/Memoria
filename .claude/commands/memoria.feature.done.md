---
description: Mark a Feature Memory Packet checklist item done.
allowed-tools: Bash(memoria:*)
---

# memoria.feature.done

The user invoked `/memoria.feature.done <feature> <item>`.

Run this command from the workspace root:

```bash
memoria feature done "$ARGUMENTS"
```

Use the command output as the source of truth for the next response. If the command fails because Memoria is not installed or initialized, report the exact failure and suggest the next `memoria` command to run.
