const API_BASE = 'api';

function esc(str) {
    return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

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
    
    if (section === 'avisos')  loadAvisos();
    if (section === 'turmas')  loadTurmas();
    if (section === 'alunos')  loadAlunos();
    if (section === 'eventos') loadEventos();
    if (section === 'admins')  loadAdmins();
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
                    <td>${esc(aviso.titulo)}</td>
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
                        <input type="text" class="item-lista-input" value="${esc(item)}" placeholder="Digite um item...">
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
                    <td>${esc(turma.nome)}</td>
                    <td>${esc(turma.tipo.toUpperCase())}</td>
                    <td>${esc(turma.dia_semana)} - ${esc(turma.horario)}</td>
                    <td>${esc(turma.professor_nome) || '-'}</td>
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

async function viewTurma(turmaId) {
    // Pega o nome da turma já carregado na tabela
    const btn = document.querySelector(`#table-turmas button[onclick="viewTurma(${turmaId})"]`);
    const turmaNome = btn?.closest('tr')?.querySelector('td:first-child')?.textContent || 'Turma';

    document.getElementById('modal-turma-alunos-titulo').textContent = `Alunos — ${turmaNome}`;
    document.getElementById('modal-turma-alunos-body').innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px"><i class="fas fa-spinner fa-spin"></i> Carregando...</td></tr>';
    openModal('modal-turma-alunos');

    try {
        const response = await fetch(`${API_BASE}/alunos.php?turma_id=${turmaId}`);
        const result = await response.json();
        const tbody = document.getElementById('modal-turma-alunos-body');

        if (result.success && result.data.length > 0) {
            tbody.innerHTML = result.data.map((a, i) => {
                const faltas = a.total_faltas || 0;
                const max = a.max_faltas || 5;
                const cor = faltas >= max ? 'color:#dc3545;font-weight:700' : faltas >= max - 1 ? 'color:#ffc107;font-weight:700' : '';
                return `
                    <tr style="background:${i % 2 === 0 ? '#fff' : '#f9f9f9'}">
                        <td style="padding:10px 12px">${esc(a.nome_completo)}</td>
                        <td style="padding:10px 12px">${esc(a.nome_mae) || '-'}</td>
                        <td style="padding:10px 12px">${esc(a.telefone_mae) || '-'}</td>
                        <td style="padding:10px 12px;text-align:center;${cor}">${faltas}</td>
                    </tr>`;
            }).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;color:#666">Nenhum aluno cadastrado nesta turma.</td></tr>';
        }
    } catch (error) {
        document.getElementById('modal-turma-alunos-body').innerHTML =
            '<tr><td colspan="4" style="text-align:center;padding:20px;color:#dc3545">Erro ao carregar alunos.</td></tr>';
    }
}

// ==========================================
// ALUNOS
// ==========================================

// Cache dos alunos para exportação
let _alunosCache = [];

async function loadAlunos() {
    try {
        const response = await fetch(`${API_BASE}/alunos.php`);
        const result = await response.json();
        
        if (result.success) {
            _alunosCache = result.data;
            const tbody = document.querySelector('#table-alunos tbody');
            tbody.innerHTML = '';
            
            result.data.forEach(aluno => {
                const maxFaltas = aluno.max_faltas || 5;
                const faltas = aluno.total_faltas || 0;
                const faltasCor = faltas >= maxFaltas ? 'color:#dc3545;font-weight:700;' : faltas >= maxFaltas - 1 ? 'color:#ffc107;font-weight:700;' : '';
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${esc(aluno.nome_completo)}</td>
                    <td>${esc(aluno.turma_nome) || '-'}</td>
                    <td>${esc(aluno.nome_mae) || '-'}</td>
                    <td>${esc(aluno.telefone_mae) || '-'}</td>
                    <td style="${faltasCor}">${faltas}</td>
                    <td>
                        <button class="btn-action btn-view" onclick="viewHistoricoAluno(${aluno.id}, ${JSON.stringify(aluno.nome_completo)})" title="Ver histórico de faltas">
                            <i class="fas fa-chart-bar"></i>
                        </button>
                        <button class="btn-action btn-edit" onclick="editAluno(${aluno.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action btn-delete" onclick="deleteAluno(${aluno.id})" title="Remover">
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
    document.getElementById('modal-aluno-title').textContent = 'Novo Aluno';
    document.getElementById('form-aluno').reset();
    document.getElementById('aluno-id').value = '';
    loadTurmasSelect('aluno-turma');
    openModal('modal-aluno');
}

async function editAluno(id) {
    try {
        const response = await fetch(`${API_BASE}/alunos.php?id=${id}`);
        const result = await response.json();
        
        if (result.success && result.data) {
            const a = result.data;
            document.getElementById('modal-aluno-title').textContent = 'Editar Aluno';
            document.getElementById('aluno-id').value = a.id;
            document.getElementById('aluno-nome').value = a.nome_completo || '';
            document.getElementById('aluno-nascimento').value = a.data_nascimento || '';
            document.getElementById('aluno-responsavel').value = a.nome_mae || '';
            document.getElementById('aluno-telefone').value = a.telefone_mae || '';
            document.getElementById('aluno-observacoes').value = a.observacoes || '';
            await loadTurmasSelect('aluno-turma');
            document.getElementById('aluno-turma').value = a.turma_id || '';
            openModal('modal-aluno');
        }
    } catch (error) {
        console.error('Erro ao carregar aluno:', error);
        alert('Erro ao carregar aluno');
    }
}

async function loadTurmasSelect(selectId) {
    try {
        const response = await fetch(`${API_BASE}/turmas.php`);
        const result = await response.json();
        
        if (result.success) {
            const select = document.getElementById(selectId) || document.querySelector(`select[name="turma_id"]`);
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
    const id = document.getElementById('aluno-id').value;
    const data = {
        nome_completo: document.getElementById('aluno-nome').value,
        data_nascimento: document.getElementById('aluno-nascimento').value,
        turma_id: document.getElementById('aluno-turma').value,
        nome_mae: document.getElementById('aluno-responsavel').value,
        telefone_mae: document.getElementById('aluno-telefone').value,
        observacoes: document.getElementById('aluno-observacoes').value,
    };
    if (id) data.id = id;
    
    try {
        const response = await fetch(`${API_BASE}/alunos.php`, {
            method: id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(id ? 'Aluno atualizado com sucesso!' : 'Aluno cadastrado com sucesso!');
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
// HISTÓRICO DE FALTAS
// ==========================================
async function viewHistoricoAluno(alunoId, nomeAluno) {
    document.getElementById('modal-historico-nome').textContent = `Histórico — ${nomeAluno}`;
    document.getElementById('historico-content').innerHTML = '<p>Carregando...</p>';
    openModal('modal-historico');
    
    try {
        const response = await fetch(`${API_BASE}/historico.php?aluno_id=${alunoId}`);
        const result = await response.json();
        
        if (result.success) {
            const { total_aulas, total_presencas, total_faltas, registros } = result.data;
            const pct = total_aulas > 0 ? Math.round((total_presencas / total_aulas) * 100) : 0;
            const corBarra = pct >= 75 ? '#28a745' : pct >= 50 ? '#ffc107' : '#dc3545';
            
            let html = `
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-bottom:20px;">
                    <div style="background:#f8f9fa;border-radius:10px;padding:15px;text-align:center;">
                        <div style="font-size:1.8rem;font-weight:700;color:var(--color-primary)">${total_aulas}</div>
                        <div style="font-size:0.85rem;color:#666">Aulas Registradas</div>
                    </div>
                    <div style="background:#f8f9fa;border-radius:10px;padding:15px;text-align:center;">
                        <div style="font-size:1.8rem;font-weight:700;color:#28a745">${total_presencas}</div>
                        <div style="font-size:0.85rem;color:#666">Presenças</div>
                    </div>
                    <div style="background:#f8f9fa;border-radius:10px;padding:15px;text-align:center;">
                        <div style="font-size:1.8rem;font-weight:700;color:#dc3545">${total_faltas}</div>
                        <div style="font-size:0.85rem;color:#666">Faltas</div>
                    </div>
                </div>
                <div style="margin-bottom:20px;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
                        <span style="font-weight:600">Frequência</span>
                        <span style="font-weight:700;color:${corBarra}">${pct}%</span>
                    </div>
                    <div style="background:#eee;border-radius:20px;height:12px;overflow:hidden;">
                        <div style="width:${pct}%;background:${corBarra};height:100%;border-radius:20px;transition:width 0.5s;"></div>
                    </div>
                </div>
            `;
            
            if (registros && registros.length > 0) {
                html += `
                    <div style="max-height:280px;overflow-y:auto;">
                        <table>
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Situação</th>
                                    <th>Justificativa</th>
                                </tr>
                            </thead>
                            <tbody>
                `;
                registros.forEach(r => {
                    const data = new Date(r.data_aula).toLocaleDateString('pt-BR');
                    const presente = r.presente == 1;
                    const icone = presente ? '✅ Presente' : '❌ Faltou';
                    html += `
                        <tr>
                            <td>${data}</td>
                            <td>${icone}</td>
                            <td style="color:#666;font-style:italic">${esc(r.justificativa) || '-'}</td>
                        </tr>
                    `;
                });
                html += `</tbody></table></div>`;
            } else {
                html += '<p style="color:#666;text-align:center;margin-top:10px;">Nenhum registro de chamada ainda.</p>';
            }
            
            document.getElementById('historico-content').innerHTML = html;
        } else {
            document.getElementById('historico-content').innerHTML = '<p>Erro ao carregar histórico.</p>';
        }
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        document.getElementById('historico-content').innerHTML = '<p>Erro ao carregar histórico.</p>';
    }
}

// ==========================================
// EXPORTAR ALUNOS CSV
// ==========================================
function exportarAlunosCSV() {
    if (_alunosCache.length === 0) {
        alert('Nenhum aluno para exportar.');
        return;
    }
    
    const cabecalho = ['Nome', 'Data de Nascimento', 'Turma', 'Responsável', 'Telefone', 'Faltas', 'Observações'];
    const linhas = _alunosCache.map(a => [
        a.nome_completo || '',
        a.data_nascimento ? new Date(a.data_nascimento).toLocaleDateString('pt-BR') : '',
        a.turma_nome || '',
        a.nome_mae || '',
        a.telefone_mae || '',
        a.total_faltas || 0,
        (a.observacoes || '').replace(/[\r\n]+/g, ' ')
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'));
    
    const csv = [cabecalho.join(';'), ...linhas].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alunos_${new Date().toLocaleDateString('pt-BR').replace(/\//g,'-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ==========================================
// ADMINISTRADORES
// ==========================================
async function loadAdmins() {
    try {
        const response = await fetch(`${API_BASE}/admins.php`);
        const result = await response.json();

        if (result.success) {
            const tbody = document.querySelector('#table-admins tbody');
            tbody.innerHTML = '';

            const logado = JSON.parse(localStorage.getItem('currentAdmin') || '{}');

            result.data.forEach(admin => {
                const tr = document.createElement('tr');
                const ultimoLogin = admin.ultimo_login
                    ? new Date(admin.ultimo_login).toLocaleString('pt-BR')
                    : 'Nunca';
                const ehVoce = admin.email === logado.email;
                tr.innerHTML = `
                    <td>${esc(admin.nome)} ${ehVoce ? '<span style="background:var(--color-primary);color:#fff;font-size:0.75rem;padding:2px 8px;border-radius:20px;margin-left:6px">você</span>' : ''}</td>
                    <td>${esc(admin.email)}</td>
                    <td>${ultimoLogin}</td>
                    <td>
                        ${!ehVoce ? `<button class="btn-action btn-delete" onclick="deleteAdmin(${admin.id})" title="Desativar"><i class="fas fa-user-slash"></i></button>` : '—'}
                    </td>
                `;
                tbody.appendChild(tr);
            });

            document.getElementById('total-admins').textContent = result.data.length;
        }
    } catch (error) {
        console.error('Erro ao carregar admins:', error);
        alert('Erro ao carregar administradores');
    }
}

function openModalAdmin() {
    document.getElementById('form-admin').reset();
    openModal('modal-admin');
}

async function saveAdmin(event) {
    event.preventDefault();

    const nome         = document.getElementById('admin-novo-nome').value;
    const email        = document.getElementById('admin-novo-email').value;
    const senha        = document.getElementById('admin-novo-senha').value;
    const senhaConfirm = document.getElementById('admin-novo-senha-confirm').value;

    if (senha !== senhaConfirm) {
        alert('As senhas não coincidem!');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/admins.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha })
        });
        const result = await response.json();

        if (result.success) {
            alert(result.message);
            closeModal('modal-admin');
            loadAdmins();
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('Erro ao criar admin:', error);
        alert('Erro ao criar administrador');
    }
}

async function deleteAdmin(id) {
    if (!confirm('Deseja realmente desativar este administrador?')) return;

    try {
        const response = await fetch(`${API_BASE}/admins.php?id=${id}`, { method: 'DELETE' });
        const result = await response.json();

        if (result.success) {
            alert(result.message);
            loadAdmins();
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('Erro ao desativar admin:', error);
        alert('Erro ao desativar administrador');
    }
}

// ==========================================
// EVENTOS
// ==========================================
const TIPO_LABEL = { missa:'Missa', catequese:'Catequese', crisma:'Crisma', evento:'Evento', outro:'Outro' };
const TIPO_COR   = { missa:'#b38e5d', catequese:'#4a90d9', crisma:'#7b5ea7', evento:'#28a745', outro:'#6c757d' };

async function loadEventos() {
    try {
        const response = await fetch(`${API_BASE}/eventos.php`);
        const result = await response.json();

        if (result.success) {
            const tbody = document.querySelector('#table-eventos tbody');
            tbody.innerHTML = '';

            result.data.forEach(ev => {
                const tr = document.createElement('tr');
                const data = new Date(ev.data_evento + 'T12:00:00').toLocaleDateString('pt-BR');
                const horario = ev.hora_inicio
                    ? ev.hora_inicio.slice(0,5) + (ev.hora_fim ? ' – ' + ev.hora_fim.slice(0,5) : '')
                    : '—';
                tr.innerHTML = `
                    <td>${esc(ev.titulo)}</td>
                    <td>${data}</td>
                    <td>${horario}</td>
                    <td><span style="background:${TIPO_COR[ev.tipo]||'#6c757d'};color:#fff;padding:3px 10px;border-radius:20px;font-size:0.82rem">${esc(TIPO_LABEL[ev.tipo] || ev.tipo)}</span></td>
                    <td>
                        <button class="btn-action btn-edit" onclick="editEvento(${ev.id})" title="Editar"><i class="fas fa-edit"></i></button>
                        <button class="btn-action btn-delete" onclick="deleteEvento(${ev.id})" title="Remover"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            document.getElementById('total-eventos').textContent = result.data.length;
        }
    } catch (error) {
        console.error('Erro ao carregar eventos:', error);
        alert('Erro ao carregar eventos');
    }
}

function openModalEvento() {
    document.getElementById('modal-evento-title').textContent = 'Novo Evento';
    document.getElementById('form-evento').reset();
    document.getElementById('evento-id').value = '';
    openModal('modal-evento');
}

async function editEvento(id) {
    try {
        const response = await fetch(`${API_BASE}/eventos.php?id=${id}`);
        const result = await response.json();

        if (result.success && result.data) {
            const ev = result.data;
            document.getElementById('modal-evento-title').textContent = 'Editar Evento';
            document.getElementById('evento-id').value          = ev.id;
            document.getElementById('evento-titulo').value      = ev.titulo;
            document.getElementById('evento-data').value        = ev.data_evento;
            document.getElementById('evento-hora-inicio').value = ev.hora_inicio || '';
            document.getElementById('evento-hora-fim').value    = ev.hora_fim    || '';
            document.getElementById('evento-tipo').value        = ev.tipo;
            document.getElementById('evento-descricao').value   = ev.descricao   || '';
            openModal('modal-evento');
        }
    } catch (error) {
        console.error('Erro ao carregar evento:', error);
        alert('Erro ao carregar evento');
    }
}

async function saveEvento(event) {
    event.preventDefault();
    const id = document.getElementById('evento-id').value;
    const data = {
        titulo:      document.getElementById('evento-titulo').value,
        data_evento: document.getElementById('evento-data').value,
        hora_inicio: document.getElementById('evento-hora-inicio').value,
        hora_fim:    document.getElementById('evento-hora-fim').value,
        tipo:        document.getElementById('evento-tipo').value,
        descricao:   document.getElementById('evento-descricao').value,
    };
    if (id) data.id = id;

    try {
        const response = await fetch(`${API_BASE}/eventos.php`, {
            method: id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();

        if (result.success) {
            alert(result.message);
            closeModal('modal-evento');
            loadEventos();
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('Erro ao salvar evento:', error);
        alert('Erro ao salvar evento');
    }
}

async function deleteEvento(id) {
    if (!confirm('Deseja realmente remover este evento?')) return;

    try {
        const response = await fetch(`${API_BASE}/eventos.php?id=${id}`, { method: 'DELETE' });
        const result = await response.json();

        if (result.success) {
            alert('Evento removido!');
            loadEventos();
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('Erro ao deletar evento:', error);
        alert('Erro ao deletar evento');
    }
}

// ==========================================
// CHAMADA
// ==========================================

// { alunoId: { presente: null|true|false, justificativa: '' } }
let _chamadaState    = {};
let _chamadaAulaInfo = { turmaId: null, data: null, turmaNome: '', dataFormatada: '' };

async function loadChamadaInicio() {
    const container = document.getElementById('chamada-content');
    try {
        const response = await fetch(`${API_BASE}/turmas.php`);
        const result   = await response.json();

        if (result.success && result.data.length > 0) {
            container.innerHTML = `
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;">
                    <div class="form-group-modal" style="margin-bottom:0">
                        <label>Turma:</label>
                        <select id="select-turma-chamada" onchange="loadChamada()">
                            <option value="">Escolha uma turma...</option>
                            ${result.data.map(t => `<option value="${t.id}" data-nome="${esc(t.nome)}">${esc(t.nome)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group-modal" style="margin-bottom:0">
                        <label>Data da Aula:</label>
                        <input type="date" id="data-aula-chamada" value="${new Date().toISOString().split('T')[0]}" onchange="loadChamada()">
                    </div>
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
    const sel       = document.getElementById('select-turma-chamada');
    const turmaId   = sel.value;
    const turmaNome = sel.options[sel.selectedIndex]?.dataset.nome || '';
    const data      = document.getElementById('data-aula-chamada').value;
    const container = document.getElementById('lista-chamada');

    if (!turmaId || !data) { container.innerHTML = ''; return; }

    container.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Carregando...</p>';
    _chamadaState    = {};
    _chamadaAulaInfo = {
        turmaId,
        data,
        turmaNome,
        dataFormatada: new Date(data + 'T12:00:00').toLocaleDateString('pt-BR')
    };

    try {
        const response = await fetch(`${API_BASE}/chamada.php?turma_id=${turmaId}&data=${data}`);
        const result   = await response.json();

        if (!result.success) { container.innerHTML = '<p>Erro ao carregar chamada.</p>'; return; }

        const { aula, alunos } = result.data;
        const jaSalva = !!aula?.realizada;

        alunos.forEach(a => {
            _chamadaState[a.aluno_id] = {
                presente:      a.presente === null || a.presente === undefined ? null : (a.presente == 1),
                justificativa: a.justificativa || ''
            };
        });

        container.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:16px">
                <h3 style="margin:0;color:var(--color-primary)">
                    ${esc(turmaNome)} — ${_chamadaAulaInfo.dataFormatada}
                    ${jaSalva ? '<span style="background:#28a745;color:#fff;font-size:0.75rem;padding:3px 10px;border-radius:20px;margin-left:10px;vertical-align:middle"><i class="fas fa-check"></i> Salva</span>' : ''}
                </h3>
                <div style="display:flex;gap:8px;flex-wrap:wrap">
                    <button type="button" class="btn-primary-custom" style="margin-bottom:0;padding:8px 14px;font-size:0.9rem;background:#28a745" onclick="exportarChamadaCSV()">
                        <i class="fas fa-file-csv"></i> CSV
                    </button>
                    <button type="button" class="btn-primary-custom" style="margin-bottom:0;padding:8px 14px;font-size:0.9rem;background:#6c757d" onclick="exportarChamadaPDF()">
                        <i class="fas fa-file-pdf"></i> PDF
                    </button>
                </div>
            </div>

            <div class="chamada-resumo" id="chamada-resumo"></div>

            <div class="chamada-toolbar">
                <input type="text" class="chamada-search" placeholder="Buscar aluno..."
                       oninput="filtrarAlunos(this.value)">
                <button type="button" class="btn-primary-custom" style="margin-bottom:0"
                        onclick="marcarTodosPresentes()">
                    <i class="fas fa-check-double"></i> Todos Presentes
                </button>
            </div>

            <div class="chamada-lista" id="chamada-lista">
                ${alunos.map(a => _renderAlunoRow(a)).join('')}
            </div>

            <div style="margin-top:20px;display:flex;gap:12px;align-items:center;flex-wrap:wrap">
                <button id="btn-salvar-chamada" type="button" class="btn-primary-custom"
                        style="margin-bottom:0" onclick="salvarChamada()">
                    <i class="fas fa-save"></i> Salvar Chamada
                </button>
                <span id="chamada-save-status"></span>
            </div>
        `;

        _atualizarResumo();
    } catch (error) {
        console.error('Erro ao carregar chamada:', error);
        container.innerHTML = '<p>Erro ao carregar. Tente novamente.</p>';
    }
}

function _renderAlunoRow(aluno) {
    const s        = _chamadaState[aluno.aluno_id] || { presente: null, justificativa: '' };
    const presente = s.presente;
    const faltas   = Number(aluno.total_faltas) || 0;
    const max      = Number(aluno.max_faltas)   || 5;
    const faltasCor = faltas >= max ? '#dc3545' : faltas >= max - 1 ? '#e6a817' : '#bbb';
    const rowClass  = presente === true ? ' presente' : presente === false ? ' faltou' : '';

    return `
        <div class="chamada-aluno${rowClass}" id="ca-${aluno.aluno_id}">
            <div class="ca-info">
                <span class="ca-nome">${esc(aluno.nome_completo)}</span>
                <span class="ca-faltas" style="color:${faltasCor}">${faltas} falta(s)</span>
            </div>
            <div class="ca-botoes">
                <button type="button" class="ca-btn ca-btn-presente${presente === true ? ' ativo' : ''}"
                        onclick="marcarPresenca(${aluno.aluno_id}, true)">
                    <i class="fas fa-check"></i> Presente
                </button>
                <button type="button" class="ca-btn ca-btn-faltou${presente === false ? ' ativo' : ''}"
                        onclick="marcarPresenca(${aluno.aluno_id}, false)">
                    <i class="fas fa-times"></i> Faltou
                </button>
            </div>
            <div class="ca-just"${presente !== false ? ' style="display:none"' : ''}>
                <input type="text" placeholder="Motivo da falta (opcional)"
                       value="${esc(s.justificativa)}"
                       oninput="_chamadaState[${aluno.aluno_id}].justificativa = this.value">
            </div>
        </div>
    `;
}

function marcarPresenca(alunoId, novoEstado) {
    if (!_chamadaState[alunoId]) _chamadaState[alunoId] = { presente: null, justificativa: '' };

    const atual = _chamadaState[alunoId].presente;
    _chamadaState[alunoId].presente = atual === novoEstado ? null : novoEstado;
    if (novoEstado === true) _chamadaState[alunoId].justificativa = '';

    const row = document.getElementById(`ca-${alunoId}`);
    if (!row) return;

    const estado = _chamadaState[alunoId].presente;
    row.className = `chamada-aluno${estado === true ? ' presente' : estado === false ? ' faltou' : ''}`;
    row.querySelector('.ca-btn-presente').classList.toggle('ativo', estado === true);
    row.querySelector('.ca-btn-faltou').classList.toggle('ativo', estado === false);

    const justDiv = row.querySelector('.ca-just');
    if (estado === false) {
        justDiv.style.display = '';
        if (!justDiv.querySelector('input')) {
            justDiv.innerHTML = `<input type="text" placeholder="Motivo da falta (opcional)"
                value="${esc(_chamadaState[alunoId].justificativa)}"
                oninput="_chamadaState[${alunoId}].justificativa = this.value">`;
        }
    } else {
        justDiv.style.display = 'none';
        justDiv.innerHTML = '';
    }

    _atualizarResumo();
}

function _atualizarResumo() {
    const el = document.getElementById('chamada-resumo');
    if (!el) return;

    const vals      = Object.values(_chamadaState);
    const total     = vals.length;
    const presentes = vals.filter(s => s.presente === true).length;
    const faltas    = vals.filter(s => s.presente === false).length;
    const pendentes = vals.filter(s => s.presente === null).length;

    el.innerHTML = `
        <div class="cr-item"><span class="cr-num">${total}</span><span class="cr-label">Total</span></div>
        <div class="cr-item cr-presente"><span class="cr-num">${presentes}</span><span class="cr-label">Presentes</span></div>
        <div class="cr-item cr-faltou"><span class="cr-num">${faltas}</span><span class="cr-label">Faltas</span></div>
        ${pendentes > 0 ? `<div class="cr-item cr-pendente"><span class="cr-num">${pendentes}</span><span class="cr-label">Não marcados</span></div>` : ''}
    `;
}

function marcarTodosPresentes() {
    Object.keys(_chamadaState).forEach(id => {
        _chamadaState[id].presente      = true;
        _chamadaState[id].justificativa = '';
    });
    document.querySelectorAll('.chamada-aluno').forEach(row => {
        const id = row.id.replace('ca-', '');
        row.className = 'chamada-aluno presente';
        row.querySelector('.ca-btn-presente')?.classList.add('ativo');
        row.querySelector('.ca-btn-faltou')?.classList.remove('ativo');
        const justDiv = row.querySelector('.ca-just');
        if (justDiv) { justDiv.style.display = 'none'; justDiv.innerHTML = ''; }
    });
    _atualizarResumo();
}

function filtrarAlunos(termo) {
    const t = termo.toLowerCase().trim();
    document.querySelectorAll('.chamada-aluno').forEach(row => {
        const nome = row.querySelector('.ca-nome')?.textContent.toLowerCase() || '';
        row.style.display = !t || nome.includes(t) ? '' : 'none';
    });
}

async function salvarChamada() {
    const { turmaId, data } = _chamadaAulaInfo;
    if (!turmaId || !data) return;

    const presencas = Object.entries(_chamadaState)
        .filter(([, s]) => s.presente !== null)
        .map(([id, s]) => ({
            aluno_id:      parseInt(id),
            presente:      s.presente,
            justificativa: s.presente ? '' : s.justificativa
        }));

    if (presencas.length === 0) {
        alert('Marque pelo menos um aluno antes de salvar.');
        return;
    }

    const btn    = document.getElementById('btn-salvar-chamada');
    const status = document.getElementById('chamada-save-status');

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

    try {
        const response = await fetch(`${API_BASE}/chamada.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ turma_id: turmaId, data, presencas })
        });
        const result = await response.json();

        if (result.success) {
            if (status) status.innerHTML = '<span style="color:#28a745"><i class="fas fa-check"></i> Salvo com sucesso!</span>';
            setTimeout(() => { if (status) status.innerHTML = ''; }, 4000);
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('Erro ao salvar chamada:', error);
        alert('Erro ao salvar chamada');
    }

    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save"></i> Salvar Chamada';
}

// ==========================================
// EXPORTAR CHAMADA
// ==========================================
function _coletarDadosChamadaAtual() {
    if (!Object.keys(_chamadaState).length) return null;
    return Object.entries(_chamadaState).map(([id, s]) => ({
        nome:          document.getElementById(`ca-${id}`)?.querySelector('.ca-nome')?.textContent || '',
        presente:      s.presente,
        justificativa: s.justificativa || ''
    }));
}

function exportarChamadaCSV() {
    const dados = _coletarDadosChamadaAtual();
    if (!dados) { alert('Nenhuma chamada carregada.'); return; }

    const { turmaNome, dataFormatada } = _chamadaAulaInfo;
    const cabecalho = ['Aluno', 'Situação', 'Justificativa'];
    const linhas = dados.map(d => [
        d.nome,
        d.presente === null ? 'Não marcado' : d.presente ? 'Presente' : 'Faltou',
        d.justificativa
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'));

    const info = `"Turma: ${turmaNome}";"Data: ${dataFormatada}"`;
    const csv  = [info, '', cabecalho.join(';'), ...linhas].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `chamada_${turmaNome.replace(/\s+/g,'_')}_${dataFormatada.replace(/\//g,'-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function exportarChamadaPDF() {
    const dados = _coletarDadosChamadaAtual();
    if (!dados) { alert('Nenhuma chamada carregada.'); return; }

    const { turmaNome, dataFormatada } = _chamadaAulaInfo;
    const presentes = dados.filter(d => d.presente === true).length;
    const faltas    = dados.filter(d => d.presente === false).length;
    const total     = dados.length;

    const linhas = dados.map((d, i) => {
        const situacao = d.presente === null
            ? '<span style="color:#6c757d">—</span>'
            : d.presente
                ? '<span style="color:#28a745;font-weight:600">✔ Presente</span>'
                : '<span style="color:#dc3545;font-weight:600">✘ Faltou</span>';
        const just = (!d.presente && d.justificativa)
            ? `<span style="color:#666;font-style:italic">${esc(d.justificativa)}</span>` : '';
        return `
            <tr style="background:${i % 2 === 0 ? '#fff' : '#f9f9f9'}">
                <td style="padding:9px 12px;border-bottom:1px solid #eee">${i + 1}</td>
                <td style="padding:9px 12px;border-bottom:1px solid #eee">${esc(d.nome)}</td>
                <td style="padding:9px 12px;border-bottom:1px solid #eee;text-align:center">${situacao}</td>
                <td style="padding:9px 12px;border-bottom:1px solid #eee">${just}</td>
            </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Chamada — ${esc(turmaNome)}</title>
    <style>
        body { font-family: Arial, sans-serif; color: #222; padding: 30px; }
        h1 { color: #b38e5d; margin-bottom: 4px; font-size: 1.4rem; }
        .subtitulo { color: #555; margin-bottom: 20px; font-size: 0.95rem; }
        .resumo { display: flex; gap: 30px; margin-bottom: 20px; }
        .resumo div { text-align: center; }
        .resumo .num { font-size: 1.8rem; font-weight: 700; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #b38e5d; color: #fff; padding: 10px 12px; text-align: left; }
        @media print { body { padding: 10px; } }
    </style>
</head>
<body>
    <h1>Paróquia Nossa Senhora do Monte Claro</h1>
    <div class="subtitulo">Chamada — ${esc(turmaNome)} — ${dataFormatada}</div>
    <div class="resumo">
        <div><div class="num" style="color:#333">${total}</div><div>Total</div></div>
        <div><div class="num" style="color:#28a745">${presentes}</div><div>Presentes</div></div>
        <div><div class="num" style="color:#dc3545">${faltas}</div><div>Faltas</div></div>
    </div>
    <table>
        <thead>
            <tr>
                <th style="width:40px">#</th>
                <th>Aluno</th>
                <th style="width:110px;text-align:center">Situação</th>
                <th>Justificativa</th>
            </tr>
        </thead>
        <tbody>${linhas}</tbody>
    </table>
    <p style="margin-top:30px;color:#999;font-size:0.8rem">Gerado em ${new Date().toLocaleString('pt-BR')}</p>
    <script>window.onload = () => window.print()<\/script>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// ==========================================
// INICIALIZAÇÃO
// ==========================================
async function carregarContadores() {
    try {
        const [rTurmas, rAlunos, rEventos, rAdmins] = await Promise.all([
            fetch(`${API_BASE}/turmas.php`).then(r => r.json()),
            fetch(`${API_BASE}/alunos.php`).then(r => r.json()),
            fetch(`${API_BASE}/eventos.php`).then(r => r.json()),
            fetch(`${API_BASE}/admins.php`).then(r => r.json()),
        ]);
        if (rTurmas.success)  document.getElementById('total-turmas').textContent  = rTurmas.data.length;
        if (rAlunos.success)  document.getElementById('total-alunos').textContent  = rAlunos.data.length;
        if (rEventos.success) document.getElementById('total-eventos').textContent = rEventos.data.length;
        if (rAdmins.success)  document.getElementById('total-admins').textContent  = rAdmins.data.length;
    } catch (e) {
        console.error('Erro ao carregar contadores:', e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadAvisos();
    carregarContadores();
});
