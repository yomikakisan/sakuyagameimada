/**
 * Firebase設定（クライアントサイド用）
 * 簡易的なオンラインランキングシステム
 */
class SimpleOnlineRanking {
    constructor() {
        // JSONBin.io の無料APIを使用（認証不要）
        this.apiUrl = 'https://api.jsonbin.io/v3/b';
        this.binId = '66f8d2e5acd3cb34a87e8b42'; // 専用ビンID（実際には作成が必要）
        this.fallbackKey = 'imadaSharedRanking';
        this.isOnline = false;
        
        this.checkOnlineStatus();
    }

    /**
     * オンライン状態確認
     */
    async checkOnlineStatus() {
        try {
            const response = await fetch('https://httpbin.org/status/200', { method: 'HEAD' });
            this.isOnline = response.ok;
        } catch (error) {
            this.isOnline = false;
        }
    }

    /**
     * 共有ランキング取得
     * @returns {Promise<Array>} ランキングデータ
     */
    async getSharedRanking() {
        // オフラインまたはAPIが使用できない場合はローカルデータを使用
        return this._getLocalRanking();
    }

    /**
     * ランキング更新（ローカルベース）
     * @param {Array} newRanking - 新しいランキングデータ
     * @returns {Promise<boolean>} 成功/失敗
     */
    async updateSharedRanking(newRanking) {
        try {
            // ローカルストレージに保存
            localStorage.setItem(this.fallbackKey, JSON.stringify(newRanking));
            
            // 将来的なオンライン実装のための準備
            console.log('ランキングをローカルに保存しました。オンライン同期は今後実装予定です。');
            
            return true;
        } catch (error) {
            console.error('ランキング保存エラー:', error);
            return false;
        }
    }

    /**
     * 新スコアをマージ
     * @param {Object} newRecord - 新しいスコア記録
     * @returns {Promise<Array>} 更新されたランキング
     */
    async mergeScore(newRecord) {
        try {
            const currentRanking = await this.getSharedRanking();
            
            // 重複チェック
            const isDuplicate = currentRanking.some(record => 
                record.name === newRecord.name && 
                Math.abs(record.score - newRecord.score) < 5 &&
                Math.abs(new Date(record.timestamp).getTime() - new Date(newRecord.timestamp).getTime()) < 60000
            );

            if (isDuplicate) {
                console.log('重複スコアのため追加をスキップします');
                return currentRanking;
            }

            // 新しいスコアを追加
            const updatedRanking = [...currentRanking, newRecord];
            
            // ソートして上位10件を保持
            updatedRanking.sort((a, b) => a.score - b.score);
            const topRanking = updatedRanking.slice(0, 10);

            // 保存
            await this.updateSharedRanking(topRanking);
            
            return topRanking;
            
        } catch (error) {
            console.error('スコアマージエラー:', error);
            throw error;
        }
    }

    /**
     * ローカルランキング取得
     * @returns {Array} ローカルランキングデータ
     */
    _getLocalRanking() {
        try {
            // まず共有ランキングを確認
            let ranking = JSON.parse(localStorage.getItem(this.fallbackKey) || '[]');
            
            // 共有ランキングが空の場合、個人ランキングをマージ
            if (ranking.length === 0) {
                const personalRanking = JSON.parse(localStorage.getItem('imadaOnlineRanking') || '[]');
                if (personalRanking.length > 0) {
                    // 個人ランキングを共有ランキングに移行
                    localStorage.setItem(this.fallbackKey, JSON.stringify(personalRanking));
                    ranking = personalRanking;
                }
            }

            // データ検証
            return ranking.filter(record => SecurityUtils.validateRecord(record));
            
        } catch (error) {
            console.warn('ローカルランキング取得エラー:', error);
            return [];
        }
    }

    /**
     * デバッグ情報取得
     */
    getDebugInfo() {
        return {
            isOnline: this.isOnline,
            localCount: this._getLocalRanking().length,
            fallbackKey: this.fallbackKey
        };
    }
}

// エクスポート（モジュール対応）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SimpleOnlineRanking;
}