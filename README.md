# 🚀 AI駆動開発でポートフォリオを爆速構築

> **未経験者でも大丈夫！** AIツールを活用して、プロレベルのWebアプリケーションを短時間で構築する手法ガイド

## 📖 概要

このガイドでは、AI開発ツールを組み合わせて効率的にWebアプリケーションを構築する手法を紹介します。従来の開発では数週間〜数ヶ月かかっていたポートフォリオレベルのアプリケーションを、**数日〜1週間程度**で完成させることができます。

## ✨ この手法の特徴

- 🎯 **計画的開発**: PRD（プロダクト要求仕様書）ベースの体系的アプローチ
- 🤖 **AI自動化**: タスク分解からコード生成まで大部分を自動化
- 📚 **学習効率**: 実際に手を動かしながらベストプラクティスを学習
- 🔄 **反復改善**: 小さなタスク単位での継続的な改善サイクル

## 🛠️ 使用ツール

| ツール | 役割 | 無料版の制限 |
|--------|------|--------------|
| **Next.js + Supabase** | アプリケーション基盤 | 無料枠あり |
| **TaskMaster AI** | タスク分解・プロジェクト管理 | 無料 |
| **Cursor** | AI統合エディタ | 無料トライアルあり |
| **Claude Code** | コード生成・レビュー | 無料枠あり |

## 📋 前提条件

- Node.js 18以上
- Git の基本操作
- テキストエディタの基本操作
- **プログラミング経験は不要**（AIが大部分を担当）

## 🚀 開発手順

### STEP 1: プロジェクト初期設定

```bash
# Next.js + Supabase テンプレートでプロジェクト作成
npx create-next-app@latest seminar-app -e with-supabase
cd seminar-app
```
「seminar-app」は適宜自身のアプリケーション名に置き換えてください

### STEP 2: PRD（プロダクト要求仕様書）作成

AIにプロンプトを投げて、作りたいアプリのPRDを生成します。

<details>
<summary>📝 PRD生成プロンプト例（クリックで展開）</summary>

```
あなたはシニアプロダクトマネージャーです。  
以下の変数をもとに、**Markdown (.md) + YAML Front Matter** 形式で
プロダクト要求仕様書（PRD）を生成してください。

## ── 変数 ──
APP_NAME       = "AI駆動Todoアプリ"
APP_OVERVIEW   = "本アプリは AI を活用したマルチプラットフォーム対応タスク管理サービスです。ユーザーが自然言語で入力したタスクを AI が解析し、期限・優先度・タグを自動補完。進捗データを学習してリマインダーや最適スケジュールを提案します。チーム共有・リアルタイム同期（Supabase バックエンド）・AI 要約による日次振り返り機能を備え、生産性を高めます。"
VERSION        = "0.1"
STATUS         = "Draft"
UPDATED_DATE   = "2025-01-XX"

## ── 出力要件 ──
1. 最初に YAML Front Matter を記述し、キーは以下の順序で並べること：  
   `title, version, owner, reviewers, status, updated, overview`
2. YAML の `title` には「APP_NAME PRD」と記載すること。
3. YAML の `overview` フィールドに **変数 APP_OVERVIEW** の全文を入れること。  
4. Markdown 本文の章立ては下記のとおり：  
   - 1. 概要  
   - 2. 背景・目的  
   - 3. ユースケース  
   - 4. 機能要件  
   - 5. 非機能要件  
   - 6. 画面一覧 & 画面遷移  
   - 7. 受け入れ基準 (Acceptance Criteria)  
   - 8. スケジュール & マイルストーン  
   - 9. リスク・課題  
   - 10. 参考資料  

5. **Mermaid 図** が必要な場合はコードブロック内に直接記述すること  
6. 出力は **1 つのファイルの内容だけ** を返し、説明や余計な注釈は加えないこと。
```

> 💡 **ポイント**: APP_NAME と APP_OVERVIEW を自分の作りたいアプリに変更してください

</details>

生成されたPRDを `.taskmaster/docs/prd.txt` として保存します。

### STEP 3: TaskMaster AI でタスク分解

TaskMaster AI を使って、PRDから実装可能なタスクに自動分解します。

```bash
# TaskMaster AI の初期化
npx task-master-ai init

# PRDからタスクを自動生成
npx task-master-ai parse-prd .taskmaster/docs/prd.txt
```

<details>
<summary>🔧 TaskMaster AI の詳細な使い方</summary>

#### 基本コマンド

```bash
# タスク一覧表示
npx task-master-ai list

# 次にやるべきタスクを表示
npx task-master-ai next

# 複雑なタスクをさらに分解
npx task-master-ai expand --id=5 --research

# タスクの状況を更新
npx task-master-ai set-status --id=5 --status=done
```

#### MCP連携（Cursor使用時）

Cursorを使用している場合、TaskMaster AI のMCPサーバーと連携することで、エディタ内から直接タスク管理が可能になります。

