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
// CARREGAR AVISOS DINÂMICOS
// ==========================================
async function carregarAvisos() {
    try {
        const response = await fetch('api/avisos.php');
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
            // Pega o primeiro aviso ativo
            const aviso = result.data[0];
            
            // Atualiza título
            document.getElementById('avisos-titulo').textContent = aviso.titulo;
            
            // Atualiza lista de itens
            const lista = document.getElementById('avisos-lista');
            lista.innerHTML = '';
            
            if (aviso.itens_lista && aviso.itens_lista.length > 0) {
                aviso.itens_lista.forEach(item => {
                    const li = document.createElement('li');
                    li.textContent = item;
                    lista.appendChild(li);
                });
            } else if (aviso.descricao) {
                const li = document.createElement('li');
                li.textContent = aviso.descricao;
                lista.appendChild(li);
            }
            
            // Atualiza imagem
            if (aviso.imagem) {
                const img = document.getElementById('avisos-imagem');
                img.src = `img/${aviso.imagem}`;
                img.alt = aviso.titulo;
            }
        } else {
            // Avisos padrão caso não tenha nenhum cadastrado
            document.getElementById('avisos-titulo').textContent = 'Avisos Importantes';
            document.getElementById('avisos-lista').innerHTML = '<li>Nenhum aviso no momento</li>';
        }
    } catch (error) {
        console.error('Erro ao carregar avisos:', error);
        document.getElementById('avisos-titulo').textContent = 'Avisos Importantes';
        document.getElementById('avisos-lista').innerHTML = '<li>Erro ao carregar avisos</li>';
    }
}

// ==========================================
// INICIALIZAÇÃO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
    renderCalendario();
    initMenuMobile();
    carregarAvisos();
});