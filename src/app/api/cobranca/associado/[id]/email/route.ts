import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabase } from '@/lib/supabase/server';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getTenantAndUser(): Promise<{ tenantId: string; userId: string | null }> {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { tenantId: '971f92af-a72b-4bc4-a8e0-333d712ce6a7', userId: null };

    const admin = getAdminClient();
    const { data } = await admin
      .from('usuarios')
      .select('tenant_id')
      .eq('id', user.id)
      .maybeSingle();

    return {
      tenantId: data?.tenant_id ?? '971f92af-a72b-4bc4-a8e0-333d712ce6a7',
      userId: user.id,
    };
  } catch {
    return { tenantId: '971f92af-a72b-4bc4-a8e0-333d712ce6a7', userId: null };
  }
}

function buildEmailHtml(params: {
  nomeAssociado: string;
  texto: string;
  nomeAssociacao: string;
  contatoTesouraria: string;
  nomeTesoureiro: string;
}): string {
  // Converte quebras de linha do texto em parágrafos HTML
  const paragrafos = params.texto
    .split(/\n\n|\n/)
    .filter(p => p.trim())
    .map(p => `<p style="margin: 0 0 14px 0; color: #374151; line-height: 1.7;">${p.trim()}</p>`)
    .join('');

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background:#f5f7fc; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fc; padding: 32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px; background:#ffffff; border-radius:20px; overflow:hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <tr>
          <td style="background: linear-gradient(135deg, #071a12 0%, #0e2d22 100%); padding: 32px 40px;">
            <h1 style="margin:0; color:#ffffff; font-size:22px; font-weight:800; letter-spacing:-0.5px;">${params.nomeAssociacao}</h1>
            <p style="margin:6px 0 0; color:#34d399; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase;">Departamento de Tesouraria</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding: 36px 40px;">
            ${paragrafos}
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="padding: 0 40px;"><hr style="border:none; border-top:1px solid #e5e7eb; margin:0;" /></td></tr>

        <!-- Footer -->
        <tr>
          <td style="padding: 24px 40px 32px; background:#f9fafb; border-radius:0 0 20px 20px;">
            <p style="margin:0; color:#6b7280; font-size:12px; line-height:1.6;">
              Este é um e-mail oficial de <strong style="color:#0e2d22;">${params.nomeAssociacao}</strong>.<br/>
              ${params.nomeTesoureiro ? `Tesoureiro(a): <strong>${params.nomeTesoureiro}</strong>` : ''}
              ${params.contatoTesouraria ? ` · Contato: <strong>${params.contatoTesouraria}</strong>` : ''}
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { tenantId, userId } = await getTenantAndUser();
  const admin = getAdminClient();
  const body = await request.json();
  const { texto, assunto, etapa, diasAtraso, valorMomento } = body;

  if (!texto || !assunto) {
    return NextResponse.json({ error: 'Texto e assunto são obrigatórios' }, { status: 400 });
  }

  // Busca dados do associado
  const { data: associado } = await admin
    .from('associados')
    .select('nome, email')
    .eq('id', params.id)
    .single();

  if (!associado?.email) {
    return NextResponse.json({ error: 'Associado não possui e-mail cadastrado' }, { status: 400 });
  }

  // Busca configuração da associação
  const { data: config } = await admin
    .from('cobranca_configuracoes')
    .select('nome_associacao, contato_tesouraria, nome_tesoureiro')
    .eq('tenant_id', tenantId)
    .limit(1)
    .maybeSingle();

  const nomeAssociacao = config?.nome_associacao || 'ACPROBEC';

  // Monta o HTML do e-mail
  const htmlContent = buildEmailHtml({
    nomeAssociado: associado.nome,
    texto,
    nomeAssociacao,
    contatoTesouraria: config?.contato_tesouraria || '',
    nomeTesoureiro: config?.nome_tesoureiro || '',
  });

  // Verifica se a chave do Resend está configurada
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY não configurada no ambiente' }, { status: 500 });
  }

  // Envia via Resend
  const { Resend } = await import('resend');
  const resend = new Resend(resendApiKey);

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  const { error: sendError } = await resend.emails.send({
    from: `${nomeAssociacao} <${fromEmail}>`,
    to: associado.email,
    subject: assunto,
    html: htmlContent,
  });

  if (sendError) {
    console.error('[EMAIL] Erro ao enviar:', sendError);
    return NextResponse.json({ error: 'Erro ao enviar e-mail: ' + (sendError as any).message }, { status: 500 });
  }

  // Registra a ação no histórico
  await admin.from('cobranca_acoes').insert({
    associado_id: params.id,
    etapa,
    canal: 'email',
    texto_enviado: texto,
    observacao: `E-mail enviado para: ${associado.email}`,
    realizado_por: userId ?? '00000000-0000-0000-0000-000000000000',
    dias_atraso_momento: diasAtraso,
    valor_momento: valorMomento,
    tenant_id: tenantId,
  });

  return NextResponse.json({ success: true, sentTo: associado.email });
}
