let usuarioLogado = null;
const categorias = ['Avisos Urgentes', 'Avisos Comuns', 'Eventos', 'Cardápio Semanal', 'Calendário Escolar', 'Reuniões'];

// Função do Formulário de Login Inicial
document.getElementById('formLogin').onsubmit = async (e) => {
    e.preventDefault();
    const usuario = document.getElementById('usuario').value;
    const senha = document.getElementById('senha').value;

    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, senha })
    });

    const data = await res.json();

    if (res.ok && data.success) {
        usuarioLogado = data;
        
        // Esconde o Login e exibe o Mural Principal
        document.getElementById('telaLogin').classList.add('escondido');
        document.getElementById('muralPrincipal').classList.remove('escondido');

        document.getElementById('nomeUsuarioTxt').innerText = `${data.nome} (${data.perfil.toUpperCase()})`;

        // Libera o formulário apenas se for gestor
        if (data.perfil === 'gestor') {
            document.getElementById('cardPublicar').classList.remove('escondido');
        } else {
            document.getElementById('cardPublicar').classList.add('escondido');
        }

        carregarAvisos();
    } else {
        alert('Usuário ou senha incorretos!');
    }
};

// Função de Sair (Logout)
function fazerLogout() {
    usuarioLogado = null;
    document.getElementById('formLogin').reset();
    document.getElementById('muralPrincipal').classList.add('escondido');
    document.getElementById('telaLogin').classList.remove('escondido');
}

// Carregar e Exibir Avisos por Categorias em Blocos
async function carregarAvisos() {
    const res = await fetch('/api/avisos');
    const avisos = await res.json();
    const mural = document.getElementById('mural');
    mural.innerHTML = '';

    const eGestor = usuarioLogado && usuarioLogado.perfil === 'gestor';

    categorias.forEach(cat => {
        const filtrados = avisos.filter(a => a.categoria === cat);
        if (filtrados.length > 0) {
            const bloco = document.createElement('div');
            bloco.className = 'bloco-categoria';
            bloco.innerHTML = `<h2>${cat}</h2>` + filtrados.map(a => `
                <div class="item-aviso">
                    ${eGestor ? `
                        <div class="menu-dots" onclick="toggleMenu(this)">⋮</div>
                        <div class="dropdown" onmouseleave="this.style.display='none'">
                            <button onclick="editar(${a.id}, '${a.titulo.replace(/'/g, "\\'")}', '${a.categoria}', '${a.conteudo.replace(/'/g, "\\'")}')">Editar</button>
                            <button onclick="deletar(${a.id})" style="color:red">Apagar</button>
                        </div>
                    ` : ''}
                    <strong>${a.titulo}</strong>
                    <p style="font-size: 14px; margin-top:5px">${a.conteudo}</p>
                </div>
            `).join('');
            mural.appendChild(bloco);
        }
    });
}

function toggleMenu(elem) {
    const dropdown = elem.nextElementSibling;
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

// Criar / Editar Aviso
document.getElementById('formAviso').onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('editId').value;
    const titulo = document.getElementById('titulo').value;
    const categoria = document.getElementById('categoria').value;
    const conteudo = document.getElementById('conteudo').value;

    const body = JSON.stringify({ titulo, categoria, conteudo });
    await fetch(id ? '/api/avisos/' + id : '/api/avisos', {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
    });

    e.target.reset();
    document.getElementById('editId').value = '';
    carregarAvisos();
};

function editar(id, t, c, cont) {
    document.getElementById('editId').value = id;
    document.getElementById('titulo').value = t;
    document.getElementById('categoria').value = c;
    document.getElementById('conteudo').value = cont;
    window.scrollTo(0, 0);
}

async function deletar(id) {
    if (confirm('Tem certeza que deseja apagar este aviso?')) {
        await fetch('/api/avisos/' + id, { method: 'DELETE' });
        carregarAvisos();
    }
}