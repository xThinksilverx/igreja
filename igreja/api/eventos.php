<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/db.php';

$conn->exec("CREATE TABLE IF NOT EXISTS eventos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    data_evento DATE NOT NULL,
    hora_inicio TIME,
    hora_fim TIME,
    tipo ENUM('missa','catequese','crisma','evento','outro') DEFAULT 'evento',
    admin_id INT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        if (isset($_GET['id'])) {
            $stmt = $conn->prepare("SELECT * FROM eventos WHERE id = ? AND ativo = TRUE");
            $stmt->execute([(int)$_GET['id']]);
            $ev = $stmt->fetch(PDO::FETCH_ASSOC);
            $ev ? resposta(true, 'Evento encontrado', $ev) : resposta(false, 'Evento não encontrado');
        }

        if (isset($_GET['mes']) && isset($_GET['ano'])) {
            $stmt = $conn->prepare(
                "SELECT * FROM eventos
                 WHERE MONTH(data_evento) = ? AND YEAR(data_evento) = ? AND ativo = TRUE
                 ORDER BY data_evento, hora_inicio"
            );
            $stmt->execute([(int)$_GET['mes'], (int)$_GET['ano']]);
        } else {
            $stmt = $conn->query(
                "SELECT * FROM eventos WHERE ativo = TRUE ORDER BY data_evento DESC, hora_inicio"
            );
        }

        resposta(true, 'Eventos carregados', $stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (Exception $e) {
        resposta(false, 'Erro ao carregar eventos: ' . $e->getMessage());
    }
}

if (!isset($_SESSION['admin_id'])) {
    resposta(false, 'Faça login primeiro');
}

if ($method === 'POST') {
    $dados  = json_decode(file_get_contents('php://input'), true);
    $titulo = $dados['titulo'] ?? '';
    $data   = $dados['data_evento'] ?? '';

    if (empty($titulo) || empty($data)) {
        resposta(false, 'Título e data são obrigatórios');
    }

    try {
        $stmt = $conn->prepare(
            "INSERT INTO eventos (titulo, descricao, data_evento, hora_inicio, hora_fim, tipo, admin_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $titulo,
            $dados['descricao']    ?? null,
            $data,
            $dados['hora_inicio']  ?: null,
            $dados['hora_fim']     ?: null,
            $dados['tipo']         ?? 'evento',
            $_SESSION['admin_id']
        ]);
        resposta(true, 'Evento criado!', ['id' => $conn->lastInsertId()]);
    } catch (Exception $e) {
        resposta(false, 'Erro ao criar evento: ' . $e->getMessage());
    }
}

if ($method === 'PUT') {
    $dados  = json_decode(file_get_contents('php://input'), true);
    $id     = $dados['id'] ?? 0;
    $titulo = $dados['titulo'] ?? '';
    $data   = $dados['data_evento'] ?? '';

    if (empty($id) || empty($titulo) || empty($data)) {
        resposta(false, 'ID, título e data são obrigatórios');
    }

    try {
        $stmt = $conn->prepare(
            "UPDATE eventos
             SET titulo=?, descricao=?, data_evento=?, hora_inicio=?, hora_fim=?, tipo=?
             WHERE id=? AND ativo=TRUE"
        );
        $stmt->execute([
            $titulo,
            $dados['descricao']   ?? null,
            $data,
            $dados['hora_inicio'] ?: null,
            $dados['hora_fim']    ?: null,
            $dados['tipo']        ?? 'evento',
            $id
        ]);
        resposta(true, 'Evento atualizado!');
    } catch (Exception $e) {
        resposta(false, 'Erro ao atualizar evento: ' . $e->getMessage());
    }
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? 0;
    if (empty($id)) resposta(false, 'ID obrigatório');

    try {
        $stmt = $conn->prepare("UPDATE eventos SET ativo=FALSE WHERE id=?");
        $stmt->execute([$id]);
        resposta(true, 'Evento removido!');
    } catch (Exception $e) {
        resposta(false, 'Erro ao remover evento: ' . $e->getMessage());
    }
}
