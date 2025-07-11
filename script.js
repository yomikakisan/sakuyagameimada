// ゲーム状態管理
let gameState = {
    isPlaying: false,
    signalShown: false,
    startTime: null,
    gameStarted: false,
    currentReactionTime: null,
    isHighScore: false,
    currentRank: 0
};

// 音声要素
const audioElements = {
    bgm: null,
    cue: null,
    click: null,
    fail: null
};

// 音声設定
let audioSettings = {
    volume: 0.5,
    muted: false
};

// DOM要素の取得
const elements = {
    gameArea: null,
    character: null,
    signal: null,
    instruction: null,
    resultMessage: null,
    shareButton: null,
    retryButton: null,
    ranking: null,
    volumeSlider: null,
    muteButton: null,
    nameInputArea: null,
    playerName: null
};

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', function() {
    initializeGame();
});

// ゲーム初期化
function initializeGame() {
    // DOM要素の取得
    elements.gameArea = document.getElementById('game-area');
    elements.character = document.getElementById('character');
    elements.signal = document.getElementById('signal');
    elements.instruction = document.getElementById('instruction');
    elements.resultMessage = document.getElementById('result-message');
    elements.shareButton = document.getElementById('share-button');
    elements.retryButton = document.getElementById('retry-button');
    elements.ranking = document.getElementById('ranking');
    elements.volumeSlider = document.getElementById('volume-slider');
    elements.muteButton = document.getElementById('mute-button');
    elements.nameInputArea = document.getElementById('name-input-area');
    elements.playerName = document.getElementById('player-name');

    // 音声要素の初期化
    initializeAudio();
    
    // 音量スライダーのイベントリスナー
    elements.volumeSlider.addEventListener('input', function() {
        audioSettings.volume = this.value / 100;
        updateAudioVolume();
    });
    
    // ランキング表示
    renderRanking();
    
    // ゲーム初期状態の表示
    showInitialState();
    
    console.log('ゲーム初期化完了');
}

// 音声初期化
function initializeAudio() {
    try {
        // Web Audio APIを使用した効果音生成
        audioElements.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 効果音を生成する関数
        audioElements.generateTone = function(frequency, duration, type = 'sine') {
            const oscillator = audioElements.audioContext.createOscillator();
            const gainNode = audioElements.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioElements.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, audioElements.audioContext.currentTime);
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0, audioElements.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(audioSettings.volume * 0.3, audioElements.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioElements.audioContext.currentTime + duration);
            
            oscillator.start(audioElements.audioContext.currentTime);
            oscillator.stop(audioElements.audioContext.currentTime + duration);
        };
        
        // 効果音定義
        audioElements.playSuccess = function() {
            if (!audioSettings.muted) {
                audioElements.generateTone(800, 0.1, 'sine');
                setTimeout(() => audioElements.generateTone(1000, 0.1, 'sine'), 100);
            }
        };
        
        audioElements.playFail = function() {
            if (!audioSettings.muted) {
                audioElements.generateTone(200, 0.3, 'sawtooth');
            }
        };
        
        audioElements.playCue = function() {
            if (!audioSettings.muted) {
                audioElements.generateTone(600, 0.2, 'triangle');
            }
        };
        
        console.log('音声初期化完了 (Web Audio API)');
    } catch (error) {
        console.warn('音声システムの初期化に失敗:', error);
        // フォールバック: 音声なしモード
        audioElements.playSuccess = () => console.log('♪ 成功音');
        audioElements.playFail = () => console.log('♪ 失敗音');
        audioElements.playCue = () => console.log('♪ 合図音');
    }
}

// 音量更新
function updateAudioVolume() {
    // Web Audio APIの場合、音量は各効果音関数内で制御される
    console.log(`音量設定: ${audioSettings.muted ? '0' : audioSettings.volume}`);
}

