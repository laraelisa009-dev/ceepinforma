document.addEventListener('DOMContentLoaded', () => {

  // --- 1. Lógica de Cadastro ---
  const formCadastro = document.getElementById('form-cadastro');
  if (formCadastro) {
    formCadastro.addEventListener('submit', (e) => {
      e.preventDefault();

      const nome = document.getElementById('cad-nome').value.trim();
      const email = document.getElementById('cad-email').value.trim().toLowerCase();
      const senha = document.getElementById('cad-senha').value;

      if (nome && email && senha) {
        // Salva os dados do usuário cadastrado no LocalStorage
        localStorage.setItem('usuario_cadastrado_email', email);
        localStorage.setItem('usuario_cadastrado_senha', senha);
        localStorage.setItem('perfil_nome', nome);

        alert('Cadastro realizado com sucesso! Faça login para continuar.');
        window.location.href = 'index.html';
      } else {
        alert('Por favor, preencha todos os campos.');
      }
    });
  }

  // --- 2. Lógica de Login ---
  const formLogin = document.getElementById('form-login');
  if (formLogin) {
    formLogin.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const email = document.getElementById('login-email').value.trim().toLowerCase();
      const senha = document.getElementById('login-senha').value;

      // Recupera o usuário cadastrado para validar (se houver)
      const emailCadastrado = localStorage.getItem('usuario_cadastrado_email');
      const senhaCadastrada = localStorage.getItem('usuario_cadastrado_senha');

      if (email && senha) {
        // Verifica se é a Administradora
        if (email === 'laraelisa009@gmail.com') {
          localStorage.setItem('tipo_usuario', 'admin');
          window.location.href = 'mural.html';
          return;
        }

        // Verifica se bate com o usuário recém-cadastrado ou permite acesso padrão de estudante
        if ((emailCadastrado && email === emailCadastrado && senha === senhaCadastrada) || email.includes('@')) {
          localStorage.setItem('tipo_usuario', 'estudante');
          window.location.href = 'mural.html';
        } else {
          alert('E-mail ou senha incorretos.');
        }
      } else {
        alert('Por favor, preencha todos os campos.');
      }
    });
  }

  // --- 3. Verificar tipo de usuário ao carregar o Mural ---
  const caixaAdm = document.getElementById('caixa-adm');
  const tipoUsuario = localStorage.getItem('tipo_usuario');

  if (caixaAdm) {
    if (tipoUsuario === 'admin') {
      caixaAdm.classList.remove('hidden'); // Mostra pro ADM
    } else {
      caixaAdm.classList.add('hidden');    // Esconde do estudante
    }
  }

  // --- 4. Lógica de Publicação do Administrador ---
  const formPublicar = document.getElementById('form-publicar-aviso');
  if (formPublicar) {
    formPublicar.addEventListener('submit', (e) => {
      e.preventDefault();

      const titulo = document.getElementById('aviso-titulo').value;
      const categoria = document.getElementById('aviso-categoria').value;
      const conteudo = document.getElementById('aviso-conteudo').value;
      const dataAtual = new Date().toLocaleDateString('pt-BR');

      const novoAviso = {
        titulo,
        conteudo,
        data: dataAtual
      };

      localStorage.setItem('aviso_' + categoria, JSON.stringify(novoAviso));

      alert('Aviso publicado e direcionado com sucesso!');
      formPublicar.reset();
      carregarAvisosNaTela();
    });
  }

  carregarAvisosNaTela();

  // --- 5. Persistência do Perfil ---
  const formPerfil = document.getElementById('form-perfil');
  if (formPerfil) {
    if (localStorage.getItem('perfil_nome')) document.getElementById('perfil-nome').value = localStorage.getItem('perfil_nome');
    if (localStorage.getItem('perfil_serie')) document.getElementById('perfil-serie').value = localStorage.getItem('perfil_serie');
    if (localStorage.getItem('perfil_periodo')) document.getElementById('perfil-periodo').value = localStorage.getItem('perfil_periodo');
    if (localStorage.getItem('perfil_telefone')) document.getElementById('perfil-telefone').value = localStorage.getItem('perfil_telefone');

    formPerfil.addEventListener('submit', (e) => {
      e.preventDefault();
      localStorage.setItem('perfil_nome', document.getElementById('perfil-nome').value);
      localStorage.setItem('perfil_serie', document.getElementById('perfil-serie').value);
      localStorage.setItem('perfil_periodo', document.getElementById('perfil-periodo').value);
      localStorage.setItem('perfil_telefone', document.getElementById('perfil-telefone').value);
      alert('Alterações salvas com sucesso!');
    });
  }
});

// Função para atualizar os cards na tela com os dados salvos do ADM
function carregarAvisosNaTela() {
  const categorias = ['urgente', 'cardapio', 'evento', 'reuniao', 'projeto', 'outro'];

  categorias.forEach(cat => {
    const dadosSalvos = localStorage.getItem('aviso_' + cat);
    const pElement = document.getElementById('preview-' + cat);

    if (dadosSalvos && pElement) {
      const avisoObj = JSON.parse(dadosSalvos);
      pElement.innerText = avisoObj.titulo + ': ' + avisoObj.conteudo;
    }
  });
}

// Abrir modal ao clicar no card da categoria
function abrirCardCategoria(catKey, nomeCat) {
  const dadosSalvos = localStorage.getItem('aviso_' + catKey);

  if (dadosSalvos) {
    const avisoObj = JSON.parse(dadosSalvos);
    document.getElementById('modal-cat-tag').innerText = nomeCat;
    document.getElementById('modal-titulo').innerText = avisoObj.titulo;
    document.getElementById('modal-texto').innerText = avisoObj.conteudo;
    document.getElementById('modal-data').innerText = '📅 ' + avisoObj.data;
    document.getElementById('modal-aviso').classList.remove('hidden');
  } else {
    alert('Ainda não há nenhum aviso publicado nesta categoria.');
  }
}

function fecharModal() {
  document.getElementById('modal-aviso').classList.add('hidden');
}