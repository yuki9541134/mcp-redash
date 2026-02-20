/**
 * MCPサーバーインスタンスのファクトリ関数
 * ツール定義とハンドラを含むサーバーを作成する
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import * as queries from './operations/queries.js';
import * as datasources from './operations/datasources.js';
import { RedashError, isRedashError } from './common/errors.js';

const VERSION = '1.0.0';

/**
 * Redashエラーの整形関数
 */
export function formatRedashError(error: RedashError): string {
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
    } catch {
      message += `\nDetails: ${error.responseBody}`;
    }
  }

  return message;
}

/**
 * MCP Serverインスタンスを作成する
 */
export function createServer(): Server {
  const server = new Server(
    {
      name: 'redash-mcp-server',
      version: VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async (_request) => {
    return {
      tools: [
        {
          name: 'execute_query_and_wait',
          description: 'Execute a SQL query and wait for the results',
          inputSchema: zodToJsonSchema(queries.ExecuteQuerySchema),
        },
        {
          name: 'list_data_sources',
          description: 'List all available data sources',
          inputSchema: zodToJsonSchema(z.object({})),
        },
        {
          name: 'get_data_source',
          description: 'Get details about a specific data source',
          inputSchema: zodToJsonSchema(datasources.DataSourceSchema),
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      switch (request.params.name) {
        case 'execute_query_and_wait': {
          const args = queries.ExecuteQuerySchema.parse(request.params.arguments);
          const result = await queries.executeQueryAndWait(args);
          return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          };
        }
        case 'list_data_sources': {
          const sources = await datasources.listDataSources();
          return {
            content: [{ type: 'text', text: JSON.stringify(sources, null, 2) }],
          };
        }
        case 'get_data_source': {
          const args = datasources.DataSourceSchema.parse(request.params.arguments);
          const source = await datasources.getDataSource(args.data_source_id);
          return {
            content: [{ type: 'text', text: JSON.stringify(source, null, 2) }],
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
