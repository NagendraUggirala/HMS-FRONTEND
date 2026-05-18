import React, { useState, useEffect } from 'react'
import html2pdf from 'html2pdf.js'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { apiFetch } from '../../../../services/apiClient'

import DataTable from '../../../../components/ui/Tables/DataTable'
import SearchBar from '../../../../components/common/SearchBar/SearchBar'
import Button from '../../../../components/common/Button/Button'
import Modal from '../../../../components/common/Modal/Modal'
import LoadingSpinner from '../../../../components/common/LoadingSpinner/LoadingSpinner'
import {
    Print as PrintIcon,
    Download as DownloadIcon,
    Description as DescriptionIcon,
    PictureAsPdf as PictureAsPdfIcon,
    CheckCircle as CheckCircleIcon,
    AccessTime as AccessTimeIcon,
    Share as ShareIcon,
    Visibility as VisibilityIcon,
    Check as CheckIcon,
    FileDownload as FileDownloadIcon,
    Palette as PaletteIcon,
    KeyboardArrowDown as KeyboardArrowDownIcon,
    Person as PersonIcon,
    Science as ScienceIcon,
    AssignmentTurnedIn as AssignmentTurnedInIcon,
    DeleteOutline as DeleteOutlineIcon,
    Edit as EditIcon
} from '@mui/icons-material'

