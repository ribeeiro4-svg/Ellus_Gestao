
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTenantId } from '@/lib/hooks/useTenantId';
import { NFSeEntrada } from '@/lib/types/nfse';
import { getNFSeListAction } from '../actions/nfseActions';

export function useNFSe() {
  const [nfses, setNfses] = useState<NFSeEntrada[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const tenantId = useTenantId();

  const fetchNfses = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const { data, error } = await getNFSeListAction(tenantId, periodo);
      
      if (!error && data) {
        setNfses(data as any);
      }
    } finally {
      setLoading(false);
    }
  }, [tenantId, periodo]);

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

  return { 
    nfses, 
    loading, 
    stats, 
    refresh: fetchNfses, 
    periodo, 
    setPeriodo 
  };
}
