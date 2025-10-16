<?php
require_once '../config/db.php';

if (!isAdminLoggedIn()) {
    sendResponse(false, 'Você não está logado.');
}

try {
    $conn = getConnection();
    
    $logStmt = $conn->prepare("
        INSERT INTO logs_atividade (admin_id, acao, descricao, ip_address) 
        VALUES (?, 'LOGOUT', 'Logout realizado', ?)
    ");
    $logStmt->execute([$_SESSION['admin_id'], $_SERVER['REMOTE_ADDR']]);
    
} catch (Exception $e) {
    error_log("Erro ao registrar logout: " . $e->getMessage());
}

session_destroy();

sendResponse(true, 'Logout realizado com sucesso!');
?>