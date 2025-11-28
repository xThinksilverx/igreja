<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../config/db.php';

if (!isset($_SESSION['admin_id'])) {
    resposta(false, 'Faça login primeiro');
}

$method = $_SERVER['REQUEST_METHOD'];

// GET - Buscar/criar aula e listar presenças
if ($method === 'GET') {
    try {
        // Buscar ou criar aula
        if (isset($_GET['turma_id']) && isset($_GET['data'])) {
            $turma_id = $_GET['turma_id'];
            $data = $_GET['data'];
            
            // Busca aula
            $stmt = $conn->prepare("SELECT * FROM aulas WHERE turma_id = ? AND data_aula = ?");
            $stmt->execute([$turma_id, $data]);
            $aula = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Se não existe, cria
            if (!$aula) {
                $stmt = $conn->prepare("INSERT INTO aulas (turma_id, data_aula, admin_id) VALUES (?, ?, ?)");
                $stmt->execute([$turma_id, $data, $_SESSION['admin_id']]);
                
                $aula_id = $conn->lastInsertId();
                $stmt = $conn->prepare("SELECT * FROM aulas WHERE id = ?");
                $stmt->execute([$aula_id]);
                $aula = $stmt->fetch(PDO::FETCH_ASSOC);
            }
            
            resposta(true, 'Aula encontrada', $aula);
        }
        
        // Listar presenças de uma aula
        if (isset($_GET['aula_id'])) {
            $aula_id = $_GET['aula_id'];
            
            // Busca aula
            $stmt = $conn->prepare("SELECT a.*, t.nome as turma_nome FROM aulas a 
                                   JOIN turmas t ON a.turma_id = t.id WHERE a.id = ?");
            $stmt->execute([$aula_id]);
            $aula = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Busca alunos com suas presenças
            $stmt = $conn->prepare("
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
            $stmt->execute([$aula_id, $aula['turma_id']]);
            $alunos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            resposta(true, 'Chamada carregada', [
                'aula' => $aula,
                'alunos' => $alunos
            ]);
        }
    } catch (Exception $e) {
        resposta(false, 'Erro ao carregar chamada');
    }
}

// POST - Salvar chamada
if ($method === 'POST') {
    $dados = json_decode(file_get_contents('php://input'), true);
    
    $aula_id = $dados['aula_id'] ?? 0;
    $presencas = $dados['presencas'] ?? [];
    
    if (empty($aula_id) || empty($presencas)) {
        resposta(false, 'Dados incompletos');
    }
    
    try {
        $conn->beginTransaction();
        
        foreach ($presencas as $p) {
            $sql = "INSERT INTO presencas (aula_id, aluno_id, presente, justificativa, observacao, registrado_por)
                    VALUES (?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        presente = VALUES(presente),
                        justificativa = VALUES(justificativa),
                        observacao = VALUES(observacao),
                        registrado_por = VALUES(registrado_por)";
            
            $stmt = $conn->prepare($sql);
            $stmt->execute([
                $aula_id,
                $p['aluno_id'],
                $p['presente'] ? 1 : 0,
                $p['justificativa'] ?? null,
                $p['observacao'] ?? null,
                $_SESSION['admin_id']
            ]);
        }
        
        // Marca aula como realizada
        $stmt = $conn->prepare("UPDATE aulas SET realizada = TRUE WHERE id = ?");
        $stmt->execute([$aula_id]);
        
        $conn->commit();
        resposta(true, 'Chamada salva com sucesso!');
    } catch (Exception $e) {
        $conn->rollBack();
        resposta(false, 'Erro ao salvar chamada');
    }
}
?>