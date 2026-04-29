---
description: Search Memoria code, skills, briefs, and memory.
allowed-tools: Bash(memoria:*)
---

# memoria.search

The user invoked `/memoria.search <query>`.

Run this command from the workspace root:

```bash
memoria search "$ARGUMENTS"
```

Use the command output as the source of truth for the next response. If the command fails because Memoria is not installed or initialized, report the exact failure and suggest the next `memoria` command to run.
