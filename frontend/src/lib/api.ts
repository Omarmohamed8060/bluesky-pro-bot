const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export function apiUrl(path: string) {
  if (!path.startsWith('/')) {
    return `${API_BASE}/${path}`;
  }
  return `${API_BASE}${path}`;
}

const API_BASE_URL = apiUrl('/api/v1');

export interface Account {
  id: string;
  username: string;
  did?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string;
}

export interface Campaign {
  id: string;
  name: string;
  message: string;
  targetList: string[];
  status: 'draft' | 'queued' | 'running' | 'paused' | 'completed' | 'failed';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  totalTargets: number;
  sentCount: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  type?: 'dm' | 'post';
}

export interface Template {
  id: string;
  name: string;
  content: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Stats {
  totalAccounts: number;
  activeAccounts: number;
  activeCampaigns: number;
  totalSent: number;
  failedCount: number;
}

export interface CreateAccountRequest {
  username: string;
  appPassword: string;
}

export interface CreateCampaignRequest {
  name: string;
  type: 'dm' | 'post';
  message: string;
  targetList: string[];
  accountId?: string;
}

export interface CreateTemplateRequest {
  name: string;
  content: string;
  description?: string;
}

export interface StartCampaignRequest {
  name: string;
  type: 'dm' | 'post';
  message: string;
  targets: string[];
  accountId: string;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit & { baseUrl?: string } = {}
): Promise<T> {
  const baseUrl = options.baseUrl || API_BASE_URL;
  const url = `${baseUrl}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Remove baseUrl from config to avoid passing it to fetch
  const { baseUrl: _, ...fetchOptions } = config;

  try {
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || errorData.error || `HTTP ${response.status}`,
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError('Backend server is not reachable. Please ensure it is running on http://localhost:5000');
    }
    throw new ApiError('Network error occurred');
  }
}

// Account API
export async function addAccount(username: string, appPassword: string): Promise<Account> {
  return apiRequest<Account>('/accounts', {
    method: 'POST',
    body: JSON.stringify({ username, appPassword }),
  });
}

export async function getAccounts(): Promise<Account[]> {
  return apiRequest<Account[]>('/accounts');
}

export async function deleteAccount(id: string): Promise<void> {
  return apiRequest<void>(`/accounts/${id}`, {
    method: 'DELETE',
  });
}

// Campaign API
export async function createCampaign(data: CreateCampaignRequest): Promise<Campaign> {
  return apiRequest<Campaign>('/campaigns', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getCampaigns(): Promise<Campaign[]> {
  return apiRequest<Campaign[]>('/campaigns');
}

export async function startCampaign(data: StartCampaignRequest): Promise<Campaign> {
  return apiRequest<Campaign>('/campaigns', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function pauseCampaign(id: string): Promise<Campaign> {
  return apiRequest<Campaign>(`/campaigns/${id}/pause`, {
    method: 'POST',
  });
}

export async function deleteCampaign(id: string): Promise<void> {
  return apiRequest<void>(`/campaigns/${id}`, {
    method: 'DELETE',
  });
}

// Stats API
export async function getStats(): Promise<Stats> {
  return apiRequest<Stats>('/stats');
}

// Settings API
export async function getSettings() {
  return apiRequest<any>('/settings');
}

export async function updateSettings(settings: any) {
  return apiRequest<any>('/settings', {
    method: 'POST',
    body: JSON.stringify(settings),
  });
}

export const getLogs = async (): Promise<any[]> => {
  return apiRequest('/logs', { method: 'GET' });
};

// Target Lists APIs
export interface TargetList {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  _count: {
    targets: number;
  };
}

export interface Target {
  id: string;
  handle?: string;
  did?: string;
  displayName?: string;
  createdAt: string;
}

export const getTargetLists = async (): Promise<TargetList[]> => {
  return apiRequest('/targets/lists', { method: 'GET' });
};

export const createTargetList = async (data: { name: string; description?: string }): Promise<TargetList> => {
  return apiRequest('/targets/lists', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const getTargetList = async (id: string): Promise<TargetList & { targets: Target[] }> => {
  return apiRequest(`/targets/lists/${id}`, { method: 'GET' });
};

export const addTargets = async (targetListId: string, targets: string[]): Promise<{ added: number; duplicates: number; invalid: number }> => {
  return apiRequest(`/targets/lists/${targetListId}/targets`, {
    method: 'POST',
    body: JSON.stringify({ targets }),
  });
};

export const getTargets = async (targetListId: string): Promise<Target[]> => {
  return apiRequest(`/targets/lists/${targetListId}/targets`, { method: 'GET' });
};

export const importTargets = async (targetListId: string, targetsText: string): Promise<{ added: number; duplicates: number; invalid: number }> => {
  return apiRequest('/targets/import', {
    method: 'POST',
    body: JSON.stringify({ targetListId, targetsText }),
  });
};

export const deleteTargetList = async (id: string): Promise<void> => {
  return apiRequest(`/targets/lists/${id}`, { method: 'DELETE' });
};

export const deleteTarget = async (id: string): Promise<void> => {
  return apiRequest(`/targets/targets/${id}`, { method: 'DELETE' });
};

// Template API
export async function createTemplate(data: CreateTemplateRequest): Promise<Template> {
  return apiRequest<Template>('/templates', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getTemplates(): Promise<Template[]> {
  return apiRequest<Template[]>('/templates');
}

export async function updateTemplate(id: string, data: Partial<CreateTemplateRequest>): Promise<Template> {
  return apiRequest<Template>(`/templates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteTemplate(id: string): Promise<void> {
  return apiRequest<void>(`/templates/${id}`, {
    method: 'DELETE',
  });
}

export async function renderTemplate(id: string, variables: Record<string, string>): Promise<{ rendered: string }> {
  return apiRequest<{ rendered: string }>(`/templates/${id}/render`, {
    method: 'POST',
    body: JSON.stringify({ variables }),
  });
}

export async function healthCheck(): Promise<{ status: string; timestamp: string }> {
  const url = apiUrl('/health');
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Health check failed');
  }
  return response.json();
}
