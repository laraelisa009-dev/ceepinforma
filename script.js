// Seleção dos elementos
const formLogin = document.getElementById('form-login');
const formCadastro = document.getElementById('form-cadastro');
const linkIrCadastro = document.getElementById('link-ir-cadastro');
const linkIrLogin = document.getElementById('link-ir-login');

// Alternar entre Login e Cadastro
if (linkIrCadastro && linkIrLogin) {
  linkIrCadastro.addEventListener('click', () => {
    formLogin.classList.add('hidden');
    formCadastro.classList.remove('hidden');
  });

  linkIrLogin.addEventListener('click', () => {
    formCadastro.classList.add('hidden');
    formLogin.classList.remove('hidden');
  });
}

// Cadastro
if (formCadastro) {
  formCadastro.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = document.getElementById('cad-nome').value;
    const email = document.getElementById('cad-email').value;
    const senha = document.getElementById('cad-senha').value;

    const res = await fetch('/cadastrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, senha })
    });
    const dados = await res.json();
    alert(dados.mensagem || dados.erro);
    if (res.ok) location.reload();
  });
}

// Login
if (formLogin) {
  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;

    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });
    const dados = await res.json();

    if (res.ok) {
      localStorage.setItem('usuarioLogado', JSON.stringify(dados.usuario));
      window.location.href = "mural.html";
    } else {
      alert(dados.erro);
    }
  });
}

// Lógica da página do Mural (mural.html)
const caixaAdm = document.getElementById('caixa-adm');
const formAviso = document.getElementById('form-publicar-aviso');
const listaAvisos = document.getElementById('lista-avisos');

if (window.location.pathname.endsWith('mural.html')) {
  const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));

  if (!usuario) {
    window.location.href = "index.html"; // Se não logou, vai pro login
  } else {
    // Mostra a caixa de publicar SÓ se for admin
    caixaAdm.style.display = (usuario.tipo === 'admin') ? 'block' : 'none';
    carregarAvisos();
  }
}

// Carregar avisos do banco
async function carregarAvisos() {
  if (!listaAvisos) return;
  const res = await fetch('/avisos');
  const avisos = await res.json();

  listaAvisos.innerHTML = avisos.length ? '' : '<p>Nenhum aviso ainda.</p>';
  avisos.forEach(a => {
    listaAvisos.innerHTML += `
      <div class="card-aviso">
        <h3>${a.titulo}</h3>
        <p>${a.conteudo}</p>
      </div>
    `;
  });
}

// Enviar novo aviso
if (formAviso) {
  formAviso.addEventListener('submit', async (e) => {
    e.preventDefault();
    const titulo = document.getElementById('aviso-titulo').value;
    const conteudo = document.getElementById('aviso-conteudo').value;

    await fetch('/avisos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo, conteudo })
    });

    formAviso.reset();
    carregarAvisos();
  });
}