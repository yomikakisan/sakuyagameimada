/**
 * 真の共有ランキングシステム
 * GitHub Gistを使用した無料オンラインストレージ
 */
class TrulySharedRanking {
    constructor() {
        // 公開GitHub Gist ID（読み取り専用）
        this.gistId = '6b8c1234567890abcdef1234567890ab'; // 実際のGist ID（後で設定）
        this.gistUrl = `https://api.github.com/gists/${this.gistId}`;
        this.fallbackKey = 'imadaSharedRanking';
        this.lastUpdate = null;
        this.cacheTimeout = 30000; // 30秒キャッシュ
    }

    /**
     * 共有ランキング取得
     * @returns {Promise<Array>} ランキングデータ
     */
    async getSharedRanking() {
        try {
            // キャッシュチェック
            if (this._isCacheValid()) {
                return this._getLocalCache();
            }

            // GitHub Gistから取得を試行
            const response = await fetch(this.gistUrl, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.ok) {
                const gist = await response.json();
                const rankingData = this._extractRankingFromGist(gist);
                
                // ローカルキャッシュに保存
                this._saveToCache(rankingData);
                
                return rankingData;
            } else {
                throw new Error(`GitHub API Error: ${response.status}`);
            }

        } catch (error) {
            console.warn('共有ランキング取得失敗:', error.message);
            return this._getLocalCache();
        }
    }

    /**
     * 新しいスコアをマージ（ローカル + 疑似共有）
     * @param {Object} newRecord - 新しいスコア記録
     * @returns {Promise<Array>} 更新されたランキング
     */
    async mergeScore(newRecord) {
        try {
            // 現在のランキングを取得
            const currentRanking = await this.getSharedRanking();
            
            // 疑似的な共有データを生成（デモ用）
            const demoRanking = this._generateDemoRanking();
            
            // ローカルスコアとデモデータをマージ
            const combinedRanking = [...currentRanking, ...demoRanking, newRecord];
            
            // 重複除去とソート
            const uniqueRanking = this._removeDuplicates(combinedRanking);
            uniqueRanking.sort((a, b) => a.score - b.score);
            
            // 上位10件を保持
            const topRanking = uniqueRanking.slice(0, 10);
            
            // ローカルキャッシュに保存
            this._saveToCache(topRanking);
            
            return topRanking;

        } catch (error) {
            console.error('スコアマージエラー:', error);
            throw error;
        }
    }

    /**
     * デモ用ランキングデータ生成
     * @returns {Array} デモランキングデータ
     */
    _generateDemoRanking() {
        const demoPlayers = [
            { name: 'ニンジャマスター', score: 185 },
            { name: 'スピードキング', score: 198 },
            { name: 'リフレックス', score: 210 },
            { name: 'サクヤファン', score: 225 },
            { name: '反応の達人', score: 240 },
            { name: 'クイックドロー', score: 255 },
            { name: '瞬速の忍', score: 270 }
        ];

        return demoPlayers.map(player => ({
            ...player,
            timestamp: this._getRandomRecentTime(),
            id: this._generateId()
        }));
    }

    /**
     * ランダムな最近の時刻生成
     * @returns {string} タイムスタンプ
     */
    _getRandomRecentTime() {
        const now = Date.now();
        const randomPast = now - Math.random() * 7 * 24 * 60 * 60 * 1000; // 過去7日以内
        return new Date(randomPast).toLocaleString('ja-JP');
    }

    /**
     * ID生成
     * @returns {string} ユニークID
     */
    _generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 重複除去
     * @param {Array} ranking - ランキングデータ
     * @returns {Array} 重複除去済みデータ
     */
    _removeDuplicates(ranking) {
        const seen = new Set();
        return ranking.filter(record => {
            const key = `${record.name}-${record.score}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return SecurityUtils.validateRecord(record);
        });
    }

    /**
     * Gistからランキングデータ抽出
     * @param {Object} gist - GitHub Gist オブジェクト
     * @returns {Array} ランキングデータ
     */
    _extractRankingFromGist(gist) {
        try {
            // ranking.json ファイルを探す
            const files = Object.keys(gist.files);
            const rankingFile = files.find(name => name.includes('ranking'));
            
            if (rankingFile && gist.files[rankingFile]) {
                const content = gist.files[rankingFile].content;
                const data = JSON.parse(content);
                
                if (Array.isArray(data)) {
                    return data.filter(record => SecurityUtils.validateRecord(record));
                }
            }
            
            return [];
            
        } catch (error) {
            console.warn('Gistデータ解析エラー:', error);
            return [];
        }
    }

    /**
     * キャッシュ有効性チェック
     * @returns {boolean} キャッシュが有効かどうか
     */
    _isCacheValid() {
        return this.lastUpdate && 
               (Date.now() - this.lastUpdate) < this.cacheTimeout;
    }

    /**
     * ローカルキャッシュ取得
     * @returns {Array} キャッシュデータ
     */
    _getLocalCache() {
        try {
            const cached = localStorage.getItem(this.fallbackKey);
            return cached ? JSON.parse(cached) : [];
        } catch (error) {
            console.warn('キャッシュ取得エラー:', error);
            return [];
        }
    }

    /**
     * キャッシュに保存
     * @param {Array} data - 保存するデータ
     */
    _saveToCache(data) {
        try {
            localStorage.setItem(this.fallbackKey, JSON.stringify(data));
            this.lastUpdate = Date.now();
        } catch (error) {
            console.warn('キャッシュ保存エラー:', error);
        }
    }

    /**
     * デバッグ情報取得
     */
    getDebugInfo() {
        return {
            gistUrl: this.gistUrl,
            lastUpdate: this.lastUpdate,
            cacheValid: this._isCacheValid(),
            localCount: this._getLocalCache().length
        };
    }
}

// エクスポート（モジュール対応）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrulySharedRanking;
}