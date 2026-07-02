# インフォトップ 懇親会管理システム

インフォトップ懇親会の開催・参加者・受付・メール送信を一元管理するWebアプリ。
`C:\Users\nsoga\Claude\Projects\インフォトップ懇親会管理` のシングルファイル版を、
**GitHub でホスティング（GitHub Pages）** できる構成に再構築したもの。

## 構成

```
infotop-konshinkai/
├── docs/                        ← GitHub Pages 公開フォルダ
│   ├── index.html               ← ルート（受取人ページへリダイレクト）
│   ├── admin/                   ← 管理画面（社内用・ID/PWログイン必須）
│   │   ├── index.html / css/ / js/app.js
│   ├── claim/                   ← 受取人ページ（領収書の取得・修正）
│   │   └── index.html
├── workers/                     ← バックエンド（Cloudflare Workers）
│   ├── payment-webhook-worker.js ← インフォトップ「購入者情報送信API」Webhook受け皿（KV保存）
│   ├── recend-worker.js          ← メール送信・予約配信・開封計測・QR・領収書claim・共有ストア・認証
│   ├── wrangler.toml             ← recend-mailer のデプロイ設定
│   └── wrangler-payment-webhook.toml ← webhook のデプロイ設定
├── samples/
│   └── 参加者リスト_サンプル.csv  ← CSVインポート用の匿名サンプル（実データは置かない）
└── README.md
```

## URL

- 管理画面（要ログイン）: `https://<アカウント>.github.io/<リポジトリ>/admin/`
- 受取人ページ: `https://<アカウント>.github.io/<リポジトリ>/claim/`

## データの保存場所（v3から変更）

管理画面のデータは **Worker(KV) の共有ストア**に保存され、**全端末で共通**。
ログイン（ID/PW → 12時間セッション）した端末なら、どこからでも同じデータが見える。
保存は楽観ロック（他端末が先に保存していたら最新を取り込んで通知）。localStorageはオフラインキャッシュとして併用。
管理者ID/PWは Worker の Secret（`ADMIN_USER` / `ADMIN_PASS`）。変更は `wrangler secret put` で可能。

## 主な機能

- ダッシュボード（開催別売上・参加者数の推移グラフ）
- 懇親会イベント管理（会費オプション・二次会設定）
- 参加者管理（CSV/フォームAPI取込、同伴者連携、重複マージ）
- QRコード受付（カメラスキャン、**QR画像アップロード読み取り**、氏名検索、当日決済、釣銭計算、当日飛び込み対応）
- **自動返信メール**: フォームAPI取込時、新規参加者へ受付QRコード付きHTMLメールを送信（設定でON/OFF・テンプレート編集）
- リマインドメール一斉送信: **HTMLメール対応・差込タグ {{name}} {{event}} {{date}} {{venue}} {{amount}} {{qr}}**（{{qr}}は受付QR画像として埋め込み）
- **予約配信**: 指定日時にリマインドを自動送信（Worker の Cron Trigger で実行、予約一覧・取消可）
- **メール履歴（イベント別タブ）**: 種別・件名・本文・宛先アドレス別の送信結果を記録
- **開封トラッキング**: トラッキングピクセルで宛先ごとの開封有無・開封数・開封率を表示（画像非表示環境では計測不可＝実開封数は表示以上）
- 領収書の発行/一括送信（Resend経由・開封計測付き）。**発行時にWorker(KV)へ券面データを永続保存**
- **受取人ページ `claim.html`**: 参加者が**メールアドレス＋申込番号**（jcityフォームの自動採番。領収書メールに明記される）で自分の領収書を再取得（PNG保存・印刷）。**発行から2週間以内は宛名・金額・但書を本人が修正可**（修正すると R-xxxxx-1 形式＋「（再）」で再発行、履歴保存）。ワンタイムリンクは不使用
- 決済Webhook同期（購入確定・キャンセルの自動反映）
- タスク管理・会場リスト・データのエクスポート/インポート

### QRコード受付が読めない場合のチェックリスト

1. **カメラスキャンは https（GitHub Pages）または localhost でのみ動作**します。`file://` で開くとブラウザの制限でカメラが起動しません → GitHub Pages で開くか、「QR画像から読み取り」（スクリーンショット/写真のアップロード）を使ってください
2. 受付QRは開催イベントごとに発行されます。別イベントのQRは「別のイベントのQRです」と表示されます
3. どちらも使えない場合は、スキャン画面下部の氏名検索から受付できます

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

**recend-worker（v2）の追加設定（予約配信・開封トラッキング用）:**

1. KVネームスペースを作成し、Variable name **`MAILLOG`** でバインドする
2. Settings → Triggers → **Cron Triggers** に `*/5 * * * *`（5分おき）を追加する
   （予約配信は予約時刻を過ぎた最初のcron実行で送信＝最大5分の遅れあり）

recend-worker v2 のエンドポイント: `POST /`（即時送信）／`POST・GET・DELETE /schedule`（予約配信）／`GET /opens`（開封一覧）／`GET /open?mid=`（開封計測ピクセル・認証なし）／`GET /qr?data=&size=`（**QRコードPNG生成・認証なし**）。

メール内のQRコード画像は、recend Worker 設定済みなら **Worker自身の `/qr` で生成**（外部サービス非依存・qrcode-generator v1.4.4 同梱）。Worker未設定時のみ外部QR画像API（api.qrserver.com）にフォールバックする。

**領収書・受取人ページ関連のエンドポイント:** `POST /receipts`（発行時のKV保存・要Bearer）／`POST /claim/list`・`POST /claim/edit`（受取人用。認証は**メールアドレス＋申込番号**の照合。ワンタイムリンク廃止）

### 受取人ページ（claim.html）のセットアップ

1. `docs/claim.html` 冒頭の `const DEFAULT_API_URL = ''` に **recend WorkerのURL**を設定して push する
2. アプリの「設定 → 領収書の発行者情報 → 受取人ページURL」に `https://<アカウント>.github.io/<リポジトリ>/claim.html` を登録する
   → 以後、領収書メールに申込番号と受取人ページの案内が自動で入る
3. 制約: 領収書番号の連番はブラウザ(localStorage)で採番するため、**領収書の発行は1台の管理端末から行う**こと（複数端末で並行発行すると番号が重複する）
4. 申込番号はパスワード扱いのため、参加者への案内メール以外に公開しないこと

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
