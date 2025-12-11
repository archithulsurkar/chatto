const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Room Schema
const roomSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    creator: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Room = mongoose.model('Room', roomSchema);

// Message Schema
const messageSchema = new mongoose.Schema({
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    username: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// Middleware
app.use(express.static('public'));
app.use(express.json());

// Create default "General" room if it doesn't exist
async function createDefaultRoom() {
    try {
        const generalRoom = await Room.findOne({ name: 'General' });
        if (!generalRoom) {
            await Room.create({
                name: 'General',
                description: 'General discussion',
                creator: 'system'
            });
            console.log('Created default General room');
        }
    } catch (err) {
        console.error('Error creating default room:', err);
    }
}
createDefaultRoom();

// Auth Routes
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        if (username.length < 3 || username.length > 20) {
            return res.status(400).json({ error: 'Username must be 3-20 characters' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const existingUser = await User.findOne({ username: username.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already taken' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            username: username.toLowerCase(),
            password: hashedPassword
        });

        const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ token, username: user.username });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username: username.toLowerCase() });
        if (!user) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, username: user.username });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/verify', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ username: decoded.username });
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

// Room Routes
app.get('/api/rooms', async (req, res) => {
    try {
        const rooms = await Room.find().sort({ createdAt: 1 });
        res.json(rooms);
    } catch (err) {
        console.error('Error fetching rooms:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Store connected users per room: { odosUsSocketId: { username, currentRoom } }
const users = {};

// Socket.io with authentication
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication required'));
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        socket.username = decoded.username;
        next();
    } catch (err) {
        next(new Error('Invalid token'));
    }
});

// Get users in a specific room
function getUsersInRoom(roomId) {
    return Object.values(users)
        .filter(u => u.currentRoom === roomId)
        .map(u => u.username);
}

// Handle socket connections
io.on('connection', async (socket) => {
    const username = socket.username;
    users[socket.id] = { username, currentRoom: null };
    console.log(`${username} connected`);

    // Join a room
    socket.on('join room', async (roomId) => {
        const previousRoom = users[socket.id].currentRoom;
        
        // Leave previous room if any
        if (previousRoom) {
            socket.leave(previousRoom);
            io.to(previousRoom).emit('user left room', {
                username,
                users: getUsersInRoom(previousRoom)
            });
        }

        // Join new room
        socket.join(roomId);
        users[socket.id].currentRoom = roomId;

        // Send message history for this room
        try {
            const messages = await Message.find({ roomId })
                .sort({ timestamp: -1 })
                .limit(50)
                .lean();

            socket.emit('message history', messages.reverse().map(msg => ({
                username: msg.username,
                message: msg.message,
                timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            })));
        } catch (err) {
            console.error('Error fetching messages:', err);
        }

        // Notify room that user joined
        io.to(roomId).emit('user joined room', {
            username,
            users: getUsersInRoom(roomId)
        });
    });

    // Create a new room
    socket.on('create room', async (data, callback) => {
        try {
            const { name, description } = data;
            
            if (!name || name.trim().length === 0) {
                return callback({ error: 'Room name is required' });
            }

            const existingRoom = await Room.findOne({ name: name.trim() });
            if (existingRoom) {
                return callback({ error: 'Room name already exists' });
            }

            const room = await Room.create({
                name: name.trim(),
                description: description || '',
                creator: username
            });

            // Notify all connected clients about new room
            io.emit('room created', room);
            callback({ success: true, room });
        } catch (err) {
            console.error('Error creating room:', err);
            callback({ error: 'Failed to create room' });
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        const currentRoom = users[socket.id]?.currentRoom;
        
        if (currentRoom) {
            io.to(currentRoom).emit('user left room', {
                username,
                users: getUsersInRoom(currentRoom).filter(u => u !== username)
            });
        }

        delete users[socket.id];
        console.log(`${username} disconnected`);
    });

    // Handle incoming chat messages
    socket.on('chat message', async (msg) => {
        const currentRoom = users[socket.id]?.currentRoom;
        
        if (!currentRoom) {
            return;
        }

        const timestamp = new Date();

        // Save message to database
        try {
            await Message.create({
                roomId: currentRoom,
                username: username,
                message: msg,
                timestamp: timestamp
            });
        } catch (err) {
            console.error('Error saving message:', err);
        }

        // Broadcast message to room only
        io.to(currentRoom).emit('chat message', {
            username: username,
            message: msg,
            timestamp: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
