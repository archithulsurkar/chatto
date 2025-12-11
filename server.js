const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

// Serve static files from 'public' folder
app.use(express.static('public'));

// Store connected users: { socketId: username }
const users = {};

// Handle socket connections
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle user joining with a username
    socket.on('user join', (username) => {
        users[socket.id] = username;
        console.log(`${username} joined the chat`);
        
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
    socket.on('chat message', (msg) => {
        const username = users[socket.id];
        if (username) {
            // Broadcast message with username and timestamp
            io.emit('chat message', {
                username: username,
                message: msg,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
        }
    });
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
