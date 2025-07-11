/**
 * GitHub Gist同期サービス
 * 安全な方法でランキングデータを共有
 */
class GistSyncService {
    constructor() {
        this.shareInstructions = {
            gistUrl: 'https://gist.github.com/yomikakisan/c791657df064e4297dc694938d1b6021',
            fileName: 'sakuya-game-ranking.json'
        };
    }

    /**
     * 共有ランキング投稿案内を表示
     * @param {Object} newRecord - 新しいレコード
     */
    showShareInstructions(newRecord) {
        const instructions = this._generateInstructions(newRecord);
        
        // モーダルまたは専用UIで表示
        this._displayShareModal(instructions);
    }

    /**
     * 共有手順生成
     * @param {Object} newRecord - 新しいレコード
     * @returns {Object} 共有手順
     */
    _generateInstructions(newRecord) {
        const currentData = JSON.parse(localStorage.getItem('imadaSharedRanking') || '[]');
        const updatedData = [...currentData, newRecord]
            .sort((a, b) => a.score - b.score)
            .slice(0, 10);

        return {
            title: '🌍 みんなでランキングを共有しよう！',
            steps: [
                '1. 以下のGistリンクをクリック',
                '2. 「sakuya-game-ranking.json」ファイルを編集',
                '3. 下記のデータをコピー＆ペースト',
                '4. 「Update public gist」をクリック'
            ],
            gistUrl: this.shareInstructions.gistUrl,
            jsonData: JSON.stringify(updatedData, null, 2),
            yourScore: newRecord
        };
    }

    /**
     * 共有モーダル表示
     * @param {Object} instructions - 表示内容
     */
    _displayShareModal(instructions) {
        // 既存のモーダルを削除
        const existingModal = document.getElementById('share-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // モーダル作成
        const modal = document.createElement('div');
        modal.id = 'share-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            padding: 20px;
            border-radius: 10px;
            max-width: 90%;
            max-height: 90%;
            overflow-y: auto;
            position: relative;
        `;

        content.innerHTML = `
            <button onclick="document.getElementById('share-modal').remove()" 
                    style="position: absolute; top: 10px; right: 15px; background: none; border: none; font-size: 20px; cursor: pointer;">×</button>
            
            <h3>${instructions.title}</h3>
            
            <div style="margin: 15px 0;">
                <h4>🎯 あなたのスコア</h4>
                <p><strong>${instructions.yourScore.name}</strong>: ${instructions.yourScore.score}ms</p>
            </div>
            
            <div style="margin: 15px 0;">
                <h4>📋 共有手順</h4>
                <ol>
                    ${instructions.steps.map(step => `<li>${step}</li>`).join('')}
                </ol>
            </div>
            
            <div style="margin: 15px 0;">
                <h4>🔗 Gistリンク</h4>
                <a href="${instructions.gistUrl}" target="_blank" 
                   style="color: #0066cc; text-decoration: underline;">
                    GitHub Gistを開く
                </a>
            </div>
            
            <div style="margin: 15px 0;">
                <h4>📝 コピー用データ</h4>
                <textarea readonly 
                          style="width: 100%; height: 200px; font-family: monospace; font-size: 12px; padding: 10px; border: 1px solid #ccc;"
                          onclick="this.select()">${instructions.jsonData}</textarea>
                <p style="font-size: 12px; color: #666;">
                    ↑ このテキストエリアをクリックして全選択、Ctrl+C（Mac: Cmd+C）でコピー
                </p>
            </div>
            
            <div style="margin: 15px 0;">
                <button onclick="navigator.clipboard.writeText('${instructions.jsonData.replace(/'/g, "\\'")}'); alert('データをコピーしました！')"
                        style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                    📋 データをコピー
                </button>
                <button onclick="window.open('${instructions.gistUrl}')"
                        style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-left: 10px;">
                    🔗 Gistを開く
                </button>
                <button onclick="document.getElementById('share-modal').remove()"
                        style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-left: 10px;">
                    後で
                </button>
            </div>
        `;

        modal.appendChild(content);
        document.body.appendChild(modal);

        // モーダル外クリックで閉じる
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    /**
     * 自動同期チェック（将来の機能拡張用）
     */
    async checkForUpdates() {
        try {
            const response = await fetch('https://api.github.com/gists/c791657df064e4297dc694938d1b6021');
            if (response.ok) {
                const gist = await response.json();
                const lastModified = new Date(gist.updated_at);
                const lastLocalUpdate = localStorage.getItem('imadaSharedRanking_lastUpdate');
                
                if (!lastLocalUpdate || lastModified > new Date(parseInt(lastLocalUpdate))) {
                    console.log('🔄 新しい共有ランキングデータが利用可能です');
                    return true;
                }
            }
        } catch (error) {
            console.warn('同期チェックエラー:', error.message);
        }
        return false;
    }
}

// グローバルインスタンス
window.gistSync = new GistSyncService();

// エクスポート（モジュール対応）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GistSyncService;
}