# インフォトップ 懇親会管理システム

インフォトップ懇親会の開催・参加者・受付・メール送信を一元管理するWebアプリ。
`C:\Users\nsoga\Claude\Projects\インフォトップ懇親会管理` のシングルファイル版を、
**GitHub でホスティング（GitHub Pages）** できる構成に再構築したもの。

## 構成

```
infotop-konshinkai/
├── docs/                        ← GitHub Pages 公開フォルダ（フロントエンド）
│   ├── index.html               ← アプリ本体（マークアップ）
│   ├── css/style.css            ← スタイル
│   └── js/app.js                ← アプリロジック（データはブラウザのlocalStorageに保存）
├── workers/                     ← バックエンド（Cloudflare Workers）
│   ├── payment-webhook-worker.js ← インフォトップ「購入者情報送信API」Webhook受け皿（KV保存）
│   └── recend-worker.js          ← Resend API 経由のメール送信（リマインド・領収書）
├── samples/
│   └── 参加者リスト_サンプル.csv  ← CSVインポート用の匿名サンプル（実データは置かない）
└── README.md
```

## 主な機能

- ダッシュボード（開催別売上・参加者数の推移グラフ）
- 懇親会イベント管理（会費オプション・二次会設定）
- 参加者管理（CSV/フォームAPI取込、同伴者連携、重複マージ）
- QRコード受付（カメラスキャン、当日決済、釣銭計算、当日飛び込み対応）
- リマインドメール一斉送信・領収書の発行/一括送信（Resend経由）
- 決済Webhook同期（購入確定・キャンセルの自動反映）
- タスク管理・会場リスト・データのエクスポート/インポート

## デプロイ手順

### 1. フロントエンド（GitHub Pages）

1. このリポジトリを GitHub に push する
2. リポジトリの **Settings → Pages** を開く
3. **Source: Deploy from a branch** / **Branch: `main`** / **Folder: `/docs`** を選択して Save
4. 数分後、`https://<ユーザー名>.github.io/<リポジトリ名>/` で公開される

> ⚠️ **公開リポジトリにする場合の注意**: 参加者の個人情報を含むCSV等をコミットしないこと。
> アプリのデータ自体は各ブラウザの localStorage にのみ保存され、リポジトリには含まれない。

### 2. バックエンド（Cloudflare Workers — GitHub Pagesでは代替不可）

GitHub Pages は**静的ファイル配信専用**のため、次の2つはサーバー側の実行環境が必要:

| Worker | 役割 | GitHub Pagesで動かせない理由 |
|---|---|---|
| `payment-webhook-worker.js` | インフォトップからの決済WebhookをPOSTで受信しKVに保存 | POST受信・データ永続化が不可 |
| `recend-worker.js` | Resend APIでメール送信 | APIキーを静的サイトに置くと漏洩する |

デプロイ手順は各ファイル冒頭のコメントに記載（Cloudflareダッシュボードに貼り付けるだけ）。
デプロイ後、アプリの「設定」画面に各WorkerのURLと認証トークンを登録する。

**シークレットは必ず Cloudflare の Variables and Secrets に設定し、コードやリポジトリに書かないこと**
（`RESEND_API_KEY` / `SHARED_SECRET` / `GET_TOKEN` / `WEBHOOK_KEY`）。

> 旧版の recend-worker.js には Resend APIキーが平文で記載されていた。
> 本リポジトリでは除去済みだが、**当該キーは漏洩済みとして Resend 側で無効化・再発行を推奨**。

### 3. アプリ側の設定（デプロイ後）

アプリの「設定」画面で以下を登録:

- **recend 送信エンドポイントURL** = recend-worker のURL ＋ 認証トークン（`SHARED_SECRET`と同じ値）
- **決済受信エンドポイントURL** = payment-webhook-worker のURL ＋ 認証トークン（`GET_TOKEN`と同じ値）

## データの取り扱い

- 全データはブラウザの **localStorage** に保存（サーバー保存なし）
- 端末・ブラウザをまたぐ共有は不可。移行は「設定 → バックアップ（エクスポート/インポート）」を使用
- 誤消去に注意（ブラウザのサイトデータ削除でアプリのデータも消える）

## 元プロジェクトからの変更点

- `懇親会管理システム.html`（875行・単一ファイル）を `index.html` / `css/style.css` / `js/app.js` に分割（ロジック変更なし）
- 旧 `index.html` は途中で切れた不完全なコピーだったため破棄し、完全版のみ採用
- `recend-worker.js` のコメント内に平文記載されていた Resend APIキー・共有シークレットを除去
- 実在の参加者個人情報を含む `2607_参加者リスト_インポート用.csv` は同梱せず、匿名ダミーの `参加者リスト_サンプル.csv` に差し替え
- GitHub Pages 用に `docs/` 配下へ配置
