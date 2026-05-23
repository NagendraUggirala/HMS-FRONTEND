import { apiFetch } from './apiClient'
import {
  PHARMACY_REPORTS_SALES_SUMMARY,
  PHARMACY_REPORTS_STOCK_VALUATION,
  PHARMACY_REPORTS_EXPIRY,
  PHARMACY_REPORTS_FAST_SLOW_MOVING,
  PHARMACY_REPORTS_PROFIT_MARGINS,
  PHARMACY_INVENTORY_BASE,
  PHARMACY_MEDICINES_BASE,
  PHARMACY_SUPPLIERS_BASE,
  PHARMACY_PURCHASE_ORDERS_BASE,
  PHARMACY_GRN_BASE,
  PHARMACY_STOCK_BASE,
  PHARMACY_SALES_BASE,
  PHARMACY_RETURNS_BASE,
  PHARMACY_ALERTS_BASE,
  PHARMACY_DASHBOARD_OVERVIEW,
  PHARMACY_SETTINGS_BASE
} from '../config/api'

/**
 * Resolve hospital_id from localStorage user object.
 * Tries multiple field names in order of precedence.
 */
function getHospitalId() {
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return null
    const user = JSON.parse(raw)
    return (
      user.hospital_id      ||
      user.hospitalId       ||
      user.hospital?.id     ||
      user.hospital?.hospital_id ||
      null
    )
  } catch {
    return null
  }
}

/**
 * Build extra headers that guarantee X-Hospital-ID is sent.
 * The apiClient already tries this, but we add it here explicitly
 * so pharmacy endpoints always have the correct context header.
 */
function hospitalHeaders() {
  const id = getHospitalId()
  if (!id) {
    console.warn(
      '[pharmacyApi] X-Hospital-ID not found in localStorage user object. ' +
      '403 errors will occur. Check that user.hospital_id is populated after login.'
    )
    toast.error('Missing hospital context. Please log out and log back in to refresh your session.')
    return {}
  }
  return { 'X-Hospital-ID': String(id) }
}

function withQuery(path, queryObj = {}) {
  const query = new URLSearchParams()
  Object.entries(queryObj).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      query.set(key, String(value))
    }
  })
  const queryString = query.toString()
  return queryString ? `${path}?${queryString}` : path
}

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error(`[pharmacyApi] HTTP ${res.status}:`, data)
    if (res.status === 403) {
      const hospitalId = getHospitalId()
      const url = res.url || 'unknown URL'
      console.error(
        `[pharmacyApi] 403 Forbidden at ${url} — hospital_id: ${hospitalId}. ` +
        `User: ${localStorage.getItem('user')}`
      )
      const err = new Error(
        hospitalId
          ? (data.detail || data.message || `Access denied at ${url}. Check role.`)
          : 'Missing hospital context. Please log out and log in again.'
      )
      err.status = 403
      throw err
    }
    if (res.status === 422 && Array.isArray(data.detail)) {
      const messages = data.detail.map(e => `[${e.loc?.join('.')}] ${e.msg}`).join('; ')
      console.error('[pharmacyApi] 422 Validation errors:', messages)
      const err = new Error(`Validation failed: ${messages}`)
      err.status = 422
      throw err
    }
    
    // Check if the backend sends a "errors" array or object
    let extraDetail = '';
    if (data.errors) {
       extraDetail = ' | ' + (Array.isArray(data.errors) ? data.errors.map(e => JSON.stringify(e)).join(', ') : JSON.stringify(data.errors));
    } else if (data.detail && typeof data.detail === 'object' && !Array.isArray(data.detail)) {
       extraDetail = ' | ' + JSON.stringify(data.detail);
    }
    
    const err = new Error((data.message || data.detail || `HTTP ${res.status}`) + extraDetail)
    err.status = res.status
    throw err
  }
  return data.data ?? data
}

/**
 * GET /reports/sales-summary
 */
export async function getSalesSummary(fromDate, toDate, groupBy = 'day') {
  const f = fromDate ? `${fromDate} 00:00:00` : undefined;
  const t = toDate ? `${toDate} 23:59:59` : undefined;
  const path = withQuery(PHARMACY_REPORTS_SALES_SUMMARY, {
    from_date: f,
    to_date: t,
    group_by: groupBy
  })
  const res = await apiFetch(path, { headers: hospitalHeaders() })
  return handleResponse(res)
}

