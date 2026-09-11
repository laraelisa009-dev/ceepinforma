const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const db = new sqlite3.Database('./banco.db', (err) => {
    if (err) console.error("Erro no banco:", err.message);
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS avisos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        categoria TEXT NOT NULL,
        conteudo TEXT NOT NULL,
        data DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario TEXT UNIQUE,
        senha TEXT,
        nome TEXT,
        perfil TEXT
    )`);

    // Inserção automática das contas de teste (Gestor e Aluno)
    db.run(`INSERT OR IGNORE INTO usuarios (usuario, senha, nome, perfil) VALUES ('gestor', '123', 'Coordenação Pedagógica', 'gestor')`);
    db.run(`INSERT OR IGNORE INTO usuarios (usuario, senha, nome, perfil) VALUES ('aluno', '123', 'Aluno CEEP', 'aluno')`);
});

app.post('/api/login', (req, res) => {
    const { usuario, senha } = req.body;
    db.get("SELECT usuario, nome, perfil FROM usuarios WHERE usuario = ? AND senha = ?", [usuario, senha], (err, row) => {
        if (row) {
            res.json({ success: true, usuario: row.usuario, nome: row.nome, perfil: row.perfil });
        } else {
            res.status(401).json({ success: false });
        }
    });
});

app.get('/api/avisos', (req, res) => {
    db.all("SELECT * FROM avisos ORDER BY id DESC", [], (err, rows) => {
        res.json(rows);
    });
});

app.post('/api/avisos', (req, res) => {
    const { titulo, categoria, conteudo } = req.body;
    db.run("INSERT INTO avisos (titulo, categoria, conteudo) VALUES (?, ?, ?)", [titulo, categoria, conteudo], function() {
        res.json({ id: this.lastID });
    });
});

app.put('/api/avisos/:id', (req, res) => {
    const { id } = req.params;
    const { titulo, categoria, conteudo } = req.body;
    db.run("UPDATE avisos SET titulo = ?, categoria = ?, conteudo = ? WHERE id = ?", [titulo, categoria, conteudo, id], function() {
        res.json({ success: true });
    });
});

app.delete('/api/avisos/:id', (req, res) => {
    db.run("DELETE FROM avisos WHERE id = ?", [req.params.id], function() {
        res.json({ success: true });
    });
});

app.listen(3000, () => console.log("Servidor CEEP Informa rodando em http://localhost:3000"));