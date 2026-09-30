const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

//Banco de Dados SQLite//
const dbPath = path.resolve(__dirname, 'banco.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao abrir o banco de dados', err.message);
  } else {
    console.log('Conectado ao banco de dados SQLite.');
  }
});


db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    tipo TEXT DEFAULT 'estudante',
    serie TEXT,
    periodo TEXT,
    telefone TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS avisos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    categoria TEXT NOT NULL,
    conteudo TEXT NOT NULL,
    autor TEXT NOT NULL,
    data TEXT NOT NULL
  )`);
});


app.post('/api/cadastro', (req, res) => {
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Preencha todos os campos.' });
  }

  const hashSenha = bcrypt.hashSync(senha, 10);
  const tipo = (email === 'laraelisa009@gmail.com') ? 'admin' : 'estudante';

  const query = `INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)`;
  db.run(query, [nome, email, hashSenha, tipo], function(err) {
    if (err) {
      return res.status(400).json({ erro: 'E-mail já cadastrado.' });
    }
    res.json({ sucesso: true, mensagem: 'Usuário cadastrado com sucesso!' });
  });
});

app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ erro: 'Preencha todos os campos.' });
  }

  db.get(`SELECT * FROM usuarios WHERE email = ?`, [email], (err, usuario) => {
    if (err || !usuario) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
    }

    const senhaValida = bcrypt.compareSync(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
    }

    res.json({
      sucesso: true,
      usuario: {
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo,
        serie: usuario.serie,
        periodo: usuario.periodo,
        telefone: usuario.telefone
      }
    });
  });
});

app.post('/api/avisos', (req, res) => {
  const { titulo, categoria, conteudo, autor } = req.body;
  const dataAtual = new Date().toLocaleDateString('pt-BR');

  const query = `INSERT INTO avisos (titulo, categoria, conteudo, autor, data) VALUES (?, ?, ?, ?, ?)`;
  db.run(query, [titulo, categoria, conteudo, autor || 'Administração', dataAtual], function(err) {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao publicar aviso.' });
    }
    res.json({ sucesso: true, id: this.lastID });
  });
});

app.get('/api/avisos', (req, res) => {
  db.all(`SELECT * FROM avisos ORDER BY id DESC`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao buscar avisos.' });
    }
    res.json(rows);
  });
});

app.delete('/api/avisos/:id', (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM avisos WHERE id = ?`, [id], function(err) {
    if (err) return res.status(500).json({ erro: 'Erro ao excluir aviso.' });
    res.json({ sucesso: true });
  });
});

app.put('/api/perfil', (req, res) => {
  const { email, nome, serie, periodo, telefone } = req.body;
  const query = `UPDATE usuarios SET nome = ?, serie = ?, periodo = ?, telefone = ? WHERE email = ?`;
  
  db.run(query, [nome, serie, periodo, telefone, email], function(err) {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao atualizar perfil.' });
    }
    res.json({ sucesso: true, mensagem: 'Perfil atualizado com sucesso!' });
  });
});

 Rota principal para abrir a página de login automaticamente
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});