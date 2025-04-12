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

このMCPサーバーを使用するにはRedash APIキーが必要です:

1. Redashにログイン
2. Edit Profileをクリック
3. APIキーをコピーする

### 環境変数

以下の環境変数が必要です:

* `REDASH_API_KEY`: RedashのAPIキー
* `REDASH_BASE_URL`: RedashのURL（例: https://redash.example.com）

### Claude DesktopまたはCursorでの使用方法

Claude DesktopまたはCursorで使用するには、設定に以下を追加してください:

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
        "-e", "DATA_SOURCE_ID",
        "yuki9541134/mcp-redash"
      ],
      "env": {
        "REDASH_API_KEY": "あなたのAPIキー",
        "REDASH_BASE_URL": "https://redash.example.com"
      }
    }
  }
}
```

## ビルド

Dockerビルド:

```bash
docker build -t yuki9541134/mcp-redash .
```
