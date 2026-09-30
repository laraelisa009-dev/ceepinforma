document.addEventListener('DOMContentLoaded', () => {

  // Cadastro
  const formCadastro = document.getElementById('form-cadastro');
  if (formCadastro) {
    formCadastro.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nome = document.getElementById('cad-nome').value.trim();
      const email = document.getElementById('cad-email').value.trim().toLowerCase();
      const senha = document.getElementById('cad-senha').value;

      try {
        const resposta = await fetch('/api/cadastro', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome, email, senha })
        });
        const resultado = await resposta.json();

        if (resposta.ok) {
          alert(resultado.mensagem);
          window.location.href = 'index.html';
        } else {
          alert(resultado.erro);
        }
      } catch (err) {
        alert('Erro de conexão com o servidor.');
      }
    });
  }

  // Login
  const formLogin = document.getElementById('form-login');
  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim().toLowerCase();
      const senha = document.getElementById('login-senha').value;

      try {
        const resposta = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, senha })
        });
        const resultado = await resposta.json();

        if (resposta.ok) {
          sessionStorage.setItem('usuario_ativo', JSON.stringify(resultado.usuario));
          window.location.href = 'mural.html';
        } else {
          alert(resultado.erro);
        }
      } catch (err) {
        alert('Erro de conexão com o servidor.');
      }
    });
  }

  // Proteção de rotas e verificação de sessão
  const usuarioAtivo = JSON.parse(sessionStorage.getItem('usuario_ativo'));
  const paginaAtual = window.location.pathname;

  if ((paginaAtual.includes('mural.html') || paginaAtual.includes('perfil.html') || paginaAtual.includes('contato.html')) && !usuarioAtivo) {
    window.location.href = 'index.html';
  }

  // Controle de visibilidade da caixa de admin
  const caixaAdm = document.getElementById('caixa-adm');
  if (caixaAdm) {
    if (usuarioAtivo && usuarioAtivo.tipo === 'admin') {
      caixaAdm.style.display = 'block';
    } else {
      caixaAdm.style.display = 'none';
    }
  }

  // Publicação de avisos (admin)
  const formPublicar = document.getElementById('form-publicar-aviso');
  if (formPublicar) {
    formPublicar.addEventListener('submit', async (e) => {
      e.preventDefault();
      const titulo = document.getElementById('aviso-titulo').value;
      const categoria = document.getElementById('aviso-categoria').value;
      const conteudo = document.getElementById('aviso-conteudo').value;
      const autor = usuarioAtivo ? usuarioAtivo.nome : 'Administração';

      try {
        const resposta = await fetch('/api/avisos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ titulo, categoria, conteudo, autor })
        });

        if (resposta.ok) {
          alert('Aviso publicado com sucesso!');
          formPublicar.reset();
          carregarAvisosDoServidor();
        } else {
          alert('Erro ao publicar aviso.');
        }
      } catch (err) {
        alert('Erro de conexão com o servidor.');
      }
    });
  }

  if (paginaAtual.includes('mural.html')) {
    carregarAvisosDoServidor();
  }

  // Logout
  const btnLogout = document.querySelector('.logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', (e) => {
      e.preventDefault();
      sessionStorage.removeItem('usuario_ativo');
      window.location.href = 'index.html';
    });
  }

  // Perfil
  const formPerfil = document.getElementById('form-perfil');
  if (formPerfil && usuarioAtivo) {
    document.getElementById('perfil-nome').value = usuarioAtivo.nome || '';
    document.getElementById('perfil-email').value = usuarioAtivo.email || '';
    document.getElementById('perfil-serie').value = usuarioAtivo.serie || '';
    if (usuarioAtivo.periodo) document.getElementById('perfil-periodo').value = usuarioAtivo.periodo;
    document.getElementById('perfil-telefone').value = usuarioAtivo.telefone || '';

    formPerfil.addEventListener('submit', async (e) => {
      e.preventDefault();
      const dadosAtualizados = {
        email: usuarioAtivo.email,
        nome: document.getElementById('perfil-nome').value,
        serie: document.getElementById('perfil-serie').value,
        periodo: document.getElementById('perfil-periodo').value,
        telefone: document.getElementById('perfil-telefone').value
      };

      try {
        const resposta = await fetch('/api/perfil', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dadosAtualizados)
        });

        if (resposta.ok) {
          usuarioAtivo.nome = dadosAtualizados.nome;
          usuarioAtivo.serie = dadosAtualizados.serie;
          usuarioAtivo.periodo = dadosAtualizados.periodo;
          usuarioAtivo.telefone = dadosAtualizados.telefone;
          sessionStorage.setItem('usuario_ativo', JSON.stringify(usuarioAtivo));
          alert('Alterações salvas com sucesso!');
        } else {
          alert('Erro ao atualizar perfil.');
        }
      } catch (err) {
        alert('Erro de conexão com o servidor.');
      }
    });
  }
});

