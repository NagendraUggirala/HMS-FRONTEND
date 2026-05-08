import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import LoadingSpinner from '../../../../components/common/LoadingSpinner/LoadingSpinner'
import {
  getMyLabResults,
  getLabResultDetails,
  downloadLabResult,
} from '../../../../services/patientApi'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

// Backend status values: PENDING, COMPLETED, CANCELLED, etc.
function getStatusColor(status) {
  if (!status) return 'bg-gray-100 text-gray-700'
  const s = status.toUpperCase()
  if (s === 'COMPLETED') return 'bg-green-100 text-green-800'
  if (s === 'PENDING') return 'bg-yellow-100 text-yellow-800'
  if (s === 'CANCELLED') return 'bg-red-100 text-red-800'
  if (s === 'IN_PROGRESS') return 'bg-blue-100 text-blue-800'
  return 'bg-gray-100 text-gray-700'
}

function getStatusLabel(status) {
  if (!status) return 'Unknown'
  const s = status.toUpperCase()
  if (s === 'IN_PROGRESS') return 'In Progress'
  return status.charAt(0) + status.slice(1).toLowerCase()
}

// Extract list from multiple possible response shapes
function extractList(payload) {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.results)) return payload.results
  if (Array.isArray(payload.lab_results)) return payload.lab_results
  if (Array.isArray(payload.data)) return payload.data
  if (Array.isArray(payload.tests)) return payload.tests
  return []
}

