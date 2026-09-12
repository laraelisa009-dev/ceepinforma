const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const EMAIL_ADM = "laraelisa009@gmail.com";
const db = new sqlite3.Database('./banco.db');

// Criação das tabelas
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS usuarios (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT, email TEXT UNIQUE, senha TEXT, tipo TEXT DEFAULT 'aluno')`);
  db.run(`CREATE TABLE IF NOT EXISTS avisos (id INTEGER PRIMARY KEY AUTOINCREMENT, titulo TEXT, conteudo TEXT)`);
  db.run(`UPDATE usuarios SET tipo = 'admin' WHERE email = ?`, [EMAIL_ADM]);
});

// Cadastro
app.post('/cadastrar', (req, res) => {
  const { nome, email, senha } = req.body;
  const tipo = (email === EMAIL_ADM) ? 'admin' : 'aluno';
  db.run(`INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)`, [nome, email, senha, tipo], function(err) {
    if (err) return res.status(400).json({ erro: "E-mail já cadastrado." });
    res.json({ mensagem: "Cadastrado com sucesso!" });
  });
});

// Login
app.post('/login', (req, res) => {
  const { email, senha } = req.body;
  db.get(`SELECT id, nome, email, tipo FROM usuarios WHERE email = ? AND senha = ?`, [email, senha], (err, row) => {
    if (row) res.json({ usuario: row });
    else res.status(401).json({ erro: "E-mail ou senha incorretos." });
  });
});

// Buscar Avisos
app.get('/avisos', (req, res) => {
  db.all(`SELECT * FROM avisos ORDER BY id DESC`, [], (err, rows) => {
    res.json(rows || []);
  });
});

// Criar Aviso
app.post('/avisos', (req, res) => {
  const { titulo, conteudo } = req.body;
  db.run(`INSERT INTO avisos (titulo, conteudo) VALUES (?, ?)`, [titulo, conteudo], () => {
    res.json({ mensagem: "Aviso publicado!" });
  });
});

app.listen(3000, () => console.log("Servidor rodando na porta 3000"));