
# 🎮「今だ！ゲーム」仕様書（Claude Code向け・コピペ用）

## ✅ ゲーム概要

- タイトル：**今だ！ゲーム**
- 内容：  
  忍者「サクヤ」が発する「今だ！」の合図を待ち、できるだけ素早くクリックして反応速度（ms）を競うミニゲーム。
- 技術構成：HTML / CSS / JavaScript（バニラJS）

---

## 📁 ディレクトリ構成（素材は assets フォルダに）

```
project-root/
├── index.html
├── style.css
├── script.js
└── assets/
    ├── background.jpg      // 背景画像（1024x768）
    ├── human01.png         // 通常立ち絵（口閉じ）
    ├── human02.png         // 差分：口開け・強気
    ├── ui.png              // 「今だ！」の合図UI
    ├── bgm.mp3             // BGM（ループ）
    ├── cue.mp3             // 合図出現音
    ├── click.mp3           // 成功音
    ├── fail.mp3            // フライング音
```

---

## 🖥️ 表示内容（UI仕様）

| 要素 | 内容 |
|------|------|
| 背景画像 | `background.jpg` を全面に表示 |
| サクヤ立ち絵 | 初期：`human01.png` / 合図後：`human02.png` |
| 合図UI | `ui.png` を中央に表示（合図タイミング） |
| テキスト表示 | 反応速度（例：「反応速度：235ms」）を表示 |
| フライング時 | 「早すぎる！」の文字を表示 |
| シェアボタン | 成功時のみ「結果をXでシェア」ボタン表示 |

---

## 🎧 BGM & 効果音仕様

| タイミング | 音源 | ファイル名 |
|------------|------|-------------|
| ゲーム開始時 | BGM（ループ） | `bgm.mp3` |
| 合図表示時 | SE（合図） | `cue.mp3` |
| 成功クリック | SE（決定） | `click.mp3` |
| 早押し失敗時 | SE（エラー） | `fail.mp3` |

※ BGMは `.play()` を初回クリック後に実行することで、ブラウザ制限を回避。

---

## 🐦 X（旧Twitter）投稿機能

- 成功時に `#今だチャレンジ` のハッシュタグ付きでスコアを投稿。
- WebIntent を使って新しいタブで投稿画面を開く。

```javascript
const text = `サクヤの「今だ！」に反応できた！反応速度：${reactionTime}ms #今だチャレンジ`;
const url = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
window.open(url, '_blank');
```

---

## 🧠 JavaScript構成要素（概要）

```javascript
// 初期化
let startTime;
let signalShown = false;

// BGM & 効果音
const bgm = new Audio('assets/bgm.mp3'); bgm.loop = true;
const cue = new Audio('assets/cue.mp3');
const click = new Audio('assets/click.mp3');
const fail = new Audio('assets/fail.mp3');

// ゲームスタート関数
function startGame() {
  bgm.play();
  // 2〜5秒後にランダムで合図
  setTimeout(() => {
    document.getElementById('signal').style.display = 'block';
    document.getElementById('character').src = 'assets/human02.png';
    cue.play();
    startTime = Date.now();
    signalShown = true;
  }, Math.random() * 3000 + 2000);
}

// クリック時の処理
function handleClick() {
  if (!signalShown) {
    fail.play();
    showMessage("早すぎる！");
    return;
  }
  const reactionTime = Date.now() - startTime;
  click.play();
  showMessage(`反応速度：${reactionTime}ms`);
  showShareButton(reactionTime);
}
```

---

## 🔁 フローまとめ

1. ページロード → `startGame()` 自動開始  
2. 数秒後に `ui.png` 合図＋表情差分表示  
3. プレイヤーがクリック：  
   - 成功 → 反応速度表示＋SE＋X投稿可  
   - 失敗 → 「早すぎる！」表示＋SE  
4. リトライ可能（リロード or `startGame()` 再実行）


---

## 🏆 ローカルランキング機能（LocalStorage使用）

### 概要

- プレイヤーの反応速度をブラウザのLocalStorageに保存し、上位5件を表示します。
- 成功時のみスコア登録、ページ下部にランキング表示。

### 📦 データ構造（JSON）

```json
[
  { "score": 218, "timestamp": "2025-07-11 10:05" },
  { "score": 233, "timestamp": "2025-07-11 09:42" }
]
```

### 🔧 実装要点（script.js）

```javascript
function saveScore(ms) {
  const records = JSON.parse(localStorage.getItem("imadaRanking") || "[]");
  records.push({ score: ms, timestamp: new Date().toLocaleString() });
  records.sort((a, b) => a.score - b.score);
  localStorage.setItem("imadaRanking", JSON.stringify(records.slice(0, 5)));
  renderRanking();
}

function renderRanking() {
  const records = JSON.parse(localStorage.getItem("imadaRanking") || "[]");
  const list = records.map(r => `<li>${r.score}ms - ${r.timestamp}</li>`).join("");
  document.getElementById("ranking").innerHTML = `<ol>${list}</ol>`;
}
```

### 🖥️ HTML表示部（index.html）

```html
<div id="ranking-section">
  <h3>ランキングTOP5</h3>
  <div id="ranking"></div>
</div>
```

### 📌 呼び出し箇所

- `handleClick()` 成功時 → `saveScore(reactionTime);`
- ページロード時 → `renderRanking();`
