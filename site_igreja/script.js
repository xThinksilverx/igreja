// ==========================================
// OBSERVADOR DE SEÇÕES (Animação de scroll)
// ==========================================
function initScrollAnimations() {
    const sections = document.querySelectorAll('.about-section, .avisos-container, .cursos-section');
    
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        },
        { threshold: 0.5 }
    );

    sections.forEach((section) => observer.observe(section));
}

// ==========================================
// CALENDÁRIO
// ==========================================
const MESES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 
    'Maio', 'Junho', 'Julho', 'Agosto', 
    'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const EVENTOS_SEMANAIS = {
    0: 'Missa das 19h às 20h', // Domingo
    3: 'Catequese',             // Quarta
    4: 'Crisma',                // Quinta
    6: 'Missa das 07h às 08h'   // Sábado
};

function renderCalendario() {
    const hoje = new Date();
    const mes = hoje.getMonth();
    const ano = hoje.getFullYear();
    const diaHoje = hoje.getDate();

    // Atualiza o cabeçalho
    const headerElement = document.getElementById('mes-ano');
    if (headerElement) {
        headerElement.textContent = `${MESES[mes]} ${ano}`;
    }

    // Calcula primeiro e último dia do mês
    const primeiroDia = new Date(ano, mes, 1).getDay();
    const ultimoDia = new Date(ano, mes + 1, 0).getDate();

    // Renderiza o calendário
    const tbody = document.getElementById('dias-calendario');
    if (!tbody) return;

    tbody.innerHTML = '';
    let linha = document.createElement('tr');
    
    // Células vazias antes do primeiro dia
    for (let i = 0; i < primeiroDia; i++) {
        linha.appendChild(document.createElement('td'));
    }

    // Dias do mês
    for (let dia = 1; dia <= ultimoDia; dia++) {
        if (linha.children.length === 7) {
            tbody.appendChild(linha);
            linha = document.createElement('tr');
        }

        const celula = document.createElement('td');
        celula.textContent = dia;

        // Marca o dia atual
        if (dia === diaHoje && mes === hoje.getMonth() && ano === hoje.getFullYear()) {
            celula.classList.add('dia-atual');
        }

        // Adiciona eventos semanais
        const diaSemana = new Date(ano, mes, dia).getDay();
        
        if (diaSemana === 0 || diaSemana === 6) {
            celula.classList.add('fim-de-semana');
        }

        if (EVENTOS_SEMANAIS[diaSemana]) {
            const evento = document.createElement('div');
            evento.className = 'evento';
            evento.textContent = EVENTOS_SEMANAIS[diaSemana];
            celula.appendChild(document.createElement('br'));
            celula.appendChild(evento);
        }

        linha.appendChild(celula);
    }

    // Adiciona última linha se tiver conteúdo
    if (linha.children.length > 0) {
        tbody.appendChild(linha);
    }
}

// ==========================================
// MENU MOBILE - Fecha ao clicar em links
// ==========================================
function initMenuMobile() {
    const menuCheckbox = document.getElementById('menu-icon');
    const navLinks = document.querySelectorAll('.nav ul li a');

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (menuCheckbox) {
                menuCheckbox.checked = false;
            }
        });
    });
}

// ==========================================
// INICIALIZAÇÃO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
    renderCalendario();
    initMenuMobile();
});