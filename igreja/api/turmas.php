<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/db.php';

if (!isAdminLoggedIn()) {
    sendResponse(false, 'Acesso negado. Faça login primeiro.');
}

$method = $_SERVER['REQUEST_METHOD'];
$conn = getConnection();

// GET - Listar turmas
if ($method === 'GET') {
    try {
        if (isset($_GET['id'])) {
            // Buscar turma específica
            $stmt = $conn->prepare("
                SELECT t.*, 
                       COUNT(DISTINCT a.id) as total_alunos,
                       COUNT(DISTINCT aulas.id) as total_aulas
                FROM turmas t
                LEFT JOIN alunos a ON a.turma_id = t.id AND a.ativo = TRUE
                LEFT JOIN aulas ON aulas.turma_id = t.id
                WHERE t.id = ?
                GROUP BY t.id
            ");
            $stmt->execute([$_GET['id']]);
            $turma = $stmt->fetch();
            
            if (!$turma) {
                sendResponse(false, 'Turma não encontrada.');
            }
            
            sendResponse(true, 'Turma encontrada.', $turma);
        } else {
            // Listar todas as turmas
            $stmt = $conn->query("
                SELECT t.*, 
                       COUNT(DISTINCT a.id) as total_alunos,
                       COUNT(DISTINCT aulas.id) as total_aulas
                FROM turmas t
                LEFT JOIN alunos a ON a.turma_id = t.id AND a.ativo = TRUE
                LEFT JOIN aulas ON aulas.turma_id = t.id
                WHERE t.ativo = TRUE
                GROUP BY t.id
                ORDER BY t.ano DESC, t.nome ASC
            ");
            $turmas = $stmt->fetchAll();
            
            sendResponse(true, 'Turmas carregadas.', $turmas);
        }
    } catch (Exception $e) {
        error_log("Erro ao listar turmas: " . $e->getMessage());
        sendResponse(false, 'Erro ao carregar turmas.');
    }
}

// POST - Criar nova turma
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $nome = trim($data['nome'] ?? '');
    $tipo = $data['tipo'] ?? '';
    $ano = $data['ano'] ?? date('Y');
    $dia_semana = $data['dia_semana'] ?? '';
    $horario = $data['horario'] ?? '';
    $professor_nome = trim($data['professor_nome'] ?? '');
    $professor_telefone = trim($data['professor_telefone'] ?? '');
    $max_faltas = $data['max_faltas'] ?? 5;
    
    if (empty($nome) || empty($tipo) || empty($dia_semana) || empty($horario)) {
        sendResponse(false, 'Preencha todos os campos obrigatórios.');
    }
    
    try {
        $stmt = $conn->prepare("
            INSERT INTO turmas (nome, tipo, ano, dia_semana, horario, professor_nome, professor_telefone, max_faltas, admin_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $nome, $tipo, $ano, $dia_semana, $horario,
            $professor_nome, $professor_telefone, $max_faltas,
            $_SESSION['admin_id']
        ]);
        
        $turmaId = $conn->lastInsertId();
        
        // Log
        $logStmt = $conn->prepare("
            INSERT INTO logs_atividade (admin_id, acao, descricao, ip_address)
            VALUES (?, 'CRIAR_TURMA', ?, ?)
        ");
        $logStmt->execute([
            $_SESSION['admin_id'],
            "Turma criada: $nome",
            $_SERVER['REMOTE_ADDR']
        ]);
        
        sendResponse(true, 'Turma criada com sucesso!', ['id' => $turmaId]);
        
    } catch (Exception $e) {
        error_log("Erro ao criar turma: " . $e->getMessage());
        sendResponse(false, 'Erro ao criar turma.');
    }
}

// PUT - Atualizar turma
if ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $id = $data['id'] ?? 0;
    
    if (empty($id)) {
        sendResponse(false, 'ID da turma é obrigatório.');
    }
    
    try {
        $campos = [];
        $valores = [];
        
        if (isset($data['nome'])) {
            $campos[] = "nome = ?";
            $valores[] = trim($data['nome']);
        }
        if (isset($data['professor_nome'])) {
            $campos[] = "professor_nome = ?";
            $valores[] = trim($data['professor_nome']);
        }
        if (isset($data['professor_telefone'])) {
            $campos[] = "professor_telefone = ?";
            $valores[] = trim($data['professor_telefone']);
        }
        if (isset($data['max_faltas'])) {
            $campos[] = "max_faltas = ?";
            $valores[] = $data['max_faltas'];
        }
        if (isset($data['ativo'])) {
            $campos[] = "ativo = ?";
            $valores[] = $data['ativo'] ? 1 : 0;
        }
        
        if (empty($campos)) {
            sendResponse(false, 'Nenhum campo para atualizar.');
        }
        
        $valores[] = $id;
        
        $sql = "UPDATE turmas SET " . implode(", ", $campos) . " WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->execute($valores);
        
        sendResponse(true, 'Turma atualizada com sucesso!');
        
    } catch (Exception $e) {
        error_log("Erro ao atualizar turma: " . $e->getMessage());
        sendResponse(false, 'Erro ao atualizar turma.');
    }
}

// DELETE - Desativar turma
if ($method === 'DELETE') {
    $id = $_GET['id'] ?? 0;
    
    if (empty($id)) {
        sendResponse(false, 'ID da turma é obrigatório.');
    }
    
    try {
        $stmt = $conn->prepare("UPDATE turmas SET ativo = FALSE WHERE id = ?");
        $stmt->execute([$id]);
        
        sendResponse(true, 'Turma desativada com sucesso!');
        
    } catch (Exception $e) {
        error_log("Erro ao desativar turma: " . $e->getMessage());
        sendResponse(false, 'Erro ao desativar turma.');
    }
}
?>