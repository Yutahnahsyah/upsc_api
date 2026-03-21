import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import router from './routes/router.js';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174'
    ],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  }
});

app.set('socketio', io);

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
app.use('/api', router);
app.use('/uploads', express.static('uploads'));

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_stall', (stallId) => {
    socket.join(`stall_${stallId}`);
    console.log(`Socket ${socket.id} joined room: stall_${stallId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT;

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT} with WebSockets enabled`);
});