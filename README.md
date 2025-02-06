# Whisper Word Timestamps TypeScript 版

Web ブラウザで動作する音声認識アプリケーションの TypeScript 実装です。音声や動画ファイルをアップロードすると、単語レベルのタイムスタンプ付きで文字起こしを行います。

元のプロジェクト: [transformers.js-examples/whisper-word-timestamps](https://github.com/huggingface/transformers.js-examples/tree/main/whisper-word-timestamps)

## 特徴

- 🎯 音声認識とタイムスタンプ生成
- 🌐 100 以上の言語に対応
- 💻 クライアントサイドで完結（サーバー不要）
- 🔄 WebGPU/WebAssembly の自動選択
- 📱 レスポンシブデザイン
- 🌙 ダークモード対応

## 技術スタック

- React 19.0.0
- TypeScript 5.7.2
- Vite 6.1.0
- Transformers.js 3.3.2
- Tailwind CSS 4.0.4

## 動作要件

- モダンな Web ブラウザ（Chrome 推奨）
- WebGPU または WebAssembly のサポート
- クライアントマシンで大規模な計算が可能なこと

## セットアップ

1. リポジトリのクローン:

```sh
git clone [your-repository-url]
```

2. プロジェクトディレクトリへ移動:

```sh
cd whisper-word-timestamps-ts
```

3. 依存関係のインストール:

```sh
npm install
```

4. 開発サーバーの起動:

```sh
npm run dev
```

## 使い方

1. アプリケーションにアクセス（デフォルト: http://localhost:5173）
2. 「モデルを読み込む」をクリックしてモデルをダウンロード
3. 音声または動画ファイルをドラッグ&ドロップまたはクリックして選択
4. 必要に応じて言語を選択
5. 「モデルを実行」をクリックして文字起こしを開始

## プロジェクト構造

```
whisper-word-timestamps-ts/
├── src/
│   ├── components/         # Reactコンポーネント
│   │   ├── Progress.tsx    # 進捗表示
│   │   ├── MediaInput.tsx  # メディア入力
│   │   ├── Transcript.tsx  # 文字起こし表示
│   │   └── LanguageSelector.tsx
│   ├── App.tsx            # メインアプリケーション
│   ├── types.ts           # 型定義
│   └── worker.ts          # Web Worker実装
├── public/                # 静的ファイル
└── ...
```

## 型定義

TypeScript 化に伴い、以下の型を定義・使用しています：

- `DeviceType`: 使用するデバイス（"webgpu" | "wasm"）
- `TranscriptionResult`: 文字起こし結果の形式
- `LoadingStatus`: モデル読み込み状態
- その他、Worker 通信用の型定義など

## 主な改善点

オリジナルの JavaScript バージョンからの主な改善点：

1. 型安全性の向上

   - 厳密な型チェック
   - インターフェースの明確化
   - コンパイル時のエラー検出

2. エラーハンドリングの強化

   - より詳細なエラーメッセージ
   - 型安全なエラー処理
   - デバッグ機能の向上

3. コード品質の改善
   - より明確なコード構造
   - IDE 支援の活用
   - コード補完の強化

## ライセンス

このプロジェクトは[Apache License 2.0](LICENSE)の下で公開されています。

## 謝辞

このプロジェクトは[Hugging Face](https://huggingface.co/)の[transformers.js-examples](https://github.com/huggingface/transformers.js-examples)を基に作成されています。
