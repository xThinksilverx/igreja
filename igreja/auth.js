
const ADMIN_KEY = "MonteClaroAdmin2025";

function showRegisterForm() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');
}

function showLoginForm() {
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
}

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

function handleLogin(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const email = formData.get('email');
    const password = formData.get('password');
    
    const users = JSON.parse(localStorage.getItem('adminUsers') || '[]');
    
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        localStorage.setItem('currentAdmin', JSON.stringify({
            name: user.name,
            email: user.email,
            loginTime: new Date().toISOString()
        }));
        
        showAlert('Login realizado com sucesso!', 'success');
        
        setTimeout(() => {
            window.location.href = 'admin-panel.html';
        }, 1500);
    } else {
        showAlert('E-mail ou senha incorretos!', 'error');
    }
}

function handleRegister(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const adminKey = formData.get('adminKey');
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');
    const passwordConfirm = formData.get('passwordConfirm');
    
    if (adminKey !== ADMIN_KEY) {
        showAlert('Chave administrativa inválida!', 'error');
        return;
    }
    
    if (!validatePasswords(password, passwordConfirm)) {
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('adminUsers') || '[]');
    
    if (users.some(u => u.email === email)) {
        showAlert('Este e-mail já está cadastrado!', 'error');
        return;
    }

    users.push({
        name,
        email,
        password,
        createdAt: new Date().toISOString()
    });
    
    localStorage.setItem('adminUsers', JSON.stringify(users));
    
    showAlert('Cadastro realizado com sucesso!', 'success');
    
    event.target.reset();
    setTimeout(() => {
        showLoginForm();
    }, 1500);
}

function checkIfLoggedIn() {
    const currentAdmin = localStorage.getItem('currentAdmin');
    
    if (currentAdmin && window.location.pathname.includes('login.html')) {
        window.location.href = 'admin-panel.html';
    }
}

function logout() {
    localStorage.removeItem('currentAdmin');
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    checkIfLoggedIn();
    
    const users = JSON.parse(localStorage.getItem('adminUsers') || '[]');
    if (users.length === 0) {
        const defaultAdmin = {
            name: 'Administrador',
            email: 'admin@monteclaro.com',
            password: 'admin123',
            createdAt: new Date().toISOString()
        };
        localStorage.setItem('adminUsers', JSON.stringify([defaultAdmin]));
        console.log('Usuário padrão criado: admin@monteclaro.com / admin123');
    }
});