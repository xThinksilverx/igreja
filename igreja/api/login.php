<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../config/db.php';

$dados = json_decode(file_get_contents('php://input'), true);

$email = $dados['email'] ?? '';
$senha = $dados['password'] ?? '';

if (empty($email) || empty($senha)) {
    resposta(false, 'Preencha todos os campos');
}

// Busca admin
$stmt = $conn->prepare("SELECT * FROM administradores WHERE email = ? AND ativo = 1");
$stmt->execute([$email]);
$admin = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$admin) {
    resposta(false, 'Email ou senha incorretos');
}

if (!password_verify($senha, $admin['senha'])) {
    resposta(false, 'Email ou senha incorretos');
}

// Cria sessão
$_SESSION['admin_id'] = $admin['id'];
$_SESSION['admin_nome'] = $admin['nome'];
$_SESSION['admin_email'] = $admin['email'];

// Atualiza último login
$stmt = $conn->prepare("UPDATE administradores SET ultimo_login = NOW() WHERE id = ?");
$stmt->execute([$admin['id']]);

resposta(true, 'Login realizado!', [
    'nome' => $admin['nome'],
    'email' => $admin['email']
]);
?>