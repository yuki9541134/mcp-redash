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

### git clone

このリポジトリをローカルにcloneしてください

### npxで利用する場合

ビルドとnpxコマンドの登録を行ってください

```sh
npm install
npm run build
npm link
```

Claude DesktopまたはCursorのMCP設定に以下を追加してください

```json
{
  "mcpServers": {
    "redash": {
      "command": "npx",
      "args": [
        "mcp-redash"
      ],
      "env": {
        "REDASH_API_KEY": "<YOUR_API_KEY>",
        "REDASH_BASE_URL": "https://redash.example.com"
      }
    }
  }
}
```

### Dockerで利用する場合

ビルドを行ってください

```sh
docker build -t yuki9541134/mcp-redash .
```

Claude DesktopまたはCursorのMCP設定に以下を追加してください

```json
{
  "mcpServers": {
    "redash": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
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

### SSEモードで利用する場合

HTTPサーバーとして起動し、Server-Sent Events (SSE) を使用した通信を行うことも可能です。

#### 開発時
```bash
npm run dev -- --sse
```

#### ビルド後
```bash
node dist/index.js --sse
```

SSEモードではHTTPサーバーがポート3000で起動します。エンドポイント：
- `GET /sse` - SSE接続の確立
- `POST /messages` - メッセージの送信
