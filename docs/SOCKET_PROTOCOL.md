# Chatto – Socket.io Protocol

This document defines the real‑time messaging protocol used between the Chatto frontend and
backend via Socket.io. It is intended for frontend developers, backend developers, and anyone
writing alternative clients (e.g. a mobile app or bot).

All payloads are JSON objects unless noted otherwise.

---

## 1. Connection

The client typically connects like this (simplified):

```js
const socket = io({
  // Optionally attach auth
  auth: { token: userJwt }
});
```

The server side listens for new connections:

```js
io.on("connection", (socket) => {
  // register event handlers here
});
```

The server may use `socket.handshake.auth` or a custom event to validate the JWT and associate
the socket with a user.

---

## 2. Client → Server Events

### 2.1 `join room`

Request to join a specific chat room.

**Payload**

```json
{
  "roomId": "64a1a0c1e4...",
  "user": "alice"
}
```

**Server Behaviour**

- Calls `socket.join(roomId)` to subscribe this connection to the room.
- Loads recent messages from the database.
- Emits `message history` back to the requesting socket.
- Broadcasts `user joined room` to other sockets in the room.

---

### 2.2 `chat message`

Sends a new message to a specific room.

**Payload**

```json
{
  "roomId": "64a1a0c1e4...",
  "user": "alice",
  "text": "Hello, world!"
}
```

**Server Behaviour**

- Validates the payload (room exists, text length, user present).
- Persists the message in MongoDB.
- Emits `chat message` to all sockets currently joined to that room.

---

### 2.3 `create room` (if enabled)

Creates a new room.

**Payload**

```json
{
  "name": "New Room Name"
}
```

**Server Behaviour**

- Creates a new Room document in MongoDB.
- Emits `room created` to connected clients (or broadcasts updated room list).

---

### 2.4 `typing` (optional UX event)

Indicates that a user is currently typing in a room.

**Payload**

```json
{
  "roomId": "64a1a0c1e4...",
  "user": "alice"
}
```

**Server Behaviour**

- Should broadcast a `typing` or `user typing` event to other clients in the room.
- This event is transient and typically not persisted.

---

## 3. Server → Client Events

### 3.1 `message history`

Sent after a successful `join room` request.

**Payload**

```json
[
  {
    "_id": "64a1a3e9...",
    "room": "64a1a0c1...",
    "user": "bob",
    "text": "Welcome!",
    "timestamp": "2025-01-02T11:00:00.000Z"
  },
  {
    "_id": "64a1a3ea...",
    "room": "64a1a0c1...",
    "user": "alice",
    "text": "Hi everyone 👋",
    "timestamp": "2025-01-02T11:01:00.000Z"
  }
]
```

The frontend uses this to populate the initial messages for the room.

---

### 3.2 `chat message`

Emitted whenever a new message is created in a room.

**Payload**

```json
{
  "_id": "64a1a3eb...",
  "room": "64a1a0c1...",
  "user": "alice",
  "text": "Hello, world!",
  "timestamp": "2025-01-02T11:05:00.000Z"
}
```

All clients in the room append this message to their UI.

---

### 3.3 `user joined room`

Notifies room members that a new user has joined.

**Payload**

```json
{
  "roomId": "64a1a0c1...",
  "user": "alice"
}
```

Used primarily for presence indicators or system messages (e.g. “alice joined the room”).

---

### 3.4 `user left room`

Notifies room members that a user has left or disconnected.

**Payload**

```json
{
  "roomId": "64a1a0c1...",
  "user": "alice"
}
```

Emitted when:
- The user actively leaves the room (if the client emits a dedicated event).
- Or the socket disconnects and the server infers the rooms it needs to update.

---

### 3.5 `room created` (if used)

Notifies clients that a new room has been created.

**Payload**

```json
{
  "_id": "64a1a0d3...",
  "name": "Sports",
  "createdAt": "2025-01-02T10:15:00.000Z"
}
```

---

## 4. Error Handling

The protocol can be extended with explicit error events. Two patterns are common:

1. **Per‑event error responses**

   ```js
   socket.emit("chat message", payload, (ack) => {
     if (!ack.success) {
       console.error("Failed to send message:", ack.error);
     }
   });
   ```

2. **Global `error` event**

   ```js
   socket.on("error", (err) => {
     console.error("Socket error:", err);
   });
   ```

The current codebase may use a simpler pattern (e.g., logging and emitting system messages).
When adding new events, consider adding proper acknowledgements or dedicated error events.

---

## 5. Backwards Compatibility

If you introduce breaking changes to event names or payload shapes:

- Prefer adding new events over changing existing ones.
- If changing an event is unavoidable, version it (e.g. `chat message v2`).
- Coordinate client and server deployments to avoid runtime mismatches.