/**
 * GET /reports/stock-valuation
 */
export async function getStockValuation() {
  const res = await apiFetch(PHARMACY_REPORTS_STOCK_VALUATION, { headers: hospitalHeaders() })
  return handleResponse(res)
}

/**
 * GET /reports/expiry
 */
export async function getExpiryReport() {
  const res = await apiFetch(PHARMACY_REPORTS_EXPIRY, { headers: hospitalHeaders() })
  return handleResponse(res)
}

/**
 * GET /reports/fast-slow-moving
 */
export async function getFastSlowMovingReport(fromDate, toDate) {
  const f = fromDate ? `${fromDate} 00:00:00` : undefined;
  const t = toDate ? `${toDate} 23:59:59` : undefined;
  const path = withQuery(PHARMACY_REPORTS_FAST_SLOW_MOVING, {
    from_date: f,
    to_date: t
  })
  const res = await apiFetch(path, { headers: hospitalHeaders() })
  return handleResponse(res)
}

/**
 * GET /reports/profit-margins
 */
export async function getProfitMarginsReport(fromDate, toDate) {
  const f = fromDate ? `${fromDate} 00:00:00` : undefined;
  const t = toDate ? `${toDate} 23:59:59` : undefined;
  const path = withQuery(PHARMACY_REPORTS_PROFIT_MARGINS, {
    from_date: f,
    to_date: t
  })
  const res = await apiFetch(path, { headers: hospitalHeaders() })
  return handleResponse(res)
}

/**
 * GET /inventory
 */
export async function getInventory(skip = 0, limit = 100) {
  const path = withQuery(PHARMACY_INVENTORY_BASE, { skip, limit })
  const res = await apiFetch(path, { headers: hospitalHeaders() })
  return handleResponse(res)
}

// --- MEDICINES ---
export async function getMedicines(skip = 0, limit = 100, search = '', category = '', status = '') {
  const path = withQuery(PHARMACY_MEDICINES_BASE, { skip, limit, search, category, status })
  const res = await apiFetch(path, { headers: hospitalHeaders() })
  return handleResponse(res)
}
export async function getMedicine(id) {
  const res = await apiFetch(`${PHARMACY_MEDICINES_BASE}/${id}`, {
    headers: hospitalHeaders()
  })
  return handleResponse(res)
}

