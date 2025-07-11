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
        this.rankingManager = new RankingManager();
        this.uiManager = new UIManager();

        this.init();
    }

    /**
     * ゲーム初期化
     */
    async init() {
        console.log('DEBUG: ゲーム初期化開始 - バージョン 2.0');
        this._setupGameArea();
        
        // 非同期でランキング読み込み
        try {
            const displayRanking = await this.rankingManager.getDisplayRanking();
            this.uiManager.renderRanking(displayRanking);
        } catch (error) {
            console.warn('ランキング初期化エラー:', error);
            this.uiManager.renderRanking([]);
        }
        
        this.uiManager.showInitialState();
        
        // グローバル参照設定（UIManagerのコールバック用）
        window.game = this;
        
        console.log('ゲーム初期化完了 - バージョン 2.0');
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

        console.log('ゲーム開始');

        this._resetState();
        this.state.isPlaying = true;
        this.state.gameStarted = true;

        this.uiManager.showGameStarted();
        this.audioManager.resume();

        // ランダム遅延後に合図表示
        const delay = this._generateRandomDelay();
        console.log(`合図まで ${Math.round(delay)}ms`);

        setTimeout(() => {
            this._showSignal();
        }, delay);
    }

    /**
     * 合図表示
     */
    _showSignal() {
        if (!this.state.isPlaying) return;

        console.log('合図表示');

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
        console.log(`成功: ${reactionTime}ms`);

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
        console.log('フライング');

        this.state.isPlaying = false;
        this.audioManager.playFail();
        this.uiManager.showFailureResult();
    }

    /**
     * ハイスコア判定（非同期対応）
     * @param {number} reactionTime - 反応時間
     */
    async _checkHighScore(reactionTime) {
        try {
            const isTop5 = await this.rankingManager.isTopScore(reactionTime);

            if (isTop5) {
                this.state.isHighScore = true;
                this.uiManager.showHighScoreInput(() => this.submitScore());
            } else {
                this.uiManager.showNormalResult();
            }
        } catch (error) {
            console.error('ハイスコア判定エラー:', error);
            this.uiManager.showNormalResult();
        }
    }

    /**
     * スコア登録（非同期対応）
     */
    async submitScore() {
        const playerName = this.uiManager.getPlayerName();
        
        console.log('=== スコア登録開始 ===');
        console.log('プレイヤー名:', playerName);
        console.log('反応時間:', this.state.currentReactionTime);
        console.log('ハイスコア状態:', this.state.isHighScore);
        
        if (!playerName.trim()) {
            console.log('エラー: 名前が入力されていません');
            this.uiManager.showError('名前を入力してください');
            return;
        }

        try {
            console.log('addScore呼び出し開始...');
            const result = await this.rankingManager.addScore(playerName, this.state.currentReactionTime);
            console.log('addScore完了、結果:', result);

            if (result.success) {
                this.state.currentRank = result.rank;
                console.log('登録成功 - ランク:', result.rank);
                
                // ランキング表示を更新
                console.log('ランキング表示更新開始...');
                const displayRanking = await this.rankingManager.getDisplayRanking();
                console.log('表示用ランキングデータ:', displayRanking);
                this.uiManager.renderRanking(displayRanking);
                console.log('ランキング表示更新完了');

                if (result.isHighScore) {
                    console.log('ハイスコア結果表示');
                    this.uiManager.showHighScoreResult(result.rank, this.state.currentReactionTime);
                } else {
                    console.log('通常結果表示');
                    this.uiManager.showNormalResult();
                }

                console.log(`=== スコア登録完了: ${playerName} - ${this.state.currentReactionTime}ms (${result.rank}位) ===`);
            } else {
                console.error('登録失敗:', result.error);
                this.uiManager.showError(result.error);
            }
        } catch (error) {
            console.error('=== スコア登録エラー ===', error);
            this.uiManager.showError('スコア登録に失敗しました');
        }
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
        console.log('ゲームリセット');

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

    /**
     * デバッグ情報取得
     * @returns {Object} デバッグ情報
     */
    getDebugInfo() {
        return {
            state: this.state,
            audioState: this.audioManager.getState(),
            rankingCount: this.rankingManager.getRanking().length
        };
    }
}

// エクスポート（モジュール対応）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Game;
}