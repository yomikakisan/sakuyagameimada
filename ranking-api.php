<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

$ranking_file = 'ranking.json';

function loadRanking() {
    global $ranking_file;
    if (!file_exists($ranking_file)) {
        return [];
    }
    $content = file_get_contents($ranking_file);
    return json_decode($content, true) ?: [];
}

function saveRanking($data) {
    global $ranking_file;
    return file_put_contents($ranking_file, json_encode($data, JSON_PRETTY_PRINT));
}

function validateInput($name, $score) {
    if (empty($name) || strlen($name) > 20) {
        return false;
    }
    if (!is_numeric($score) || $score < 0 || $score > 10000) {
        return false;
    }
    return true;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // ランキング取得
    $ranking = loadRanking();
    echo json_encode(['success' => true, 'ranking' => $ranking]);
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // スコア登録
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['name']) || !isset($input['score'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid input']);
        exit;
    }
    
    $name = trim($input['name']);
    $score = (int)$input['score'];
    
    if (!validateInput($name, $score)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid name or score']);
        exit;
    }
    
    $ranking = loadRanking();
    
    // 新しいスコアを追加
    $newRecord = [
        'name' => $name,
        'score' => $score,
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    $ranking[] = $newRecord;
    
    // スコア順でソート（昇順：小さいほど良い）
    usort($ranking, function($a, $b) {
        return $a['score'] - $b['score'];
    });
    
    // TOP10のみ保持
    $ranking = array_slice($ranking, 0, 10);
    
    // ハイスコア判定（TOP5に入ったか）
    $isHighScore = false;
    $rank = 0;
    foreach ($ranking as $index => $record) {
        if ($record['name'] === $name && $record['score'] === $score && $record['timestamp'] === $newRecord['timestamp']) {
            $rank = $index + 1;
            $isHighScore = $rank <= 5;
            break;
        }
    }
    
    if (saveRanking($ranking)) {
        echo json_encode([
            'success' => true, 
            'isHighScore' => $isHighScore,
            'rank' => $rank,
            'ranking' => $ranking
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to save ranking']);
    }
    
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}
?>