<p align="center">
  <img src="memoria/assets/memoria-logo.svg" alt="Memoria" width="520" />
</p>

<p align="center">
  <strong>Memory-driven, token-aware development workflow for LLM coding agents.</strong>
</p>

<p align="center">
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue.svg" /></a>
  <img alt="Node.js >=20" src="https://img.shields.io/badge/node-%3E%3D20-339933.svg" />
  <img alt="CLI first" src="https://img.shields.io/badge/workflow-CLI%20first-111827.svg" />
  <img alt="GitHub stars" src="https://img.shields.io/github/stars/GergesBernaba1/Memoria?style=social" />
</p>

Memoria is an open-source CLI for developers who use LLM coding agents. It
helps teams build durable project memory, recall only relevant context, and
measure token savings instead of repeatedly sending large project prompts.

It is similar in spirit to Spec-Kit and Squad-Kit, but intentionally smaller:
one compact brief, reusable memory, indexed project context, and measured
savings.

## Core Workflow

```text
brief -> memory -> ingest -> recall -> savings
```

- `brief` captures the current task in one compact file.
- `memory` stores reusable decisions, conventions, notes, and sessions.
- `ingest` indexes code, skills, briefs, and memories.
- `recall` creates a token-budgeted context pack for Claude Code, Codex, Copilot Chat, Cursor, Continue, or another LLM agent.
- `savings` compares recalled context against a baseline.

## Quickstart

```bash
cd memoria
npm install
npm run build
npm link

cd path/to/your/project
memoria init
memoria brief create "add password reset" -d "Use existing auth patterns with low-token context."
memoria memory add decision "Password reset tokens expire after 15 minutes." -t auth security
memoria ingest
memoria recall "add password reset" --budget 4000 --explain
memoria savings "add password reset" --baseline all-indexed --save
```

## Agent Slash Commands

Memoria can generate guide files that teach AI tools to map `/memoria.*`
commands to the CLI:

```bash
memoria agent install all
```

Example commands to use inside an agent chat:

```text
/memoria.brief add password reset
/memoria.memory decision Password reset tokens expire after 15 minutes
/memoria.ingest
/memoria.recall add password reset
/memoria.savings add password reset
```

## Package

The CLI package, full command reference, and roadmap live in:

- [memoria/README.md](memoria/README.md)
- [memoria/PLAN.md](memoria/PLAN.md)

## Community

- [Contributing](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md)
- [Support](SUPPORT.md)

## License

MIT. See [LICENSE](LICENSE).
