const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ukfgrjcflhlgeuarxtmt.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZmdyamNmbGhsZ2V1YXJ4dG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI4MDY4MiwiZXhwIjoyMDkxODU2NjgyfQ.1CeLLRhn1vrqzE3GlNZg4sfz2lL4AeAjctfBw69HCWc';

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const names = [
  "Elayne Samili Pereira Silva Dos Santos",
  "Paula Mariza De Jesus Oliveira Evangelista",
  "Helena Yasmin Santos Ferreira",
  "Helber Passos Ferreira",
  "Vani Antunes Barbosa Do Nascimento",
  "Eunice Silva Ramos",
  "Devânio Raimundo Jesus Souza",
  "Elder Rocha De Sousa",
  "Eliete Pereira De Oliveira",
  "Érica Chalane De Souza Granja",
  "Ericles De Oliveira Santos",
  "Joana D'arc Souza Pereira",
  "Fátima Laisa Barbosa Gomes",
  "Isabela Lima Vilanvova",
  "Evani Dos Santos Souza",
  "Jorge Matos Diniz",
  "José Luiz Antônio João Batista Martins Da Silva",
  "Jucynara Alves Soares",
  "Kamilla Alves Da Silva",
  "Keila Amorim",
  "Lara Nunes Marques",
  "Lucas Lopes De Sousa Bezerra",
  "Maria Dalva Vieira De Castro",
  "Paulo José Caxias Bomfim",
  "Ramilda Da Silva Menezes",
  "Raquel Pacheco Da Silva",
  "Débora Vanessa De Brito Nogueira",
  "Daiane Feitosa Da Silva",
  "Cleber Dos Reis Serafim",
  "Flávio Rodrigues Da Silva",
  "Fernanda De Carvalho Araújo",
  "Damaras Da Silva Santos",
  "Izocleide Palha De Amaral",
  "Janardan Alex Rodrigues De Oliveira",
  "Juarez Pereira Gomes",
  "Liziane Maia Miranda De Jesus",
  "Mayane De Souza Santos Lopes",
  "Crislaine Galvao Da Silva",
  "Patrícia Dias Da Silva",
  "Ana Carolinna Santana Brito De Siqueira Barbosa",
  "Adriana Da Silva Santos",
  "Ana Karina De Carvalho Viana",
  "Andréa Araújo Hipólito Ribeiro",
  "Placianne Alves De Souza",
  "Maiara Rocha Do Nascimento No Dia",
  "Thaise Moana Dos Santos Oliveira",
  "Cintia Ramos Barbosa",
  "Brenda De Almeida Dias",
  "Bruna Milícia Ribeiro Santos",
  "Cathianne Rodrigues Oliveira",
  "Renildo Alves Da Silva",
  "Terliano Gaia Cruz",
  "Wilker Araújo De Amorim",
  "Yana Helen Santos De Souza",
  "Arislândia Queiroz De Castro",
  "Andreza Inácio Da Silva",
  "Genilson Valadão De Aguiar Silva Júnior",
  "Arthur Ferraz Bione De Oliveira",
  "Thalyta Gisely Chaves Nunes",
  "Camila Leite Da Paixão Silva",
  "Poliana Carolini De Oliveira",
  "Analia Patricia Ferreira Belém",
  "Ana Claudia Paixão Guimarães",
  "Agda Aline Cavalcanti De Sousa Muniz",
  "Marconi Almino De Lima",
  "Cícero Adson Barbosa Almino De Lima",
  "Anderson Claiton Barbosa Almino De Lima",
  "Maria José Menezes Da Silva",
  "Maiara Rocha Do Nascimento",
  "Leiliane De Souza Santos",
  "Maria Do Socorro Da Silva",
  "Luis Fellipe Melo Neto",
  "Sérgio Modesto De Miranda",
  "Thiara Ferreira Dos Santos",
  "Maria Nelly Nunes Cavalcante",
  "Vitória Berben Sobreira",
  "Jorgina Celina Dos Santos",
  "Érica Sabrina Ferreira Da Silva",
  "Maria Helena Pereira",
  "Caio Willyams Lopes Hermes",
  "Fernanda Caroline Silva Santos",
  "Amanda Freitas",
  "Layra Catarine Costa Da Silva Cavalcante",
  "Flavia Rafaela Rodrigues Dos Santos",
  "Hosana Maia Neves",
  "João Paulo Freire Muniz De Vasconcelos",
  "Ingrid Luana Nascimento Santana",
  "Ana Patricia Gadelha Da Costa Silva",
  "Glaucianne Cavalcante Da Conceição",
  "Kananda Gomes Duarte",
  "Gleiciane Pereira Da Silva",
  "Ângela Maria Vieira Dos Santos",
  "Fernanda Andréia Da Silva",
  "Aurenice Alves Da Silva",
  "Maria Neliane Coelho Gomes",
  "Janaina Teotônio Passos",
  "Carolinne Cavalcante De Carvalho Martins",
  "Marla Mirele Santos Souza Alencar",
  "Natalia Patrícia Silva Lima",
  "Valdecino Alves Rodrigues",
  "Amarildo Ferreira Gomes",
  "Cinthia Rejane Da Silva Pereira Rocha",
  "Beatryce Fernandes De Souza Ribeiro",
  "Erica Da Silva Guedes",
  "Cicera Pereira Calixto",
  "João Pedro De Oliveira Nobre Gabriel De Jesus",
  "Debora Prisciliane Da Silva Souza",
  "Emily Ellen Lima Santos",
  "Elane Alencar Lima Da Silva",
  "Michelly Elen Leal Menezes Torres",
  "Eliana Josefa Sales",
  "Daniela Fernandes Rodrigues",
  "Bruna Ferreira De Souza",
  "Emanuela Messias Da Silva",
  "Débora Nascimento Da Silva Costa",
  "Eduardo Liborio Da Mota",
  "Graziela Feitoza Da Silva",
  "Messias Genelicio De Almeida",
  "Francimar Menezes De Souza",
  "Carla Santos Cardoso",
  "Cândido Augusto Pires Alves Holanda",
  "Stefany Bernardo Dos Santos",
  "Laís Gomes Da Costa Fernandes",
  "Lucas Willian Nunes Da Silva",
  "Micaele Santos Borges De Araújo",
  "Patricia Saldanha Duarte Amorim",
  "Emanuel Tadeu Vieira De Souza",
  "Samira Alves Braga",
  "Amanda Rafaela Pereira Santos De Souza",
  "Gesiane De Oliveira Silva",
  "Anna Karoliny Duarte Cardoso Tavares",
  "Ruamma Granja Bezerra",
  "Patrícia Ferreira Dos Santos Moura",
  "Danila Almeida Freire",
  "José Neves De Freitas"
];

