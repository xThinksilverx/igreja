<?php
header('Content-Type: application/json');
http_response_code(403);
echo json_encode(['success' => false, 'message' => 'Cadastro público desativado. Use o painel administrativo.']);
