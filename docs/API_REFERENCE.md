# Chatto – HTTP API Reference

This document describes the public HTTP API exposed by the Chatto backend. All endpoints
return JSON responses and are designed to be consumed by the first‑party web client, but
they can also be used by other clients (mobile apps, CLI tools, bots, etc.).

Unless otherwise stated, request and response bodies are JSON and the server uses standard
HTTP status codes to indicate success or failure.

Base URL examples:

- Local development: `http://localhost:3000`
- Production (Render): `https://chatto-nirb.onrender.com`

---

## 1. Authentication

### 1.1 Register

**Endpoint**

- `POST /api/register`

**Description**

Creates a new user account with the provided username and password.

**Request Body**

```json
{
  "username": "alice",
  "password": "myStrongPassword"
}
```

**Response – Success (201 Created)**

```json
{
  "message": "User created successfully"
}
```

**Response – Error (409 Conflict)**

```json
{
  "error": "Username already taken"
}
```

Other possible error statuses:
- `400 Bad Request` – invalid payload.
- `500 Internal Server Error` – unexpected server failure.

---

### 1.2 Login

**Endpoint**

- `POST /api/login`

**Description**

Authenticates a user and returns a signed JWT token used to authorize subsequent requests.

**Request Body**

```json
{
  "username": "alice",
  "password": "myStrongPassword"
}
```

**Response – Success (200 OK)**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "username": "alice"
}
```

The exact JWT format depends on the secret and payload configuration.

**Response – Error (401 Unauthorized)**

```json
{
  "error": "Invalid username or password"
}
```

Other possible error statuses:
- `400 Bad Request` – missing username or password.
- `500 Internal Server Error` – unexpected server failure.

---

### 1.3 Verify Token

**Endpoint**

- `GET /api/verify`

**Description**

Validates a JWT and returns information about the authenticated user. Typically used on the
client side to restore sessions after a refresh.

**Headers**

- `Authorization: Bearer <token>`

**Response – Success (200 OK)**

```json
{
  "valid": true,
  "user": {
    "username": "alice",
    "id": "643f0d..."
  }
}
```

**Response – Error (401 Unauthorized)**

```json
{
  "valid": false,
  "error": "Invalid or expired token"
}
```

---

## 2. Rooms

### 2.1 List Rooms

**Endpoint**

- `GET /api/rooms`

**Description**

Returns the list of existing chat rooms. This is typically called by `chat.js` when the chat
page loads.

**Headers**

- (Optional, depending on server implementation) `Authorization: Bearer <token>`

**Response – Success (200 OK)**

```json
[
  {
    "_id": "64a1a0c1...",
    "name": "General",
    "createdAt": "2025-01-01T12:00:00.000Z"
  },
  {
    "_id": "64a1a0c2...",
    "name": "Random",
    "createdAt": "2025-01-01T12:30:00.000Z"
  }
]
```

**Response – Error (500 Internal Server Error)**

```json
{
  "error": "Failed to fetch rooms"
}
```

---

### 2.2 Create Room (if enabled)

If a room creation endpoint is added (it may currently be handled entirely via Socket.io):

**Endpoint**

- `POST /api/rooms`

**Request Body**

```json
{
  "name": "Sports"
}
```

**Response – Success (201 Created)**

```json
{
  "_id": "64a1a0d3...",
  "name": "Sports",
  "createdAt": "2025-01-02T10:15:00.000Z"
}
```

---

## 3. Message History (optional HTTP endpoint)

Message history is delivered primarily via Socket.io (`message history` event), but a REST endpoint
could look like this if you choose to expose one:

**Endpoint**

- `GET /api/rooms/:roomId/messages`

**Response – Success (200 OK)**

```json
[
  {
    "_id": "64a1a3e9...",
    "room": "64a1a0c1...",
    "user": "alice",
    "text": "Hello world!",
    "timestamp": "2025-01-02T11:00:00.000Z"
  }
]
```

This endpoint is not required by the current frontend, but is a natural addition if you want
API‑only access or admin tooling.

---

## 4. Error Handling Conventions

- All error responses use a top‑level `error` field with a human‑readable message.
- Validation errors may include additional fields (e.g., `details`) if needed.
- Clients should always check HTTP status codes before assuming a response is successful.

Example generic error:

```json
{
  "error": "Something went wrong, please try again later"
}
```

---

## 5. Versioning

Currently, the API is unversioned and simple. If you expect breaking changes, consider:

- Prefixing endpoints with `/v1` (e.g. `/v1/api/login`).
- Providing a deprecation window when making changes that break existing clients.
