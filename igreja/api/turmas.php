<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../config/db.php';

// Verifica se está logado
if (!isset($_SESSION['admin_id'])) {
    resposta(false, 'Faça login primeiro');
}

$method = $_SERVER['REQUEST_METHOD'];

// GET - Listar turmas
if ($method === 'GET') {
    try {
        $sql = "SELECT t.*, 
                COUNT(DISTINCT a.id) as total_alunos
                FROM turmas t
                LEFT JOIN alunos a ON a.turma_id = t.id AND a.ativo = TRUE
                WHERE t.ativo = TRUE
                GROUP BY t.id
                ORDER BY t.ano DESC, t.nome ASC";
        
        $stmt = $conn->query($sql);
        $turmas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        resposta(true, 'Turmas carregadas', $turmas);
    } catch (Exception $e) {
        resposta(false, 'Erro ao carregar turmas');
    }
}

// POST - Criar turma
if ($method === 'POST') {
    $dados = json_decode(file_get_contents('php://input'), true);
    
    $nome = $dados['nome'] ?? '';
    $tipo = $dados['tipo'] ?? '';
    $ano = $dados['ano'] ?? date('Y');
    $dia_semana = $dados['dia_semana'] ?? '';
    $horario = $dados['horario'] ?? '';
    $professor_nome = $dados['professor_nome'] ?? '';
    $professor_telefone = $dados['professor_telefone'] ?? '';
    $max_faltas = $dados['max_faltas'] ?? 5;
    
    if (empty($nome) || empty($tipo) || empty($dia_semana) || empty($horario)) {
        resposta(false, 'Preencha todos os campos obrigatórios');
    }
    
    try {
        $sql = "INSERT INTO turmas (nome, tipo, ano, dia_semana, horario, professor_nome, professor_telefone, max_faltas, admin_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $conn->prepare($sql);
        $stmt->execute([
            $nome, $tipo, $ano, $dia_semana, $horario,
            $professor_nome, $professor_telefone, $max_faltas,
            $_SESSION['admin_id']
        ]);
        
        resposta(true, 'Turma criada com sucesso!', ['id' => $conn->lastInsertId()]);
    } catch (Exception $e) {
        resposta(false, 'Erro ao criar turma');
    }
}

// DELETE - Desativar turma
if ($method === 'DELETE') {
    $id = $_GET['id'] ?? 0;
    
    if (empty($id)) {
        resposta(false, 'ID obrigatório');
    }
    
    try {
        $stmt = $conn->prepare("UPDATE turmas SET ativo = FALSE WHERE id = ?");
        $stmt->execute([$id]);
        
        resposta(true, 'Turma desativada!');
    } catch (Exception $e) {
        resposta(false, 'Erro ao desativar turma');
    }
}
?>