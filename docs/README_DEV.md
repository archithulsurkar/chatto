# Chatto – Developer Overview

This document provides a quick, developer‑focused overview of the Chatto project and points
you to more detailed documentation.

---

## 1. Project Summary

Chatto is a real‑time, room‑based chat application built with:

- **Backend:** Node.js, Express, Socket.io  
- **Database:** MongoDB (via Mongoose)  
- **Authentication:** JWT, bcrypt  
- **Frontend:** Vanilla HTML/CSS/JavaScript  
- **Deployment:** Render + MongoDB Atlas  

It supports:

- User registration and login.
- Persistent rooms and message history.
- Real‑time messaging using WebSockets.

---

## 2. Repo Layout (High‑Level)

```text
.
├─ public/
│   ├─ index.html      # Login / register UI
│   ├─ chat.html       # Main chat interface
│   ├─ js/             # Frontend JavaScript
│   └─ css/            # Styles
├─ server.js           # Express + Socket.io server
├─ package.json
└─ README.md           # User‑oriented README
```

(Additional files like models or utilities may be introduced as the project evolves.)

For deeper details, see:

- `ARCHITECTURE.md`
- `API_REFERENCE.md`
- `SOCKET_PROTOCOL.md`
- `DATA_MODELS.md`
- `SECURITY.md`
- `DEPLOYMENT.md`
- `CONTRIBUTING.md`

---

## 3. Getting Started (Local Development)

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root:

   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=3000
   ```

3. Start the server:

   ```bash
   node server.js
   ```

4. Open the app in your browser:

   ```text
   http://localhost:3000
   ```

You should be able to register a user, log in, join a room, and exchange messages in real time.

---

## 4. Typical Development Flow

- Make changes in a feature branch (see `CONTRIBUTING.md`).
- Run the app locally and verify:
  - Registration and login work.
  - Existing rooms load correctly.
  - Messages send and receive in real time.
- Commit your changes with a descriptive message.
- Open a Pull Request into `main`.

When your PR is merged, Render will automatically deploy the latest version of `main`.

---

## 5. Where to Change What

- **Add/Edit REST endpoints** – modify `server.js` (or dedicated route files if you refactor).
- **Add Socket.io events** – extend the `io.on("connection")` section in `server.js` and the
  corresponding logic in `public/js/chat.js`.
- **Change UI layout or styles** – edit files under `public/`, mainly `chat.html`, `index.html`,
  and related CSS.
- **Change data structures** – modify or introduce Mongoose models (see `DATA_MODELS.md`).

---

## 6. Next Steps

For more advanced architectural or security topics, read:

- `ARCHITECTURE.md` – overall design and flows.
- `SECURITY.md` – current security posture and guidelines.
- `DEPLOYMENT.md` – production deployment mechanics (Render auto‑deploy).

If you have questions or want to propose a bigger change, open an issue to discuss design
before starting implementation.
