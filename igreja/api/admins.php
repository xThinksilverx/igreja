<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/db.php';

if (!isset($_SESSION['admin_id'])) {
    resposta(false, 'Faça login primeiro');
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $stmt = $conn->query(
            "SELECT id, nome, email, ultimo_login
             FROM administradores
             WHERE ativo = 1
             ORDER BY nome"
        );
        resposta(true, 'Administradores carregados', $stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (Exception $e) {
        resposta(false, 'Erro: ' . $e->getMessage());
    }
}

if ($method === 'POST') {
    $dados = json_decode(file_get_contents('php://input'), true);
    $nome  = trim($dados['nome']  ?? '');
    $email = trim($dados['email'] ?? '');
    $senha =      $dados['senha'] ?? '';

    if (empty($nome) || empty($email) || empty($senha)) {
        resposta(false, 'Preencha todos os campos');
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        resposta(false, 'E-mail inválido');
    }

    if (strlen($senha) < 8) {
        resposta(false, 'Senha deve ter no mínimo 8 caracteres');
    }

    $stmt = $conn->prepare("SELECT id FROM administradores WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        resposta(false, 'E-mail já cadastrado');
    }

    try {
        $hash = password_hash($senha, PASSWORD_DEFAULT);
        $stmt = $conn->prepare(
            "INSERT INTO administradores (nome, email, senha) VALUES (?, ?, ?)"
        );
        $stmt->execute([$nome, $email, $hash]);
        resposta(true, 'Administrador criado!', ['id' => $conn->lastInsertId()]);
    } catch (Exception $e) {
        resposta(false, 'Erro ao criar administrador: ' . $e->getMessage());
    }
}

if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);

    if (!$id) {
        resposta(false, 'ID obrigatório');
    }

    if ($id === (int)$_SESSION['admin_id']) {
        resposta(false, 'Você não pode desativar sua própria conta');
    }

    try {
        $stmt = $conn->prepare("UPDATE administradores SET ativo = 0 WHERE id = ?");
        $stmt->execute([$id]);
        resposta(true, 'Administrador desativado!');
    } catch (Exception $e) {
        resposta(false, 'Erro: ' . $e->getMessage());
    }
}
