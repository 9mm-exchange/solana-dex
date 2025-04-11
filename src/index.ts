import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from 'path';
import fs from 'fs';

import { PORT, connectMongoDB } from "./config";
import http from "http";
import { listenerForEvents } from "./program/web3";
import poolRouter from "./routes/poolRouter";
import tokenListRouter from "./routes/tokenListRouter";
import userRouter from "./routes/user";
import { socketio } from "./sockets";
import { runFeeDistributer } from "./utils/util";
// Load environment variables from .env file
dotenv.config();

// Connect to the MongoDB database
connectMongoDB();

// Create an instance of the Express application
const app = express();

// Set up Cross-Origin Resource Sharing (CORS) options
app.use(cors());

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, './public')));

// Parse incoming JSON requests using body-parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

const server = http.createServer(app);

// Define a route to check if the backend server is running
app.get("/", async (req: any, res: any) => {
  res.send("Backend Server is Running now!");
});

app.use('/api/pool/', poolRouter);
app.use('/api/tokenList/', tokenListRouter);
app.use('/api/user/', userRouter);

// Start the Express server to listen on the specified port
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  listenerForEvents();
});

socketio(server);

runFeeDistributer();