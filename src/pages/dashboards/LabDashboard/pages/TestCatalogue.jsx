// src/pages/dashboards/LabDashboard/pages/TestCatalogue.jsx
import React, { useState, useEffect, useRef } from 'react'
import DataTable from '../../../../components/ui/Tables/DataTable'
import SearchBar from '../../../../components/common/SearchBar/SearchBar'
import Button from '../../../../components/common/Button/Button'
import Modal from '../../../../components/common/Modal/Modal'
import LoadingSpinner from '../../../../components/common/LoadingSpinner/LoadingSpinner'
import Toast from '../../../../components/common/Toast/Toast'

const TestCatalogue = () => {
  const [loading, setLoading] = useState(true)
  const [tests, setTests] = useState([])
  const [categories, setCategories] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showSyncModal, setShowSyncModal] = useState(false)
  const [currentTest, setCurrentTest] = useState(null)
  const [toast, setToast] = useState(null)
  const [selectedTests, setSelectedTests] = useState([])
  const [importData, setImportData] = useState(null)
  const [syncStatus, setSyncStatus] = useState(null)
  const fileInputRef = useRef(null)
  
  const [newTest, setNewTest] = useState({
    code: '',
    name: '',
    category: '',
    sampleType: '',
    turnaroundTime: '',
    price: '',
    instructions: '',
    parameters: []
  })
  const [newCategory, setNewCategory] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  useEffect(() => {
    loadTestData()
  }, [])

  const loadTestData = async () => {
    setLoading(true)
    setTimeout(() => {
      const testCategories = [
        { id: 'hem', name: 'Hematology', count: 15 },
        { id: 'bio', name: 'Biochemistry', count: 25 },
        { id: 'mic', name: 'Microbiology', count: 18 },
        { id: 'ser', name: 'Serology', count: 12 },
        { id: 'hor', name: 'Hormones', count: 20 },
        { id: 'imm', name: 'Immunology', count: 10 }
      ]

      const testData = [
        {
          id: 'CBC',
          name: 'Complete Blood Count',
          category: 'Hematology',
          sampleType: 'Blood',
          turnaroundTime: '4 hours',
          price: 500,
          status: 'active',
          parameters: 18,
          instructions: 'Fast for 8-12 hours before sample collection.',
          params: [
            { name: 'Hemoglobin', unit: 'g/dL', range: '13.0 - 17.0' },
            { name: 'WBC Count', unit: 'cells/mcL', range: '4,500 - 11,000' },
            { name: 'Platelets', unit: 'cells/mcL', range: '150,000 - 450,000' },
            { name: 'RBC Count', unit: 'M/µL', range: '4.5 - 5.9' },
            { name: 'Hematocrit', unit: '%', range: '40 - 54' }
          ]
        },
        {
          id: 'LFT',
          name: 'Liver Function Test',
          category: 'Biochemistry',
          sampleType: 'Blood',
          turnaroundTime: '24 hours',
          price: 1200,
          status: 'active',
          parameters: 8,
          instructions: 'Standard blood sample. No specific preparation needed.',
          params: [
            { name: 'ALT (SGPT)', unit: 'U/L', range: '7 - 55' },
            { name: 'AST (SGOT)', unit: 'U/L', range: '8 - 48' },
            { name: 'Bilirubin Total', unit: 'mg/dL', range: '0.1 - 1.2' },
            { name: 'ALP', unit: 'U/L', range: '30 - 120' },
            { name: 'Total Protein', unit: 'g/dL', range: '6.0 - 8.0' },
            { name: 'Albumin', unit: 'g/dL', range: '3.5 - 5.0' }
          ]
        },
        {
          id: 'KFT',
          name: 'Kidney Function Test',
          category: 'Biochemistry',
          sampleType: 'Blood',
          turnaroundTime: '24 hours',
          price: 800,
          status: 'active',
          parameters: 6,
          instructions: 'Fasting not required. Inform about any medications.',
          params: [
            { name: 'Creatinine', unit: 'mg/dL', range: '0.7 - 1.3' },
            { name: 'BUN', unit: 'mg/dL', range: '7 - 20' },
            { name: 'Uric Acid', unit: 'mg/dL', range: '3.5 - 7.2' },
            { name: 'Sodium', unit: 'mmol/L', range: '135 - 145' },
            { name: 'Potassium', unit: 'mmol/L', range: '3.5 - 5.1' }
          ]
        }
      ]

      const updatedCategories = testCategories.map(cat => ({
        ...cat,
        count: testData.filter(test => test.category === cat.name).length
      }))

      setCategories(updatedCategories)
      setTests(testData)
      setLoading(false)
    }, 1000)
  }

  const handleSearch = (term) => {
    setSearchTerm(term)
  }

  const handleAddTest = () => {
    if (!newTest.name || !newTest.category || !newTest.sampleType || !newTest.turnaroundTime || !newTest.price) {
      setToast({ message: 'Please fill in all required fields', type: 'error' })
      return
    }

    const testCode = newTest.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 10)

    const newTestEntry = {
      id: testCode,
      name: newTest.name,
      category: newTest.category,
      sampleType: newTest.sampleType,
      turnaroundTime: newTest.turnaroundTime,
      price: parseFloat(newTest.price),
      status: 'active',
      parameters: newTest.parameters.length,
      instructions: newTest.instructions,
      params: newTest.parameters.filter(p => p.name).map(p => ({
        name: p.name,
        unit: p.unit || 'N/A',
        range: p.range || 'Not specified'
      }))
    }
    
    setTests([...tests, newTestEntry])
    setCategories(categories.map(cat => 
      cat.name === newTest.category 
        ? { ...cat, count: cat.count + 1 }
        : cat
    ))
    
    setShowAddModal(false)
    setNewTest({
      code: '',
      name: '',
      category: '',
      sampleType: '',
      turnaroundTime: '',
      price: '',
      instructions: '',
      parameters: []
    })
    setToast({ message: `Test "${newTest.name}" added successfully!`, type: 'success' })
  }

  const handleEditTest = (test) => {
    setCurrentTest(test)
    setNewTest({
      code: test.id,
      name: test.name,
      category: test.category,
      sampleType: test.sampleType,
      turnaroundTime: test.turnaroundTime,
      price: test.price.toString(),
      instructions: test.instructions || '',
      parameters: test.params || []
    })
    setShowEditModal(true)
  }

  const handleViewTest = (test) => {
    setCurrentTest(test)
    setShowViewModal(true)
  }

  const handleUpdateTest = () => {
    const updatedTests = tests.map(test => 
      test.id === currentTest.id 
        ? { 
            ...test, 
            name: newTest.name,
            category: newTest.category,
            sampleType: newTest.sampleType,
            turnaroundTime: newTest.turnaroundTime,
            price: parseFloat(newTest.price),
            instructions: newTest.instructions,
            params: newTest.parameters.filter(p => p.name).map(p => ({
              name: p.name,
              unit: p.unit || 'N/A',
              range: p.range || 'Not specified'
            })),
            parameters: newTest.parameters.filter(p => p.name).length
          }
        : test
    )
    
    setTests(updatedTests)
    if (currentTest.category !== newTest.category) {
      setCategories(categories.map(cat => {
        if (cat.name === currentTest.category) {
          return { ...cat, count: Math.max(0, cat.count - 1) }
        }
        if (cat.name === newTest.category) {
          return { ...cat, count: cat.count + 1 }
        }
        return cat
      }))
    }
    setShowEditModal(false)
    setToast({ message: `Test "${newTest.name}" updated successfully!`, type: 'success' })
  }

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      if (categories.some(cat => cat.name.toLowerCase() === newCategory.toLowerCase())) {
        setToast({ message: 'Category already exists!', type: 'error' })
        return
      }
      const categoryId = newCategory.toLowerCase().replace(/\s/g, '').substring(0, 3)
      const newCategoryEntry = {
        id: categoryId,
        name: newCategory,
        count: 0
      }
      setCategories([...categories, newCategoryEntry])
      setNewCategory('')
      setShowCategoryModal(false)
      setToast({ message: `Category "${newCategory}" added successfully!`, type: 'success' })
    }
  }

  const handleToggleTestStatus = (testId) => {
    const updatedTests = tests.map(test => 
      test.id === testId 
        ? { ...test, status: test.status === 'active' ? 'inactive' : 'active' }
        : test
    )
    setTests(updatedTests)
    const test = updatedTests.find(t => t.id === testId)
    setToast({ 
      message: `Test "${test.name}" ${test.status === 'active' ? 'activated' : 'deactivated'} successfully!`, 
      type: 'info' 
    })
  }

  const handleAddParameter = () => {
    setNewTest({
      ...newTest,
      parameters: [...newTest.parameters, { name: '', unit: '', range: '' }]
    })
  }

  const handleParameterChange = (index, field, value) => {
    const updatedParameters = [...newTest.parameters]
    updatedParameters[index][field] = value
    setNewTest({ ...newTest, parameters: updatedParameters })
  }

  const handleRemoveParameter = (index) => {
    const updatedParameters = newTest.parameters.filter((_, i) => i !== index)
    setNewTest({ ...newTest, parameters: updatedParameters })
  }

  // ========== BULK ACTIONS IMPLEMENTATIONS ==========
  // 1. EXPORT CATALOGUE - Export tests to JSON/CSV
  const handleExportCatalogue = (format = 'json') => {
    const exportData = tests.map(test => ({
      test_code: test.id,
      test_name: test.name,
      category: test.category,
      sample_type: test.sampleType,
      turnaround_time: test.turnaroundTime,
      price: test.price,
      status: test.status,
      parameters_count: test.parameters,
      instructions: test.instructions,
      parameters: test.params
    }))

    let blob;
    let filename;
    let contentType;

    if (format === 'json') {
      contentType = 'application/json';
      filename = `test_catalogue_${new Date().toISOString().split('T')[0]}.json`;
      blob = new Blob([JSON.stringify(exportData, null, 2)], { type: contentType });
    }
    else {
      // CSV format
      const headers = ['Test Code', 'Test Name', 'Category', 'Sample Type', 'Turnaround Time', 'Price', 'Status', 'Parameters Count'];
      const csvRows = [headers];
      exportData.forEach(test => {
        csvRows.push([
          test.test_code,
          test.test_name,
          test.category,
          test.sample_type,
          test.turnaround_time,
          test.price,
          test.status,
          test.parameters_count
        ]);
      });
      contentType = 'text/csv';
      filename = `test_catalogue_${new Date().toISOString().split('T')[0]}.csv`;
      blob = new Blob([csvRows.map(row => row.join(',')).join('\n')], { type: contentType });
    }

    // Create download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setToast({ message: `Catalogue exported as ${format.toUpperCase()} successfully!`, type: 'success' });
  }

  // 2. IMPORT TESTS - Import tests from JSON/CSV file
  const handleImportTests = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        let importedTests;
        if (file.name.endsWith('.json')) {
          importedTests = JSON.parse(content);
        }
        else {
          // Simple CSV parsing
          const lines = content.split('\n');
          const headers = lines[0].split(',');
          importedTests = lines.slice(1).filter(line => line.trim()).map(line => {
            const values = line.split(',');
            const test = {};
            headers.forEach((header, index) => {
              test[header.toLowerCase().replace(/\s/g, '_')] = values[index];
            });
            return test;
          });
        }
        setImportData(importedTests);
        setShowImportModal(true);
      }
      catch (error) {
        setToast({ message: 'Error parsing file. Please check the format.', type: 'error' });
      }
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    if (!importData || !Array.isArray(importData)) return;
    const newTests = importData.map((item, index) => ({
      id: item.test_code || item.testCode || `IMP${Date.now()}${index}`,
      name: item.test_name || item.testName || item.name,
      category: item.category || 'General',
      sampleType: item.sample_type || item.sampleType || 'Blood',
      turnaroundTime: item.turnaround_time || item.turnaroundTime || '24 hours',
      price: parseFloat(item.price) || 0,
      status: 'active',
      parameters: item.parameters_count || item.parametersCount || 0,
      instructions: item.instructions || '',
      params: item.parameters || []
    }));

    setTests([...tests, ...newTests]);
    // Update category counts
    const categoryMap = {};
    newTests.forEach(test => {
      categoryMap[test.category] = (categoryMap[test.category] || 0) + 1;
    });
    
    setCategories(categories.map(cat => ({
      ...cat,
      count: cat.count + (categoryMap[cat.name] || 0)
    })));

    setShowImportModal(false);
    setImportData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setToast({ message: `Successfully imported ${newTests.length} tests!`, type: 'success' });
  };

  // 3. SYNC WITH LIS - Simulate sync with Laboratory Information System
  const handleSyncWithLIS = () => {
    setShowSyncModal(true);
    setSyncStatus('syncing');
    
    // Simulate API call to LIS
    setTimeout(() => {
      const syncedTests = tests.map(test => ({
        ...test,
        lastSynced: new Date().toISOString(),
        syncStatus: 'synced'
      }));
      setTests(syncedTests);
      setSyncStatus('completed');
      
      setTimeout(() => {
        setShowSyncModal(false);
        setSyncStatus(null);
        setToast({ message: 'Successfully synchronized with LIS!', type: 'success' });
      }, 1500);
    }, 2000);
  };

  // 4. PRINT CATALOGUE - Print the test catalogue
  const handlePrintCatalogue = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      setToast({ message: 'Please allow pop-ups to print the catalogue', type: 'error' });
      return;
    }

    const htmlContent = generatePrintHTML();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.onafterprint = () => printWindow.close();
  };

  const generatePrintHTML = () => {
    const filteredData = filteredTests;
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Catalogue - Levitica Healthcare</title>
          <meta charset="utf-8" />
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Helvetica Neue', Arial, sans-serif;
              padding: 40px 30px;
              background: white;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 3px solid #1a56db;
            }
            .header h1 {
              color: #1e3a8a;
              font-size: 28px;
              margin-bottom: 8px;
            }
            .header p {
              color: #6b7280;
              font-size: 12px;
            }
            .info-bar {
              display: flex;
              justify-content: space-between;
              margin-bottom: 25px;
              padding: 12px 15px;
              background: #f3f4f6;
              border-radius: 8px;
              font-size: 12px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background: #1f2937;
              color: white;
              padding: 12px;
              text-align: left;
              font-size: 12px;
              font-weight: 600;
            }
            td {
              padding: 10px 12px;
              border-bottom: 1px solid #e5e7eb;
              font-size: 11px;
            }
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
            .status-active {
              color: #10b981;
              font-weight: bold;
            }
            .status-inactive {
              color: #ef4444;
              font-weight: bold;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              font-size: 10px;
              color: #9ca3af;
            }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>LEVITICA HEALTHCARE</h1>
            <p>Diagnostic Laboratory Division | Complete Test Catalogue</p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>
          <div class="info-bar">
            <span><strong>Total Tests:</strong> ${filteredData.length}</span>
            <span><strong>Active Tests:</strong> ${filteredData.filter(t => t.status === 'active').length}</span>
            <span><strong>Categories:</strong> ${categories.length}</span>
            <span><strong>Total Parameters:</strong> ${filteredData.reduce((sum, t) => sum + (t.parameters || 0), 0)}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Test Code</th>
                <th>Test Name</th>
                <th>Category</th>
                <th>Sample Type</th>
                <th>TAT</th>
                <th>Price (₹)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData.map(test => `
                <tr>
                  <td><strong>${test.id}</strong></td>
                  <td>${test.name}</td>
                  <td>${test.category}</td>
                  <td>${test.sampleType}</td>
                  <td>${test.turnaroundTime}</td>
                  <td>₹${test.price.toLocaleString('en-IN')}</td>
                  <td class="status-${test.status}">${test.status.toUpperCase()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            <p>This is a system-generated document. For any discrepancies, please contact the laboratory.</p>
            <p>© ${new Date().getFullYear()} Levitica Healthcare Pvt. Ltd. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;
  };

  // 5. BULK STATUS UPDATE - Update status for multiple tests
  const handleBulkStatusUpdate = (newStatus) => {
    if (selectedTests.length === 0) {
      setToast({ message: 'Please select tests to update', type: 'warning' });
      return;
    }
    const updatedTests = tests.map(test => 
      selectedTests.includes(test.id) 
        ? { ...test, status: newStatus }
        : test
    );
    setTests(updatedTests);
    setToast({ 
      message: `${selectedTests.length} test(s) ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`, 
      type: 'success' 
    });
    setSelectedTests([]);
  };

  // 6. BULK DELETE - Delete multiple tests
  const handleBulkDelete = () => {
    if (selectedTests.length === 0) {
      setToast({ message: 'Please select tests to delete', type: 'warning' });
      return;
    }
    if (window.confirm(`Are you sure you want to delete ${selectedTests.length} test(s)? This action cannot be undone.`)) {
      const remainingTests = tests.filter(test => !selectedTests.includes(test.id));
      setTests(remainingTests);
      setToast({ message: `${selectedTests.length} test(s) deleted successfully!`, type: 'success' });
      setSelectedTests([]);
    }
  };

  const handleSelectTest = (testId) => {
    setSelectedTests(prev => 
      prev.includes(testId) 
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTests.length === filteredTests.length) {
      setSelectedTests([]);
    }
    else {
      setSelectedTests(filteredTests.map(t => t.id));
    }
  };

  const filteredTests = tests.filter(test => {
    const matchesSearch = test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         test.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = activeCategory === 'all' || test.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const sampleTypes = ['Blood', 'Urine', 'Stool', 'Sputum', 'CSF', 'Swab', 'Tissue', 'Saliva', 'Other']
  const turnaroundOptions = ['2 hours', '4 hours', '24 hours', '48 hours', '72 hours', '5 days', '7 days', '14 days']

  if (loading) return <LoadingSpinner />
  return (
    <>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-700">Test Catalogue Management</h2>
            <p className="text-gray-500">Manage laboratory test catalogue and configurations</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" icon="fas fa-folder-plus" onClick={() => setShowCategoryModal(true)}>
              Add Category
            </Button>
            <Button variant="primary" icon="fas fa-plus" onClick={() => setShowAddModal(true)}>
              Add Test
            </Button>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white p-4 rounded border card-shadow">
          <div className="flex flex-wrap gap-2">
            <button className={`px-4 py-2 rounded-lg ${
                activeCategory === 'all' 
                  ? 'bg-blue-100 text-blue-700 border-blue-300' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } border`}
              onClick={() => setActiveCategory('all')} >
              All Tests ({tests.length})
            </button>
            {categories.map(category => (
              <button key={category.id} className={`px-4 py-2 rounded-lg ${
                  activeCategory === category.name 
                    ? 'bg-blue-100 text-blue-700 border-blue-300' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } border`}
              onClick={() => setActiveCategory(category.name)} >
                {category.name} ({category.count})
              </button>
            ))}
          </div>
        </div>

        {/* Search and Stats */}
        <div className="bg-white p-4 rounded border card-shadow">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchBar placeholder="Search tests by name or code..." onSearch={handleSearch} className="w-full" />
            </div>
            <div className="flex gap-4 text-sm">
              <div className="text-center">
                <p className="text-gray-500">Active Tests</p>
                <p className="text-xl font-bold text-green-600">{tests.filter(t => t.status === 'active').length}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-500">Categories</p>
                <p className="text-xl font-bold text-blue-600">{categories.length}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-500">Total Parameters</p>
                <p className="text-xl font-bold text-purple-600">{tests.reduce((sum, test) => sum + (test.parameters || 0), 0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Selection Bar - Shows when tests are selected */}
        {selectedTests.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 flex justify-between items-center">
            <div>
              <i className="fas fa-check-circle text-blue-600 mr-2"></i>
              <span className="font-semibold">{selectedTests.length} test(s) selected</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleBulkStatusUpdate('active')}>
                <i className="fas fa-play mr-1"></i> Activate
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkStatusUpdate('inactive')}>
                <i className="fas fa-stop mr-1"></i> Deactivate
              </Button>
              <Button variant="danger" size="sm" onClick={handleBulkDelete}>
                <i className="fas fa-trash mr-1"></i> Delete
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedTests([])}>
                <i className="fas fa-times mr-1"></i> Clear
              </Button>
            </div>
          </div>
        )}

        {/* Tests Table with Select Checkbox */}
        <div className="bg-white rounded border card-shadow overflow-hidden">
          <DataTable columns={[
              {
                key: 'select',
                title: <input type="checkbox" checked={selectedTests.length === filteredTests.length && filteredTests.length > 0} onChange={handleSelectAll} />,
                render: (_, row) => (
                  <input type="checkbox" checked={selectedTests.includes(row.id)}
                    onChange={() => handleSelectTest(row.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                )
              },
              { key: 'id', title: 'Test Code', sortable: true },
              { key: 'name', title: 'Test Name', sortable: true },
              { key: 'category', title: 'Category', sortable: true },
              { key: 'sampleType', title: 'Sample Type', sortable: true },
              { key: 'turnaroundTime', title: 'Turnaround Time', sortable: true },
              { key: 'price', title: 'Price (₹)', sortable: true,
                render: (value) => `₹${value.toLocaleString('en-IN')}`
              },
              { key: 'parameters', title: 'Parameters', sortable: true },
              { key: 'status', title: 'Status', sortable: true,
                render: (value) => (
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    value === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {value.charAt(0).toUpperCase() + value.slice(1)}
                  </span>
                )
              },
              { key: 'actions', title: 'Actions',
                render: (_, row) => (
                  <div className="flex gap-2">
                    <button onClick={(e) => {
                        e.stopPropagation()
                        handleEditTest(row)
                      }}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                      title="Edit Test" >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button onClick={(e) => {
                        e.stopPropagation()
                        handleToggleTestStatus(row.id)
                      }}
                      className={`px-3 py-1 text-xs rounded hover:opacity-90 transition-colors ${
                        row.status === 'active' 
                          ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                      title={row.status === 'active' ? 'Deactivate' : 'Activate'} >
                      <i className={`fas ${row.status === 'active' ? 'fa-ban' : 'fa-check'}`}></i>
                    </button>
                    <button onClick={(e) => {
                        e.stopPropagation()
                        handleViewTest(row)
                      }}
                      className="px-3 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition-colors"
                      title="View Details" >
                      <i className="fas fa-eye"></i>
                    </button>
                  </div>
                )
              }
            ]}
            data={filteredTests}
            onRowClick={(test) => handleViewTest(test)}
            emptyMessage="No tests found. Add tests to build your catalogue."
          />
        </div>

        {/* Bulk Actions - Now Fully Functional */}
        <div className="bg-white p-4 rounded border card-shadow">
          <h3 className="text-lg font-semibold mb-3">Bulk Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" icon="fas fa-file-import" onClick={() => fileInputRef.current?.click()}>
              Import Tests
            </Button>
            <input ref={fileInputRef} type="file" accept=".json,.csv" onChange={handleImportTests} className="hidden" />
            <Button variant="outline" icon="fas fa-file-export" onClick={() => handleExportCatalogue('json')}>
              Export as JSON
            </Button>
            <Button variant="outline" icon="fas fa-file-csv" onClick={() => handleExportCatalogue('csv')}>
              Export as CSV
            </Button>
            <Button variant="outline" icon="fas fa-sync-alt" onClick={handleSyncWithLIS}>
              Sync with LIS
            </Button>
            <Button variant="outline" icon="fas fa-print" onClick={handlePrintCatalogue}>
              Print Catalogue
            </Button>
          </div>
          
          {/* Quick Stats for Bulk Actions */}
          <div className="mt-4 pt-3 border-t text-sm text-gray-500">
            <div className="flex gap-6">
              <span><i className="fas fa-database mr-1"></i> Total Tests: {tests.length}</span>
              <span><i className="fas fa-check-circle text-green-500 mr-1"></i> Active: {tests.filter(t => t.status === 'active').length}</span>
              <span><i className="fas fa-times-circle text-red-500 mr-1"></i> Inactive: {tests.filter(t => t.status === 'inactive').length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Import Confirmation Modal */}
      <Modal isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setImportData(null);
        }}
        title="Confirm Import" size="md" >
        <div className="space-y-4">
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-sm text-yellow-800">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              You are about to import {importData?.length || 0} test(s)
            </p>
          </div>
          <p className="text-sm text-gray-600">
            This will add new tests to your existing catalogue. Duplicate test codes may be created.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowImportModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={confirmImport}>
              Confirm Import
            </Button>
          </div>
        </div>
      </Modal>

      {/* Sync Modal */}
      <Modal isOpen={showSyncModal}
        onClose={() => !(syncStatus === 'syncing') && setShowSyncModal(false)}
        title="Synchronizing with LIS" size="sm" >
        <div className="text-center py-6">
          {syncStatus === 'syncing' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-700">Synchronizing test catalogue with Laboratory Information System...</p>
              <p className="text-sm text-gray-500 mt-2">Please wait</p>
            </>
          )}
          {syncStatus === 'completed' && (
            <>
              <i className="fas fa-check-circle text-green-500 text-5xl mb-4"></i>
              <p className="text-green-700 font-semibold">Sync Completed!</p>
              <p className="text-sm text-gray-500 mt-2">All tests have been synchronized</p>
            </>
          )}
        </div>
      </Modal>

      {/* Add Test Modal */}
      <Modal isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Test" size="lg" >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
          <div className="bg-blue-50 p-3 rounded">
            <p className="text-sm text-blue-800">
              <i className="fas fa-info-circle mr-2"></i>
              Fill in the test details below. Test code will be auto-generated.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Test Name * </label>
              <input type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Complete Blood Count" value={newTest.name} onChange={(e) => setNewTest({...newTest, name: e.target.value})}
                required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Test Code</label>
              <input type="text" className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-600" placeholder="Auto-generated"
                value={newTest.code || (newTest.name ? newTest.name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 10) : '')}
                readOnly
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category * </label>
              <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={newTest.category} onChange={(e) => setNewTest({...newTest, category: e.target.value})} required >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sample Type * </label>
              <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={newTest.sampleType} onChange={(e) => setNewTest({...newTest, sampleType: e.target.value})} required >
                <option value="">Select sample type</option>
                {sampleTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Turnaround Time * </label>
              <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={newTest.turnaroundTime} onChange={(e) => setNewTest({...newTest, turnaroundTime: e.target.value})} required >
                <option value="">Select turnaround time</option>
                {turnaroundOptions.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) * </label>
              <input type="number" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00" value={newTest.price} onChange={(e) => setNewTest({...newTest, price: e.target.value})} required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Test Instructions</label>
            <textarea className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="3" placeholder="Special instructions for sample collection or preparation..." value={newTest.instructions}
              onChange={(e) => setNewTest({...newTest, instructions: e.target.value})}
            />
          </div>

          {/* Parameters Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Test Parameters
              </label>
              <button type="button" onClick={handleAddParameter}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors" >
                <i className="fas fa-plus mr-1"></i> Add Parameter
              </button>
            </div>
            
            {newTest.parameters.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {newTest.parameters.map((param, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <input type="text" className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Parameter name" value={param.name} onChange={(e) => handleParameterChange(index, 'name', e.target.value)} />
                    <input type="text" className="w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Unit" value={param.unit} onChange={(e) => handleParameterChange(index, 'unit', e.target.value)} />
                    <input type="text" className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Reference range" value={param.range} onChange={(e) => handleParameterChange(index, 'range', e.target.value)} />
                    <button type="button" onClick={() => handleRemoveParameter(index)} className="px-3 py-2 text-red-600 hover:text-red-800 transition-colors">
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
                <i className="fas fa-chart-line text-gray-400 text-2xl mb-2"></i>
                <p className="text-gray-500">No parameters added yet</p>
                <p className="text-sm text-gray-400 mt-1">Add parameters to define what this test measures</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddTest}
              disabled={!newTest.name || !newTest.category || !newTest.sampleType || !newTest.turnaroundTime || !newTest.price} >
              Add Test
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Test Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Test" size="lg" >
        {currentTest && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
            <div className="bg-yellow-50 p-3 rounded">
              <p className="text-sm text-yellow-800">
                <i className="fas fa-edit mr-2"></i>
                Editing test: {currentTest.name}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Test Code
                </label>
                <input type="text" className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-600"
                  value={currentTest.code} readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Test Name *
                </label>
                <input type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={currentTest.name} onChange={(e) => setCurrentTest({...currentTest, name: e.target.value})} required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={currentTest.category} onChange={(e) => setCurrentTest({...currentTest, category: e.target.value})} required >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sample Type *
                </label>
                <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={currentTest.sampleType} onChange={(e) => setCurrentTest({...currentTest, sampleType: e.target.value})} required >
                  {sampleTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Turnaround Time *
                </label>
                <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={currentTest.turnaroundTime} onChange={(e) => setCurrentTest({...currentTest, turnaroundTime: e.target.value})} required >
                  {turnaroundOptions.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (₹) *
                </label>
                <input type="number" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={currentTest.price} onChange={(e) => setCurrentTest({...currentTest, price: e.target.value})} required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Test Instructions
              </label>
              <textarea className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="3" value={currentTest.instructions} onChange={(e) => setCurrentTest({...currentTest, instructions: e.target.value})} />
            </div>

            {/* Parameters Section for Edit */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Test Parameters
                </label>
                <button type="button" onClick={handleAddParameter} className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors" >
                  <i className="fas fa-plus mr-1"></i> Add Parameter
                </button>
              </div>
              
              {currentTest.parameters && currentTest.parameters.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {currentTest.parameters.map((param, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <input type="text" className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Parameter name" value={param.name} onChange={(e) => handleParameterChange(index, 'name', e.target.value)} />
                      <input type="text" className="w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Unit" value={param.unit} onChange={(e) => handleParameterChange(index, 'unit', e.target.value)} />
                      <input type="text" className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Reference range" value={param.range}onChange={(e) => handleParameterChange(index, 'range', e.target.value)}/>
                      <button type="button" onClick={() => handleRemoveParameter(index)}
                        className="px-3 py-2 text-red-600 hover:text-red-800 transition-colors" >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
                  <i className="fas fa-chart-line text-gray-400 text-2xl mb-2"></i>
                  <p className="text-gray-500">No parameters added yet</p>
                  <p className="text-sm text-gray-400 mt-1">Add parameters to define what this test measures</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleUpdateTest}
                disabled={!currentTest.name || !currentTest.category || !currentTest.sampleType || !currentTest.turnaroundTime || !currentTest.price} >
                Update Test
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* View Test Details Modal */}
      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Test Details" size="lg" >
        {currentTest && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{currentTest.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  <span className="font-mono font-semibold bg-gray-100 px-2 py-1 rounded">{currentTest.id}</span>
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                currentTest.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <i className={`fas ${currentTest.status === 'active' ? 'fa-check-circle' : 'fa-times-circle'} mr-1`}></i>
                {currentTest.status.charAt(0).toUpperCase() + currentTest.status.slice(1)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">
                  <i className="fas fa-tag mr-1"></i> Category
                </p>
                <p className="text-sm font-semibold text-gray-800">{currentTest.category}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">
                  <i className="fas fa-flask mr-1"></i> Sample Type
                </p>
                <p className="text-sm font-semibold text-gray-800">{currentTest.sampleType}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">
                  <i className="fas fa-rupee-sign mr-1"></i> Price
                </p>
                <p className="text-lg font-bold text-blue-600">₹{currentTest.price.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">
                  <i className="far fa-clock mr-1"></i> Turnaround Time
                </p>
                <div className="flex items-center gap-1">
                  <i className="far fa-hourglass-half text-blue-400"></i>
                  <span className="text-sm font-semibold text-gray-800">{currentTest.turnaroundTime}</span>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">
                  <i className="fas fa-chart-line mr-1"></i> Parameters
                </p>
                <p className="text-sm font-semibold text-gray-800">{currentTest.parameters || 0} Parameters</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">
                  <i className="fas fa-calendar-alt mr-1"></i> Last Updated
                </p>
                <p className="text-sm font-semibold text-gray-800">{new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {currentTest.instructions && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p className="text-xs uppercase tracking-wider text-blue-600 font-bold mb-2">
                  <i className="fas fa-info-circle mr-1"></i> Instructions
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">{currentTest.instructions}</p>
              </div>
            )}

            {currentTest.params && currentTest.params.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-3 flex items-center gap-2">
                  <i className="fas fa-list-ul"></i> Technical Parameters
                </p>
                <div className="overflow-hidden border rounded-lg">
                  <table className="w-full text-center text-sm">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 font-medium">
                      <tr>
                        <th className="px-4 py-3 border-b font-semibold text-center">Parameter Name</th>
                        <th className="px-4 py-3 border-b font-semibold text-center">Unit</th>
                        <th className="px-4 py-3 border-b font-semibold text-center">Reference Range</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {currentTest.params.map((p, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2.5 font-medium text-gray-800 text-center">{p.name}</td>
                          <td className="px-4 py-2.5 text-gray-600 font-mono text-xs text-center">{p.unit || 'N/A'}</td>
                          <td className="px-4 py-2.5 text-gray-600 text-center">{p.range || 'Not specified'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowViewModal(false)} >
                <i className="fas fa-times mr-2"></i> Close
              </Button>
              <Button variant="primary"
                onClick={() => {
                  setShowViewModal(false)
                  handleEditTest(currentTest)
                }} >
                <i className="fas fa-edit mr-2"></i> Edit Test
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Category Modal */}
      <Modal isOpen={showCategoryModal} onClose={() => setShowCategoryModal(false)} title="Add New Category" size="sm" >
        <div className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <i className="fas fa-info-circle mr-2"></i>
              Create new test categories to organize your test catalogue
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Name *
            </label>
            <input type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Molecular Diagnostics, Genetic Testing" value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
              autoFocus
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Category ID will be auto-generated from the name
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowCategoryModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddCategory} disabled={!newCategory.trim()} >
              <i className="fas fa-plus mr-2"></i> Add Category
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast Notifications */}
      {toast && (
        <Toast  key={toast.message + Date.now()} message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  )
}

export default TestCatalogue