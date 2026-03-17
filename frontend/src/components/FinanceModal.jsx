import { useState, useEffect } from 'react'
import { X, Paperclip } from 'lucide-react'

const FinanceModal = ({ isOpen, onClose, onSubmit, transaction = null }) => {
  const [formData, setFormData] = useState({
    transaction_type: 'income',
    amount: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',

    // Income specific
    income_category: 'infaq_jumat',
    donor_name: '',
    is_anonymous: false,

    // Expense specific
    expense_category: 'operasional',
    vendor_name: '',

    notes: '',
    reference_number: '',
    receipt_url: '',
  })

  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (transaction) {
      setFormData({
        ...formData,
        ...transaction,
        amount: transaction.amount ? String(transaction.amount) : '',
      })
    } else {
      setFormData({
        transaction_type: 'income',
        amount: '',
        description: '',
        transaction_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        income_category: 'infaq_jumat',
        donor_name: '',
        is_anonymous: false,
        expense_category: 'operasional',
        vendor_name: '',
        notes: '',
        reference_number: '',
        receipt_url: '',
      })
    }
  }, [transaction, isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // Mosque-specific income categories
  const incomeCategories = [
    { value: 'infaq_jumat', label: 'Infaq Jumat' },
    { value: 'infaq_harian', label: 'Infaq Harian' },
    { value: 'zakat_fitrah', label: 'Zakat Fitrah' },
    { value: 'zakat_mal', label: 'Zakat Mal' },
    { value: 'zakat_profesi', label: 'Zakat Profesi' },
    { value: 'infaq', label: 'Infaq' },
    { value: 'shadaqah', label: 'Shadaqah' },
    { value: 'fidyah', label: 'Fidyah' },
    { value: 'wakaf_tunai', label: 'Wakaf Tunai' },
    { value: 'donasi_pembangunan', label: 'Donasi Pembangunan' },
    { value: 'donasi_program', label: 'Donasi Program' },
    { value: 'sewa_fasilitas', label: 'Sewa Fasilitas' },
    { value: 'hasil_usaha', label: 'Hasil Usaha Masjid' },
    { value: 'lainnya', label: 'Lainnya' },
  ]

  // Mosque-specific expense categories
  const expenseCategories = [
    { value: 'gaji_imam', label: 'Gaji Imam' },
    { value: 'gaji_muadzin', label: 'Gaji Muadzin' },
    { value: 'gaji_marbot', label: 'Gaji Marbot' },
    { value: 'gaji_guru', label: 'Gaji Guru TPQ/Tahfidz' },
    { value: 'honor_ustadz', label: 'Honor Ustadz/Penceramah' },
    { value: 'listrik', label: 'Listrik' },
    { value: 'air', label: 'Air' },
    { value: 'internet', label: 'Internet' },
    { value: 'kebersihan', label: 'Kebersihan' },
    { value: 'pemeliharaan', label: 'Pemeliharaan/Perawatan' },
    { value: 'renovasi', label: 'Renovasi/Pembangunan' },
    { value: 'konsumsi', label: 'Konsumsi Kegiatan' },
    { value: 'perlengkapan_ibadah', label: 'Perlengkapan Ibadah' },
    { value: 'atk', label: 'ATK' },
    { value: 'sound_system', label: 'Sound System/Multimedia' },
    { value: 'distribusi_zakat', label: 'Distribusi Zakat' },
    { value: 'distribusi_infaq', label: 'Distribusi Infaq' },
    { value: 'operasional', label: 'Operasional Umum' },
    { value: 'lainnya', label: 'Lainnya' },
  ]

  const paymentMethods = [
    { value: 'cash', label: 'Tunai' },
    { value: 'transfer', label: 'Transfer Bank' },
    { value: 'qris', label: 'QRIS' },
    { value: 'e_wallet', label: 'E-Wallet' },
  ]

  const formatCurrency = (value) => {
    const number = String(value).replace(/\D/g, '')
    return new Intl.NumberFormat('id-ID').format(number)
  }

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/\D/g, '')
    setFormData(prev => ({ ...prev, amount: value }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
        onClick={onClose}
      />
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Modal */}
        <div className="relative z-10 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className={`px-6 py-4 flex items-center justify-between ${
            formData.transaction_type === 'income' ? 'bg-green-600' : 'bg-red-600'
          }`}>
            <h3 className="text-lg font-semibold text-white">
              {transaction ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}
            </h3>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/10 rounded-lg p-1 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white">
            <div className="px-6 py-6 max-h-[70vh] overflow-y-auto space-y-6">
              {/* Tipe Transaksi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipe Transaksi
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, transaction_type: 'income' }))}
                    className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                      formData.transaction_type === 'income'
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    Pemasukan
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, transaction_type: 'expense' }))}
                    className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                      formData.transaction_type === 'expense'
                        ? 'border-red-600 bg-red-50 text-red-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    Pengeluaran
                  </button>
                </div>
              </div>

              {/* Kategori */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori <span className="text-red-500">*</span>
                </label>
                <select
                  name={formData.transaction_type === 'income' ? 'income_category' : 'expense_category'}
                  value={formData.transaction_type === 'income' ? formData.income_category : formData.expense_category}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {(formData.transaction_type === 'income' ? incomeCategories : expenseCategories).map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Jumlah */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jumlah <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    Rp
                  </span>
                  <input
                    type="text"
                    value={formData.amount ? formatCurrency(formData.amount) : ''}
                    onChange={handleAmountChange}
                    required
                    placeholder="0"
                    className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-lg font-semibold"
                  />
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  placeholder={formData.transaction_type === 'income' ? 'Contoh: Infaq Jumat Minggu ke-1' : 'Contoh: Bayar listrik bulan Maret'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Tanggal & Metode Pembayaran */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    name="transaction_date"
                    value={formData.transaction_date}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Metode Pembayaran
                  </label>
                  <select
                    name="payment_method"
                    value={formData.payment_method}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {paymentMethods.map(method => (
                      <option key={method.value} value={method.value}>{method.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Income Specific: Donatur */}
              {formData.transaction_type === 'income' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Donatur
                  </label>
                  <input
                    type="text"
                    name="donor_name"
                    value={formData.donor_name}
                    onChange={handleChange}
                    placeholder="Opsional - kosongkan jika Hamba Allah"
                    disabled={formData.is_anonymous}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_anonymous"
                      name="is_anonymous"
                      checked={formData.is_anonymous}
                      onChange={handleChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <label htmlFor="is_anonymous" className="text-sm text-gray-700">
                      Donatur Hamba Allah
                    </label>
                  </div>
                </div>
              )}

              {/* Expense Specific: Vendor */}
              {formData.transaction_type === 'expense' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor / Penerima
                  </label>
                  <input
                    type="text"
                    name="vendor_name"
                    value={formData.vendor_name}
                    onChange={handleChange}
                    placeholder="Contoh: Toko ABC, Nama Marbot, dll"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              )}

              {/* No. Bukti */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  No. Bukti / Kwitansi
                </label>
                <input
                  type="text"
                  name="reference_number"
                  value={formData.reference_number}
                  onChange={handleChange}
                  placeholder="Opsional"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Bukti Transaksi (receipt upload) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bukti Transaksi (Foto/PDF)
                </label>
                {formData.receipt_url && (
                  <div className="mb-2 flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-green-600" />
                    <a
                      href={formData.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-600 hover:underline"
                    >
                      Lihat Bukti
                    </a>
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, receipt_url: '' }))}
                      className="text-red-500 text-xs hover:text-red-700"
                    >
                      Hapus
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={async (e) => {
                    const file = e.target.files[0]
                    if (!file) return
                    setUploading(true)
                    try {
                      const fd = new FormData()
                      fd.append('file', file)
                      const res = await fetch(
                        `${import.meta.env.VITE_API_BASE_URL}/finance/upload-receipt`,
                        {
                          method: 'POST',
                          body: fd,
                          headers: {
                            Authorization: `Bearer ${localStorage.getItem('access_token') || ''}`,
                          },
                        }
                      )
                      const data = await res.json()
                      setFormData(prev => ({ ...prev, receipt_url: data.url }))
                    } catch (err) {
                      alert('Gagal upload bukti')
                    } finally {
                      setUploading(false)
                    }
                  }}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
                {uploading && <p className="text-xs text-gray-500 mt-1">Mengunggah...</p>}
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Catatan tambahan (opsional)"
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
                disabled={uploading}
                className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
                  formData.transaction_type === 'income'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {transaction ? 'Simpan Perubahan' : 'Simpan Transaksi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default FinanceModal
