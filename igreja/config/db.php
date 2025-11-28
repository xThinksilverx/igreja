<?php
session_start();

$host = 'localhost';
$dbname = 'banco_igreja';
$user = 'root';
$pass = '';

try {
    $conn = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die(json_encode(['success' => false, 'message' => 'Erro no banco']));
}

function resposta($sucesso, $mensagem, $dados = null) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => $sucesso,
        'message' => $mensagem,
        'data' => $dados
    ]);
    exit;
}
?>