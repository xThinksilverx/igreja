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
    
    if (section === 'avisos') loadAvisos();
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
// AVISOS
// ==========================================
async function loadAvisos() {
    try {
        const response = await fetch(`${API_BASE}/avisos.php`);
        const result = await response.json();
        
        if (result.success) {
            const tbody = document.querySelector('#table-avisos tbody');
            tbody.innerHTML = '';
            
            result.data.forEach(aviso => {
                const tr = document.createElement('tr');
                const itensCount = aviso.itens_lista ? aviso.itens_lista.length : 0;
                const dataFormatada = new Date(aviso.data_criacao).toLocaleDateString('pt-BR');
                
                tr.innerHTML = `
                    <td>${aviso.titulo}</td>
                    <td>${itensCount} item(ns)</td>
                    <td>${aviso.imagem ? '✓' : '-'}</td>
                    <td>${dataFormatada}</td>
                    <td>
                        <button class="btn-action btn-edit" onclick="editAviso(${aviso.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action btn-delete" onclick="deleteAviso(${aviso.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            
            document.getElementById('total-avisos').textContent = result.data.length;
        }
    } catch (error) {
        console.error('Erro ao carregar avisos:', error);
        alert('Erro ao carregar avisos');
    }
}

function openModalAviso(avisoId = null) {
    document.getElementById('modal-aviso-title').textContent = avisoId ? 'Editar Aviso' : 'Novo Aviso';
    document.getElementById('form-aviso').reset();
    document.getElementById('aviso-id').value = '';
    
    // Reseta itens da lista
    const container = document.getElementById('itens-lista-container');
    container.innerHTML = `
        <div class="item-lista-row">
            <input type="text" class="item-lista-input" placeholder="Digite um item...">
            <button type="button" class="btn-remove-item" onclick="removeItemLista(this)">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    openModal('modal-aviso');
}

async function editAviso(id) {
    try {
        const response = await fetch(`${API_BASE}/avisos.php?id=${id}`);
        const result = await response.json();
        
        if (result.success && result.data) {
            const aviso = result.data;
            
            document.getElementById('aviso-id').value = aviso.id;
            document.getElementById('aviso-titulo').value = aviso.titulo;
            document.getElementById('aviso-descricao').value = aviso.descricao || '';
            document.getElementById('aviso-imagem').value = aviso.imagem || '';
            
            // Preenche itens da lista
            const container = document.getElementById('itens-lista-container');
            container.innerHTML = '';
            
            if (aviso.itens_lista && aviso.itens_lista.length > 0) {
                aviso.itens_lista.forEach(item => {
                    const row = document.createElement('div');
                    row.className = 'item-lista-row';
                    row.innerHTML = `
                        <input type="text" class="item-lista-input" value="${item}" placeholder="Digite um item...">
                        <button type="button" class="btn-remove-item" onclick="removeItemLista(this)">
                            <i class="fas fa-trash"></i>
                        </button>
                    `;
                    container.appendChild(row);
                });
            } else {
                addItemLista();
            }
            
            openModal('modal-aviso');
        }
    } catch (error) {
        console.error('Erro ao carregar aviso:', error);
        alert('Erro ao carregar aviso');
    }
}

function addItemLista() {
    const container = document.getElementById('itens-lista-container');
    const row = document.createElement('div');
    row.className = 'item-lista-row';
    row.innerHTML = `
        <input type="text" class="item-lista-input" placeholder="Digite um item...">
        <button type="button" class="btn-remove-item" onclick="removeItemLista(this)">
            <i class="fas fa-trash"></i>
        </button>
    `;
    container.appendChild(row);
}

function removeItemLista(button) {
    const container = document.getElementById('itens-lista-container');
    if (container.children.length > 1) {
        button.parentElement.remove();
    } else {
        alert('Deve haver pelo menos um item!');
    }
}

async function saveAviso(event) {
    event.preventDefault();
    
    const id = document.getElementById('aviso-id').value;
    const titulo = document.getElementById('aviso-titulo').value;
    const descricao = document.getElementById('aviso-descricao').value;
    const imagem = document.getElementById('aviso-imagem').value;
    
    // Coleta itens da lista
    const itensInputs = document.querySelectorAll('.item-lista-input');
    const itens_lista = Array.from(itensInputs)
        .map(input => input.value.trim())
        .filter(item => item !== '');
    
    const data = {
        titulo,
        descricao,
        itens_lista,
        imagem: imagem || null
    };
    
    try {
        let response;
        
        if (id) {
            // Atualizar
            data.id = id;
            response = await fetch(`${API_BASE}/avisos.php`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } else {
            // Criar
            response = await fetch(`${API_BASE}/avisos.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        }
        
        const result = await response.json();
        
        if (result.success) {
            alert(result.message);
            closeModal('modal-aviso');
            loadAvisos();
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('Erro ao salvar aviso:', error);
        alert('Erro ao salvar aviso');
    }
}

async function deleteAviso(id) {
    if (!confirm('Deseja realmente remover este aviso?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/avisos.php?id=${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Aviso removido!');
            loadAvisos();
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('Erro ao deletar aviso:', error);
        alert('Erro ao deletar aviso');
    }
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
        
        if (presente !== null) {
            presencas.push({
                aluno_id: parseInt(alunoId),
                presente: presente === '1',
                observacao: null
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
    loadAvisos();
    loadTurmas();
    loadAlunos();
});