/**
 * UI管理クラス
 */
class UIManager {
    constructor() {
        this.elements = {};
        this.init();
    }

    /**
     * UI初期化
     */
    init() {
        this._initializeElements();
        this._setupEventListeners();
    }

    /**
     * DOM要素の取得と初期化
     */
    _initializeElements() {
        const elementIds = [
            'game-area', 'character', 'signal', 'instruction',
            'result-message', 'share-button', 'retry-button',
            'ranking', 'volume-slider', 'mute-button',
            'name-input-area', 'player-name'
        ];

        elementIds.forEach(id => {
            this.elements[this._camelCase(id)] = document.getElementById(id);
        });

        console.log('UI要素初期化完了');
    }

    /**
     * イベントリスナー設定
     */
    _setupEventListeners() {
        // 音量スライダー
        if (this.elements.volumeSlider) {
            this.elements.volumeSlider.addEventListener('input', (e) => {
                const volume = e.target.value / 100;
                this._onVolumeChange(volume);
            });
        }

        // キーボードショートカット
        document.addEventListener('keydown', (e) => {
            this._handleKeydown(e);
        });

        // ウィンドウフォーカス制御
        window.addEventListener('focus', () => this._onWindowFocus());
        window.addEventListener('blur', () => this._onWindowBlur());
    }

    /**
     * ケバブケースをキャメルケースに変換
     * @param {string} str - 変換する文字列
     * @returns {string} キャメルケース文字列
     */
    _camelCase(str) {
        return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    }

    /**
     * 初期状態表示
     */
    showInitialState() {
        this.elements.instruction.innerHTML = `
            <p>クリックしてゲーム開始</p>
            <p>合図が出たら素早くクリック！</p>
        `;
        this._setElementDisplay('instruction', true);
        this._setElementDisplay('resultMessage', false);
        this._setElementDisplay('shareButton', false);
        this._setElementDisplay('retryButton', false);
        this._setElementDisplay('nameInputArea', false);
        this._setElementDisplay('signal', false);
        
        if (this.elements.character) {
            this.elements.character.src = 'assets/human01.png';
        }
    }

    /**
     * ゲーム開始時UI更新
     */
    showGameStarted() {
        this._setElementDisplay('instruction', false);
        this._setElementDisplay('resultMessage', false);
        this._setElementDisplay('shareButton', false);
        this._setElementDisplay('retryButton', false);
    }

    /**
     * 合図表示
     */
    showSignal() {
        if (this.elements.character) {
            this.elements.character.src = 'assets/human02.png';
        }
        this._setElementDisplay('signal', true);
    }

    /**
     * 成功結果表示
     * @param {number} reactionTime - 反応時間
     */
    showSuccessResult(reactionTime) {
        this.elements.resultMessage.textContent = `反応速度：${reactionTime}ms`;
        this.elements.resultMessage.className = 'success bounce';
        this._setElementDisplay('resultMessage', true);

        // 評価メッセージを遅延表示
        setTimeout(() => {
            const evaluation = this._getEvaluation(reactionTime);
            this.elements.resultMessage.innerHTML = `
                <div>反応速度：${reactionTime}ms</div>
                <div style="font-size: 0.8em; margin-top: 5px; color: #666;">${evaluation}</div>
            `;
        }, CONFIG.UI.EVALUATION_DELAY);
    }

    /**
     * 失敗結果表示
     */
    showFailureResult() {
        this.elements.resultMessage.textContent = '早すぎる！';
        this.elements.resultMessage.className = 'failure bounce';
        this._setElementDisplay('resultMessage', true);
        this._setElementDisplay('retryButton', true);
    }

