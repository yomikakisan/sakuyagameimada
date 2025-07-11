/**
 * ゲーム設定・定数定義
 */
const CONFIG = {
    // ゲーム設定
    GAME: {
        MIN_DELAY: 2000,        // 最小遅延時間(ms)
        MAX_DELAY: 5000,        // 最大遅延時間(ms)
        MIN_VALID_SCORE: 50,    // 最小有効スコア(ms)
        MAX_VALID_SCORE: 10000, // 最大有効スコア(ms)
    },
    
    // ランキング設定
    RANKING: {
        MAX_RECORDS: 10,        // 最大保存件数
        DISPLAY_COUNT: 5,       // 表示件数
        MAX_NAME_LENGTH: 20,    // 名前最大文字数
        DUPLICATE_THRESHOLD: 10000, // 重複判定時間(ms)
        SCORE_TOLERANCE: 5,     // スコア重複許容範囲(ms)
        MAX_DATA_SIZE: 50000,   // LocalStorage最大サイズ(bytes)
        STORAGE_KEY: 'imadaOnlineRanking',
    },
    
    // 音声設定
    AUDIO: {
        SUCCESS_FREQ: [800, 1000],  // 成功音周波数
        FAIL_FREQ: 200,             // 失敗音周波数
        CUE_FREQ: 600,              // 合図音周波数
        DEFAULT_VOLUME: 0.5,        // デフォルト音量
        TONE_VOLUME: 0.3,           // トーン音量倍率
    },
    
    // UI設定
    UI: {
        FADE_DURATION: 300,     // フェードアニメーション時間(ms)
        EVALUATION_DELAY: 1000, // 評価表示遅延(ms)
        ERROR_BORDER_COLOR: '#dc3545',
        SUCCESS_BORDER_COLOR: '#007bff',
    },
    
    // セキュリティ設定
    SECURITY: {
        ALLOWED_PATTERN: /^[a-zA-Z0-9ひらがなカタカナ一-龯々〇〻ー！？。、・（）()[\]\s\-_]+$/,
        DANGEROUS_PATTERNS: [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /<iframe/gi,
            /<object/gi,
            /<embed/gi,
            /<link/gi,
            /<meta/gi,
            /eval\s*\(/gi,
            /document\./gi,
            /window\./gi,
            /\.\.\//g,
        ],
    },
    
    // URLs
    URLS: {
        TWITTER_INTENT: 'https://x.com/intent/tweet',
        HASHTAG: '#今だチャレンジ',
    }
};

// 評価メッセージ
const EVALUATION_MESSAGES = [
    { max: 200, message: '⚡ 超人的！' },
    { max: 250, message: '🔥 素晴らしい！' },
    { max: 300, message: '👍 良い反応！' },
    { max: 400, message: '😊 まずまず' },
    { max: 500, message: '😅 もう少し' },
    { max: Infinity, message: '😴 練習あるのみ！' }
];

// メダル定義
const MEDALS = ['🥇', '🥈', '🥉', '', ''];

// エクスポート（モジュール対応）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, EVALUATION_MESSAGES, MEDALS };
}