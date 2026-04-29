---
description: Create or refresh a Feature Memory Packet.
allowed-tools: Bash(memoria:*)
---

# memoria.feature.start

The user invoked `/memoria.feature.start <feature>`.

Run this command from the workspace root:

```bash
memoria feature start "$ARGUMENTS"
```

Use the command output as the source of truth for the next response. If the command fails because Memoria is not installed or initialized, report the exact failure and suggest the next `memoria` command to run.
