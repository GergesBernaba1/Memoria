---
description: Recall token-budgeted Memoria context for a task.
mode: agent
tools: ["codebase", "terminal"]
---

# memoria.recall

The user invoked `/memoria.recall <task>`.

Run this command in the workspace terminal:

```bash
memoria recall "<arguments>" --budget 4000 --explain
```

Use the Memoria output as the source of truth. If terminal execution is unavailable, tell the user the exact command to run and ask them to paste the output.
