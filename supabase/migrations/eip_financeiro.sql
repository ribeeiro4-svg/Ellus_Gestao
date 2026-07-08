-- ============================================================
-- EIP: Financeiro - RPCs (Stored Procedures)
-- ============================================================

-- 1. Fluxo de Caixa Consolidado Diário
CREATE OR REPLACE FUNCTION eip_fluxo_caixa_consolidado(
  p_tenant_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_status TEXT DEFAULT 'pago'
)
RETURNS TABLE (
  data_ref DATE,
  total_receita NUMERIC,
  total_despesa NUMERIC,
  saldo_dia NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH datas AS (
    SELECT generate_series(p_start_date, p_end_date, '1 day'::interval)::DATE AS d
  ),
  valores AS (
    SELECT 
      l.data,
      SUM(CASE WHEN l.tipo = 'receita' THEN l.valor ELSE 0 END) AS receita,
      SUM(CASE WHEN l.tipo = 'despesa' THEN l.valor ELSE 0 END) AS despesa
    FROM lancamentos l
    WHERE l.tenant_id = p_tenant_id
      AND l.data >= p_start_date
      AND l.data <= p_end_date
      AND (p_status IS NULL OR l.status = p_status)
    GROUP BY l.data
  )
  SELECT 
    dt.d AS data_ref,
    COALESCE(v.receita, 0) AS total_receita,
    COALESCE(v.despesa, 0) AS total_despesa,
    COALESCE(v.receita, 0) - COALESCE(v.despesa, 0) AS saldo_dia
  FROM datas dt
  LEFT JOIN valores v ON v.data = dt.d
  ORDER BY dt.d;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Receitas por Categoria
CREATE OR REPLACE FUNCTION eip_receitas_categoria(
  p_tenant_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_status TEXT DEFAULT 'pago'
)
RETURNS TABLE (
  nome_categoria TEXT,
  total_faturado NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.categoria AS nome_categoria,
    SUM(l.valor) AS total_faturado
  FROM lancamentos l
  WHERE l.tenant_id = p_tenant_id
    AND l.tipo = 'receita'
    AND l.data >= p_start_date
    AND l.data <= p_end_date
    AND (p_status IS NULL OR l.status = p_status)
  GROUP BY l.categoria
  ORDER BY total_faturado DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. KPIs Financeiros (Mês Atual vs Mês Anterior)
CREATE OR REPLACE FUNCTION eip_kpis_financeiro(
  p_tenant_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_status TEXT DEFAULT 'pago'
)
RETURNS TABLE (
  receita_atual NUMERIC,
  despesa_atual NUMERIC,
  resultado_atual NUMERIC,
  receita_anterior NUMERIC,
  despesa_anterior NUMERIC,
  resultado_anterior NUMERIC
) AS $$
DECLARE
  v_diff INT;
  v_start_prev DATE;
  v_end_prev DATE;
BEGIN
  v_diff := p_end_date - p_start_date;
  v_end_prev := p_start_date - 1;
  v_start_prev := v_end_prev - v_diff;

  RETURN QUERY
  WITH atual AS (
    SELECT 
      COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0) AS r_atual,
      COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0) AS d_atual
    FROM lancamentos
    WHERE tenant_id = p_tenant_id
      AND data >= p_start_date AND data <= p_end_date
      AND (p_status IS NULL OR status = p_status)
  ),
  anterior AS (
    SELECT 
      COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0) AS r_ant,
      COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0) AS d_ant
    FROM lancamentos
    WHERE tenant_id = p_tenant_id
      AND data >= v_start_prev AND data <= v_end_prev
      AND (p_status IS NULL OR status = p_status)
  )
  SELECT 
    a.r_atual AS receita_atual,
    a.d_atual AS despesa_atual,
    (a.r_atual - a.d_atual) AS resultado_atual,
    ant.r_ant AS receita_anterior,
    ant.d_ant AS despesa_anterior,
    (ant.r_ant - ant.d_ant) AS resultado_anterior
  FROM atual a, anterior ant;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
