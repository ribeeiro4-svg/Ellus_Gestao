import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabase } from '@/lib/supabase/server';
import { calcularDiasAtraso, calcularTotalAtualizado, determinarProximaEtapa } from '@/features/cobranca/utils/cobrancaUtils';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getTenantId(): Promise<string> {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return '971f92af-a72b-4bc4-a8e0-333d712ce6a7';

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

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const tenantId = await getTenantId();
  const admin = getAdminClient();
  const associadoId = params.id;

  const { searchParams } = new URL(request.url);
  const lancsParam = searchParams.get('lancs');

  let queryLancamentos = admin
    .from('lancamentos')
    .select('*')
    .eq('associado_id', associadoId);

  if (lancsParam) {
    queryLancamentos = queryLancamentos.in('id', lancsParam.split(','));
  } else {
    queryLancamentos = queryLancamentos
      .or('status.ilike.%pendente%,status.ilike.%aberto%,status.ilike.%atrasado%')
      .ilike('tipo', '%receita%');
  }

  const [{ data: config }, { data: associado }, { data: lancamentos }, { data: ultimaAcaoArr }] = await Promise.all([
    admin.from('cobranca_configuracoes').select('*').eq('tenant_id', tenantId).limit(1).maybeSingle(),
    admin.from('associados').select('telefone, nome, suspensao_data, suspensao_motivo').eq('id', associadoId).maybeSingle(),
    queryLancamentos.order('data', { ascending: true }),
    admin
      .from('cobranca_acoes')
      .select('*')
      .eq('associado_id', associadoId)
      .eq('tenant_id', tenantId)
      .order('realizado_em', { ascending: false })
      .limit(1),
  ]);

  const lancamentosAtrasados = (lancamentos || []).filter(l => {
    if (!l.data) return false;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const venc = new Date(l.data);
    venc.setHours(0, 0, 0, 0);
    return venc < hoje;
  });

  const oldest = lancamentosAtrasados[0];
  const diasAtraso = oldest ? calcularDiasAtraso(oldest.data) : 0;
  const totalOriginal = lancamentosAtrasados.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);

  const multaPerc = config?.multa_moratoria_perc || 2;
  const jurosPerc = config?.juros_mora_mensal_perc || 1;
  const diasParaSuspensao = config?.dias_para_suspensao || 90;

  const totalCalculado = calcularTotalAtualizado(totalOriginal, diasAtraso, multaPerc, jurosPerc);
  const proximaEtapa = determinarProximaEtapa(diasAtraso, diasParaSuspensao);

  return NextResponse.json({
    diasAtraso,
    totalOriginal,
    totalAtualizado: totalCalculado,
    proximaEtapa,
    ultimaAcao: ultimaAcaoArr?.[0] || null,
    statusSuspensao: diasAtraso >= diasParaSuspensao,
    suspensaoData: associado?.suspensao_data || null,
    suspensaoMotivo: associado?.suspensao_motivo || null,
    telefone: associado?.telefone || null,
  });
}
