/**
 * 真の共有ランキングシステム
 * GitHub Gistを使用した無料オンラインストレージ
 */
class TrulySharedRanking {
    constructor() {
        // 公開GitHub Gist ID
        this.gistId = 'c791657df064e4297dc694938d1b6021';
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
        console.log('=== TrulySharedRanking.getSharedRanking開始 ===');
        try {
            // キャッシュチェック
            console.log('キャッシュ有効性チェック...');
            if (this._isCacheValid()) {
                console.log('キャッシュが有効、ローカルキャッシュから取得');
                const cache = this._getLocalCache();
                console.log('キャッシュ結果:', cache);
                return cache;
            }

            console.log('GitHub Gistから取得開始...');
            // GitHub Gistから取得を試行
            const response = await fetch(this.gistUrl, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            console.log('Gist APIレスポンス:', response.status);

            if (response.ok) {
                const gist = await response.json();
                console.log('Gistデータ取得成功');
                const gistData = this._extractRankingFromGist(gist);
                console.log('Gistから抽出したデータ:', gistData);
                
                // ローカルデータも取得してマージ
                const localData = this._getLocalCacheRaw();
                console.log('ローカルデータ:', localData);
                
                // Gistとローカルデータをマージしてユニークにする
                const mergedData = this._mergeRankingData(gistData, localData);
                console.log('マージ後データ:', mergedData);
                
                // マージ結果をローカルキャッシュに保存
                this._saveToCache(mergedData);
                
                return mergedData;
            } else {
                throw new Error(`GitHub API Error: ${response.status}`);
            }

        } catch (error) {
            console.warn('共有ランキング取得失敗:', error.message);
            const cache = this._getLocalCache();
            console.log('エラー時フォールバック結果:', cache);
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
            // Gistファイルを探す（sakuya-game-ranking.json）
            const files = Object.keys(gist.files);
            const rankingFile = files.find(name => name.includes('sakuya-game-ranking') || name.includes('ranking'));
            
            if (rankingFile && gist.files[rankingFile]) {
                const content = gist.files[rankingFile].content;
                const data = JSON.parse(content);
                
                if (Array.isArray(data)) {
                    // デモデータを除外してフィルタリング
                    const filteredData = data.filter(record => {
                        const isDemoData = ['ニンジャマスター', 'スピードキング', 'リフレックス', 'サクヤファン', '反応の達人', 'クイックドロー', '瞬速の忍'].includes(record.name);
                        return !isDemoData && SecurityUtils.validateRecord(record);
                    });
                    return filteredData;
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
        console.log('=== _getLocalCache開始 ===');
        return this._getLocalCacheRaw();
    }

    /**
     * ローカルキャッシュを生データで取得（フィルタリング前）
     */
    _getLocalCacheRaw() {
        try {
            const cached = localStorage.getItem(this.fallbackKey);
            console.log('ローカルストレージ生データ:', cached);
            
            if (!cached) {
                console.log('キャッシュなし、空配列を返す');
                return [];
            }
            
            const data = JSON.parse(cached);
            console.log('パース後データ:', data);
            
            // デモデータを除外してフィルタリング
            const filteredData = data.filter(record => {
                const isDemoData = ['ニンジャマスター', 'スピードキング', 'リフレックス', 'サクヤファン', '反応の達人', 'クイックドロー', '瞬速の忍'].includes(record.name);
                const isValid = SecurityUtils.validateRecord(record);
                console.log(`レコード ${record.name}: デモ=${isDemoData}, 有効=${isValid}`);
                return !isDemoData && isValid;
            });
            
            console.log('フィルタ後データ:', filteredData);
            return filteredData;
        } catch (error) {
            console.warn('キャッシュ取得エラー:', error);
            return [];
        }
    }

    /**
     * Gistデータとローカルデータをマージ
     */
    _mergeRankingData(gistData, localData) {
        // 両方のデータを結合
        const combined = [...gistData, ...localData];
        
        // 重複除去（ID基準）
        const unique = this._removeDuplicates(combined);
        
        // スコア順でソート
        unique.sort((a, b) => a.score - b.score);
        
        // 上位10件を返す
        return unique.slice(0, 10);
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