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
    'Janeiro','Fevereiro','Março','Abril',
    'Maio','Junho','Julho','Agosto',
    'Setembro','Outubro','Novembro','Dezembro'
];

const EVENTOS_SEMANAIS = [
    { diaSemana: 0, titulo: 'Missa 19h',  tipo: 'missa' },
    { diaSemana: 3, titulo: 'Catequese',  tipo: 'catequese' },
    { diaSemana: 4, titulo: 'Crisma',     tipo: 'crisma' },
    { diaSemana: 6, titulo: 'Missa 07h',  tipo: 'missa' },
];

const TIPO_CORES = {
    missa:     '#b38e5d',
    catequese: '#4a90d9',
    crisma:    '#7b5ea7',
    evento:    '#28a745',
    outro:     '#6c757d',
};

let _calMes = new Date().getMonth();
let _calAno = new Date().getFullYear();
let _calEventosDB = [];

function escHtml(s) {
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

async function _carregarEventosMes() {
    try {
        const r = await fetch(`api/eventos.php?mes=${_calMes + 1}&ano=${_calAno}`);
        const res = await r.json();
        _calEventosDB = res.success ? res.data : [];
    } catch {
        _calEventosDB = [];
    }
}

function _getEventosDia(ano, mes, dia) {
    const dateStr = `${ano}-${String(mes + 1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
    const diaSemana = new Date(ano, mes, dia).getDay();

    const semanais = EVENTOS_SEMANAIS
        .filter(e => e.diaSemana === diaSemana)
        .map(e => ({ titulo: e.titulo, tipo: e.tipo }));

    const db = _calEventosDB
        .filter(e => e.data_evento === dateStr)
        .map(e => ({ titulo: e.titulo, tipo: e.tipo, desc: e.descricao, hora: e.hora_inicio }));

    return [...semanais, ...db];
}

function renderCalendario() {
    const hoje = new Date();

    const header = document.getElementById('mes-ano');
    if (header) header.textContent = `${MESES[_calMes]} ${_calAno}`;

    const primeiroDia = new Date(_calAno, _calMes, 1).getDay();
    const ultimoDia  = new Date(_calAno, _calMes + 1, 0).getDate();

    const tbody = document.getElementById('dias-calendario');
    if (!tbody) return;

    tbody.innerHTML = '';
    let linha = document.createElement('tr');

    for (let i = 0; i < primeiroDia; i++) {
        linha.appendChild(document.createElement('td'));
    }

    for (let dia = 1; dia <= ultimoDia; dia++) {
        if (linha.children.length === 7) {
            tbody.appendChild(linha);
            linha = document.createElement('tr');
        }

        const celula    = document.createElement('td');
        const diaSemana = new Date(_calAno, _calMes, dia).getDay();
        const eventos   = _getEventosDia(_calAno, _calMes, dia);
        const isHoje    = dia === hoje.getDate() && _calMes === hoje.getMonth() && _calAno === hoje.getFullYear();

        if (isHoje) celula.classList.add('dia-atual');
        if (diaSemana === 0 || diaSemana === 6) celula.classList.add('fim-de-semana');
        if (eventos.length > 0) celula.classList.add('tem-evento');

        const span = document.createElement('span');
        span.className = 'dia-numero';
        span.textContent = dia;
        celula.appendChild(span);

        if (eventos.length > 0) {
            const dots = document.createElement('div');
            dots.className = 'evento-dots';
            eventos.slice(0, 3).forEach(ev => {
                const dot = document.createElement('span');
                dot.className = 'evento-dot';
                dot.style.background = TIPO_CORES[ev.tipo] || TIPO_CORES.outro;
                dots.appendChild(dot);
            });
            celula.appendChild(dots);

            const tooltip = document.createElement('div');
            tooltip.className = 'evento-tooltip';
            tooltip.innerHTML = eventos.map(ev => `<span>${escHtml(ev.titulo)}</span>`).join('');
            celula.appendChild(tooltip);
        }

        linha.appendChild(celula);
    }

    if (linha.children.length > 0) tbody.appendChild(linha);

    _renderAgenda(ultimoDia, hoje);
}

function _renderAgenda(ultimoDia, hoje) {
    const container = document.getElementById('agenda-eventos');
    if (!container) return;

    const isCurrentMonth = _calMes === hoje.getMonth() && _calAno === hoje.getFullYear();
    const diaInicio = isCurrentMonth ? hoje.getDate() : 1;

    const todos = [];
    for (let dia = diaInicio; dia <= ultimoDia; dia++) {
        _getEventosDia(_calAno, _calMes, dia).forEach(ev => todos.push({ dia, ...ev }));
    }

    const slice = todos.slice(0, 8);

    if (slice.length === 0) {
        container.innerHTML = '<p class="sem-eventos">Nenhum evento neste mês.</p>';
        return;
    }

    container.innerHTML = slice.map(ev => `
        <div class="agenda-item">
            <div class="agenda-dot" style="background:${TIPO_CORES[ev.tipo] || TIPO_CORES.outro}"></div>
            <div class="agenda-info">
                <span class="agenda-data">${String(ev.dia).padStart(2,'0')}/${String(_calMes+1).padStart(2,'0')}${ev.hora ? ' · ' + ev.hora.slice(0,5) : ''}</span>
                <span class="agenda-nome">${escHtml(ev.titulo)}</span>
                ${ev.desc ? `<span class="agenda-desc">${escHtml(ev.desc)}</span>` : ''}
            </div>
        </div>
    `).join('');
}

function mesAnterior() {
    if (_calMes === 0) { _calMes = 11; _calAno--; } else _calMes--;
    _carregarEventosMes().then(renderCalendario);
}

function mesSeguinte() {
    if (_calMes === 11) { _calMes = 0; _calAno++; } else _calMes++;
    _carregarEventosMes().then(renderCalendario);
}

async function initCalendario() {
    await _carregarEventosMes();
    renderCalendario();
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
    initCalendario();
    initMenuMobile();
    carregarAvisos();
});