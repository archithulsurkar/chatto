# Chatto 💬

A real-time chat application with rooms, authentication, and persistent message history.

**[Live Demo](https://chatto-nirb.onrender.com)**

![Chatto Screenshot](screenshot.png)

## Features

- **Real-time messaging** — instant message delivery using WebSockets
- **Chat rooms** — create and join multiple rooms, each with separate message history
- **User authentication** — secure registration and login with JWT tokens
- **Password security** — bcrypt hashing with salt rounds
- **Message persistence** — all messages stored in MongoDB
- **Online presence** — see who's currently in each room
- **Responsive design** — works on desktop and mobile

## Tech Stack

- **Backend:** Node.js, Express, Socket.io
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT, bcrypt
- **Frontend:** Vanilla JavaScript, CSS
- **Deployment:** Render, MongoDB Atlas

## Architecture

```
┌─────────────┐     WebSocket      ┌─────────────┐
│   Client    │◄──────────────────►│   Server    │
│  (Browser)  │                    │  (Node.js)  │
└─────────────┘                    └──────┬──────┘
                                          │
                                          ▼
                                   ┌─────────────┐
                                   │  MongoDB    │
                                   │   Atlas     │
                                   └─────────────┘
```

**Key Design Decisions:**

- **Socket.io rooms** for efficient message broadcasting — messages only sent to users in that room
- **JWT tokens** for stateless authentication — server doesn't store sessions
- **Mongoose schemas** with references — messages linked to rooms via ObjectId
- **Environment variables** for secrets — credentials never committed to git

## Run Locally

1. Clone the repo
   ```bash
   git clone https://github.com/archithulsurkar/chatto.git
   cd chatto
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env` file
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
   PORT=3000
   ```

4. Start the server
   ```bash
   node server.js
   ```

5. Open `http://localhost:3000`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Create new user account |
| POST | `/api/login` | Authenticate user, returns JWT |
| GET | `/api/verify` | Verify JWT token |
| GET | `/api/rooms` | Get all chat rooms |

## Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join room` | Client → Server | Join a chat room |
| `chat message` | Client → Server | Send a message |
| `create room` | Client → Server | Create new room |
| `message history` | Server → Client | Load room's message history |
| `user joined room` | Server → Client | User entered the room |
| `user left room` | Server → Client | User left the room |

## License

MIT
