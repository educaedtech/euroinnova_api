import {inject} from '@loopback/core';
import {Server} from 'http';
import {WebSocketServer} from 'ws';
import {LoggerService} from '../services/logger.service';

export class LogWebSocketServer {
  private wss: WebSocketServer;

  constructor(
    @inject('services.LoggerService')
    private loggerService: LoggerService,
    private httpServer: Server,
  ) {
    console.log(`WebSocket using LoggerService instance #${loggerService.instanceId}`);
    console.log(`Initial subscribers: ${loggerService.getSubscriberCount()}`);
    this.initializeWebSocket();
  }

  private initializeWebSocket() {
    this.wss = new WebSocketServer({
      server: this.httpServer,
      path: '/ws-logs' // Ruta específica para WebSocket
    });

    this.wss.on('connection', (ws) => {
      console.log('👤 Nuevo cliente conectado'); // Verifica en consola del servidor

      // Mensaje de prueba inmediato
      ws.send(JSON.stringify({type: 'log', data: '[Servidor] Conexión establecida'}));

      const subscription = this.loggerService.logStream.subscribe(message => {
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({type: 'log', data: message}));
        }
      });

      ws.on('close', () => {
        console.log('🥺 Cliente desconectado'); // Depuración
        subscription.unsubscribe();
      });
    });

    this.wss.on('error', (error) => {
      this.loggerService.error(`⛔ WebSocket error: ${error.message}`);
    });
  }
}
