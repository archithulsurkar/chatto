# Chatto – Data Models

Chatto uses MongoDB with Mongoose as its Object Data Modeling (ODM) layer. This document describes
the core data models used by the application and provides guidance on how to extend them.

---

## 1. User

Represents an authenticated user of the system.

**Fields (conceptual)**

| Field      | Type      | Description                            |
|-----------|-----------|----------------------------------------|
| `_id`     | ObjectId  | Unique identifier (MongoDB)           |
| `username`| String    | Login and display name (unique)       |
| `password`| String    | Bcrypt‑hashed password                |
| `createdAt`| Date     | When the user account was created     |

**Example Mongoose Schema**

```js
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const User = mongoose.model("User", userSchema);
```

**Notes**

- Passwords are stored as bcrypt hashes; the plaintext password must never be stored.
- You can safely add profile fields later (e.g., avatar URL, bio, role, etc.).

---

## 2. Room

Represents a chat room or channel in which multiple users can exchange messages.

**Fields (conceptual)**

| Field       | Type      | Description                                 |
|------------|-----------|---------------------------------------------|
| `_id`      | ObjectId  | Unique identifier                           |
| `name`     | String    | Room name shown in the UI                   |
| `createdBy`| String    | Username or user ID of the creator          |
| `createdAt`| Date      | Creation timestamp                           |

**Example Mongoose Schema**

```js
const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    createdBy: {
      type: String,
      required: false
    }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const Room = mongoose.model("Room", roomSchema);
```

**Notes**

- If you want stricter relationships, change `createdBy` to reference the `User` model by ObjectId.
- For private rooms or permissions, introduce access control fields (e.g. member lists, visibility).

---

## 3. Message

Represents a single chat message in a room.

**Fields (conceptual)**

| Field      | Type       | Description                                  |
|-----------|------------|----------------------------------------------|
| `_id`     | ObjectId   | Unique identifier                            |
| `room`    | ObjectId   | Reference to the Room                        |
| `user`    | String     | Username or user ID of the sender            |
| `text`    | String     | Message content                              |
| `timestamp`| Date      | When the message was sent                    |

**Example Mongoose Schema**

```js
const messageSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true
    },
    user: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: false }
);

messageSchema.index({ room: 1, timestamp: 1 });

const Message = mongoose.model("Message", messageSchema);
```

**Notes**

- The compound index on `(room, timestamp)` enables efficient history queries.
- If you want editing or reactions, add extra fields (e.g. `editedAt`, `reactions`).

---

## 4. Extending the Data Model

Here are a few common extension patterns:

- **Direct Messages (DMs)**  
  - Create a `DirectMessage` model with `from`, `to`, `text`, `timestamp`.
  - Or reuse `Message` with a room per DM conversation.

- **User Roles / Permissions**  
  - Add `role` to `User` (e.g. `"user"`, `"moderator"`, `"admin"`).
  - Enforce role checks in route handlers and Socket.io events.

- **Soft Deletion**  
  - Add a `deleted` Boolean flag to `Message`, and filter it out in queries.

- **Attachments**  
  - Add fields like `attachments: [{ url, type, size }]`.
  - Store files externally (S3, etc.) and keep only metadata in MongoDB.

Whenever you change the data model, verify:

- Backwards compatibility with existing documents.
- How the change affects queries and indexes.
- That any new fields are validated and constrained appropriately.
