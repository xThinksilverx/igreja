<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../config/db.php';

if (!isset($_SESSION['admin_id'])) {
    resposta(false, 'Faça login primeiro');
}

$method = $_SERVER['REQUEST_METHOD'];

// GET - Listar alunos
if ($method === 'GET') {
    try {
        if (isset($_GET['turma_id'])) {
            // Alunos de uma turma
            $sql = "SELECT a.* FROM alunos a
                    WHERE a.turma_id = ? AND a.ativo = TRUE
                    ORDER BY a.nome_completo ASC";
            $stmt = $conn->prepare($sql);
            $stmt->execute([$_GET['turma_id']]);
        } else {
            // Todos os alunos
            $sql = "SELECT a.*, t.nome as turma_nome
                    FROM alunos a
                    INNER JOIN turmas t ON a.turma_id = t.id
                    WHERE a.ativo = TRUE
                    ORDER BY a.nome_completo ASC";
            $stmt = $conn->query($sql);
        }
        
        $alunos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        resposta(true, 'Alunos carregados', $alunos);
    } catch (Exception $e) {
        resposta(false, 'Erro ao carregar alunos');
    }
}

// POST - Criar aluno
if ($method === 'POST') {
    $dados = json_decode(file_get_contents('php://input'), true);
    
    $nome = $dados['nome_completo'] ?? '';
    $data_nasc = $dados['data_nascimento'] ?? '';
    $turma_id = $dados['turma_id'] ?? 0;
    
    if (empty($nome) || empty($data_nasc) || empty($turma_id)) {
        resposta(false, 'Nome, data de nascimento e turma são obrigatórios');
    }
    
    try {
        $sql = "INSERT INTO alunos (
                    nome_completo, data_nascimento, cpf, rg,
                    endereco, bairro, cidade, cep,
                    telefone, email,
                    nome_mae, telefone_mae, nome_pai, telefone_pai,
                    turma_id, batizado, data_batismo, paroquia_batismo,
                    observacoes, admin_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $conn->prepare($sql);
        $stmt->execute([
            $nome, $data_nasc,
            $dados['cpf'] ?? null,
            $dados['rg'] ?? null,
            $dados['endereco'] ?? null,
            $dados['bairro'] ?? null,
            $dados['cidade'] ?? 'Joinville',
            $dados['cep'] ?? null,
            $dados['telefone'] ?? null,
            $dados['email'] ?? null,
            $dados['nome_mae'] ?? null,
            $dados['telefone_mae'] ?? null,
            $dados['nome_pai'] ?? null,
            $dados['telefone_pai'] ?? null,
            $turma_id,
            isset($dados['batizado']) ? 1 : 0,
            $dados['data_batismo'] ?? null,
            $dados['paroquia_batismo'] ?? null,
            $dados['observacoes'] ?? null,
            $_SESSION['admin_id']
        ]);
        
        resposta(true, 'Aluno cadastrado!', ['id' => $conn->lastInsertId()]);
    } catch (Exception $e) {
        resposta(false, 'Erro ao cadastrar aluno');
    }
}

// DELETE - Remover aluno
if ($method === 'DELETE') {
    $id = $_GET['id'] ?? 0;
    
    if (empty($id)) {
        resposta(false, 'ID obrigatório');
    }
    
    try {
        $stmt = $conn->prepare("UPDATE alunos SET ativo = FALSE WHERE id = ?");
        $stmt->execute([$id]);
        
        resposta(true, 'Aluno removido!');
    } catch (Exception $e) {
        resposta(false, 'Erro ao remover aluno');
    }
}
?>