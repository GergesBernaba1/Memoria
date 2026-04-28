# Security Policy

## Supported Versions

Security fixes target the latest released version of Memoria.

## Reporting A Vulnerability

Do not open a public issue for secrets, credential leaks, remote code execution,
or other sensitive vulnerabilities.

When a private security contact is available for the repository, use it. Include:

- a clear description of the vulnerability.
- steps to reproduce.
- affected versions or commit hashes.
- impact and any known workarounds.

## Security Expectations

Memoria stores project memory and generated context locally in `.memoria/`.
Contributors should avoid writing secrets, API keys, private tokens, or
customer data to examples, tests, fixtures, logs, or documentation.
