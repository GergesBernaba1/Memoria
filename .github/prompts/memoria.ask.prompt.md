---
description: Ask an LLM using Memoria recalled context.
mode: agent
tools: ["codebase", "terminal"]
---

# memoria.ask

The user invoked `/memoria.ask <question>`.

Run this command in the workspace terminal:

```bash
memoria ask "<arguments>"
```

Use the Memoria output as the source of truth. If terminal execution is unavailable, tell the user the exact command to run and ask them to paste the output.
