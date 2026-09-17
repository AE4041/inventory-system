import { api } from "./api";

// Thin, uniform wrappers around each REST resource. Keeping them together avoids
// scattering `api.get("/x")` calls (and their query-string building) across pages.

export const authApi = {
  login: (data) => api.post("/auth/login", data),
  registerOrganization: (data) => api.post("/auth/register", data),
  me: () => api.get("/auth/me"),
};

export const organizationApi = {
  get: () => api.get("/organization"),
  update: (data) => api.patch("/organization", data),
};

export const usersApi = {
  list: () => api.get("/users"),
  create: (data) => api.post("/users", data),
  update: (id, data) => api.patch(`/users/${id}`, data),
  remove: (id) => api.delete(`/users/${id}`),
};

export const storesApi = {
  list: () => api.get("/stores"),
  get: (id) => api.get(`/stores/${id}`),
  create: (data) => api.post("/stores", data),
  update: (id, data) => api.patch(`/stores/${id}`, data),
  getMikrotikStatus: (id) => api.get(`/stores/${id}/mikrotik-token`),
  regenerateMikrotikToken: (id) => api.post(`/stores/${id}/mikrotik-token`),
};

export const mikrotikApi = {
  listMappings: () => api.get("/integrations/mikrotik/mappings"),
  upsertMapping: (data) => api.post("/integrations/mikrotik/mappings", data),
  deleteMapping: (id) => api.delete(`/integrations/mikrotik/mappings/${id}`),
  closeDay: () => api.post("/integrations/mikrotik/close-day"),
  getPending: (storeId) => api.get("/integrations/mikrotik/pending", { params: { storeId } }),
  addPending: (data) => api.post("/integrations/mikrotik/pending", data),
  removePending: (id) => api.delete(`/integrations/mikrotik/pending/${id}`),
};

export const categoriesApi = {
  list: () => api.get("/categories"),
  create: (data) => api.post("/categories", data),
  update: (id, data) => api.patch(`/categories/${id}`, data),
  remove: (id) => api.delete(`/categories/${id}`),
};

export const productsApi = {
  list: (params) => api.get("/products", { params }),
  get: (id, params) => api.get(`/products/${id}`, { params }),
  create: (data) => api.post("/products", data),
  update: (id, data) => api.patch(`/products/${id}`, data),
  setStorePrice: (id, data) => api.patch(`/products/${id}/price`, data),
  remove: (id) => api.delete(`/products/${id}`),
};

export const inventoryApi = {
  stock: (params) => api.get("/inventory/stock", { params }),
  history: (params) => api.get("/inventory/history", { params }),
  valuation: (params) => api.get("/inventory/valuation", { params }),
  adjust: (data) => api.post("/inventory/adjustments", data),
};

export const stockTransfersApi = {
  list: (params) => api.get("/stock-transfers", { params }),
  create: (data) => api.post("/stock-transfers", data),
  complete: (id) => api.post(`/stock-transfers/${id}/complete`),
  cancel: (id) => api.post(`/stock-transfers/${id}/cancel`),
};

export const customersApi = {
  list: (params) => api.get("/customers", { params }),
  get: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post("/customers", data),
  update: (id, data) => api.patch(`/customers/${id}`, data),
  remove: (id) => api.delete(`/customers/${id}`),
};

export const salesApi = {
  list: (params) => api.get("/sales", { params }),
  get: (id) => api.get(`/sales/${id}`),
  create: (data) => api.post("/sales", data),
  refund: (id, data) => api.post(`/sales/${id}/refund`, data),
  cancel: (id, data) => api.post(`/sales/${id}/cancel`, data),
  markPaid: (id) => api.post(`/sales/${id}/mark-paid`),
  updateItems: (id, data) => api.patch(`/sales/${id}/items`, data),
};

export const expenseCategoriesApi = {
  list: () => api.get("/expense-categories"),
  create: (data) => api.post("/expense-categories", data),
  update: (id, data) => api.patch(`/expense-categories/${id}`, data),
  remove: (id) => api.delete(`/expense-categories/${id}`),
};

export const expensesApi = {
  list: (params) => api.get("/expenses", { params }),
  create: (data) => api.post("/expenses", data),
  update: (id, data) => api.patch(`/expenses/${id}`, data),
  remove: (id) => api.delete(`/expenses/${id}`),
};

export const dashboardApi = {
  get: (params) => api.get("/dashboard", { params }),
};

export const reportsApi = {
  sales: (params) => api.get("/reports/sales", { params }),
  expenses: (params) => api.get("/reports/expenses", { params }),
  inventory: (params) => api.get("/reports/inventory", { params }),
  products: (params) => api.get("/reports/products", { params }),
  stores: (params) => api.get("/reports/stores", { params }),
};

export const receiptsApi = {
  fetchPdfBlob: (saleId) => api.get(`/receipts/${saleId}/pdf`, { responseType: "blob" }),
  email: (saleId, data) => api.post(`/receipts/${saleId}/email`, data),
};
