const API_BASE = 'api';

// Verifica se está logado
function checkAuth() {
    const admin = localStorage.getItem('currentAdmin');
    if (!admin) {
        window.location.href = 'login.html';
        return;
    }
    const adminData = JSON.parse(admin);
    document.getElementById('admin-name').textContent = adminData.name;
}

// Mostrar seção
function showSection(section) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`section-${section}`).classList.add('active');
    
    if (section === 'turmas') loadTurmas();
    if (section === 'alunos') loadAlunos();
    if (section === 'chamada') loadChamadaInicio();
}

// Modal
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    const form = document.querySelector(`#${modalId} form`);
    if (form) form.reset();
}

// ==========================================
// TURMAS
// ==========================================
async function loadTurmas() {
    try {
        const response = await fetch(`${API_BASE}/turmas.php`);
        const result = await response.json();
        
        if (result.success) {
            const tbody = document.querySelector('#table-turmas tbody');
            tbody.innerHTML = '';
            
            result.data.forEach(turma => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${turma.nome}</td>
                    <td>${turma.tipo.toUpperCase()}</td>
                    <td>${turma.dia_semana} - ${turma.horario}</td>
                    <td>${turma.professor_nome || '-'}</td>
                    <td>${turma.total_alunos || 0}</td>
                    <td>
                        <button class="btn-action btn-view" onclick="viewTurma(${turma.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action btn-delete" onclick="deleteTurma(${turma.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            
            document.getElementById('total-turmas').textContent = result.data.length;
        }
    } catch (error) {
        console.error('Erro ao carregar turmas:', error);
        alert('Erro ao carregar turmas');
    }
}

function openModalTurma() {
    openModal('modal-turma');
}

async function saveTurma(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    data.ano = new Date().getFullYear();
    
    try {
        const response = await fetch(`${API_BASE}/turmas.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Turma criada com sucesso!');
            closeModal('modal-turma');
            loadTurmas();
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('Erro ao salvar turma:', error);
        alert('Erro ao salvar turma');
    }
}

async function deleteTurma(id) {
    if (!confirm('Deseja realmente desativar esta turma?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/turmas.php?id=${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Turma desativada!');
            loadTurmas();
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('Erro ao deletar turma:', error);
        alert('Erro ao deletar turma');
    }
}

// ==========================================
// ALUNOS
// ==========================================
async function loadAlunos() {
    try {
        const response = await fetch(`${API_BASE}/alunos.php`);
        const result = await response.json();
        
        if (result.success) {
            const tbody = document.querySelector('#table-alunos tbody');
            tbody.innerHTML = '';
            
            result.data.forEach(aluno => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${aluno.nome_completo}</td>
                    <td>${aluno.turma_nome}</td>
                    <td>${aluno.telefone || aluno.telefone_mae || '-'}</td>
                    <td>${aluno.total_faltas || 0}</td>
                    <td>
                        <button class="btn-action btn-view" onclick="viewAluno(${aluno.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action btn-delete" onclick="deleteAluno(${aluno.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            
            document.getElementById('total-alunos').textContent = result.data.length;
        }
    } catch (error) {
        console.error('Erro ao carregar alunos:', error);
        alert('Erro ao carregar alunos');
    }
}

function openModalAluno() {
    loadTurmasSelect();
    openModal('modal-aluno');
}

async function loadTurmasSelect() {
    try {
        const response = await fetch(`${API_BASE}/turmas.php`);
        const result = await response.json();
        
        if (result.success) {
            const select = document.querySelector('select[name="turma_id"]');
            if (select) {
                select.innerHTML = '<option value="">Selecione...</option>';
                result.data.forEach(turma => {
                    const option = document.createElement('option');
                    option.value = turma.id;
                    option.textContent = turma.nome;
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Erro ao carregar turmas:', error);
    }
}

async function saveAluno(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    try {
        const response = await fetch(`${API_BASE}/alunos.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Aluno cadastrado com sucesso!');
            closeModal('modal-aluno');
            loadAlunos();
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('Erro ao salvar aluno:', error);
        alert('Erro ao salvar aluno');
    }
}

async function deleteAluno(id) {
    if (!confirm('Deseja realmente remover este aluno?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/alunos.php?id=${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Aluno removido!');
            loadAlunos();
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('Erro ao deletar aluno:', error);
        alert('Erro ao deletar aluno');
    }
}

// ==========================================
// CHAMADA
// ==========================================
async function loadChamadaInicio() {
    const container = document.getElementById('chamada-content');
    
    try {
        const response = await fetch(`${API_BASE}/turmas.php`);
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
            container.innerHTML = `
                <div class="form-group-modal">
                    <label>Selecione a Turma:</label>
                    <select id="select-turma-chamada" onchange="loadChamada()">
                        <option value="">Escolha uma turma...</option>
                        ${result.data.map(t => `<option value="${t.id}">${t.nome}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group-modal">
                    <label>Data da Aula:</label>
                    <input type="date" id="data-aula-chamada" value="${new Date().toISOString().split('T')[0]}" onchange="loadChamada()">
                </div>
                <div id="lista-chamada"></div>
            `;
        } else {
            container.innerHTML = '<p>Nenhuma turma cadastrada. Cadastre uma turma primeiro.</p>';
        }
    } catch (error) {
        console.error('Erro ao carregar chamada:', error);
        container.innerHTML = '<p>Erro ao carregar. Tente novamente.</p>';
    }
}

async function loadChamada() {
    const turmaId = document.getElementById('select-turma-chamada').value;
    const data = document.getElementById('data-aula-chamada').value;
    const container = document.getElementById('lista-chamada');
    
    if (!turmaId || !data) {
        container.innerHTML = '';
        return;
    }
    
    try {
        // Buscar ou criar aula
        const responseAula = await fetch(`${API_BASE}/chamada.php?turma_id=${turmaId}&data=${data}`);
        const resultAula = await responseAula.json();
        
        if (!resultAula.success) {
            container.innerHTML = '<p>Erro ao carregar aula.</p>';
            return;
        }
        
        const aulaId = resultAula.data.id;
        
        // Buscar alunos e presenças
        const responseChamada = await fetch(`${API_BASE}/chamada.php?aula_id=${aulaId}`);
        const resultChamada = await responseChamada.json();
        
        if (resultChamada.success) {
            const { aula, alunos } = resultChamada.data;
            
            let html = `
                <h3>${aula.turma_nome} - ${new Date(data).toLocaleDateString('pt-BR')}</h3>
                <form onsubmit="salvarChamada(event, ${aulaId})">
                    <table>
                        <thead>
                            <tr>
                                <th>Aluno</th>
                                <th>Presente</th>
                                <th>Faltou</th>
                                <th>Observação</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            alunos.forEach(aluno => {
                html += `
                    <tr>
                        <td>${aluno.nome_completo}</td>
                        <td>
                            <input type="radio" name="presenca_${aluno.aluno_id}" value="1" 
                                ${aluno.presente === '1' ? 'checked' : ''}>
                        </td>
                        <td>
                            <input type="radio" name="presenca_${aluno.aluno_id}" value="0" 
                                ${aluno.presente === '0' ? 'checked' : ''}>
                        </td>
                        <td>
                            <input type="text" name="obs_${aluno.aluno_id}" 
                                value="${aluno.observacao || ''}" placeholder="Obs...">
                        </td>
                    </tr>
                `;
            });
            
            html += `
                        </tbody>
                    </table>
                    <button type="submit" class="btn-primary-custom" style="margin-top: 20px;">
                        <i class="fas fa-save"></i> Salvar Chamada
                    </button>
                </form>
            `;
            
            container.innerHTML = html;
        }
    } catch (error) {
        console.error('Erro ao carregar chamada:', error);
        container.innerHTML = '<p>Erro ao carregar.</p>';
    }
}

async function salvarChamada(event, aulaId) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const presencas = [];
    
    // Processar dados do formulário
    const alunos = [...new Set([...formData.keys()].map(k => k.split('_')[1]))];
    
    alunos.forEach(alunoId => {
        const presente = formData.get(`presenca_${alunoId}`);
        const observacao = formData.get(`obs_${alunoId}`);
        
        if (presente !== null) {
            presencas.push({
                aluno_id: parseInt(alunoId),
                presente: presente === '1',
                observacao: observacao || null
            });
        }
    });
    
    try {
        const response = await fetch(`${API_BASE}/chamada.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                aula_id: aulaId,
                presencas: presencas
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Chamada salva com sucesso!');
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('Erro ao salvar chamada:', error);
        alert('Erro ao salvar chamada');
    }
}

// ==========================================
// INICIALIZAÇÃO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadTurmas();
    loadAlunos();
});