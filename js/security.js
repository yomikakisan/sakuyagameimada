/**
 * セキュリティ関連ユーティリティ
 */
class SecurityUtils {
    /**
     * HTMLエスケープ
     * @param {string} unsafe - エスケープする文字列
     * @returns {string} エスケープ済み文字列
     */
    static escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return '';
        
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /**
     * 入力値の検証とサニタイズ
     * @param {string} input - 検証する入力値
     * @returns {Object} 検証結果 { isValid, sanitized, error }
     */
    static validateAndSanitizeInput(input) {
        // 基本チェック
        if (!input || typeof input !== 'string') {
            return { isValid: false, error: '入力が無効です' };
        }
        
        // 文字数制限
        if (input.length > CONFIG.RANKING.MAX_NAME_LENGTH) {
            return { 
                isValid: false, 
                error: `名前は${CONFIG.RANKING.MAX_NAME_LENGTH}文字以内で入力してください` 
            };
        }
        
        if (input.length < 1) {
            return { isValid: false, error: '名前を入力してください' };
        }
        
        // 危険なパターンの検出
        for (const pattern of CONFIG.SECURITY.DANGEROUS_PATTERNS) {
            if (pattern.test(input)) {
                return { isValid: false, error: '使用できない文字が含まれています' };
            }
        }
        
        // 許可された文字のみチェック
        if (!CONFIG.SECURITY.ALLOWED_PATTERN.test(input)) {
            return { isValid: false, error: '使用できない文字が含まれています' };
        }
        
        // HTMLエスケープ
        const sanitized = this.escapeHtml(input.trim());
        
        return { isValid: true, sanitized };
    }

    /**
     * スコア値の検証
     * @param {number} score - 検証するスコア
     * @returns {boolean} 有効かどうか
     */
    static validateScore(score) {
        return typeof score === 'number' &&
               score >= CONFIG.GAME.MIN_VALID_SCORE &&
               score <= CONFIG.GAME.MAX_VALID_SCORE;
    }

    /**
     * ランキングレコードの検証
     * @param {Object} record - 検証するレコード
     * @returns {boolean} 有効かどうか
     */
    static validateRecord(record) {
        return record &&
               typeof record.name === 'string' &&
               typeof record.score === 'number' &&
               typeof record.timestamp === 'string' &&
               record.name.length <= CONFIG.RANKING.MAX_NAME_LENGTH &&
               this.validateScore(record.score);
    }
}

// エクスポート（モジュール対応）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityUtils;
}