// ミュート切り替え
function toggleMute() {
    audioSettings.muted = !audioSettings.muted;
    updateAudioVolume();
    
    elements.muteButton.textContent = audioSettings.muted ? '🔇' : '🔊';
}

// 初期状態表示
function showInitialState() {
    elements.instruction.innerHTML = `
        <p>クリックしてゲーム開始</p>
        <p>合図が出たら素早くクリック！</p>
    `;
    elements.instruction.style.display = 'block';
    elements.resultMessage.style.display = 'none';
    elements.shareButton.style.display = 'none';
    elements.retryButton.style.display = 'none';
    elements.nameInputArea.style.display = 'none';
    elements.signal.style.display = 'none';
    elements.character.src = 'assets/human01.png';
}

// ゲーム開始処理
function startGame() {
    if (gameState.isPlaying) return;
    
    console.log('ゲーム開始');
    
    gameState.isPlaying = true;
    gameState.signalShown = false;
    gameState.gameStarted = true;
    
    // UI更新
    elements.instruction.style.display = 'none';
    elements.resultMessage.style.display = 'none';
    elements.shareButton.style.display = 'none';
    elements.retryButton.style.display = 'none';
    
    // AudioContextを有効化（ユーザーインタラクション後）
    if (audioElements.audioContext && audioElements.audioContext.state === 'suspended') {
        audioElements.audioContext.resume();
    }
    
    // ランダムな時間後に合図表示（2-5秒）
    const delay = Math.random() * 3000 + 2000;
    console.log(`合図まで ${Math.round(delay)}ms`);
    
    setTimeout(() => {
        showSignal();
    }, delay);
}

// 合図表示
function showSignal() {
    if (!gameState.isPlaying) return;
    
    console.log('合図表示');
    
    gameState.signalShown = true;
    gameState.startTime = performance.now();
    
    // UI更新
    elements.character.src = 'assets/human02.png';
    elements.signal.style.display = 'block';
    
    // 合図音再生
    if (audioElements.playCue) {
        audioElements.playCue();
    }
}

// クリック処理
function handleClick() {
    if (!gameState.gameStarted) {
        // ゲーム開始
        startGame();
        return;
    }
    
    if (!gameState.isPlaying) return;
    
    const clickTime = performance.now();
    
    if (!gameState.signalShown) {
        // フライング
        handleFailure();
        return;
    }
    
    // 成功処理
    const reactionTime = Math.round(clickTime - gameState.startTime);
    handleSuccess(reactionTime);
}

// 成功処理
function handleSuccess(reactionTime) {
    console.log(`成功: ${reactionTime}ms`);
    
    gameState.isPlaying = false;
    gameState.currentReactionTime = reactionTime;
    
    // 成功音再生
    if (audioElements.playSuccess) {
        audioElements.playSuccess();
    }
    
    // UI更新
    elements.resultMessage.textContent = `反応速度：${reactionTime}ms`;
    elements.resultMessage.className = 'success bounce';
    elements.resultMessage.style.display = 'block';
    
    // ハイスコア判定
    checkHighScore(reactionTime);
    
    // 評価メッセージ追加
    setTimeout(() => {
        const evaluation = getEvaluation(reactionTime);
        elements.resultMessage.innerHTML = `
            <div>反応速度：${reactionTime}ms</div>
            <div style="font-size: 0.8em; margin-top: 5px; color: #666;">${evaluation}</div>
        `;
    }, 1000);
}

// 失敗処理
function handleFailure() {
    console.log('フライング');
    
    gameState.isPlaying = false;
    
    // 失敗音再生
    if (audioElements.playFail) {
        audioElements.playFail();
    }
    
    // UI更新
    elements.resultMessage.textContent = '早すぎる！';
    elements.resultMessage.className = 'failure bounce';
    elements.resultMessage.style.display = 'block';
    
    // リトライボタン表示
    elements.retryButton.style.display = 'inline-block';
}

