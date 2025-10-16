<?php

define('DB_HOST', 'localhost');
define('DB_NAME', 'banco_igreja');
define('DB_USER', 'root');
define('DB_PASS', ''); 

session_start();

date_default_timezone_set('America/Sao_Paulo');

function getConnection() {
    try {
        $conn = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]
        );
        return $conn;
    } catch(PDOException $e) {
        error_log("Erro de conexão: " . $e->getMessage());
        die(json_encode([
            'success' => false,
            'message' => 'Erro ao conectar com o banco de dados.'
        ]));
    }
}

function sendResponse($success, $message, $data = null) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ]);
    exit;
}

function isAdminLoggedIn() {
    return isset($_SESSION['admin_id']) && isset($_SESSION['admin_email']);
}

function logoutAdmin() {
    session_destroy();
    header('Location: login.html');
    exit;
}
?>