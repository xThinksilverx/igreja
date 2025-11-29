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

$method = $_SERVER['REQUEST_METHOD'];

// GET - Listar avisos
if ($method === 'GET') {
    try {
        if (isset($_GET['id'])) {
            // Buscar um aviso específico
            $stmt = $conn->prepare("SELECT * FROM avisos WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            $aviso = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($aviso && $aviso['itens_lista']) {
                $aviso['itens_lista'] = json_decode($aviso['itens_lista'], true);
            }
            
            resposta(true, 'Aviso encontrado', $aviso);
        } else {
            // Listar todos os avisos ativos
            $stmt = $conn->query("SELECT * FROM avisos WHERE ativo = TRUE ORDER BY data_criacao DESC");
            $avisos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($avisos as &$aviso) {
                if ($aviso['itens_lista']) {
                    $aviso['itens_lista'] = json_decode($aviso['itens_lista'], true);
                }
            }
            
            resposta(true, 'Avisos carregados', $avisos);
        }
    } catch (Exception $e) {
        resposta(false, 'Erro ao carregar avisos: ' . $e->getMessage());
    }
}

// POST - Criar aviso
if ($method === 'POST') {
    if (!isset($_SESSION['admin_id'])) {
        resposta(false, 'Faça login primeiro');
    }
    
    $dados = json_decode(file_get_contents('php://input'), true);
    
    $titulo = $dados['titulo'] ?? '';
    $descricao = $dados['descricao'] ?? '';
    $itens_lista = $dados['itens_lista'] ?? [];
    $imagem = $dados['imagem'] ?? null;
    
    if (empty($titulo)) {
        resposta(false, 'Título é obrigatório');
    }
    
    try {
        $itens_json = json_encode($itens_lista, JSON_UNESCAPED_UNICODE);
        
        $sql = "INSERT INTO avisos (titulo, descricao, itens_lista, imagem, admin_id) 
                VALUES (?, ?, ?, ?, ?)";
        
        $stmt = $conn->prepare($sql);
        $stmt->execute([$titulo, $descricao, $itens_json, $imagem, $_SESSION['admin_id']]);
        
        resposta(true, 'Aviso criado com sucesso!', ['id' => $conn->lastInsertId()]);
    } catch (Exception $e) {
        resposta(false, 'Erro ao criar aviso: ' . $e->getMessage());
    }
}

// PUT - Atualizar aviso
if ($method === 'PUT') {
    if (!isset($_SESSION['admin_id'])) {
        resposta(false, 'Faça login primeiro');
    }
    
    $dados = json_decode(file_get_contents('php://input'), true);
    
    $id = $dados['id'] ?? 0;
    $titulo = $dados['titulo'] ?? '';
    $descricao = $dados['descricao'] ?? '';
    $itens_lista = $dados['itens_lista'] ?? [];
    $imagem = $dados['imagem'] ?? null;
    
    if (empty($id) || empty($titulo)) {
        resposta(false, 'ID e título são obrigatórios');
    }
    
    try {
        $itens_json = json_encode($itens_lista, JSON_UNESCAPED_UNICODE);
        
        $sql = "UPDATE avisos 
                SET titulo = ?, descricao = ?, itens_lista = ?, imagem = ? 
                WHERE id = ?";
        
        $stmt = $conn->prepare($sql);
        $stmt->execute([$titulo, $descricao, $itens_json, $imagem, $id]);
        
        resposta(true, 'Aviso atualizado com sucesso!');
    } catch (Exception $e) {
        resposta(false, 'Erro ao atualizar aviso: ' . $e->getMessage());
    }
}

// DELETE - Desativar aviso
if ($method === 'DELETE') {
    if (!isset($_SESSION['admin_id'])) {
        resposta(false, 'Faça login primeiro');
    }
    
    $id = $_GET['id'] ?? 0;
    
    if (empty($id)) {
        resposta(false, 'ID obrigatório');
    }
    
    try {
        $stmt = $conn->prepare("UPDATE avisos SET ativo = FALSE WHERE id = ?");
        $stmt->execute([$id]);
        
        resposta(true, 'Aviso removido!');
    } catch (Exception $e) {
        resposta(false, 'Erro ao remover aviso: ' . $e->getMessage());
    }
}
?>