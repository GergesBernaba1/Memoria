---
description: Finish a feature with ingest and savings report.
allowed-tools: Bash(memoria:*)
---

# memoria.feature.finish

The user invoked `/memoria.feature.finish <feature>`.

Run this command from the workspace root:

```bash
memoria feature finish "$ARGUMENTS"
```

Use the command output as the source of truth for the next response. If the command fails because Memoria is not installed or initialized, report the exact failure and suggest the next `memoria` command to run.
