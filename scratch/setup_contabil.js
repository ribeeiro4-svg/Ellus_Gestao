
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = "https://ukfgrjcflhlgeuarxtmt.supabase.co"
const supabaseKey = "sb_publishable_ANxkicVQPt2SxrkjxH35jg_rifD9CGb" // Anon key
const tenantId = '971f92af-a72b-4bc4-a8e0-333d712ce6a7'

const sb = createClient(supabaseUrl, supabaseKey)

const mappings = [
    // Ingressos
    { categoria_nome: 'MENSALIDADES', conta_contabil_codigo: '3.1.1.01.001', conta_contabil_nome: 'Mensalidades de Associados', tipo: 'ingresso' },
    { categoria_nome: 'MENSALIDADE', conta_contabil_codigo: '3.1.1.01.001', conta_contabil_nome: 'Mensalidades de Associados', tipo: 'ingresso' },
    { categoria_nome: 'MENSALIDADE DE ASSOCIADO', conta_contabil_codigo: '3.1.1.01.001', conta_contabil_nome: 'Mensalidades de Associados', tipo: 'ingresso' },
    { categoria_nome: 'ADESÃO', conta_contabil_codigo: '3.1.1.01.002', conta_contabil_nome: 'Taxas de Adesão de Novos Membros', tipo: 'ingresso' },
    
    // Dispêndios com Pessoal (Bolsas e Estagiários)
    { categoria_nome: 'PRÓ-LABORE (DIRETORIA)', conta_contabil_codigo: '4.2.1.01.001', conta_contabil_nome: 'Pró-Labore da Diretoria Executiva', tipo: 'dispendio' },
    { categoria_nome: 'Verba Diretoria / Administrativo', conta_contabil_codigo: '4.2.2.01.013', conta_contabil_nome: 'Outros Dispêndios Administrativos', tipo: 'dispendio' },
    { categoria_nome: 'VERBA DIRETORIA / ADMINISTRATIVO', conta_contabil_codigo: '4.2.2.01.013', conta_contabil_nome: 'Outros Dispêndios Administrativos', tipo: 'dispendio' },
    { categoria_nome: 'BOLSA AUXÍLIO (ESTAGIÁRIO)', conta_contabil_codigo: '4.1.1.01.003', conta_contabil_nome: 'Bolsa-Auxílio (Estagiários)', tipo: 'dispendio' },
    { categoria_nome: '13º BOLSA AUXÍLIO (ESTAGIÁRIO)', conta_contabil_codigo: '4.1.1.01.003', conta_contabil_nome: 'Bolsa-Auxílio (Estagiários)', tipo: 'dispendio' },
    { categoria_nome: '13° BOLSA AUXÍLIO (ESTAGIÁRIO)', conta_contabil_codigo: '4.1.1.01.003', conta_contabil_nome: 'Bolsa-Auxílio (Estagiários)', tipo: 'dispendio' },
    { categoria_nome: 'AUXÍLIOS ESTAGIÁRIO', conta_contabil_codigo: '4.1.1.01.004', conta_contabil_nome: 'Auxílio Transporte e Benefícios (Estagiários)', tipo: 'dispendio' },
    { categoria_nome: 'FÉRIAS REMUNERADAS (ESTAGIÁRIO)', conta_contabil_codigo: '4.1.1.01.003', conta_contabil_nome: 'Bolsa-Auxílio (Estagiários)', tipo: 'dispendio' },
    { categoria_nome: 'ESTAGIÁRIO - FUNDO DE RESERVA (FÉRIAS E 13º AUXÍLIO)', conta_contabil_codigo: '4.1.1.01.003', conta_contabil_nome: 'Bolsa-Auxílio (Estagiários)', tipo: 'dispendio' },
    { categoria_nome: 'ESTAGIÁRIO – FUNDO DE RESERVA (FÉRIAS E 13º AUXÍLIO)', conta_contabil_codigo: '4.1.1.01.003', conta_contabil_nome: 'Bolsa-Auxílio (Estagiários)', tipo: 'dispendio' },
    { categoria_nome: 'IMPOSTOS TRABALHISTAS', conta_contabil_codigo: '4.1.1.01.002', conta_contabil_nome: 'Encargos Sociais s/ Folha — Ativ. Fim', tipo: 'dispendio' },
    
    // Manutenção e Serviços
    { categoria_nome: 'CONTABILIDADE/JURÍDICO', conta_contabil_codigo: '4.2.2.01.008', conta_contabil_nome: 'Assessoria Contábil e Jurídica', tipo: 'dispendio' },
    { categoria_nome: 'CONTABILIDADE', conta_contabil_codigo: '4.2.2.01.008', conta_contabil_nome: 'Assessoria Contábil e Jurídica', tipo: 'dispendio' },
    { categoria_nome: 'JURÍDICO', conta_contabil_codigo: '4.2.2.01.008', conta_contabil_nome: 'Assessoria Contábil e Jurídica', tipo: 'dispendio' },
    { categoria_nome: 'SERVIÇOS CONTRATADOS PJ', conta_contabil_codigo: '4.2.2.01.007', conta_contabil_nome: 'Serviços de Terceiros - Pessoa Jurídica', tipo: 'dispendio' },
    { categoria_nome: 'SERVIÇOS TOMADOS', conta_contabil_codigo: '4.2.2.01.007', conta_contabil_nome: 'Serviços de Terceiros - Pessoa Jurídica', tipo: 'dispendio' },
    { categoria_nome: 'SOFTWARE OPERACIONAL', conta_contabil_codigo: '4.2.2.01.006', conta_contabil_nome: 'Manutenção de Sistemas e Software', tipo: 'dispendio' },
    { categoria_nome: 'PLANO PRÓ DE GESTÃO NO APP', conta_contabil_codigo: '4.2.2.01.006', conta_contabil_nome: 'Manutenção de Sistemas e Software', tipo: 'dispendio' },
    { categoria_nome: 'SERVIÇOS DE DESENVOLVIMENTO DE SOLUÇÕES (SAAS)', conta_contabil_codigo: '4.2.2.01.006', conta_contabil_nome: 'Manutenção de Sistemas e Software', tipo: 'dispendio' },
    { categoria_nome: 'INTERNET (WI-FI)', conta_contabil_codigo: '4.2.2.01.003', conta_contabil_nome: 'Serviços de Telecomunicações', tipo: 'dispendio' },
    { categoria_nome: 'INTERNET', conta_contabil_codigo: '4.2.2.01.003', conta_contabil_nome: 'Serviços de Telecomunicações', tipo: 'dispendio' },
    { categoria_nome: 'INFRAESTRUTURA', conta_contabil_codigo: '4.2.2.01.011', conta_contabil_nome: 'Manutenção de Infraestrutura e Reparos', tipo: 'dispendio' },
    { categoria_nome: 'ALUGUEL', conta_contabil_codigo: '4.2.2.01.002', conta_contabil_nome: 'Aluguéis e Arrendamentos', tipo: 'dispendio' },
    { categoria_nome: 'ENERGIA ELÉTRICA', conta_contabil_codigo: '4.2.2.01.001', conta_contabil_nome: 'Energia Elétrica', tipo: 'dispendio' },
    { categoria_nome: 'ÁGUA E ESGOTO', conta_contabil_codigo: '4.2.2.01.001', conta_contabil_nome: 'Água e Esgoto', tipo: 'dispendio' },
    { categoria_nome: 'TELEFONE', conta_contabil_codigo: '4.2.2.01.003', conta_contabil_nome: 'Serviços de Telecomunicações', tipo: 'dispendio' },
    { categoria_nome: 'MARKETING E PUBLICIDADE', conta_contabil_codigo: '4.2.2.01.010', conta_contabil_nome: 'Publicidade e Propaganda', tipo: 'dispendio' },
    
    // Materiais e Outros
    { categoria_nome: 'ARTIGOS DE GRÁFICA', conta_contabil_codigo: '4.2.2.01.009', conta_contabil_nome: 'Despesas com Gráfica e Impressos', tipo: 'dispendio' },
    { categoria_nome: 'MATERIAIS DE ESCRITÓRIO', conta_contabil_codigo: '4.2.2.01.004', conta_contabil_nome: 'Materiais de Escritório e Expediente', tipo: 'dispendio' },
    { categoria_nome: 'MATERIAIS DE ESCRITÓRIO (PAPELARIA)', conta_contabil_codigo: '4.2.2.01.004', conta_contabil_nome: 'Materiais de Escritório e Expediente', tipo: 'dispendio' },
    { categoria_nome: 'MATERIAIS USO E CONSUMO DA SEDE', conta_contabil_codigo: '4.2.2.01.005', conta_contabil_nome: 'Materiais de Limpeza e Consumo da Sede', tipo: 'dispendio' },
    { categoria_nome: 'USO E CONSUMO', conta_contabil_codigo: '4.2.2.01.005', conta_contabil_nome: 'Materiais de Limpeza e Consumo da Sede', tipo: 'dispendio' },
    { categoria_nome: 'SUPRIMENTOS', conta_contabil_codigo: '4.2.2.01.005', conta_contabil_nome: 'Materiais de Limpeza e Consumo da Sede', tipo: 'dispendio' },
    { categoria_nome: 'RESERVA DE EMERGÊNCIA', conta_contabil_codigo: '1.1.1.03.001', conta_contabil_nome: 'Aplicações de Liquidez Imediata', tipo: 'dispendio' },
    { categoria_nome: 'EMPRÉSTIMOS (DIRETORIA)', conta_contabil_codigo: '1.1.2.02.001', conta_contabil_nome: 'Adiantamentos a Empregados', tipo: 'dispendio' },
    { categoria_nome: 'TAXAS BANCÁRIAS', conta_contabil_codigo: '4.2.2.01.012', conta_contabil_nome: 'Taxas e Tarifas Bancárias', tipo: 'dispendio' },
    { categoria_nome: 'TARIFAS BANCÁRIAS', conta_contabil_codigo: '4.2.2.01.012', conta_contabil_nome: 'Taxas e Tarifas Bancárias', tipo: 'dispendio' },
    { categoria_nome: 'VIAGENS E HOSPEDAGENS', conta_contabil_codigo: '4.2.2.01.013', conta_contabil_nome: 'Outros Dispêndios Administrativos', tipo: 'dispendio' },
    { categoria_nome: 'ALIMENTAÇÃO', conta_contabil_codigo: '4.1.1.01.004', conta_contabil_nome: 'Benefícios e Auxílios a Empregados', tipo: 'dispendio' },
    { categoria_nome: 'IMPOSTOS E TAXAS', conta_contabil_codigo: '4.2.2.01.013', conta_contabil_nome: 'Outros Dispêndios Administrativos', tipo: 'dispendio' },
    { categoria_nome: 'OUTROS', conta_contabil_codigo: '4.2.2.01.013', conta_contabil_nome: 'Outros Dispêndios Administrativos', tipo: 'dispendio' },
    { categoria_nome: 'TRANSPORTE', conta_contabil_codigo: '4.1.1.01.004', conta_contabil_nome: 'Benefícios e Auxílios a Empregados', tipo: 'dispendio' },
    { categoria_nome: 'TROCO', conta_contabil_codigo: '1.1.1.01.001', conta_contabil_nome: 'Caixa Geral', tipo: 'dispendio' },
];

