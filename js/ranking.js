/**
 * ランキング管理クラス
 */
class RankingManager {
    constructor() {
        this.storageKey = CONFIG.RANKING.STORAGE_KEY;
        this.sharedRanking = new TrulySharedRanking();
    }

    /**
     * ランキングデータ取得（共有ランキング対応）
     * @returns {Promise<Array>} ランキングデータ
     */
    async getRanking() {
        try {
            // 真の共有ランキングから取得
            const ranking = await this.sharedRanking.getSharedRanking();
            
            const filteredRanking = ranking.filter(record => SecurityUtils.validateRecord(record));
            
            return filteredRanking;
        } catch (error) {
            console.warn('共有ランキング取得エラー:', error);
            return this._getLocalFallback();
        }
    }

    /**
     * ローカルフォールバック
     * @returns {Array} ローカルランキングデータ
     */
    _getLocalFallback() {
        try {
            // デモデータを返さず、常に空配列を返す
            return [];
        } catch (parseError) {
            console.warn('ランキングデータの解析エラー:', parseError);
            return [];
        }
    }

    /**
     * スコア登録（共有ランキング対応）
     * @param {string} name - プレイヤー名
     * @param {number} score - スコア
     * @returns {Promise<Object>} 登録結果 { success, rank, isHighScore, ranking }
     */
    async addScore(name, score) {
        try {
            // 入力検証
            const nameValidation = SecurityUtils.validateAndSanitizeInput(name);
            if (!nameValidation.isValid) {
                return { success: false, error: nameValidation.error };
            }

            if (!SecurityUtils.validateScore(score)) {
                return { success: false, error: '無効なスコアです' };
            }

            const sanitizedName = nameValidation.sanitized;
            
            // 新しいレコード作成
            const newRecord = this._createRecord(sanitizedName, score);
            
            // 共有ランキングにマージ
            const updatedRanking = await this.sharedRanking.mergeScore(newRecord);
            
            // ランク計算
            const rank = this._calculateRank(updatedRanking, newRecord);
            const isHighScore = rank <= CONFIG.RANKING.DISPLAY_COUNT;

            return {
                success: true,
                rank,
                isHighScore,
                ranking: updatedRanking
            };

        } catch (error) {
            console.error('スコア登録エラー:', error);
            return { success: false, error: 'スコア登録に失敗しました' };
        }
    }

    /**
     * 重複チェック
     * @param {Array} ranking - 現在のランキング
     * @param {string} name - プレイヤー名
     * @param {number} score - スコア
     * @returns {Object} チェック結果
     */
    _checkDuplicate(ranking, name, score) {
        const now = Date.now();
        const recentSubmissions = ranking.filter(record => {
            const recordTime = new Date(record.timestamp).getTime();
            return (now - recordTime) < CONFIG.RANKING.DUPLICATE_THRESHOLD &&
                   record.name === name &&
                   Math.abs(record.score - score) < CONFIG.RANKING.SCORE_TOLERANCE;
        });

        if (recentSubmissions.length > 0) {
            return { 
                isValid: false, 
                error: '同じスコアが短時間で複数回登録されています' 
            };
        }

        return { isValid: true };
    }

    /**
     * レコード作成
     * @param {string} name - プレイヤー名
     * @param {number} score - スコア
     * @returns {Object} 新しいレコード
     */
    _createRecord(name, score) {
        const now = Date.now();
        return {
            name,
            score: parseInt(score),
            timestamp: new Date().toLocaleString('ja-JP'),
            id: now + Math.random().toString(36).substring(2, 11)
        };
    }

    /**
     * ランキング保存
     * @param {Array} ranking - 保存するランキング
     * @returns {Object} 保存結果
     */
    _saveRanking(ranking) {
        try {
            const dataString = JSON.stringify(ranking);
            
            // サイズチェック
            if (dataString.length > CONFIG.RANKING.MAX_DATA_SIZE) {
                console.warn('ランキングデータが大きすぎます。古いデータを削除します。');
                const reducedRanking = ranking.slice(0, CONFIG.RANKING.DISPLAY_COUNT);
                localStorage.setItem(this.storageKey, JSON.stringify(reducedRanking));
            } else {
                localStorage.setItem(this.storageKey, dataString);
            }

            return { success: true };
        } catch (error) {
            console.error('ランキング保存エラー:', error);
            return { success: false, error: 'ランキング保存に失敗しました' };
        }
    }

    /**
     * ランク計算
     * @param {Array} ranking - ランキングデータ
     * @param {Object} newRecord - 新しいレコード
     * @returns {number} ランク
     */
    _calculateRank(ranking, newRecord) {
        return ranking.findIndex(record => 
            record.name === newRecord.name && 
            record.score === newRecord.score && 
            record.timestamp === newRecord.timestamp
        ) + 1;
    }

    /**
     * TOP5判定（非同期対応）
     * @param {number} score - チェックするスコア
     * @returns {Promise<boolean>} TOP5に入るかどうか
     */
    async isTopScore(score) {
        const ranking = await this.getRanking();
        return ranking.length < CONFIG.RANKING.DISPLAY_COUNT || 
               score < ranking[CONFIG.RANKING.DISPLAY_COUNT - 1]?.score;
    }


    /**
     * 表示用ランキングデータ取得（非同期対応）
     * @returns {Promise<Array>} 表示用データ
     */
    async getDisplayRanking() {
        const ranking = await this.getRanking();
        return ranking.slice(0, CONFIG.RANKING.DISPLAY_COUNT).map((record, index) => ({
            ...record,
            rank: index + 1,
            medal: MEDALS[index] || '',
            safeName: SecurityUtils.escapeHtml(record.name),
            safeTimestamp: SecurityUtils.escapeHtml(record.timestamp)
        }));
    }
}

// エクスポート（モジュール対応）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RankingManager;
}