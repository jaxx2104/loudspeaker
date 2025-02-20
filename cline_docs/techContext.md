# Technical Context

## Technologies Used
- GitHub Actions
- Node.js
- GitHub API v4 (GraphQL)
- X API v2
- Mistral AI API
- LangChain
- dotenv

## Development Setup
1. GitHub リポジトリの設定
   - Actions の有効化
   - 必要な Secrets の設定
     - USER_GITHUB_TOKEN
     - USER_GITHUB_NAME
     - X_API_KEY
     - X_API_SECRET
     - X_ACCESS_TOKEN
     - X_ACCESS_SECRET
     - MISTRAL_API_KEY

2. ローカル開発環境
   ```bash
   # 依存関係のインストール
   npm install

   # 環境変数の設定
   cp .env.example .env
   # .envファイルに必要な環境変数を設定

   # 開発用実行
   node src/index.js
   ```

## Project Dependencies
- @octokit/graphql: GitHub GraphQL API クライアント
- twitter-api-v2: X API クライアント
- @langchain/core: LangChain フレームワーク
- @langchain/mistralai: Mistral AI 連携
- dotenv: 環境変数管理

## Technical Constraints
- GitHub API のレート制限
- X API の投稿制限
- GitHub Actions の実行時間制限
- Mistral AI API の利用制限とコスト
- LangChain の非同期処理の制約

## Performance Considerations
- GraphQL によるデータ取得の最適化
- 15分間隔での実行による API 制限の回避
- AI 要約処理の効率化（temperature: 0.3の設定）
