-- Perfis de acesso
CREATE TABLE perfis (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Permissões por perfil e módulo
CREATE TABLE perfil_permissoes (
  id SERIAL PRIMARY KEY,
  perfil_id INTEGER REFERENCES perfis(id) ON DELETE CASCADE,
  modulo VARCHAR(100) NOT NULL,
  pode_ver BOOLEAN DEFAULT FALSE,
  pode_criar BOOLEAN DEFAULT FALSE,
  pode_editar BOOLEAN DEFAULT FALSE,
  pode_excluir BOOLEAN DEFAULT FALSE
);

-- Colaboradores (usuários internos)
CREATE TABLE colaboradores (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  perfil_id INTEGER REFERENCES perfis(id),
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo','inativo')),
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Log de auditoria
CREATE TABLE auditoria_acessos (
  id SERIAL PRIMARY KEY,
  colaborador_id INTEGER REFERENCES colaboradores(id),
  acao VARCHAR(255) NOT NULL,
  modulo VARCHAR(100),
  ip VARCHAR(50),
  timestamp TIMESTAMP DEFAULT NOW()
);

INSERT INTO perfis (nome, descricao) VALUES
  ('Administrador', 'Acesso total ao sistema'),
  ('Tesoureiro', 'Financeiro e cobranças'),
  ('Secretário', 'Cadastros e comunicações'),
  ('Operador', 'Somente consulta');

-- Administrador: tudo liberado
INSERT INTO perfil_permissoes (perfil_id, modulo, pode_ver, pode_criar, pode_editar, pode_excluir)
SELECT 1, modulo, true, true, true, true
FROM unnest(ARRAY['socios','financeiro','cobrancas','plano_saude','relatorios','configuracoes']) AS modulo;

-- Tesoureiro: financeiro/cobranças/relatórios com criar+editar; resto só ver
INSERT INTO perfil_permissoes (perfil_id, modulo, pode_ver, pode_criar, pode_editar, pode_excluir) VALUES
  (2,'socios',true,false,false,false),
  (2,'financeiro',true,true,true,false),
  (2,'cobrancas',true,true,true,false),
  (2,'plano_saude',true,false,false,false),
  (2,'relatorios',true,true,false,false),
  (2,'configuracoes',false,false,false,false);

-- Secretário: sócios com criar+editar; resto só ver
INSERT INTO perfil_permissoes (perfil_id, modulo, pode_ver, pode_criar, pode_editar, pode_excluir) VALUES
  (3,'socios',true,true,true,false),
  (3,'financeiro',true,false,false,false),
  (3,'cobrancas',true,false,false,false),
  (3,'plano_saude',true,false,false,false),
  (3,'relatorios',true,false,false,false),
  (3,'configuracoes',false,false,false,false);

-- Operador: apenas ver em tudo exceto configurações
INSERT INTO perfil_permissoes (perfil_id, modulo, pode_ver, pode_criar, pode_editar, pode_excluir)
SELECT 4, modulo, true, false, false, false
FROM unnest(ARRAY['socios','financeiro','cobrancas','plano_saude','relatorios']) AS modulo;
