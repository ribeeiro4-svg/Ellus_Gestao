'use client';
import React, { useEffect, useState } from 'react';

export default function CobrancaStatusCell({ associadoId }: { associadoId: string }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!associadoId) return;
    let isMounted = true;
    fetch(`/api/cobranca/associado/${associadoId}/resumo`)
      .then(res => res.json())
      .then(res => {
        if (isMounted) setData(res);
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [associadoId]);

  if (!data) return <div className="text-[9px] text-slate-300 animate-pulse">Carregando...</div>;

  return (
    <div className="flex flex-col gap-1 w-32">
      <div className="text-[9px] font-black uppercase text-slate-400 truncate" title={data.ultimaAcao?.etapa || 'Nenhuma'}>
        Última: <span className="text-emerald-600">{data.ultimaAcao?.etapa ? data.ultimaAcao.etapa.replace('_', ' ') : 'Nenhuma'}</span>
      </div>
      <div className="text-[9px] font-black uppercase text-slate-400 truncate" title={data.proximaEtapa?.label || '-'}>
        Próxima: <span className="text-orange-500">{data.proximaEtapa?.label || '-'}</span>
      </div>
    </div>
  );
}
