# Getting Started with Memoria

**Stop paying for the same context twice.** This guide shows you how to install and use Memoria to reduce your AI coding costs by 60-80%.

---

## 🚀 Ultra-Quick Start (No API Keys Needed!)

**Want to try Memoria right now with zero configuration?**

```bash
# 1. Install from npm
npm install -g memoria-kit

# 2. Go to your project
cd /path/to/your-project

# 3. Initialize
memoria init

# 4. Index your code (uses free local embeddings)
memoria ingest

# 5. Generate context for any task
memoria recall "add login feature" --budget 6000

# 6. Copy output and paste into Copilot/Cursor/ChatGPT/Claude
```

**Done!** No API keys, no cloud services, works 100% offline. Read below for details.

---

## Prerequisites

- **Node.js 20 or higher** ([Download here](https://nodejs.org))
- **An AI coding assistant** (GitHub Copilot, Cursor, Continue, Claude, ChatGPT, or any LLM tool)

**Optional (Memoria can work 100% locally without these):**
- **OpenAI API key** - Only for better embeddings quality (Memoria's internal search)
- **Anthropic API key** - Only for AI summarization feature

**Important:** Your AI coding assistant (Copilot/Cursor/Claude) uses its OWN authentication. Memoria just generates text context that you copy/paste to ANY AI tool.

---

## Step-by-Step Installation

### Step 1: Install Memoria

```bash
npm install -g memoria-kit
```

**Verify installation:**
```bash
memoria --version
```

You should see the version number (e.g., `0.2.0`).

**Alternative: Use npx directly (no global install)**
```bash
npx memoria-kit --help
```

**Or install from source (latest development version):**
```bash
git clone https://github.com/GergesBernaba1/Memoria.git
cd Memoria/memoria
npm install
npm run build
npm link
```

---

### Step 2: Set Up Your API Keys (100% OPTIONAL!)

**🎯 You can skip this step entirely!** Memoria works completely offline with local embeddings.

**Why you might want API keys:**
- **OpenAI API key** → Better quality semantic search (costs ~$0.001 per 1000 files indexed)
- **Anthropic API key** → AI-powered file summaries (optional feature)

**These API keys are ONLY for Memoria's internal features. Your AI coding assistant (Copilot/Cursor/Claude) uses its own authentication!**

---

**Option A: Use Free Local Embeddings (No API Key Needed)**

Skip to Step 3! Local embeddings work great for most projects.

**Option B: Use OpenAI for Better Search Quality**

**Windows (PowerShell):**
```powershell
[System.Environment]::SetEnvironmentVariable('OPENAI_API_KEY', 'sk-your-key-here', 'User')
```

**Windows (CMD):**
```cmd
setx OPENAI_API_KEY "sk-your-key-here"
```

**macOS/Linux:**
```bash
echo 'export OPENAI_API_KEY="sk-your-key-here"' >> ~/.bashrc
source ~/.bashrc
```

**For Anthropic (optional, for summarization):**
```powershell
# Windows PowerShell
[System.Environment]::SetEnvironmentVariable('ANTHROPIC_API_KEY', 'sk-ant-your-key-here', 'User')
```

**💡 Tip:** Restart your terminal after setting environment variables.

---

### Step 3: Initialize Memoria in Your Project

Navigate to your project folder and run:

```bash
cd /path/to/your/project
memoria init --name "My Project"
```

This creates a `.memoria/` folder in your project with:
- `config.json` - Your Memoria settings
- `briefs/` - Task descriptions
- `memories/` - Reusable knowledge
- `knowledge_graph/` - Code index and embeddings

---

### Step 4: Configure Memoria (Optional - Defaults Work Great!)

**By default, Memoria uses:**
- ✅ **Local embeddings** (free, runs on your machine)
- ✅ **No external API calls**
- ✅ **Works offline**

**If you want to use cloud providers (optional):**

**For OpenAI embeddings (slightly better search quality):**
```bash
memoria config set embeddings.provider openai
memoria config set embeddings.model text-embedding-3-small
```

**For Anthropic summarization (optional AI feature):**
```bash
memoria config set summarize.provider anthropic
memoria config set summarize.model claude-haiku-4-5
```

**To go back to local/free:**
```bash
memoria config set embeddings.provider local
```

---

### Step 5: Index Your Codebase

This creates a searchable index of your code:

```bash
memoria ingest
```

**What this does:**
- Walks through your project files
- Creates embeddings for semantic search
- Builds a knowledge graph
- Usually takes 1-5 minutes depending on project size

**💡 Tip:** Run this whenever you make significant code changes (e.g., daily or weekly).

---

## How Memoria Works with Your AI Agent

```
┌──────────────────────────────────────────────────────────────┐
│  MEMORIA (runs locally on your machine)                      │
│  ↓                                                            │
│  1. Indexes your code (local or OpenAI embeddings)           │
│  2. Searches for relevant files based on your query          │
│  3. Generates optimized TEXT CONTEXT                         │
│  4. You COPY this text                                       │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│  YOUR AI AGENT (completely separate, uses its own auth)     │
│  ↓                                                            │
│  You PASTE the Memoria context + ask your question           │
│                                                               │
│  ✓ GitHub Copilot Chat (your Copilot subscription)          │
│  ✓ Cursor (your Cursor/OpenAI account)                      │
│  ✓ Claude.ai (your Anthropic account)                       │
│  ✓ ChatGPT (your OpenAI account)                            │
│  ✓ Continue (your configured LLM)                           │
│  ✓ Windsurf, Cody, or ANY other AI tool                    │
└──────────────────────────────────────────────────────────────┘
```

**Key Point:** Memoria generates TEXT. You use that text with ANY AI tool you already have access to.

---

## Daily Usage Workflow

### Scenario: You Want to Add a New Feature

**Example Task:** "Add Stripe payment integration to the checkout page"

#### Step 1: Create a Brief (Optional but Recommended)

```bash
memoria brief create "stripe payment" -d "Integrate Stripe checkout with existing cart flow"
```

This stores your task description for future reference.

#### Step 2: Generate Optimized Context

```bash
memoria recall "stripe payment integration" --budget 6000 --explain
```

**What this does:**
- Searches your codebase for relevant files
- Finds related memories and patterns
- Creates a compact, token-budgeted context pack
- Shows exactly what was included and why

**Output example:**
```
=== Memoria Recall ===
Budget: 6000 tokens

Files included:
  - src/checkout/payment.ts (450 tokens)
  - src/cart/cart-service.ts (320 tokens)
  - src/api/stripe-client.ts (280 tokens)
  
Memories included:
  - "Always validate webhooks" (decision, 45 tokens)
  - "Use Stripe Elements for PCI compliance" (pattern, 52 tokens)

Total: 1,147 tokens (5,000 tokens saved vs full context)

[Full context output below...]
```

#### Step 3: Use with Your AI Assistant

**Option A: Copy to Clipboard**
```bash
memoria recall "stripe payment" --budget 6000 | clip
```
Then paste into Copilot Chat, Cursor, or your AI tool.

**Option B: Save to File**
```bash
memoria recall "stripe payment" --budget 6000 > context.txt
```
Open `context.txt` and share with your AI.

**Option C: Direct Use**
Copy the output manually and paste into:
- GitHub Copilot Chat
- Cursor Chat
- Continue
- Claude Code
- Any LLM interface

#### Step 4: Code with AI

Now ask your AI assistant:
```
[Paste the Memoria context]

Using the context above, help me add Stripe payment integration to the checkout page.
```

#### Step 5: Save What You Learned

As you work, save decisions and patterns:

```bash
# Save a decision
memoria memory add decision "Use Stripe webhooks for async payment confirmation" -t payments stripe

# Save a pattern
memoria memory add pattern "Validate webhook signatures before processing" -t security payments

# Save a note
memoria memory add note "Stripe test key starts with sk_test_" -t payments testing
```

These memories will be recalled in future tasks!

#### Step 6: Check Your Savings

```bash
memoria savings "stripe payment implementation"
```

**Output example:**
```
Baseline (full context):  45,234 tokens → $0.68
Memoria recall:            8,167 tokens → $0.12
                          ─────────────────────
Savings:                  37,067 tokens → $0.56 (82%)
```

---

## Common Commands Reference

### Project Management

| Command | Description |
|---------|-------------|
| `memoria init` | Initialize Memoria in current project |
| `memoria config get <key>` | View configuration |
| `memoria config set <key> <value>` | Update configuration |

### Content Indexing

| Command | Description |
|---------|-------------|
| `memoria ingest` | Index entire codebase |
| `memoria ingest --incremental` | Update index (faster) |
| `memoria search <query>` | Semantic search your code |

### Task Management

| Command | Description |
|---------|-------------|
| `memoria brief create <title>` | Create new task brief |
| `memoria brief list` | List all briefs |
| `memoria brief show <id>` | View a specific brief |

### Memory Management

| Command | Description |
|---------|-------------|
| `memoria memory add <type> <content>` | Add decision/pattern/note |
| `memoria memory list` | View all memories |
| `memoria memory search <query>` | Search memories |

### Context Generation (Main Feature!)

| Command | Description |
|---------|-------------|
| `memoria recall <query>` | Generate context (default 4000 token budget) |
| `memoria recall <query> --budget 8000` | Custom token budget |
| `memoria recall <query> --explain` | Show what was included and why |
| `memoria savings <query>` | Compare savings vs full context |

### Advanced Features

| Command | Description |
|---------|-------------|
| `memoria summarize` | Generate AI summaries of files |
| `memoria cluster` | Group similar code files |
| `memoria skill` | Manage skill templates |
| `memoria tokens` | Token analysis tools |

---

## Real-World Examples

### Example 1: Bug Fix

```bash
# 1. Create brief
memoria brief create "fix login timeout" -d "Users report 30s timeout on login"

# 2. Generate context
memoria recall "login authentication timeout" --budget 5000 --explain

# 3. Copy output to your AI tool
# 4. Fix the bug with AI assistance

# 5. Save the solution
memoria memory add decision "Increased JWT expiry to 60s for slow connections" -t auth performance
```

### Example 2: New Feature

```bash
# 1. Create brief
memoria brief create "dark mode" -d "Add dark mode toggle to all pages"

# 2. Search what exists
memoria search "theme colors styling"

# 3. Generate context
memoria recall "theme styling dark mode" --budget 8000

# 4. Build feature with AI
# 5. Document patterns
memoria memory add pattern "Theme values stored in CSS custom properties" -t ui theming
```

### Example 3: Refactoring

```bash
# Generate context for specific components
memoria recall "user service authentication" --budget 10000

# Check token usage
memoria tokens estimate src/services/user-service.ts

# Use with AI to refactor safely
```

---

## Best Practices

### ✅ Do This

1. **Run `memoria ingest` regularly** - Keep your index fresh (weekly or after major changes)
2. **Use specific queries** - "stripe payment validation" beats "payments"
3. **Set appropriate budgets** - 4000-8000 tokens is usually optimal
4. **Save learnings** - Add memories as you work
5. **Use `--explain` flag** - Understand what context was included
6. **Check savings** - Track your cost reductions

### ❌ Avoid This

1. **Don't ingest too often** - Once per day is usually enough
2. **Don't use tiny budgets** - Below 2000 tokens may miss important context
3. **Don't skip memories** - They compound over time
4. **Don't forget to re-ingest** - After adding new files or major changes

---

## Troubleshooting

### "Command not found: memoria"

**Solution:** 
```bash
npm install -g memoria
# Restart your terminal
```

### "Provider not ready: OPENAI_API_KEY not set"

**Solution:** Set your API key (see Step 2 above) and restart terminal.

### "No embeddings found"

**Solution:** 
```bash
memoria ingest
```

### Ingest is very slow

**Solutions:**
- Use local embeddings: `memoria config set embeddings.provider local`
- Exclude large folders: Edit `.memoria/config.json` and add to `exclude` array
- Use incremental mode: `memoria ingest --incremental`

### AI responses are generic

**Solution:** 
- Increase budget: `--budget 10000`
- Be more specific in queries
- Add more memories about your project

---

## Using with Different AI Agents

Memoria works with ANY AI tool because it just generates text context. Here's how:

### GitHub Copilot Chat (in VS Code)
```bash
# Generate context
memoria recall "add authentication" --budget 6000

# Copy the output
# Open Copilot Chat (Ctrl+Shift+I)
# Paste context + ask: "Help me implement this authentication system"
```

### Cursor
```bash
# Generate context
memoria recall "payment integration" --budget 8000

# Copy output
# Open Cursor Chat (Ctrl+L)
# Paste and ask your question
```

### Claude.ai (Web Interface)
```bash
# Generate and save to file
memoria recall "refactor user service" --budget 10000 > context.txt

# Open Claude.ai in browser
# Paste context.txt content
# Add your question
```

### ChatGPT (Web Interface)
```bash
memoria recall "bug fix login timeout" --budget 5000

# Copy output to clipboard
# Go to ChatGPT
# Paste and describe the issue
```

### Continue / Cody / Any Other Tool
Same process - Memoria outputs text, you paste it anywhere!

**No API keys needed from you - each tool uses its own authentication!**

---

## Frequently Asked Questions

### Do I need an OpenAI account to use Memoria?

**No!** Memoria works 100% locally with free embeddings. OpenAI API is only an option for better search quality.

### Does Memoria send my code to OpenAI/Anthropic?

**Only if you choose to use their embeddings or summarization.** By default, Memoria uses local embeddings that never leave your machine.

### Will this work with my company's AI tool?

**Yes!** Memoria generates text. If your company uses a custom AI agent, internal ChatGPT, or any LLM interface, you can paste Memoria's output there.

### What if I don't have any AI assistant?

You can still use Memoria to organize knowledge, search your codebase, and track token usage. But the main value is reducing costs when using AI coding assistants.

### Does this replace my AI coding assistant?

**No!** Memoria ENHANCES your existing AI assistant by giving it better, cheaper context. You still use Copilot/Cursor/Claude/etc. for the actual coding.

---

## What Makes Memoria Different?

| Traditional Approach | With Memoria |
|---------------------|--------------|
| Send full codebase (45K tokens) | Send relevant context (8K tokens) |
| $0.68 per request | $0.12 per request |
| Loses decisions over time | Memories persist |
| No cost tracking | Savings dashboard |
| Repeated token costs | One-time indexing cost |

---

## Next Steps

1. ✅ Install Memoria
2. ✅ Initialize in your project
3. ✅ Run your first ingest
4. ✅ Try a recall with your AI tool
5. ✅ Start saving memories
6. ✅ Check your savings after a week

**Questions?** Check the [README](README.md) or open an issue on GitHub.

**Ready to save 60-80% on AI costs?** Start with `memoria recall` today! 🚀
