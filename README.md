![Chatto](./assets/video.gif)
# Chatto

A lightweight, real‑time chat application with rooms, authentication, and persistent message history.

> Built with Node.js, Express, Socket.io, and MongoDB – designed to be easy to read, extend, and deploy.

---

## 🌐 Live Demo

**Production URL:** https://chatto-nirb.onrender.com  

Open it in two browser windows, join the same room, and you’ll see messages appear in real time.

---

## ✨ Features

- **Real‑time messaging** — WebSocket-based messaging with Socket.io  
- **Room‑based chats** — Create/join multiple rooms with isolated histories  
- **User authentication** — Registration and login backed by JWT  
- **Secure password storage** — Passwords hashed with bcrypt  
- **Persistent history** — Messages stored in MongoDB  
- **Online presence** — See who is currently in a room  
- **Responsive UI** — Works on desktop and mobile screens  

---

## 🧱 Tech Stack

- **Backend:** Node.js, Express, Socket.io  
- **Database:** MongoDB (via Mongoose)  
- **Auth:** JWT for stateless sessions, bcrypt for hashing  
- **Frontend:** Vanilla HTML, CSS, and JavaScript  
- **Hosting:** Render (app) + MongoDB Atlas (database)  

---

## 🏗️ Architecture Overview

```text
┌─────────────┐     WebSocket      ┌─────────────┐
│   Client    │ ◄────────────────► │   Server    │
│  (Browser)  │      + REST        │  (Node.js)  │
└─────────────┘                    └──────┬──────┘
                                          │
                                          ▼
                                   ┌─────────────┐
                                   │   MongoDB   │
                                   │    Atlas    │
                                   └─────────────┘
```

**Key design choices:**

- Socket.io “rooms” for efficient broadcasting to users in the same room  
- JWT‑based, stateless authentication (no server-side session store)  
- Mongoose models connecting messages to rooms and users  
- Secrets and connection strings provided through environment variables  

---

## 📂 Project Structure

```text
.
├─ public/
│   ├─ index.html        # Auth / landing page
│   ├─ chat.html         # Main chat UI
│   ├─ css/              # Stylesheets
│   └─ js/               # Frontend scripts (login, chat)
├─ server.js             # Express + Socket.io server
├─ package.json          # Dependencies and metadata
├─ package-lock.json
├─ .gitignore
└─ docs/                 # (Optional but recommended) Architecture & API docs
    ├─ ARCHITECTURE.md
    ├─ API_REFERENCE.md
    ├─ SOCKET_PROTOCOL.md
    ├─ DATA_MODELS.md
    ├─ SECURITY.md
    ├─ DEPLOYMENT.md
    ├─ CONTRIBUTING.md
    └─ README_DEV.md
```

> If `docs/` is not in the repo yet, you can add it with your documentation bundle.

---

## 🚀 Running Locally

### 1. Clone the repository

```bash
git clone https://github.com/archithulsurkar/chatto.git
cd chatto
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Create a `.env` file in the project root:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=3000
```

### 4. Start the server

```bash
node server.js
```

### 5. Open the app

Visit:

```text
http://localhost:3000
```

You should be able to register, log in, join a room, and chat in real time using two browser windows.

---

## ⚙️ Environment Variables

| Variable       | Required | Description                              |
|----------------|----------|------------------------------------------|
| `MONGODB_URI`  | ✅       | MongoDB connection string                |
| `JWT_SECRET`   | ✅       | Secret for signing JWTs                  |
| `PORT`         | ⚪️       | Port for the HTTP server (defaults on Render) |

---

## 📡 Core HTTP API (Summary)

> Detailed docs can live in `docs/API_REFERENCE.md`. This is a quick reference.

| Method | Endpoint        | Description                      |
|--------|-----------------|----------------------------------|
| POST   | `/api/register` | Create a new user account        |
| POST   | `/api/login`    | Authenticate user and get a JWT  |
| GET    | `/api/verify`   | Validate an existing JWT         |
| GET    | `/api/rooms`    | List all available chat rooms    |

---

## 🔌 Socket.io Events (Summary)

> Detailed semantics can live in `docs/SOCKET_PROTOCOL.md`.

### Client → Server

- **`join room`** — join a specific room  
- **`chat message`** — send a message to a room  
- **`create room`** *(if enabled)* — create a new room  
- **`typing`** *(optional UX feature)* — indicate the user is typing  

### Server → Client

- **`message history`** — initial history when a room is joined  
- **`chat message`** — broadcast of a new message  
- **`user joined room`** — someone entered the room  
- **`user left room`** — someone left the room  
- **`room created`** *(if used)* — a new room is available  

---

## 📚 Developer Documentation

For collaborators and future you, consider adding a `docs/` folder with:

- **System design:** `docs/ARCHITECTURE.md`  
- **HTTP API details:** `docs/API_REFERENCE.md`  
- **Socket contract:** `docs/SOCKET_PROTOCOL.md`  
- **Database models:** `docs/DATA_MODELS.md`  
- **Security notes:** `docs/SECURITY.md`  
- **Deployment (Render auto‑deploy):** `docs/DEPLOYMENT.md`  
- **How to contribute:** `docs/CONTRIBUTING.md`  
- **Dev quickstart:** `docs/README_DEV.md`  

---

## 🤝 Contributing

Contributions, issues, and feature ideas are welcome.

Suggested workflow:

1. Fork the repo  
2. Create a feature branch:  

   ```bash
   git checkout -b feature/my-feature
   ```

3. Commit your changes:  

   ```bash
   git commit -m "feat: add my feature"
   ```

4. Push the branch:  

   ```bash
   git push origin feature/my-feature
   ```

5. Open a Pull Request into `main`  

See `docs/CONTRIBUTING.md` (if present) for collaboration guidelines, commit conventions, and review expectations.

---

## 📌 Roadmap Ideas

- Typing indicators and read receipts  
- Private 1:1 conversations  
- File/image attachments  
- Admin / moderation tools (mute, kick, delete)  
- Search and pagination for message history  
- Modern SPA frontend (React / Vue / Svelte) on top of the same API  

---

## 📄 License

This project is released under the **MIT License**.  
You’re free to use, modify, and distribute it as long as the license terms are respected.

---

## 🙋‍♂️ Maintainer

**Author:** [@archithulsurkar](https://github.com/archithulsurkar)  

If you build something cool on top of Chatto, feel free to open an issue or PR and showcase it!
