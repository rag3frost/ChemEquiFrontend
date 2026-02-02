import { AnalyticsData, DatasetHistoryItem, HistoryResponse } from '../types';

const BASE_URL = 'https://web-production-7bcce.up.railway.app';

// JWT token management
let accessToken: string | null = null;
let refreshToken: string | null = null;

// Load tokens from localStorage on module load
const loadTokens = () => {
  accessToken = localStorage.getItem('access_token');
  refreshToken = localStorage.getItem('refresh_token');
};

// Save tokens to localStorage
const saveTokens = (access: string, refresh?: string) => {
  accessToken = access;
  localStorage.setItem('access_token', access);
  if (refresh) {
    refreshToken = refresh;
    localStorage.setItem('refresh_token', refresh);
  }
};

// Clear tokens
const clearTokens = () => {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

// Get authorization header
const getAuthHeader = (): string => {
  return accessToken ? `Bearer ${accessToken}` : '';
};

// Load tokens on module initialization
loadTokens();

/**
 * Helper to handle fetch requests with automatic token refresh
 */
async function apiFetch(endpoint: string, options: RequestInit = {}, retryCount = 0): Promise<Response> {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  const cleanUrl = url.replace(/([^:]\/)\/+/g, "$1");

  // Add authorization header if we have a token
  const headers = { ...options.headers };
  if (accessToken && !headers['Authorization']) {
    headers['Authorization'] = getAuthHeader();
  }

  try {
    const response = await fetch(cleanUrl, {
      ...options,
      headers,
    });

    // If we get a 401 and haven't retried yet, try to refresh the token
    if (response.status === 401 && retryCount === 0 && refreshToken) {
      console.log('Access token expired, attempting refresh...');
      try {
        const refreshResponse = await fetch(`${BASE_URL}/api/auth/refresh/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include cookies for refresh token
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          saveTokens(refreshData.access);
          console.log('Token refreshed successfully');

          // Retry the original request with new token
          return apiFetch(endpoint, options, retryCount + 1);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Token refresh failed, clear tokens (don't reload to avoid infinite loop)
        clearTokens();
      }
    }

    // If still 401 after refresh attempt, or other auth errors, just clear tokens
    if (response.status === 401 || response.status === 403) {
      clearTokens();
      // Don't reload here - let the calling code handle the auth state
    }

    return response;
  } catch (error) {
    console.error(`API Fetch Error [${cleanUrl}]:`, error);
    throw error;
  }
}

/**
 * Transform backend analytics response to include backward-compatible properties
 */
function transformAnalyticsResponse(data: any): AnalyticsData {
  // Handle upload response which has 'analytics' nested
  const analyticsData = data.analytics || data;
  
  // Add backward-compatible properties
  const statistics = Object.entries(analyticsData.numeric_stats || {}).map(([column, stats]: [string, any]) => ({
    column,
    mean: stats.mean,
    median: stats.median,
    min: stats.min,
    max: stats.max,
    std: stats.std,
  }));

  // Transform chart_data from backend format to frontend format
  // Backend: { bar_charts: { "Type": { labels: [], values: [], title: "" } } }
  // Frontend: { bar_charts: [{ label: "Type", data: [{ name: "", value: 0 }] }] }
  const rawChartData = analyticsData.chart_data || {};
  
  const barCharts = Object.entries(rawChartData.bar_charts || {}).map(([key, chart]: [string, any]) => ({
    label: chart.title || key,
    data: (chart.labels || []).map((label: string, idx: number) => ({
      name: label,
      value: (chart.values || [])[idx] || 0
    }))
  }));

  const lineCharts = Object.entries(rawChartData.line_charts || {}).map(([key, chart]: [string, any]) => ({
    label: chart.title || key,
    data: (chart.labels || []).map((label: any, idx: number) => ({
      timestamp: String(label),
      value: (chart.values || [])[idx] || 0
    }))
  }));

  // Transform radar chart data
  const radarChart = rawChartData.radar_chart ? {
    labels: rawChartData.radar_chart.labels || [],
    values: rawChartData.radar_chart.values || [],
    raw_values: rawChartData.radar_chart.raw_values || [],
    health_score: rawChartData.radar_chart.health_score || 0,
    title: rawChartData.radar_chart.title || 'System Health Radar'
  } : undefined;

  // Transform pie charts (donut charts) - backend returns array of { label, data }
  const pieCharts = (rawChartData.pie_charts || []).map((chart: any) => ({
    label: chart.label || 'Distribution',
    data: (chart.data || []).map((item: any) => ({
      name: item.name || item.label || '',
      value: item.value || item.count || 0
    }))
  }));

  // Transform histograms - backend returns array of { column, bins, total, stats }
  const histograms = (rawChartData.histograms || []).map((hist: any) => ({
    column: hist.column || '',
    bins: (hist.bins || []).map((bin: any) => ({
      range: bin.range || `${bin.min}-${bin.max}`,
      count: bin.count || 0,
      min: bin.min || 0,
      max: bin.max || 0
    })),
    total: hist.total || 0,
    stats: hist.stats || { mean: 0, std: 0, min: 0, max: 0 }
  }));

  // Transform grouped bar charts - backend returns array of { title, group_by, groups, datasets }
  const groupedBarCharts = (rawChartData.grouped_bar_charts || []).map((chart: any) => ({
    title: chart.title || 'Comparison',
    group_by: chart.group_by || '',
    groups: chart.groups || [],
    datasets: (chart.datasets || []).map((ds: any) => ({
      label: ds.label || '',
      values: ds.values || []
    }))
  }));

  const transformedChartData = {
    bar_charts: barCharts,
    line_charts: lineCharts,
    radar_chart: radarChart,
    pie_charts: pieCharts,
    histograms: histograms,
    grouped_bar_charts: groupedBarCharts
  };

  return {
    dataset_id: data.dataset_id || analyticsData.dataset_id,
    file_name: data.file_name || analyticsData.file_name,
    upload_time: analyticsData.upload_time || new Date().toISOString(),
    total_records: data.total_records || analyticsData.total_records,
    columns: analyticsData.columns || [],
    numeric_columns: analyticsData.numeric_columns || [],
    categorical_columns: analyticsData.categorical_columns || [],
    numeric_stats: analyticsData.numeric_stats || {},
    categorical_distributions: analyticsData.categorical_distributions || {},
    averages: analyticsData.averages || {},
    chart_data: transformedChartData,
    // Legacy property mappings
    id: String(data.dataset_id || analyticsData.dataset_id),
    filename: data.file_name || analyticsData.file_name,
    numeric_columns_count: (analyticsData.numeric_columns || []).length,
    categorical_columns_count: (analyticsData.categorical_columns || []).length,
    statistics,
  };
}

/**
 * Transform backend history item to include backward-compatible properties
 */
function transformHistoryItem(item: any): DatasetHistoryItem {
  return {
    id: item.id,
    file_name: item.file_name,
    upload_time: item.upload_time,
    total_records: item.total_records,
    filename: item.file_name,
    record_count: item.total_records,
  };
}

export const apiService = {
  async healthCheck(): Promise<boolean> {
    try {
      const response = await apiFetch('/api/health/');
      return response.ok;
    } catch (error) {
      return false;
    }
  },

  async signup(email: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiFetch('/api/auth/signup/', { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (response.ok) {
        return { success: true, message: 'Account created! You can now log in.' };
      }
      
      const data = await response.json().catch(() => ({}));
      return { 
        success: false, 
        message: data.detail || data.message || 'Signup failed. User might already exist.' 
      };
    } catch (error) {
      return { 
        success: false, 
        message: 'Network Error: Cannot connect to registration server. Please check your connection.' 
      };
    }
  },

  async login(email: string, password: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Include cookies for refresh token
      });

      if (response.ok) {
        const data = await response.json();
        // Save access token to localStorage
        if (data.access) {
          saveTokens(data.access);
        }
        return { success: true };
      }
      
      // Handle specific error codes
      if (response.status === 429) {
        return { success: false, message: 'Too many login attempts. Please wait a minute and try again.' };
      }
      
      const errorData = await response.json().catch(() => ({}));
      return { 
        success: false, 
        message: errorData.detail || errorData.message || 'Invalid email or password.' 
      };
    } catch (error) {
      console.error('Login NetworkError:', error);
      return { success: false, message: 'Network error. Please check your connection.' };
    }
  },

  async getAnalytics(id?: string): Promise<AnalyticsData> {
    const authHeader = getAuthHeader();
    const endpoint = id ? `/api/analytics/${id}/` : `/api/analytics/`;
    
    const response = await apiFetch(endpoint, { 
      headers: { 'Authorization': authHeader }
    });
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        this.logout();
        // Don't reload - throw error and let UI handle it
      }
      throw new Error('Failed to fetch analytics');
    }
    
    const data = await response.json();
    return transformAnalyticsResponse(data);
  },

  async getHistory(): Promise<DatasetHistoryItem[]> {
    const authHeader = getAuthHeader();
    const response = await apiFetch('/api/history/', { 
      headers: { 'Authorization': authHeader }
    });
    
    if (!response.ok) throw new Error('Failed to fetch history');
    
    const data: HistoryResponse = await response.json();
    // Extract the datasets array from the response and transform each item
    return (data.datasets || []).map(transformHistoryItem);
  },

  async uploadCSV(file: File): Promise<AnalyticsData> {
    const authHeader = getAuthHeader();
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiFetch('/api/upload/', { 
      method: 'POST', 
      headers: { 'Authorization': authHeader }, 
      body: formData 
    });
    
    if (!response.ok) throw new Error('Upload failed');
    
    const data = await response.json();
    return transformAnalyticsResponse(data);
  },

  async downloadReport(id?: string): Promise<void> {
    const authHeader = getAuthHeader();
    const endpoint = id ? `/api/report/${id}/` : '/api/report/';
    const response = await apiFetch(endpoint, {
      headers: { 'Authorization': authHeader }
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Chemical_Report_${new Date().getTime()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } else {
      throw new Error('Failed to generate report');
    }
  },

  async logout(): Promise<void> {
    try {
      // Call backend logout to blacklist tokens
      await apiFetch('/api/auth/logout/', {
        method: 'POST',
        credentials: 'include', // Include cookies
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local tokens
      clearTokens();
    }
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/forgot-password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      const data = await response.json().catch(() => ({}));
      
      if (response.ok) {
        return { 
          success: true, 
          message: data.message || 'If an account with that email exists, we have sent a password reset link.' 
        };
      }
      
      return { 
        success: false, 
        message: data.message || data.error || 'Failed to send reset email. Please try again.' 
      };
    } catch (error) {
      return { 
        success: false, 
        message: 'Network Error: Cannot connect to server. Please check your connection.' 
      };
    }
  },

  async resetPassword(uidb64: string, token: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/reset-password/${uidb64}/${token}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json().catch(() => ({}));
      
      if (response.ok) {
        return { 
          success: true, 
          message: data.message || 'Password has been reset successfully. You can now log in with your new password.' 
        };
      }
      
      return { 
        success: false, 
        message: data.message || 'Invalid or expired reset link. Please request a new one.' 
      };
    } catch (error) {
      return { 
        success: false, 
        message: 'Network Error: Cannot connect to server. Please check your connection.' 
      };
    }
  }
};