// 評価メッセージ生成
function getEvaluation(ms) {
    if (ms < 200) return '⚡ 超人的！';
    if (ms < 250) return '🔥 素晴らしい！';
    if (ms < 300) return '👍 良い反応！';
    if (ms < 400) return '😊 まずまず';
    if (ms < 500) return '😅 もう少し';
    return '😴 練習あるのみ！';
}

// 音声再生（レガシー関数 - Web Audio APIに移行済み）
function playAudio(audioElement) {
    // この関数は使用されなくなりました
    console.log('レガシー音声関数が呼ばれました');
}

// X投稿機能
function shareToX() {
    if (!gameState.currentReactionTime) return;
    
    const reactionTime = gameState.currentReactionTime;
    const evaluation = getEvaluation(reactionTime);
    const text = `サクヤの「今だ！」に反応できた！\n反応速度：${reactionTime}ms ${evaluation}\n#今だチャレンジ`;
    
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}

// ゲームリセット
function resetGame() {
    console.log('ゲームリセット');
    
    // 状態リセット
    gameState.isPlaying = false;
    gameState.signalShown = false;
    gameState.startTime = null;
    gameState.gameStarted = false;
    gameState.currentReactionTime = null;
    gameState.isHighScore = false;
    gameState.currentRank = 0;
    
    // 名前入力フィールドクリア
    if (elements.playerName) {
        elements.playerName.value = '';
    }
    
    // UI初期化
    showInitialState();
}

// ハイスコア判定
function checkHighScore(reactionTime) {
    try {
        // LocalStorageとオンラインランキングを統合した判定
        const localRanking = JSON.parse(localStorage.getItem('imadaOnlineRanking') || '[]');
        
        // TOP5に入るかチェック（現在のランキングが5件未満、または新スコアが5位より良い場合）
        const isTop5 = localRanking.length < 5 || reactionTime < localRanking[4]?.score;
        
        if (isTop5) {
            // ハイスコア！名前入力を表示
            gameState.isHighScore = true;
            elements.nameInputArea.style.display = 'block';
            elements.playerName.focus();
            
            // Enterキーで登録（セキュリティ強化）
            elements.playerName.onkeypress = function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault(); // デフォルト動作を防止
                    submitScore();
                }
            };
            
            // リアルタイム入力検証
            elements.playerName.oninput = function(e) {
                const value = e.target.value;
                const validation = validateAndSanitizeInput(value);
                
                if (!validation.isValid && value.length > 0) {
                    e.target.style.borderColor = '#dc3545';
                    e.target.title = validation.error;
                } else {
                    e.target.style.borderColor = '#007bff';
                    e.target.title = '日本語、英数字、一般的な記号のみ使用できます';
                }
            };
        } else {
            // 通常スコア表示
            showNormalResult();
        }
    } catch (error) {
        console.error('ハイスコア判定エラー:', error);
        showNormalResult();
    }
}

// 通常結果表示
function showNormalResult() {
    elements.shareButton.style.display = 'inline-block';
    elements.retryButton.style.display = 'inline-block';
}

// セキュリティ: 入力値検証・サニタイズ
function validateAndSanitizeInput(input) {
    if (!input || typeof input !== 'string') {
        return { isValid: false, error: '入力が無効です' };
    }
    
    // 文字数制限
    if (input.length > 20) {
        return { isValid: false, error: '名前は20文字以内で入力してください' };
    }
    
    if (input.length < 1) {
        return { isValid: false, error: '名前を入力してください' };
    }
    
    // 危険な文字の検出
    const dangerousPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // script タグ
        /javascript:/gi, // javascript: スキーム
        /on\w+\s*=/gi, // イベントハンドラー
        /<iframe/gi, // iframe タグ
        /<object/gi, // object タグ
        /<embed/gi, // embed タグ
        /<link/gi, // link タグ
        /<meta/gi, // meta タグ
        /eval\s*\(/gi, // eval 関数
        /document\./gi, // document オブジェクト
        /window\./gi, // window オブジェクト
        /\.\.\//g, // ディレクトリトラバーサル
    ];
    
    for (const pattern of dangerousPatterns) {
        if (pattern.test(input)) {
            return { isValid: false, error: '使用できない文字が含まれています' };
        }
    }
    
    // 許可された文字のみ (日本語、英数字、一般的な記号)
    const allowedPattern = /^[a-zA-Z0-9ひらがなカタカナ一-龯々〇〻ー！？。、・（）()[\]\s\-_]+$/;
    if (!allowedPattern.test(input)) {
        return { isValid: false, error: '使用できない文字が含まれています' };
    }
    
    // HTMLエスケープ
    const sanitized = input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    
    return { isValid: true, sanitized: sanitized.trim() };
}

