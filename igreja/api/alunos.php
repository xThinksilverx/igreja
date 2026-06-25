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

if (!isset($_SESSION['admin_id'])) {
    resposta(false, 'Faça login primeiro');
}

$method = $_SERVER['REQUEST_METHOD'];

// GET - Listar alunos
if ($method === 'GET') {
    try {
        // Buscar aluno específico por id (usado no formulário de edição)
        if (isset($_GET['id'])) {
            $stmt = $conn->prepare(
                "SELECT a.*, t.nome as turma_nome
                 FROM alunos a
                 INNER JOIN turmas t ON a.turma_id = t.id
                 WHERE a.id = ? AND a.ativo = TRUE"
            );
            $stmt->execute([$_GET['id']]);
            $aluno = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($aluno) {
                resposta(true, 'Aluno encontrado', $aluno);
            } else {
                resposta(false, 'Aluno não encontrado');
            }
        }

        // Alunos de uma turma específica (usado no modal "Ver alunos da turma")
        if (isset($_GET['turma_id'])) {
            $sql = "SELECT
                        a.id,
                        a.nome_completo,
                        a.data_nascimento,
                        a.nome_mae,
                        a.telefone_mae,
                        a.observacoes,
                        a.turma_id,
                        t.nome as turma_nome,
                        t.max_faltas,
                        COALESCE(
                            (SELECT COUNT(*)
                             FROM presencas p
                             INNER JOIN aulas au ON p.aula_id = au.id
                             WHERE p.aluno_id = a.id
                             AND p.presente = 0
                             AND au.turma_id = a.turma_id),
                            0
                        ) as total_faltas
                    FROM alunos a
                    INNER JOIN turmas t ON a.turma_id = t.id
                    WHERE a.turma_id = ? AND a.ativo = TRUE
                    ORDER BY a.nome_completo ASC";
            $stmt = $conn->prepare($sql);
            $stmt->execute([$_GET['turma_id']]);
            $alunos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            resposta(true, 'Alunos carregados', $alunos);
        }

        // Todos os alunos
        $sql = "SELECT
                    sub.*,
                    CASE WHEN sub.total_faltas >= sub.max_faltas THEN 1 ELSE 0 END as excedeu_faltas
                FROM (
                    SELECT
                        a.id,
                        a.nome_completo,
                        a.data_nascimento,
                        a.nome_mae,
                        a.telefone_mae,
                        a.observacoes,
                        a.turma_id,
                        t.nome as turma_nome,
                        t.max_faltas,
                        a.ativo,
                        COALESCE(
                            (SELECT COUNT(*)
                             FROM presencas p
                             INNER JOIN aulas au ON p.aula_id = au.id
                             WHERE p.aluno_id = a.id
                             AND p.presente = 0
                             AND au.turma_id = a.turma_id),
                            0
                        ) as total_faltas
                    FROM alunos a
                    INNER JOIN turmas t ON a.turma_id = t.id
                    WHERE a.ativo = TRUE
                ) sub
                ORDER BY sub.nome_completo ASC";
        $stmt = $conn->query($sql);
        $alunos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        resposta(true, 'Alunos carregados', $alunos);

    } catch (Exception $e) {
        resposta(false, 'Erro ao carregar alunos: ' . $e->getMessage());
    }
}

// POST - Criar aluno
if ($method === 'POST') {
    $dados = json_decode(file_get_contents('php://input'), true);

    $nome      = $dados['nome_completo'] ?? '';
    $data_nasc = $dados['data_nascimento'] ?? '';
    $turma_id  = $dados['turma_id'] ?? 0;

    if (empty($nome) || empty($data_nasc) || empty($turma_id)) {
        resposta(false, 'Nome, data de nascimento e turma são obrigatórios');
    }

    try {
        $sql = "INSERT INTO alunos
                    (nome_completo, data_nascimento, nome_mae, telefone_mae,
                     turma_id, observacoes, admin_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            $nome,
            $data_nasc,
            $dados['nome_mae']     ?? null,
            $dados['telefone_mae'] ?? null,
            $turma_id,
            $dados['observacoes']  ?? null,
            $_SESSION['admin_id']
        ]);

        resposta(true, 'Aluno cadastrado!', ['id' => $conn->lastInsertId()]);
    } catch (Exception $e) {
        resposta(false, 'Erro ao cadastrar aluno: ' . $e->getMessage());
    }
}

// PUT - Editar aluno
if ($method === 'PUT') {
    $dados = json_decode(file_get_contents('php://input'), true);

    $id        = $dados['id'] ?? 0;
    $nome      = $dados['nome_completo'] ?? '';
    $data_nasc = $dados['data_nascimento'] ?? '';
    $turma_id  = $dados['turma_id'] ?? 0;

    if (empty($id) || empty($nome) || empty($data_nasc) || empty($turma_id)) {
        resposta(false, 'ID, nome, data de nascimento e turma são obrigatórios');
    }

    try {
        $sql = "UPDATE alunos
                SET nome_completo   = ?,
                    data_nascimento = ?,
                    nome_mae        = ?,
                    telefone_mae    = ?,
                    turma_id        = ?,
                    observacoes     = ?
                WHERE id = ? AND ativo = TRUE";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            $nome,
            $data_nasc,
            $dados['nome_mae']     ?? null,
            $dados['telefone_mae'] ?? null,
            $turma_id,
            $dados['observacoes']  ?? null,
            $id
        ]);

        resposta(true, 'Aluno atualizado!');
    } catch (Exception $e) {
        resposta(false, 'Erro ao atualizar aluno: ' . $e->getMessage());
    }
}

// DELETE - Remover aluno (soft delete)
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
        resposta(false, 'Erro ao remover aluno: ' . $e->getMessage());
    }
}
?>