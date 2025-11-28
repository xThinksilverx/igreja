<?php
session_start();

header('Content-Type: application/json');

$logado = isset($_SESSION['admin_id']);

echo json_encode([
    'success' => true,
    'data' => [
        'isLoggedIn' => $logado,
        'nome' => $_SESSION['admin_nome'] ?? '',
        'email' => $_SESSION['admin_email'] ?? ''
    ]
]);
?>