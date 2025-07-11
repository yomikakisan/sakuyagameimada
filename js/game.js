/**
 * メインゲームクラス
 */
class Game {
    constructor() {
        this.state = {
            isPlaying: false,
            signalShown: false,
            startTime: null,
            gameStarted: false,
            currentReactionTime: null,
            isHighScore: false,
            currentRank: 0
        };

        // 依存クラス初期化
        this.audioManager = new AudioManager();
        this.uiManager = new SimpleUIManager();

        this.init();
    }

    /**
     * ゲーム初期化
     */
    init() {
        this._setupGameArea();
        this.uiManager.showInitialState();
        
        // グローバル参照設定（UIManagerのコールバック用）
        window.game = this;
    }

    /**
     * ゲームエリアのクリックイベント設定
     */
    _setupGameArea() {
        const gameArea = this.uiManager.elements.gameArea;
        if (gameArea) {
            gameArea.onclick = () => this.handleClick();
        }
    }

    /**
     * ゲーム開始
     */
    startGame() {
        if (this.state.isPlaying) return;

        this._resetState();
        this.state.isPlaying = true;
        this.state.gameStarted = true;

        this.uiManager.showGameStarted();
        this.audioManager.resume();

        // ランダム遅延後に合図表示
        const delay = this._generateRandomDelay();

        setTimeout(() => {
            this._showSignal();
        }, delay);
    }

    /**
     * 合図表示
     */
    _showSignal() {
        if (!this.state.isPlaying) return;

        this.state.signalShown = true;
        this.state.startTime = performance.now();

        this.uiManager.showSignal();
        this.audioManager.playCue();
    }

    /**
     * クリック処理
     */
    handleClick() {
        if (!this.state.gameStarted) {
            this.startGame();
            return;
        }

        if (!this.state.isPlaying) return;

        const clickTime = performance.now();

        if (!this.state.signalShown) {
            this._handleFailure();
            return;
        }

        const reactionTime = Math.round(clickTime - this.state.startTime);
        this._handleSuccess(reactionTime);
    }

    /**
     * 成功処理
     * @param {number} reactionTime - 反応時間
     */
    _handleSuccess(reactionTime) {
        this.state.isPlaying = false;
        this.state.currentReactionTime = reactionTime;

        this.audioManager.playSuccess();
        this.uiManager.showSuccessResult(reactionTime);

        this._checkHighScore(reactionTime);
    }

    /**
     * 失敗処理
     */
    _handleFailure() {
        this.state.isPlaying = false;
        this.audioManager.playFail();
        this.uiManager.showFailureResult();
    }

    /**
     * 結果表示（ランキング機能停止中）
     * @param {number} reactionTime - 反応時間
     */
    _checkHighScore(reactionTime) {
        // ランキング機能停止中のため、単純な結果表示のみ
        this.uiManager.showNormalResult();
    }

    /**
     * スコア登録（ランキング機能停止中）
     */
    submitScore() {
        // ランキング機能停止中
        console.log('ランキング機能は一時停止中です');
    }

    /**
     * X投稿
     */
    shareToX() {
        if (!this.state.currentReactionTime) return;

        const reactionTime = this.state.currentReactionTime;
        const evaluation = EVALUATION_MESSAGES.find(item => reactionTime < item.max)?.message || '';
        const text = `サクヤの「今だ！」に反応できた！\\n反応速度：${reactionTime}ms ${evaluation}\\n${CONFIG.URLS.HASHTAG}`;

        const url = `${CONFIG.URLS.TWITTER_INTENT}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    }

    /**
     * ゲームリセット
     */
    resetGame() {
        this._resetState();
        this.uiManager.showInitialState();
    }


    /**
     * ミュート切り替え
     */
    toggleMute() {
        const muted = this.audioManager.toggleMute();
        this.uiManager.updateMuteButton(muted);
    }

    /**
     * キーボード処理
     * @param {KeyboardEvent} event - キーボードイベント
     */
    handleKeydown(event) {
        switch (event.code) {
            case 'Space':
                event.preventDefault();
                this.handleClick();
                break;
            case 'KeyR':
                if (!this.state.isPlaying) {
                    this.resetGame();
                }
                break;
            case 'KeyM':
                this.toggleMute();
                break;
        }
    }


    /**
     * 状態リセット
     */
    _resetState() {
        this.state.isPlaying = false;
        this.state.signalShown = false;
        this.state.startTime = null;
        this.state.gameStarted = false;
        this.state.currentReactionTime = null;
        this.state.isHighScore = false;
        this.state.currentRank = 0;
    }

    /**
     * ランダム遅延時間生成
     * @returns {number} 遅延時間(ms)
     */
    _generateRandomDelay() {
        const range = CONFIG.GAME.MAX_DELAY - CONFIG.GAME.MIN_DELAY;
        return Math.random() * range + CONFIG.GAME.MIN_DELAY;
    }

    // ランキング関連のメソッドは一時停止中

    /**
     * デバッグ情報取得
     * @returns {Object} デバッグ情報
     */
    getDebugInfo() {
        return {
            state: this.state,
            audioState: this.audioManager.getState()
        };
    }
}

// エクスポート（モジュール対応）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Game;
}