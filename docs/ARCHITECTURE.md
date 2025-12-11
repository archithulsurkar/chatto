# Chatto – System Architecture

**Repository:** https://github.com/archithulsurkar/chatto  

This document describes the architecture of the Chatto real‑time chat application so that new contributors
can quickly understand how the system is put together, how data flows through it, and where to extend it.

---

## 1. Goals & Non‑Goals

**Goals**

- Provide real‑time, room‑based chat with message history.
- Keep the codebase simple and approachable (vanilla JS frontend, Node.js backend).
- Use a standard, well‑understood stack (Express, Socket.io, MongoDB).
- Make it easy to add new features such as private messages, moderation, or notifications.

**Non‑Goals (current version)**

- End‑to‑end encryption.
- Horizontal scaling across multiple server instances.
- Guaranteed delivery or message ordering across distributed systems.

---

## 2. High‑Level Architecture

```text
┌────────────────────────────────────────────────────────┐
│                        Browser                         │
│  - index.html / chat.html                             │
│  - login.js / chat.js                                 │
└───────────────┬───────────────────────────────────────┘
                │  HTTP (REST) + WebSocket (Socket.io)
┌───────────────▼───────────────────────────────────────┐
│                 Node.js / Express Server              │
│  - REST API (auth, rooms)                             │
│  - Static file hosting (public/)                      │
│  - Socket.io gateway (join room, chat message, etc.)  │
└───────────────┬───────────────────────────────────────┘
                │  Mongoose (ODM)
┌───────────────▼───────────────────────────────────────┐
│                     MongoDB Atlas                     │
│  - Users                                               │
│  - Rooms                                               │
│  - Messages                                            │
└────────────────────────────────────────────────────────┘
```

The HTTP server and the Socket.io server share the same underlying Node.js process and port.

---

## 3. Component Responsibilities

### 3.1 Frontend (public/)

- **index.html / login UI**
  - Registration and login.
  - Collects username/password and calls REST APIs.
  - Stores the JWT returned by the backend.

- **chat.html / chat UI**
  - Displays room list and active room.
  - Renders message history and live messages.
  - Sends chat messages and “join room” requests over Socket.io.

- **login.js**
  - Handles form submissions for register/login.
  - Calls `/api/register` and `/api/login`.
  - On successful login, stores JWT and redirects to `chat.html`.

- **chat.js**
  - Creates the Socket.io client connection.
  - Emits `join room`, `chat message`, and other events.
  - Listens for `message history`, `chat message`, and presence events.
  - Updates the DOM accordingly.

### 3.2 Backend (server.js)

- Starts the Express app and HTTP server.
- Serves static files from `public/`.
- Connects to MongoDB using Mongoose.
- Defines REST API routes:
  - `/api/register`
  - `/api/login`
  - `/api/verify`
  - `/api/rooms`
- Bootstraps Socket.io:
  - Handles connection lifecycle.
  - Listens for room and message related events.
  - Persists messages and broadcasts them to clients.

### 3.3 Database (MongoDB Atlas)

- **User** documents store credentials and metadata.
- **Room** documents represent chat rooms/channels.
- **Message** documents store individual messages, linked to rooms.

---

## 4. Key Runtime Flows

### 4.1 Authentication Flow

1. User enters username and password in the login form.
2. Frontend sends POST `/api/login` with JSON credentials.
3. Server:
   - Looks up the user by username.
   - Uses bcrypt to compare the hash of the submitted password.
   - If valid, signs a JWT containing user details.
4. Frontend stores the JWT (e.g. in `localStorage`) and redirects to `chat.html`.
5. Subsequent API requests include the JWT in the `Authorization` header as needed.

Registration uses a similar flow via `/api/register`, except it creates a new user and stores the hashed password.

### 4.2 Initial Page Load

1. Browser requests `/` → served `index.html`.
2. On navigating to `/chat`, `chat.html` is served with JS and CSS.
3. `chat.js`:
   - Fetches room list from `/api/rooms`.
   - Establishes a Socket.io connection to the server.
   - Optionally sends a token so the server can associate the socket with a user.

### 4.3 Join Room and Load History

1. User selects a room in the UI.
2. `chat.js` emits:

   ```js
   socket.emit("join room", { roomId, user });
   ```

3. Backend:
   - Calls `socket.join(roomId)` so the socket joins the Socket.io room.
   - Queries MongoDB for the last N messages in that room.
   - Emits `message history` to the joining client.
   - Broadcasts `user joined room` to other clients in that room.

### 4.4 Sending and Receiving Messages

1. User types a message and submits the form.
2. Frontend emits:

   ```js
   socket.emit("chat message", { roomId, text, user });
   ```

3. Backend:
   - Validates the payload (room, text, user).
   - Persists the message to MongoDB.
   - Emits `chat message` to all sockets in the corresponding room.

4. All clients in that room receive `chat message` and append it to their chat window.

---

## 5. Technology Choices

- **Node.js + Express**
  - Well‑known, battle‑tested HTTP server and routing layer.
- **Socket.io**
  - Provides a WebSocket‑like API with fallbacks and room abstraction.
- **MongoDB + Mongoose**
  - Document database that works naturally with chat messages.
  - Mongoose provides schemas, validation, and query helpers.
- **JWT + bcrypt**
  - JWT gives stateless authentication.
  - Bcrypt securely hashes passwords before storage.

---

## 6. Error Handling & Logging

- REST endpoints return structured JSON error responses (e.g. `{ "error": "Invalid credentials" }`).
- Server logs are printed to stdout/stderr and surfaced through the Render dashboard.
- Socket.io errors should be handled by:
  - Validating payloads before performing DB writes.
  - Catching and logging Mongoose errors.
  - Emitting an error event or error message back to the client if needed.

A future enhancement is to add a centralized logger, log levels, and request correlation IDs.

---

## 7. Extensibility Points

Common extension scenarios and where to implement them:

- **New REST endpoint**
  - Add a new route handler in `server.js` (or a routes module if you refactor).
- **New Socket event**
  - Extend the `io.on("connection")` block to listen for a new event name.
  - Update `chat.js` to emit/listen for the same event.
- **New data model (e.g., DirectMessage, Profile)**
  - Create a new Mongoose schema/module and use it from the relevant handlers.
- **Permissions / roles**
  - Extend the JWT payload to include role information.
  - Add middleware and server‑side checks based on the role.
- **Move to SPA framework**
  - Replace the HTML/vanilla JS frontend with React/Vue/etc., keeping the same HTTP and Socket APIs.

This architecture is intentionally simple so that changes can be made with minimal friction and without deeply nested abstractions.
