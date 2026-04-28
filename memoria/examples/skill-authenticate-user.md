---
skill_name: authenticate-user
version: 0.1.0
description: Authenticate a user against the database and return a signed JWT
tags:
  - auth
  - jwt
dependencies: []
input_schema:
  type: object
  required: [email, password]
  properties:
    email:
      type: string
      format: email
    password:
      type: string
      minLength: 8
output_schema:
  type: object
  required: [token, expiresAt]
  properties:
    token:
      type: string
    expiresAt:
      type: string
      format: date-time
---

## Purpose

Verify a user's credentials and issue a short-lived JWT they can use to call
the rest of the API. Use this whenever a frontend or service needs to log a
human into the system.

## Steps

1. Look up the user by `email` (case-insensitive). If none exists, return a
   generic "invalid credentials" error — never reveal whether the email was
   recognized.
2. Verify `password` against the stored bcrypt hash with `bcrypt.compare`.
3. On success, sign a JWT with the user id, role, and a 1-hour expiry using the
   server's signing secret.
4. Record the login event in the audit log with the source IP.
5. Return `{ token, expiresAt }`.

## Examples

Input:

```json
{ "email": "alice@example.com", "password": "correcthorsebatterystaple" }
```

Output:

```json
{ "token": "eyJhbGciOi...", "expiresAt": "2026-04-29T13:00:00Z" }
```

## References

- `src/auth/login.ts` — current implementation
- RFC 7519 (JWT)
