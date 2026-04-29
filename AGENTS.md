# Memoria

This project uses Memoria for local-first project memory and token-budgeted recall.

When the user writes a `/memoria.*` request, treat it as a Memoria protocol command and run the matching CLI command when shell access is available:

| User request | CLI command |
| --- | --- |
| `/memoria.init` | `memoria init` |
| `/memoria.brief <task>` | `memoria brief create "<arguments>"` |
| `/memoria.path <task>` | `memoria brief path "<arguments>"` |
| `/memoria.checklist <task>` | `memoria brief checklist "<arguments>"` |
| `/memoria.feature.start <feature>` | `memoria feature start "<arguments>"` |
| `/memoria.feature.list` | `memoria feature list` |
| `/memoria.feature.status <feature>` | `memoria feature status "<arguments>"` |
| `/memoria.feature.done <feature> <item>` | `memoria feature done "<arguments>"` |
| `/memoria.feature.packet <feature>` | `memoria feature packet "<arguments>"` |
| `/memoria.feature.finish <feature>` | `memoria feature finish "<arguments>"` |
| `/memoria.ingest` | `memoria ingest` |
| `/memoria.recall <task>` | `memoria recall "<arguments>" --budget 4000 --explain` |
| `/memoria.ask <question>` | `memoria ask "<arguments>"` |
| `/memoria.search <query>` | `memoria search "<arguments>"` |
| `/memoria.savings <task>` | `memoria savings "<arguments>" --baseline all-indexed --save` |
| `/memoria.memories <query>` | `memoria memory search "<arguments>"` |
| `/memoria.doctor` | `memoria doctor` |

Prefer `memoria recall "<task>" --budget 4000 --explain` before broad source reads. Store durable decisions with `memoria memory add decision "<text>"`.

Codex currently exposes built-in slash commands and skills. This file teaches Codex how to respond to `/memoria.*` text, while `.agents/skills/memoria/SKILL.md` exposes the same workflow as a project skill.
