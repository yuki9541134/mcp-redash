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
import * as savedQueries from './operations/saved-queries.js';
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
        {
          name: 'get_query',
          description: 'Get details of a saved query by its ID, including the SQL text',
          inputSchema: zodToJsonSchema(savedQueries.GetQuerySchema),
        },
        {
          name: 'search_queries',
          description: 'Search saved queries by keyword',
          inputSchema: zodToJsonSchema(savedQueries.SearchQueriesSchema),
        },
        {
          name: 'get_query_result',
          description: 'Get an existing query result by its result ID without re-executing the query',
          inputSchema: zodToJsonSchema(savedQueries.GetQueryResultSchema),
        },
        {
          name: 'get_saved_query_result',
          description: 'Get the latest cached result of a saved query by its query ID',
          inputSchema: zodToJsonSchema(savedQueries.GetSavedQueryResultSchema),
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
        case 'get_query': {
          const args = savedQueries.GetQuerySchema.parse(request.params.arguments);
          const query = await savedQueries.getQuery(args.query_id);
          return {
            content: [{ type: 'text', text: JSON.stringify(query, null, 2) }],
          };
        }
        case 'search_queries': {
          const args = savedQueries.SearchQueriesSchema.parse(request.params.arguments);
          const results = await savedQueries.searchQueries(args);
          return {
            content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
          };
        }
        case 'get_query_result': {
          const args = savedQueries.GetQueryResultSchema.parse(request.params.arguments);
          const result = await savedQueries.getQueryResultById(args.query_result_id);
          return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          };
        }
        case 'get_saved_query_result': {
          const args = savedQueries.GetSavedQueryResultSchema.parse(request.params.arguments);
          const result = await savedQueries.getSavedQueryResult(args.query_id);
          return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
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
