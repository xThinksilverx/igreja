<?php
require_once '../config/db.php';

// Verifica se há sessão ativa
if (isAdminLoggedIn()) {
    sendResponse(true, 'Sessão ativa', [
        'isLoggedIn' => true,
        'nome' => $_SESSION['admin_nome'],
        'email' => $_SESSION['admin_email']
    ]);
} else {
    sendResponse(true, 'Sem sessão ativa', [
        'isLoggedIn' => false
    ]);
}
?>