# Contributing To Memoria

Thanks for helping improve Memoria. The project lives in the `memoria/`
subdirectory. By participating, you agree to follow the
[`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

## Setup

```bash
cd memoria
npm install
```

Use Node.js 20 or newer.

## Development Commands

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Run all four before opening a pull request.

## Local CLI Usage

Run the CLI from source:

```bash
npm run dev -- --help
npm run dev -- init
npm run dev -- recall "how does auth work?" --budget 4000
```

Or build and use the compiled CLI:

```bash
npm run build
node dist/cli.js --help
```

## Project Direction

Memoria is not trying to clone spec-heavy workflows. Prefer features that:

- keep workflow files compact.
- reduce repeated LLM context.
- make recall explainable and auditable.
- store project memory as readable local files.
- work without a database or daemon.

The core workflow should stay:

```text
brief -> memory -> ingest -> recall -> savings
```

## Coding Guidelines

- Keep changes scoped and consistent with the existing TypeScript style.
- Prefer plain files and deterministic behavior.
- Add tests for CLI behavior, token accounting, and retrieval changes.
- Avoid committing generated artifacts such as `dist/`, `node_modules/`, or local `.memoria/` workspaces.
- Do not write API keys or secrets to disk.

## Documentation

Update these when behavior changes:

- `memoria/README.md` for user-facing commands.
- `memoria/PLAN.md` for roadmap and current direction.
- `CONTRIBUTING.md` for contributor workflow changes.

## Security

Do not include API keys, secrets, customer data, or private repository content
in issues, pull requests, examples, fixtures, or generated `.memoria/` files.
Follow [`SECURITY.md`](SECURITY.md) for vulnerability reports.

## Pull Request Checklist

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] Docs updated when user-visible behavior changed
