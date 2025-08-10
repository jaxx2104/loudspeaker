# System Patterns

## Architecture

- GitHub Actions を使用したイベント駆動型アーキテクチャ
- Node.js による単一責任の原則に基づいたモジュラー設計
- サービス層による機能の分離と再利用性の向上

## Directory Structure

```
src/
├── config/      # 設定管理
├── services/    # 機能別サービス
└── index.js     # メインロジック
```

## Key Technical Decisions

1. GitHub API v4 (GraphQL) を使用して Star イベントを効率的に取得
2. X API v2 を使用して投稿を実行
3. GitHub Actions の cron スケジュールで15分間隔の実行を制御
4. Mistral AI を使用したリポジトリ説明の自動要約
5. 環境変数の一元管理による設定の簡素化

## Design Patterns

- 単一責任の原則 (SRP) に基づくファイル分割
- サービスパターンによる機能のカプセル化
- 設定の中央管理パターン
- 非同期処理の Promise チェーン

## Security Considerations

- GitHub と X の認証情報は GitHub Secrets で安全に管理
- API トークンのスコープを必要最小限に制限
- Mistral AI の API キーも GitHub Secrets で保護

## Error Handling

- 各サービスレイヤーでの適切なエラーハンドリング
- メインプロセスでの集中的なエラー管理
- エラー発生時の適切なログ出力
