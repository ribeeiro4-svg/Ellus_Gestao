import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface CoraStagedItem {
  id: string;
  cora_id: string;
  tipo: 'CREDIT' | 'DEBIT';
  valor: number;
  descricao: string;
  data: string;
  documento?: string;
  status: 'pendente' | 'sincronizado' | 'ignorado';
  tenant_id: string;
}

/**
 * Hook para gerenciar as transações da Cora que aguardam conciliação
 */
export function useCoraStaged() {
  const [items, setItems] = useState<CoraStagedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cora_staged')
        .select('*')
        .eq('status', 'pendente')
        .order('data', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error('Erro ao buscar transações Cora:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const syncWithBank = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/cora/sync');
      const data = await response.json();
      await fetchItems();
      return { success: true, new_items: data.items_count || 0 };
    } catch (err) {
      console.error('Erro na sincronização Cora:', err);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: 'sincronizado' | 'ignorado') => {
    const { error } = await supabase
      .from('cora_staged')
      .update({ status })
      .eq('id', id);
    
    if (!error) {
      setItems(prev => prev.filter(i => i.id !== id));
    }
    return { error };
  };

  const updateStatusBulk = async (ids: string[], status: 'sincronizado' | 'ignorado') => {
    const { error } = await supabase
      .from('cora_staged')
      .update({ status })
      .in('id', ids);
    
    if (!error) {
      setItems(prev => prev.filter(i => !ids.includes(i.id)));
    }
    return { error };
  };

  return {
    items,
    loading,
    syncWithBank,
    updateStatus,
    updateStatusBulk,
    refresh: fetchItems
  };
}
