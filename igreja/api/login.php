<?php
require_once '../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, 'Método não permitido.');
}

$data = json_decode(file_get_contents('php://input'), true);

$email = trim($data['email'] ?? '');
$senha = $data['password'] ?? '';

if (empty($email) || empty($senha)) {
    sendResponse(false, 'E-mail e senha são obrigatórios.');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendResponse(false, 'E-mail inválido.');
}

try {
    $conn = getConnection();
    
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
    
    $updateStmt = $conn->prepare("
        UPDATE administradores 
        SET ultimo_login = NOW() 
        WHERE id = ?
    ");
    $updateStmt->execute([$admin['id']]);
    
    $logStmt = $conn->prepare("
        INSERT INTO logs_atividade (admin_id, acao, descricao, ip_address) 
        VALUES (?, 'LOGIN', 'Login realizado com sucesso', ?)
    ");
    $logStmt->execute([$admin['id'], $_SERVER['REMOTE_ADDR']]);
    
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