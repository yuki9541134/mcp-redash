# ビルドステージ
FROM node:22-alpine AS builder

WORKDIR /app

# パッケージファイルをコピー
COPY package*.json ./

# 全ての依存関係をインストール（TypeScriptコンパイラを含む）
RUN npm install

# ソースコードをコピー
COPY tsconfig.json ./
COPY src ./src

# TypeScriptをコンパイル
RUN npm run build

# 実行ステージ
FROM node:22-alpine AS release

WORKDIR /app

# ビルドステージから必要なファイルだけをコピー
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

# 本番環境用設定
ENV NODE_ENV=production
ENV REDASH_API_KEY=""
ENV REDASH_BASE_URL=""
ENV DATA_SOURCE_ID=""

# 本番依存関係のみインストール
RUN npm ci --omit=dev --ignore-scripts

# 起動コマンド
ENTRYPOINT ["node", "dist/index.js"] 