// --- Funções do Mural com Lista e Exclusão ---
let avisosCache = [];

async function carregarAvisosDoServidor() {
  try {
    const resposta = await fetch('/api/avisos');
    const avisos = await resposta.json();
    avisosCache = avisos;

    const categorias = ['urgente', 'cardapio', 'evento', 'reuniao', 'projeto', 'outro'];

    categorias.forEach(cat => {
      const pElement = document.getElementById('preview-' + cat);
      if (!pElement) return;

      const avisosDaCategoria = avisos.filter(a => a.categoria === cat);

      if (avisosDaCategoria.length > 0) {
        const maisRecente = avisosDaCategoria[0];
        pElement.innerText = `${maisRecente.titulo}: ${maisRecente.conteudo}`;
        pElement.closest('.card-aviso').onclick = () => abrirListaCategoria(cat);
      } else {
        pElement.innerText = 'Nenhum aviso publicado no momento.';
        pElement.closest('.card-aviso').onclick = () => alert('Ainda não há aviso nesta categoria.');
      }
    });
  } catch (err) {
    console.error('Erro ao carregar avisos', err);
  }
}

function abrirListaCategoria(categoria) {
  const avisosDaCategoria = avisosCache.filter(a => a.categoria === categoria);
  const usuarioAtivo = JSON.parse(sessionStorage.getItem('usuario_ativo'));
  const ehAdmin = usuarioAtivo && usuarioAtivo.tipo === 'admin';

  const corpo = document.getElementById('modal-lista-corpo');
  corpo.innerHTML = '';

  if (avisosDaCategoria.length === 0) {
    corpo.innerHTML = '<p>Nenhum aviso nesta categoria.</p>';
  }

  avisosDaCategoria.forEach(aviso => {
    const item = document.createElement('div');
    item.className = 'item-aviso-lista';

    const titulo = document.createElement('h4');
    titulo.textContent = aviso.titulo;

    const conteudo = document.createElement('p');
    conteudo.textContent = aviso.conteudo;

    const rodape = document.createElement('div');
    rodape.className = 'card-footer-info';
    rodape.innerHTML = `<span>📅 ${aviso.data}</span><span>👤 ${aviso.autor}</span>`;

    item.appendChild(titulo);
    item.appendChild(conteudo);
    item.appendChild(rodape);

    if (ehAdmin) {
      const btn = document.createElement('button');
      btn.className = 'btn-excluir';
      btn.textContent = 'Excluir';
      btn.addEventListener('click', () => excluirAviso(aviso.id, categoria));
      item.appendChild(btn);
    }

    corpo.appendChild(item);
  });

  document.getElementById('modal-cat-tag').innerText = categoria.toUpperCase();
  document.getElementById('modal-aviso').classList.remove('hidden');
}

async function excluirAviso(id, categoria) {
  if (!confirm('Tem certeza que deseja excluir este aviso?')) return;

  try {
    const resposta = await fetch(`/api/avisos/${id}`, { method: 'DELETE' });
    if (resposta.ok) {
      await carregarAvisosDoServidor();
      abrirListaCategoria(categoria);
    } else {
      alert('Erro ao excluir aviso.');
    }
  } catch (err) {
    alert('Erro de conexão com o servidor.');
  }
}

function fecharModal() {
  document.getElementById('modal-aviso').classList.add('hidden');
}

function filtrarAvisos() {
  const termo = document.getElementById('input-busca').value.toLowerCase();
  const cards = document.querySelectorAll('.card-aviso');

  cards.forEach(card => {
    const texto = card.innerText.toLowerCase();
    card.style.display = texto.includes(termo) ? 'block' : 'none';
  });
}