# Contributing to Chatto

Thank you for your interest in contributing to Chatto!  
This document explains how to set up your environment, the preferred workflow, and the
expectations for code quality and collaboration.

---

## 1. Code of Conduct

- Be respectful and constructive.
- Assume good intent and be open to feedback.
- Keep discussions focused on technical topics and project goals.

(If this project grows, we can adopt a formal Code of Conduct such as the Contributor Covenant.)

---

## 2. Development Setup

1. **Fork** the repository on GitHub.
2. **Clone** your fork:

   ```bash
   git clone https://github.com/<your-username>/chatto.git
   cd chatto
   ```

3. **Install dependencies**:

   ```bash
   npm install
   ```

4. **Create a `.env` file**:

   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=3000
   ```

5. **Run the app**:

   ```bash
   node server.js
   ```

6. Open `http://localhost:3000` in your browser.

---

## 3. Branching Strategy

The production deployment is tied to the `main` branch (via Render auto‑deploy). To avoid breaking
production, we use the following simple branching strategy:

- `main` – always deployable, production branch.
- `feature/*` – new features or experiments.
- `bugfix/*` – fixes for existing behaviour.

**Workflow**

```bash
# Create a feature branch
git checkout -b feature/add-typing-indicator

# Make changes, then commit
git commit -m "feat: add typing indicator event"

# Push the branch
git push origin feature/add-typing-indicator
```

Then open a Pull Request into `main`.

---

## 4. Commit Message Guidelines

Use descriptive commit messages and, when possible, follow a lightweight “Conventional Commits”
style:

- `feat: ...` – new feature
- `fix: ...` – bug fix
- `docs: ...` – documentation changes
- `refactor: ...` – internal refactoring, no new features
- `chore: ...` – tooling, dependency updates, etc.
- `style: ...` – formatting, no logic changes

Example:

```bash
git commit -m "feat: add password strength validation on client"
```

---

## 5. Coding Style

- Use modern JavaScript (ES6+).
- Prefer `const` and `let` over `var`.
- Use async/await instead of raw promise chains where reasonable.
- Keep functions small and focused.
- Avoid duplicating logic; extract helpers when patterns repeat.

**Node.js / Backend**

- Validate request payloads (e.g. check required fields).
- Handle and log errors instead of letting the process crash.
- Keep Socket.io event handlers focused; extract DB logic into helper functions if needed.

**Frontend**

- Keep DOM manipulation clear and minimal.
- Avoid embedding large amounts of inline JS in HTML.
- Prefer `textContent` over `innerHTML` when rendering user content to avoid XSS.

---

## 6. Testing & Manual Verification

Automated tests are minimal at this stage, but basic manual checks are expected before opening a PR:

- Can you register a new user?
- Can you log in with that user?
- Can you join an existing room and see message history?
- Can you send and receive messages between two browser windows?
- Are there any obvious console errors or unhandled exceptions?

As the project grows, we can add Jest tests for backend routes and utility functions, and Cypress
or Playwright tests for end‑to‑end flows.

---

## 7. Pull Requests

When opening a PR:

- Provide a clear title and description.
- Link any relevant issues.
- Explain *what* you changed and *why*.
- If the UI changed, include screenshots or a short screencast.
- Keep PRs small and focused when possible.

Maintainers may request changes for:

- Code style or readability.
- Missing validation or error handling.
- Potential security issues.
- Mismatch with project goals.

---

## 8. Roadmap & Feature Ideas

If you’re looking for ideas to contribute, consider:

- Typing indicators and read receipts.
- Private/direct messages between users.
- Admin/moderation tools (kick/ban, delete messages).
- Pagination or lazy‑loading for message history.
- Theming and UX improvements.
- Migrating the frontend to React or another framework while keeping the same backend APIs.

Feel free to open an issue to propose a feature before investing significant time.
