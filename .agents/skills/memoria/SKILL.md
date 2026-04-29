---
name: memoria
description: Use Memoria recall, search, briefs, and durable memory before broad project exploration.
---

# Memoria

Use this skill when the user asks for Memoria context, writes `/memoria.*`, wants project memory recalled, or asks to save a durable decision.

## Commands

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

## Workflow

1. For implementation tasks, run `memoria recall "<task>" --budget 4000 --explain` before broad file reads.
2. Use recalled context as the starting source of truth.
3. Run `memoria ingest` after meaningful code or memory changes.
4. Save durable decisions with `memoria memory add decision "<text>"`.
5. Do not store secrets, API keys, credentials, or private tokens in Memoria memory.
