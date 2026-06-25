<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
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

if ($method === 'GET') {
    try {
        if (!isset($_GET['turma_id']) || !isset($_GET['data'])) {
            resposta(false, 'Parâmetros turma_id e data são obrigatórios');
        }

        $turma_id = (int)$_GET['turma_id'];
        $data     = $_GET['data'];

        // Busca aula existente (sem criar — aula só é criada ao salvar)
        $stmt = $conn->prepare(
            "SELECT a.*, t.nome AS turma_nome
             FROM aulas a
             JOIN turmas t ON a.turma_id = t.id
             WHERE a.turma_id = ? AND a.data_aula = ?"
        );
        $stmt->execute([$turma_id, $data]);
        $aula    = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
        $aula_id = $aula ? (int)$aula['id'] : 0;

        // Alunos com presenças (se aula existir) + total de faltas
        $stmt = $conn->prepare(
            "SELECT
                al.id            AS aluno_id,
                al.nome_completo,
                t.max_faltas,
                COALESCE(
                    (SELECT COUNT(*)
                     FROM presencas p2
                     INNER JOIN aulas au ON p2.aula_id = au.id
                     WHERE p2.aluno_id = al.id
                       AND p2.presente = 0
                       AND au.turma_id = al.turma_id),
                    0
                ) AS total_faltas,
                p.presente,
                p.justificativa
             FROM alunos al
             INNER JOIN turmas t ON al.turma_id = t.id
             LEFT  JOIN presencas p ON p.aluno_id = al.id AND p.aula_id = :aula_id
             WHERE al.turma_id = :turma_id AND al.ativo = TRUE
             ORDER BY al.nome_completo ASC"
        );
        $stmt->execute([':aula_id' => $aula_id, ':turma_id' => $turma_id]);
        $alunos = $stmt->fetchAll(PDO::FETCH_ASSOC);

        resposta(true, 'Chamada carregada', ['aula' => $aula, 'alunos' => $alunos]);
    } catch (Exception $e) {
        resposta(false, 'Erro ao carregar chamada: ' . $e->getMessage());
    }
}

if ($method === 'POST') {
    $dados     = json_decode(file_get_contents('php://input'), true);
    $turma_id  = (int)($dados['turma_id']  ?? 0);
    $data      = $dados['data']      ?? '';
    $presencas = $dados['presencas'] ?? [];

    if (!$turma_id || !$data || empty($presencas)) {
        resposta(false, 'Dados incompletos');
    }

    try {
        $conn->beginTransaction();

        // Cria a aula apenas agora, ao salvar
        $stmt = $conn->prepare("SELECT id FROM aulas WHERE turma_id = ? AND data_aula = ?");
        $stmt->execute([$turma_id, $data]);
        $aula = $stmt->fetch();

        if ($aula) {
            $aula_id = (int)$aula['id'];
        } else {
            $stmt = $conn->prepare("INSERT INTO aulas (turma_id, data_aula, admin_id) VALUES (?, ?, ?)");
            $stmt->execute([$turma_id, $data, $_SESSION['admin_id']]);
            $aula_id = (int)$conn->lastInsertId();
        }

        foreach ($presencas as $p) {
            $stmt = $conn->prepare(
                "INSERT INTO presencas (aula_id, aluno_id, presente, justificativa, registrado_por)
                 VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                     presente       = VALUES(presente),
                     justificativa  = VALUES(justificativa),
                     registrado_por = VALUES(registrado_por)"
            );
            $stmt->execute([
                $aula_id,
                (int)$p['aluno_id'],
                $p['presente'] ? 1 : 0,
                $p['justificativa'] ?? null,
                $_SESSION['admin_id']
            ]);
        }

        $stmt = $conn->prepare("UPDATE aulas SET realizada = TRUE WHERE id = ?");
        $stmt->execute([$aula_id]);

        $conn->commit();
        resposta(true, 'Chamada salva!');
    } catch (Exception $e) {
        $conn->rollBack();
        resposta(false, 'Erro ao salvar: ' . $e->getMessage());
    }
}