**設定方法**:
1. `.cursor/mcp.json` に TaskMaster AI の設定を追加
2. Cursor の再起動
3. エディタ内でタスクの確認・更新が可能

</details>

### STEP 4: AI エージェントによる自動実装

Cursor の Agent モードや Claude Code を使用して、タスクを自動実行します。

<details>
<summary>🤖 Cursor Agent モードの使い方</summary>

#### 基本的な使い方

1. **Cursor を開く**
2. **Cmd/Ctrl + Shift + I** でAgent モードを起動
3. **タスクを具体的に指示**:
   ```
   TaskMaster の Task 5「ユーザー認証機能の実装」を実行してください。
   
   - Supabase Auth を使用
   - ログイン・ログアウト・サインアップ機能
   - プロテクトされたページの実装
   
   実装後、TaskMaster のタスク状況も更新してください。
   ```

#### 効果的なプロンプトのコツ

- **具体的な技術スタックを指定**: 「React + TypeScript + Tailwind CSS で実装」
- **ファイル構成を明示**: 「components/auth/ ディレクトリに配置」
- **テスト方法を含める**: 「実装後、ローカルで動作確認」

</details>

<details>
<summary>🎯 Claude Code との連携</summary>

#### Claude Code の活用場面

- **コードレビュー**: 実装されたコードの品質チェック
- **リファクタリング**: より良いコード構造への改善提案
- **デバッグ**: エラーの原因特定と修正方法の提示
- **最適化**: パフォーマンス改善の提案

#### 使用例

```
以下のコンポーネントをレビューして、改善点があれば教えてください：

[コードを貼り付け]

特に以下の観点でお願いします：
- TypeScript の型安全性
- アクセシビリティ
- パフォーマンス
- コードの可読性
```

</details>

### STEP 5: GitHub連携（オプション）

TaskMaster AI と GitHub MCP を連携させて、タスクを Issue として管理することも可能です。

```bash
# GitHub にタスクを Issue として同期
# (GitHub MCP 設定後)
npx task-master-ai github-sync
```

## 📚 学習リソース

### 必読ドキュメント

- [Next.js 公式ドキュメント](https://nextjs.org/docs)
- [Supabase スタートガイド](https://supabase.com/docs/guides/getting-started)
- [TaskMaster AI ドキュメント](https://taskmaster-ai.com/docs)

### 参考動画・チュートリアル

- Next.js + Supabase での基本的なCRUDアプリ構築
- Cursor Agent モードの効果的な使い方
- AI駆動開発のベストプラクティス

## 🐛 トラブルシューティング

### よくある問題と解決方法

<details>
<summary>TaskMaster AI の初期化でエラーが発生する</summary>

**症状**: `npx task-master-ai init` でエラー

**解決方法**:
1. Node.js のバージョンを確認（18以上が必要）
2. npm キャッシュをクリア: `npm cache clean --force`
3. 再実行: `npx task-master-ai@latest init`

</details>

<details>
<summary>Cursor Agent が期待通りに動作しない</summary>

**症状**: Agent の指示が曖昧で期待する結果が得られない

**解決方法**:
1. **より具体的な指示を出す**:
   - ❌ 「ログイン機能を作って」
   - ✅ 「Supabase Auth を使用してログイン・ログアウト機能を実装。pages/login.tsx を作成し、useAuth フックで認証状態を管理」

2. **段階的に指示を出す**:
   - 一度に全機能ではなく、小さな機能単位で指示

</details>

<details>
<summary>Supabase の接続でエラーが発生する</summary>

**症状**: データベース接続やAuth関連のエラー

**解決方法**:
1. `.env.local` ファイルの環境変数を確認
2. Supabase プロジェクトの設定を再確認
3. [Supabase トラブルシューティング](https://supabase.com/docs/guides/troubleshooting)を参照

</details>

## 💡 開発のコツ

### 効率的な開発フロー

1. **小さく始める**: 最初は基本的なCRUD機能から
2. **段階的に機能追加**: 一度に全機能ではなく、優先度順に実装
3. **定期的なコミット**: 機能単位で細かくGitコミット
4. **AI活用の限界を理解**: 100%AIに任せず、重要な部分は人間が確認

### ポートフォリオとしての価値を高めるポイント

- **デプロイまで完了**: Vercel などでの公開
- **適切なREADME**: プロジェクトの説明とセットアップ方法
- **テストの実装**: 最低限のテストコード
- **レスポンシブ対応**: モバイル・デスクトップ両対応

## 🎯 次のステップ

このガイドでポートフォリオアプリを完成させた後は：

1. **より複雑なアプリに挑戦**: リアルタイム機能、外部API連携など
2. **チーム開発の練習**: 複数人でのAI駆動開発
3. **独自ツールの開発**: TaskMaster AI の拡張や独自ツールの作成

---

**Happy Coding with AI! 🚀**
