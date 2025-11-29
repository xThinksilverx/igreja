CREATE DATABASE IF NOT EXISTS banco_igreja 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE banco_igreja;

CREATE TABLE IF NOT EXISTS administradores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    chave_admin VARCHAR(100) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_login TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Senha: admin123 (hash gerado com password_hash)
INSERT INTO administradores (nome, email, senha, chave_admin) 
VALUES (
    'Administrador Principal',
    'admin@monteclaro.com',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'MonteClaroAdmin2025'
);

CREATE TABLE IF NOT EXISTS avisos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT NOT NULL,
    itens_lista TEXT NULL,
    imagem VARCHAR(255),
    ativo BOOLEAN DEFAULT TRUE,
    admin_id INT NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES administradores(id) ON DELETE CASCADE,
    INDEX idx_ativo (ativo),
    INDEX idx_data (data_criacao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO avisos (titulo, descricao, itens_lista, imagem, admin_id, ativo) VALUES
('Avisos Importantes', '', 
'["Está chegando a nossa Mega Festa Julina!", "MEGA FESTA JULINA da Paróquia Nossa Senhora do Monte Claro!", "12 de Julho na comunidade Nossa Senhora do Monte Claro - Rua Hilda Rech, 30 - Vila Nova!"]',
'avisos/festa_junina.jpeg', 
1, 
TRUE);

CREATE TABLE IF NOT EXISTS eventos_calendario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    data_evento DATE NOT NULL,
    hora_inicio TIME,
    hora_fim TIME,
    tipo_evento ENUM('missa', 'catequese', 'crisma', 'reuniao', 'festa', 'outro') DEFAULT 'outro',
    ativo BOOLEAN DEFAULT TRUE,
    admin_id INT NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES administradores(id) ON DELETE CASCADE,
    INDEX idx_data_evento (data_evento),
    INDEX idx_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cursos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    dia_semana ENUM('domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'),
    horario VARCHAR(50),
    imagem VARCHAR(255),
    telefone_contato VARCHAR(20),
    ativo BOOLEAN DEFAULT TRUE,
    admin_id INT NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES administradores(id) ON DELETE CASCADE,
    INDEX idx_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO cursos (nome, descricao, dia_semana, horario, telefone_contato, admin_id) VALUES
('Crisma', 'Todas as quintas na igreja. Para mais informações sobre inscrição entre em contato.', 'quinta', '19:00', '(47) 3455-5072', 1),
('Curso de Padrinhos', 'Informações sobre curso de padrinhos para batismo entre em contato com a secretaria.', NULL, NULL, '(47) 3455-5072', 1),
('Catequese', 'Todas as quartas-feiras aulas de catequese, para saber mais sobre inscrições entre em contato.', 'quarta', '19:00', '(47) 3455-5072', 1);

CREATE TABLE IF NOT EXISTS logs_atividade (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    acao VARCHAR(100) NOT NULL,
    descricao TEXT,
    ip_address VARCHAR(45),
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES administradores(id) ON DELETE CASCADE,
    INDEX idx_admin (admin_id),
    INDEX idx_data (data_hora)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS turmas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    tipo ENUM('catequese', 'crisma', 'padrinhos', 'outro') DEFAULT 'outro',
    ano INT NOT NULL,
    dia_semana ENUM('segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'),
    horario TIME,
    professor_nome VARCHAR(100),
    professor_telefone VARCHAR(20),
    max_faltas INT DEFAULT 5,
    ativo BOOLEAN DEFAULT TRUE,
    admin_id INT NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES administradores(id) ON DELETE CASCADE,
    INDEX idx_ativo (ativo),
    INDEX idx_ano (ano)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS alunos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_completo VARCHAR(150) NOT NULL,
    data_nascimento DATE NOT NULL,
    cpf VARCHAR(14),
    rg VARCHAR(20),
    endereco VARCHAR(200),
    bairro VARCHAR(100),
    cidade VARCHAR(100) DEFAULT 'Joinville',
    cep VARCHAR(10),
    telefone VARCHAR(20),
    email VARCHAR(100),
    nome_mae VARCHAR(150),
    telefone_mae VARCHAR(20),
    nome_pai VARCHAR(150),
    telefone_pai VARCHAR(20),
    turma_id INT NOT NULL,
    batizado BOOLEAN DEFAULT FALSE,
    data_batismo DATE,
    paroquia_batismo VARCHAR(200),
    observacoes TEXT,
    total_faltas INT DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE,
    admin_id INT NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (turma_id) REFERENCES turmas(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES administradores(id) ON DELETE CASCADE,
    INDEX idx_turma (turma_id),
    INDEX idx_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS aulas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    turma_id INT NOT NULL,
    data_aula DATE NOT NULL,
    realizada BOOLEAN DEFAULT FALSE,
    observacoes TEXT,
    admin_id INT NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (turma_id) REFERENCES turmas(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES administradores(id) ON DELETE CASCADE,
    UNIQUE KEY unique_aula (turma_id, data_aula),
    INDEX idx_data (data_aula)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS presencas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aula_id INT NOT NULL,
    aluno_id INT NOT NULL,
    presente BOOLEAN DEFAULT FALSE,
    justificativa TEXT,
    observacao TEXT,
    registrado_por INT NOT NULL,
    data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (aula_id) REFERENCES aulas(id) ON DELETE CASCADE,
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE,
    FOREIGN KEY (registrado_por) REFERENCES administradores(id) ON DELETE CASCADE,
    UNIQUE KEY unique_presenca (aula_id, aluno_id),
    INDEX idx_aluno (aluno_id),
    INDEX idx_aula (aula_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE OR REPLACE VIEW administradores_ativos AS
SELECT id, nome, email, data_criacao, ultimo_login
FROM administradores
WHERE ativo = TRUE;

CREATE OR REPLACE VIEW eventos_proximos AS
SELECT *
FROM eventos_calendario
WHERE data_evento >= CURDATE() AND ativo = TRUE
ORDER BY data_evento ASC;

CREATE OR REPLACE VIEW avisos_ativos AS
SELECT id, titulo, descricao, itens_lista, imagem, data_criacao
FROM avisos
WHERE ativo = TRUE
ORDER BY data_criacao DESC;

SELECT 'Banco de dados criado com sucesso!' AS mensagem;