import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabase } from '@/lib/supabase/server';
import { gerarTextoMensagem, calcularDiasAtraso, calcularTotalAtualizado, calcularDataSuspensao, calcularDiasRestantes } from '@/features/cobranca/utils/cobrancaUtils';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getTenantId(): Promise<string | null> {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const admin = getAdminClient();
    const { data } = await admin
      .from('usuarios')
      .select('tenant_id')
      .eq('id', user.id)
      .maybeSingle();

    return data?.tenant_id ?? '971f92af-a72b-4bc4-a8e0-333d712ce6a7';
  } catch {
    return '971f92af-a72b-4bc4-a8e0-333d712ce6a7';
  }
}

// O segmento [etapa] agora aceita o código do template (ex: 2A, 3B) ou o nome da etapa
export async function GET(
  request: Request,
  { params }: { params: { id: string; etapa: string } }
) {
  const tenantId = await getTenantId();
  if (!tenantId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const admin = getAdminClient();
  const codigo = params.etapa; // ex: "2A"

  // Busca a configuração
  const { data: config } = await admin
    .from('cobranca_configuracoes')
    .select('*')
    .eq('tenant_id', tenantId)
    .limit(1)
    .single();

  // Busca o template pelo código OU pela etapa (fallback)
  const { data: templateByCodigo } = await admin
    .from('cobranca_templates')
    .select('texto, titulo')
    .eq('tenant_id', tenantId)
    .eq('codigo', codigo)
    .maybeSingle();

  let templateTexto = templateByCodigo?.texto;

  // Fallback: busca por nome de etapa se não achou pelo código
  if (!templateTexto) {
    const { data: templateByEtapa } = await admin
      .from('cobranca_templates')
      .select('texto, titulo')
      .eq('tenant_id', tenantId)
      .eq('etapa', codigo)
      .limit(1)
      .maybeSingle();
    templateTexto = templateByEtapa?.texto;
  }

  if (!templateTexto) {
    return NextResponse.json({ texto: '[Template não encontrado. Edite manualmente.]' });
  }

  // Busca os dados do associado
  const { data: associado } = await admin
    .from('associados')
    .select('*')
    .eq('id', params.id)
    .single();

  // Busca os lançamentos em aberto
  const { data: lancamentos } = await admin
    .from('lancamentos')
    .select('*')
    .eq('associado_id', params.id)
    .or('status.ilike.pendente,status.ilike.em aberto,status.ilike.atrasado')
    .eq('tipo', 'Receita')
    .order('data', { ascending: true });

  const hoje = new Date();
  const lancamentosAtrasados = (lancamentos || []).filter(l => {
    const venc = new Date(l.data_vencimento || l.data);
    return venc < hoje;
  });

  const oldest = lancamentosAtrasados[0];
  const diasAtraso = oldest ? calcularDiasAtraso(oldest.data_vencimento || oldest.data) : 0;
  const totalOriginal = lancamentosAtrasados.reduce((acc, l) => acc + (Number(l.valor) || 0), 0);

  const multaPerc = config?.multa_moratoria_perc || 2;
  const jurosPerc = config?.juros_mora_mensal_perc || 1;
  const diasParaSuspensao = config?.dias_para_suspensao || 90;

  const calculado = calcularTotalAtualizado(totalOriginal, diasAtraso, multaPerc, jurosPerc);
  const diasRestantes = calcularDiasRestantes(diasAtraso, diasParaSuspensao);
  const dataSuspensao = oldest ? calcularDataSuspensao(oldest.data_vencimento || oldest.data, diasParaSuspensao) : '';

  // Formata os meses em aberto como lista legível
  const mesesAbertos = lancamentosAtrasados.map(l => {
    const d = new Date(l.data_vencimento || l.data);
    return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }).join(', ');

  const primeiroVenc = oldest
    ? new Date(oldest.data_vencimento || oldest.data).toLocaleDateString('pt-BR')
    : '';

  const nome = associado?.nome || 'Associado';
  const nomeParts = nome.split(' ');
  const primeiroNome = nomeParts[0];

  const textoGerado = gerarTextoMensagem(templateTexto, {
    nome: primeiroNome,
    nome_completo: nome,
    mes_ano: oldest
      ? new Date(oldest.data_vencimento || oldest.data).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      : '',
    meses_abertos: mesesAbertos,
    qtd_mensalidades: lancamentosAtrasados.length,
    valor_original: totalOriginal,
    valor_multa: calculado.multa,
    valor_juros: calculado.juros,
    valor_total: calculado.total,
    dias_atraso: diasAtraso,
    dias_restantes: diasRestantes,
    data_suspensao: dataSuspensao,
    data_vencimento: primeiroVenc,
    nome_associacao: config?.nome_associacao || 'ACPROBEC',
    contato_tesouraria: config?.contato_tesouraria || '',
    nome_tesoureiro: config?.nome_tesoureiro || 'Tesoureiro(a)',
    cidade: config?.cidade || '',
    matricula: associado?.matricula ? `#${associado.matricula}` : '',
    // legado
    mesAno: mesesAbertos,
    valorOriginal: totalOriginal,
    valorAtualizado: calculado.total,
    multa: calculado.multa,
    juros: calculado.juros,
    diasAtraso,
    diasParaSuspensao,
    contatoTesouraria: config?.contato_tesouraria || '',
    nomeAssociacao: config?.nome_associacao || 'ACPROBEC',
    multa_perc: multaPerc,
    juros_perc: jurosPerc,
  });

  return NextResponse.json({ texto: textoGerado });
}
