# Netlify デプロイ手順

このドキュメントでは、docs-to-tsx アプリケーションを Netlify にデプロイする手順を説明します。

## 前提条件

- GitHub アカウント
- Netlify アカウント（無料プランで OK）
- このプロジェクトが GitHub リポジトリにプッシュされていること

## デプロイ手順

### 1. GitHub にプッシュ

```bash
# まだ Git リポジトリを初期化していない場合
git init
git add .
git commit -m "Initial commit with Netlify Functions support"

# GitHub にリポジトリを作成し、リモートを追加
git remote add origin https://github.com/YOUR_USERNAME/docs-to-tsx.git
git push -u origin main
```

### 2. Netlify にサイトを作成

1. [Netlify](https://app.netlify.com/) にログイン
2. "Add new site" → "Import an existing project" をクリック
3. GitHub を選択し、リポジトリを選択
4. ビルド設定を確認（`netlify.toml` があるので自動設定されます）
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`

### 3. 環境変数の設定

1. Netlify のサイトダッシュボードで "Site settings" → "Environment variables" に移動
2. 以下の環境変数を追加：

   | Key | Value |
   |-----|-------|
   | `IMGUR_CLIENT_ID` | あなたの Imgur Client ID |

3. "Save" をクリック

### 4. デプロイ

- "Deploy site" をクリック
- デプロイが完了するまで待機（通常 1-2 分）
- デプロイが成功すると、Netlify が自動生成した URL（例: `https://your-site-name.netlify.app`）でアクセス可能になります

## ローカル開発

ローカルでは引き続き Express プロキシサーバを使用します：

```bash
# ターミナル 1: プロキシサーバ
node server/imgurProxy.js

# ターミナル 2: フロントエンド開発サーバ
npm run dev
```

## Netlify CLI でローカルテスト（オプション）

Netlify Functions をローカルでテストしたい場合：

```bash
# Netlify CLI をインストール
npm install -g netlify-cli

# Netlify Dev を起動（Functions も含めてローカル環境を再現）
netlify dev
```

これにより、本番環境と同じ構成でローカルテストができます。

## トラブルシューティング

### 画像アップロードが失敗する

1. Netlify の環境変数 `IMGUR_CLIENT_ID` が正しく設定されているか確認
2. Netlify Functions のログを確認（Site settings → Functions → 該当の関数をクリック）
3. ブラウザのコンソールでエラーメッセージを確認

### ビルドが失敗する

1. `package.json` の dependencies に `node-fetch` が含まれているか確認
2. Netlify のビルドログを確認

## カスタムドメインの設定（オプション）

1. Netlify ダッシュボードで "Domain settings" に移動
2. "Add custom domain" をクリック
3. 指示に従ってドメインを設定

## 参考リンク

- [Netlify Functions ドキュメント](https://docs.netlify.com/functions/overview/)
- [Netlify デプロイドキュメント](https://docs.netlify.com/site-deploys/overview/)
