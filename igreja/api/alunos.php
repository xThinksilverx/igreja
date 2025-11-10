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

// GET - Listar alunos
if ($method === 'GET') {
    try {
        if (isset($_GET['id'])) {
            // Buscar aluno específico com estatísticas
            $stmt = $conn->prepare("
                SELECT a.*, t.nome as turma_nome,
                       (SELECT COUNT(*) FROM aulas WHERE turma_id = a.turma_id AND realizada = TRUE) as total_aulas,
                       (SELECT COUNT(*) FROM presencas p 
                        JOIN aulas au ON p.aula_id = au.id 
                        WHERE p.aluno_id = a.id AND p.presente = TRUE) as total_presencas,
                       (SELECT COUNT(*) FROM presencas p 
                        JOIN aulas au ON p.aula_id = au.id 
                        WHERE p.aluno_id = a.id AND p.presente = FALSE) as total_faltas
                FROM alunos a
                INNER JOIN turmas t ON a.turma_id = t.id
                WHERE a.id = ?
            ");
            $stmt->execute([$_GET['id']]);
            $aluno = $stmt->fetch();
            
            if (!$aluno) {
                sendResponse(false, 'Aluno não encontrado.');
            }
            
            sendResponse(true, 'Aluno encontrado.', $aluno);
            
        } elseif (isset($_GET['turma_id'])) {
            // Listar alunos de uma turma específica
            $stmt = $conn->prepare("
                SELECT a.*, 
                       (SELECT COUNT(*) FROM presencas p 
                        JOIN aulas au ON p.aula_id = au.id 
                        WHERE p.aluno_id = a.id AND p.presente = FALSE) as total_faltas
                FROM alunos a
                WHERE a.turma_id = ? AND a.ativo = TRUE
                ORDER BY a.nome_completo ASC
            ");
            $stmt->execute([$_GET['turma_id']]);
            $alunos = $stmt->fetchAll();
            
            sendResponse(true, 'Alunos carregados.', $alunos);
            
        } else {
            // Listar todos os alunos
            $stmt = $conn->query("
                SELECT a.*, t.nome as turma_nome, t.tipo as turma_tipo
                FROM alunos a
                INNER JOIN turmas t ON a.turma_id = t.id
                WHERE a.ativo = TRUE
                ORDER BY a.nome_completo ASC
            ");
            $alunos = $stmt->fetchAll();
            
            sendResponse(true, 'Alunos carregados.', $alunos);
        }
    } catch (Exception $e) {
        error_log("Erro ao listar alunos: " . $e->getMessage());
        sendResponse(false, 'Erro ao carregar alunos.');
    }
}

// POST - Cadastrar novo aluno
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $nome_completo = trim($data['nome_completo'] ?? '');
    $data_nascimento = $data['data_nascimento'] ?? '';
    $turma_id = $data['turma_id'] ?? 0;
    
    if (empty($nome_completo) || empty($data_nascimento) || empty($turma_id)) {
        sendResponse(false, 'Nome, data de nascimento e turma são obrigatórios.');
    }
    
    try {
        $stmt = $conn->prepare("
            INSERT INTO alunos (
                nome_completo, data_nascimento, cpf, rg,
                endereco, bairro, cidade, cep,
                telefone, email,
                nome_mae, telefone_mae, nome_pai, telefone_pai,
                turma_id, batizado, data_batismo, paroquia_batismo,
                observacoes, admin_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $nome_completo,
            $data_nascimento,
            $data['cpf'] ?? null,
            $data['rg'] ?? null,
            $data['endereco'] ?? null,
            $data['bairro'] ?? null,
            $data['cidade'] ?? 'Joinville',
            $data['cep'] ?? null,
            $data['telefone'] ?? null,
            $data['email'] ?? null,
            $data['nome_mae'] ?? null,
            $data['telefone_mae'] ?? null,
            $data['nome_pai'] ?? null,
            $data['telefone_pai'] ?? null,
            $turma_id,
            $data['batizado'] ?? false,
            $data['data_batismo'] ?? null,
            $data['paroquia_batismo'] ?? null,
            $data['observacoes'] ?? null,
            $_SESSION['admin_id']
        ]);
        
        $alunoId = $conn->lastInsertId();
        
        // Log
        $logStmt = $conn->prepare("
            INSERT INTO logs_atividade (admin_id, acao, descricao, ip_address)
            VALUES (?, 'CADASTRAR_ALUNO', ?, ?)
        ");
        $logStmt->execute([
            $_SESSION['admin_id'],
            "Aluno cadastrado: $nome_completo",
            $_SERVER['REMOTE_ADDR']
        ]);
        
        sendResponse(true, 'Aluno cadastrado com sucesso!', ['id' => $alunoId]);
        
    } catch (Exception $e) {
        error_log("Erro ao cadastrar aluno: " . $e->getMessage());
        sendResponse(false, 'Erro ao cadastrar aluno.');
    }
}

// PUT - Atualizar aluno
if ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $id = $data['id'] ?? 0;
    
    if (empty($id)) {
        sendResponse(false, 'ID do aluno é obrigatório.');
    }
    
    try {
        $stmt = $conn->prepare("
            UPDATE alunos SET
                nome_completo = ?, telefone = ?, email = ?,
                endereco = ?, bairro = ?, cep = ?,
                nome_mae = ?, telefone_mae = ?,
                nome_pai = ?, telefone_pai = ?,
                observacoes = ?
            WHERE id = ?
        ");
        
        $stmt->execute([
            $data['nome_completo'] ?? '',
            $data['telefone'] ?? null,
            $data['email'] ?? null,
            $data['endereco'] ?? null,
            $data['bairro'] ?? null,
            $data['cep'] ?? null,
            $data['nome_mae'] ?? null,
            $data['telefone_mae'] ?? null,
            $data['nome_pai'] ?? null,
            $data['telefone_pai'] ?? null,
            $data['observacoes'] ?? null,
            $id
        ]);
        
        sendResponse(true, 'Aluno atualizado com sucesso!');
        
    } catch (Exception $e) {
        error_log("Erro ao atualizar aluno: " . $e->getMessage());
        sendResponse(false, 'Erro ao atualizar aluno.');
    }
}

// DELETE - Desativar aluno
if ($method === 'DELETE') {
    $id = $_GET['id'] ?? 0;
    
    if (empty($id)) {
        sendResponse(false, 'ID do aluno é obrigatório.');
    }
    
    try {
        $stmt = $conn->prepare("UPDATE alunos SET ativo = FALSE WHERE id = ?");
        $stmt->execute([$id]);
        
        sendResponse(true, 'Aluno removido com sucesso!');
        
    } catch (Exception $e) {
        error_log("Erro ao remover aluno: " . $e->getMessage());
        sendResponse(false, 'Erro ao remover aluno.');
    }
}
?>