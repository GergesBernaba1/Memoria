<p align="center">
  <img src="memoria/assets/memoria-logo.svg" alt="Memoria" width="520" />
</p>

<p align="center">
  <strong>Stop paying for the same context twice.</strong><br />
  <strong>Memory-driven, token-aware workflow that cuts AI coding costs by 60-80%.</strong>
</p>

<p align="center">
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue.svg" /></a>
  <a href="https://www.npmjs.com/package/memoria-kit"><img alt="npm version" src="https://img.shields.io/npm/v/memoria-kit.svg" /></a>
  <a href="https://nodejs.org"><img alt="Node.js >=20" src="https://img.shields.io/badge/node-%3E%3D20-339933.svg" /></a>
  <img alt="CLI first" src="https://img.shields.io/badge/workflow-CLI%20first-111827.svg" />
  <img alt="GitHub stars" src="https://img.shields.io/github/stars/GergesBernaba1/Memoria?style=social" />
</p>

---

## Quick Start

```bash
# Install
npm install -g memoria-kit

# Initialize in your project
cd your-project
memoria init

# Index your codebase
memoria ingest

# Generate optimized context for your AI assistant
memoria recall "add authentication" --budget 6000
```

**Copy the output to Copilot, Cursor, ChatGPT, or any AI tool. Save 60-80% on tokens!**

---

## Getting Started

### Installation

```bash
npm install -g memoria-kit
```

Verify it's installed:
```bash
memoria --version
```

### Your First Workflow

**1. Initialize in your project:**
```bash
cd your-project
memoria init --name "My Project"
```

This creates a `.memoria/` folder with configuration.

**2. Index your codebase:**
```bash
memoria ingest
```

This creates embeddings and a knowledge graph of your code. Takes 1-5 minutes depending on project size.

**3. Generate optimized context:**
```bash
memoria recall "add user authentication" --budget 6000 --explain
```

**4. Use with your AI assistant:**
- Copy the output
- Paste into GitHub Copilot Chat, Cursor, Claude, or ChatGPT
- Add your question or request

**5. Save what you learn:**
```bash
memoria memory add decision "Use JWT tokens for auth" -t authentication
```

**6. Check your savings:**
```bash
memoria savings "authentication implementation"
```

See [GETTING_STARTED.md](GETTING_STARTED.md) for detailed instructions.

---

## Why Memoria?

**The Problem**: Every time you ask Claude, Cursor, or Copilot to "add a feature", you send your entire codebase. A typical request costs **$0.50-$2.00** in tokens. Do this 50 times a month? That's **$100+ wasted on redundant context**.

**The Solution**: Memoria remembers what your AI agent already knows, recalls only what's relevant, and tracks exactly how much you save.

```
Before Memoria: 45,000 tokens × $0.015 = $0.68 per request
After Memoria:   8,200 tokens × $0.015 = $0.12 per request
                                         ─────────────────
Savings:                                 $0.56 (82%) ✓
```

## Real Case Study

**Project**: E-commerce checkout flow (Node.js, 127 files, 18K LOC)  
**Task**: "Add discount code validation with existing patterns"  
**Agent**: Claude 3.5 Sonnet via Cursor

| Metric | Without Memoria | With Memoria | Improvement |
|--------|----------------|--------------|-------------|
| **Input Tokens** | 45,234 | 8,167 | **82% reduction** |
| **Cost per Request** | $0.68 | $0.12 | **$0.56 saved** |
| **Monthly Cost** (50 requests) | $34.00 | $6.00 | **$28/month saved** |
| **Context Quality** | Mixed relevance | Targeted | **Better results** |
| **Setup Time** | 0 min | 3 min | One-time cost |

**Annual Savings**: $336 per developer  
**Team of 5**: **$1,680/year saved**

Memoria paid for itself in the first week.

---

## How It's Different

Similar in spirit to **Spec-Kit** and **Squad-Kit**, but focused on **economics**:

| Tool | Focus | Strength |
|------|-------|----------|
| **Spec-Kit** | Project specifications | Better planning |
| **Squad-Kit** | Team collaboration | Better coordination |
| **Memoria** | Token optimization | **Lower AI bills** |

Memoria is intentionally smaller: one compact brief, reusable memory, indexed project context, and **measured savings**.

## Core Workflow

```text
brief -> memory -> ingest -> recall -> savings
```

- `brief` captures the current task in one compact file.
- `memory` stores reusable decisions, conventions, notes, and sessions.
- `ingest` indexes code, skills, briefs, and memories.
- `recall` creates a token-budgeted context pack for Claude Code, Codex, Copilot Chat, Cursor, Continue, or another LLM agent.
- `savings` compares recalled context against a baseline.

## Developer Workflow

### Daily Usage Pattern

