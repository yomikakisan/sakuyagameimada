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
        this.lastUpdateKey = 'imadaSharedRanking_lastUpdate';
        this.cacheTimeout = 300000; // 5分キャッシュ
        
        // GitHub API用のPersonal Access Token（リードオンリー権限）
        // セキュリティのため、最小限の権限で作成
        this.githubToken = localStorage.getItem('sakuya_github_token') || null;
        
        // lastUpdateを復元
        this._restoreLastUpdate();
        
        // 初回起動時にToken設定を確認
        this._checkTokenSetup();
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
                const gistData = this._extractRankingFromGist(gist);
                
                // ローカルデータも取得してマージ
                const localData = this._getLocalCacheRaw();
                
                // Gistとローカルデータをマージしてユニークにする
                const mergedData = this._mergeRankingData(gistData, localData);
                
                // マージ結果をローカルキャッシュに保存
                this._saveToCache(mergedData);
                
                return mergedData;
            } else {
                throw new Error(`GitHub API Error: ${response.status}`);
            }

        } catch (error) {
            console.warn('共有ランキング取得失敗:', error.message);
            return this._getLocalCache();
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
            
            // GitHub Gistに自動更新試行
            if (this.githubToken) {
                this._updateGistData(topRanking).catch(error => {
                    console.warn('Gist自動更新に失敗:', error.message);
                    // 失敗してもローカルには保存済み
                });
            }
            
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
        return Date.now().toString(36) + Math.random().toString(36).substring(2, 11);
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
        return this._getLocalCacheRaw();
    }

    /**
     * ローカルキャッシュを生データで取得（フィルタリング前）
     */
    _getLocalCacheRaw() {
        try {
            const cached = localStorage.getItem(this.fallbackKey);
            
            if (!cached) {
                return [];
            }
            
            const data = JSON.parse(cached);
            
            // デモデータを除外してフィルタリング
            const filteredData = data.filter(record => {
                const isDemoData = ['ニンジャマスター', 'スピードキング', 'リフレックス', 'サクヤファン', '反応の達人', 'クイックドロー', '瞬速の忍'].includes(record.name);
                const isValid = SecurityUtils.validateRecord(record);
                return !isDemoData && isValid;
            });
            
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
            
            // lastUpdateもlocalStorageに保存
            localStorage.setItem(this.lastUpdateKey, this.lastUpdate.toString());
        } catch (error) {
            console.warn('キャッシュ保存エラー:', error);
        }
    }

    /**
     * lastUpdateをlocalStorageから復元
     */
    _restoreLastUpdate() {
        try {
            const saved = localStorage.getItem(this.lastUpdateKey);
            if (saved) {
                this.lastUpdate = parseInt(saved, 10);
            } else {
                this.lastUpdate = null;
            }
        } catch (error) {
            console.warn('lastUpdate復元エラー:', error);
            this.lastUpdate = null;
        }
    }

    /**
     * GitHub Token設定確認
     */
    _checkTokenSetup() {
        if (!this.githubToken) {
            // 初回起動時のみ表示
            const hasShownSetup = localStorage.getItem('sakuya_token_setup_shown');
            if (!hasShownSetup) {
                setTimeout(() => {
                    this._showTokenSetupModal();
                    localStorage.setItem('sakuya_token_setup_shown', 'true');
                }, 2000);
            }
        }
    }

    /**
     * GitHub Token設定モーダル表示
     */
    _showTokenSetupModal() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center;
            z-index: 1000;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: white; padding: 20px; border-radius: 10px; max-width: 90%; max-height: 90%;
            overflow-y: auto;
        `;

        content.innerHTML = `
            <h3>🌍 ランキング共有機能を有効にしますか？</h3>
            <p>他のプレイヤーとリアルタイムでランキングを共有できます！</p>
            
            <h4>🔑 GitHub Personal Access Tokenの作成手順:</h4>
            <ol style="font-size: 14px; line-height: 1.6;">
                <li><a href="https://github.com/settings/tokens" target="_blank">ここをクリックしてGitHubのトークンページを開く</a></li>
                <li>「新しいトークンを生成」ボタンをクリック</li>
                <li>「トークン名」に「Sakuya Game Ranking」と入力</li>
                <li>「有効期限」を「30日」に設定</li>
                <li>「gist」権限のみをチェック</li>
                <li>「トークンを生成」をクリック</li>
                <li>生成されたトークンをコピー</li>
            </ol>
            
            <div style="margin: 15px 0;">
                <label for="github-token">🔑 GitHub Personal Access Token:</label><br>
                <input type="password" id="github-token" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" 
                       style="width: 100%; padding: 8px; margin: 5px 0; border: 1px solid #ccc; border-radius: 4px;">
                <p style="font-size: 12px; color: #666;">
                    ⚠️ トークンはローカルにのみ保存され、外部に送信されません
                </p>
            </div>
            
            <div style="text-align: center;">
                <button onclick="window.trulySharedRanking._saveToken()" 
                        style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px;">
                    ✅ 設定して共有機能を有効にする
                </button>
                <button onclick="this.closest('div').parentElement.remove()" 
                        style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px;">
                    ⏭️ 後で設定する
                </button>
            </div>
        `;

        modal.appendChild(content);
        document.body.appendChild(modal);

        // グローバル参照設定
        window.trulySharedRanking = this;
    }

    /**
     * Token保存
     */
    _saveToken() {
        const tokenInput = document.getElementById('github-token');
        const token = tokenInput?.value.trim();
        
        if (!token) {
            alert('トークンを入力してください');
            return;
        }
        
        if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
            alert('無効なGitHub Personal Access Token形式です');
            return;
        }
        
        localStorage.setItem('sakuya_github_token', token);
        this.githubToken = token;
        
        // モーダルを閉じる
        document.querySelector('div[style*="position: fixed"]')?.remove();
        
        alert('✅ 共有機能が有効になりました！\nハイスコアを達成すると自動で共有されます。');
    }

    /**
     * GitHub Gist自動更新
     * @param {Array} rankingData - 更新するランキングデータ
     * @returns {Promise<void>}
     */
    async _updateGistData(rankingData) {
        if (!this.githubToken) {
            throw new Error('GitHub tokenが設定されていません');
        }

        const gistData = {
            files: {
                'sakuya-game-ranking.json': {
                    content: JSON.stringify(rankingData, null, 2)
                }
            }
        };

        const response = await fetch(this.gistUrl, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${this.githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(gistData)
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Gist更新失敗: ${response.status} - ${error}`);
        }

        console.log('✅ ランキングがGitHub Gistに自動更新されました！');
        return response.json();
    }

    /**
     * 共有機能の状態確認
     * @returns {boolean} 共有機能が有効かどうか
     */
    isSharedModeEnabled() {
        return !!this.githubToken;
    }

    /**
     * Token再設定モーダル表示
     */
    showTokenSetup() {
        this._showTokenSetupModal();
    }

    /**
     * 共有機能を無効化
     */
    disableSharing() {
        localStorage.removeItem('sakuya_github_token');
        this.githubToken = null;
        alert('共有機能を無効にしました。');
    }

    /**
     * デバッグ情報取得
     */
    getDebugInfo() {
        return {
            gistUrl: this.gistUrl,
            lastUpdate: this.lastUpdate,
            cacheValid: this._isCacheValid(),
            localCount: this._getLocalCache().length,
            sharedModeEnabled: this.isSharedModeEnabled()
        };
    }
}

// エクスポート（モジュール対応）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrulySharedRanking;
}