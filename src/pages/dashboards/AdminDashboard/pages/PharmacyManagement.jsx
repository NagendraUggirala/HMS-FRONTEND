// src/pages/dashboards/AdminDashboard/pages/PharmacyManagement.jsx
import React, { useState, useEffect } from 'react'
import LoadingSpinner from '../../../../components/common/LoadingSpinner/LoadingSpinner'
import DataTable from '../../../../components/ui/Tables/DataTable'
import Modal from '../../../../components/common/Modal/Modal' // Your existing modal component

const PharmacyManagement = () => {
  const [loading, setLoading] = useState(true)
  const [medicines, setMedicines] = useState([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingMedicine, setEditingMedicine] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [newMedicine, setNewMedicine] = useState({
    name: '',
    category: '',
    stock: '',
    expiry: '',
    supplier: '',
    price: '',
    description: '',
    dosage: '',
    prescriptionRequired: false
  })

  useEffect(() => {
    loadMedicines()
  }, [])

  const loadMedicines = async () => {
    setLoading(true)
    setTimeout(() => {
      setMedicines([
        { id: 'DRG-001', name: 'Paracetamol', category: 'Pain Relief', stock: 145, expiry: '2029-12-31', supplier: 'MediCorp', price: 25, description: 'Pain reliever and fever reducer', dosage: '500mg', prescriptionRequired: false },
        { id: 'DRG-002', name: 'Azithromycin', category: 'Antibiotic', stock: 9, expiry: '2029-10-15', supplier: 'PharmaPlus', price: 120, description: 'Broad-spectrum antibiotic', dosage: '250mg', prescriptionRequired: true },
        { id: 'DRG-003', name: 'Insulin', category: 'Diabetes', stock: 180, expiry: '2026-04-20', supplier: 'BioMed', price: 450, description: 'Diabetes medication', dosage: '100IU/ml', prescriptionRequired: true },
        { id: 'DRG-004', name: 'Amoxicillin', category: 'Antibiotic', stock: 230, expiry: '2029-01-10', supplier: 'MediCorp', price: 85, description: 'Penicillin antibiotic', dosage: '500mg', prescriptionRequired: true },
        { id: 'DRG-005', name: 'Vitamin C', category: 'Supplements', stock: 300, expiry: '2029-09-30', supplier: 'HealthSupp', price: 35, description: 'Vitamin C supplement', dosage: '500mg', prescriptionRequired: false },
        { id: 'DRG-006', name: 'Metformin', category: 'Diabetes', stock: 120, expiry: '2028-06-18', supplier: 'GlucoCare', price: 95, description: 'Controls blood sugar levels', dosage: '500mg', prescriptionRequired: true },
        { id: 'DRG-007', name: 'Ibuprofen', category: 'Pain Relief', stock: 210, expiry: '2028-11-22', supplier: 'MediCorp', price: 40, description: 'Anti-inflammatory pain reliever', dosage: '400mg', prescriptionRequired: false },
        { id: 'DRG-008', name: 'Cetirizine', category: 'Allergy', stock: 95, expiry: '2026-06-12', supplier: 'AllerFree', price: 30, description: 'Relieves allergy symptoms', dosage: '10mg', prescriptionRequired: false },
        { id: 'DRG-009', name: 'Omeprazole', category: 'Gastro', stock: 160, expiry: '2026-03-25', supplier: 'DigestCare', price: 110, description: 'Reduces stomach acid', dosage: '20mg', prescriptionRequired: true },
        { id: 'DRG-010', name: 'Dolo 650', category: 'Pain Relief', stock: 75, expiry: '2027-12-15', supplier: 'Micro Labs', price: 28, description: 'Fever and pain relief tablet', dosage: '650mg', prescriptionRequired: false },
      ])
      setLoading(false)
    }, 1000)
  }

  const handleAddMedicine = () => {
    if (editingMedicine) {
      // Update existing medicine
      setMedicines(prev => prev.map(medicine => 
        medicine.id === editingMedicine.id 
          ? {
              ...medicine,
              name: newMedicine.name,
              category: newMedicine.category,
              stock: parseInt(newMedicine.stock),
              expiry: newMedicine.expiry,
              supplier: newMedicine.supplier,
              price: parseFloat(newMedicine.price),
              description: newMedicine.description,
              dosage: newMedicine.dosage,
              prescriptionRequired: newMedicine.prescriptionRequired
            }
          : medicine
      ))
    } else {
      // Add new medicine
      const medicine = {
        id: `DRG-${String(medicines.length + 1).padStart(3, '0')}`,
        name: newMedicine.name,
        category: newMedicine.category,
        stock: parseInt(newMedicine.stock),
        expiry: newMedicine.expiry,
        supplier: newMedicine.supplier,
        price: parseFloat(newMedicine.price),
        description: newMedicine.description,
        dosage: newMedicine.dosage,
        prescriptionRequired: newMedicine.prescriptionRequired
      }
      setMedicines(prev => [medicine, ...prev])
    }
    setIsAddModalOpen(false)
    setEditingMedicine(null)
    resetForm()
  }

  const handleEditMedicine = (medicineId) => {
    const medicine = medicines.find(m => m.id === medicineId)
    if (medicine) {
      setNewMedicine({
        name: medicine.name,
        category: medicine.category,
        stock: medicine.stock.toString(),
        expiry: medicine.expiry,
        supplier: medicine.supplier,
        price: medicine.price.toString(),
        description: medicine.description || '',
        dosage: medicine.dosage || '',
        prescriptionRequired: medicine.prescriptionRequired || false
      })
      setEditingMedicine(medicine)
      setIsAddModalOpen(true)
    }
  }

  const handleDeleteMedicine = (medicineId) => {
    if (window.confirm('Are you sure you want to delete this medicine?')) {
      setMedicines(prev => prev.filter(medicine => medicine.id !== medicineId))
    }
  }

  const handleTopUpMedicine = (medicineId) => {
    setMedicines(prev => prev.map(medicine => 
      medicine.id === medicineId 
        ? { ...medicine, stock: medicine.stock + 50 } 
        : medicine
    ))
  }

  const resetForm = () => {
    setNewMedicine({
      name: '',
      category: '',
      stock: '',
      expiry: '',
      supplier: '',
      price: '',
      description: '',
      dosage: '',
      prescriptionRequired: false
    })
    setEditingMedicine(null)
  }

  const handleInputChange = (field, value) => {
    setNewMedicine(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Sample data for dropdowns
  const categories = [
    'Pain Relief',
    'Antibiotic',
    'Diabetes',
    'Supplements',
    'Cardiology',
    'Neurology',
    'Gastrointestinal',
    'Respiratory',
    'Dermatology',
    'Vitamins'
  ]

  const suppliers = [
    'MediCorp',
    'PharmaPlus',
    'BioMed',
    'HealthSupp',
    'Global Pharma',
    'MediLife',
    'Care Pharmaceuticals',
    'Wellness Corp'
  ]

  const dosages = [
    '100mg',
    '250mg',
    '500mg',
    '1000mg',
    '50mg/ml',
    '100IU/ml',
    '25mg/5ml',
    '10mg'
  ]

  const lowStockItems = medicines.filter(item => item.stock < 10).length
  const expiringMedicines = medicines.filter(item => new Date(item.expiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
  const outOfStockItems = medicines.filter(item => item.stock === 0).length
  // Filtered medicines based on search and filters
  const filteredMedicines = medicines.filter(medicine => {
    const matchesSearch = medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         medicine.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !categoryFilter || medicine.category === categoryFilter
    const matchesSupplier = !supplierFilter || medicine.supplier === supplierFilter
    return matchesSearch && matchesCategory && matchesSupplier
  })

  const getStockStatus = (stock) => {
    if (stock === 0) return 'out-of-stock'
    if (stock < 10) return 'low-stock'
    if (stock < 20) return 'medium-stock'
    return 'good-stock'
  }

  const getStockColor = (stock) => {
    if (stock === 0) return 'text-red-600 bg-red-100'
    if (stock < 10) return 'text-yellow-600 bg-yellow-100'
    if (stock < 20) return 'text-orange-600 bg-orange-100'
    return 'text-green-600 bg-green-100'
  }

  if (loading) return <LoadingSpinner />
  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-700">
           Pharmacy Management
        </h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          onClick={() => setIsAddModalOpen(true)}>
          <i className="fas fa-plus mr-2"></i>Add Medicine
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Search & Filter Medicines</h3>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <input className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all pl-11"
              type="text" placeholder="Search by medicine name or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="fas fa-search absolute left-3 top-3.5 text-gray-400"></i>
          </div>
          <div className="w-full lg:w-48 relative">
            <select className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all appearance-none pr-10"
              value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <i className="fas fa-chevron-down absolute right-3 top-3.5 text-gray-400 pointer-events-none"></i>
          </div>
          <div className="w-full lg:w-48 relative">
            <select className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all appearance-none pr-10"
              value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)}>
              <option value="">All Suppliers</option>
              {suppliers.map(supplier => (
                <option key={supplier} value={supplier}>{supplier}</option>
              ))}
            </select>
            <i className="fas fa-chevron-down absolute right-3 top-3.5 text-gray-400 pointer-events-none"></i>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-2 shadow-sm">
          <div className="flex items-center">
            <i className="fas fa-exclamation-triangle text-yellow-600 text-xl mr-3"></i>
            <div>
              <h4 className="font-semibold text-yellow-800">Low Stock Alert</h4>
              <p className="text-yellow-700 text-sm">
                {lowStockItems} medicine(s) are running low on stock. Please reorder soon.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Expiry Alert */}
      {expiringMedicines.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex items-center">
            <i className="fas fa-exclamation-circle text-red-600 text-xl mr-3"></i>
            <div>
              <h4 className="font-semibold text-red-800">Expiry Alert</h4>
              <p className="text-red-700 text-sm">
                {expiringMedicines.length} medicine(s) have expired or are expiring within 30 days. Please review them.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Medicines Table */}
      <div className="bg-white rounded-xl card-shadow border overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Medicines</h3>
            <span className="text-sm font-semibold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
              {filteredMedicines.length} Medicines
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <DataTable
            columns={[
              { key: 'id', title: 'Drug ID', sortable: true },
              { key: 'name', title: 'Name', sortable: true },
              { key: 'category', title: 'Category',
                render: (value) => (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    {value}
                  </span>
                )
              },
              { key: 'stock', title: 'Stock', sortable: true,
                render: (value) => (
                  <span className={`${getStockColor(value)} px-2 py-1 rounded text-xs font-medium`}>
                    {value} units
                  </span>
                )
              },
              { key: 'expiry', title: 'Expiry Date', sortable: true,
                render: (value) => (
                  <span className={new Date(value) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'text-red-600' : 'text-gray-600'}>
                    {value}
                  </span>
                )
              },
              { key: 'supplier', title: 'Supplier', sortable: true },
              { key: 'price', title: 'Price', sortable: true, render: (value) => `₹${value}`},
              { key: 'actions', title: 'Actions', render: (_, row) => {
                  const isExpiring = new Date(row.expiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                  return (
                  <div className="flex justify-center items-center gap-2">
                    {isExpiring && (
                      <span className="flex items-center whitespace-nowrap text-red-600 text-[14px] cursor-help"
                        title="Expiring soon or already expired!">
                        <i className="fas fa-exclamation-triangle"></i>
                      </span>
                    )}
                    <button className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                      onClick={() => handleEditMedicine(row.id)} title="Edit">
                      <i className="fas fa-edit"></i>
                    </button>
                    <button className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                      onClick={() => handleDeleteMedicine(row.id)} title="Delete">
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                )}
              }
            ]}
            data={filteredMedicines}
          />
        </div>
      </div>


      {/* Add/Edit Medicine Modal */}
      <Modal isOpen={isAddModalOpen} size="lg" title={editingMedicine ? "Edit Medicine" : "Add New Medicine"}
        onClose={() => {
          setIsAddModalOpen(false)
          resetForm()
        }}>
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medicine Name <span className="text-red-500">*</span>
              </label>
              <input className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                type="text" required value={newMedicine.name} placeholder="Enter medicine name"
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                required value={newMedicine.category} onChange={(e) => handleInputChange('category', e.target.value)}>
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Quantity <span className="text-red-500">*</span>
              </label>
              <input className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="Enter stock quantity" type="number" required min="0" value={newMedicine.stock}
                onChange={(e) => handleInputChange('stock', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (₹) <span className="text-red-500">*</span>
              </label>
              <input className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="Enter price" type="number" required min="0" step="0.01" value={newMedicine.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
              />
            </div>
          </div>

          {/* Supplier and Expiry */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier <span className="text-red-500">*</span>
              </label>
              <select className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                required value={newMedicine.supplier} onChange={(e) => handleInputChange('supplier', e.target.value)}>
                <option value="">Select Supplier</option>
                {suppliers.map(supplier => (
                  <option key={supplier} value={supplier}>{supplier}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date <span className="text-red-500">*</span>
              </label>
              <input className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                type="date" min={new Date().toISOString().split('T')[0]} required
                value={newMedicine.expiry} onChange={(e) => handleInputChange('expiry', e.target.value)}
              />
            </div>
          </div>

          {/* Medical Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                value={newMedicine.dosage} onChange={(e) => handleInputChange('dosage', e.target.value)}>
                <option value="">Select Dosage</option>
                {dosages.map(dosage => (
                  <option key={dosage} value={dosage}>{dosage}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-center">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  type="checkbox" checked={newMedicine.prescriptionRequired}
                  onChange={(e) => handleInputChange('prescriptionRequired', e.target.checked)}
                />
                <span className="text-sm font-medium text-gray-700">Prescription Required</span>
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              rows="3" value={newMedicine.description}
              placeholder="Enter medicine description and usage instructions..."
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors" type="button"
              onClick={() => {
                setIsAddModalOpen(false)
                resetForm()
              }}>
              Cancel
            </button>
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              type="button" onClick={handleAddMedicine}
              disabled={!newMedicine.name || !newMedicine.category || !newMedicine.stock || !newMedicine.price || !newMedicine.supplier || !newMedicine.expiry}>
              <i className="fas fa-plus mr-2"></i>
              {editingMedicine ? 'Update Medicine' : 'Add Medicine'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default PharmacyManagement