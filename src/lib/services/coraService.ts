import https from 'https';

/**
 * Interface para os lançamentos que vêm da Cora
 */
export interface CoraTransaction {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  transactedAt: string;
  counterParty?: {
    name: string;
    identity?: string; // CPF/CNPJ
  };
}

/**
 * Serviço central de integração com a API Cora (Versão Nativa sem Axios)
 */
export class CoraService {
  private static AUTH_HOST = 'matls-auth.cora.com.br';
  private static API_HOST = 'api.cora.com.br';
  private static clientId = process.env.CORA_CLIENTE_ID || 'int-3sBr4azofg364myXzNx6H9';
  private static _lastDiag: string = '';
  
  private static getCertConfig() {
    const cert = process.env.CORA_CERT;
    const key = process.env.CORA_KEY;

    if (!cert || !key) {
      throw new Error('Certificações Cora não encontradas em variáveis de ambiente.');
    }

    // Função auxiliar para normalizar certificados vindos do Vercel
    const normalizePEM = (pem: string, type: 'cert' | 'key') => {
      if (!pem) return { pem: Buffer.from(''), debug: 'VAZIO' };
      
      // 1. Decodifica entidades HTML e limpa aspas
      let cleaned = pem
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();

      if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
        cleaned = cleaned.substring(1, cleaned.length - 1);
      }

      // Removemos quebras de linha e espaços para expor o bloco Base64 puro
      cleaned = cleaned.replace(/\\n/g, '').replace(/\r/g, '').replace(/\n/g, '').replace(/\s/g, '');
      
      // 4. EXTRATOR CIRÚRGICO: Localiza o maior bloco contínuo de caracteres Base64
      const matches = cleaned.match(/[A-Za-z0-9+/=]{100,}/g);
      let base64Content = (matches || []).sort((a, b) => b.length - a.length)[0] || '';

      const rawLen = base64Content.length;

      // 5. CORREÇÃO DE TAMANHO (Múltiplo de 4): Essencial para evitar "bad base64 decode"
      // Se o tamanho não for divisível por 4 (como o 1937 encontrado), removemos o excesso.
      if (base64Content.length % 4 !== 0) {
        base64Content = base64Content.substring(0, base64Content.length - (base64Content.length % 4));
      }

      // Se houver padding (== ou =), garantimos que nada venha depois
      if (base64Content.includes('=')) {
        base64Content = base64Content.substring(0, base64Content.indexOf('='));
        // Re-adicionamos o padding necessário após a limpeza
        while (base64Content.length % 4 !== 0) base64Content += '=';
      }

      let label = type === 'cert' ? 'CERTIFICATE' : 'RSA PRIVATE KEY';
      if (type === 'key' && cleaned.toUpperCase().includes('BEGIN PRIVATE KEY') && !cleaned.toUpperCase().includes('RSA')) {
        label = 'PRIVATE KEY';
      }

      const finalPem = `-----BEGIN ${label}-----\n${base64Content}\n-----END ${label}-----`;

      return { 
        pem: Buffer.from(finalPem, 'utf-8'), 
        debug: `[${type.toUpperCase()}: ${base64Content.length}b (era ${rawLen}), final: ...${base64Content.substring(base64Content.length - 15)}]`
      };
    };

    try {
      const normCert = normalizePEM(cert, 'cert');
      const normKey = normalizePEM(key, 'key');

      this._lastDiag = `${normCert.debug} ${normKey.debug}`;

      return {
        cert: normCert.pem,
        key: normKey.pem,
        rejectUnauthorized: true
      };
    } catch (err: any) {
      throw new Error(`Config mTLS: ${err.message}`);
    }
  }

  /**
   * Faz uma requisição HTTPS nativa com suporte a mTLS
   */
  private static async request(options: https.RequestOptions, body?: any): Promise<any> {
    const certConfig = this.getCertConfig();
    const finalOptions = { ...options, ...certConfig };

    return new Promise((resolve, reject) => {
      try {
        const req = https.request(finalOptions, (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              if (res.statusCode && res.statusCode >= 400) {
                reject(new Error(parsed.message || `Erro API Cora: ${res.statusCode}`));
              } else {
                resolve(parsed);
              }
            } catch (e) {
              reject(new Error('Falha ao processar resposta da Cora.'));
            }
          });
        });

        req.on('error', (e) => reject(new Error(`Conexão mTLS Falhou (Async): ${e.message}`)));
        if (body) req.write(body);
        req.end();
      } catch (syncErr: any) {
        reject(new Error(`Conexão mTLS Falhou (Sync): ${syncErr.message}. Diag: ${this._lastDiag}`));
      }
    });
  }

  /**
   * Obtém o Token de Acesso (OAuth2 + mTLS)
   */
  static async getToken(): Promise<string> {
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'all'
    }).toString();

    const result = await this.request({
      hostname: this.AUTH_HOST,
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'client_id': this.clientId,
      }
    }, body);

    return result.access_token;
  }

  /**
   * Busca o Extrato Bancário
   */
  static async getStatement(start: string, end: string): Promise<CoraTransaction[]> {
    const token = await this.getToken();
    const result = await this.request({
      hostname: this.API_HOST,
      path: `/v2/statement?start=${start}&end=${end}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return result.items.map((item: any) => ({
      id: item.id,
      type: item.entry,
      amount: item.amount,
      description: item.description,
      transactedAt: item.createdAt,
      counterParty: item.counterparty,
    }));
  }

  /**
   * Emite uma cobrança
   */
  static async createInvoice(data: {
    amount: number;
    name: string;
    identity: string;
    dueDate: string;
    description: string;
  }) {
    const token = await this.getToken();
    const body = JSON.stringify({
      services: [{ name: data.description, amount: data.amount }],
      customer: { name: data.name, identity: data.identity.replace(/\D/g, '') },
      dueDate: data.dueDate,
    });

    return await this.request({
      hostname: this.API_HOST,
      path: '/v2/invoices',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `inv_${Date.now()}`
      }
    }, body);
  }

  /**
   * Lista recorrências (assinaturas) ativas na conta
   */
  static async listRecurrences() {
    const token = await this.getToken();
    return this.request({
      hostname: this.API_HOST,
      path: '/v2/recurrences',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }
}
