import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import router from './routes/router.js';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();

// Create the HTTP server using the express app
const httpServer = createServer(app);

// Initialize Socket.io and attach it to the httpServer
const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174'
    ],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS', 'PUT'],
    credentials: true,
  }
});

// IMPORTANT: Share the 'io' instance with the rest of the app (controllers)
app.set('socketio', io);

// Configure CORS for standard HTTP requests
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174'
  ],
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());

// Routes
app.use('/api', router);

// Serve static files (Profile pictures, food images)
app.use('/uploads', express.static('uploads'));

// Socket.io connection logic
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  /**
   * Vendors join a specific 'room' based on their stall ID.
   * This ensures they only receive orders meant for their stall.
   */
  socket.on('join_stall', (stallId) => {
    socket.join(`stall_${stallId}`);
    console.log(`Vendor joined room: stall_${stallId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Use the PORT from .env or fallback to 3000
const PORT = process.env.PORT || 3000;

// Listen using httpServer (NOT app.listen) to support WebSockets
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Ay lasee the Server is running on port ${PORT} with WebSockets enabled`);
});