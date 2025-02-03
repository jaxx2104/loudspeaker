# System Patterns

## Architecture
- GitHub Actions を使用したイベント駆動型アーキテクチャ
- Node.js スクリプトによる処理実装

## Key Technical Decisions
1. GitHub API v4 (GraphQL) を使用して Star イベントを効率的に取得
2. X API v2 を使用して投稿を実行
3. GitHub Actions の cron スケジュールで15分間隔の実行を制御

## Security Considerations
- GitHub と X の認証情報は GitHub Secrets で安全に管理
- API トークンのスコープを必要最小限に制限