async function main() {
  const uniqueNames = [...new Set(names)];
  const notFound = [];
  const foundPaid = [];
  const foundAtrasado = [];
  const foundNoLancamento = [];
  
  for (const name of uniqueNames) {
    const nomeBusca = name.replace(" No Dia", "").trim();
    const { data: associados } = await sb.from('associados').select('id, nome').ilike('nome', `%${nomeBusca}%`);
    
    if (associados && associados.length > 0) {
      const assoc = associados[0];
      const { data: lancamentos } = await sb.from('lancamentos')
        .select('id, data, status, forma_pagamento')
        .eq('associado_id', assoc.id)
        .gte('data', '2026-03-01')
        .lte('data', '2026-07-31');
        
      const atrasados = lancamentos?.filter(l => l.status === 'atrasado' || l.status === 'pendente') || [];
      const pagos = lancamentos?.filter(l => l.status === 'pago') || [];
      const pix = pagos.filter(l => (l.forma_pagamento || '').toLowerCase().includes('pix'));
      
      if (lancamentos && lancamentos.length > 0) {
        if (pagos.length > 0) {
          foundPaid.push(`- ${name} (Pagos: ${pagos.length}, Pix: ${pix.length}, Detalhes: ${pagos.map(l => `${l.data} ${l.forma_pagamento||''}`).join(', ')})`);
        }
        if (atrasados.length > 0) {
          foundAtrasado.push(`- ${name} (Atrasados/Pendentes: ${atrasados.length}, Detalhes: ${atrasados.map(l => `${l.data} ${l.status}`).join(', ')})`);
        }
        if (pagos.length === 0 && atrasados.length === 0) {
          foundNoLancamento.push(`- ${name}`);
        }
      } else {
        foundNoLancamento.push(`- ${name}`);
      }
    } else {
      notFound.push(`- ${name}`);
    }
  }
  
  console.log('=== NÃO ENCONTRADOS NO SISTEMA ===');
  console.log(notFound.join('\n'));
  
  console.log('\n=== PAGAMENTOS REGISTRADOS ===');
  console.log(foundPaid.join('\n'));
  
  console.log('\n=== CONSTAM COMO ATRASADOS NO SISTEMA ===');
  console.log(foundAtrasado.join('\n'));
  
  console.log('\n=== SEM LANÇAMENTOS NESTE PERÍODO ===');
  console.log(foundNoLancamento.join('\n'));
}
main();
