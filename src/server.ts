import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import tokenRoutes from './routes/token';
// import WebSocketServer from './websocket/server';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
// const WS_PORT = process.env.WS_PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/token', tokenRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI as string)
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Start WebSocket server
    // const wss = new WebSocketServer(Number(WS_PORT));
    // console.log(`WebSocket server running on port ${WS_PORT}`);
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  }); 