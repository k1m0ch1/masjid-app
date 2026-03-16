import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit, Trash2, CheckCircle, Clock, RefreshCw, Calculator } from 'lucide-react'
import { zakatFitrahAPI } from '../services/api'
import ZakatFitrahModal from './ZakatFitrahModal'

const BERAS_PER_JIWA_KG = 2.5

const ZakatFitrahTab = ({ jamaahList = [] }) => {
  const currentYear = String(new Date().getFullYear())

  const [year, setYear] = useState(currentYear)
  const [records, setRecords] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)

  // Calculator state
  const [calcJiwa, setCalcJiwa] = useState(1)
  const [calcRate, setCalcRate] = useState(45000)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [recRes, sumRes] = await Promise.all([
        zakatFitrahAPI.list({ year }),
        zakatFitrahAPI.summary(year),
      ])
      setRecords(recRes.data)
      setSummary(sumRes.data)
    } catch (err) {
      console.error('Gagal memuat data zakat fitrah:', err)
    } finally {
      setLoading(false)
    }
  }, [year])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAdd = () => {
    setSelectedRecord(null)
    setIsModalOpen(true)
  }

  const handleEdit = (record) => {
    setSelectedRecord(record)
    setIsModalOpen(true)
  }

  const handleSubmit = async (formData) => {
    try {
      if (selectedRecord) {
        await zakatFitrahAPI.update(selectedRecord.id, formData)
      } else {
        await zakatFitrahAPI.create(formData)
      }
      setIsModalOpen(false)
      setSelectedRecord(null)
      fetchData()
    } catch (err) {
      alert('Gagal menyimpan: ' + (err.response?.data?.detail || err.message))
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Hapus catatan zakat ini?')) return
    try {
      await zakatFitrahAPI.delete(id)
      fetchData()
    } catch (err) {
      alert('Gagal menghapus: ' + (err.response?.data?.detail || err.message))
    }
  }

  const handleMarkPaid = async (id) => {
    try {
      await zakatFitrahAPI.pay(id)
      fetchData()
    } catch (err) {
      alert('Gagal: ' + (err.response?.data?.detail || err.message))
    }
  }

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)

  const formatDate = (dt) => {
    if (!dt) return '-'
    return new Date(dt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const getJamaahName = (record) => record.jamaah?.full_name || jamaahList.find(j => j.id === record.jamaah_id)?.full_name || record.jamaah_id

  // Calculator result
  const calcTotalUang = calcJiwa * calcRate
  const calcTotalBeras = calcJiwa * BERAS_PER_JIWA_KG

  return (
    <div className="space-y-6">
      {/* Year selector + Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Tahun:</label>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {[currentYear, String(Number(currentYear) - 1), String(Number(currentYear) + 1)].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={fetchData}
            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Catat Zakat Fitrah</span>
        </button>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Catatan</p>
            <p className="text-2xl font-bold text-gray-900">{summary.total_records}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Jiwa</p>
            <p className="text-2xl font-bold text-blue-600">{summary.total_jiwa} jiwa</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Sudah Bayar</p>
            <p className="text-2xl font-bold text-green-600">{summary.total_paid}</p>
            <p className="text-xs text-gray-400 mt-0.5">{summary.total_jiwa_paid} jiwa</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Belum Bayar</p>
            <p className="text-2xl font-bold text-orange-600">{summary.total_pending}</p>
          </div>
        </div>
      )}

      {/* Collected summary */}
      {summary && (summary.total_beras_kg > 0 || summary.total_uang_idr > 0) && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-green-800 mb-2">Total Terkumpul ({year})</h3>
          <div className="flex flex-wrap gap-6">
            {summary.total_uang_idr > 0 && (
              <div>
                <p className="text-xs text-green-600">Uang</p>
                <p className="text-lg font-bold text-green-700">{formatCurrency(summary.total_uang_idr)}</p>
              </div>
            )}
            {summary.total_beras_kg > 0 && (
              <div>
                <p className="text-xs text-green-600">Beras</p>
                <p className="text-lg font-bold text-green-700">{summary.total_beras_kg} kg</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Calculator */}
      <div className="bg-white rounded-lg shadow p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="h-5 w-5 text-green-600" />
          <h3 className="text-base font-semibold text-gray-900">Kalkulator Zakat Fitrah</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Jiwa</label>
            <input
              type="number"
              min="1"
              value={calcJiwa}
              onChange={(e) => setCalcJiwa(Math.max(1, Number(e.target.value)))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tarif per Jiwa (Rp) <span className="text-gray-400 font-normal">— sesuai ketetapan BAZNAS</span>
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={calcRate}
              onChange={(e) => setCalcRate(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 bg-green-50 rounded-lg p-4">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Total Uang</p>
            <p className="text-xl font-bold text-green-700">{formatCurrency(calcTotalUang)}</p>
            <p className="text-xs text-gray-400">{calcJiwa} jiwa × {formatCurrency(calcRate)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Total Beras</p>
            <p className="text-xl font-bold text-green-700">{calcTotalBeras} kg</p>
            <p className="text-xs text-gray-400">{calcJiwa} jiwa × {BERAS_PER_JIWA_KG} kg</p>
          </div>
        </div>
      </div>

      {/* Records list */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="font-medium text-gray-900">Daftar Catatan Zakat Fitrah {year}</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          </div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            Belum ada catatan zakat fitrah untuk tahun {year}.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {records.map((record) => (
              <div key={record.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="mt-0.5">
                      {record.is_paid ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-orange-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium text-gray-900">{getJamaahName(record)}</h4>
                        <span className={`px-2 py-0.5 text-xs rounded font-medium ${
                          record.is_paid ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {record.is_paid ? 'Lunas' : 'Belum Bayar'}
                        </span>
                        <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600">
                          {record.jumlah_jiwa} jiwa
                        </span>
                        <span className="px-2 py-0.5 text-xs rounded bg-blue-50 text-blue-600">
                          {record.payment_type === 'beras' ? '🌾 Beras' : '💵 Uang'}
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap gap-3 text-sm text-gray-600">
                        {record.payment_type === 'uang' && record.amount_uang && (
                          <span className="font-medium text-green-700">{formatCurrency(record.amount_uang)}</span>
                        )}
                        {record.payment_type === 'beras' && record.amount_beras_kg && (
                          <span className="font-medium text-green-700">{record.amount_beras_kg} kg beras</span>
                        )}
                        {record.is_paid && record.paid_at && (
                          <span className="text-gray-400">Dibayar: {formatDate(record.paid_at)}</span>
                        )}
                        {record.notes && (
                          <span className="text-gray-400 italic truncate">{record.notes}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!record.is_paid && (
                      <button
                        onClick={() => handleMarkPaid(record.id)}
                        className="px-2 py-1 text-xs text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors font-medium"
                        title="Tandai Lunas"
                      >
                        Lunas
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(record)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(record.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ZakatFitrahModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedRecord(null) }}
        onSubmit={handleSubmit}
        record={selectedRecord}
        jamaahList={jamaahList}
        defaultYear={year}
        defaultRate={calcRate}
      />
    </div>
  )
}

export default ZakatFitrahTab
