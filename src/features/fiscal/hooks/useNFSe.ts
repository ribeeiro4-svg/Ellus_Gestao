
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTenantId } from '@/lib/hooks/useTenantId';
import { NFSeEntrada } from '@/lib/types/nfse';

export function useNFSe() {
  const [nfses, setNfses] = useState<NFSeEntrada[]>([]);
  const [loading, setLoading] = useState(true);
  const tenantId = useTenantId();
  const sb = createClient();

  const fetchNfses = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const { data, error } = await sb
        .from('nfse_entradas')
        .select('*, prestador:fornecedores(nome, cpf_cnpj)')
        .eq('tenant_id', tenantId)
        .order('data_emissao', { ascending: false });
      
      if (!error && data) {
        setNfses(data);
      }
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  const stats = {
    total: nfses.length,
    pendentes: nfses.filter(n => n.status_escrituracao === 'pendente').length,
    concluidas: nfses.filter(n => n.status_escrituracao === 'concluida').length,
    valorTotal: nfses.reduce((acc, n) => acc + Number(n.valor_bruto || 0), 0),
    valorRetencoes: nfses.reduce((acc, n) => acc + Number(n.valor_irrf || 0) + Number(n.valor_pcc_total || 0) + (n.iss_retido ? Number(n.valor_iss || 0) : 0), 0)
  };

  useEffect(() => {
    fetchNfses();
  }, [fetchNfses]);

  return { nfses, loading, stats, refresh: fetchNfses };
}
