# 🏛️ Sistema de Gerenciamento - Paróquia Monte Claro

Sistema web completo para gerenciamento de paróquia com área administrativa protegida.

---

## 🚀 Funcionalidades

### 🌐 **Site Público**
- ✅ Página inicial com informações da paróquia
- ✅ Seção "Sobre" com história e missão
- ✅ Avisos e comunicados
- ✅ Informações sobre cursos (Crisma, Catequese, Padrinhos)
- ✅ Sistema de doações
- ✅ Calendário mensal com eventos
- ✅ Página do grupo de jovens (Juama)
- ✅ Design responsivo para mobile

### 🔐 **Área Administrativa**
- ✅ Login seguro com hash de senha
- ✅ Cadastro de novos administradores (com chave)
- ✅ Sistema de sessões PHP
- ✅ Logs de atividades (auditoria)
- ✅ Proteção contra SQL Injection
- ✅ Validações de segurança

### 💾 **Banco de Dados**
- ✅ Tabela de administradores
- ✅ Tabela de avisos
- ✅ Tabela de eventos do calendário
- ✅ Tabela de cursos
- ✅ Tabela de logs (auditoria)
- ✅ Views otimizadas

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- HTML5
- CSS3 (com variáveis CSS)
- JavaScript (ES6+)
- Font Awesome 6.4.0
- Fetch API

### Backend
- PHP 7.4+
- MySQL 8.0+
- PDO (prepared statements)
- Sessions

### Servidor
- Apache (XAMPP)
- mod_rewrite
- .htaccess

---

## 📁 Estrutura do Projeto

```
igreja/
│
├── 📄 index.html              # Página principal
├── 📄 juama.html              # Página grupo de jovens
├── 📄 login.html              # Página de login/cadastro
├── 📄 style.css               # Estilos globais
├── 📄 script.js               # Scripts gerais
├── 📄 auth.js                 # Scripts de autenticação
├── 📄 .htaccess               # Configurações Apache
├── 📄 setup_database.sql      # Script de criação do BD
├── 📄 INSTALACAO.md           # Guia de instalação
├── 📄 README.md               # Este arquivo
│
├── 📁 config/
│   └── 📄 db.php              # Configuração do banco
│
├── 📁 api/
│   ├── 📄 login.php           # API de login
│   ├── 📄 register.php        # API de cadastro
│   └── 📄 logout.php          # API de logout
│
└── 📁 img/
    ├── fundo2.png
    ├── 📁 avisos/
    │   └── festa_junina.jpeg
    └── 📁 projetos/
        ├── crisma.webp
        ├── batismo.jpeg
        └── catequese.jpg
```

---

## 🔑 Credenciais Padrão

### Administrador:
- **E-mail:** admin@monteclaro.com
- **Senha:** admin123

### Chave Administrativa:
- **Chave:** MonteClaroAdmin2025

⚠️ **IMPORTANTE:** Altere essas credenciais após a instalação!

---

## 📊 Banco de Dados

### Tabelas Principais:

#### `administradores`
- Gerenciamento de usuários admin
- Senhas com hash (password_hash)
- Controle de status ativo/inativo

#### `avisos`
- Gerenciamento de avisos da paróquia
- Suporte para imagens
- Criado por admin específico

#### `eventos_calendario`
- Eventos do calendário
- Data, hora e tipo de evento
- Vinculado ao admin criador

#### `cursos`
- Informações sobre cursos
- Dia da semana e horário
- Telefone de contato

#### `logs_atividade`
- Auditoria completa
- Login, logout, cadastros
- IP address e timestamp

---

## 🔒 Segurança Implementada

✅ **Senhas:**
- Hash com `password_hash()` (bcrypt)
- Nunca armazenadas em texto puro

✅ **SQL Injection:**
- PDO com prepared statements
- Parametrização de todas as queries

✅ **XSS Protection:**
- Headers de segurança
- Validação de inputs

✅ **Session Security:**
- Sessions PHP server-side
- Verificação de login em cada request

✅ **CORS:**
- Configurado para API
- Headers apropriados

✅ **File Protection:**
- .htaccess protegendo arquivos sensíveis
- Diretórios sem listagem

---

## 📡 API Endpoints

### POST `/api/login.php`
```json
{
  "email": "admin@monteclaro.com",
  "password": "admin123"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Login realizado com sucesso!",
  "data": {
    "nome": "Administrador Principal",
    "email": "admin@monteclaro.com"
  }
}
```

### POST `/api/register.php`
```json
{
  "adminKey": "MonteClaroAdmin2025",
  "name": "João Silva",
  "email": "joao@exemplo.com",
  "password": "senha123",
  "passwordConfirm": "senha123"
}
```

### POST `/api/logout.php`
Sem body necessário. Destrói a sessão.

---

## 🎨 Personalização

### Cores (variáveis CSS):
```css
:root {
  --color-primary: #b38e5d;      /* Dourado */
  --color-secondary: #ffeba7;    /* Amarelo claro */
  --color-dark: #1f2029;         /* Preto */
  --color-light: #ececee;        /* Cinza claro */
  --color-white: #ffffff;        /* Branco */
}
```

### Alterar chave administrativa:
1. Editar `auth.js` linha 2
2. Editar `api/register.php` linha 8

### Modificar usuário padrão:
Editar `setup_database.sql` linhas 44-49

---

## 🔄 Próximas Funcionalidades

- [ ] Painel administrativo completo
- [ ] CRUD de avisos
- [ ] CRUD de eventos
- [ ] CRUD de cursos
- [ ] Upload de imagens
- [ ] Sistema de permissões
- [ ] Relatórios e estatísticas
- [ ] Envio de e-mails
- [ ] Notificações push
- [ ] Integração com redes sociais

---

## 🐛 Debug

### Ativar logs de erro:
Edite `config/db.php` e adicione:
```php
error_reporting(E_ALL);
ini_set('display_errors', 1);
```

### Verificar conexão com banco:
```php
<?php
require_once 'config/db.php';
$conn = getConnection();
echo "Conexão OK!";
?>
```

### Console do navegador:
Pressione `F12` para ver erros JavaScript

---

## 📞 Informações de Contato

**Paróquia Nossa Senhora do Monte Claro**
- 📍 R. Hilda Rech, 50 - Vila Nova, Joinville - SC
- 📱 (47) 3455-5072
- 📷 [@paroquiamonteclaro](https://www.instagram.com/paroquiamonteclaro/)

---

## 📄 Licença

© Todos os direitos reservados à Paróquia Monte Claro

---

## 👨‍💻 Desenvolvedor

Sistema desenvolvido para a Paróquia Nossa Senhora do Monte Claro

**Versão:** 1.0.0  
**Data:** Outubro 2025

---

**✨ Que Deus abençoe este projeto! ✨**