# AI駆動Todoアプリ / Seminar App

## 概要

AI を活用したマルチプラットフォーム対応タスク管理サービスです。ユーザーが自然言語で入力したタスクを AI が解析し、期限・優先度・タグを自動補完。進捗データを学習してリマインダーや最適スケジュールを提案します。チーム共有・リアルタイム同期（Supabase バックエンド）・AI 要約による日次振り返り機能を備え、生産性を高めます。

## 技術スタック

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Supabase (Database, Auth, Real-time)
- **UI**: Tailwind CSS, Radix UI
- **AI/ML**: OpenAI API
- **Deployment**: Vercel
- **CI/CD**: GitHub Actions

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

```bash
# .env.localファイルを作成
cp .env.example .env.local
```

`.env.local`に以下の値を設定:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

### 4. Taskmaster AI MCP接続

注意点：
- 使用するAPI KEYと`.taskmaster/config.json`にてproviderとmodelIdの一致を確認すること
- 上記対応後に一度エディタを再起動すること

## 利用可能なコマンド

- `npm run dev` - 開発サーバー起動（Turbopack使用）
- `npm run build` - 本番用ビルド
- `npm run start` - 本番サーバー起動
- `npm run lint` - ESLintによるコード検査

## プロジェクト構造

```
├── app/                    # Next.js App Router
│   ├── auth/              # 認証関連ページ
│   ├── protected/         # 認証済みページ
│   └── globals.css        # グローバルスタイル
├── components/            # Reactコンポーネント
│   ├── ui/               # UIコンポーネント
│   └── tutorial/         # チュートリアル関連
├── lib/                  # ユーティリティ・設定
│   └── supabase/         # Supabase設定
├── .github/workflows/    # CI/CDパイプライン
└── .taskmaster/          # Taskmaster AI設定
```

## CI/CD

GitHub Actionsによる自動化:
- **テスト**: リント、型チェック、ビルド
- **デプロイ**: Vercelへの自動デプロイ（mainブランチ）

## 開発ガイドライン

1. TypeScriptの型安全性を維持
2. ESLintルールに従う
3. コンポーネントは再利用可能に設計
4. Supabaseのセキュリティポリシーを適用
5. Git Conventional Commitsを使用