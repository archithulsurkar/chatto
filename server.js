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

// Message Schema
const messageSchema = new mongoose.Schema({
    username: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// Middleware
app.use(express.static('public'));
app.use(express.json());

// Auth Routes
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validation
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        if (username.length < 3 || username.length > 20) {
            return res.status(400).json({ error: 'Username must be 3-20 characters' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if user exists
        const existingUser = await User.findOne({ username: username.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already taken' });
        }

        // Hash password and create user
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            username: username.toLowerCase(),
            password: hashedPassword
        });

        // Generate token
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

        // Find user
        const user = await User.findOne({ username: username.toLowerCase() });
        if (!user) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        // Generate token
        const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, username: user.username });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Verify token endpoint
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

// Store connected users: { socketId: username }
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

// Handle socket connections
io.on('connection', async (socket) => {
    const username = socket.username;
    users[socket.id] = username;
    console.log(`${username} connected`);

    // Send last 50 messages to the new user
    try {
        const messages = await Message.find()
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

    // Notify everyone that a new user joined
    io.emit('user joined', {
        username: username,
        users: Object.values(users)
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        delete users[socket.id];
        console.log(`${username} disconnected`);

        io.emit('user left', {
            username: username,
            users: Object.values(users)
        });
    });

    // Handle incoming chat messages
    socket.on('chat message', async (msg) => {
        const timestamp = new Date();

        // Save message to database
        try {
            await Message.create({
                username: username,
                message: msg,
                timestamp: timestamp
            });
        } catch (err) {
            console.error('Error saving message:', err);
        }

        // Broadcast message
        io.emit('chat message', {
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
