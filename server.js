const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

// Serve static files from 'public' folder
app.use(express.static('public'));

// Handle socket connections
io.on('connection', (socket) => {
    console.log('A user connected');
    
    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
    
    // Handle incoming chat messages
    socket.on('chat message', (msg) => {
        // Broadcast the message to all connected clients
        io.emit('chat message', msg);
    });
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
