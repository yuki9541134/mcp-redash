# Redash MCPサーバー

Redash APIのためのMCPサーバーで、クエリの実行、ジョブステータスの確認、結果の取得などの機能を提供します。

## 特徴

* **クエリ実行**: Redashデータソースに対してSQLクエリを実行
* **ジョブステータス追跡**: 実行中のクエリのステータスを確認
* **結果取得**: 完了したクエリの結果を取得
* **データソース管理**: 利用可能なデータソースの一覧取得と情報確認

## ツール

1. `execute_query`
   * クエリを実行してジョブIDを返します
   * 入力パラメータ:
     * `data_source_id` (数値): クエリを実行するデータソースのID
     * `query` (文字列): 実行するSQLクエリ
     * `max_age` (オプション、数値): キャッシュされた結果の最大有効期間（秒）
   * 戻り値: クエリ実行を追跡するためのジョブID

2. `get_job_status`
   * 実行中のジョブのステータスを確認します
   * 入力パラメータ:
     * `job_id` (文字列): 確認するジョブのID
   * 戻り値: ジョブステータス情報

3. `get_query_result`
   * 完了したクエリの結果を取得します
   * 入力パラメータ:
     * `query_result_id` (数値): 取得するクエリ結果のID
   * 戻り値: クエリ結果データ

4. `execute_query_and_wait`
   * クエリを実行し、結果が利用可能になるまで待機します
   * 入力パラメータ:
     * `data_source_id` (数値): クエリを実行するデータソースのID
     * `query` (文字列): 実行するSQLクエリ
     * `max_age` (オプション、数値): キャッシュされた結果の最大有効期間（秒）
   * 戻り値: 利用可能になったクエリ結果

5. `list_data_sources`
   * 利用可能なすべてのデータソースを一覧表示します
   * 入力パラメータ: なし
   * 戻り値: データソースの配列

6. `get_data_source`
   * 特定のデータソースに関する詳細を取得します
   * 入力パラメータ:
     * `data_source_id` (数値): データソースのID
   * 戻り値: データソースの詳細情報

## セットアップ

### APIキー

このMCPサーバーを使用するにはRedash APIキーが必要です:

1. Redashインスタンスにログイン
2. ユーザー設定に移動
3. APIキーを見つけるか作成
4. 生成されたキーをコピー

### 環境変数

以下の環境変数が必要です:

* `REDASH_API_KEY`: RedashのAPIキー
* `REDASH_BASE_URL`: RedashインスタンスのベースURL（例: https://redash.example.com）
* `DATA_SOURCE_ID`: （オプション）クエリに使用するデフォルトのデータソースID

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
        "REDASH_BASE_URL": "https://redash.example.com",
        "DATA_SOURCE_ID": "1"
      }
    }
  }
}
```

## ビルド

Dockerビルド:

```bash
# TypeScriptコードのビルド
npm run build

# Dockerイメージのビルド
docker build -t yuki9541134/mcp-redash .
```