const TestResults = () => {
  const [loading, setLoading] = useState(true)
  const [testResults, setTestResults] = useState([])
  const [selectedTest, setSelectedTest] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)
  const [filter, setFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('newest')

  useEffect(() => {
    loadTestResults()
  }, [])

  const loadTestResults = async () => {
    setLoading(true)
    try {
      const res = await getMyLabResults()
      const payload = await res.json().catch(() => ({}))
      console.log('[TestResults] API payload:', payload)

      if (!res.ok) {
        toast.error(payload?.detail || 'Failed to load lab results.')
        setTestResults([])
        return
      }

      const list = extractList(payload)
      setTestResults(list)
    } catch (err) {
      console.error('[TestResults] exception:', err)
      toast.error('Could not load lab results. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = async (test) => {
    const testId = test.id || test.test_id || test.result_id
    if (!testId) {
      setSelectedTest(test)
      return
    }
    setDetailLoading(true)
    try {
      const res = await getLabResultDetails(testId)
      const payload = await res.json().catch(() => ({}))
      console.log('[TestResults] detail payload:', payload)
      if (!res.ok) {
        toast.error(payload?.detail || 'Failed to load test details.')
        setSelectedTest(test)
        return
      }
      setSelectedTest(payload)
    } catch (err) {
      console.error('[TestResults] detail exception:', err)
      setSelectedTest(test)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleDownload = async (test) => {
    const testId = test.id || test.test_id || test.result_id
    if (!testId) { toast.info('No downloadable report available.'); return }
    setDownloadingId(testId)
    try {
      const res = await downloadLabResult(testId)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err?.detail || 'Download failed.')
        return
      }
      // Try to trigger file download
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `lab-report-${testId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Report downloaded successfully!')
    } catch (err) {
      console.error('[TestResults] download exception:', err)
      toast.error('Could not download report.')
    } finally {
      setDownloadingId(null)
    }
  }

  // Filtering
  const filtered = testResults.filter(t => {
    if (filter === 'all') return true
    const s = (t.status || '').toUpperCase()
    if (filter === 'completed') return s === 'COMPLETED'
    if (filter === 'pending') return s === 'PENDING'
    if (filter === 'in_progress') return s === 'IN_PROGRESS'
    return true
  })

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    const dA = new Date(a.created_at || a.test_date || a.date || 0)
    const dB = new Date(b.created_at || b.test_date || b.date || 0)
    return sortOrder === 'newest' ? dB - dA : dA - dB
  })

  // Stats
  const statCompleted = testResults.filter(t => t.status?.toUpperCase() === 'COMPLETED').length
  const statPending = testResults.filter(t => t.status?.toUpperCase() === 'PENDING').length
  const statInProgress = testResults.filter(t => t.status?.toUpperCase() === 'IN_PROGRESS').length

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-gray-700">Lab Test Results</h2>
          <p className="text-gray-500 text-sm mt-1">View and download your lab reports</p>
        </div>
        <button
          onClick={loadTestResults}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
        >
          <i className="fas fa-sync-alt mr-2"></i>Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition">
          <div className="w-1.5 bg-blue-600"></div>
          <div className="flex items-center gap-4 p-4 w-full">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <i className="fas fa-vials text-blue-600"></i>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Tests</p>
              <p className="text-2xl font-bold text-gray-900">{testResults.length}</p>
            </div>
          </div>
        </div>

        <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition">
          <div className="w-1.5 bg-green-600"></div>
          <div className="flex items-center gap-4 p-4 w-full">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <i className="fas fa-check-circle text-green-600"></i>
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{statCompleted}</p>
            </div>
          </div>
        </div>

        <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition">
          <div className="w-1.5 bg-yellow-500"></div>
          <div className="flex items-center gap-4 p-4 w-full">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <i className="fas fa-hourglass-half text-yellow-600"></i>
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{statPending}</p>
            </div>
          </div>
        </div>

        <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition">
          <div className="w-1.5 bg-blue-400"></div>
          <div className="flex items-center gap-4 p-4 w-full">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <i className="fas fa-spinner text-blue-500"></i>
            </div>
            <div>
              <p className="text-sm text-gray-500">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{statInProgress}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Sort */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All Tests' },
            { key: 'completed', label: 'Completed' },
            { key: 'pending', label: 'Pending' },
            { key: 'in_progress', label: 'In Progress' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filter === key
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <select
          value={sortOrder}
          onChange={e => setSortOrder(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm text-gray-700 bg-white"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-800">
            Lab Reports
            {filter !== 'all' && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({sorted.length} result{sorted.length !== 1 ? 's' : ''})
              </span>
            )}
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase">Test Name</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase">Date</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase">Ordered By</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase">Urgency</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 px-4 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                        <i className="fas fa-flask text-gray-400 text-2xl"></i>
                      </div>
                      <p className="text-gray-500 font-medium">
                        {filter === 'all' ? 'No lab results found.' : `No ${filter.replace('_', ' ')} tests.`}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                sorted.map((test, idx) => {
                  const testId = test.id || test.test_id || test.result_id || idx
                  const testName = test.test_name || test.name || test.testName || 'Lab Test'
                  const orderedBy = test.ordered_by || test.doctor_name || test.doctor || '—'
                  const urgency = test.urgency || test.priority || '—'
                  const testDate = test.created_at || test.test_date || test.date || ''

                  return (
                    <tr key={testId} className="hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{testName}</p>
                          <p className="text-xs text-gray-400 font-mono">
                            {String(testId).slice(0, 8)}…
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-700 text-sm">{formatDate(testDate)}</td>
                      <td className="py-4 px-4 text-gray-700 text-sm">{orderedBy}</td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}>
                          {getStatusLabel(test.status)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {urgency !== '—' ? (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            urgency?.toUpperCase() === 'URGENT' || urgency?.toUpperCase() === 'STAT'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {urgency}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewDetails(test)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                            title="View Details"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          {test.status?.toUpperCase() === 'COMPLETED' && (
                            <button
                              onClick={() => handleDownload(test)}
                              disabled={downloadingId === testId}
                              className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded disabled:opacity-50"
                              title="Download Report"
                            >
                              <i className={`fas ${downloadingId === testId ? 'fa-circle-notch fa-spin' : 'fa-download'}`}></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Loading Overlay */}
      {detailLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg px-6 py-4 shadow-lg text-gray-700">
            <i className="fas fa-circle-notch fa-spin mr-2 text-blue-500"></i>Loading details…
          </div>
        </div>
      )}

      {/* Test Details Modal */}
      {selectedTest && !detailLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Lab Report Details</h3>
                <button
                  onClick={() => setSelectedTest(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <i className="fas fa-times text-lg"></i>
                </button>
              </div>

              <div className="space-y-5">
                {/* Basic Info */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Test Name</p>
                    <p className="font-semibold text-gray-800">
                      {selectedTest.test_name || selectedTest.name || selectedTest.testName || 'Lab Test'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTest.status)}`}>
                      {getStatusLabel(selectedTest.status)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">
                      {formatDate(selectedTest.created_at || selectedTest.test_date || selectedTest.date)}
                    </p>
                  </div>
                  {(selectedTest.ordered_by || selectedTest.doctor_name) && (
                    <div>
                      <p className="text-sm text-gray-500">Ordered By</p>
                      <p className="font-medium">{selectedTest.ordered_by || selectedTest.doctor_name}</p>
                    </div>
                  )}
                  {(selectedTest.urgency || selectedTest.priority) && (
                    <div>
                      <p className="text-sm text-gray-500">Urgency</p>
                      <p className="font-medium">{selectedTest.urgency || selectedTest.priority}</p>
                    </div>
                  )}
                  {selectedTest.lab_name && (
                    <div>
                      <p className="text-sm text-gray-500">Laboratory</p>
                      <p className="font-medium">{selectedTest.lab_name}</p>
                    </div>
                  )}
                </div>

                {/* Test Parameters / Results */}
                {Array.isArray(selectedTest.parameters) && selectedTest.parameters.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-500 mb-3">
                      Test Parameters ({selectedTest.parameters.length})
                    </p>
                    <div className="space-y-2">
                      {selectedTest.parameters.map((param, idx) => {
                        const paramStatus = param.status || param.flag
                        const isHigh = paramStatus && ['HIGH', 'ABNORMAL', 'H'].includes(paramStatus.toUpperCase())
                        const isLow = paramStatus && ['LOW', 'L'].includes(paramStatus.toUpperCase())
                        const valueColor = isHigh || isLow ? 'text-red-600' : 'text-green-600'
                        return (
                          <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium text-sm text-gray-800">{param.name || param.parameter_name}</p>
                              {(param.normal_range || param.reference_range) && (
                                <p className="text-xs text-gray-400">
                                  Normal: {param.normal_range || param.reference_range}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`font-semibold text-sm ${valueColor}`}>
                                {param.value}{param.unit ? ` ${param.unit}` : ''}
                              </span>
                              {paramStatus && (
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  isHigh || isLow ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                }`}>
                                  {paramStatus}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Notes / Interpretation */}
                {(selectedTest.notes || selectedTest.interpretation || selectedTest.remarks) && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-500 mb-2">Doctor's Notes</p>
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                      <p className="text-gray-700 text-sm">
                        {selectedTest.notes || selectedTest.interpretation || selectedTest.remarks}
                      </p>
                    </div>
                  </div>
                )}

                {/* No parameters message */}
                {(!selectedTest.parameters || selectedTest.parameters.length === 0) &&
                  selectedTest.status?.toUpperCase() !== 'COMPLETED' && (
                  <div className="border-t pt-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
                      <i className="fas fa-hourglass-half text-yellow-500"></i>
                      <p className="text-yellow-800 text-sm">
                        Results are not yet available. Status: <strong>{getStatusLabel(selectedTest.status)}</strong>
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  {selectedTest.status?.toUpperCase() === 'COMPLETED' && (
                    <button
                      onClick={() => handleDownload(selectedTest)}
                      disabled={downloadingId === (selectedTest.id || selectedTest.test_id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      <i className={`fas mr-2 ${downloadingId ? 'fa-circle-notch fa-spin' : 'fa-download'}`}></i>
                      Download Report
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedTest(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TestResults