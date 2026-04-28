---
skill_name: summarize-code
version: 0.1.0
description: Produce a concise, dependency-aware summary of a code file or module
tags:
  - summarization
  - context
dependencies: []
input_schema:
  type: object
  required: [path, sourceCode]
  properties:
    path:
      type: string
    sourceCode:
      type: string
    depth:
      type: string
      enum: [minimal, standard, deep]
      default: standard
output_schema:
  type: object
  required: [summary, exports, dependencies]
  properties:
    summary:
      type: string
    exports:
      type: array
      items: { type: string }
    dependencies:
      type: array
      items: { type: string }
---

## Purpose

Generate a short summary of a source file that other LLM calls can attach as
context without paying for the whole file.

## Steps

1. Identify the file's role: entry point, route handler, model, util, etc.
2. Extract the names of top-level exports and the modules it imports from.
3. At `standard` depth, summarize the *behaviour* of each exported symbol in
   one sentence. At `minimal`, name them only. At `deep`, include argument
   shapes and notable side effects.
4. Return summary + structured exports/dependencies arrays. Keep total output
   under 250 tokens for `standard`.

## Examples

Input (path = "src/auth/login.ts", depth = "standard"): see the file body.

Output:

```json
{
  "summary": "Login handler for the /auth/login route; verifies credentials with bcrypt and issues a JWT via signToken().",
  "exports": ["loginHandler"],
  "dependencies": ["bcrypt", "../jwt", "../db/users"]
}
```

## References

- See the proposal section "LLM-Powered Codebase Summarization".