async function setup() {
    console.log("Seeding configuracoes_contabeis...");
    const records = mappings.map(m => ({
        tenant_id: tenantId,
        ...m,
        updated_at: new Date().toISOString()
    }));

    const { error: seedError } = await sb
        .from('configuracoes_contabeis')
        .upsert(records, { onConflict: 'tenant_id,categoria_nome' });

    if (seedError) {
        console.error("Error seeding mappings:", seedError);
    } else {
        console.log("Mappings seeded successfully!");
    }

    console.log("\nFixing fornecedores accounts...");
    const { data: fornecedores } = await sb.from('fornecedores').select('id, nome').eq('tenant_id', tenantId).is('conta_contabil_id', null);
    
    if (!fornecedores || fornecedores.length === 0) {
        console.log("No vendors without account found.");
    } else {
        console.log(`Found ${fornecedores.length} vendors without account.`);
        for (const f of fornecedores) {
            const { data: ultimasContas } = await sb.from('plano_contas')
                .select('codigo')
                .eq('tenant_id', tenantId)
                .like('codigo', '2.1.3.01.%')
                .order('codigo', { ascending: false })
                .limit(1);

            let novoCodigo = '2.1.3.01.100';
            if (ultimasContas && ultimasContas.length > 0) {
                const ultimo = ultimasContas[0].codigo;
                const partes = ultimo.split('.');
                const sequencial = parseInt(partes[partes.length - 1], 10);
                if (!isNaN(sequencial) && sequencial >= 100) {
                    novoCodigo = `2.1.3.01.${String(sequencial + 1).padStart(3, '0')}`;
                }
            }

            const { data: pai } = await sb.from('plano_contas').select('id').eq('tenant_id', tenantId).eq('codigo', '2.1.3.01').single();

            const { data: novaConta, error: accError } = await sb.from('plano_contas').insert({
                tenant_id: tenantId,
                codigo: novoCodigo,
                descricao: `Fornecedor: ${f.nome}`,
                nivel: 5,
                tipo: 'analitica',
                natureza: 'credora',
                classificacao: 'passivo',
                aceita_lancamentos: true,
                ativa: true,
                conta_pai_id: pai?.id || null
            }).select('id').single();

            if (accError) {
                console.error(`Error creating account for ${f.nome}:`, accError);
            } else if (novaConta) {
                const { error: updError } = await sb.from('fornecedores').update({ conta_contabil_id: novaConta.id }).eq('id', f.id);
                if (updError) {
                    console.error(`Error linking account for ${f.nome}:`, updError);
                } else {
                    console.log(`Created and linked account ${novoCodigo} for ${f.nome}`);
                }
            }
        }
    }
}

setup();
