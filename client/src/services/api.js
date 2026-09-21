const API_BASE_URL = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('creova_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const api = {
  // Auth APIs
  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Registration failed');
    return data;
  },

  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  getCurrentUser: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch user');
    return data;
  },

  updateCurrentUser: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update account');
    return data;
  },

  deleteAccount: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to delete account');
    return data;
  },

  // Creator APIs
  getCreators: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/creators${query ? '?' + query : ''}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch creators');
    return data;
  },

  recordCreatorView: async (creatorId) => {
    const response = await fetch(`${API_BASE_URL}/creators/${creatorId}/view`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to record profile view');
    return data;
  },

  updateCreatorProfile: async (profileData) => {
    const response = await fetch(`${API_BASE_URL}/creators/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update creator profile');
    return data;
  },

  updateProfile: async (profileData) => {
    return api.updateCreatorProfile(profileData);
  },

  // Brand APIs
  getBrands: async () => {
    const response = await fetch(`${API_BASE_URL}/brands`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch brands');
    return data;
  },

  updateBrandProfile: async (brandData) => {
    const response = await fetch(`${API_BASE_URL}/brands/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(brandData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update brand profile');
    return data;
  },

  // Affiliate APIs
  getAffiliateProducts: async () => {
    const response = await fetch(`${API_BASE_URL}/affiliates`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch affiliate products');
    return data;
  },

  getBrandAffiliateProducts: async () => {
    const response = await fetch(`${API_BASE_URL}/affiliates/my-products`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch your affiliate products');
    return data;
  },

  createAffiliateProduct: async (productData) => {
    const response = await fetch(`${API_BASE_URL}/affiliates`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(productData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to create affiliate product');
    return data;
  },

  updateAffiliateProduct: async (productId, productData) => {
    const response = await fetch(`${API_BASE_URL}/affiliates/${productId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(productData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update affiliate product');
    return data;
  },

  deleteAffiliateProduct: async (productId) => {
    const response = await fetch(`${API_BASE_URL}/affiliates/${productId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to delete affiliate product');
    return data;
  },

  getMyAffiliateLinks: async () => {
    const response = await fetch(`${API_BASE_URL}/affiliates/my-links`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch saved affiliate links');
    return data;
  },

  saveAffiliateLink: async (productId) => {
    const response = await fetch(`${API_BASE_URL}/affiliates/${productId}/save`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to save affiliate link');
    return data;
  },

  unsaveAffiliateLink: async (productId) => {
    const response = await fetch(`${API_BASE_URL}/affiliates/${productId}/save`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to remove affiliate link');
    return data;
  },

  getPublicCreatorAffiliateLinks: async (creatorId) => {
    const response = await fetch(`${API_BASE_URL}/affiliates/creators/${creatorId}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch creator affiliate links');
    return data;
  },

  getPublicBrandAffiliateProducts: async (brandId) => {
    const response = await fetch(`${API_BASE_URL}/affiliates/brands/${brandId}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch brand affiliate products');
    return data;
  },

  // Campaign APIs
  getCampaigns: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/campaigns${query ? '?' + query : ''}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch campaigns');
    return data;
  },

  createCampaign: async (campaignData) => {
    const response = await fetch(`${API_BASE_URL}/campaigns`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(campaignData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to create campaign');
    return data;
  },

  // Application APIs
  applyToCampaign: async (applicationData) => {
    const response = await fetch(`${API_BASE_URL}/applications`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(applicationData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to submit application');
    return data;
  },

  getMyApplications: async () => {
    const response = await fetch(`${API_BASE_URL}/applications/my`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch applications');
    return data;
  },

  updateApplicationStatus: async (id, status) => {
    const response = await fetch(`${API_BASE_URL}/applications/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update application');
    return data;
  },

  // Collaboration APIs
  getCollaborations: async () => {
    const response = await fetch(`${API_BASE_URL}/collaborations`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch collaborations');
    return data;
  },

  // Messaging APIs
  getConversations: async () => {
    const response = await fetch(`${API_BASE_URL}/messages/conversations`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch conversations');
    return data;
  },

  getChatHistory: async (otherUserId) => {
    const response = await fetch(`${API_BASE_URL}/messages/${otherUserId}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch messages');
    return data;
  },

  sendMessage: async (messageData) => {
    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(messageData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to send message');
    return data;
  },

  // Notification APIs
  getNotifications: async () => {
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch notifications');
    return data;
  },

  markNotificationRead: async (id) => {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    return await response.json();
  },

  // Payment APIs
  getPayments: async () => {
    const response = await fetch(`${API_BASE_URL}/payments`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch payments');
    return data;
  },

  getPayment: async (paymentId) => {
    const response = await fetch(`${API_BASE_URL}/payments/${paymentId}`, { headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch payment');
    return data;
  },

  createPaymentOrder: async (collaborationId) => {
    const response = await fetch(`${API_BASE_URL}/payments/create`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ collaboration_id: collaborationId })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to create payment order');
    return data;
  },

  verifyPayment: async (verification) => {
    const response = await fetch(`${API_BASE_URL}/payments/verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(verification)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Payment verification failed');
    return data;
  },

  refundPayment: async (paymentId) => {
    const response = await fetch(`${API_BASE_URL}/payments/${paymentId}/refund`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Refund failed');
    return data;
  },

  // Social Account APIs
  getSocialAccounts: async () => {
    const response = await fetch(`${API_BASE_URL}/social-accounts`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch social accounts');
    return data;
  },

  addSocialAccount: async (accountData) => {
    const response = await fetch(`${API_BASE_URL}/social-accounts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(accountData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to add social account');
    return data;
  }
};
