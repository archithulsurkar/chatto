const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Message Schema
const messageSchema = new mongoose.Schema({
    username: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// Serve static files from 'public' folder
app.use(express.static('public'));

// Store connected users: { socketId: username }
const users = {};

// Handle socket connections
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle user joining with a username
    socket.on('user join', async (username) => {
        users[socket.id] = username;
        console.log(`${username} joined the chat`);

        // Send last 50 messages to the new user
        try {
            const messages = await Message.find()
                .sort({ timestamp: -1 })
                .limit(50)
                .lean();
            
            // Send in chronological order
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
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        const username = users[socket.id];
        if (username) {
            delete users[socket.id];
            console.log(`${username} left the chat`);

            // Notify everyone that user left
            io.emit('user left', {
                username: username,
                users: Object.values(users)
            });
        }
    });

    // Handle incoming chat messages
    socket.on('chat message', async (msg) => {
        const username = users[socket.id];
        if (username) {
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

            // Broadcast message with username and timestamp
            io.emit('chat message', {
                username: username,
                message: msg,
                timestamp: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
        }
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
