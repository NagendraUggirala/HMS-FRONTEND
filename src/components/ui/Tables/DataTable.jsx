import React, { useState } from 'react'
 
const DataTable = ({
  columns = [],
  data = [],
  onRowClick,
  selectable = false,
  onSelectionChange
}) => {
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
 
  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }
 
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(new Set(data.map((_, index) => index)))
      onSelectionChange?.(data)
    } else {
      setSelectedRows(new Set())
      onSelectionChange?.([])
    }
  }
 
  const handleSelectRow = (index, row) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedRows(newSelected)
    onSelectionChange?.(Array.from(newSelected).map(i => data[i]))
  }
 
  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return data
 
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]
 
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })
  }, [data, sortConfig])
 
  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 text-center">
            <tr className='text-center'>
              {selectable && (
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  <input type="checkbox" checked={selectedRows.size === data.length && data.length > 0}
                    onChange={handleSelectAll} className="rounded border-gray-300 px-2 text-blue-600 focus:ring-blue-500" />
                </th>
              )}
              {columns.map(column => (
                <th key={column.key} className={`px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100
                  ${column.className || ''}`} onClick={() => column.sortable && handleSort(column.key)}>
                  <div className="flex items-center gap-1 justify-center">
                    {column.title}
                    {column.sortable && (
                      <i className={`fas fa-sort text-gray-400 text-xs ${
                        sortConfig.key === column.key ? 'text-blue-500' : ''
                      }`}></i>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((row, index) => (
              <tr key={index} className={`hover:bg-gray-50 transition-colors
                ${onRowClick ? 'cursor-pointer' : ''} ${selectedRows.has(index) ? 'bg-blue-50' : ''}`} onClick={() => onRowClick?.(row)}>
                {selectable && (
                  <td className="px-6 py-2 whitespace-nowrap text-center">
                    <input type="checkbox" checked={selectedRows.has(index)}
                      onChange={(e) => {
                        e.stopPropagation()
                        handleSelectRow(index, row)
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                )}
                {columns.map(column => (
                  <td key={column.key} className={`px-6 py-2 whitespace-nowrap text-sm text-gray-900 text-center ${column.className || ''}`}>
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
 
      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <i className="fas fa-inbox text-3xl mb-2"></i>
          <p>No data available</p>
        </div>
      )}
    </div>
  )
}
 
export default DataTable