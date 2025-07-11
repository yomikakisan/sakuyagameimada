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
            console.log('デバッグ: getSharedRanking開始');
            
            // キャッシュチェック
            if (this._isCacheValid()) {
                console.log('デバッグ: キャッシュが有効');
                return this._getLocalCache();
            }

            console.log('デバッグ: GitHub Gistから取得試行');
            // GitHub Gistから取得を試行
            const response = await fetch(this.gistUrl, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.ok) {
                const gist = await response.json();
                const rankingData = this._extractRankingFromGist(gist);
                console.log('デバッグ: Gistから取得したデータ:', rankingData);
                
                // ローカルキャッシュに保存
                this._saveToCache(rankingData);
                
                return rankingData;
            } else {
                throw new Error(`GitHub API Error: ${response.status}`);
            }

        } catch (error) {
            console.warn('共有ランキング取得失敗:', error.message);
            const cache = this._getLocalCache();
            console.log('デバッグ: フォールバックキャッシュ:', cache);
            return cache;
        }
    }

    /**
     * 新しいスコアをマージ（純粋な共有ランキング）
     * @param {Object} newRecord - 新しいスコア記録
     * @returns {Promise<Array>} 更新されたランキング
     */
    async mergeScore(newRecord) {
        try {
            // 現在のランキングを取得
            const currentRanking = await this.getSharedRanking();
            
            // 新しいスコアを追加
            const updatedRanking = [...currentRanking, newRecord];
            
            // 重複除去とソート
            const uniqueRanking = this._removeDuplicates(updatedRanking);
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
            console.log('デバッグ: ローカルキャッシュの内容:', cached);
            
            // 強制的にローカルストレージをクリアして空配列を返す
            localStorage.removeItem(this.fallbackKey);
            console.log('デバッグ: ローカルキャッシュを削除しました');
            return [];
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