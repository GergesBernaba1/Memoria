---
description: Estimate token savings from Memoria recall.
mode: agent
tools: ["codebase", "terminal"]
---

# memoria.savings

The user invoked `/memoria.savings <task>`.

Run this command in the workspace terminal:

```bash
memoria savings "<arguments>" --baseline all-indexed --save
```

Use the Memoria output as the source of truth. If terminal execution is unavailable, tell the user the exact command to run and ask them to paste the output.
