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
  
  private static getCertConfig(config?: { cert?: string, key?: string }) {
    const cert = config?.cert || process.env.CORA_CERT;
    const key = config?.key || process.env.CORA_KEY;

    if (!cert || !key) {
      throw new Error('Certificações Cora não encontradas (Configure no Portal ou .env).');
    }

    const normalize = (val: string) => {
      // 1. Converte \n literais (strings) em quebras reais
      // 2. Remove espaços em branco nas pontas de cada linha
      // 3. Garante que não haja linhas vazias no meio
      return val
        .replace(/\\n/g, '\n')
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0)
        .join('\n');
    };

    const finalCert = normalize(cert);
    const finalKey = normalize(key);

    this._lastDiag = `CertLen:${finalCert.length} KeyLen:${finalKey.length}`;

    return {
      cert: finalCert,
      key: finalKey,
      rejectUnauthorized: true
    };
  }

  private static async request(options: https.RequestOptions, body?: any, config?: { cert?: string, key?: string }): Promise<any> {
    const certOptions = this.getCertConfig(config);
    const finalOptions = { ...options, ...certOptions };
    // ... rest same ...

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
  static async getToken(config?: { clientId?: string, cert?: string, key?: string }): Promise<string> {
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
        'client_id': config?.clientId || this.clientId,
      }
    }, body, config);

    return result.access_token;
  }

  /**
   * Busca o Extrato Bancário
   */
  static async getStatement(start: string, end: string, config?: { clientId?: string, cert?: string, key?: string }): Promise<CoraTransaction[]> {
    const token = await this.getToken(config);
    const result = await this.request({
      hostname: this.API_HOST,
      path: `/v2/statement?start=${start}&end=${end}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, null, config);

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
  }, config?: { clientId?: string, cert?: string, key?: string }) {
    const token = await this.getToken(config);
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
    }, body, config);
  }

  /**
   * Busca boletos/cobranças por CPF/CNPJ do cliente
   */
  static async getInvoicesByCustomer(identity: string, config?: { clientId?: string, cert?: string, key?: string }): Promise<any[]> {
    const token = await this.getToken(config);
    const cleanId = identity.replace(/\D/g, '');
    const result = await this.request({
      hostname: this.API_HOST,
      path: `/v2/invoices?customer_identity=${cleanId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, null, config);

    return result.items || [];
  }

  /**
   * Obtém o link ou buffer do PDF da fatura
   */
  static async getInvoicePdf(invoiceId: string, config?: { clientId?: string, cert?: string, key?: string }): Promise<{ url: string }> {
    const token = await this.getToken(config);
    return await this.request({
      hostname: this.API_HOST,
      path: `/v2/invoices/${invoiceId}/pdf`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, null, config);
  }

  /**
   * Lista recorrências (assinaturas) ativas na conta
   */
  static async listRecurrences(config?: { clientId?: string, cert?: string, key?: string }) {
    const token = await this.getToken(config);
    return this.request({
      hostname: this.API_HOST,
      path: `/v2/recurrences`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, null, config);
  }
}
