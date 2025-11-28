const ADMIN_KEY = "MonteClaroAdmin2025";

// Mostrar/esconder forms
function showRegisterForm() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');
}

function showLoginForm() {
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
}

// Alerta
function showAlert(msg, tipo) {
    const alerta = document.createElement('div');
    alerta.className = `custom-alert alert-${tipo} show`;
    alerta.innerHTML = `
        <i class="fas fa-${tipo === 'success' ? 'check' : 'exclamation'}-circle"></i>
        <span>${msg}</span>
    `;
    document.body.appendChild(alerta);
    
    setTimeout(() => {
        alerta.remove();
    }, 3000);
}

// LOGIN
async function handleLogin(event) {
    event.preventDefault();
    
    const email = event.target.email.value;
    const password = event.target.password.value;
    
    const btn = event.target.querySelector('button');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
    
    try {
        const res = await fetch('api/login.php', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        const data = await res.json();
        
        if (data.success) {
            showAlert(data.message, 'success');
            localStorage.setItem('currentAdmin', JSON.stringify(data.data));
            setTimeout(() => location.href = 'admin-panel.html', 1000);
        } else {
            showAlert(data.message, 'error');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar';
        }
    } catch (e) {
        showAlert('Erro ao conectar', 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar';
    }
}

// CADASTRO
async function handleRegister(event) {
    event.preventDefault();
    
    const adminKey = event.target.adminKey.value;
    const name = event.target.name.value;
    const email = event.target.email.value;
    const password = event.target.password.value;
    const passwordConfirm = event.target.passwordConfirm.value;
    
    if (adminKey !== ADMIN_KEY) {
        showAlert('Chave administrativa inválida!', 'error');
        return;
    }
    
    if (password !== passwordConfirm) {
        showAlert('As senhas não coincidem!', 'error');
        return;
    }
    
    if (password.length < 8) {
        showAlert('Senha deve ter 8+ caracteres!', 'error');
        return;
    }
    
    const btn = event.target.querySelector('button');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cadastrando...';
    
    try {
        const res = await fetch('api/register.php', {
            method: 'POST',
            body: JSON.stringify({ adminKey, name, email, password })
        });
        
        const data = await res.json();
        
        if (data.success) {
            showAlert(data.message, 'success');
            event.target.reset();
            setTimeout(showLoginForm, 1500);
        } else {
            showAlert(data.message, 'error');
        }
    } catch (e) {
        showAlert('Erro ao conectar', 'error');
    }
    
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-user-check"></i> Cadastrar';
}

// LOGOUT
async function logout() {
    await fetch('api/logout.php', { method: 'POST' });
    localStorage.removeItem('currentAdmin');
    location.href = 'login.html';
}

// Verifica se está logado
if (window.location.pathname.includes('login.html')) {
    const admin = localStorage.getItem('currentAdmin');
    if (admin) {
        fetch('api/check-session.php')
            .then(r => r.json())
            .then(d => {
                if (d.data?.isLoggedIn) location.href = 'admin-panel.html';
                else localStorage.removeItem('currentAdmin');
            });
    }
}