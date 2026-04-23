-- ============================================
-- ALAFIA - Sistema de Gestão Espiritual
-- Esquema do Banco de Dados
-- ============================================

-- Usuários do sistema (Admin, Atendente, Operacional, Administrativo)
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  perfil TEXT NOT NULL DEFAULT 'atendente' CHECK(perfil IN ('admin','atendente','operacional','administrativo')),
  ativo INTEGER NOT NULL DEFAULT 1,
  nome_templo TEXT,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT,
  data_nascimento TEXT,
  foto_url TEXT,
  endereco TEXT,
  instagram TEXT,
  origem TEXT DEFAULT 'direto' CHECK(origem IN ('instagram','whatsapp','indicacao','direto','outro')),
  status TEXT NOT NULL DEFAULT 'ativo' CHECK(status IN ('ativo','inativo','prospecto')),
  observacoes TEXT,
  relato_inicial TEXT,
  melhor_dia TEXT,
  melhor_horario TEXT,
  criado_por INTEGER REFERENCES usuarios(id),
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tipos de serviço (editáveis pela admin)
CREATE TABLE IF NOT EXISTS tipos_consulta (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  descricao TEXT,
  valor_padrao REAL DEFAULT 0,
  ativo INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS tipos_trabalho (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  descricao TEXT,
  valor_padrao REAL DEFAULT 0,
  duracao_dias INTEGER DEFAULT 7,
  ativo INTEGER DEFAULT 1
);

-- Consultas
CREATE TABLE IF NOT EXISTS consultas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id),
  tipo_consulta_id INTEGER REFERENCES tipos_consulta(id),
  tipo_nome TEXT,
  data_consulta DATETIME NOT NULL,
  valor REAL NOT NULL DEFAULT 0,
  valor_pago REAL DEFAULT 0,
  status_pagamento TEXT DEFAULT 'pendente' CHECK(status_pagamento IN ('pendente','pago','parcial','cancelado')),
  status_atendimento TEXT DEFAULT 'agendado' CHECK(status_atendimento IN ('agendado','realizado','cancelado','nao_compareceu')),
  observacoes TEXT,
  proximo_contato DATETIME,
  atendente_id INTEGER REFERENCES usuarios(id),
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Trabalhos Espirituais
CREATE TABLE IF NOT EXISTS trabalhos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id),
  tipo_trabalho_id INTEGER REFERENCES tipos_trabalho(id),
  tipo_nome TEXT,
  data_inicio DATETIME NOT NULL,
  data_fim_prevista DATETIME,
  data_fim_real DATETIME,
  valor REAL NOT NULL DEFAULT 0,
  valor_pago REAL DEFAULT 0,
  status_pagamento TEXT DEFAULT 'pendente' CHECK(status_pagamento IN ('pendente','pago','parcial','cancelado')),
  status TEXT DEFAULT 'em_andamento' CHECK(status IN ('em_andamento','pausado','finalizado','cancelado')),
  observacoes TEXT,
  responsavel_id INTEGER REFERENCES usuarios(id),
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Categorias de estoque
CREATE TABLE IF NOT EXISTS categorias_estoque (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  descricao TEXT
);

