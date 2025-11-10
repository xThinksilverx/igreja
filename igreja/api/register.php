<?php
// Headers CORS (deve vir antes de qualquer output)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// Trata requisição OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/db.php';

define('ADMIN_KEY', 'MonteClaroAdmin2025');

// Verifica método
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    sendResponse(false, 'Método não permitido. Use POST.');
}

// Pega o conteúdo raw
$inputJSON = file_get_contents('php://input');

// Log para debug (remova depois)
error_log("Conteúdo recebido: " . $inputJSON);

$data = json_decode($inputJSON, true);

// Verifica se conseguiu fazer decode
if ($data === null) {
    sendResponse(false, 'Erro ao processar dados JSON.');
}

$chaveAdmin = trim($data['adminKey'] ?? '');
$nome = trim($data['name'] ?? '');
$email = trim($data['email'] ?? '');
$senha = $data['password'] ?? '';
$senhaConfirm = $data['passwordConfirm'] ?? '';

// Validações
if (empty($chaveAdmin) || empty($nome) || empty($email) || empty($senha) || empty($senhaConfirm)) {
    sendResponse(false, 'Todos os campos são obrigatórios.');
}

if ($chaveAdmin !== ADMIN_KEY) {
    sendResponse(false, 'Chave administrativa inválida!');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendResponse(false, 'E-mail inválido.');
}

if ($senha !== $senhaConfirm) {
    sendResponse(false, 'As senhas não coincidem!');
}

if (strlen($senha) < 8) {
    sendResponse(false, 'A senha deve ter no mínimo 8 caracteres!');
}

if (strlen($nome) < 3) {
    sendResponse(false, 'Nome deve ter no mínimo 3 caracteres.');
}

try {
    $conn = getConnection();
    
    // Verifica se email já existe
    $checkStmt = $conn->prepare("SELECT id FROM administradores WHERE email = ?");
    $checkStmt->execute([$email]);
    
    if ($checkStmt->fetch()) {
        sendResponse(false, 'Este e-mail já está cadastrado!');
    }
    
    // Cria hash da senha
    $senhaHash = password_hash($senha, PASSWORD_DEFAULT);
    
    // Insere novo admin
    $insertStmt = $conn->prepare("
        INSERT INTO administradores (nome, email, senha, chave_admin) 
        VALUES (?, ?, ?, ?)
    ");
    
    $insertStmt->execute([$nome, $email, $senhaHash, $chaveAdmin]);
    
    $novoAdminId = $conn->lastInsertId();
    
    // Registra no log
    $logStmt = $conn->prepare("
        INSERT INTO logs_atividade (admin_id, acao, descricao, ip_address) 
        VALUES (?, 'CADASTRO', 'Novo administrador cadastrado', ?)
    ");
    $logStmt->execute([$novoAdminId, $_SERVER['REMOTE_ADDR']]);
    
    sendResponse(true, 'Cadastro realizado com sucesso!', [
        'id' => $novoAdminId,
        'nome' => $nome,
        'email' => $email
    ]);
    
} catch (PDOException $e) {
    error_log("Erro no cadastro: " . $e->getMessage());
    
    if ($e->getCode() == 23000) {
        sendResponse(false, 'Este e-mail já está cadastrado!');
    }
    
    sendResponse(false, 'Erro ao processar cadastro. Tente novamente.');
}
?>