# Redash MCPサーバー

Redash APIのMCPサーバーで、クエリの実行、結果の取得などの機能を提供します。

## ツール

1. `execute_query_and_wait`
   * クエリを実行し、結果が利用可能になるまで待機します
   * 入力パラメータ:
     * `data_source_id` (数値): クエリを実行するデータソースのID
     * `query` (文字列): 実行するSQLクエリ
   * 戻り値: 利用可能になったクエリ結果

2. `list_data_sources`
   * 利用可能なすべてのデータソースを一覧表示します
   * 入力パラメータ: なし
   * 戻り値: データソースの配列

3. `get_data_source`
   * 特定のデータソースに関する詳細を取得します
   * 入力パラメータ:
     * `data_source_id` (数値): データソースのID
   * 戻り値: データソースの詳細情報

## セットアップ

### APIキー

Redash APIキーを取得してください。

1. Redashにログイン
2. 「Edit Profile」をクリック
3. APIキーをコピーする

### 環境変数

以下の環境変数が必要です:

* `REDASH_API_KEY`: RedashのAPIキー
* `REDASH_BASE_URL`: RedashのURL（例: https://redash.example.com）
* `PORT`（任意）: HTTPサーバーのポート番号（デフォルト: 3000、Streamable HTTP / SSE で使用）

### インストール

```sh
git clone https://github.com/yuki9541134/mcp-redash.git
cd mcp-redash
npm install
npm run build
npm link
```

## 起動モード

3つの起動モードに対応しています。

| | stdio（デフォルト） | Streamable HTTP | SSE（非推奨） |
|---|---|---|---|
| 起動フラグ | なし | `--streamable-http` | `--sse` |
| 通信方式 | 標準入出力 | HTTP | HTTP（Server-Sent Events） |
| ポート | 不要 | デフォルト 3000 | デフォルト 3000 |
| エンドポイント | - | `POST/GET/DELETE /mcp` | `GET /sse`, `POST /messages` |
| 主な用途 | ローカル利用 | リモート・複数クライアント共有 | レガシー互換 |

### stdio（デフォルト）

標準入出力で通信するモードです。MCPクライアントからローカルで利用する場合はこちらを使用します。

```bash
npm run build
node dist/index.js
```

> 開発時は `npm run dev` でTypeScriptを直接実行できます。

#### npxで利用する場合

`npm link` 済みであれば、npxで直接実行できます。

```bash
npx mcp-redash
```

Claude Codeの `.mcp.json` 設定例:

```json
{
  "mcpServers": {
    "redash": {
      "type": "stdio",
      "command": "npx",
      "args": ["mcp-redash"],
      "env": {
        "REDASH_API_KEY": "<YOUR_API_KEY>",
        "REDASH_BASE_URL": "https://redash.example.com"
      }
    }
  }
}
```

#### Dockerで利用する場合

```sh
docker build -t yuki9541134/mcp-redash .
```

Claude Codeの `.mcp.json` 設定例:

```json
{
  "mcpServers": {
    "redash": {
      "type": "stdio",
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "REDASH_API_KEY",
        "-e", "REDASH_BASE_URL",
        "yuki9541134/mcp-redash"
      ],
      "env": {
        "REDASH_API_KEY": "<YOUR_API_KEY>",
        "REDASH_BASE_URL": "https://redash.example.com"
      }
    }
  }
}
```

### Streamable HTTP

HTTPサーバーとして起動し、Streamable HTTPプロトコルで通信するモードです。Webクライアントやリモート接続に適しています。

```bash
npm run build
node dist/index.js --streamable-http
```

> 開発時は `npm run dev -- --streamable-http` でTypeScriptを直接実行できます。

#### Docker Compose

```sh
docker compose up -d
```

> `.env` の `PORT` でポートを変更できます（デフォルト: 3000）。

エンドポイント:
- `POST /mcp` - リクエストの送信
- `GET /mcp` - SSEストリームの確立（サーバー → クライアント通知用）
- `DELETE /mcp` - セッションの終了

Claude Codeの `.mcp.json` 設定例:

```json
{
  "mcpServers": {
    "redash": {
      "type": "http",
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

### SSE（非推奨）

> **非推奨**: SSEモードはレガシー互換のために残されています。新規利用にはStreamable HTTPモードを推奨します。

HTTPサーバーとして起動し、Server-Sent Events (SSE) で通信するモードです。

```bash
npm run build
node dist/index.js --sse
```

> 開発時は `npm run dev -- --sse` でTypeScriptを直接実行できます。

エンドポイント:
- `GET /sse` - SSE接続の確立
- `POST /messages` - メッセージの送信

Claude Codeの `.mcp.json` 設定例:

```json
{
  "mcpServers": {
    "redash": {
      "type": "sse",
      "url": "http://localhost:3000/sse"
    }
  }
}
```
