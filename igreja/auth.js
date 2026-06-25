// Alerta
function showAlert(msg, tipo) {
    const alerta = document.createElement('div');
    alerta.className = `custom-alert alert-${tipo} show`;
    alerta.innerHTML = `
        <i class="fas fa-${tipo === 'success' ? 'check' : 'exclamation'}-circle"></i>
        <span>${msg}</span>
    `;
    document.body.appendChild(alerta);
    setTimeout(() => alerta.remove(), 3000);
}

// LOGIN
async function handleLogin(event) {
    event.preventDefault();

    const email    = event.target.email.value;
    const password = event.target.password.value;

    const btn = event.target.querySelector('button');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';

    try {
        const res  = await fetch('api/login.php', {
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

// LOGOUT
async function logout() {
    await fetch('api/logout.php', { method: 'POST' });
    localStorage.removeItem('currentAdmin');
    location.href = 'login.html';
}

// Verifica se já está logado ao abrir login.html
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
