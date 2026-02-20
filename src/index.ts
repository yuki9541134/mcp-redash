#!/usr/bin/env node

import { randomUUID } from 'node:crypto';
import express, { Request, Response, NextFunction } from 'express';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  isInitializeRequest,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import fetch from 'node-fetch';
import * as dotenv from "dotenv";

// Redash APIのオペレーションをインポート
import * as queries from './operations/queries.js';
import * as datasources from './operations/datasources.js';

// エラータイプをインポート
import {
  RedashError,
  isRedashError,
} from './common/errors.js';

dotenv.config();

// バージョン情報
const VERSION = "1.0.0";

// グローバルスコープにfetchが存在しない場合は追加
if (!globalThis.fetch) {
  globalThis.fetch = fetch as unknown as typeof global.fetch;
}

// Redashエラーの整形関数
function formatRedashError(error: RedashError): string {
  let message = `Redash API Error: ${error.message}`;

  if (error.statusCode) {
    message += ` (Status: ${error.statusCode})`;
  }

  if (error.responseBody) {
    try {
      const parsed = JSON.parse(error.responseBody);
      if (parsed.message) {
        message += `\nDetails: ${parsed.message}`;
      }
    } catch (e) {
      // responseBodyがJSONでない場合はそのまま追加
      message += `\nDetails: ${error.responseBody}`;
    }
  }

  return message;
}

// サーバーインスタンスを作成するファクトリ関数
function createServer(): Server {
  const server = new Server(
    {
      name: "redash-mcp-server",
      version: VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // ListToolsリクエスト処理
  server.setRequestHandler(ListToolsRequestSchema, async (_request) => {
    return {
      tools: [
        {
          name: "execute_query_and_wait",
          description: "Execute a SQL query and wait for the results",
          inputSchema: zodToJsonSchema(queries.ExecuteQuerySchema),
        },
        {
          name: "list_data_sources",
          description: "List all available data sources",
          inputSchema: zodToJsonSchema(z.object({})),
        },
        {
          name: "get_data_source",
          description: "Get details about a specific data source",
          inputSchema: zodToJsonSchema(datasources.DataSourceSchema),
        },
      ],
    };
  });

  // CallToolリクエスト処理
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      switch (request.params.name) {
        case "execute_query_and_wait": {
          const args = queries.ExecuteQuerySchema.parse(request.params.arguments);
          const result = await queries.executeQueryAndWait(args);
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          };
        }
        case "list_data_sources": {
          const sources = await datasources.listDataSources();
          return {
            content: [{ type: "text", text: JSON.stringify(sources, null, 2) }],
          };
        }
        case "get_data_source": {
          const args = datasources.DataSourceSchema.parse(request.params.arguments);
          const source = await datasources.getDataSource(args.data_source_id);
          return {
            content: [{ type: "text", text: JSON.stringify(source, null, 2) }],
          };
        }
        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid input: ${JSON.stringify(error.errors)}`);
      }

      if (isRedashError(error)) {
        throw new Error(formatRedashError(error as RedashError));
      }

      throw error;
    }
  });

  return server;
}

// サーバー実行関数（stdioモード）
async function runServer() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Redash MCP Server running on stdio");
}

// サーバーの実行
if (process.argv.includes('--streamable-http')) {
  // Streamable HTTPモードで起動
  const app = express();
  app.use(express.json());

  // Express ミドルウェアエラーを JSON-RPC 形式で返す
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      return next(err);
    }
    const status = (err as { status?: number }).status ?? (err as { statusCode?: number }).statusCode ?? 400;
    const message = err instanceof SyntaxError && 'body' in err
      ? 'Parse error: Invalid JSON'
      : err instanceof Error ? err.message : 'Bad Request';
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
      } else if (!sessionId && (
        isInitializeRequest(req.body) ||
        (Array.isArray(req.body) && req.body.length > 0 && isInitializeRequest(req.body[0]))
      )) {
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
        res.status(404).json({
          jsonrpc: '2.0',
          error: { code: -32001, message: 'Session not found' },
          id: null,
        });
      } else {
        res.status(400).json({
          jsonrpc: '2.0',
          error: { code: -32600, message: 'Bad Request: Missing session ID or invalid initialize request' },
          id: null,
        });
      }
    } catch (error) {
      console.error('Error handling POST /mcp:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal error' },
          id: null,
        });
      }
    }
  });

  app.get('/mcp', async (req: Request, res: Response) => {
    try {
      const sessionId = req.headers['mcp-session-id'];
      if (typeof sessionId === 'string' && transports.has(sessionId)) {
        await transports.get(sessionId)!.handleRequest(req, res, req.body);
      } else {
        res.status(404).json({
          jsonrpc: '2.0',
          error: { code: -32001, message: 'Session not found' },
          id: null,
        });
      }
    } catch (error) {
      console.error('Error handling GET /mcp:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal error' },
          id: null,
        });
      }
    }
  });

  app.delete('/mcp', async (req: Request, res: Response) => {
    try {
      const sessionId = req.headers['mcp-session-id'];
      if (typeof sessionId === 'string' && transports.has(sessionId)) {
        await transports.get(sessionId)!.handleRequest(req, res, req.body);
      } else {
        res.status(404).json({
          jsonrpc: '2.0',
          error: { code: -32001, message: 'Session not found' },
          id: null,
        });
      }
    } catch (error) {
      console.error('Error handling DELETE /mcp:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal error' },
          id: null,
        });
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

  const PORT = process.env.PORT || 3000;
  app.listen(PORT);
  console.error(`Redash MCP Server running on Streamable HTTP at http://localhost:${PORT}/mcp`);
} else if (process.argv.includes('--sse')) {
  // SSEモードで起動（非推奨）
  const app = express();
  const transports: {[sessionId: string]: SSEServerTransport} = {};

  app.get("/sse", async (_: Request, res: Response) => {
    const transport = new SSEServerTransport('/messages', res);
    transports[transport.sessionId] = transport;
    res.on("close", () => {
      delete transports[transport.sessionId];
    });
    const sessionServer = createServer();
    await sessionServer.connect(transport);
  });

  app.post("/messages", async (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string;
    const transport = transports[sessionId];
    if (transport) {
      await transport.handlePostMessage(req, res);
    } else {
      res.status(400).send('No transport found for sessionId');
    }
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT);
  console.error(`Redash MCP Server running on SSE at http://localhost:${PORT}`);
} else {
  // 通常のSTDIOモードで起動
  runServer().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
  });
}