// スコア登録
function submitScore() {
    const rawPlayerName = elements.playerName.value;
    
    // 入力値検証・サニタイズ
    const validation = validateAndSanitizeInput(rawPlayerName);
    if (!validation.isValid) {
        alert(validation.error);
        return;
    }
    
    const playerName = validation.sanitized;
    
    try {
        // スコア値の検証
        if (!gameState.currentReactionTime || 
            typeof gameState.currentReactionTime !== 'number' ||
            gameState.currentReactionTime < 50 || 
            gameState.currentReactionTime > 10000) {
            alert('無効なスコアです');
            return;
        }
        
        // LocalStorageベースのランキングシステム
        let ranking;
        try {
            const rankingData = localStorage.getItem('imadaOnlineRanking');
            ranking = rankingData ? JSON.parse(rankingData) : [];
            
            // ランキングデータの整合性チェック
            if (!Array.isArray(ranking)) {
                console.warn('ランキングデータが破損しています。初期化します。');
                ranking = [];
            }
        } catch (parseError) {
            console.warn('ランキングデータの解析に失敗:', parseError);
            ranking = [];
        }
        
        // 重複登録防止（同一プレイヤー、同一スコア、短時間内）
        const now = Date.now();
        const recentSubmissions = ranking.filter(record => {
            const recordTime = new Date(record.timestamp).getTime();
            return (now - recordTime) < 10000 && // 10秒以内
                   record.name === playerName &&
                   Math.abs(record.score - gameState.currentReactionTime) < 5; // 5ms以内
        });
        
        if (recentSubmissions.length > 0) {
            alert('同じスコアが短時間で複数回登録されています');
            return;
        }
        
        // 新しいスコアを追加
        const newRecord = {
            name: playerName,
            score: parseInt(gameState.currentReactionTime), // 整数化
            timestamp: new Date().toLocaleString('ja-JP'),
            id: now + Math.random().toString(36).substr(2, 9) // ユニークID
        };
        
        ranking.push(newRecord);
        
        // スコア順でソート（昇順：小さいほど良い）
        ranking.sort((a, b) => a.score - b.score);
        
        // TOP10のみ保持
        const top10 = ranking.slice(0, 10);
        
        // LocalStorageサイズ制限チェック
        const dataString = JSON.stringify(top10);
        if (dataString.length > 50000) { // 50KB制限
            console.warn('ランキングデータが大きすぎます。古いデータを削除します。');
            const top5 = ranking.slice(0, 5);
            localStorage.setItem('imadaOnlineRanking', JSON.stringify(top5));
        } else {
            localStorage.setItem('imadaOnlineRanking', dataString);
        }
        
        // ランク計算
        const rank = top10.findIndex(record => 
            record.name === playerName && 
            record.score === gameState.currentReactionTime && 
            record.timestamp === newRecord.timestamp
        ) + 1;
        
        gameState.currentRank = rank;
        
        // 名前入力エリアを非表示
        elements.nameInputArea.style.display = 'none';
        
        // ランキング更新
        renderRanking(top10);
        
        // ハイスコア表示
        if (rank <= 5) {
            elements.resultMessage.innerHTML = `
                <div>🎉 ${rank}位にランクイン！ 🎉</div>
                <div>反応速度：${gameState.currentReactionTime}ms</div>
                <div style="font-size: 0.8em; margin-top: 5px; color: #666;">${getEvaluation(gameState.currentReactionTime)}</div>
            `;
            elements.resultMessage.className = 'success bounce';
        }
        
        // ボタン表示
        elements.shareButton.style.display = 'inline-block';
        elements.retryButton.style.display = 'inline-block';
        
        console.log(`スコア登録成功: ${playerName} - ${gameState.currentReactionTime}ms (${rank}位)`);
        
    } catch (error) {
        alert('スコア登録に失敗しました');
        console.error('スコア登録エラー:', error);
    }
}

