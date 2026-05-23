import React, { useState, useEffect } from 'react'
import DataTable from '../../../../components/ui/Tables/DataTable'
import SearchBar from '../../../../components/common/SearchBar/SearchBar'
import Button from '../../../../components/common/Button/Button'
import Modal from '../../../../components/common/Modal/Modal'
import LoadingSpinner from '../../../../components/common/LoadingSpinner/LoadingSpinner'
import { apiFetch } from '../../../../services/apiClient'
const QualityControl = () => {
  const [loading, setLoading] = useState(true)
  const [qcRuns, setQcRuns] = useState([])
  const [qcMaterials, setQcMaterials] = useState([])
  const [qcRules, setQcRules] = useState([])
  const [qcStats, setQcStats] = useState(null)
  const [workflowActions, setWorkflowActions] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewRunModal, setShowNewRunModal] = useState(false)
  const [showMaterialModal, setShowMaterialModal] = useState(false)
  const [showRuleModal, setShowRuleModal] = useState(false)
  const [selectedQCRun, setSelectedQCRun] = useState(null)
  const [newQCRun, setNewQCRun] = useState({
    test: '',
    material: '',
    lotNumber: '',
    value: '',
    operator: '',
    date: ''
  })

  useEffect(() => {
    loadQCData()
  }, [])

  const loadQCData = async () => {
    setLoading(true)
    try {
      const response = await apiFetch('/api/v1/lab/quality-control', {
        method: 'GET'
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data?.message || data?.detail || 'Failed to fetch QC dashboard data')
      }

      const mappedRuns = (data.runs || data.recent_runs || data.qcRuns || data.qc_runs || []).map(r => ({
        id: r.qc_id || r.id || r.qc_run_id || r.run_id || '',
        test: r.test || r.test_name || '',
        material: r.qc_material || r.material || r.material_name || '',
        lotNumber: r.lot_number || r.lotNumber || '',
        date: r.date || r.created_at || '',
        operator: r.operator || r.operator_name || '',
        status: (r.status || 'passed').toLowerCase(),
        value: r.observed_value !== undefined ? r.observed_value : r.value || '',
        target: r.target || '',
        sd: r.sd || r.standard_deviation || '',
        ruleViolations: r.rule_violations || r.ruleViolations || 0,
        chartData: r.chart_data || r.chartData || []
      }))

      const mappedMaterials = (data.materials_inventory || data.materials || data.qcMaterials || data.qc_materials || []).map(m => ({
        id: m.id || m.material_id || '',
        name: m.name || m.material_name || '',
        type: m.type || m.material_type || '',
        manufacturer: m.manufacturer || '',
        lotNumber: m.lot_number || m.lotNumber || '',
        expiryDate: m.expiry_date || m.expiryDate || '',
        storage: m.storage || m.storage_conditions || '',
        quantity: m.quantity || 0,
        status: m.status || 'active'
      }))

      const mappedRules = (data.rules || data.qcRules || data.qc_rules || []).map(rule => ({
        id: rule.id || rule.rule_id || '',
        name: rule.name || rule.rule_name || '',
        description: rule.description || '',
        type: rule.type || rule.rule_type || '',
        action: rule.action || '',
        priority: rule.priority || ''
      }))

      setQcRuns(mappedRuns)
      setQcMaterials(mappedMaterials)
      setQcRules(mappedRules)
      setQcStats(data.stats || null)
      setWorkflowActions(data.workflow_actions || [])
    } catch (err) {
      console.error('Failed to load QC dashboard:', err)
      // On error, fallback to empty arrays so UI handles it gracefully
      setQcRuns([])
      setQcMaterials([])
      setQcRules([])
      setQcStats(null)
      setWorkflowActions([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (term) => {
    setSearchTerm(term)
  }

  const handleNewQCRun = async () => {
    if (!newQCRun.test || !newQCRun.material || !newQCRun.lotNumber || !newQCRun.value) {
      alert('Please fill in all required fields.')
      return
    }

    try {
      setLoading(true)
      const payload = {
        test: newQCRun.test,
        qc_material: newQCRun.material,
        lot_number: newQCRun.lotNumber,
        observed_value: parseFloat(newQCRun.value),
        operator: newQCRun.operator || 'Current User',
        date: newQCRun.date || new Date().toISOString().split('T')[0]
      }

      const response = await apiFetch('/api/v1/lab/quality-control/run', {
        method: 'POST',
        body: payload
      })
      
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data?.message || data?.detail || 'Failed to record QC run')
      }

      setShowNewRunModal(false)
      setNewQCRun({
        test: '',
        material: '',
        lotNumber: '',
        value: '',
        operator: '',
        date: ''
      })

      // Refresh the dashboard to update tables
      await loadQCData()
      const successMsg = data.message || 'QC Run recorded successfully!'
      const details = data.qc_id ? `\nID: ${data.qc_id}\nStatus: ${data.status || 'UNKNOWN'}` : ''
      alert(`${successMsg}${details}`)

    } catch (err) {
      console.error('Failed to record QC run:', err)
      alert(err?.message || 'Failed to record QC run')
    } finally {
      setLoading(false)
    }
  }

  const handleApproveQCRun = (runId) => {
    setQcRuns(qcRuns.map(run => 
      run.id === runId ? { ...run, status: 'approved' } : run
    ))
    alert(`QC Run ${runId} approved for use`)
  }

  const handleRejectQCRun = (runId) => {
    setQcRuns(qcRuns.map(run => 
      run.id === runId ? { ...run, status: 'rejected' } : run
    ))
    alert(`QC Run ${runId} rejected. Investigation required.`)
  }

  const handleViewChart = (runId) => {
    const run = qcRuns.find(r => r.id === runId)
    if (run) {
      alert(`QC Chart for ${run.test}\nValue: ${run.value} | Target: ${run.target} ± ${run.sd}`)
      // In real app, show QC chart modal
    }
  }

  const handleAddMaterial = () => {
    alert('Add QC Material functionality')
    setShowMaterialModal(false)
  }

  const handleAddRule = () => {
    alert('Add QC Rule functionality')
    setShowRuleModal(false)
  }

  const handleWorkflowAction = async (action) => {
    try {
      setLoading(true)
      const response = await apiFetch(`/api/v1/lab/quality-control/workflow/${action}`, {
        method: 'POST'
      })
      
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data?.message || data?.detail || `Failed to trigger ${action}`)
      }

      alert(`Workflow '${action}' triggered successfully!\n${data.message || ''}`)
    } catch (err) {
      console.error(`Failed to trigger workflow ${action}:`, err)
      alert(err?.message || `Failed to trigger workflow ${action}`)
    } finally {
      setLoading(false)
    }
  }

  const filteredQCRuns = qcRuns.filter(run =>
    run.test.toLowerCase().includes(searchTerm.toLowerCase()) ||
    run.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
    run.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const testOptions = ['CBC', 'Glucose', 'Creatinine', 'ALT', 'AST', 'Bilirubin', 'Cholesterol', 'Triglycerides', 'Urea', 'Sodium', 'Potassium']
  const materialOptions = qcMaterials.map(m => m.name)
  if (loading) return <LoadingSpinner />

  return (
    <>
        <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-700">Quality Control Workflows</h2>
          <p className="text-gray-500">Manage QC runs, materials, rules, and compliance tracking</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            icon="fas fa-vial"
            onClick={() => setShowNewRunModal(true)}
          >
            New QC Run
          </Button>
          <Button
            variant="primary"
            icon="fas fa-chart-line"
            onClick={loadQCData}
          >
            Refresh Data
          </Button>
        </div>
      </div>

{/* QC Stats - Glass Morphism Design */}
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Total QC Runs Card */}
  <div className="relative bg-gradient-to-br from-white to-blue-50 p-5 rounded-2xl border border-blue-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
    <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200 rounded-full -translate-y-8 translate-x-8 opacity-20"></div>
    <div className="absolute bottom-0 left-0 w-16 h-16 bg-blue-300 rounded-full translate-y-8 -translate-x-8 opacity-10"></div>

    <div className="relative flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Total QC Runs</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">
          {qcStats?.total_qc_runs ?? (qcStats ? ((qcStats.passed_runs || 0) + (qcStats.warning_runs || 0) + (qcStats.failed_runs || 0)) : qcRuns.length)}
        </p>
      </div>
      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
        <i className="fas fa-vial text-white text-lg"></i>
      </div>
    </div>
    <div className="relative mt-4 pt-3 border-t border-blue-100">
      <p className="text-xs text-blue-700 font-medium">All quality control tests</p>
    </div>
  </div>

  {/* Passed Runs Card */}
  <div className="relative bg-gradient-to-br from-white to-emerald-50 p-5 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
    <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-200 rounded-full -translate-y-8 translate-x-8 opacity-20"></div>
    <div className="absolute bottom-0 left-0 w-16 h-16 bg-emerald-300 rounded-full translate-y-8 -translate-x-8 opacity-10"></div>

    <div className="relative flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Passed Runs</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">
          {qcStats?.passed_runs ?? qcRuns.filter(r => r.status === 'passed' || r.status === 'approved').length}
        </p>
      </div>
      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
        <i className="fas fa-check-circle text-white text-lg"></i>
      </div>
    </div>
    <div className="relative mt-4 pt-3 border-t border-emerald-100">
      <p className="text-xs text-emerald-700 font-medium">Successful QC tests</p>
    </div>
  </div>

  {/* Warning Runs Card */}
  <div className="relative bg-gradient-to-br from-white to-yellow-50 p-5 rounded-2xl border border-yellow-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
    <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-200 rounded-full -translate-y-8 translate-x-8 opacity-20"></div>
    <div className="absolute bottom-0 left-0 w-16 h-16 bg-yellow-300 rounded-full translate-y-8 -translate-x-8 opacity-10"></div>

    <div className="relative flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wider">Warning Runs</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">
          {qcStats?.warning_runs ?? qcRuns.filter(r => r.status === 'warning').length}
        </p>
      </div>
      <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-md">
        <i className="fas fa-exclamation-triangle text-white text-lg"></i>
      </div>
    </div>
    <div className="relative mt-4 pt-3 border-t border-yellow-100">
      <p className="text-xs text-yellow-700 font-medium">Requires attention</p>
    </div>
  </div>

  {/* Failed Runs Card */}
  <div className="relative bg-gradient-to-br from-white to-red-50 p-5 rounded-2xl border border-red-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
    <div className="absolute top-0 right-0 w-20 h-20 bg-red-200 rounded-full -translate-y-8 translate-x-8 opacity-20"></div>
    <div className="absolute bottom-0 left-0 w-16 h-16 bg-red-300 rounded-full translate-y-8 -translate-x-8 opacity-10"></div>

    <div className="relative flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">Failed Runs</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">
          {qcStats?.failed_runs ?? qcRuns.filter(r => r.status === 'failed' || r.status === 'rejected').length}
        </p>
      </div>
      <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-md">
        <i className="fas fa-times-circle text-white text-lg"></i>
      </div>
    </div>
    <div className="relative mt-4 pt-3 border-t border-red-100">
      <p className="text-xs text-red-700 font-medium">QC test failures</p>
    </div>
  </div>
</div>

      {/* QC Runs Table */}
      <div className="bg-white rounded border card-shadow overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">QC Runs</h3>
            <p className="text-sm text-gray-500">Recent quality control runs and their status</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMaterialModal(true)}
            >
              Manage Materials
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRuleModal(true)}
            >
              Manage Rules
            </Button>
          </div>
        </div>
        <DataTable
          columns={[
            { key: 'id', title: 'QC ID', sortable: true },
            { key: 'test', title: 'Test', sortable: true },
            { key: 'material', title: 'QC Material', sortable: true },
            { key: 'lotNumber', title: 'Lot Number', sortable: true },
            { key: 'date', title: 'Date', sortable: true },
            { key: 'operator', title: 'Operator', sortable: true },
            { 
              key: 'status', 
              title: 'Status', 
              sortable: true,
              render: (value) => (
                <span className={`px-2 py-1 rounded-full text-xs ${
                  value === 'passed' || value === 'approved' ? 'bg-green-100 text-green-800' :
                  value === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                  value === 'failed' || value === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </span>
              )
            },
            { key: 'value', title: 'Value', sortable: true },
            { key: 'target', title: 'Target', sortable: true },
            { key: 'sd', title: 'SD', sortable: true },
            { key: 'ruleViolations', title: 'Rule Violations', sortable: true },
            {
              key: 'actions',
              title: 'Actions',
              render: (_, row) => (
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleViewChart(row.id)
                    }}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                    title="View QC Chart"
                  >
                    <i className="fas fa-chart-line"></i>
                  </button>
                  {row.status === 'passed' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleApproveQCRun(row.id)
                      }}
                      className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                      title="Approve Run"
                    >
                      <i className="fas fa-check"></i>
                    </button>
                  )}
                  {(row.status === 'warning' || row.status === 'failed') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRejectQCRun(row.id)
                      }}
                      className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                      title="Reject Run"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>
              )
            }
          ]}
          data={filteredQCRuns}
          onRowClick={(run) => setSelectedQCRun(run)}
          emptyMessage="No QC runs found. Start by recording a new QC run."
        />
      </div>

      {/* Selected QC Run Details */}
      {selectedQCRun && (
        <div className="bg-white p-6 rounded border card-shadow">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-semibold">QC Run Details: {selectedQCRun.id}</h3>
              <p className="text-gray-600">{selectedQCRun.test} • {selectedQCRun.material} • Lot: {selectedQCRun.lotNumber}</p>
            </div>
            <div className="flex gap-2">
              <button
                className="px-4 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                onClick={() => handleViewChart(selectedQCRun.id)}
              >
                View Chart
              </button>
              <button
                className="px-4 py-2 bg-green-100 text-green-800 rounded hover:bg-green-200"
                onClick={() => alert('Generate QC report')}
              >
                Generate Report
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-500">Observed Value</p>
              <p className="text-2xl font-bold">{selectedQCRun.value}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-500">Target Value</p>
              <p className="text-2xl font-bold">{selectedQCRun.target}</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-500">Standard Deviation</p>
              <p className="text-2xl font-bold">±{selectedQCRun.sd}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-500">Deviation from Mean</p>
              <p className="text-2xl font-bold">
                {((parseFloat(selectedQCRun.value) - parseFloat(selectedQCRun.target)) / parseFloat(selectedQCRun.sd)).toFixed(1)} SD
              </p>
            </div>
          </div>

          {/* QC Rules Violations */}
          {selectedQCRun.ruleViolations > 0 ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 mb-2">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                QC Rule Violations Detected ({selectedQCRun.ruleViolations})
              </h4>
              <ul className="list-disc list-inside text-sm text-red-700">
                <li>1-3s Rule: Point beyond 3 SD from mean</li>
                <li>Investigation required before releasing patient results</li>
              </ul>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">
                <i className="fas fa-check-circle mr-2"></i>
                No QC Rule Violations Detected
              </h4>
              <p className="text-sm text-green-700">All QC results are within acceptable limits</p>
            </div>
          )}
        </div>
      )}

      {/* QC Materials */}
      <div className="bg-white rounded border card-shadow overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">QC Materials Inventory</h3>
          <p className="text-sm text-gray-500">Available quality control materials and their status</p>
        </div>
        <DataTable
          columns={[
            { key: 'name', title: 'Material Name', sortable: true },
            { key: 'type', title: 'Type', sortable: true },
            { key: 'manufacturer', title: 'Manufacturer', sortable: true },
            { key: 'lotNumber', title: 'Lot Number', sortable: true },
            { key: 'expiryDate', title: 'Expiry Date', sortable: true },
            { key: 'storage', title: 'Storage', sortable: true },
            { key: 'quantity', title: 'Quantity', sortable: true },
            { 
              key: 'status', 
              title: 'Status', 
              sortable: true,
              render: (value) => (
                <span className={`px-2 py-1 rounded-full text-xs ${
                  value === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </span>
              )
            }
          ]}
          data={qcMaterials}
          emptyMessage="No QC materials found."
        />
      </div>

      {/* QC Rules */}
      <div className="bg-white rounded border card-shadow overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">QC Rules Configuration</h3>
          <p className="text-sm text-gray-500">Westgard rules and their configurations</p>
        </div>
        <DataTable
          columns={[
            { key: 'name', title: 'Rule Name', sortable: true },
            { key: 'description', title: 'Description', sortable: true },
            { key: 'type', title: 'Type', sortable: true },
            { key: 'action', title: 'Action Required', sortable: true },
            { 
              key: 'priority', 
              title: 'Priority', 
              sortable: true,
              render: (value) => (
                <span className={`px-2 py-1 rounded-full text-xs ${
                  value === 'high' ? 'bg-red-100 text-red-800' :
                  value === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </span>
              )
            }
          ]}
          data={qcRules}
          emptyMessage="No QC rules configured."
        />
      </div>

      {/* QC Workflow Actions */}
      <div className="bg-white p-6 rounded border card-shadow">
        <h3 className="text-lg font-semibold mb-4">QC Workflow Actions</h3>
        {workflowActions && workflowActions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {workflowActions.map(action => {
              const actionDetails = {
                'LEVEY_JENNINGS_CHART': {
                  title: 'Levey-Jennings Chart',
                  desc: 'Generate QC charts for trend analysis',
                  icon: 'fas fa-chart-bar text-blue-600',
                  bgBase: 'bg-blue-100',
                  hoverBase: 'hover:bg-blue-50',
                  textColor: 'text-blue-600 hover:text-blue-800',
                  btnText: 'View Charts →'
                },
                'QC_COMPLIANCE_REPORT': {
                  title: 'QC Compliance Report',
                  desc: 'Generate compliance reports for audits',
                  icon: 'fas fa-clipboard-check text-green-600',
                  bgBase: 'bg-green-100',
                  hoverBase: 'hover:bg-green-50',
                  textColor: 'text-green-600 hover:text-green-800',
                  btnText: 'Generate Report →'
                },
                'QC_ALERTS': {
                  title: 'QC Alerts',
                  desc: 'Configure alerts for QC violations',
                  icon: 'fas fa-bell text-purple-600',
                  bgBase: 'bg-purple-100',
                  hoverBase: 'hover:bg-purple-50',
                  textColor: 'text-purple-600 hover:text-purple-800',
                  btnText: 'Configure Alerts →'
                }
              }

              const details = actionDetails[action] || {
                title: action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                desc: 'Execute this workflow action',
                icon: 'fas fa-cog text-gray-600',
                bgBase: 'bg-gray-100',
                hoverBase: 'hover:bg-gray-50',
                textColor: 'text-gray-600 hover:text-gray-800',
                btnText: 'Execute →'
              }

              return (
                <div key={action} className={`p-4 border rounded-lg ${details.hoverBase} transition-colors`}>
                  <div className="flex items-center mb-3">
                    <div className={`p-2 ${details.bgBase} rounded-lg mr-3`}>
                      <i className={details.icon}></i>
                    </div>
                    <h4 className="font-semibold">{details.title}</h4>
                  </div>
                  <p className="text-sm text-gray-600">{details.desc}</p>
                  <button 
                    className={`mt-3 ${details.textColor} text-sm`}
                    onClick={() => handleWorkflowAction(action)}
                  >
                    {details.btnText}
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No workflow actions available.</p>
        )}
      </div>
    </div>
          
          
      {/* New QC Run Modal */}
      <Modal
        isOpen={showNewRunModal}
        onClose={() => setShowNewRunModal(false)}
        title="Record New QC Run"
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 p-3 rounded">
            <p className="text-sm text-blue-800">
              <i className="fas fa-info-circle mr-2"></i>
              Record quality control run for a specific test and material
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Test *
              </label>
              <select
                className="w-full px-3 py-2 border rounded-lg"
                value={newQCRun.test}
                onChange={(e) => setNewQCRun({...newQCRun, test: e.target.value})}
                required
              >
                <option value="">Select test</option>
                {testOptions.map(test => (
                  <option key={test} value={test}>{test}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                QC Material *
              </label>
              <select
                className="w-full px-3 py-2 border rounded-lg"
                value={newQCRun.material}
                onChange={(e) => setNewQCRun({...newQCRun, material: e.target.value})}
                required
              >
                <option value="">Select material</option>
                {materialOptions.map(material => (
                  <option key={material} value={material}>{material}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lot Number *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Enter lot number"
                value={newQCRun.lotNumber}
                onChange={(e) => setNewQCRun({...newQCRun, lotNumber: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observed Value *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Enter numeric value"
                value={newQCRun.value}
                onChange={(e) => setNewQCRun({...newQCRun, value: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Operator
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Enter operator name"
                value={newQCRun.operator}
                onChange={(e) => setNewQCRun({...newQCRun, operator: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded-lg"
                value={newQCRun.date}
                onChange={(e) => setNewQCRun({...newQCRun, date: e.target.value})}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowNewRunModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleNewQCRun}
              disabled={!newQCRun.test || !newQCRun.material || !newQCRun.lotNumber || !newQCRun.value}
            >
              Record QC Run
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default QualityControl