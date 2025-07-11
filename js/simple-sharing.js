/**
 * 簡単な共有ランキングシステム
 * 無料で手順なしの代替案
 */
class SimpleSharing {
    constructor() {
        this.localKey = 'sakuya_simple_ranking';
        this.shareUrls = {
            twitter: 'https://twitter.com/intent/tweet',
            discord: 'https://discord.com',
            line: 'https://social-plugins.line.me/lineit/share'
        };
    }

    /**
     * 方法1: SNS共有でランキング投稿
     * @param {Object} record - スコア記録
     */
    shareToSNS(record) {
        const text = `🎮 今だ！ゲームで${record.score}msを記録！\n\n` +
                    `プレイヤー: ${record.name}\n` +
                    `反応速度: ${record.score}ms\n` +
                    `タイムスタンプ: ${record.timestamp}\n\n` +
                    `#今だゲーム #反応速度 #ゲーム\n` +
                    `https://yomikakisan.github.io/sakuyagameimada/`;

        // Twitter投稿
        const twitterUrl = `${this.shareUrls.twitter}?text=${encodeURIComponent(text)}`;
        window.open(twitterUrl, '_blank');
    }

    /**
     * 方法2: 擬似的な共有ランキング（コミュニティベース）
     * @param {Object} record - 新しい記録
     */
    showCommunityShare(record) {
        this._showShareModal(record);
    }

    /**
     * 方法3: QRコード生成で共有
     * @param {Object} record - スコア記録
     */
    generateShareQR(record) {
        const shareData = {
            name: record.name,
            score: record.score,
            timestamp: record.timestamp,
            game: 'sakuya-imada'
        };
        
        const shareUrl = `https://yomikakisan.github.io/sakuyagameimada/?share=${encodeURIComponent(JSON.stringify(shareData))}`;
        
        // QRコード生成（Google Charts API使用）
        const qrUrl = `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(shareUrl)}`;
        
        this._showQRModal(qrUrl, shareUrl, record);
    }

    /**
     * 方法4: 簡易ハッシュタグ共有
     */
    showHashtagShare(record) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center;
            z-index: 1000;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: white; padding: 20px; border-radius: 10px; max-width: 90%;
            text-align: center;
        `;

        content.innerHTML = `
            <h3>🏆 スコアを共有しよう！</h3>
            <p><strong>${record.name}</strong>さんの記録: <strong>${record.score}ms</strong></p>
            
            <div style="margin: 20px 0;">
                <h4>📱 SNSで共有</h4>
                <button onclick="window.simpleSharing.shareToSNS(${JSON.stringify(record).replace(/"/g, '&quot;')})" 
                        style="background: #1da1f2; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px;">
                    🐦 Twitterで共有
                </button>
            </div>
            
            <div style="margin: 20px 0;">
                <h4>📋 コピー＆ペースト用</h4>
                <textarea readonly onclick="this.select()" 
                          style="width: 100%; height: 80px; padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 12px;">🎮 今だ！ゲームスコア報告
プレイヤー: ${record.name}
反応速度: ${record.score}ms
日時: ${record.timestamp}

みんなも挑戦してみて！
https://yomikakisan.github.io/sakuyagameimada/

#今だゲーム #反応速度チャレンジ</textarea>
                <p style="font-size: 12px; color: #666;">↑ クリックして全選択、コピーしてSNSに投稿！</p>
            </div>
            
            <div style="margin: 20px 0;">
                <h4>🔗 友達に共有</h4>
                <button onclick="window.simpleSharing.generateShareQR(${JSON.stringify(record).replace(/"/g, '&quot;')})" 
                        style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px;">
                    📱 QRコードで共有
                </button>
            </div>
            
            <button onclick="this.closest('div').parentElement.remove()" 
                    style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 15px;">
                閉じる
            </button>
        `;

        modal.appendChild(content);
        document.body.appendChild(modal);

        // モーダル外クリックで閉じる
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    /**
     * QRコードモーダル表示
     */
    _showQRModal(qrUrl, shareUrl, record) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center;
            z-index: 1000;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: white; padding: 20px; border-radius: 10px; max-width: 90%;
            text-align: center;
        `;

        content.innerHTML = `
            <h3>📱 QRコードで友達と共有</h3>
            <p><strong>${record.name}</strong>さんの記録: <strong>${record.score}ms</strong></p>
            
            <div style="margin: 20px 0;">
                <img src="${qrUrl}" alt="QRコード" style="border: 1px solid #ccc; border-radius: 8px;">
                <p style="font-size: 12px; color: #666; margin-top: 10px;">
                    📱 友達にQRコードを見せて、カメラで読み取ってもらおう！
                </p>
            </div>
            
            <div style="margin: 15px 0;">
                <label>🔗 直接リンクを共有:</label>
                <input type="text" value="${shareUrl}" readonly 
                       style="width: 100%; padding: 5px; margin: 5px 0; font-size: 11px; border: 1px solid #ccc; border-radius: 3px;"
                       onclick="this.select()">
            </div>
            
            <button onclick="navigator.clipboard.writeText('${shareUrl}'); alert('リンクをコピーしました！')" 
                    style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; margin: 5px;">
                📋 リンクをコピー
            </button>
            
            <button onclick="this.closest('div').parentElement.remove()" 
                    style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; margin: 5px;">
                閉じる
            </button>
        `;

        modal.appendChild(content);
        document.body.appendChild(modal);

        // モーダル外クリックで閉じる
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    /**
     * 共有データを読み込み（URL パラメータから）
     */
    loadSharedScore() {
        const urlParams = new URLSearchParams(window.location.search);
        const shareData = urlParams.get('share');
        
        if (shareData) {
            try {
                const data = JSON.parse(decodeURIComponent(shareData));
                if (data.game === 'sakuya-imada') {
                    this._showSharedScoreWelcome(data);
                }
            } catch (error) {
                console.warn('共有データの読み込みエラー:', error);
            }
        }
    }

    /**
     * 共有スコア歓迎メッセージ
     */
    _showSharedScoreWelcome(data) {
        setTimeout(() => {
            const message = `🎉 ${data.name}さんから共有されました！\n記録: ${data.score}ms\nあなたも挑戦してみよう！`;
            alert(message);
        }, 1000);
    }

    /**
     * 初期化時に共有データをチェック
     */
    init() {
        this.loadSharedScore();
    }
}

// グローバルインスタンス
window.simpleSharing = new SimpleSharing();

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    window.simpleSharing.init();
});

// エクスポート（モジュール対応）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SimpleSharing;
}