<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../config/db.php';

$dados = json_decode(file_get_contents('php://input'), true);

$chave = $dados['adminKey'] ?? '';
$nome = $dados['name'] ?? '';
$email = $dados['email'] ?? '';
$senha = $dados['password'] ?? '';

// Validações simples
if (empty($nome) || empty($email) || empty($senha)) {
    resposta(false, 'Preencha todos os campos');
}

if ($chave !== 'MonteClaroAdmin2025') {
    resposta(false, 'Chave inválida');
}

if (strlen($senha) < 8) {
    resposta(false, 'Senha deve ter 8+ caracteres');
}

// Verifica se email existe
$stmt = $conn->prepare("SELECT id FROM administradores WHERE email = ?");
$stmt->execute([$email]);
if ($stmt->fetch()) {
    resposta(false, 'Email já cadastrado');
}

// Cadastra
$senhaHash = password_hash($senha, PASSWORD_DEFAULT);
$stmt = $conn->prepare("INSERT INTO administradores (nome, email, senha, chave_admin) VALUES (?, ?, ?, ?)");
$stmt->execute([$nome, $email, $senhaHash, $chave]);

resposta(true, 'Cadastrado com sucesso!', ['id' => $conn->lastInsertId()]);
?>