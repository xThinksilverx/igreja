<?php
// Headers CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// Trata requisição OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/db.php';

// Verifica se há sessão ativa
if (isAdminLoggedIn()) {
    sendResponse(true, 'Sessão ativa', [
        'isLoggedIn' => true,
        'nome' => $_SESSION['admin_nome'] ?? '',
        'email' => $_SESSION['admin_email'] ?? ''
    ]);
} else {
    sendResponse(true, 'Sem sessão ativa', [
        'isLoggedIn' => false
    ]);
}
?>