export async function createMedicine(data) {
  console.log('[pharmacyApi] createMedicine payload:', JSON.stringify(data, null, 2))
  const res = await apiFetch(PHARMACY_MEDICINES_BASE, {
    method: 'POST',
    headers: { ...hospitalHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return handleResponse(res)
}

export async function updateMedicine(id, data) {
  console.log('[pharmacyApi] updateMedicine payload:', JSON.stringify(data, null, 2))
  const res = await apiFetch(`${PHARMACY_MEDICINES_BASE}/${id}`, {
    method: 'PUT',
    headers: { ...hospitalHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return handleResponse(res)
}

export async function deleteMedicine(id) {
  const res = await apiFetch(`${PHARMACY_MEDICINES_BASE}/${id}`, {
    method: 'DELETE',
    headers: hospitalHeaders()
  })
  return handleResponse(res)
}

// --- SUPPLIERS ---
export async function getSuppliers(skip = 0, limit = 100) {
  const path = withQuery(PHARMACY_SUPPLIERS_BASE, { skip, limit })
  const res = await apiFetch(path, { headers: hospitalHeaders() })
  return handleResponse(res)
}

export async function createSupplier(data) {
  const res = await apiFetch(PHARMACY_SUPPLIERS_BASE, {
    method: 'POST',
    headers: { ...hospitalHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return handleResponse(res)
}

export async function updateSupplier(id, data) {
  const res = await apiFetch(`${PHARMACY_SUPPLIERS_BASE}/${id}`, {
    method: 'PUT',
    headers: { ...hospitalHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return handleResponse(res)
}

export async function deleteSupplier(id) {
  const res = await apiFetch(`${PHARMACY_SUPPLIERS_BASE}/${id}`, {
    method: 'DELETE',
    headers: hospitalHeaders()
  })
  return handleResponse(res)
}

// --- DASHBOARD ---
export async function getDashboardOverview() {
  const res = await apiFetch(PHARMACY_DASHBOARD_OVERVIEW, { headers: hospitalHeaders() })
  return handleResponse(res)
}

// --- PURCHASE ORDERS ---
export async function getPurchaseOrders(status = '', supplierId = '', skip = 0, limit = 100) {
  const path = withQuery(PHARMACY_PURCHASE_ORDERS_BASE, { status, supplier_id: supplierId, skip, limit })
  const res = await apiFetch(path, { headers: hospitalHeaders() })
  return handleResponse(res)
}

export async function getPurchaseOrder(id) {
  const res = await apiFetch(`${PHARMACY_PURCHASE_ORDERS_BASE}/${id}`, {
    headers: hospitalHeaders()
  })
  return handleResponse(res)
}

export async function createPurchaseOrder(data) {
  const res = await apiFetch(PHARMACY_PURCHASE_ORDERS_BASE, {
    method: 'POST',
    headers: { ...hospitalHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return handleResponse(res)
}

export async function updatePurchaseOrder(id, data) {
  const res = await apiFetch(`${PHARMACY_PURCHASE_ORDERS_BASE}/${id}`, {
    method: 'PUT',
    headers: { ...hospitalHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return handleResponse(res)
}

export async function submitPurchaseOrder(id) {
  const res = await apiFetch(`${PHARMACY_PURCHASE_ORDERS_BASE}/${id}/submit`, {
    method: 'POST',
    headers: hospitalHeaders()
  })
  return handleResponse(res)
}

export async function approvePurchaseOrder(id) {
  const res = await apiFetch(`${PHARMACY_PURCHASE_ORDERS_BASE}/${id}/approve`, {
    method: 'POST',
    headers: hospitalHeaders()
  })
  return handleResponse(res)
}

export async function sendPurchaseOrder(id) {
  const res = await apiFetch(`${PHARMACY_PURCHASE_ORDERS_BASE}/${id}/send`, {
    method: 'POST',
    headers: hospitalHeaders()
  })
  return handleResponse(res)
}

export async function cancelPurchaseOrder(id, reason) {
  const res = await apiFetch(`${PHARMACY_PURCHASE_ORDERS_BASE}/${id}/cancel`, {
    method: 'POST',
    headers: { ...hospitalHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason })
  })
  return handleResponse(res)
}

export async function deletePurchaseOrder(id) {
  const res = await apiFetch(`${PHARMACY_PURCHASE_ORDERS_BASE}/${id}`, {
    method: 'DELETE',
    headers: hospitalHeaders()
  })
  return handleResponse(res)
}

// --- GRN ---
export async function createGRN(data) {
  // Ensure received_at is present if missing
  const payload = {
    received_at: new Date().toISOString(),
    ...data
  }
  const res = await apiFetch(PHARMACY_GRN_BASE, {
    method: 'POST',
    headers: { ...hospitalHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  return handleResponse(res)
}

export async function getGRNs(supplierId = '', skip = 0, limit = 100) {
  const path = withQuery(PHARMACY_GRN_BASE, { supplier_id: supplierId, skip, limit })
  const res = await apiFetch(path, { headers: hospitalHeaders() })
  return handleResponse(res)
}

export async function getGRN(id) {
  const res = await apiFetch(`${PHARMACY_GRN_BASE}/${id}`, {
    headers: hospitalHeaders()
  })
  return handleResponse(res)
}

export async function addGRNItem(grnId, data) {
  const res = await apiFetch(`${PHARMACY_GRN_BASE}/${grnId}/items`, {
    method: 'POST',
    headers: { ...hospitalHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return handleResponse(res)
}

export async function finalizeGRN(id) {
  const res = await apiFetch(`${PHARMACY_GRN_BASE}/${id}/finalize`, {
    method: 'POST',
    headers: hospitalHeaders()
  })
  return handleResponse(res)
}

// --- STOCK ---
export async function getStockBatches(medicineId = '', lowStock = false, expiringInDays = null, skip = 0, limit = 100) {
  const path = withQuery(PHARMACY_STOCK_BASE, {
    medicine_id: medicineId,
    low_stock: lowStock,
    expiring_in_days: expiringInDays,
    skip,
    limit
  })
  const res = await apiFetch(path, { headers: hospitalHeaders() })
  return handleResponse(res)
}

export async function createStockAdjustment(data) {
  const res = await apiFetch(`${PHARMACY_STOCK_BASE}/adjustments`, {
    method: 'POST',
    headers: { ...hospitalHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return handleResponse(res)
}

export async function getStockLedger(medicineId = '', txnType = '', fromDate = '', toDate = '', skip = 0, limit = 100) {
  const path = withQuery(`${PHARMACY_STOCK_BASE}/ledger`, {
    medicine_id: medicineId,
    txn_type: txnType,
    from_date: fromDate,
    to_date: toDate,
    skip,
    limit
  })
  const res = await apiFetch(path, { headers: hospitalHeaders() })
  return handleResponse(res)
}

// --- SALES ---
export async function getSales(patientId = '', status = '', fromDate = '', toDate = '', skip = 0, limit = 100) {
  const path = withQuery(PHARMACY_SALES_BASE, { patient_id: patientId, status, from_date: fromDate, to_date: toDate, skip, limit })
  const res = await apiFetch(path, { headers: hospitalHeaders() })
  return handleResponse(res)
}

export async function createSale(data) {
  const res = await apiFetch(PHARMACY_SALES_BASE, {
    method: 'POST',
    headers: { ...hospitalHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return handleResponse(res)
}

export async function getSale(id) {
  const res = await apiFetch(`${PHARMACY_SALES_BASE}/${id}`, {
    headers: hospitalHeaders()
  })
  return handleResponse(res)
}

export async function addSaleItem(saleId, data) {
  const res = await apiFetch(`${PHARMACY_SALES_BASE}/${saleId}/items`, {
    method: 'POST',
    headers: { ...hospitalHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return handleResponse(res)
}

export async function completeSale(saleId) {
  const res = await apiFetch(`${PHARMACY_SALES_BASE}/${saleId}/complete`, {
    method: 'POST',
    headers: hospitalHeaders()
  })
  return handleResponse(res)
}

export async function voidSale(saleId, reason) {
  const res = await apiFetch(`${PHARMACY_SALES_BASE}/${saleId}/void`, {
    method: 'POST',
    headers: { ...hospitalHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason })
  })
  return handleResponse(res)
}

export async function getSaleReceipt(saleId) {
  const res = await apiFetch(`${PHARMACY_SALES_BASE}/${saleId}/receipt`, {
    headers: hospitalHeaders()
  })
  return handleResponse(res)
}

// --- RETURNS ---
export async function getReturns(type = '', skip = 0, limit = 100) {
  const path = withQuery(PHARMACY_RETURNS_BASE, { return_type: type, skip, limit })
  const res = await apiFetch(path, { headers: hospitalHeaders() })
  return handleResponse(res)
}

export async function createPatientReturn(data) {
  const res = await apiFetch(`${PHARMACY_RETURNS_BASE}/patient`, {
    method: 'POST',
    headers: { ...hospitalHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return handleResponse(res)
}

export async function createSupplierReturn(data) {
  const res = await apiFetch(`${PHARMACY_RETURNS_BASE}/supplier`, {
    method: 'POST',
    headers: { ...hospitalHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return handleResponse(res)
}

// --- ALERTS ---
export async function getAlerts(skip = 0, limit = 100, alertType = '', status = '') {
  const path = withQuery(PHARMACY_ALERTS_BASE, { skip, limit, alert_type: alertType, status })
  const res = await apiFetch(path, { headers: hospitalHeaders() })
  return handleResponse(res)
}

export async function acknowledgeAlert(alertId) {
  const res = await apiFetch(`${PHARMACY_ALERTS_BASE}/${alertId}/ack`, {
    method: 'POST',
    headers: hospitalHeaders()
  })
  return handleResponse(res)
}

export async function runExpiryScan() {
  const res = await apiFetch(`${PHARMACY_ALERTS_BASE}/run-expiry-scan`, {
    method: 'POST',
    headers: hospitalHeaders()
  })
  return handleResponse(res)
}
// --- SETTINGS ---
export async function getPharmacySettings() {
  const res = await apiFetch(PHARMACY_SETTINGS_BASE, { headers: hospitalHeaders() })
  return handleResponse(res)
}

export async function updatePharmacySettings(data) {
  const res = await apiFetch(PHARMACY_SETTINGS_BASE, {
    method: 'PUT',
    headers: { ...hospitalHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return handleResponse(res)
}