const ReportGeneration = () => {
    const [loading, setLoading] = useState(true)
    const [reports, setReports] = useState([])
    const [readyTests, setReadyTests] = useState([])
    const [loadingReadyTests, setLoadingReadyTests] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [showPreviewModal, setShowPreviewModal] = useState(false)
    const [showGenerateModal, setShowGenerateModal] = useState(false)
    const [showPatientDropdown, setShowPatientDropdown] = useState(false)
    const [currentReport, setCurrentReport] = useState(null)
    const [template, setTemplate] = useState('STANDARD')
    const [selectedReports, setSelectedReports] = useState([])
    const [showExportModal, setShowExportModal] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editingReportId, setEditingReportId] = useState(null)

    const [exportData, setExportData] = useState({
        fromDate: new Date().toISOString().split('T')[0],
        toDate: new Date().toISOString().split('T')[0],
        format: 'pdf'
    })

    const [formData, setFormData] = useState({
        sourceTestId: '',
        patientName: '',
        patientId: '',
        age: '',
        gender: 'Male',
        testType: '',
        sampleDate: new Date().toISOString().split('T')[0],
        reportDate: new Date().toISOString().split('T')[0],
        results: [
            { parameter: 'Hemoglobin', result: '', unit: 'g/dL', referenceRange: '13.5-17.5', status: 'Normal' }
        ],
        verifiedBy: '',
        priority: 'Normal',
        status: 'READY',
        interpretation: '',
        accessCode: `ACC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    })

    const parameterOptions = [
        // CBC Parameters
        { name: 'Hemoglobin', unit: 'g/dL', range: '13.5-17.5' },
        { name: 'WBC Count', unit: 'cells/µL', range: '4,000-11,000' },
        { name: 'RBC Count', unit: 'million/µL', range: '4.5-5.9' },
        { name: 'Platelets', unit: 'cells/µL', range: '150,000-450,000' },
        { name: 'Hematocrit', unit: '%', range: '41-50' },
        { name: 'MCV', unit: 'fL', range: '80-100' },
        { name: 'Glucose (Fasting)', unit: 'mg/dL', range: '70-100' },
        { name: 'Glucose (Post-Prandial)', unit: 'mg/dL', range: '<140' },
        { name: 'HbA1c', unit: '%', range: '<5.7' },
        { name: 'Calcium', unit: 'mg/dL', range: '8.5-10.2' },
        { name: 'Sodium', unit: 'mEq/L', range: '135-145' },
        { name: 'Potassium', unit: 'mEq/L', range: '3.5-5.0' },
        { name: 'Total Cholesterol', unit: 'mg/dL', range: '<200' },
        { name: 'LDL Cholesterol', unit: 'mg/dL', range: '<100' },
        { name: 'HDL Cholesterol', unit: 'mg/dL', range: '>40' },
        { name: 'Triglycerides', unit: 'mg/dL', range: '<150' },
        { name: 'Creatinine', unit: 'mg/dL', range: '0.7-1.3' },
        { name: 'Blood Urea Nitrogen (BUN)', unit: 'mg/dL', range: '7-20' },
        { name: 'Uric Acid', unit: 'mg/dL', range: '3.4-7.0' },
        { name: 'Total Bilirubin', unit: 'mg/dL', range: '0.1-1.2' },
        { name: 'Direct Bilirubin', unit: 'mg/dL', range: '<0.3' },
        { name: 'SGOT (AST)', unit: 'U/L', range: '8-48' },
        { name: 'SGPT (ALT)', unit: 'U/L', range: '7-55' },
        { name: 'Alkaline Phosphatase', unit: 'U/L', range: '40-129' },
        { name: 'Total Protein', unit: 'g/dL', range: '6.0-8.3' },
        { name: 'Albumin', unit: 'g/dL', range: '3.5-5.0' },
        { name: 'TSH', unit: 'µIU/mL', range: '0.4-4.0' },
        { name: 'Free T3', unit: 'pg/mL', range: '2.3-4.1' },
        { name: 'Free T4', unit: 'ng/dL', range: '0.9-2.0' },
        { name: 'Vitamin D', unit: 'ng/mL', range: '30-100' },
        { name: 'Vitamin B12', unit: 'pg/mL', range: '200-900' },
        { name: 'C-Reactive Protein (CRP)', unit: 'mg/L', range: '<10' }
    ]



    useEffect(() => {
        loadReportData()
    }, [searchTerm, template])

    useEffect(() => {
        loadReadyTests()
    }, [])

    const loadReadyTests = async () => {
        setLoadingReadyTests(true)
        try {
            console.log('[ReportGeneration] Calling ready-tests API endpoint')

            const response = await apiFetch('/api/v1/lab/report-generation/ready-tests', {
                method: 'GET'
            })

            console.log('[ReportGeneration] Ready Tests Response Status:', response.status)

            const data = await response.json().catch(() => ({}))
            console.log('[ReportGeneration] Ready Tests Response Data:', data)

            if (!response.ok) {
                const detail = data?.detail?.message || data?.detail || data?.message || `API Error: ${response.status}`
                console.error('[ReportGeneration] Ready Tests API Error:', detail)
                throw new Error(typeof detail === 'string' ? detail : 'Failed to fetch ready tests')
            }

            // Parse response based on backend structure
            let testsList = []

            // Primary: rows field (standard response from backend)
            if (data.rows && Array.isArray(data.rows)) {
                testsList = data.rows
                console.log('[ReportGeneration] Ready tests has rows field (backend standard format)')
            }
            // Fallback: direct array
            else if (Array.isArray(data)) {
                testsList = data
                console.log('[ReportGeneration] Ready tests is direct array')
            }
            // Fallback: data field
            else if (data.data && Array.isArray(data.data)) {
                testsList = data.data
                console.log('[ReportGeneration] Ready tests has data field')
            } else {
                console.warn('[ReportGeneration] Could not find array in ready-tests response, available keys:', Object.keys(data))
            }

            console.log('[ReportGeneration] Ready tests list (raw from API):', testsList)

            // Map backend fields to component format
            const formattedTests = testsList.map((test) => ({
                id: test.test_id || test.id || 'Unknown',
                patientName: test.patient_name || test.patientName || 'Unknown Patient',
                patientId: test.patient_ref || test.patient_id || test.patientId || 'Unknown ID',
                testType: test.test_type || test.testType || 'Unknown Test',
                sampleDate: test.registered_date || test.sample_date || test.sampleDate || new Date().toISOString().split('T')[0],
                status: test.status || 'Pending',
                doctorName: test.doctor_name || test.doctorName || '',
                comments: test.comments || '',
                priority: test.priority === 'ROUTINE' ? 'Normal' : (test.priority === 'URGENT' ? 'Urgent' : (test.priority || 'Normal')),
                results: test.results || test.parameters || [],
                ...test // Include all original fields
            }))

            console.log('[ReportGeneration] Formatted ready tests:', formattedTests)
            setReadyTests(formattedTests)
        } catch (error) {
            console.error('[ReportGeneration] Error loading ready tests:', error)
            setReadyTests([])
        } finally {
            setLoadingReadyTests(false)
        }
    }

    const loadReportData = async () => {
        setLoading(true)
        try {
            // Build query params for list_reports endpoint
            const params = new URLSearchParams()
            if (searchTerm.trim()) params.append('search', searchTerm.trim())
            params.append('template', template)

            const queryString = params.toString()
            const endpoint = `/api/v1/lab/report-generation?${queryString}`

            console.log('[ReportGeneration] Calling API endpoint:', endpoint)
            console.log('[ReportGeneration] Query params:', { search: searchTerm, template })

            const response = await apiFetch(endpoint, {
                method: 'GET'
            })

            console.log('[ReportGeneration] API Response Status:', response.status)

            const data = await response.json().catch(() => ({}))
            console.log('[ReportGeneration] API Response Data:', data)

            if (!response.ok) {
                const detail = data?.detail?.message || data?.detail || data?.message || `API Error: ${response.status}`
                console.error('[ReportGeneration] API Error Detail:', detail)
                throw new Error(typeof detail === 'string' ? detail : 'Failed to fetch reports')
            }

            // Parse response based on backend structure (ReportGenerationListResponse)
            let reportsList = []

            // Primary: rows field (standard response from backend)
            if (data.rows && Array.isArray(data.rows)) {
                reportsList = data.rows
                console.log('[ReportGeneration] Response has rows field (backend standard format)')
            }
            // Fallback: direct array
            else if (Array.isArray(data)) {
                reportsList = data
                console.log('[ReportGeneration] Response is direct array')
            }
            // Fallback: data field
            else if (data.data && Array.isArray(data.data)) {
                reportsList = data.data
                console.log('[ReportGeneration] Response has data field (array)')
            }
            // Fallback: reports field
            else if (data.reports && Array.isArray(data.reports)) {
                reportsList = data.reports
                console.log('[ReportGeneration] Response has reports field')
            } else {
                console.warn('[ReportGeneration] Could not find array in response, available keys:', Object.keys(data))
            }

            console.log('[ReportGeneration] Reports list (raw from API):', reportsList)

            // Map backend fields to component format
            const formattedReports = reportsList.map((report) => ({
                // Backend provides: report_id, patient_ref, patient_name, doctor_name, test_type, template, report_type, completion_date, status, verified_by
                id: report.report_id || report.id || 'Unknown',
                testId: report.test_type || 'Unknown Test',
                patientName: report.patient_name || 'Unknown Patient',
                patientId: report.patient_ref || 'Unknown ID',
                doctorName: report.doctor_name || '',
                reportType: report.report_type || 'Lab Report',
                age: report.age || '',
                gender: report.gender || '',
                testType: report.test_type || 'Unknown Test',
                template: report.template || template || 'STANDARD',
                sampleDate: report.sample_date || new Date().toISOString().split('T')[0],
                completionDate: report.completion_date || new Date().toISOString().split('T')[0],
                status: report.status 
                    ? (report.status.toUpperCase() === 'READY' ? 'Ready' 
                       : report.status.toUpperCase() === 'PENDING_REVIEW' ? 'Pending Review' 
                       : report.status.toUpperCase() === 'DRAFT' ? 'Draft' 
                       : report.status) 
                    : 'Ready',
                verifiedBy: report.verified_by || '',
                format: report.format || 'PDF',
                accessCode: report.access_code || `ACC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                results: report.results || report.parameters || [],
                interpretation: report.interpretation || ''
            }))

            console.log('[ReportGeneration] Formatted reports:', formattedReports)
            setReports(formattedReports)
        } catch (error) {
            console.error('[ReportGeneration] Error loading report data:', error)
            setReports([])
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (term) => {
        setSearchTerm(term)
    }

    const handleGenerateReport = () => {
        resetFormData()
        setShowGenerateModal(true)
    }

    const handleFormChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => {
            let updated = { ...prev, [name]: value }

            // Auto-fill if patient is selected
            if (name === 'patientName') {
                const patient = patientOptions.find(p => p.name === value)
                if (patient) {
                    updated.patientId = patient.id
                    updated.age = patient.age
                    updated.gender = patient.gender

                    const patientReport = reports.find(r => r.patientName === value)
                    if (patientReport) {
                        updated.testType = patientReport.testType || updated.testType
                        updated.verifiedBy = patientReport.verifiedBy || updated.verifiedBy

                        if (patientReport.testType === 'CBC') {
                            updated.results = parameterOptions.filter(p => ['Hemoglobin', 'WBC Count', 'RBC Count', 'Platelets'].includes(p.name)).map(p => ({ parameter: p.name, result: '', unit: p.unit, referenceRange: p.range, status: 'Normal' }))
                        } else if (patientReport.testType === 'Lipid Profile') {
                            updated.results = parameterOptions.filter(p => ['Total Cholesterol', 'LDL Cholesterol', 'HDL Cholesterol', 'Triglycerides'].includes(p.name)).map(p => ({ parameter: p.name, result: '', unit: p.unit, referenceRange: p.range, status: 'Normal' }))
                        } else if (patientReport.testType === 'Liver Function') {
                            updated.results = parameterOptions.filter(p => ['Total Bilirubin', 'SGOT (AST)', 'SGPT (ALT)', 'Alkaline Phosphatase'].includes(p.name)).map(p => ({ parameter: p.name, result: '', unit: p.unit, referenceRange: p.range, status: 'Normal' }))
                        }
                    }
                }
            }
            return updated
        })
    }

    const generateInterpretation = (results, data) => {
        const abnormal = results.filter(r => r.status && r.status !== 'Normal')
        if (abnormal.length === 0) {
            return `All parameters are within normal limits for ${data.testType || 'the requested test'}. No abnormalities detected.`
        }
        return `Abnormalities noted in ${abnormal.map(a => a.parameter).join(', ')}. Please refer to the specific parameters for details. Clinical correlation is recommended.`
    }

    const handleResultChange = (index, field, value) => {
        const newResults = formData.results.map((r, i) => {
            if (i !== index) return { ...r }
            const updated = { ...r, [field]: value }

            if (field === 'parameter') {
                const param = parameterOptions.find(p => p.name === value)
                if (param) {
                    updated.unit = param.unit
                    updated.referenceRange = param.range
                }
            }

            return updated
        })

        const updatedData = {
            ...formData,
            results: newResults
        }


        setFormData(updatedData)
    }

    const addResultRow = () => {
        setFormData(prev => ({
            ...prev,
            results: [...prev.results, { parameter: 'Hemoglobin', result: '', unit: 'g/dL', referenceRange: '13.5-17.5', status: 'Normal' }]
        }))
    }

    const removeResultRow = (index) => {
        if (formData.results.length > 1) {
            const newResults = formData.results.filter((_, i) => i !== index)
            setFormData(prev => ({ ...prev, results: newResults }))
        }
    }

    const resetFormData = () => {
        setFormData({
            sourceTestId: '',
            patientName: '',
            patientId: '',
            age: '',
            gender: 'Male',
            testType: '',
            sampleDate: new Date().toISOString().split('T')[0],
            reportDate: new Date().toISOString().split('T')[0],
            results: [
                { parameter: '', result: '', unit: '', referenceRange: '', status: '' }
            ],
            verifiedBy: '',
            priority: 'Normal',
            status: 'READY',
            interpretation: '',
            accessCode: `ACC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
        })

        // IMPORTANT FIX
        setShowPatientDropdown(false)
        setIsEditing(false)
        setEditingReportId(null)
    }

    const getToday = () => new Date().toISOString().split('T')[0]

    const resetExportData = () => {
        setExportData({
            fromDate: getToday(),
            toDate: getToday(),
            format: 'pdf'
        })
    }
    const isFormValid = formData.sourceTestId.trim() !== '' &&
        formData.patientName.trim() !== '' &&
        formData.patientId.trim() !== '' &&
        formData.age !== '' &&
        formData.testType.trim() !== '' &&
        formData.verifiedBy.trim() !== '' &&
        formData.results.every(res => res.parameter && res.result.trim() !== '')

    const handleEditReport = (report) => {
        setIsEditing(true)
        setEditingReportId(report.id)

        setFormData({
            sourceTestId: report.sourceTestId || report.id || '',
            patientName: report.patientName || '',
            patientId: report.patientId || '',
            age: report.age || '',
            gender: report.gender || 'Male',
            testType: report.testType || '',
            sampleDate: report.sampleDate || report.completionDate || new Date().toISOString().split('T')[0],
            reportDate: report.reportDate || new Date().toISOString().split('T')[0],
            results: (report.results && report.results.length > 0) ? report.results : [
                { parameter: 'Hemoglobin', result: '', unit: 'g/dL', referenceRange: '13.5-17.5', status: 'Normal' }
            ],
            verifiedBy: report.verifiedBy || '',
            priority: report.priority || 'Normal',
            status: report.status === 'Pending Review' ? 'PENDING_REVIEW' : (report.status ? report.status.toUpperCase() : 'READY'),
            interpretation: report.interpretation || '',
            accessCode: report.accessCode || `ACC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
        })

        setShowGenerateModal(true)
    }

    const handleSubmitReport = async () => {
        if (!isFormValid) return;

        try {
            setLoading(true)

            // Map frontend formData to backend request fields
            const payload = {
                source_test_id: formData.sourceTestId || currentReport?.id || '',
                patient_name: formData.patientName,
                patient_ref: formData.patientId,
                age: parseInt(formData.age, 10) || 0,
                gender: formData.gender,
                test_type: formData.testType,
                sample_date: formData.sampleDate,
                report_date: formData.reportDate,
                results: formData.results.map(r => ({
                    parameter: r.parameter,
                    result: r.result,
                    unit: r.unit,
                    reference_range: r.referenceRange,
                    status: r.status
                })),
                verified_by: formData.verifiedBy,
                priority: formData.priority ? formData.priority.toUpperCase() : 'NORMAL',
                interpretation: formData.interpretation,
                template: template,
                format: 'PDF',
                status: formData.status || 'READY'
            }

            const endpoint = isEditing ? `/api/v1/lab/report-generation/${editingReportId}` : '/api/v1/lab/report-generation/generate';
            const method = isEditing ? 'PUT' : 'POST';

            console.log(`[ReportGeneration] ${isEditing ? 'Updating' : 'Generating'} report with payload:`, payload)

            const response = await apiFetch(endpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })

            const data = await response.json().catch(() => ({}))

            if (!response.ok) {
                const detail = data?.detail?.message || data?.detail || data?.message || `API Error: ${response.status}`
                throw new Error(typeof detail === 'string' ? detail : `Failed to ${isEditing ? 'update' : 'generate'} report`)
            }

            alert(`Report ${isEditing ? 'updated' : 'generated'} successfully!`)
            setShowGenerateModal(false)
            resetFormData()

            // Reload data to reflect the newly generated report
            loadReportData()
            loadReadyTests()

        } catch (error) {
            console.error('[ReportGeneration] Submit Error:', error)
            alert(`Error generating report: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    const handlePreviewReport = async (report) => {
        try {
            // Optional loading state if you want a spinner for preview fetching
            const response = await apiFetch(`/api/v1/lab/report-generation/${report.id}/preview`)
            if (response.ok) {
                const data = await response.json()
                const previewData = data.data || data

                setCurrentReport({
                    ...report,
                    ...previewData,
                    results: previewData.results || previewData.parameters || report.results || [],
                    interpretation: previewData.interpretation || report.interpretation || ''
                })
            } else {
                console.warn('[ReportGeneration] Failed to fetch report preview, falling back to local data')
                setCurrentReport(report)
            }
        } catch (error) {
            console.error('[ReportGeneration] Error fetching preview:', error)
            setCurrentReport(report)
        } finally {
            setShowPreviewModal(true)
        }
    }

    const handlePrintReport = async (reportId) => {
        try {
            setLoading(true)
            const response = await apiFetch(`/api/v1/lab/report-generation/${reportId}/print`, {
                method: 'POST'
            })

            if (!response.ok) {
                const data = await response.json().catch(() => ({}))
                throw new Error(data.detail?.message || data.detail || data.message || 'Failed to fetch print template from server')
            }

            const data = await response.json()
            const printData = data.data || data

            // If the API returns a URL to a PDF, open it
            if (printData.pdf_url || printData.url) {
                window.open(printData.pdf_url || printData.url, '_blank')
                return
            }

            // Otherwise, if it returns HTML, print it via iframe
            const htmlContent = printData.html_content || printData.html || ''

            if (!htmlContent) {
                throw new Error('No printable content received from server')
            }

            // Create or get hidden iframe for printing
            let printFrame = document.getElementById('print-frame')
            if (!printFrame) {
                printFrame = document.createElement('iframe')
                printFrame.id = 'print-frame'
                printFrame.style.position = 'fixed'
                printFrame.style.right = '0'
                printFrame.style.bottom = '0'
                printFrame.style.width = '0'
                printFrame.style.height = '0'
                printFrame.style.border = 'none'
                document.body.appendChild(printFrame)
            }

            const frameDoc = printFrame.contentWindow.document
            frameDoc.open()
            frameDoc.write(htmlContent)
            frameDoc.close()

            // Wait for content to load then print
            setTimeout(() => {
                printFrame.contentWindow.focus()
                printFrame.contentWindow.print()
            }, 500)

        } catch (error) {
            console.error('[ReportGeneration] Print Error:', error)
            alert(`Unable to print report: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    const handleDownloadReport = (reportId, format) => {
        const report = reports.find(r => r.id === reportId)
        if (!report) return

        const element = document.createElement('div')
        // Using a wrapper div to ensure perfect containment and no extra pixels
        element.innerHTML = `
            <div style="width: 210mm; min-height: 296.8mm; padding: 15mm 20mm; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #000; background: #fff; box-sizing: border-box; position: relative; display: flex; flex-direction: column;">
                <style>
                    * { box-sizing: border-box; }
                    .pdf-header { 
                        display: flex; 
                        justify-content: space-between; 
                        align-items: center; 
                        padding-bottom: 10px; 
                        margin-bottom: 15px; 
                    }
                    .brand h1 { margin: 0; color: #1e40af; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
                    .brand p { margin: 3px 0 0 0; color: #475569; font-size: 13px; }
                    .meta { text-align: right; }
                    .meta h2 { margin: 0; color: #1e40af; font-size: 18px; text-transform: uppercase; letter-spacing: 1px; }
                    .meta p { margin: 3px 0 0 0; font-weight: 700; font-size: 14px; color: #334155; }
                    
                        margin-bottom: 15px; 
                        padding: 10px 20px; 
                        border: 1px solid #e2e8f0;
                        border-radius: 10px;
                        background: #f8fafc;
                    }
                    .field { display: flex; margin-bottom: 6px; align-items: baseline; }
                    .label { width: 130px; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; flex-shrink: 0; }
                    .value { font-weight: 600; font-size: 13px; color: #0f172a; }
                    
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    thead th { 
                        color: #1e40af; 
                        font-weight: 700; 
                        font-size: 11px; 
                        text-transform: uppercase; 
                        padding: 10px 10px; 
                        text-align: left;
                        border-bottom: 2px solid #1e40af;
                    }
                    td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-size: 12px; color: #1e293b; }
                    
                    .status-n { color: #15803d; font-weight: 700; }
                    .status-a { color: #b91c1c; font-weight: 800; }
                    
                    .sec-title { 
                        font-size: 14px; 
                        color: #1e40af; 
                        font-weight: 800; 
                        border-bottom: 1.5px solid #cbd5e1; 
                        padding-bottom: 10px; 
                        margin-bottom: 10px; 
                        text-transform: uppercase;
                    }
                    .finding-box { font-size: 13px; color: #334155; line-height: 1.6; margin-bottom: 20px; text-align: justify; }
                    
                    .pdf-footer { 
                        display: flex; 
                        justify-content: space-between; 
                        align-items: flex-end; 
                        border-top: 1.5px solid #e2e8f0; 
                        padding-top: 8px; 
                    }
                    .seal-info { font-size: 10px; color: #64748b; line-height: 1.4; }
                    .signature { text-align: center; width: 220px; }
                    .line { border-top: 1.5px solid #0f172a; margin-bottom: 8px; }
                    .name { font-weight: 800; font-size: 14px; color: #0f172a; }
                    .title { font-size: 12px; color: #475569; font-style: italic; }
                    
                    /* Prevent page break inside key elements */
                    .patient-summary, .pdf-header, .sec-title, .pdf-footer, tr { page-break-inside: avoid; }
                </style>

                <div class="pdf-header">
                    <div class="brand">
                        <h1>ADVANCED DIAGNOSTIC CENTER</h1>
                        <p>Global Standard Clinical Laboratory & Research Center</p>
                        <p>123 Medical Plaza, Science District | Ph: +1 (555) 012-3456</p>
                    </div>
                    <div class="meta">
                        <h2>Clinical Report</h2>
                        <p>REF: ${report.id}</p>
                        <p style="font-size: 11px; color: #64748b; font-weight: 400; margin-top: 4px;">Date: ${report.completionDate}</p>
                    </div>
                </div>

                <div class="patient-summary">
                    <div>
                        <div class="field"><span class="label">Patient Name   </span><span class="value">${report.patientName}</span></div>
                        <div class="field"><span class="label">Patient ID     </span><span class="value">${report.patientId}</span></div>
                        <div class="field"><span class="label">Age / Gender   </span><span class="value">${report.age || '35'}Y / ${report.gender}</span></div>
                    </div>
                    <div>
                        <div class="field"><span class="label">Investigation  </span><span class="value">${report.testType}</span></div>
                        <div class="field"><span class="label">Sample Recv    </span><span class="value">${report.sampleDate || report.completionDate}</span></div>
                        <div class="field"><span class="label">Report Status  </span><span class="value" style="color: #15803d">FINAL REPORT</span></div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 40%">Test Parameter</th>
                            <th style="width: 15%">Result</th>
                            <th style="width: 15%">Unit</th>
                            <th style="width: 15%">Ref. Range</th>
                            <th style="width: 15%">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${report.results && report.results.length > 0 ? report.results.map(res => `
                            <tr>
                                <td>${res.parameter}</td>
                                <td style="font-weight: 700">${res.result || '-'}</td>
                                <td>${res.unit}</td>
                                <td>${res.referenceRange}</td>
                                <td class="${res.status === 'Normal' ? 'status-n' : 'status-a'}">${res.status}</td>
                            </tr>
                        `).join('') : '<tr><td colspan="5" style="text-align:center">No clinical data recorded</td></tr>'}
                    </tbody>
                </table>

                <div style="margin-top: auto;">
                    <div style="margin-bottom: 300px;">
                        <h3 class="sec-title">Interpretation</h3>
                        <div class="finding-box" style="margin-bottom: 0;">
                            ${report.interpretation || generateInterpretation(report.results, report)}
                        </div>
                    </div>
                    
                    <div class="pdf-footer">
                        <div class="seal-info">
                            <p style="margin-bottom: 4px;"><strong>REPORT VERIFICATION</strong></p>
                            <p>Verify Authenticity: reports.advancedlab.com</p>
                            <p>Unique Token: ${report.accessCode}</p>
                            <p style="margin-top: 12px; font-size: 9px; color: #94a3b8;">* This is a computer generated result and requires no physical signature.</p>
                        </div>
                        <div class="signature">
                            <div style="height: 15px;"></div>
                            <div class="line"></div>
                            <div class="name">${report.verifiedBy || 'Dr. Arjun Sharma'}</div>
                            <div class="title">Chief Pathologist</div>
                        </div>
                    </div>
                </div>
            </div>
        `

        const options = {
            margin: 0,
            filename: `LabReport_${report.id}.pdf`,
            image: { type: 'jpeg', quality: 1.0 },
            html2canvas: {
                scale: 3, // Increased scale for ultra-sharp text
                useCORS: true,
                letterRendering: true,
                logging: false,
                backgroundColor: '#ffffff'
            },
            jsPDF: {
                unit: 'mm',
                format: 'a4',
                orientation: 'portrait',
                compress: true
            }
        }

        // Professional manner: direct generate and save
        html2pdf().set(options).from(element).toPdf().get('pdf').then(function (pdf) {
            // Optional: further PDF manipulation if needed
        }).save()
    }

    const handleShareReport = (reportId) => {
        const report = reports.find(r => r.id === reportId)
        if (report) {
            const shareLink = `https://lab.example.com/reports/${report.accessCode}`
            alert(`Share link: ${shareLink}\nAccess Code: ${report.accessCode}`)
            navigator.clipboard.writeText(shareLink)
        }
    }

    const handleVerifyReport = (reportId) => {
        const report = reports.find(r => r.id === reportId)
        if (report && report.status !== 'Ready') {
            setReports(reports.map(r =>
                r.id === reportId
                    ? { ...r, status: 'Ready', verifiedBy: 'Dr. Current User' }
                    : r
            ))
            alert(`Report ${reportId} verified and ready for release`)
        }
    }

    const handleSelectReport = (reportId) => {
        if (selectedReports.includes(reportId)) {
            setSelectedReports(selectedReports.filter(id => id !== reportId))
        } else {
            setSelectedReports([...selectedReports, reportId])
        }
    }

    const handleBulkPrint = () => {
        if (selectedReports.length === 0) {
            alert('Please select reports to print')
            return
        }

        const reportsToPrint = reports.filter(r => selectedReports.includes(r.id))
        const consolidatedHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Bulk Lab Reports</title>
                <style>
                    @page { margin: 0; size: A4 portrait; }
                    body { 
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                        color: #333; 
                        margin: 0; 
                        padding: 0;
                    }
                    * { box-sizing: border-box; }
                    .report-wrapper {
                        padding: 2cm;
                        min-height: 100vh;
                        display: flex;
                        flex-direction: column;
                        page-break-after: always;
                    }
                    /* Remove break after last page */
                    .report-wrapper:last-child {
                        page-break-after: auto;
                    }

                    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px; }
                    .hospital-info h1 { margin: 0; color: #1e40af; font-size: 24px; }
                    .hospital-info p { margin: 5px 0 0 0; color: #666; font-size: 14px; }
                    .report-title { text-align: right; }
                    .report-title h2 { margin: 0; color: #1e40af; font-size: 20px; text-transform: uppercase; letter-spacing: 1px; }
                    .report-title p { margin: 5px 0 0 0; font-weight: bold; }
                    
                    .info-section { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
                    .info-group { display: flex; margin-bottom: 5px; }
                    .info-label { width: 120px; color: #64748b; font-size: 13px; font-weight: 600; }
                    .info-value { font-weight: 500; font-size: 14px; }
                    
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; table-layout: fixed; }
                    thead th { background-color: #f1f5f9; color: #475569; font-weight: 600; font-size: 11px; text-transform: uppercase; padding: 12px 10px; border-bottom: 2px solid #1e40af; }
                    td { padding: 10px; border-bottom: 1px solid #eee; font-size: 13px; }
                    
                    .interpretation { margin-bottom: 40px; }
                    .interpretation h3 { font-size: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px; color: #1e40af; }
                    .interpretation p { font-size: 14px; line-height: 1.6; color: #4b5563; }
                    
                    .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: auto; padding-top: 20px; border-top: 1px solid #e2e8f0; }
                    .signature-box { text-align: center; width: 220px; }
                    .signature-line { border-top: 1px solid #333; margin-top: 40px; margin-bottom: 5px; }
                    .signature-name { font-weight: 600; font-size: 14px; }
                    .signature-title { font-size: 12px; color: #666; font-style: italic; }
                    
                    .qr-code { font-size: 11px; color: #64748b; }
                    .qr-code p { margin: 2px 0; }
                </style>
            </head>
            <body>
                ${reportsToPrint.map(report => `
                    <div class="report-wrapper">
                        <div class="header">
                            <div class="hospital-info">
                                <h1>ADVANCED DIAGNOSTIC CENTER</h1>
                                <p>123 Healthcare Avenue, Medical District, NY 10001</p>
                                <p>Tel: +1 (555) 012-3456 | Web: www.advancedlab.com</p>
                            </div>
                            <div class="report-title">
                                <h2>Laboratory Report</h2>
                                <p>ID: ${report.id}</p>
                            </div>
                        </div>

                        <div class="info-section">
                            <div class="left-col">
                                <div class="info-group">
                                    <span class="info-label">Patient Name:</span>
                                    <span class="info-value">${report.patientName}</span>
                                </div>
                                <div class="info-group">
                                    <span class="info-label">Patient ID:</span>
                                    <span class="info-value">${report.patientId}</span>
                                </div>
                                <div class="info-group">
                                    <span class="info-label">Age / Gender:</span>
                                    <span class="info-value">${report.age || '35'}Y / ${report.gender || 'Male'}</span>
                                </div>
                            </div>
                            <div class="right-col">
                                <div class="info-group">
                                    <span class="info-label">Test Type:</span>
                                    <span class="info-value">${report.testType}</span>
                                </div>
                                <div class="info-group">
                                    <span class="info-label">Sample Date:</span>
                                    <span class="info-value">${report.sampleDate || report.completionDate}</span>
                                </div>
                                <div class="info-group">
                                    <span class="info-label">Report Date:</span>
                                    <span class="info-value">${report.completionDate}</span>
                                </div>
                            </div>
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 35%;">Test Parameter</th>
                                    <th style="width: 15%;">Result</th>
                                    <th style="width: 15%;">Unit</th>
                                    <th style="width: 20%;">Ref. Range</th>
                                    <th style="width: 15%;">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${report.results && report.results.length > 0
                ? report.results.map(res => `
                                        <tr style="border-bottom: 1px solid #eee;">
                                            <td style="padding: 10px;">${res.parameter}</td>
                                            <td style="padding: 10px; font-weight: bold;">${res.result || '-'}</td>
                                            <td style="padding: 10px;">${res.unit}</td>
                                            <td style="padding: 10px;">${res.referenceRange}</td>
                                            <td style="padding: 10px; color: ${res.status === 'Normal' ? '#059669' : '#dc2626'}">${res.status}</td>
                                        </tr>
                                    `).join('')
                : '<tr><td colspan="5" style="padding: 20px; text-align: center;">No results available</td></tr>'
            }
                            </tbody>
                        </table>

                        <div style="margin-top: auto;">
                            <div class="interpretation">
                                <h3>Clinical Interpretation</h3>
                                <p>${report.interpretation || 'All parameters are within normal limits for the requested test.'}</p>
                            </div>

                            <div class="footer">
                                <div class="qr-code">
                                    <p><strong>Verify Report:</strong></p>
                                    <p>Access Code: ${report.accessCode}</p>
                                    <p>Verification URL: lab.example.com/verify</p>
                                </div>
                                <div class="signature-box">
                                    <div class="signature-line"></div>
                                    <div class="signature-name">${report.verifiedBy || 'Dr. Arjun Sharma'}</div>
                                    <div class="signature-title">Consultant Doctor</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </body>
            </html>
        `

        // Create or get hidden iframe for printing
        let printFrame = document.getElementById('print-frame')
        if (!printFrame) {
            printFrame = document.createElement('iframe')
            printFrame.id = 'print-frame'
            printFrame.style.position = 'fixed'
            printFrame.style.right = '0'
            printFrame.style.bottom = '0'
            printFrame.style.width = '0'
            printFrame.style.height = '0'
            printFrame.style.border = 'none'
            document.body.appendChild(printFrame)
        }

        const frameDoc = printFrame.contentWindow.document
        frameDoc.open()
        frameDoc.write(consolidatedHtml)
        frameDoc.close()

        setTimeout(() => {
            printFrame.contentWindow.focus()
            printFrame.contentWindow.print()
            setSelectedReports([])
        }, 500)
    }

    const handleBulkDownload = () => {
        if (selectedReports.length > 0) {
            // Sequential download to prevent browser blocking
            selectedReports.forEach((reportId, index) => {
                setTimeout(() => {
                    handleDownloadReport(reportId, 'PDF')
                }, index * 800) // 800ms stagger
            })

            setSelectedReports([])
        } else {
            alert('Please select reports to download')
        }
    }

    const handleExportChange = (e) => {
        const { name, value } = e.target
        setExportData(prev => ({ ...prev, [name]: value }))
    }


    const exportToExcel = (filteredReports) => {
        const data = filteredReports.map(r => ({
            ReportID: r.id,
            PatientName: r.patientName,
            PatientID: r.patientId,
            Age: r.age,
            Gender: r.gender,
            TestType: r.testType,
            Date: r.completionDate,
            Status: r.status,
            VerifiedBy: r.verifiedBy
        }))

        const worksheet = XLSX.utils.json_to_sheet(data)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Reports')

        const excelBuffer = XLSX.write(workbook, {
            bookType: 'xlsx',
            type: 'array'
        })

        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' })
        saveAs(blob, `Reports_${Date.now()}.xlsx`)
    }

    const exportToPDF = (filteredReports) => {
        const container = document.createElement('div')

        container.innerHTML = `
        <style>
            body {
                font-family: 'Segoe UI', Arial, sans-serif;
                color: #1e293b;
            }

            .page {
                padding: 30px;
            }

            .header {
                display: flex;
                justify-content: space-between;
                border-bottom: 2px solid #1e40af;
                padding-bottom: 10px;
                margin-bottom: 25px;
            }

            .title {
                color: #1e40af;
                font-size: 22px;
                font-weight: 800;
            }

            .subtext {
                font-size: 12px;
                color: #64748b;
            }

            .card {
                border: 1px solid #e2e8f0;
                border-radius: 10px;
                padding: 20px;
                margin-bottom: 20px;
                background: #fff;
                page-break-inside: avoid;
            }

            .card-header {
                display: flex;
                justify-content: space-between;
                border-bottom: 1px solid #f1f5f9;
                padding-bottom: 10px;
                margin-bottom: 15px;
            }

            .patient-title {
                font-size: 16px;
                font-weight: bold;
            }

            .meta {
                font-size: 12px;
                color: #64748b;
            }

            .grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 10px;
                margin-bottom: 15px;
                font-size: 12px;
            }

            table {
                width: 100%;
                border-collapse: collapse;
                font-size: 12px;
            }

            th, td {
                padding: 6px;
                border-bottom: 1px solid #e2e8f0;
                text-align: left;
            }

            .footer {
                margin-top: 40px;
                border-top: 1px solid #e2e8f0;
                padding-top: 10px;
                text-align: center;
                font-size: 10px;
                color: #94a3b8;
            }

            .page-break {
                page-break-after: always;
            }
        </style>

        <div class="page">

            <!-- HEADER -->
            <div class="header">
                <div>
                    <div class="title">Clinical Data Export</div>
                    <div class="subtext">Secure Diagnostic Record Bundle</div>
                </div>
                <div style="text-align:right;">
                    <div><b>Records:</b> ${filteredReports.length}</div>
                    <div class="subtext">${new Date().toLocaleString()}</div>
                </div>
            </div>

            <!-- BODY -->
            ${filteredReports.map((r, index) => `
                <div class="card">

                    <div class="card-header">
                        <div>
                            <div class="meta">PATIENT RECORD</div>
                            <div class="patient-title">${r.patientName}</div>
                            <div class="meta">ID: ${r.patientId}</div>
                        </div>
                        <div style="text-align:right;">
                            <div><b>${r.testType}</b></div>
                            <div class="meta">REF: ${r.id}</div>
                        </div>
                    </div>

                    <div class="grid">
                        <div><b>Age:</b> ${r.age}</div>
                        <div><b>Gender:</b> ${r.gender}</div>
                        <div><b>Sample:</b> ${r.sampleDate || '-'}</div>
                        <div><b>Report:</b> ${r.completionDate}</div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Parameter</th>
                                <th>Result</th>
                                <th>Range</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${r.results.map(res => `
                                <tr>
                                    <td>${res.parameter}</td>
                                    <td>${res.result} ${res.unit}</td>
                                    <td>${res.referenceRange}</td>
                                    <td style="color:${res.status === 'Normal' ? 'green' : 'red'}">
                                        ${res.status}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div style="margin-top:10px; display:flex; justify-content:space-between;">
                        <div class="meta">Token: ${r.accessCode}</div>
                        <div class="meta">Verified: ${r.verifiedBy || 'Dr. Arjun Sharma'}</div>
                    </div>

                </div>

                ${(index + 1) % 2 === 0 && index !== filteredReports.length - 1
                ? '<div class="page-break"></div>'
                : ''
            }
            `).join('')}

            <!-- FOOTER -->
            <div class="footer">
                CONFIDENTIAL CLINICAL DATA • ${new Date().getFullYear()}
            </div>

        </div>
    `

        html2pdf().from(container).set({
            margin: 10,
            filename: `Clinical_Export_${Date.now()}.pdf`,
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).save()
    }

    const handleExportSubmit = () => {
        const { fromDate, toDate, format } = exportData
        const filtered = reports.filter(r => {
            const date = r.completionDate
            return (!fromDate || date >= fromDate) && (!toDate || date <= toDate)
        })

        if (filtered.length === 0) {
            alert('No reports found for selected duration')
            return
        }

        if (format === 'excel') {
            exportToExcel(filtered)
        } else {
            exportToPDF(filtered)
        }
        setShowExportModal(false)
        resetExportData()
    }

    const filteredReports = reports.filter(report =>
        report.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.testType.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) return <LoadingSpinner />

    return (
        <>
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-700">Report Generation</h2>
                        <p className="text-gray-500">Generate, preview, and manage lab test reports</p>
                    </div>
                    <div className="flex gap-3">
                        {selectedReports.length > 0 && (
                            <>
                                <Button
                                    variant="outline"
                                    icon={<PrintIcon fontSize="small" />}
                                    onClick={handleBulkPrint}
                                >
                                    Bulk Print ({selectedReports.length})
                                </Button>
                                <Button
                                    variant="outline"
                                    icon={<DownloadIcon fontSize="small" />}
                                    onClick={handleBulkDownload}
                                >
                                    Bulk Download
                                </Button>
                            </>
                        )}
                        <Button
                            variant="primary"
                            icon={<DescriptionIcon fontSize="small" />}
                            onClick={() => handleGenerateReport()}
                        >
                            Generate Report
                        </Button>
                    </div>
                </div>



                <div className="bg-white p-4 rounded border card-shadow">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <SearchBar
                                placeholder="Search by patient name, report ID, or test type..."
                                onSearch={handleSearch}
                                className="w-full"
                            />
                        </div>
                        <div className="flex gap-2">
                            <select className="px-4 py-2 border rounded-lg">
                                <option value="">All Status</option>
                                <option value="ready">Ready</option>
                                <option value="pending">Pending Review</option>
                                <option value="draft">Draft</option>
                            </select>
                            <select className="px-4 py-2 border rounded-lg">
                                <option value="">All Formats</option>
                                <option value="pdf">PDF</option>
                                <option value="html">HTML</option>
                                <option value="doc">Word</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded border card-shadow">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-100 rounded-lg mr-4">
                                <PictureAsPdfIcon className="text-blue-600" style={{ fontSize: '1.25rem' }} />
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm">Total Reports</p>
                                <p className="text-2xl font-bold text-blue-600 mt-1">{reports.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded border card-shadow">
                        <div className="flex items-center">
                            <div className="p-3 bg-green-100 rounded-lg mr-4">
                                <CheckCircleIcon className="text-green-600" style={{ fontSize: '1.25rem' }} />
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm">Ready Reports</p>
                                <p className="text-2xl font-bold text-green-600 mt-1">{reports.filter(r => r.status === 'Ready' || r.status === 'READY').length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded border card-shadow">
                        <div className="flex items-center">
                            <div className="p-3 bg-yellow-100 rounded-lg mr-4">
                                <AccessTimeIcon className="text-yellow-600" style={{ fontSize: '1.25rem' }} />
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm">Pending Review</p>
                                <p className="text-2xl font-bold text-yellow-600 mt-1">{reports.filter(r => r.status === 'Pending Review' || r.status === 'PENDING_REVIEW').length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded border card-shadow">
                        <div className="flex items-center">
                            <div className="p-3 bg-purple-100 rounded-lg mr-4">
                                <ShareIcon className="text-purple-600" style={{ fontSize: '1.25rem' }} />
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm">Shared Today</p>
                                <p className="text-2xl font-bold text-purple-600 mt-1">8</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded border card-shadow overflow-hidden">
                    <DataTable
                        columns={[
                            {
                                key: 'select',
                                title: '',
                                render: (_, row) => (
                                    <input
                                        type="checkbox"
                                        checked={selectedReports.includes(row.id)}
                                        onChange={() => handleSelectReport(row.id)}
                                        className="rounded"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                )
                            },
                            { key: 'id', title: 'Report ID', sortable: true },
                            { key: 'patientName', title: 'Patient', sortable: true },
                            { key: 'doctorName', title: 'Doctor', sortable: true },
                            { key: 'testType', title: 'Test Type', sortable: true },
                            { key: 'reportType', title: 'Report Type', sortable: true },
                            { key: 'completionDate', title: 'Completion Date', sortable: true },
                            {
                                key: 'status',
                                title: 'Status',
                                sortable: true,
                                render: (value) => (
                                    <span className={`px-2 py-1 rounded-full text-xs ${value === 'Ready' ? 'bg-green-100 text-green-800' :
                                        value === 'Pending Review' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                        {value}
                                    </span>
                                )
                            },
                            { key: 'verifiedBy', title: 'Verified By', sortable: true },
                            {
                                key: 'actions',
                                title: 'Actions',
                                render: (_, row) => (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleEditReport(row)
                                            }}
                                            className="px-3 py-1 text-xs bg-orange-100 text-orange-800 rounded hover:bg-orange-200"
                                            title="Edit Report"
                                        >
                                            <EditIcon style={{ fontSize: '0.875rem' }} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handlePreviewReport(row)
                                            }}
                                            className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                                            title="Preview Report"
                                        >
                                            <VisibilityIcon style={{ fontSize: '0.875rem' }} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handlePrintReport(row.id)
                                            }}
                                            className="px-3 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                                            title="Print Report"
                                        >
                                            <PrintIcon style={{ fontSize: '0.875rem' }} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleDownloadReport(row.id, 'PDF')
                                            }}
                                            className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                                            title="Download PDF"
                                        >
                                            <DownloadIcon style={{ fontSize: '0.875rem' }} />
                                        </button>
                                        {row.status !== 'Ready' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleVerifyReport(row.id)
                                                }}
                                                className="px-3 py-1 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200"
                                                title="Verify Report"
                                            >
                                                <CheckIcon style={{ fontSize: '0.875rem' }} />
                                            </button>
                                        )}
                                    </div>
                                )
                            }
                        ]}
                        data={filteredReports}
                        emptyMessage="No reports available. Generate reports from completed tests."
                    />
                </div>

                {/* Ready Tests Section */}
                <div className="bg-white rounded border card-shadow overflow-hidden">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <ScienceIcon className="text-green-600" />
                            Ready for Report Generation
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">Tests ready to be converted into lab reports</p>
                    </div>
                    {loadingReadyTests ? (
                        <div className="p-4">
                            <LoadingSpinner />
                        </div>
                    ) : readyTests.length === 0 ? (
                        <div className="p-6 text-center">
                            <div className="text-gray-400 mb-3">
                                <ScienceIcon style={{ fontSize: '3rem' }} />
                            </div>
                            <p className="text-gray-600">No tests are currently ready for report generation</p>
                        </div>
                    ) : (
                        <DataTable
                            columns={[
                                { key: 'id', title: 'Test ID', sortable: true },
                                { key: 'patientName', title: 'Patient', sortable: true },
                                { key: 'doctorName', title: 'Doctor', sortable: true },
                                { key: 'testType', title: 'Test Type', sortable: true },
                                { key: 'sampleDate', title: 'Sample Date', sortable: true },
                                { key: 'comments', title: 'Comments', sortable: false },
                                {
                                    key: 'status',
                                    title: 'Status',
                                    sortable: true,
                                    render: (value) => (
                                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                            {value || 'Pending'}
                                        </span>
                                    )
                                },
                                {
                                    key: 'actions',
                                    title: 'Actions',
                                    render: (_, row) => (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation()
                                                    setCurrentReport(row)

                                                    let patientAge = row.age || '';
                                                    let patientGender = row.gender || 'Male';

                                                    // Fetch patient details to get age and gender using patientId (patient_ref)
                                                    if (row.patientId) {
                                                        try {
                                                            const res = await apiFetch(`/api/v1/lab/patients?search=${encodeURIComponent(row.patientId)}`);
                                                            if (res.ok) {
                                                                const data = await res.json();
                                                                const patients = data.data || data.patients || data.rows || (Array.isArray(data) ? data : []);
                                                                const patient = patients.find(p =>
                                                                    p.patient_ref === row.patientId ||
                                                                    p.patient_id === row.patientId ||
                                                                    p.id === row.patientId
                                                                );
                                                                if (patient) {
                                                                    patientAge = patient.age || patientAge;
                                                                    patientGender = patient.gender || patientGender;
                                                                }
                                                            }
                                                        } catch (err) {
                                                            console.error("Could not fetch patient details:", err);
                                                        }
                                                    }

                                                    // Auto-fill the form with data from the selected ready test
                                                    setFormData({
                                                        sourceTestId: row.id || '',
                                                        patientName: row.patientName || '',
                                                        patientId: row.patientId || '',
                                                        age: patientAge,
                                                        gender: patientGender,
                                                        testType: row.testType || '',
                                                        sampleDate: row.sampleDate || new Date().toISOString().split('T')[0],
                                                        reportDate: new Date().toISOString().split('T')[0],
                                                        results: (row.results && row.results.length > 0) ? row.results.map(r => ({
                                                            parameter: r.parameter || r.name || '',
                                                            result: r.result || '',
                                                            unit: r.unit || '',
                                                            referenceRange: r.referenceRange || r.reference_range || r.range || '',
                                                            status: r.status || 'Normal'
                                                        })) : [
                                                            { parameter: 'Hemoglobin', result: '', unit: 'g/dL', referenceRange: '13.5-17.5', status: 'Normal' }
                                                        ],
                                                        verifiedBy: '',
                                                        priority: row.priority || 'Normal',
                                                        interpretation: '',
                                                        accessCode: `ACC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
                                                    })

                                                    setShowGenerateModal(true)
                                                }}
                                                className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                                                title="Generate Report"
                                            >
                                                <DescriptionIcon style={{ fontSize: '0.875rem' }} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setCurrentReport(row)
                                                    setShowPreviewModal(true)
                                                }}
                                                className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                                                title="View Details"
                                            >
                                                <VisibilityIcon style={{ fontSize: '0.875rem' }} />
                                            </button>
                                        </div>
                                    )
                                }
                            ]}
                            data={readyTests}
                            emptyMessage="No ready tests available"
                        />
                    )}
                </div>

                <div className="bg-white p-4 rounded border card-shadow">
                    <h3 className="text-lg font-semibold mb-3">Quick Report Actions</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <button
                            className="p-4 border rounded-lg hover:bg-blue-50 transition-colors text-center group"
                            onClick={() => handleGenerateReport()}
                        >
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200">
                                <DescriptionIcon className="text-blue-600" style={{ fontSize: '1.25rem' }} />
                            </div>
                            <p className="font-medium">Generate Report</p>
                        </button>

                        <button
                            className="p-4 border rounded-lg hover:bg-green-50 transition-colors text-center group"
                            onClick={handleBulkPrint}
                        >
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-green-200">
                                <PrintIcon className="text-green-600" style={{ fontSize: '1.25rem' }} />
                            </div>
                            <p className="font-medium">Bulk Print</p>
                        </button>

                        <button
                            className="p-4 border rounded-lg hover:bg-purple-50 transition-colors text-center group"
                            onClick={() => setShowExportModal(true)}
                        >
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-200">
                                <FileDownloadIcon className="text-purple-600" style={{ fontSize: '1.25rem' }} />
                            </div>
                            <p className="font-medium">Export Reports</p>
                        </button>

                        {/* <button
                            className="p-4 border rounded-lg hover:bg-teal-50 transition-colors text-center group"
                            onClick={() => alert('Report templates management')}
                        >
                            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-teal-200">
                                <PaletteIcon className="text-teal-600" style={{ fontSize: '1.25rem' }} />
                            </div>
                            <p className="font-medium">Manage Templates</p>
                        </button> */}
                    </div>
                </div>

            </div>

            <Modal
                isOpen={showPreviewModal}
                onClose={() => setShowPreviewModal(false)}
                title="Report Preview"
                size="md"
                footer={currentReport && (
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setShowPreviewModal(false)}
                        >
                            Close
                        </Button>
                        <Button
                            variant="outline"
                            icon={<PrintIcon fontSize="small" />}
                            onClick={() => handlePrintReport(currentReport.id)}
                        >
                            Print
                        </Button>
                        <Button
                            variant="outline"
                            icon={<DownloadIcon fontSize="small" />}
                            onClick={() => handleDownloadReport(currentReport.id, 'PDF')}
                        >
                            Download PDF
                        </Button>
                        <Button
                            variant="primary"
                            icon={<ShareIcon fontSize="small" />}
                            onClick={() => handleShareReport(currentReport.id)}
                        >
                            Share Report
                        </Button>
                    </div>
                )}
            >
                {currentReport && (
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">DIAGNOSTIC LAB REPORT</h3>
                                    <p className="text-gray-600">Advanced Diagnostic Center</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium">Report ID: {currentReport.id}</p>
                                    <p className="text-sm text-gray-500">Generated: {currentReport.completionDate}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded">
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-2">Patient Information</h4>
                                <div className="space-y-1">
                                    <p><span className="text-gray-500">Name:</span> {currentReport.patientName}</p>
                                    <p><span className="text-gray-500">Patient ID:</span> {currentReport.patientId}</p>
                                    <p><span className="text-gray-500">Age/Sex:</span> 35/Male</p>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-2">Test Information</h4>
                                <div className="space-y-1">
                                    <p><span className="text-gray-500">Test Type:</span> {currentReport.testType}</p>
                                    <p>
                                        <span className="text-gray-500">Sample Date:</span>{" "}
                                        {currentReport.sampleDate || '-'}
                                    </p>
                                    <p><span className="text-gray-500">Report Date:</span> {currentReport.completionDate}</p>
                                </div>
                            </div>
                        </div>

                        <div className="border rounded overflow-hidden">
                            <table className="min-w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Parameter</th>
                                        <th className="px-4 py-3 text-left">Result</th>
                                        <th className="px-4 py-3 text-left">Unit</th>
                                        <th className="px-4 py-3 text-left">Reference Range</th>
                                        <th className="px-4 py-3 text-left">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {currentReport.results && currentReport.results.length > 0 ? (
                                        currentReport.results.map((res, index) => (
                                            <tr key={index} className={index % 2 === 1 ? 'bg-gray-50' : ''}>
                                                <td className="px-4 py-3">{res.parameter}</td>
                                                <td className="px-4 py-3 font-medium">{res.result || '-'}</td>
                                                <td className="px-4 py-3">{res.unit}</td>
                                                <td className="px-4 py-3">{res.referenceRange}</td>
                                                <td className="px-4 py-3">
                                                    <span className={
                                                        res.status === 'Normal' ? 'text-green-600' :
                                                            res.status === 'High' ? 'text-red-600' :
                                                                res.status === 'Low' ? 'text-yellow-600' :
                                                                    'text-gray-600'
                                                    }>
                                                        {res.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="text-center py-4 text-gray-500">
                                                No results available
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                                <h4 className="font-semibold text-gray-700 mb-2">Interpretation</h4>
                                <p className="text-gray-600">{currentReport.interpretation || 'All parameters are within normal limits for the requested test. No abnormalities detected.'}</p>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t">
                                <div>
                                    <p className="font-semibold">Verified By:</p>
                                    <p className="text-gray-600">{currentReport.verifiedBy || 'Pending Verification'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold">Access Code:</p>
                                    <p className="text-gray-600 font-mono">{currentReport.accessCode}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={showGenerateModal}
                onClose={() => { resetFormData(); setShowGenerateModal(false); }}
                title={isEditing ? "Edit Report" : "Generate Report"}
                size="lg"
                footer={
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => { resetFormData(); setShowGenerateModal(false); }}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSubmitReport}
                            disabled={!isFormValid}
                            className={!isFormValid ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                            {isEditing ? "Update Report" : "Generate Report"}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-6 bg-gray-50/30 p-2 rounded-lg">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
                        <div className="flex items-center gap-3 mb-2 pb-3 border-b border-gray-100">
                            <h4 className="font-bold text-gray-800 tracking-widest text-sm">Patient Identification</h4>
                        </div>

                        <div className="grid grid-cols-1 gap-5 mb-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-2">Source Test ID <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="sourceTestId"
                                    value={formData.sourceTestId}
                                    onChange={handleFormChange}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono text-sm"
                                    placeholder="Enter Source Test ID"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="relative">
                                <label className="block text-xs font-bold text-gray-600 tracking-wider mb-2">Patient Name <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="patientName"
                                        value={formData.patientName}
                                        onChange={(e) => {
                                            handleFormChange(e)
                                            setShowPatientDropdown(true)
                                        }}
                                        onFocus={() => setShowPatientDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowPatientDropdown(false), 200)}
                                        placeholder="Select or enter patient"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all pr-12 text-sm font-medium"
                                        autoComplete="off"
                                    />
                                    <button
                                        type="button"
                                        onMouseDown={(e) => {
                                            e.preventDefault()
                                            if (showPatientDropdown) {
                                                setShowPatientDropdown(false)
                                            } else {
                                                setFormData(prev => ({ ...prev, patientName: '' }))
                                                setShowPatientDropdown(true)
                                            }
                                        }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 focus:outline-none p-1.5 rounded-md transition-colors"
                                    >
                                        <KeyboardArrowDownIcon style={{ fontSize: '1.25rem' }} />
                                    </button>
                                    {showPatientDropdown && (
                                        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto ring-1 ring-black ring-opacity-5">
                                            {patientOptions
                                                .filter(p => p.name.toLowerCase().includes(formData.patientName.toLowerCase()))
                                                .map(p => (
                                                    <div
                                                        key={p.id}
                                                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            handleFormChange({ target: { name: 'patientName', value: p.name } });
                                                            setShowPatientDropdown(false);
                                                        }}
                                                    >
                                                        <div className="font-bold text-sm text-gray-800">{p.name}</div>
                                                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                                            <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">{p.id}</span>
                                                            <span>Age: {p.age}</span>
                                                            <span>{p.gender}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            {patientOptions.filter(p => p.name.toLowerCase().includes(formData.patientName.toLowerCase())).length === 0 && (
                                                <div className="px-5 py-4 text-sm text-gray-500 text-center bg-gray-50 rounded-b-xl border-t border-gray-100">
                                                    No matches found. Using custom entry for <span className="font-bold text-gray-800">"{formData.patientName}"</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-2">Patient ID <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="patientId"
                                    value={formData.patientId}
                                    onChange={handleFormChange}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono text-sm"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-2">Age</label>
                                <input
                                    type="number"
                                    name="age"
                                    value={formData.age}
                                    onChange={handleFormChange}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-2">Gender</label>
                                <div className="relative">
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleFormChange}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all appearance-none text-sm font-medium cursor-pointer"
                                    >
                                        <option>Male</option>
                                        <option>Female</option>
                                        <option>Other</option>
                                    </select>
                                    <KeyboardArrowDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" style={{ fontSize: '1.25rem' }} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-2">Test Type</label>
                                <input
                                    type="text"
                                    name="testType"
                                    value={formData.testType}
                                    onChange={handleFormChange}
                                    placeholder="Enter test type"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium bg-gray-50"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 tracking-wider mb-2">Sample Collection Date</label>
                                <input
                                    type="date"
                                    name="sampleDate"
                                    value={formData.sampleDate}
                                    onChange={handleFormChange}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 tracking-wider mb-2">Report Generation Date</label>
                                <input
                                    type="date"
                                    name="reportDate"
                                    value={formData.reportDate}
                                    onChange={handleFormChange}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Test Results Table Card */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4 overflow-hidden">
                        <div className="flex justify-between items-center mb-2 pb-3 border-b border-gray-100">
                            <div className="flex items-center gap-3">

                                <h4 className="font-bold text-gray-800 tracking-widest text-sm">Test Results</h4>
                            </div>
                            <button
                                onClick={addResultRow}
                                className="text-xs font-bold text-blue-700 hover:text-white border border-blue-200 hover:bg-blue-600 px-4 py-1.5 rounded-full transition-all shadow-sm"
                            >
                                + Add Parameter
                            </button>
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="w-full border-collapse bg-white">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 tracking-wider">Parameter</th>
                                        <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 tracking-wider">Result</th>
                                        <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 tracking-wider">Unit</th>
                                        <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 tracking-wider">Ref. Range</th>
                                        <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 tracking-wider">Status</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {formData.results.map((res, idx) => (
                                        <tr key={idx} className="group hover:bg-gray-50/80 transition-colors">
                                            <td className="px-3 py-2.5">
                                                <div className="relative">
                                                    <select
                                                        value={res.parameter}
                                                        onChange={(e) => handleResultChange(idx, 'parameter', e.target.value)}
                                                        className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-semibold text-gray-700 appearance-none pr-8 cursor-pointer shadow-sm transition-all"
                                                    >
                                                        {parameterOptions.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                                                    </select>
                                                    <KeyboardArrowDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" style={{ fontSize: '1.25rem' }} />
                                                </div>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <input
                                                    type="text"
                                                    value={res.result}
                                                    onChange={(e) => handleResultChange(idx, 'result', e.target.value)}
                                                    placeholder="Enter..."
                                                    className="w-24 px-3 py-1.5 bg-white border border-gray-300 rounded-lg font-bold text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm transition-all shadow-sm"
                                                />
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <input
                                                    type="text"
                                                    value={res.unit}
                                                    readOnly
                                                    onChange={(e) => handleResultChange(idx, 'unit', e.target.value)}
                                                    className="w-20 px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-lg font-medium text-gray-500 outline-none text-sm cursor-not-allowed shadow-sm"
                                                />
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <input
                                                    type="text"
                                                    value={res.referenceRange}
                                                    onChange={(e) => handleResultChange(idx, 'referenceRange', e.target.value)}
                                                    readOnly
                                                    className="w-32 px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-lg font-medium text-gray-500 outline-none text-sm cursor-not-allowed shadow-sm"
                                                />
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <div className="relative">
                                                    <select
                                                        value={res.status}
                                                        onChange={(e) => handleResultChange(idx, 'status', e.target.value)}
                                                        className="w-full text-[11px] font-bold px-3 py-1.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer bg-white text-gray-700 appearance-none pr-8 shadow-sm transition-all"
                                                    >
                                                        <option>Normal</option>
                                                        <option>High</option>
                                                        <option>Low</option>
                                                        <option>Critical</option>
                                                    </select>
                                                    <KeyboardArrowDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" style={{ fontSize: '1.25rem' }} />
                                                </div>
                                            </td>
                                            <td className="px-3 py-2.5 text-right">
                                                <button
                                                    onClick={() => removeResultRow(idx)}
                                                    className="w-8 h-8 rounded-full text-gray-400 hover:text-white hover:bg-red-500 flex items-center justify-center transition-all"
                                                    title="Remove parameter"
                                                >
                                                    <DeleteOutlineIcon style={{ fontSize: '1.25rem' }} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Verification & Notes Card */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
                        <div className="flex items-center gap-3 mb-2 pb-3 border-b border-gray-100">
                            <h4 className="font-bold text-gray-800 tracking-widest text-sm">Conclusion & Authentication</h4>
                        </div>

                        <div className={`grid grid-cols-1 md:grid-cols-${isEditing ? '3' : '2'} gap-5`}>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 tracking-wider mb-2">Verified By</label>
                                <input
                                    type="text"
                                    name="verifiedBy"
                                    value={formData.verifiedBy}
                                    onChange={handleFormChange}
                                    placeholder="Enter Physician Name"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 tracking-wider mb-2">Reporting Priority</label>
                                <div className="relative">
                                    <select
                                        name="priority"
                                        value={formData.priority}
                                        onChange={handleFormChange}
                                        className="w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 transition-all font-bold text-sm appearance-none cursor-pointer border-gray-300 bg-gray-50 text-gray-700"
                                    >
                                        <option>Normal</option>
                                        <option>Stat</option>
                                        <option>Urgent</option>
                                        <option>Critical</option>
                                    </select>
                                    <KeyboardArrowDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" style={{ fontSize: '1.25rem' }} />
                                </div>
                            </div>
                            {isEditing && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 tracking-wider mb-2">Report Status</label>
                                    <div className="relative">
                                        <select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleFormChange}
                                            className="w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 transition-all font-bold text-sm appearance-none cursor-pointer border-gray-300 bg-gray-50 text-gray-700"
                                        >
                                            <option value="READY">Ready</option>
                                            <option value="PENDING_REVIEW">Pending Review</option>
                                            <option value="DRAFT">Draft</option>
                                        </select>
                                        <KeyboardArrowDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" style={{ fontSize: '1.25rem' }} />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-600 tracking-wider mb-2">Interpretation</label>
                            <textarea
                                name="interpretation"
                                rows="3"
                                value={formData.interpretation}
                                onChange={handleFormChange}
                                placeholder="Enter detailed analysis, methodology, or clinical notes..."
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none text-sm leading-relaxed"
                            ></textarea>
                        </div>
                    </div>

                    {/* System Managed Info */}
                    <div className="flex justify-between items-center px-5 py-4 bg-gray-100/80 rounded-xl border border-dashed border-gray-300">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-gray-500 tracking-widest">Document Access Code</span>
                            <span className="font-mono text-blue-800 font-bold bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-md select-all">{formData.accessCode}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-gray-500 tracking-widest">System Status</span>
                            <span className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-100 px-3 py-1.5 rounded-full border border-green-200">
                                <CheckCircleIcon style={{ fontSize: '14px' }} /> Ready for Final Release
                            </span>
                        </div>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={showExportModal}
                onClose={() => {
                    setShowExportModal(false)
                    resetExportData()
                }}
                title="Export Records"
                size="md"
                footer={
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowExportModal(false)
                                resetExportData()
                            }}
                        >
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleExportSubmit} icon={<FileDownloadIcon fontSize="small" />}>
                            Secure Export
                        </Button>
                    </div>
                }
            >
                <div className="space-y-6 p-1">
                    {/* Date Range Selection */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4 block">Select Reporting Period</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block">From Date</label>
                                <input
                                    type="date"
                                    name="fromDate"
                                    value={exportData.fromDate}
                                    onChange={handleExportChange}
                                    className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium shadow-sm"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block">To Date</label>
                                <input
                                    type="date"
                                    name="toDate"
                                    value={exportData.toDate}
                                    onChange={handleExportChange}
                                    className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium shadow-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Format Selection - Refined Buttons */}
                    <div>
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 block">Target Export Format</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div
                                onClick={() => setExportData(prev => ({ ...prev, format: 'pdf' }))}
                                className={`group p-4 rounded-xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${exportData.format === 'pdf'
                                    ? 'border-red-500 bg-red-50 text-red-700 shadow-md ring-4 ring-red-100'
                                    : 'border-gray-100 bg-white hover:border-gray-200 text-gray-400'
                                    }`}
                            >
                                <PictureAsPdfIcon style={{ fontSize: '2rem' }} className={`mb-2 transition-transform group-active:scale-90 ${exportData.format === 'pdf' ? 'text-red-500' : 'text-gray-300'}`} />
                                <span className="text-[11px] font-black uppercase tracking-tight">Clinical PDF</span>
                            </div>

                            <div
                                onClick={() => setExportData(prev => ({ ...prev, format: 'excel' }))}
                                className={`group p-4 rounded-xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${exportData.format === 'excel'
                                    ? 'border-green-600 bg-green-50 text-green-800 shadow-md ring-4 ring-green-100'
                                    : 'border-gray-100 bg-white hover:border-gray-200 text-gray-400'
                                    }`}
                            >
                                <FileDownloadIcon style={{ fontSize: '2rem' }} className={`mb-2 transition-transform group-active:scale-90 ${exportData.format === 'excel' ? 'text-green-600' : 'text-gray-300'}`} />
                                <span className="text-[11px] font-black uppercase tracking-tight">Excel XLSX</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 px-4 py-3 bg-blue-50/50 border border-dashed border-blue-200 rounded-lg">
                        <CheckCircleIcon className="text-blue-500" style={{ fontSize: '14px' }} />
                        <p className="text-[10px] text-blue-600 font-medium italic">Validated clinical data ready for secure administrative extraction.</p>
                    </div>
                </div>
            </Modal>

        </>
    )
}

export default ReportGeneration