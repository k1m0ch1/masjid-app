import { useState, useEffect, useCallback } from 'react'
import { addDays, format, isSameDay, startOfMonth, endOfMonth } from 'date-fns'
import { id } from 'date-fns/locale'
import { Plus, TrendingUp, TrendingDown, Calendar, Edit2, Trash2, RefreshCw, Download, ChevronDown, FileText, Paperclip } from 'lucide-react'
import { transactionAPI } from '../services/api'
import FinanceModal from '../components/FinanceModal'

const PAGE_SIZE = 15

const Finance = () => {
  const today = new Date()
  const [selectedDate, setSelectedDate] = useState(today)
  const [transactions, setTransactions] = useState([])
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, balance: 0 })
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [loadOffset, setLoadOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [showExport, setShowExport] = useState(false)
  const [exportRange, setExportRange] = useState('today') // today | monthly
  const [exportMonth, setExportMonth] = useState(format(today, 'yyyy-MM'))
  const [exportFormat, setExportFormat] = useState('csv')
  const [exporting, setExporting] = useState(false)

  const fetchSummary = useCallback(async () => {
    try {
      const startDate = format(startOfMonth(today), 'yyyy-MM-dd')
      const endDate = format(endOfMonth(today), 'yyyy-MM-dd')
      const res = await transactionAPI.summary({ start_date: startDate, end_date: endDate })
      const s = res.data
      setSummary({
        total_income: Number(s.total_income) || 0,
        total_expense: Number(s.total_expense) || 0,
        balance: Number(s.balance) || 0,
      })
    } catch (err) {
      console.error('Summary fetch error:', err)
    }
  }, [])

  const fetchTransactions = useCallback(async (date, offset, append) => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd')
      const params = {
        date: dateStr,
        skip: offset,
        limit: PAGE_SIZE + 1,
      }
      if (typeFilter !== 'all') {
        params.transaction_type = typeFilter
      }
      const res = await transactionAPI.list(params)
      const data = res.data || []
      const more = data.length > PAGE_SIZE
      const sliced = more ? data.slice(0, PAGE_SIZE) : data
      setHasMore(more)
      setLoadOffset(offset)
      if (append) {
        setTransactions(prev => [...prev, ...sliced])
      } else {
        setTransactions(sliced)
      }
    } catch (err) {
      console.error('Transactions fetch error:', err)
    }
  }, [typeFilter])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([fetchSummary(), fetchTransactions(selectedDate, 0, false)])
      setLoading(false)
    }
    init()
  }, [typeFilter])

  const handleDateChange = async (date) => {
    setSelectedDate(date)
    setLoadOffset(0)
    setLoading(true)
    await fetchTransactions(date, 0, false)
    setLoading(false)
  }

  const handleLoadMore = async () => {
    const newOffset = loadOffset + PAGE_SIZE
    await fetchTransactions(selectedDate, newOffset, true)
  }

  const handleAdd = () => {
    setSelectedTransaction(null)
    setIsModalOpen(true)
  }

  const handleEdit = (transaction) => {
    setSelectedTransaction(transaction)
    setIsModalOpen(true)
  }

  const handleSubmit = async (formData) => {
    try {
      if (selectedTransaction) {
        await transactionAPI.update(selectedTransaction.id, formData)
      } else {
        await transactionAPI.create(formData)
      }
      setIsModalOpen(false)
      setSelectedTransaction(null)
      setLoading(true)
      await Promise.all([fetchSummary(), fetchTransactions(selectedDate, 0, false)])
      setLoading(false)
    } catch (err) {
      console.error('Submit error:', err)
      alert('Gagal menyimpan transaksi')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Hapus transaksi ini?')) return
    try {
      await transactionAPI.delete(id)
      setLoading(true)
      await Promise.all([fetchSummary(), fetchTransactions(selectedDate, 0, false)])
      setLoading(false)
    } catch (err) {
      console.error('Delete error:', err)
      alert('Gagal menghapus transaksi')
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      let params = { format: exportFormat }
      if (exportRange === 'today') {
        const d = format(selectedDate, 'yyyy-MM-dd')
        params.start_date = d
        params.end_date = d
      } else {
        // monthly
        const [year, month] = exportMonth.split('-')
        const start = new Date(Number(year), Number(month) - 1, 1)
        const end = new Date(Number(year), Number(month), 0)
        params.start_date = format(start, 'yyyy-MM-dd')
        params.end_date = format(end, 'yyyy-MM-dd')
      }
      const res = await transactionAPI.export(params)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      const ext = exportFormat === 'excel' ? 'xlsx' : exportFormat
      a.href = url
      a.download = `mutasi-${params.start_date}-sd-${params.end_date}.${ext}`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export error:', err)
      alert('Gagal mengekspor data')
    } finally {
      setExporting(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getCategoryLabel = (transaction) => {
    const categories = {
      infaq_jumat: 'Infaq Jumat',
      infaq_harian: 'Infaq Harian',
      zakat_fitrah: 'Zakat Fitrah',
      zakat_mal: 'Zakat Mal',
      zakat_profesi: 'Zakat Profesi',
      infaq: 'Infaq',
      shadaqah: 'Shadaqah',
      fidyah: 'Fidyah',
      wakaf_tunai: 'Wakaf Tunai',
      donasi_pembangunan: 'Donasi Pembangunan',
      donasi_program: 'Donasi Program',
      sewa_fasilitas: 'Sewa Fasilitas',
      hasil_usaha: 'Hasil Usaha Masjid',
      gaji_imam: 'Gaji Imam',
      gaji_muadzin: 'Gaji Muadzin',
      gaji_marbot: 'Gaji Marbot',
      gaji_guru: 'Gaji Guru TPQ/Tahfidz',
      honor_ustadz: 'Honor Ustadz/Penceramah',
      listrik: 'Listrik',
      air: 'Air',
      internet: 'Internet',
      kebersihan: 'Kebersihan',
      pemeliharaan: 'Pemeliharaan/Perawatan',
      renovasi: 'Renovasi/Pembangunan',
      konsumsi: 'Konsumsi Kegiatan',
      perlengkapan_ibadah: 'Perlengkapan Ibadah',
      atk: 'ATK',
      sound_system: 'Sound System/Multimedia',
      distribusi_zakat: 'Distribusi Zakat',
      distribusi_infaq: 'Distribusi Infaq',
      operasional: 'Operasional Umum',
      lainnya: 'Lainnya',
    }
    const cat = transaction.transaction_type === 'income'
      ? transaction.income_category
      : transaction.expense_category
    return categories[cat] || cat || '-'
  }

  const getPaymentMethodLabel = (method) => {
    const labels = {
      cash: 'Tunai',
      transfer: 'Transfer',
      bank_transfer: 'Transfer Bank',
      qris: 'QRIS',
      e_wallet: 'E-Wallet',
    }
    return labels[method] || method || '-'
  }

  const canEditOrDelete = (transaction) => {
    return !transaction.source_type || transaction.source_type === 'manual'
  }

  // 7-day date strip
  const dateStrip = [-3, -2, -1, 0, 1, 2, 3].map(offset => addDays(today, offset))

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Keuangan</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola pemasukan dan pengeluaran masjid</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExport(prev => !prev)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Ekspor</span>
          </button>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Transaksi</span>
          </button>
        </div>
      </div>

      {/* Export Panel */}
      {showExport && (
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200 space-y-4">
          <h3 className="font-medium text-gray-900">Ekspor Transaksi</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Rentang</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setExportRange('today')}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    exportRange === 'today'
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Tanggal terpilih
                </button>
                <button
                  onClick={() => setExportRange('monthly')}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    exportRange === 'monthly'
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Bulanan
                </button>
              </div>
              {exportRange === 'monthly' && (
                <input
                  type="month"
                  value={exportMonth}
                  onChange={(e) => setExportMonth(e.target.value)}
                  className="mt-2 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Format</p>
              <div className="flex gap-2">
                {['csv', 'excel', 'pdf'].map(f => (
                  <button
                    key={f}
                    onClick={() => setExportFormat(f)}
                    className={`px-3 py-1.5 rounded-lg text-sm border uppercase transition-colors ${
                      exportFormat === f
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {exporting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Unduh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards - current month */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pemasukan Bulan Ini</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(summary.total_income)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pengeluaran Bulan Ini</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(summary.total_expense)}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Saldo Bulan Ini</p>
              <p className={`text-2xl font-bold mt-1 ${summary.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatCurrency(summary.balance)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 7-day Date Strip */}
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-sm font-medium text-gray-600 mb-3">Pilih Tanggal</p>
        <div className="grid grid-cols-7 gap-1">
          {dateStrip.map(d => (
            <button
              key={format(d, 'yyyy-MM-dd')}
              onClick={() => handleDateChange(d)}
              className={`flex flex-col items-center px-2 py-2 rounded-lg w-full transition-colors ${
                isSameDay(d, selectedDate)
                  ? 'bg-green-600 text-white'
                  : isSameDay(d, today)
                  ? 'bg-green-50 text-green-700 border border-green-300'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-xs font-medium">{format(d, 'EEE', { locale: id }).slice(0, 3)}</span>
              <span className="text-lg font-bold">{format(d, 'd')}</span>
              <span className="text-xs">{format(d, 'MMM', { locale: id })}</span>
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Menampilkan transaksi: <span className="font-medium">{format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: id })}</span>
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow p-2 flex gap-2">
        {[
          { key: 'all', label: 'Semua' },
          { key: 'income', label: 'Pemasukan' },
          { key: 'expense', label: 'Pengeluaran' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTypeFilter(key)}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              typeFilter === key
                ? key === 'expense'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-green-100 text-green-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Belum ada transaksi pada tanggal ini
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${
                      transaction.transaction_type === 'income' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {transaction.transaction_type === 'income' ? (
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900">{transaction.description}</h3>
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              transaction.transaction_type === 'income'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {getCategoryLabel(transaction)}
                            </span>
                            {transaction.source_type === 'ziswaf' && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                ZISWAF
                              </span>
                            )}
                            {transaction.is_anonymous && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                Anonim
                              </span>
                            )}
                          </div>
                        </div>
                        <p className={`text-lg font-semibold whitespace-nowrap ${
                          transaction.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.transaction_type === 'income' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(transaction.transaction_date), 'dd MMM yyyy', { locale: id })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          <span>{getPaymentMethodLabel(transaction.payment_method)}</span>
                        </div>
                        {transaction.donor_name && !transaction.is_anonymous && (
                          <span>Donatur: {transaction.donor_name}</span>
                        )}
                        {transaction.vendor_name && (
                          <span>{transaction.vendor_name}</span>
                        )}
                        {transaction.receipt_url && (
                          <a
                            href={transaction.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-green-600 hover:underline"
                          >
                            <Paperclip className="h-3 w-3" />
                            Bukti
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {canEditOrDelete(transaction) && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(transaction)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && !loading && (
          <div className="p-4 text-center border-t border-gray-200">
            <button
              onClick={handleLoadMore}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Muat Lebih Banyak
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      <FinanceModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedTransaction(null)
        }}
        onSubmit={handleSubmit}
        transaction={selectedTransaction}
      />
    </div>
  )
}

export default Finance
