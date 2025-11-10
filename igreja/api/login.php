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

// Verifica método
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    sendResponse(false, 'Método não permitido. Use POST.');
}

// Pega o conteúdo raw
$inputJSON = file_get_contents('php://input');

// Log para debug (remova depois)
error_log("Conteúdo recebido no login: " . $inputJSON);

$data = json_decode($inputJSON, true);

// Verifica se conseguiu fazer decode
if ($data === null) {
    sendResponse(false, 'Erro ao processar dados JSON.');
}

$email = trim($data['email'] ?? '');
$senha = $data['password'] ?? '';

// Validações básicas
if (empty($email) || empty($senha)) {
    sendResponse(false, 'E-mail e senha são obrigatórios.');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendResponse(false, 'E-mail inválido.');
}

try {
    $conn = getConnection();
    
    // Busca admin por email
    $stmt = $conn->prepare("
        SELECT id, nome, email, senha, ativo 
        FROM administradores 
        WHERE email = ? 
        LIMIT 1
    ");
    
    $stmt->execute([$email]);
    $admin = $stmt->fetch();
    
    if (!$admin) {
        sendResponse(false, 'E-mail ou senha incorretos.');
    }
    
    if (!$admin['ativo']) {
        sendResponse(false, 'Conta desativada. Entre em contato com o administrador.');
    }
    
    if (!password_verify($senha, $admin['senha'])) {
        sendResponse(false, 'E-mail ou senha incorretos.');
    }
    
    // Atualiza último login
    $updateStmt = $conn->prepare("
        UPDATE administradores 
        SET ultimo_login = NOW() 
        WHERE id = ?
    ");
    $updateStmt->execute([$admin['id']]);
    
    // Registra no log
    $logStmt = $conn->prepare("
        INSERT INTO logs_atividade (admin_id, acao, descricao, ip_address) 
        VALUES (?, 'LOGIN', 'Login realizado com sucesso', ?)
    ");
    $logStmt->execute([$admin['id'], $_SERVER['REMOTE_ADDR']]);
    
    // Cria sessão
    $_SESSION['admin_id'] = $admin['id'];
    $_SESSION['admin_nome'] = $admin['nome'];
    $_SESSION['admin_email'] = $admin['email'];
    $_SESSION['login_time'] = time();
    
    sendResponse(true, 'Login realizado com sucesso!', [
        'nome' => $admin['nome'],
        'email' => $admin['email']
    ]);
    
} catch (Exception $e) {
    error_log("Erro no login: " . $e->getMessage());
    sendResponse(false, 'Erro ao processar login. Tente novamente.');
}
?>