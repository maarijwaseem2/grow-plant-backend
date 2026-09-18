import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';

@WebSocketGateway({ cors: { origin: '*' } })
export class RealtimeGateway implements OnGatewayInit {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(RealtimeGateway.name);

  /**
   * When REDIS_HOST is set, attach the Socket.IO Redis adapter so events broadcast
   * across ALL backend instances (horizontal scaling behind a load balancer). With
   * no Redis it stays single-instance — safe for local dev.
   */
  afterInit(server: Server) {
    const host = process.env.REDIS_HOST;
    if (!host) {
      this.logger.log(
        'Realtime running single-instance (set REDIS_HOST to scale across instances).',
      );
      return;
    }
    try {
      const port = parseInt(process.env.REDIS_PORT || '6379', 10);
      const pubClient = new Redis({ host, port, maxRetriesPerRequest: null });
      const subClient = pubClient.duplicate();
      server.adapter(createAdapter(pubClient, subClient));
      this.logger.log(
        `Realtime scaled via Redis adapter (${host}:${port}) — horizontal scaling ready.`,
      );
    } catch (e: any) {
      this.logger.warn(`Redis adapter not attached: ${e?.message || e}`);
    }
  }

  // A client joins its own private room after connecting: socket.emit('join', userId)
  @SubscribeMessage('join')
  handleJoin(@MessageBody() userId: string, @ConnectedSocket() client: Socket) {
    if (userId) client.join(`user:${userId}`);
    return { joined: !!userId };
  }

  /** Push an event to one user (used for live notifications / task updates). */
  notifyUser(userId: string, event: string, payload: any) {
    if (!userId || !this.server) return;
    this.server.to(`user:${userId}`).emit(event, payload);
  }
}
