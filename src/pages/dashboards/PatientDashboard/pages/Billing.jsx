import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import LoadingSpinner from '../../../../components/common/LoadingSpinner/LoadingSpinner'
import { 
  getMyBills, 
  getMyBillingSummary, 
  getMyBillDetails, 
  initiateBillPayment 
} from '../../../../services/patientApi'

function extractList(payload) {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.data)) return payload.data
  if (Array.isArray(payload.bills)) return payload.bills
  return []
}

const Billing = () => {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('invoices') // invoices, history
  const [bills, setBills] = useState([])
  const [history, setHistory] = useState([])
  const [summary, setSummary] = useState(null)
  const [selectedBill, setSelectedBill] = useState(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  const [paymentMethod, setPaymentMethod] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  useEffect(() => {
    loadInitialData()
  }, [filterStatus, page])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [billsRes, summaryRes, historyRes] = await Promise.allSettled([
        getMyBills({ status: filterStatus || undefined, page, limit: 10 }),
        getMyBillingSummary(),
        import('../../../../services/patientApi').then(m => m.getMyPaymentHistory())
      ])

      if (billsRes.status === 'fulfilled') {
        const billsData = await billsRes.value.json().catch(() => ({}))
        // The backend might return { data: [...] } or { invoices: [...] }
        setBills(billsData.data || billsData.invoices || extractList(billsData))
        setTotalPages(billsData.pagination?.pages || 1)
      }

      if (summaryRes.status === 'fulfilled') {
        const summaryData = await summaryRes.value.json().catch(() => ({}))
        setSummary(summaryData.data || summaryData || null)
      }

      if (historyRes.status === 'fulfilled') {
        const historyData = await historyRes.value.json().catch(() => ({}))
        setHistory(historyData.data || historyData.payments || extractList(historyData))
      }
    } catch (error) {
      console.error('[Billing] fetch error:', error)
      toast.error('Failed to sync billing data.')
    } finally {
      setLoading(false)
    }
  }

  const handleViewBill = async (bill) => {
    const invoiceId = bill.invoice_id || bill.bill_id || bill.id
    setIsDetailLoading(true)
    try {
      const res = await getMyBillDetails(invoiceId)
      const data = await res.json()
      setSelectedBill(data.data || data)
    } catch (error) {
      toast.error('Could not load bill details.')
    } finally {
      setIsDetailLoading(false)
    }
  }

  const handlePayNow = (bill) => {
    setSelectedBill(bill)
    setShowPaymentModal(true)
  }

  const handlePaymentSubmit = async (e) => {
    e.preventDefault()
    if (!paymentMethod) {
      toast.warn('Select a payment method')
      return
    }

    setIsProcessingPayment(true)
    try {
      const invoiceId = selectedBill.invoice_id || selectedBill.bill_id || selectedBill.id
      const res = await initiateBillPayment(invoiceId, { 
        payment_method: paymentMethod,
        amount: selectedBill.balance_due || selectedBill.total_amount 
      })
      
      const data = await res.json()
      if (res.ok) {
        toast.success('Payment successfully initiated!')
        // In a real scenario, redirect to a gateway or show verification UI
        setTimeout(() => {
          setShowPaymentModal(false)
          setSelectedBill(null)
          loadInitialData()
        }, 2000)
      } else {
        toast.error(data.detail || 'Payment failed to initiate')
      }
    } catch (error) {
      toast.error('Connection error during payment.')
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const getStatusColor = (status) => {
    const s = String(status || '').toUpperCase()
    if (s === 'PAID') return 'bg-emerald-100 text-emerald-700'
    if (s === 'PENDING' || s === 'DRAFT') return 'bg-amber-100 text-amber-700'
    if (s === 'OVERDUE') return 'bg-rose-100 text-rose-700'
    if (s === 'PARTIALLY_PAID') return 'bg-blue-100 text-blue-700'
    return 'bg-slate-100 text-slate-600'
  }

  if (loading && bills.length === 0) return <LoadingSpinner />

  return (
    <div className="p-6 space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Financial Center</h1>
          <p className="text-slate-500 font-medium">Manage your medical expenses, bills, and insurance claims</p>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={() => loadInitialData()}
            className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
          >
            <i className="fas fa-sync-alt text-slate-400"></i>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
            <i className="fas fa-file-invoice-dollar"></i>
            <span>Export Statement</span>
          </button>
        </div>
      </div>

      {/* Summary Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center text-xl">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending</span>
          </div>
          <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Outstanding</div>
          <div className="text-3xl font-black text-slate-900 mt-1">₹{summary?.total_outstanding || 0}</div>
          <p className="text-xs text-rose-500 font-bold mt-2">
            <i className="fas fa-clock mr-1"></i> {summary?.unpaid_bill_count || 0} active invoices
          </p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl">
              <i className="fas fa-check-double"></i>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Settled</span>
          </div>
          <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Total Paid</div>
          <div className="text-3xl font-black text-slate-900 mt-1">₹{summary?.total_paid || 0}</div>
          <p className="text-xs text-emerald-600 font-bold mt-2">
            <i className="fas fa-calendar-check mr-1"></i> Lifetime total
          </p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow lg:col-span-2">
          <div className="flex h-full items-center justify-between">
            <div>
              <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Insurance Coverage</div>
              <div className="text-3xl font-black text-slate-900 mt-1">{summary?.insurance_provider || 'Not Linked'}</div>
              <div className="flex gap-2 mt-3">
                <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg uppercase tracking-widest">
                  Network Hospital
                </span>
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg uppercase tracking-widest">
                  Direct Billing
                </span>
              </div>
            </div>
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center text-2xl hidden sm:flex">
              <i className="fas fa-shield-alt"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="flex border-b border-slate-100">
        <button 
          onClick={() => setActiveTab('invoices')}
          className={`px-8 py-4 font-bold text-sm transition-all relative ${
            activeTab === 'invoices' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Active Invoices
          {activeTab === 'invoices' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />}
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`px-8 py-4 font-bold text-sm transition-all relative ${
            activeTab === 'history' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Payment History
          {activeTab === 'history' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />}
        </button>
      </div>

      {/* Bill List Table */}
      {activeTab === 'invoices' ? (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-6">
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Invoice History</h3>
            
            <div className="flex gap-3 w-full sm:w-auto">
              <select 
                className="flex-1 sm:flex-none bg-slate-50 border-none rounded-2xl px-6 py-3 font-bold text-slate-700 outline-none min-w-[160px]"
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value)
                  setPage(1)
                }}
              >
                <option value="">All Status</option>
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending</option>
                <option value="OVERDUE">Overdue</option>
                <option value="PARTIALLY_PAID">Partial</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Issue Date</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Amount</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Balance Due</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {bills.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                          <i className="fas fa-receipt text-slate-200 text-2xl"></i>
                        </div>
                        <p className="text-slate-400 font-bold">No invoices found matching your criteria.</p>
                      </div>
                    </td>
                  </tr>
                ) : bills.map(bill => (
                  <tr key={bill.invoice_id || bill.bill_id || bill.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="font-black text-slate-800">#{bill.invoice_number || bill.bill_number || (bill.invoice_id || bill.bill_id || bill.id).slice(0, 8)}</div>
                    </td>
                    <td className="px-8 py-6 text-sm font-bold text-slate-600">
                      {new Date(bill.created_at || bill.date).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-sm font-black text-slate-700 line-clamp-1">{bill.description || 'Medical Services'}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">{bill.bill_type || 'General'}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="font-black text-slate-900">₹{bill.total_amount || bill.amount}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className={`font-black ${bill.balance_due > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        ₹{bill.balance_due ?? 0}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(bill.status)}`}>
                        {bill.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleViewBill(bill)}
                          className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          title="View Details"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        {(bill.balance_due > 0 || bill.status !== 'PAID') && (
                          <button 
                            onClick={() => handlePayNow(bill)}
                            className="w-10 h-10 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                            title="Authorize Payment"
                          >
                            <i className="fas fa-credit-card"></i>
                          </button>
                        )}
                        <button 
                          className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"
                          title="Download PDF"
                        >
                          <i className="fas fa-download"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-8 bg-slate-50/50 border-t border-slate-50 flex justify-center items-center gap-6">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all disabled:opacity-50"
              >
                <i className="fas fa-chevron-left text-slate-400"></i>
              </button>
              <span className="text-sm font-black text-slate-500 uppercase tracking-widest">Page {page} of {totalPages}</span>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all disabled:opacity-50"
              >
                <i className="fas fa-chevron-right text-slate-400"></i>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50">
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Recent Transactions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Method</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction ID</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-8 py-20 text-center text-slate-400 font-bold">No payment history available.</td>
                  </tr>
                ) : history.map((pay, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6 text-sm font-bold text-slate-600">
                      {new Date(pay.paid_at || pay.date).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-6 text-sm font-black text-slate-700">
                      {pay.payment_method || 'N/A'}
                    </td>
                    <td className="px-8 py-6 text-sm font-mono text-slate-500">
                      {pay.transaction_id || '---'}
                    </td>
                    <td className="px-8 py-6 font-black text-emerald-600">
                      ₹{pay.amount}
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase">
                        {pay.status || 'SUCCESS'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bill Details Modal */}
      {selectedBill && !showPaymentModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
            {isDetailLoading ? (
              <div className="p-20"><LoadingSpinner /></div>
            ) : (
              <>
                <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-900 text-white">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-2xl">
                      <i className="fas fa-file-invoice"></i>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black tracking-tight">Invoice Details</h3>
                      <p className="text-slate-400 font-bold">#{selectedBill.bill_number || selectedBill.id}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedBill(null)} className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
                    <i className="fas fa-times"></i>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-10">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Issue Date</p>
                      <p className="text-sm font-black text-slate-800">{new Date(selectedBill.created_at || selectedBill.date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Due Date</p>
                      <p className="text-sm font-black text-slate-800">{new Date(selectedBill.due_date || selectedBill.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Line Items</p>
                    <div className="space-y-3">
                      {Array.isArray(selectedBill.items) ? selectedBill.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                          <span className="text-sm font-black text-slate-700">{item.name || item.service_name}</span>
                          <span className="font-black text-slate-900">₹{item.amount || item.price}</span>
                        </div>
                      )) : (
                        <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                          <span className="text-sm font-black text-slate-700">{selectedBill.description || 'General Services'}</span>
                          <span className="font-black text-slate-900">₹{selectedBill.total_amount || selectedBill.amount}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-3xl p-8 text-white space-y-4">
                    <div className="flex justify-between text-slate-400 font-bold text-sm">
                      <span>Subtotal</span>
                      <span>₹{selectedBill.total_amount || selectedBill.amount}</span>
                    </div>
                    <div className="flex justify-between text-emerald-400 font-bold text-sm">
                      <span>Insurance Applied</span>
                      <span>- ₹{selectedBill.insurance_coverage || 0}</span>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-white/10">
                      <span className="text-lg font-black tracking-tight">Total Outstanding</span>
                      <span className="text-2xl font-black text-indigo-400">₹{selectedBill.balance_due ?? 0}</span>
                    </div>
                  </div>
                </div>

                <div className="p-10 border-t border-slate-50 bg-slate-50 flex gap-4">
                  <button className="flex-1 px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-100 transition-all">
                    Download Receipt
                  </button>
                  {selectedBill.balance_due > 0 && (
                    <button 
                      onClick={() => setShowPaymentModal(true)}
                      className="flex-1 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                    >
                      Process Payment
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Payment Initiation Modal */}
      {showPaymentModal && selectedBill && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl">
          <div className="bg-white rounded-[3rem] w-full max-w-md overflow-hidden flex flex-col shadow-2xl border border-slate-200">
            <div className="p-10 text-center space-y-6">
              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center text-3xl mx-auto">
                <i className="fas fa-fingerprint"></i>
              </div>
              
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Authorize Payment</h3>
                <p className="text-slate-500 font-bold mt-2">Choose your preferred settlement method</p>
              </div>

              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Amount to Charge</div>
                <div className="text-4xl font-black text-slate-900">₹{selectedBill.balance_due || selectedBill.total_amount}</div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={() => setPaymentMethod('CARD')}
                  className={`flex items-center gap-4 p-5 rounded-2xl transition-all border-2 ${
                    paymentMethod === 'CARD' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-50 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                    <i className="fas fa-credit-card"></i>
                  </div>
                  <span className="font-black text-slate-700">Credit / Debit Card</span>
                  {paymentMethod === 'CARD' && <i className="fas fa-check-circle text-indigo-600 ml-auto"></i>}
                </button>

                <button 
                  onClick={() => setPaymentMethod('UPI')}
                  className={`flex items-center gap-4 p-5 rounded-2xl transition-all border-2 ${
                    paymentMethod === 'UPI' ? 'border-emerald-600 bg-emerald-50' : 'border-slate-50 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                    <i className="fas fa-qrcode"></i>
                  </div>
                  <span className="font-black text-slate-700">UPI (GPay, PhonePe)</span>
                  {paymentMethod === 'UPI' && <i className="fas fa-check-circle text-emerald-600 ml-auto"></i>}
                </button>
              </div>
            </div>

            <div className="p-8 border-t border-slate-50 bg-slate-50 flex gap-4">
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-8 py-5 text-slate-500 font-black text-sm hover:text-slate-800 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handlePaymentSubmit}
                disabled={isProcessingPayment || !paymentMethod}
                className="flex-[2] px-8 py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
              >
                {isProcessingPayment ? <i className="fas fa-circle-notch animate-spin"></i> : <span>Pay Now</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Billing