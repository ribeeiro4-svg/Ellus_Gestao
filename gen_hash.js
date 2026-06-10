const bcrypt = require('bcryptjs')

async function run() {
  const salt = await bcrypt.genSalt(12)
  const hash = await bcrypt.hash('senha123', salt)
  console.log(`
INSERT INTO colaboradores (nome, email, senha_hash, perfil_id, status) 
VALUES ('Administrador Mestre', 'admin@acprobec.org', '${hash}', 1, 'ativo');
  `)
}
run()
