/**
 * 音声システム管理クラス
 */
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.settings = {
            volume: CONFIG.AUDIO.DEFAULT_VOLUME,
            muted: false
        };
        this.init();
    }

    /**
     * 音声システム初期化
     */
    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('音声初期化完了 (Web Audio API)');
        } catch (error) {
            console.warn('音声システムの初期化に失敗:', error);
            this._createFallbackMethods();
        }
    }

    /**
     * フォールバック音声メソッド作成
     */
    _createFallbackMethods() {
        this.playSuccess = () => console.log('♪ 成功音');
        this.playFail = () => console.log('♪ 失敗音');
        this.playCue = () => console.log('♪ 合図音');
    }

    /**
     * トーン生成
     * @param {number} frequency - 周波数
     * @param {number} duration - 持続時間
     * @param {string} type - 波形タイプ
     */
    _generateTone(frequency, duration, type = 'sine') {
        if (!this.audioContext || this.settings.muted) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = type;
            
            const volume = this.settings.volume * CONFIG.AUDIO.TONE_VOLUME;
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (error) {
            console.warn('音声生成エラー:', error);
        }
    }

    /**
     * 成功音再生
     */
    playSuccess() {
        if (this.settings.muted) return;
        
        this._generateTone(CONFIG.AUDIO.SUCCESS_FREQ[0], 0.1, 'sine');
        setTimeout(() => {
            this._generateTone(CONFIG.AUDIO.SUCCESS_FREQ[1], 0.1, 'sine');
        }, 100);
    }

    /**
     * 失敗音再生
     */
    playFail() {
        if (this.settings.muted) return;
        this._generateTone(CONFIG.AUDIO.FAIL_FREQ, 0.3, 'sawtooth');
    }

    /**
     * 合図音再生
     */
    playCue() {
        if (this.settings.muted) return;
        this._generateTone(CONFIG.AUDIO.CUE_FREQ, 0.2, 'triangle');
    }

    /**
     * 音量設定
     * @param {number} volume - 音量 (0-1)
     */
    setVolume(volume) {
        this.settings.volume = Math.max(0, Math.min(1, volume));
        console.log(`音量設定: ${this.settings.muted ? '0' : this.settings.volume}`);
    }

    /**
     * ミュート切り替え
     */
    toggleMute() {
        this.settings.muted = !this.settings.muted;
        return this.settings.muted;
    }

    /**
     * AudioContext再開（ユーザーインタラクション後）
     */
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    /**
     * AudioContext一時停止
     */
    suspend() {
        if (this.audioContext && this.audioContext.state === 'running') {
            this.audioContext.suspend();
        }
    }

    /**
     * 音声システム状態取得
     */
    getState() {
        return {
            volume: this.settings.volume,
            muted: this.settings.muted,
            contextState: this.audioContext ? this.audioContext.state : 'unavailable'
        };
    }
}

// エクスポート（モジュール対応）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioManager;
}