import { useState, useEffect, useRef } from 'react'
import { X, Search } from 'lucide-react'

const BERAS_PER_JIWA_KG = 2.5

const ZakatFitrahModal = ({ isOpen, onClose, onSubmit, record = null, jamaahList = [], defaultYear, defaultRate = 45000 }) => {
  const [formData, setFormData] = useState({
    jamaah_id: '',
    year: defaultYear || String(new Date().getFullYear()),
    jumlah_jiwa: 1,
    payment_type: 'uang',
    rate_per_jiwa: defaultRate,
    amount_uang: defaultRate,
    amount_beras_kg: BERAS_PER_JIWA_KG,
    is_paid: false,
    notes: '',
  })

  // Jamaah search autocomplete state
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedJamaahName, setSelectedJamaahName] = useState('')
  const debounceTimer = useRef(null)
  const searchRef = useRef(null)

  // Debounce: update debouncedQuery 1 second after user stops typing
  const handleSearchChange = (e) => {
    const val = e.target.value
    setSearchQuery(val)
    setSelectedJamaahName('')
    setFormData(prev => ({ ...prev, jamaah_id: '' }))
    clearTimeout(debounceTimer.current)
    if (val.trim()) {
      debounceTimer.current = setTimeout(() => {
        setDebouncedQuery(val)
        setShowSuggestions(true)
      }, 1000)
    } else {
      setDebouncedQuery('')
      setShowSuggestions(false)
    }
  }

  const suggestions = debouncedQuery.trim()
    ? jamaahList.filter(j =>
        j.full_name.toLowerCase().includes(debouncedQuery.toLowerCase())
      ).slice(0, 8)
    : []

  const handleSelectJamaah = (j) => {
    setFormData(prev => ({ ...prev, jamaah_id: j.id }))
    setSelectedJamaahName(j.full_name)
    setSearchQuery(j.full_name)
    setShowSuggestions(false)
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (record) {
      const jamaah = jamaahList.find(j => j.id === record.jamaah_id)
      setSearchQuery(jamaah?.full_name || '')
      setSelectedJamaahName(jamaah?.full_name || '')
      setFormData({
        jamaah_id: record.jamaah_id || '',
        year: record.year || defaultYear,
        jumlah_jiwa: record.jumlah_jiwa || 1,
        payment_type: record.payment_type || 'uang',
        rate_per_jiwa: record.rate_per_jiwa || defaultRate,
        amount_uang: record.amount_uang || 0,
        amount_beras_kg: record.amount_beras_kg || 0,
        is_paid: record.is_paid || false,
        notes: record.notes || '',
      })
    } else {
      setSearchQuery('')
      setSelectedJamaahName('')
      setFormData({
        jamaah_id: '',
        year: defaultYear || String(new Date().getFullYear()),
        jumlah_jiwa: 1,
        payment_type: 'uang',
        rate_per_jiwa: defaultRate,
        amount_uang: defaultRate,
        amount_beras_kg: BERAS_PER_JIWA_KG,
        is_paid: false,
        notes: '',
      })
    }
    setShowSuggestions(false)
    setDebouncedQuery('')
  }, [record, isOpen, defaultYear, defaultRate])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => {
      const updated = { ...prev, [name]: type === 'checkbox' ? checked : value }

      // Auto-recalculate amounts when jiwa or rate changes
      if (name === 'jumlah_jiwa' || name === 'rate_per_jiwa') {
        const jiwa = Number(name === 'jumlah_jiwa' ? value : prev.jumlah_jiwa) || 1
        const rate = Number(name === 'rate_per_jiwa' ? value : prev.rate_per_jiwa) || 0
        updated.amount_uang = jiwa * rate
        updated.amount_beras_kg = jiwa * BERAS_PER_JIWA_KG
      }
      if (name === 'payment_type') {
        // Reset the unused amount
        if (value === 'uang') updated.amount_beras_kg = null
        if (value === 'beras') updated.amount_uang = null
      }
      return updated
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.jamaah_id) {
      alert('Pilih jamaah terlebih dahulu')
      return
    }
    const payload = {
      ...formData,
      jumlah_jiwa: Number(formData.jumlah_jiwa),
      rate_per_jiwa: Number(formData.rate_per_jiwa) || null,
      amount_uang: formData.payment_type === 'uang' ? Number(formData.amount_uang) || null : null,
      amount_beras_kg: formData.payment_type === 'beras' ? Number(formData.amount_beras_kg) || null : null,
    }
    onSubmit(payload)
  }

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)

  const calcTotal = formData.payment_type === 'uang'
    ? Number(formData.jumlah_jiwa) * Number(formData.rate_per_jiwa)
    : Number(formData.jumlah_jiwa) * BERAS_PER_JIWA_KG

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="relative z-10 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-green-600 px-6 py-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              {record ? 'Edit Catatan Zakat Fitrah' : 'Catat Zakat Fitrah'}
            </h3>
            <button onClick={onClose} className="text-white hover:bg-green-700 rounded-lg p-1 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="bg-white">
            <div className="px-6 py-5 space-y-4">
              {/* Jamaah search autocomplete */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jamaah <span className="text-red-500">*</span>
                </label>
                <div className="relative" ref={searchRef}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onFocus={() => debouncedQuery && setShowSuggestions(true)}
                      placeholder="Ketik nama jamaah..."
                      autoComplete="off"
                      className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        formData.jamaah_id ? 'border-green-400 bg-green-50' : 'border-gray-300'
                      }`}
                    />
                    {selectedJamaahName && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('')
                          setSelectedJamaahName('')
                          setFormData(prev => ({ ...prev, jamaah_id: '' }))
                          setDebouncedQuery('')
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {!formData.jamaah_id && searchQuery && !showSuggestions && debouncedQuery !== searchQuery && (
                    <p className="text-xs text-gray-400 mt-1">Menunggu sebentar...</p>
                  )}
                  {showSuggestions && (
                    <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {suggestions.length > 0 ? suggestions.map(j => (
                        <li
                          key={j.id}
                          onMouseDown={() => handleSelectJamaah(j)}
                          className="px-4 py-2 text-sm cursor-pointer hover:bg-green-50 hover:text-green-700"
                        >
                          {j.full_name}
                          {j.role && <span className="ml-2 text-xs text-gray-400 capitalize">{j.role}</span>}
                        </li>
                      )) : (
                        <li className="px-4 py-2 text-sm text-gray-400">Tidak ditemukan</li>
                      )}
                    </ul>
                  )}
                </div>
              </div>

              {/* Year + Jiwa */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
                  <input
                    type="text"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    maxLength={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Jiwa</label>
                  <input
                    type="number"
                    name="jumlah_jiwa"
                    min="1"
                    value={formData.jumlah_jiwa}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Payment type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Pembayaran</label>
                <div className="flex gap-4">
                  {['uang', 'beras'].map(type => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="payment_type"
                        value={type}
                        checked={formData.payment_type === type}
                        onChange={handleChange}
                        className="text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">
                        {type === 'uang' ? '💵 Uang (Fidyah)' : '🌾 Beras'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rate + Amount */}
              {formData.payment_type === 'uang' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tarif per Jiwa (Rp)</label>
                    <input
                      type="number"
                      name="rate_per_jiwa"
                      min="0"
                      step="1000"
                      value={formData.rate_per_jiwa}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Uang (Rp)</label>
                    <input
                      type="number"
                      name="amount_uang"
                      min="0"
                      value={formData.amount_uang}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Beras (kg) — {BERAS_PER_JIWA_KG} kg/jiwa
                  </label>
                  <input
                    type="number"
                    name="amount_beras_kg"
                    min="0"
                    step="0.5"
                    value={formData.amount_beras_kg}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              )}

              {/* Calculated preview */}
              <div className="bg-green-50 rounded-lg p-3 text-sm">
                <span className="text-green-700 font-medium">
                  Estimasi: {formData.jumlah_jiwa} jiwa → {' '}
                  {formData.payment_type === 'uang'
                    ? formatCurrency(calcTotal)
                    : `${calcTotal} kg beras`}
                </span>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_paid"
                  name="is_paid"
                  checked={formData.is_paid}
                  onChange={handleChange}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="is_paid" className="text-sm font-medium text-gray-700">Sudah Lunas</label>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Opsional..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {record ? 'Simpan Perubahan' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ZakatFitrahModal
