---
description: Ask an LLM using Memoria recalled context.
allowed-tools: Bash(memoria:*)
---

# memoria.ask

The user invoked `/memoria.ask <question>`.

Run this command from the workspace root:

```bash
memoria ask "$ARGUMENTS"
```

Use the command output as the source of truth for the next response. If the command fails because Memoria is not installed or initialized, report the exact failure and suggest the next `memoria` command to run.
