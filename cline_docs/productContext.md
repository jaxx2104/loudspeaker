# Product Context

## Purpose

このプロジェクトは、GitHub リポジトリに Star がついた時に自動的に X(Twitter)にシェアするツールです。

## Problems Solved

- GitHub リポジトリの Star 獲得を自動的に X でシェアすることで、プロジェクトの可視性を向上
- 手動でのソーシャルメディア投稿の手間を削減
- リポジトリの成長をコミュニティと共有
- AIによるリポジトリ説明の自動要約で、投稿内容を簡潔かつ魅力的に表現

## Expected Behavior

1. 15分おきに GitHub Action が実行される
2. 新しい Star が検出された場合:
   - リポジトリの説明をMistral AIを使用して15文字以内に要約
   - 要約された説明とともにXに自動投稿
3. 投稿内容には:
   - リポジトリ名
   - AI生成の簡潔な説明
   - GitHub リポジトリの URL
     が含まれる
