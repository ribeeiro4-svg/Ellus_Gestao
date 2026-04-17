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
      
      // 1. Limpeza inicial de sujeira de ambiente (escapes, aspas, etc)
      let cleaned = pem
        .replace(/\\n/g, '\n')
        .replace(/\r/g, '')
        .replace(/&quot;/g, '"')
        .trim();

      // Se estiver entre aspas, remove
      if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
        cleaned = cleaned.substring(1, cleaned.length - 1);
      }

      // 2. Extração do conteúdo base64 puro
      // Remove headers se existirem para reformatar do zero de forma limpa
      let base64 = cleaned
        .replace(/-----BEGIN [^-]+-----/g, '')
        .replace(/-----END [^-]+-----/g, '')
        .replace(/\s/g, ''); // Remove todos os espaços e quebras

      if (!base64) return { pem: Buffer.from(''), debug: 'BASE64_VAZIO' };

      // 3. Garantia de Padding (ESSENCIAL: em vez de cortar, nós completamos)
      while (base64.length % 4 !== 0) {
        base64 += '=';
      }

      // 4. Determinação do Header correto
      let header = type === 'cert' ? 'CERTIFICATE' : 'PRIVATE KEY';
      
      // Se for chave e tiver indícios de ser RSA, usamos o header específico
      if (type === 'key' && (cleaned.includes('RSA') || base64.length > 2000)) {
        header = 'RSA PRIVATE KEY';
      }

      // 5. remontagem no formato PEM padrão (64 colunas)
      const lines = base64.match(/.{1,64}/g) || [];
      const finalPem = `-----BEGIN ${header}-----\n${lines.join('\n')}\n-----END ${header}-----`;

      return { 
        pem: Buffer.from(finalPem, 'utf-8'), 
        debug: `[${type.toUpperCase()}: ${base64.length}b]`
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
            let parsed: any = {};
            try {
              parsed = data ? JSON.parse(data) : {};
            } catch (e) {
              parsed = { raw: data };
            }

            if (res.statusCode && res.statusCode >= 400) {
              const errMsg = parsed.message || parsed.error_description || JSON.stringify(parsed);
              reject(new Error(`Cora API (${res.statusCode}): ${errMsg}`));
            } else {
              resolve(parsed);
            }
          });
        });

        req.on('error', (e) => reject(new Error(`Falha de Conexão mTLS: ${e.message}. Verifique se os certificados no Vercel estão no formato correto.`)));
        if (body) req.write(body);
        req.end();
      } catch (syncErr: any) {
        reject(new Error(`Erro Crítico Cora (Sync): ${syncErr.message}. Diag: ${this._lastDiag}`));
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
