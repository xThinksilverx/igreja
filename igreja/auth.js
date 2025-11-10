// ==========================================
// CONFIGURAÇÃO E CONSTANTES
// ==========================================
const ADMIN_KEY = "MonteClaroAdmin2025";

// Configuração do caminho da API
// Como os arquivos estão em htdocs/ diretamente, use:
const API_BASE_URL = "api";

// ==========================================
// FUNÇÕES DE UI
// ==========================================
function showRegisterForm() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');
}

function showLoginForm() {
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
}

function showAlert(message, type = 'info') {
    const existingAlert = document.querySelector('.custom-alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    const alert = document.createElement('div');
    alert.className = `custom-alert alert-${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-exclamation-circle' : 
                 'fa-info-circle';
    
    alert.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(alert);
    
    setTimeout(() => alert.classList.add('show'), 10);
    
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => alert.remove(), 300);
    }, 4000);
}

// ==========================================
// VALIDAÇÃO
// ==========================================
function validatePasswords(password, passwordConfirm) {
    if (password !== passwordConfirm) {
        showAlert('As senhas não coincidem!', 'error');
        return false;
    }
    
    if (password.length < 8) {
        showAlert('A senha deve ter no mínimo 8 caracteres!', 'error');
        return false;
    }
    
    return true;
}

// ==========================================
// FUNÇÃO DE LOGIN (COM INTEGRAÇÃO API)
// ==========================================
async function handleLogin(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const email = formData.get('email');
    const password = formData.get('password');
    
    // Validação básica
    if (!email || !password) {
        showAlert('Preencha todos os campos!', 'error');
        return;
    }
    
    // Desabilita o botão durante o processo
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
    
    try {
        console.log('Tentando login em:', `${API_BASE_URL}/login.php`);
        
        const response = await fetch(`${API_BASE_URL}/login.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });
        
        console.log('Status da resposta:', response.status);
        
        // Verifica se a resposta é OK
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        // Tenta ler como texto primeiro para debug
        const textResponse = await response.text();
        console.log('Resposta raw:', textResponse);
        
        // Tenta parsear como JSON
        let result;
        try {
            result = JSON.parse(textResponse);
        } catch (e) {
            console.error('Erro ao parsear JSON:', e);
            console.error('Resposta recebida:', textResponse);
            throw new Error('Resposta inválida do servidor');
        }
        
        if (result.success) {
            showAlert(result.message, 'success');
            
            // Armazena informações do usuário logado (opcional, para exibição)
            localStorage.setItem('currentAdmin', JSON.stringify({
                name: result.data.nome,
                email: result.data.email,
                loginTime: new Date().toISOString()
            }));
            
            setTimeout(() => {
                window.location.href = 'admin-panel.html';
            }, 1500);
        } else {
            showAlert(result.message, 'error');
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
        }
        
    } catch (error) {
        console.error('Erro completo:', error);
        showAlert('Erro ao conectar com o servidor. Verifique o console (F12).', 'error');
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
    }
}

// ==========================================
// FUNÇÃO DE CADASTRO (COM INTEGRAÇÃO API)
// ==========================================
async function handleRegister(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const adminKey = formData.get('adminKey');
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');
    const passwordConfirm = formData.get('passwordConfirm');
    
    // Validações locais
    if (!adminKey || !name || !email || !password || !passwordConfirm) {
        showAlert('Todos os campos são obrigatórios!', 'error');
        return;
    }
    
    if (adminKey !== ADMIN_KEY) {
        showAlert('Chave administrativa inválida!', 'error');
        return;
    }
    
    if (!validatePasswords(password, passwordConfirm)) {
        return;
    }
    
    // Desabilita o botão durante o processo
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cadastrando...';
    
    try {
        console.log('Tentando cadastro em:', `${API_BASE_URL}/register.php`);
        
        const response = await fetch(`${API_BASE_URL}/register.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                adminKey: adminKey,
                name: name,
                email: email,
                password: password,
                passwordConfirm: passwordConfirm
            })
        });
        
        console.log('Status da resposta:', response.status);
        
        // Verifica se a resposta é OK
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        // Tenta ler como texto primeiro para debug
        const textResponse = await response.text();
        console.log('Resposta raw:', textResponse);
        
        // Tenta parsear como JSON
        let result;
        try {
            result = JSON.parse(textResponse);
        } catch (e) {
            console.error('Erro ao parsear JSON:', e);
            console.error('Resposta recebida:', textResponse);
            throw new Error('Resposta inválida do servidor. Verifique se o banco de dados está configurado.');
        }
        
        if (result.success) {
            showAlert(result.message, 'success');
            event.target.reset();
            
            setTimeout(() => {
                showLoginForm();
            }, 1500);
        } else {
            showAlert(result.message, 'error');
        }
        
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
        
    } catch (error) {
        console.error('Erro completo:', error);
        showAlert('Erro ao conectar com o servidor. Verifique o console (F12).', 'error');
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
    }
}

// ==========================================
// VERIFICAÇÃO DE LOGIN
// ==========================================
async function checkIfLoggedIn() {
    // Verifica se há dados locais (apenas para exibição)
    const currentAdmin = localStorage.getItem('currentAdmin');
    
    // Se estiver na página de login e tiver sessão ativa, redireciona
    if (currentAdmin && window.location.pathname.includes('login.html')) {
        // Verifica com o servidor se a sessão ainda é válida
        try {
            const response = await fetch(`${API_BASE_URL}/check-session.php`);
            const textResponse = await response.text();
            const result = JSON.parse(textResponse);
            
            if (result.success && result.data && result.data.isLoggedIn) {
                window.location.href = 'admin-panel.html';
            } else {
                // Sessão expirada, limpa localStorage
                localStorage.removeItem('currentAdmin');
            }
        } catch (error) {
            console.error('Erro ao verificar sessão:', error);
            localStorage.removeItem('currentAdmin');
        }
    }
}

// ==========================================
// FUNÇÃO DE LOGOUT
// ==========================================
async function logout() {
    try {
        await fetch(`${API_BASE_URL}/logout.php`, {
            method: 'POST'
        });
        
        localStorage.removeItem('currentAdmin');
        window.location.href = 'login.html';
        
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        // Remove dados locais mesmo se houver erro
        localStorage.removeItem('currentAdmin');
        window.location.href = 'login.html';
    }
}

// ==========================================
// INICIALIZAÇÃO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('API Base URL:', API_BASE_URL);
    console.log('Caminho atual:', window.location.pathname);
    checkIfLoggedIn();
});