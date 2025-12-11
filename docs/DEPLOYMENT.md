# Chatto – Deployment Guide (Render Auto‑Deploy)

This document describes how Chatto is deployed to production using **Render** and how the
auto‑deploy pipeline works for commits to the `main` branch.

---

## 1. Overview

Chatto is deployed as a Node.js web service on Render, backed by a MongoDB Atlas database.

Key properties:

- The service is connected to the GitHub repository `archithulsurkar/chatto`.
- Render is configured to deploy automatically from the `main` branch.
- WebSockets (Socket.io) are supported out of the box.

---

## 2. Environment Variables

The following environment variables must be set for the service in Render:

- `MONGODB_URI` – connection string for MongoDB Atlas.
- `JWT_SECRET` – secret key used for signing JWT tokens.
- `PORT` – port on which the Node.js app listens (Render usually sets this automatically; the app should respect it).

Example `.env` for local development:

```env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/chatto
JWT_SECRET=replace-with-a-strong-secret
PORT=3000
```

**Note:** Never commit `.env` files or secrets to the repository.

---

## 3. Render Service Configuration

When creating the Render service:

1. Choose **Web Service**.
2. Connect GitHub and select the `archithulsurkar/chatto` repository.
3. Select the branch: `main`.
4. Set **Auto‑deploy** to `Yes`.
5. Build command (typical):

   ```bash
   npm install
   ```

6. Start command:

   ```bash
   node server.js
   ```

7. Add environment variables as described above.

Render will then build and run the project automatically whenever changes are pushed or merged
into `main`.

---

## 4. Auto‑Deploy Workflow

With auto‑deploy enabled, the lifecycle looks like this:

1. A Pull Request is merged into `main` on GitHub.
2. GitHub notifies Render via webhook.
3. Render pulls the latest commit from `main`.
4. Render runs the build command (`npm install`).
5. Render starts the application via the start command (`node server.js`).
6. If the app starts successfully, the new version becomes live.

If the build or startup fails, the previous working version remains active and logs are shown
in the Render dashboard.

---

## 5. Developer Workflow with Auto‑Deploy

Because `main` is directly tied to production deployments, contributors should **not** push
directly to `main`.

**Recommended workflow:**

```text
Local dev  →  feature branch  →  Pull Request  →  merge to main  →  auto‑deploy
```

Steps:

1. Create a feature branch:

   ```bash
   git checkout -b feature/my-feature
   ```

2. Implement and test your changes locally.
3. Commit and push:

   ```bash
   git push origin feature/my-feature
   ```

4. Open a Pull Request into `main`.
5. After review and approval, merge the PR.
6. Render will automatically deploy the new `main`.

---

## 6. Protecting the `main` Branch

To reduce the risk of accidental or breaking deployments:

- Enable **branch protection rules** on GitHub for `main`:
  - Require Pull Requests before merging.
  - Require at least one review approval.
  - Optionally require that PRs are up‑to‑date with `main` before merge.
- Disable force‑pushes to `main`.

This workflow keeps production stable while enabling rapid iteration.

---

## 7. Troubleshooting Deployments

Common issues and how to address them:

### 7.1 Build Failures

Symptoms:

- Render shows a red build status.
- Logs mention missing modules or syntax errors.

Actions:

- Check the build logs in Render.
- Ensure all dependencies are listed in `package.json`.
- Confirm Node.js version compatibility (set `"engines"` in `package.json` if needed).

### 7.2 Runtime Errors / Crashes

Symptoms:

- Service crashes shortly after starting.
- Socket.io connections fail or disconnect immediately.

Actions:

- Inspect application logs in Render.
- Verify `MONGODB_URI` and `JWT_SECRET` are set correctly.
- Confirm that the app uses `process.env.PORT` rather than a hardcoded port.
- Check for unhandled promise rejections or thrown errors in `server.js`.

### 7.3 WebSocket / Socket.io Issues

- Ensure the frontend connects to the correct base URL (Render domain, not `localhost`).
- Confirm that no reverse proxy is stripping WebSocket headers.

---

## 8. Manual Deploys (Optional)

If needed, auto‑deploy can be disabled in Render:

- In the Render dashboard, go to the service **Settings**.
- Set **Auto‑deploy** to `No`.
- Use the **Deploy latest commit** button to trigger manual deployments.

This can be useful for scheduled releases or when staging environments are introduced.

---

## 9. Future Improvements

- Introduce a separate **staging** service on Render for pre‑production testing.
- Integrate CI (GitHub Actions) to run tests before allowing merges to `main`.
- Add alerts/monitoring for uptime, error rates, and performance metrics.
