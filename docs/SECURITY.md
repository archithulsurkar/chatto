# Chatto – Security Guide

This document describes the current security characteristics of Chatto, outlines best practices
for contributors, and highlights areas where security can be improved in future versions.

---

## 1. Authentication

- Chatto uses **JSON Web Tokens (JWT)** for stateless authentication.
- After a successful login, the server signs a JWT with a secret configured via `JWT_SECRET`
  and returns it to the client.
- The client stores this token (e.g. in `localStorage`) and uses it for subsequent requests.

**Best Practices**

- Never commit `JWT_SECRET` or any real secrets to the repository.
- Use a strong, random `JWT_SECRET` value in production.
- Consider adding JWT expiration (e.g. 15 minutes + refresh token pattern) for improved safety.

---

## 2. Password Handling

- Passwords are never stored in plaintext.
- **bcrypt** is used to hash passwords before saving them in MongoDB.
- On login, the submitted password is hashed and compared against the stored hash.

**Best Practices**

- Use at least 10 bcrypt salt rounds in development; consider higher for production.
- Do not log passwords, even in development.
- If a hash leak is suspected, reset all passwords and rotate any associated secrets.

---

## 3. Transport Security

- In production, Chatto should be served over **HTTPS** to protect credentials and tokens in transit.
- Render can terminate TLS for you; ensure the public URL uses `https://`.

**Best Practices**

- Always access the production site via HTTPS.
- Avoid sending JWTs over unsecured channels.

---

## 4. Input Validation & XSS

Primary user‑controlled inputs are:

- `username` and `password` fields during auth.
- `text` fields for chat messages.
- (Potentially) room names and other metadata.

**Server‑Side**

- Validate that inputs exist and meet basic constraints (length, type).
- Reject empty or overly long messages.

**Client‑Side**

- When rendering message content, ensure that HTML is appropriately escaped so that
  arbitrary `<script>` tags or inline event handlers are not executed.
- A simple pattern is to insert text via `textContent`, not `innerHTML`.

**Risks**

- Without proper escaping, a malicious user could inject JavaScript via messages (XSS).
- Mitigate by sanitizing/escaping all user‑supplied text before rendering.

---

## 5. Authorization

At present, Chatto implements basic authentication but minimal authorization. Any authenticated
user can generally:

- Join existing rooms.
- Send messages in those rooms.

**Future Improvements**

- Implement roles (e.g. `"admin"`, `"moderator"`, `"user"`).
- Add server‑side checks to restrict room creation, moderation actions, or access to private rooms.
- Consider per‑room ACLs or membership lists.

---

## 6. Rate Limiting & Abuse Prevention

Chatto currently does not enforce rate limiting out of the box. This opens the possibility of:

- Message spam.
- Brute‑force login attempts.
- Resource exhaustion via excessive Socket.io events.

**Recommended Mitigations**

- Add rate limiting middleware for sensitive endpoints such as `/api/login`.
- Implement basic server‑side throttling for message events (e.g. per‑user/per‑IP thresholds).
- Log suspicious patterns and consider temporarily blocking abusive clients.

---

## 7. Secrets & Configuration

- All sensitive configuration values (MongoDB URI, JWT secret, etc.) must be stored in environment
  variables (.env or the hosting provider’s secret management system).
- The `.gitignore` ensures `.env` files are not committed.

**Best Practices**

- Use separate secrets for development, staging, and production.
- Rotate secrets periodically and immediately after a suspected leak.

---

## 8. Data Privacy

- Chat messages and user information are stored in MongoDB Atlas (or your chosen MongoDB instance).
- Ensure that your MongoDB deployment is properly secured:
  - Requires authentication.
  - Bound to trusted networks/IP allowlists.
  - Uses TLS for client connections if available.

**Data Retention**

- The project does not currently implement message retention policies.
- If required, add periodic cleanup or archival logic (e.g. delete messages older than N days).

---

## 9. Known Gaps & Future Work

- No built‑in CSRF protection (less critical for a pure SPA with token auth, but still worth considering).
- No account lockout after repeated failed logins.
- No 2‑factor authentication (2FA).
- No end‑to‑end encryption; messages are decrypted on the server and stored in plaintext in the DB.

Contributors adding features should keep these gaps in mind and avoid introducing new ones.
