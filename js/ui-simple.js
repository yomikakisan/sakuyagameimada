/**
 * 簡単なUI管理クラス（ランキング機能なし）
 */
class SimpleUIManager {
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
            'volume-slider', 'mute-button'
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
    }

    /**
     * ケバブケースをキャメルケースに変換
     */
    _camelCase(str) {
        return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    }

    /**
     * 初期状態表示
     */
    showInitialState() {
        this._hideSignal();
        this._showInstruction();
        this._clearResultMessage();
        this._hideActionButtons();
    }

    /**
     * ゲーム開始状態表示
     */
    showGameStarted() {
        this._hideInstruction();
        this._clearResultMessage();
        this._hideActionButtons();
    }

    /**
     * 合図表示
     */
    showSignal() {
        this._showSignal();
    }

    /**
     * 成功結果表示
     * @param {number} reactionTime - 反応時間
     */
    showSuccessResult(reactionTime) {
        this._hideSignal();
        this._setResultMessage(`反応時間: ${reactionTime}ms`, 'success');
        this._showActionButtons();
    }

    /**
     * 失敗結果表示
     */
    showFailureResult() {
        this._hideSignal();
        this._setResultMessage('フライング！合図を待ってからクリックしてください', 'failure');
        this._showActionButtons();
    }

    /**
     * 通常結果表示
     */
    showNormalResult() {
        this._showActionButtons();
    }

    /**
     * エラー表示
     * @param {string} message - エラーメッセージ
     */
    showError(message) {
        this._setResultMessage(message, 'error');
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

    // プライベートメソッド

    /**
     * 指示表示
     */
    _showInstruction() {
        this._setElementDisplay('instruction', true);
    }

    /**
     * 指示非表示
     */
    _hideInstruction() {
        this._setElementDisplay('instruction', false);
    }

    /**
     * 合図表示
     */
    _showSignal() {
        this._setElementDisplay('signal', true);
    }

    /**
     * 合図非表示
     */
    _hideSignal() {
        this._setElementDisplay('signal', false);
    }

    /**
     * 結果メッセージ設定
     * @param {string} message - メッセージ
     * @param {string} type - メッセージタイプ
     */
    _setResultMessage(message, type = 'info') {
        if (this.elements.resultMessage) {
            this.elements.resultMessage.textContent = message;
            this.elements.resultMessage.className = `result-message ${type}`;
        }
    }

    /**
     * 結果メッセージクリア
     */
    _clearResultMessage() {
        if (this.elements.resultMessage) {
            this.elements.resultMessage.textContent = '';
            this.elements.resultMessage.className = 'result-message';
        }
    }

    /**
     * アクションボタン表示
     */
    _showActionButtons() {
        this._setElementDisplay('shareButton', true);
        this._setElementDisplay('retryButton', true);
    }

    /**
     * アクションボタン非表示
     */
    _hideActionButtons() {
        this._setElementDisplay('shareButton', false);
        this._setElementDisplay('retryButton', false);
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
     * 音量変更コールバック
     * @param {number} volume - 音量（0-1）
     */
    _onVolumeChange(volume) {
        if (window.game && window.game.audioManager) {
            window.game.audioManager.setVolume(volume);
        }
    }

    /**
     * キーボード処理
     * @param {KeyboardEvent} event - キーボードイベント
     */
    _handleKeydown(event) {
        if (window.game && window.game.handleKeydown) {
            window.game.handleKeydown(event);
        }
    }
}

// グローバル参照用
window.SimpleUIManager = SimpleUIManager;

// エクスポート（モジュール対応）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SimpleUIManager;
}