-- Itens de estoque
CREATE TABLE IF NOT EXISTS estoque (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  categoria_id INTEGER REFERENCES categorias_estoque(id),
  quantidade REAL NOT NULL DEFAULT 0,
  unidade TEXT DEFAULT 'un',
  quantidade_minima REAL DEFAULT 5,
  valor_unitario REAL DEFAULT 0,
  fornecedor TEXT,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Movimentações de estoque
CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL REFERENCES estoque(id),
  tipo TEXT NOT NULL CHECK(tipo IN ('entrada','saida')),
  quantidade REAL NOT NULL,
  motivo TEXT,
  trabalho_id INTEGER REFERENCES trabalhos(id),
  usuario_id INTEGER REFERENCES usuarios(id),
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Materiais usados nos trabalhos
CREATE TABLE IF NOT EXISTS trabalho_materiais (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trabalho_id INTEGER NOT NULL REFERENCES trabalhos(id),
  item_id INTEGER NOT NULL REFERENCES estoque(id),
  quantidade REAL NOT NULL,
  valor_unitario REAL DEFAULT 0
);

-- Transações financeiras
CREATE TABLE IF NOT EXISTS transacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL CHECK(tipo IN ('entrada','saida')),
  categoria TEXT NOT NULL,
  descricao TEXT NOT NULL,
  valor REAL NOT NULL,
  data_transacao DATETIME DEFAULT CURRENT_TIMESTAMP,
  consulta_id INTEGER REFERENCES consultas(id),
  trabalho_id INTEGER REFERENCES trabalhos(id),
  usuario_id INTEGER REFERENCES usuarios(id),
  comprovante_base64 TEXT,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Fotos dos trabalhos espirituais
CREATE TABLE IF NOT EXISTS trabalho_fotos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trabalho_id INTEGER NOT NULL REFERENCES trabalhos(id) ON DELETE CASCADE,
  foto_base64 TEXT NOT NULL,
  descricao TEXT,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Campanhas de marketing
CREATE TABLE IF NOT EXISTS campanhas_marketing (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  canal TEXT NOT NULL CHECK(canal IN ('instagram','whatsapp','facebook','outro')),
  data_inicio DATE,
  data_fim DATE,
  orcamento REAL DEFAULT 0,
  status TEXT DEFAULT 'ativa' CHECK(status IN ('ativa','pausada','encerrada')),
  observacoes TEXT,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Histórico CRM de clientes
CREATE TABLE IF NOT EXISTS crm_historico (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id),
  tipo TEXT NOT NULL CHECK(tipo IN ('contato','consulta','trabalho','pagamento','observacao','follow_up')),
  titulo TEXT NOT NULL,
  descricao TEXT,
  usuario_id INTEGER REFERENCES usuarios(id),
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Configurações do sistema
CREATE TABLE IF NOT EXISTS configuracoes (
  chave TEXT PRIMARY KEY,
  valor TEXT NOT NULL,
  descricao TEXT
);

-- ============================================
-- DADOS INICIAIS
-- ============================================

INSERT OR IGNORE INTO tipos_consulta (nome, descricao, valor_padrao) VALUES
  ('Consulta Espiritual Geral', 'Consulta geral sobre vida espiritual', 150.00),
  ('Consulta Amorosa', 'Orientação espiritual sobre relacionamentos', 150.00),
  ('Consulta Financeira', 'Orientação espiritual sobre finanças', 150.00),
  ('Direcionamento Espiritual', 'Direcionamento e orientação de vida', 200.00);

INSERT OR IGNORE INTO tipos_trabalho (nome, descricao, valor_padrao, duracao_dias) VALUES
  ('Limpeza Espiritual', 'Limpeza e purificação espiritual', 300.00, 7),
  ('Proteção Espiritual', 'Trabalho de proteção e blindagem', 350.00, 7),
  ('Abertura de Caminhos', 'Trabalho para abertura de caminhos e oportunidades', 400.00, 21),
  ('Trabalho Amoroso', 'Trabalho espiritual voltado ao amor', 450.00, 21);

INSERT OR IGNORE INTO categorias_estoque (nome) VALUES
  ('Velas'),
  ('Ervas'),
  ('Bebidas'),
  ('Materiais Gerais'),
  ('Incensos'),
  ('Flores');

INSERT OR IGNORE INTO configuracoes (chave, valor, descricao) VALUES
  ('nome_templo', 'Templo Aláfia', 'Nome do templo/casa espiritual'),
  ('nome_admin', 'Administrador', 'Nome da administradora'),
  ('whatsapp_numero', '', 'Número WhatsApp do templo'),
  ('instagram_perfil', '', 'Perfil do Instagram'),
  ('cor_primaria', '#f80707', 'Cor primária do sistema');

-- Admin padrão (senha: alafia123 - hash bcrypt simulado)
INSERT OR IGNORE INTO usuarios (nome, email, senha_hash, perfil, nome_templo) VALUES
  ('Administrador Aláfia', 'admin@alafia.com', 'alafia123', 'admin', 'Templo Aláfia');
