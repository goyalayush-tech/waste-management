// Quantum Analytics API Client
import { BaseApiClient, ApiConfig } from './baseClient';

export class QuantumApiClient extends BaseApiClient {
  constructor(config: Omit<ApiConfig, 'baseURL'> & { baseURL?: string } = {}) {
    super({ baseURL: config.baseURL || process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api', ...config });
  }

  async health() {
    return this.get('/quantum/health');
  }

  async optimizeRoute(nodes: string[], constraints: Record<string, any> = {}) {
    return this.post('/quantum/optimize-route', { nodes, constraints });
  }

  async schedule(jobs: string[], resources: Record<string, any> = {}) {
    return this.post('/quantum/schedule', { jobs, resources });
  }
}

export default QuantumApiClient; 