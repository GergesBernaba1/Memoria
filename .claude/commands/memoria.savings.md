---
description: Estimate token savings from Memoria recall.
allowed-tools: Bash(memoria:*)
---

# memoria.savings

The user invoked `/memoria.savings <task>`.

Run this command from the workspace root:

```bash
memoria savings "$ARGUMENTS" --baseline all-indexed --save
```

Use the command output as the source of truth for the next response. If the command fails because Memoria is not installed or initialized, report the exact failure and suggest the next `memoria` command to run.