    /**
     * ハイスコア入力表示
     * @param {Function} onSubmit - 送信コールバック
     */
    showHighScoreInput(onSubmit) {
        this._setElementDisplay('nameInputArea', true);
        this.elements.playerName.focus();

        // リアルタイム検証
        this.elements.playerName.oninput = (e) => {
            this._validateNameInput(e.target);
        };

        // Enter キー処理
        this.elements.playerName.onkeypress = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                onSubmit();
            }
        };
    }

    /**
     * ハイスコア結果表示
     * @param {number} rank - ランク
     * @param {number} reactionTime - 反応時間
     */
    showHighScoreResult(rank, reactionTime) {
        const evaluation = this._getEvaluation(reactionTime);
        this.elements.resultMessage.innerHTML = `
            <div>🎉 ${rank}位にランクイン！ 🎉</div>
            <div>反応速度：${reactionTime}ms</div>
            <div style="font-size: 0.8em; margin-top: 5px; color: #666;">${evaluation}</div>
        `;
        this.elements.resultMessage.className = 'success bounce';
        this._hideNameInput();
        this._showActionButtons();
    }

    /**
     * 通常結果表示
     */
    showNormalResult() {
        this._showActionButtons();
    }

    /**
     * ランキング表示
     * @param {Array} displayRanking - 表示用ランキングデータ
     */
    renderRanking(displayRanking) {
        if (!this.elements.ranking) return;

        if (displayRanking.length === 0) {
            this.elements.ranking.innerHTML = '<p>記録がありません</p>';
            return;
        }

        const listItems = displayRanking.map(record => 
            `<li>${record.medal} ${record.safeName} - ${record.score}ms <small>(${record.safeTimestamp})</small></li>`
        ).join('');

        this.elements.ranking.innerHTML = `<ol>${listItems}</ol>`;
    }

    /**
     * アクションボタン表示
     */
    _showActionButtons() {
        this._setElementDisplay('shareButton', true);
        this._setElementDisplay('retryButton', true);
    }

    /**
     * 名前入力エリア非表示
     */
    _hideNameInput() {
        this._setElementDisplay('nameInputArea', false);
        if (this.elements.playerName) {
            this.elements.playerName.value = '';
        }
    }

    /**
     * 要素の表示/非表示切り替え
     * @param {string} elementKey - 要素キー
     * @param {boolean} visible - 表示するかどうか
     */
    _setElementDisplay(elementKey, visible) {
        const element = this.elements[elementKey];
        if (element) {
            element.style.display = visible ? 'block' : 'none';
        }
    }

    /**
     * 評価メッセージ取得
     * @param {number} ms - 反応時間
     * @returns {string} 評価メッセージ
     */
    _getEvaluation(ms) {
        return EVALUATION_MESSAGES.find(item => ms < item.max)?.message || '😴 練習あるのみ！';
    }

    /**
     * 名前入力の検証
     * @param {HTMLElement} inputElement - 入力要素
     */
    _validateNameInput(inputElement) {
        const value = inputElement.value;
        const validation = SecurityUtils.validateAndSanitizeInput(value);

        if (!validation.isValid && value.length > 0) {
            inputElement.style.borderColor = CONFIG.UI.ERROR_BORDER_COLOR;
            inputElement.title = validation.error;
        } else {
            inputElement.style.borderColor = CONFIG.UI.SUCCESS_BORDER_COLOR;
            inputElement.title = '日本語、英数字、一般的な記号のみ使用できます';
        }
    }

    /**
     * ミュートボタン更新
     * @param {boolean} muted - ミュート状態
     */
    updateMuteButton(muted) {
        if (this.elements.muteButton) {
            this.elements.muteButton.textContent = muted ? '🔇' : '🔊';
        }
    }

    /**
     * 音量変更コールバック
     * @param {number} volume - 音量
     */
    _onVolumeChange(volume) {
        // Game クラスから設定される
        if (window.game && window.game.audioManager) {
            window.game.audioManager.setVolume(volume);
        }
    }

    /**
     * キーボード処理
     * @param {KeyboardEvent} event - キーボードイベント
     */
    _handleKeydown(event) {
        if (window.game) {
            window.game.handleKeydown(event);
        }
    }

    /**
     * ウィンドウフォーカス時の処理
     */
    _onWindowFocus() {
        if (window.game && window.game.audioManager) {
            window.game.audioManager.resume();
        }
    }

    /**
     * ウィンドウブラー時の処理
     */
    _onWindowBlur() {
        if (window.game && window.game.audioManager) {
            window.game.audioManager.suspend();
        }
    }

    /**
     * プレイヤー名取得
     * @returns {string} 入力された名前
     */
    getPlayerName() {
        return this.elements.playerName ? this.elements.playerName.value : '';
    }

    /**
     * エラー表示
     * @param {string} message - エラーメッセージ
     */
    showError(message) {
        alert(message); // 後でよりよいUI表示に変更可能
    }
}

// エクスポート（モジュール対応）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
}