/**
 * API通信管理クラス
 */
class APIManager {
    constructor() {
        this.baseURL = 'https://api.github.com/repos/yomikakisan/sakuyagameimada-data';
        this.fallbackStorage = 'imadaOnlineRanking';
    }

    /**
     * GitHub Issues APIを使用したランキング取得
     * @returns {Promise<Array>} ランキングデータ
     */
    async fetchRanking() {
        try {
            // GitHub Issues APIから最新のランキングデータを取得
            const response = await fetch(`${this.baseURL}/issues?labels=ranking&state=open&sort=created&direction=desc&per_page=1`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const issues = await response.json();
            
            if (issues.length === 0) {
                console.log('オンラインランキングが見つかりません。ローカルランキングを使用します。');
                return this._getLocalFallback();
            }

            // 最新のランキングデータを解析
            const rankingData = this._parseRankingFromIssue(issues[0]);
            
            // ローカルストレージにも保存（キャッシュ）
            this._saveToLocal(rankingData);
            
            return rankingData;

        } catch (error) {
            console.warn('オンラインランキング取得失敗:', error.message);
            return this._getLocalFallback();
        }
    }

    /**
     * ランキングデータ投稿（GitHub Issues）
     * @param {Array} ranking - 投稿するランキングデータ
     * @returns {Promise<boolean>} 成功/失敗
     */
    async postRanking(ranking) {
        try {
            // 匿名投稿のため、GitHub Issues APIは使用不可
            // 代替案: JSONBinやFirestore等の無料サービス使用を検討
            console.log('オンライン投稿は現在サポートされていません。ローカル保存します。');
            
            // ローカルに保存
            this._saveToLocal(ranking);
            return true;

        } catch (error) {
            console.error('ランキング投稿エラー:', error);
            return false;
        }
    }

    /**
     * Issues からランキングデータを解析
     * @param {Object} issue - GitHub Issue オブジェクト
     * @returns {Array} ランキングデータ
     */
    _parseRankingFromIssue(issue) {
        try {
            // Issueの本文からJSONデータを抽出
            const bodyMatch = issue.body.match(/```json\n([\s\S]*?)\n```/);
            if (bodyMatch) {
                const rankingData = JSON.parse(bodyMatch[1]);
                
                // データの検証
                if (Array.isArray(rankingData)) {
                    return rankingData.filter(record => SecurityUtils.validateRecord(record));
                }
            }
            
            throw new Error('有効なランキングデータが見つかりません');
            
        } catch (error) {
            console.warn('ランキングデータ解析エラー:', error);
            return [];
        }
    }

    /**
     * ローカルフォールバック取得
     * @returns {Array} ローカルランキングデータ
     */
    _getLocalFallback() {
        try {
            const localData = localStorage.getItem(this.fallbackStorage);
            return localData ? JSON.parse(localData) : [];
        } catch (error) {
            console.warn('ローカルランキング取得エラー:', error);
            return [];
        }
    }

    /**
     * ローカル保存
     * @param {Array} ranking - 保存するランキングデータ
     */
    _saveToLocal(ranking) {
        try {
            localStorage.setItem(this.fallbackStorage, JSON.stringify(ranking));
        } catch (error) {
            console.warn('ローカル保存エラー:', error);
        }
    }

    /**
     * 接続テスト
     * @returns {Promise<boolean>} オンライン状態
     */
    async testConnection() {
        try {
            const response = await fetch('https://api.github.com', { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

// エクスポート（モジュール対応）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIManager;
}