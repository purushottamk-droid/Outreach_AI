const BASE_URL = "https://outreach-ai-621913909275.us-central1.run.app";

export const api = {
  // Profile
  saveProfile: (profile: object) =>
    fetch(`${BASE_URL}/api/profile/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile)
    }).then(r => r.json()),

  getProfile: (userId: string) =>
    fetch(`${BASE_URL}/api/profile/${userId}`).then(r => r.json()),

  // Leads
  searchLeads: (criteria: object) =>
    fetch(`${BASE_URL}/api/leads/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(criteria)
    }).then(r => r.json()),

  // Agent
  runAgent: (payload: object) =>
    fetch(`${BASE_URL}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(r => r.json()),

  // Approvals
  getApprovals: (userId: string) =>
    fetch(`${BASE_URL}/api/approvals/${userId}`).then(r => r.json()),

  approveAction: (approvalId: string, userId: string) =>
    fetch(`${BASE_URL}/api/approvals/${approvalId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approval_id: approvalId, user_id: userId })
    }).then(r => r.json()),

  // Notifications
  getNotifications: (userId: string) =>
    fetch(`${BASE_URL}/api/notifications/${userId}`).then(r => r.json()),

  // History
  getHistory: (leadId: string) =>
    fetch(`${BASE_URL}/api/history/${leadId}`).then(r => r.json()),

  // Campaigns
 getCampaigns: (userId: string) =>
    fetch(`${BASE_URL}/api/campaigns/${userId}`).then(r => r.json()),

  bulkOutreach: (payload: object) =>
    fetch(`${BASE_URL}/api/bulk-outreach`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(r => r.json()),

  // Analytics
  getAnalytics: (userId: string, period: string = "30d") =>
    fetch(`${BASE_URL}/api/analytics/${userId}?period=${period}`)
      .then(r => r.json()),
};