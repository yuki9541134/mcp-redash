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
| ポート | 不要 | 3000 | 3000 |
| エンドポイント | - | `POST/GET/DELETE /mcp` | `GET /sse`, `POST /messages` |
| 主な用途 | Claude Desktop, Cursor等 | Webクライアント, リモート接続 | レガシー互換 |

> ポートは環境変数 `PORT` で変更できます（Streamable HTTP / SSE）。

### stdio（デフォルト）

標準入出力で通信するモードです。Claude DesktopやCursorなどのMCPクライアントから利用する場合はこちらを使用します。

#### 開発時

```bash
npm run dev
```

#### ビルド後

```bash
node dist/index.js
```

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

#### 開発時

```bash
npm run dev -- --streamable-http
```

#### ビルド後

```bash
node dist/index.js --streamable-http
```

#### Docker

```sh
docker run --rm -p 3000:3000 --env-file .env \
  yuki9541134/mcp-redash --streamable-http
```

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

#### 開発時

```bash
npm run dev -- --sse
```

#### ビルド後

```bash
node dist/index.js --sse
```

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
