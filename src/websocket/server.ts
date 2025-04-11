import WebSocket from 'ws';
import http from 'http';
import jwt from 'jsonwebtoken';
import { WebSocketServer } from 'ws';

interface WebSocketClient extends WebSocket {
  isAlive: boolean;
  userId?: string;
  wallet?: string;
}

class WSServer {
  private wss: WebSocket.Server;
  private clients: Map<string, WebSocketClient> = new Map();
  private pingInterval: NodeJS.Timeout;

  constructor(server: http.Server) {
    this.wss = new WebSocketServer({ server });
    this.initialize();
    
    // Setup ping interval to keep connections alive
    this.pingInterval = setInterval(() => {
      this.wss.clients.forEach((ws: WebSocketClient) => {
        if (!ws.isAlive) {
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);
  }

  private initialize() {
    this.wss.on('connection', (ws: WebSocketClient) => {
      console.log('New client connected');
      ws.isAlive = true;

      // Handle pong messages
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', async (message: string) => {
        try {
          const { type, payload } = JSON.parse(message.toString());
          await this.handleMessage(ws, type, payload);
        } catch (error) {
          console.error('Error handling message:', error);
          this.sendError(ws, 'Invalid message format');
        }
      });

      ws.on('close', () => {
        console.log('Client disconnected');
        this.removeClient(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.removeClient(ws);
      });
    });
  }

  private async handleMessage(ws: WebSocketClient, type: string, payload: any) {
    switch (type) {
      case 'auth':
        await this.handleAuth(ws, payload);
        break;
      case 'getCustomTokens':
        await this.handleGetCustomTokens(ws, payload);
        break;
      case 'addToken':
        await this.handleAddToken(ws, payload);
        break;
      case 'updateUser':
        await this.handleUpdateUser(ws, payload);
        break;
      default:
        this.sendError(ws, 'Unknown message type');
    }
  }

  private async handleAuth(ws: WebSocketClient, payload: { token: string }) {
    try {
      const decoded = jwt.verify(
        payload.token, 
        process.env.JWT_SECRET as string
      ) as { userId: string; wallet: string };

      ws.userId = decoded.userId;
      ws.wallet = decoded.wallet;
      this.clients.set(decoded.userId, ws);

      this.send(ws, 'auth', { success: true });
    } catch (error) {
      console.error('Authentication failed:', error);
      this.sendError(ws, 'Invalid token');
    }
  }

  private async handleGetCustomTokens(ws: WebSocketClient, payload: { wallet: string }) {
    console.log('handleGetCustomTokens', payload);
    if (!this.isAuthenticated(ws)) {
      return this.sendError(ws, 'Not authenticated');
    }

    try {
      // Implement your token fetching logic here
      const tokens = []; // Get tokens from your database
      this.send(ws, 'customTokens', tokens);
    } catch (error) {
      console.error('Error fetching tokens:', error);
      this.sendError(ws, 'Failed to fetch tokens');
    }
  }

  private async handleAddToken(ws: WebSocketClient, payload: { token: any; wallet: string }) {
    if (!this.isAuthenticated(ws)) {
      return this.sendError(ws, 'Not authenticated');
    }

    try {
      // Implement your token adding logic here
      // Save token to database
      this.broadcast('tokenAdded', payload.token);
      this.send(ws, 'tokenAdded', { success: true });
    } catch (error) {
      console.error('Error adding token:', error);
      this.sendError(ws, 'Failed to add token');
    }
  }

  private async handleUpdateUser(ws: WebSocketClient, payload: any) {
    if (!this.isAuthenticated(ws)) {
      return this.sendError(ws, 'Not authenticated');
    }

    try {
      // Implement your user update logic here
      this.broadcast('userUpdate', {
        userId: ws.userId,
        ...payload
      });
      this.send(ws, 'userUpdate', { success: true });
    } catch (error) {
      console.error('Error updating user:', error);
      this.sendError(ws, 'Failed to update user');
    }
  }

  private isAuthenticated(ws: WebSocketClient): boolean {
    return !!ws.userId;
  }

  private send(ws: WebSocketClient, type: string, payload: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, payload }));
    }
  }

  private sendError(ws: WebSocketClient, error: string) {
    this.send(ws, 'error', { message: error });
  }

  private broadcast(type: string, payload: any) {
    this.wss.clients.forEach((client: WebSocket) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type, payload }));
      }
    });
  }

  private removeClient(ws: WebSocketClient) {
    if (ws.userId) {
      this.clients.delete(ws.userId);
    }
  }

  public close() {
    clearInterval(this.pingInterval);
    this.wss.close();
  }
}

export default WSServer;
