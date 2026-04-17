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
  
  private static getCertConfig() {
    const cert = process.env.CORA_CERT;
    const key = process.env.CORA_KEY;

    if (!cert || !key) {
      throw new Error('Certificações Cora não encontradas em variáveis de ambiente.');
    }

    // Função auxiliar para normalizar certificados vindos do Vercel
    const normalizePEM = (pem: string) => {
      // 1. Limpa \n literais (escapados) e remove \r
      const cleaned = pem.replace(/\\n/g, '\n').replace(/\r/g, '');
      
      // 2. Localiza o conteúdo entre os delimitadores (BEGIN e END)
      const match = cleaned.match(/-----\s*BEGIN\s+(.+)\s*-----([\s\S]+?)-----\s*END\s+\1\s*-----/i);
      
      if (!match) {
        // Fallback: se não encontrar delimitadores, tenta apenas limpar espaços e torcer pelo melhor
        return cleaned.split('\n').map(l => l.trim()).filter(l => l.length > 0).join('\n');
      }

      const label = match[1].toUpperCase();
      // Remove TODO espaço, tabs e quebras de linha do corpo base64 para garantir integridade
      const content = match[2].replace(/\s/g, ''); 
      
      // 3. Reconstrói o PEM com quebras de linha a cada 64 caracteres (padrão RFC)
      // O OpenSSL é muito rigoroso com o formato do blob base64 em alguns ambientes
      const lines = content.match(/.{1,64}/g) || [];
      return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----`;
    };

    return {
      cert: normalizePEM(cert),
      key: normalizePEM(key),
      rejectUnauthorized: true
    };
  }

  /**
   * Faz uma requisição HTTPS nativa com suporte a mTLS
   */
  private static async request(options: https.RequestOptions, body?: any): Promise<any> {
    const certConfig = this.getCertConfig();
    const finalOptions = { ...options, ...certConfig };

    return new Promise((resolve, reject) => {
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

      req.on('error', (e) => reject(e));
      if (body) req.write(body);
      req.end();
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
