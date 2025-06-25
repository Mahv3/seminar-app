コマンド

1. プロジェクト立ち上げ
```
npx create-next-app -e with-supabase
```

2. 環境変数ファイルの設定
```
# .env.exampleをコピーして.env.localを作成
cp .env.example .env.local
```
.env.localを作成後、supabaseプロジェクトからURLとANON KEYの取得

3. taskmaster ai mcp接続
注意点：
・使用するAPI KEYと.taskmaster/config.jsonにてproviderとmodelIdの一致を確認すること。
・上記対応後に一度cursorを再起動すること。

プロンプト

```
# ======================= PRD 生成プロンプト =======================
あなたはシニアプロダクトマネージャーです。  
以下の変数をもとに、**Markdown (.md) + YAML Front Matter** 形式で
プロダクト要求仕様書（PRD）を生成してください。

## ── 変数 ──
APP_NAME       = "AI駆動Todoアプリ"
APP_OVERVIEW   = "本アプリは AI を活用したマルチプラットフォーム対応タスク管理サービスです。ユーザーが自然言語で入力したタスクを AI が解析し、期限・優先度・タグを自動補完。進捗データを学習してリマインダーや最適スケジュールを提案します。チーム共有・リアルタイム同期（Supabase バックエンド）・AI 要約による日次振り返り機能を備え、生産性を高めます。"
VERSION        = "0.1"
STATUS         = "Draft"
UPDATED_DATE   = "2025-06-25"

## ── 出力要件 ──
1. 最初に YAML Front Matter を記述し、キーは以下の順序で並べること：  
   `title, version, owner, reviewers, status, updated, overview`
2. YAML の `title` には「AI駆動Todoアプリ PRD」と記載すること。
3. YAML の `overview` フィールドに **変数 APP_OVERVIEW** の全文を入れること。  
   - Markdown 本文でも第 1 章「概要」に同じ内容を再掲する。
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
   （例：`erDiagram` や `flowchart TD`）。  
6. コードブロック・図解以外はすべて Markdown 見出し (`##`) とリストで構成すること。
7. 出力は **1 つのファイルの内容だけ** を返し、説明や余計な注釈は加えないこと。
# ================================================================
```