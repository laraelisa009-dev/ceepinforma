const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

const bytesToHex = (b) => [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
const hexToBytes = (h) => new Uint8Array(h.match(/.{2}/g).map((x) => parseInt(x, 16)));

async function hashSenha(senha, saltHex) {
  const salt = saltHex ? hexToBytes(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(senha), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256
  );
  return { salt: bytesToHex(salt), hash: bytesToHex(new Uint8Array(bits)) };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (!path.startsWith('/api/')) return env.ASSETS.fetch(request);

    try {
      // Cadastro
      if (path === '/api/cadastro' && method === 'POST') {
        const { nome, email, senha } = await request.json();
        if (!nome || !email || !senha) return json({ erro: 'Preencha todos os campos.' }, 400);
        if (senha.length < 6) return json({ erro: 'A senha deve ter pelo menos 6 caracteres.' }, 400);

        const existe = await env.DB.prepare('SELECT id FROM usuarios WHERE email = ?').bind(email).first();
        if (existe) return json({ erro: 'Este e-mail já está cadastrado.' }, 409);

        const { salt, hash } = await hashSenha(senha);
        await env.DB.prepare(
          'INSERT INTO usuarios (nome, email, senha_hash, salt) VALUES (?, ?, ?, ?)'
        ).bind(nome, email, hash, salt).run();

        return json({ mensagem: 'Cadastro realizado com sucesso! Faça login.' }, 201);
      }

      // Login
      if (path === '/api/login' && method === 'POST') {
        const { email, senha } = await request.json();
        const u = await env.DB.prepare('SELECT * FROM usuarios WHERE email = ?').bind(email).first();
        if (!u) return json({ erro: 'E-mail ou senha incorretos.' }, 401);

        const { hash } = await hashSenha(senha, u.salt);
        if (hash !== u.senha_hash) return json({ erro: 'E-mail ou senha incorretos.' }, 401);

        return json({
          usuario: {
            nome: u.nome, email: u.email, tipo: u.tipo,
            serie: u.serie, periodo: u.periodo, telefone: u.telefone
          }
        });
      }

      // Listar avisos
      if (path === '/api/avisos' && method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM avisos ORDER BY id DESC').all();
        return json(results);
      }

      // Publicar aviso
      if (path === '/api/avisos' && method === 'POST') {
        const { titulo, categoria, conteudo, autor } = await request.json();
        if (!titulo || !categoria || !conteudo) return json({ erro: 'Dados incompletos.' }, 400);
        const data = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        await env.DB.prepare(
          'INSERT INTO avisos (titulo, categoria, conteudo, autor, data) VALUES (?, ?, ?, ?, ?)'
        ).bind(titulo, categoria, conteudo, autor || 'Administração', data).run();
        return json({ mensagem: 'Aviso publicado.' }, 201);
      }

      // Excluir aviso
      const m = path.match(/^\/api\/avisos\/(\d+)$/);
      if (m && method === 'DELETE') {
        await env.DB.prepare('DELETE FROM avisos WHERE id = ?').bind(Number(m[1])).run();
        return json({ mensagem: 'Aviso excluído.' });
      }

      // Atualizar perfil
      if (path === '/api/perfil' && method === 'PUT') {
        const { email, nome, serie, periodo, telefone } = await request.json();
        await env.DB.prepare(
          'UPDATE usuarios SET nome = ?, serie = ?, periodo = ?, telefone = ? WHERE email = ?'
        ).bind(nome, serie, periodo, telefone, email).run();
        return json({ mensagem: 'Perfil atualizado.' });
      }

      return json({ erro: 'Rota não encontrada.' }, 404);
    } catch (err) {
      return json({ erro: 'Erro interno no servidor.' }, 500);
    }
  }
};