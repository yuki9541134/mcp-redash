#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import fetch from 'node-fetch';

// Redash APIのオペレーションをインポート
import * as queries from './operations/queries.js';
import * as jobs from './operations/jobs.js';
import * as datasources from './operations/datasources.js';

// エラータイプをインポート
import {
  RedashError,
  RedashValidationError,
  RedashResourceNotFoundError,
  RedashAuthenticationError,
  isRedashError,
} from './common/errors.js';

// バージョン情報
const VERSION = "1.0.0";

// グローバルスコープにfetchが存在しない場合は追加
if (!globalThis.fetch) {
  globalThis.fetch = fetch as unknown as typeof global.fetch;
}

// サーバーの初期化
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

// ListToolsリクエスト処理
server.setRequestHandler(ListToolsRequestSchema, async (request) => {
  return {
    tools: [
      {
        name: "execute_query",
        description: "Execute a SQL query against Redash data source and return a job ID",
        parameters: zodToJsonSchema(queries.ExecuteQuerySchema),
      },
      {
        name: "get_job_status",
        description: "Check the status of a running query job",
        parameters: zodToJsonSchema(jobs.JobStatusSchema),
      },
      {
        name: "get_query_result",
        description: "Get the results of a completed query",
        parameters: zodToJsonSchema(queries.QueryResultSchema),
      },
      {
        name: "execute_query_and_wait",
        description: "Execute a SQL query and wait for the results",
        parameters: zodToJsonSchema(queries.ExecuteQuerySchema),
      },
      {
        name: "list_data_sources",
        description: "List all available data sources",
        parameters: zodToJsonSchema(z.object({})),
      },
      {
        name: "get_data_source",
        description: "Get details about a specific data source",
        parameters: zodToJsonSchema(datasources.DataSourceSchema),
      },
    ],
  };
});

// CallToolリクエスト処理
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    switch (request.params.name) {
      case "execute_query": {
        const args = queries.ExecuteQuerySchema.parse(request.params.arguments);
        const jobId = await queries.executeQuery(args);
        return {
          content: [{ type: "text", text: JSON.stringify({ job_id: jobId }, null, 2) }],
        };
      }
      case "get_job_status": {
        const args = jobs.JobStatusSchema.parse(request.params.arguments);
        const status = await jobs.getJobStatus(args.job_id);
        return {
          content: [{ type: "text", text: JSON.stringify(status, null, 2) }],
        };
      }
      case "get_query_result": {
        const args = queries.QueryResultSchema.parse(request.params.arguments);
        const result = await queries.getQueryResult(args.query_result_id);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }
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

// サーバー実行関数
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Redash MCP Server running on stdio");
}

// サーバーの実行
runServer().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
}); 