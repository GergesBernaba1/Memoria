---
description: Print a shareable Feature Memory Packet.
allowed-tools: Bash(memoria:*)
---

# memoria.feature.packet

The user invoked `/memoria.feature.packet <feature>`.

Run this command from the workspace root:

```bash
memoria feature packet "$ARGUMENTS"
```

Use the command output as the source of truth for the next response. If the command fails because Memoria is not installed or initialized, report the exact failure and suggest the next `memoria` command to run.