// セキュリティ: 出力エスケープ
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ランキング表示
function renderRanking(rankingData = null) {
    try {
        let ranking = rankingData;
        
        if (!ranking) {
            // LocalStorageからランキング取得
            try {
                const rawData = localStorage.getItem('imadaOnlineRanking');
                ranking = rawData ? JSON.parse(rawData) : [];
                
                // データ整合性チェック
                if (!Array.isArray(ranking)) {
                    ranking = [];
                }
                
                // 各レコードの検証
                ranking = ranking.filter(record => {
                    return record &&
                           typeof record.name === 'string' &&
                           typeof record.score === 'number' &&
                           typeof record.timestamp === 'string' &&
                           record.name.length <= 20 &&
                           record.score >= 50 &&
                           record.score <= 10000;
                });
                
            } catch (parseError) {
                console.warn('ランキングデータの解析エラー:', parseError);
                ranking = [];
            }
        }
        
        if (ranking.length === 0) {
            elements.ranking.innerHTML = '<p>記録がありません</p>';
            return;
        }
        
        const listItems = ranking.slice(0, 5).map((record, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
            // XSS対策: 全ての出力をエスケープ
            const safeName = escapeHtml(record.name);
            const safeScore = parseInt(record.score); // 数値のサニタイズ
            const safeTimestamp = escapeHtml(record.timestamp);
            
            return `<li>${medal} ${safeName} - ${safeScore}ms <small>(${safeTimestamp})</small></li>`;
        }).join('');
        
        elements.ranking.innerHTML = `<ol>${listItems}</ol>`;
        
    } catch (error) {
        console.error('ランキング表示エラー:', error);
        elements.ranking.innerHTML = '<p>ランキング読み込みエラー</p>';
    }
}

// ランキングクリア
function clearRanking() {
    if (confirm('ランキングを全て削除しますか？')) {
        localStorage.removeItem('imadaOnlineRanking');
        localStorage.removeItem('imadaRanking'); // 旧データも削除
        renderRanking();
        console.log('ランキングクリア');
    }
}

// キーボードショートカット
document.addEventListener('keydown', function(event) {
    // スペースキーでクリック
    if (event.code === 'Space') {
        event.preventDefault();
        handleClick();
    }
    
    // Rキーでリセット
    if (event.code === 'KeyR' && !gameState.isPlaying) {
        resetGame();
    }
    
    // Mキーでミュート切り替え
    if (event.code === 'KeyM') {
        toggleMute();
    }
});

// ウィンドウフォーカス時のAudioContext制御
window.addEventListener('focus', function() {
    if (audioElements.audioContext && audioElements.audioContext.state === 'suspended') {
        audioElements.audioContext.resume();
    }
});

window.addEventListener('blur', function() {
    if (audioElements.audioContext && audioElements.audioContext.state === 'running') {
        audioElements.audioContext.suspend();
    }
});

// エラーハンドリング
window.addEventListener('error', function(event) {
    console.error('ゲームエラー:', event.error);
});

// デバッグ用（開発時のみ）
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.gameDebug = {
        gameState,
        audioElements,
        elements,
        resetGame,
        saveScore,
        renderRanking
    };
    console.log('デバッグモード有効', window.gameDebug);
}