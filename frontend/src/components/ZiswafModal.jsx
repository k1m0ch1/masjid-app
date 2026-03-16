import { useState, useEffect, useRef } from 'react'
import { X, Search } from 'lucide-react'

const ZISWAF_TYPES = [
  { value: 'zakat_mal', label: 'Zakat Mal', desc: 'Zakat atas harta/aset', color: 'emerald' },
  { value: 'zakat_profesi', label: 'Zakat Profesi', desc: 'Zakat penghasilan', color: 'teal' },
  { value: 'infaq', label: 'Infaq', desc: 'Sumbangan sukarela', color: 'blue' },
  { value: 'shadaqah', label: 'Shadaqah', desc: 'Sedekah umum', color: 'violet' },
  { value: 'wakaf_tunai', label: 'Wakaf Tunai', desc: 'Wakaf berupa uang', color: 'amber' },
  { value: 'wakaf_aset', label: 'Wakaf Aset', desc: 'Wakaf berupa properti/barang', color: 'orange' },
]

const today = () => new Date().toISOString().split('T')[0]

const ZiswafModal = ({ isOpen, onClose, onSubmit, record = null, jamaahList = [] }) => {
  const [formData, setFormData] = useState({
    type: 'infaq',
    jamaah_id: '',
    donor_name: '',
    is_anonymous: false,
    amount: '',
    transaction_date: today(),
    purpose: '',
    asset_description: '',
    asset_value: '',
    notes: '',
  })

  // Jamaah search autocomplete
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedJamaahName, setSelectedJamaahName] = useState('')
  const debounceTimer = useRef(null)
  const searchRef = useRef(null)

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
    ? jamaahList.filter(j => j.full_name.toLowerCase().includes(debouncedQuery.toLowerCase())).slice(0, 8)
    : []

  const handleSelectJamaah = (j) => {
    setFormData(prev => ({ ...prev, jamaah_id: j.id, donor_name: '' }))
    setSelectedJamaahName(j.full_name)
    setSearchQuery(j.full_name)
    setShowSuggestions(false)
  }

  const clearJamaah = () => {
    setSearchQuery('')
    setSelectedJamaahName('')
    setFormData(prev => ({ ...prev, jamaah_id: '' }))
    setDebouncedQuery('')
  }

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (record) {
      const jamaah = jamaahList.find(j => j.id === record.jamaah_id)
      setSearchQuery(jamaah?.full_name || '')
      setSelectedJamaahName(jamaah?.full_name || '')
      setFormData({
        type: record.type || 'infaq',
        jamaah_id: record.jamaah_id || '',
        donor_name: record.donor_name || '',
        is_anonymous: record.is_anonymous || false,
        amount: record.amount || '',
        transaction_date: record.transaction_date || today(),
        purpose: record.purpose || '',
        asset_description: record.asset_description || '',
        asset_value: record.asset_value || '',
        notes: record.notes || '',
      })
    } else {
      setSearchQuery('')
      setSelectedJamaahName('')
      setFormData({
        type: 'infaq',
        jamaah_id: '',
        donor_name: '',
        is_anonymous: false,
        amount: '',
        transaction_date: today(),
        purpose: '',
        asset_description: '',
        asset_value: '',
        notes: '',
      })
    }
    setShowSuggestions(false)
    setDebouncedQuery('')
  }, [record, isOpen])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const isWakafAset = formData.type === 'wakaf_aset'
    if (!formData.is_anonymous && !formData.jamaah_id && !formData.donor_name.trim()) {
      alert('Isi nama donatur atau pilih jamaah, atau centang Anonim')
      return
    }
    if (!isWakafAset && !formData.amount) {
      alert('Isi jumlah nominal')
      return
    }
    const payload = {
      ...formData,
      jamaah_id: formData.jamaah_id || null,
      donor_name: formData.jamaah_id ? null : (formData.donor_name.trim() || null),
      amount: isWakafAset ? null : (Number(formData.amount) || null),
      asset_value: isWakafAset ? (Number(formData.asset_value) || null) : null,
      asset_description: isWakafAset ? (formData.asset_description || null) : null,
    }
    onSubmit(payload)
  }

  const isWakafAset = formData.type === 'wakaf_aset'
  const typeInfo = ZISWAF_TYPES.find(t => t.value === formData.type)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="relative z-10 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-green-700 px-6 py-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              {record ? 'Edit Transaksi ZISWAF' : 'Catat ZISWAF'}
            </h3>
            <button onClick={onClose} className="text-white hover:bg-green-800 rounded-lg p-1 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="bg-white">
            <div className="px-6 py-5 space-y-4">

              {/* Type selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jenis <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-3 gap-2">
                  {ZISWAF_TYPES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, type: t.value }))}
                      className={`px-2 py-2 rounded-lg border text-xs font-medium transition-colors text-left ${
                        formData.type === t.value
                          ? 'border-green-600 bg-green-50 text-green-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold">{t.label}</div>
                      <div className="text-gray-400 font-normal mt-0.5">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Donor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Donatur</label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="is_anonymous"
                    name="is_anonymous"
                    checked={formData.is_anonymous}
                    onChange={handleChange}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label htmlFor="is_anonymous" className="text-sm text-gray-600">Anonim</label>
                </div>
                {!formData.is_anonymous && (
                  <>
                    {/* Jamaah search */}
                    <div className="relative mb-2" ref={searchRef}>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={handleSearchChange}
                          onFocus={() => debouncedQuery && setShowSuggestions(true)}
                          placeholder="Cari nama jamaah terdaftar..."
                          autoComplete="off"
                          className={`w-full pl-9 pr-8 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                            formData.jamaah_id ? 'border-green-400 bg-green-50' : 'border-gray-300'
                          }`}
                        />
                        {selectedJamaahName && (
                          <button type="button" onClick={clearJamaah} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      {showSuggestions && (
                        <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                          {suggestions.length > 0 ? suggestions.map(j => (
                            <li key={j.id} onMouseDown={() => handleSelectJamaah(j)}
                              className="px-4 py-2 text-sm cursor-pointer hover:bg-green-50 hover:text-green-700">
                              {j.full_name}
                              {j.role && <span className="ml-2 text-xs text-gray-400 capitalize">{j.role}</span>}
                            </li>
                          )) : (
                            <li className="px-4 py-2 text-sm text-gray-400">Tidak ditemukan</li>
                          )}
                        </ul>
                      )}
                    </div>
                    {/* Or manual name */}
                    {!formData.jamaah_id && (
                      <input
                        type="text"
                        name="donor_name"
                        value={formData.donor_name}
                        onChange={handleChange}
                        placeholder="Atau ketik nama donatur luar..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    )}
                  </>
                )}
              </div>

              {/* Date + Amount or Asset */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    name="transaction_date"
                    value={formData.transaction_date}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                {!isWakafAset ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nominal (Rp) <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      min="0"
                      step="1000"
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimasi Nilai (Rp)</label>
                    <input
                      type="number"
                      name="asset_value"
                      value={formData.asset_value}
                      onChange={handleChange}
                      min="0"
                      step="1000"
                      placeholder="Opsional"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                )}
              </div>

              {/* Wakaf aset description */}
              {isWakafAset && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Aset <span className="text-red-500">*</span></label>
                  <textarea
                    name="asset_description"
                    value={formData.asset_description}
                    onChange={handleChange}
                    rows="2"
                    placeholder="Contoh: Tanah seluas 200m² di Jl. Merdeka No. 5..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              )}

              {/* Purpose */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Peruntukan</label>
                <input
                  type="text"
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleChange}
                  placeholder="Contoh: Renovasi Masjid, Operasional, Bebas..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
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
              <button type="button" onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Batal
              </button>
              <button type="submit"
                className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors">
                {record ? 'Simpan Perubahan' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ZiswafModal
