/**
 * Streamable HTTP トランスポートでの起動
 */

import { randomUUID } from 'node:crypto';
import express, { Request, Response, NextFunction } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { createServer } from '../server.js';
import { PORT } from '../config.js';

/**
 * セッション未検出時のエラーレスポンス
 */
function sendSessionNotFound(res: Response): void {
  res.status(404).json({
    jsonrpc: '2.0',
    error: { code: -32001, message: 'Session not found' },
    id: null,
  });
}

/**
 * 内部エラーレスポンス
 */
function sendInternalError(res: Response): void {
  res.status(500).json({
    jsonrpc: '2.0',
    error: { code: -32603, message: 'Internal error' },
    id: null,
  });
}

export async function startStreamableHttp(): Promise<void> {
  const app = express();
  app.use(express.json());

  // Express ミドルウェアエラーを JSON-RPC 形式で返す
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      return next(err);
    }
    const status =
      (err as { status?: number }).status ?? (err as { statusCode?: number }).statusCode ?? 400;
    const message =
      err instanceof SyntaxError && 'body' in err
        ? 'Parse error: Invalid JSON'
        : err instanceof Error
          ? err.message
          : 'Bad Request';
    res.status(status).json({
      jsonrpc: '2.0',
      error: { code: -32700, message },
      id: null,
    });
  });

  const transports = new Map<string, StreamableHTTPServerTransport>();

  app.post('/mcp', async (req: Request, res: Response) => {
    try {
      const sessionId = req.headers['mcp-session-id'];
      if (typeof sessionId === 'string' && transports.has(sessionId)) {
        await transports.get(sessionId)!.handleRequest(req, res, req.body);
      } else if (
        !sessionId &&
        (isInitializeRequest(req.body) ||
          (Array.isArray(req.body) && req.body.length > 0 && isInitializeRequest(req.body[0])))
      ) {
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
        });
        transport.onclose = () => {
          if (transport.sessionId) {
            transports.delete(transport.sessionId);
          }
        };
        const sessionServer = createServer();
        await sessionServer.connect(transport);
        await transport.handleRequest(req, res, req.body);
        if (transport.sessionId) {
          transports.set(transport.sessionId, transport);
        }
      } else if (typeof sessionId === 'string') {
        sendSessionNotFound(res);
      } else {
        res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32600,
            message: 'Bad Request: Missing session ID or invalid initialize request',
          },
          id: null,
        });
      }
    } catch (error) {
      console.error('Error handling POST /mcp:', error);
      if (!res.headersSent) {
        sendInternalError(res);
      }
    }
  });

  app.get('/mcp', async (req: Request, res: Response) => {
    try {
      const sessionId = req.headers['mcp-session-id'];
      if (typeof sessionId === 'string' && transports.has(sessionId)) {
        await transports.get(sessionId)!.handleRequest(req, res, req.body);
      } else {
        sendSessionNotFound(res);
      }
    } catch (error) {
      console.error('Error handling GET /mcp:', error);
      if (!res.headersSent) {
        sendInternalError(res);
      }
    }
  });

  app.delete('/mcp', async (req: Request, res: Response) => {
    try {
      const sessionId = req.headers['mcp-session-id'];
      if (typeof sessionId === 'string' && transports.has(sessionId)) {
        await transports.get(sessionId)!.handleRequest(req, res, req.body);
      } else {
        sendSessionNotFound(res);
      }
    } catch (error) {
      console.error('Error handling DELETE /mcp:', error);
      if (!res.headersSent) {
        sendInternalError(res);
      }
    }
  });

  // 未対応メソッドに 405 を返す
  app.all('/mcp', (_req: Request, res: Response) => {
    res.set('Allow', 'GET, POST, DELETE').status(405).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Method not allowed' },
      id: null,
    });
  });

  app.listen(PORT, '::', () => {
    console.error(`Redash MCP Server running on Streamable HTTP at http://localhost:${PORT}/mcp`);
  });
}