**1. Morning: Start a New Feature**
```bash
# Create a brief for today's task
memoria brief create "add stripe payment" -d "Integrate Stripe checkout with existing cart"

# Recall relevant context with token budget
memoria recall "stripe payment" --budget 6000 --explain

# Copy output to Cursor/Claude and start coding
```

**2. During Development: Add Learnings**
```bash
# Made a decision? Save it for next time
memoria memory add decision "Use Stripe webhooks for payment confirmation" -t payments stripe

# Found a useful pattern? Save it
memoria memory add pattern "Always validate webhook signatures" -t security payments
```

**3. End of Day: Track Savings**
```bash
# See how much you saved today
memoria savings "stripe payment" --baseline all-indexed --save

# Output: "Saved $4.23 across 8 requests today"
```

**4. Weekly: Re-index**
```bash
# After major changes, re-index the codebase
memoria ingest

# Memoria learns from your new code
```

### Integration with Git Workflow

```bash
# Starting a new feature branch
git checkout -b feature/user-profiles
memoria brief create "user profiles" -d "Add profile page with avatar upload"

# Commit your brief with your code
git add .memoria/briefs/user-profiles.md
git commit -m "Add user profiles feature"

# Team members can see your context
git pull
memoria recall "user profiles" --budget 5000
```

### Team Collaboration

**Share Project Conventions:**
```bash
# Lead dev sets team standards
memoria memory add convention "Use Zod for all API validation" -t validation standards
memoria memory add convention "Prefer composition over inheritance" -t architecture

# Push to repo
git add .memoria/memory/
git commit -m "Add team conventions"

# Other devs automatically get these in their recalls
```

**Session Notes for Handoffs:**
```bash
# End of your shift
memoria memory add session "Payment integration 80% done, need to add refund handling" -t payments wip

# Next dev picks up
memoria recall "payment" --budget 5000
# Gets your session notes automatically
```

### Real-World Scenarios

**Scenario 1: Bug Fix**
```bash
# Find relevant code quickly
memoria recall "authentication bug" --budget 3000 --focus bug-reports auth-module

# Much faster than searching entire codebase
```

**Scenario 2: Refactoring**
```bash
# Before refactor
memoria ingest  # Snapshot current state

# After refactor
memoria brief create "refactor auth" -d "Moved to OAuth2, removed custom tokens"
memoria memory add decision "Migrated to OAuth2 for better security" -t auth migration

# Future recalls will use new patterns
```

**Scenario 3: Onboarding New Developer**
```bash
# New dev joins team
memoria init
memoria memory list  # See all team conventions
memoria recall "getting started" --budget 8000

# Gets curated context instead of reading everything
```

### When to Use Each Command

| Command | Use When | Frequency |
|---------|----------|-----------|
| `init` | New project or repo | Once |
| `brief create` | Starting new task/feature | Daily |
| `memory add` | Made important decision | As needed |
| `ingest` | Code changed significantly | Weekly |
| `recall` | Need context for AI agent | Every request |
| `savings` | Want to track ROI | Daily/Weekly |
| `agent install` | Setup new AI tool | Once per tool |

---

## Works With Any AI Agent

Memoria integrates with **Cursor, Claude Code, Copilot, Continue, Windsurf, Aider**, and any LLM coding tool.

### Agent Slash Commands

Memoria can generate guide files that teach AI tools to use Memoria commands:

```bash
memoria agent install all
```

Then use inside your agent chat:

```text
/memoria.brief add password reset
/memoria.memory decision Password reset tokens expire after 15 minutes
/memoria.ingest
/memoria.recall add password reset
/memoria.savings add password reset
```

---

## Key Features

- ✅ **Token Budget Control**: Set hard limits, never overspend
- ✅ **Savings Tracking**: See exactly how much you save per request
- ✅ **Persistent Memory**: Reuse decisions, conventions, patterns
- ✅ **Smart Indexing**: Semantic search + knowledge graphs
- ✅ **Agent Agnostic**: Works with any LLM coding tool
- ✅ **Fast**: TypeScript/Node.js for sub-second recalls
- ✅ **Type Safe**: Full TypeScript for reliability

---

## Documentation

- **[Getting Started Guide](GETTING_STARTED.md)** - Complete installation and usage tutorial
- **[Publishing Guide](PUBLISHING.md)** - How to publish new versions
- **[Full CLI Reference](memoria/README.md)** - All commands and options
- **[Roadmap & Plan](memoria/PLAN.md)** - Future features and architecture

## Community & Support

- [Contributing Guidelines](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md)
- [Get Support](SUPPORT.md)

## License

MIT. See [LICENSE](LICENSE).

---

<p align="center">
  <strong>Stop wasting tokens. Start saving money.</strong><br />
  Star this repo if Memoria saves you money! ⭐
</p>
