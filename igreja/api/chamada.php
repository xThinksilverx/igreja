<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
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

// GET - Buscar informações de chamada
if ($method === 'GET') {
    try {
        if (isset($_GET['aula_id'])) {
            // Buscar chamada de uma aula específica
            $aulaId = $_GET['aula_id'];
            
            // Busca informações da aula
            $stmtAula = $conn->prepare("
                SELECT a.*, t.nome as turma_nome, t.tipo as turma_tipo
                FROM aulas a
                INNER JOIN turmas t ON a.turma_id = t.id
                WHERE a.id = ?
            ");
            $stmtAula->execute([$aulaId]);
            $aula = $stmtAula->fetch();
            
            if (!$aula) {
                sendResponse(false, 'Aula não encontrada.');
            }
            
            // Busca alunos e suas presenças
            $stmtAlunos = $conn->prepare("
                SELECT 
                    al.id as aluno_id,
                    al.nome_completo,
                    p.id as presenca_id,
                    COALESCE(p.presente, NULL) as presente,
                    p.justificativa,
                    p.observacao
                FROM alunos al
                LEFT JOIN presencas p ON p.aluno_id = al.id AND p.aula_id = ?
                WHERE al.turma_id = ? AND al.ativo = TRUE
                ORDER BY al.nome_completo ASC
            ");
            $stmtAlunos->execute([$aulaId, $aula['turma_id']]);
            $alunos = $stmtAlunos->fetchAll();
            
            sendResponse(true, 'Chamada carregada.', [
                'aula' => $aula,
                'alunos' => $alunos
            ]);
            
        } elseif (isset($_GET['turma_id']) && isset($_GET['data'])) {
            // Buscar ou criar aula para uma data específica
            $turmaId = $_GET['turma_id'];
            $data = $_GET['data'];
            
            $stmt = $conn->prepare("SELECT * FROM aulas WHERE turma_id = ? AND data_aula = ?");
            $stmt->execute([$turmaId, $data]);
            $aula = $stmt->fetch();
            
            if (!$aula) {
                // Criar aula automaticamente
                $stmtCreate = $conn->prepare("
                    INSERT INTO aulas (turma_id, data_aula, admin_id)
                    VALUES (?, ?, ?)
                ");
                $stmtCreate->execute([$turmaId, $data, $_SESSION['admin_id']]);
                $aulaId = $conn->lastInsertId();
                
                $stmt = $conn->prepare("SELECT * FROM aulas WHERE id = ?");
                $stmt->execute([$aulaId]);
                $aula = $stmt->fetch();
            }
            
            sendResponse(true, 'Aula encontrada.', $aula);
            
        } else {
            sendResponse(false, 'Parâmetros inválidos.');
        }
    } catch (Exception $e) {
        error_log("Erro ao carregar chamada: " . $e->getMessage());
        sendResponse(false, 'Erro ao carregar chamada.');
    }
}

// POST - Registrar chamada completa
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $aulaId = $data['aula_id'] ?? 0;
    $presencas = $data['presencas'] ?? [];
    
    if (empty($aulaId) || empty($presencas)) {
        sendResponse(false, 'Dados incompletos.');
    }
    
    try {
        $conn->beginTransaction();
        
        // Atualizar ou inserir cada presença
        $stmtInsert = $conn->prepare("
            INSERT INTO presencas (aula_id, aluno_id, presente, justificativa, observacao, registrado_por)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                presente = VALUES(presente),
                justificativa = VALUES(justificativa),
                observacao = VALUES(observacao),
                registrado_por = VALUES(registrado_por),
                data_registro = NOW()
        ");
        
        foreach ($presencas as $presenca) {
            $stmtInsert->execute([
                $aulaId,
                $presenca['aluno_id'],
                $presenca['presente'] ? 1 : 0,
                $presenca['justificativa'] ?? null,
                $presenca['observacao'] ?? null,
                $_SESSION['admin_id']
            ]);
        }
        
        // Marcar aula como realizada
        $stmtAula = $conn->prepare("UPDATE aulas SET realizada = TRUE WHERE id = ?");
        $stmtAula->execute([$aulaId]);
        
        $conn->commit();
        
        // Log
        $logStmt = $conn->prepare("
            INSERT INTO logs_atividade (admin_id, acao, descricao, ip_address)
            VALUES (?, 'REGISTRAR_CHAMADA', ?, ?)
        ");
        $logStmt->execute([
            $_SESSION['admin_id'],
            "Chamada registrada - Aula ID: $aulaId",
            $_SERVER['REMOTE_ADDR']
        ]);
        
        sendResponse(true, 'Chamada registrada com sucesso!');
        
    } catch (Exception $e) {
        $conn->rollBack();
        error_log("Erro ao registrar chamada: " . $e->getMessage());
        sendResponse(false, 'Erro ao registrar chamada.');
    }
}

// PUT - Atualizar presença individual
if ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $presencaId = $data['presenca_id'] ?? 0;
    $presente = $data['presente'] ?? false;
    $justificativa = $data['justificativa'] ?? null;
    
    if (empty($presencaId)) {
        sendResponse(false, 'ID da presença é obrigatório.');
    }
    
    try {
        $stmt = $conn->prepare("
            UPDATE presencas 
            SET presente = ?, justificativa = ?, registrado_por = ?, data_registro = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$presente ? 1 : 0, $justificativa, $_SESSION['admin_id'], $presencaId]);
        
        sendResponse(true, 'Presença atualizada!');
        
    } catch (Exception $e) {
        error_log("Erro ao atualizar presença: " . $e->getMessage());
        sendResponse(false, 'Erro ao atualizar presença.');
    }
}
?>