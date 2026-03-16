import { useState, useEffect } from 'react'
import { Plus, RefreshCw, CheckCircle, Clock, Trash2, Edit, BadgeCheck } from 'lucide-react'
import { ziswafAPI, jamaahAPI } from '../services/api'
import ZiswafModal from '../components/ZiswafModal'

const TYPE_META = {
  zakat_mal:     { label: 'Zakat Mal',     emoji: '💰', color: 'bg-emerald-100 text-emerald-700' },
  zakat_profesi: { label: 'Zakat Profesi', emoji: '💼', color: 'bg-teal-100 text-teal-700' },
  infaq:         { label: 'Infaq',         emoji: '🤲', color: 'bg-blue-100 text-blue-700' },
  shadaqah:      { label: 'Shadaqah',      emoji: '💝', color: 'bg-violet-100 text-violet-700' },
  wakaf_tunai:   { label: 'Wakaf Tunai',   emoji: '🏦', color: 'bg-amber-100 text-amber-700' },
  wakaf_aset:    { label: 'Wakaf Aset',    emoji: '🏠', color: 'bg-orange-100 text-orange-700' },
}

const FILTER_TYPES = [{ value: '', label: 'Semua' }, ...Object.entries(TYPE_META).map(([v, m]) => ({ value: v, label: m.label }))]

const formatCurrency = (n) =>
  n == null ? '-' : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'

export default function Ziswaf() {
  const [records, setRecords] = useState([])
  const [summary, setSummary] = useState(null)
  const [jamaahList, setJamaahList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterType, setFilterType] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editRecord, setEditRecord] = useState(null)

  const currentYear = new Date().getFullYear()

  const fetchAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = filterType ? { type: filterType } : {}
      const [recRes, sumRes, jamRes] = await Promise.all([
        ziswafAPI.list(params),
        ziswafAPI.summary({ date_from: `${currentYear}-01-01`, date_to: `${currentYear}-12-31` }),
        jamaahAPI.list({ limit: 1000 }),
      ])
      setRecords(recRes.data)
      setSummary(sumRes.data)
      setJamaahList(jamRes.data.items || jamRes.data)
    } catch (e) {
      setError('Gagal memuat data ZISWAF')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [filterType])

  const handleSubmit = async (payload) => {
    try {
      if (editRecord) {
        await ziswafAPI.update(editRecord.id, payload)
      } else {
        await ziswafAPI.create(payload)
      }
      setModalOpen(false)
      setEditRecord(null)
      fetchAll()
    } catch (e) {
      alert(e.response?.data?.detail || 'Gagal menyimpan')
    }
  }

  const handleDelete = async (id, label) => {
    if (!confirm(`Hapus transaksi "${label}"?`)) return
    try {
      await ziswafAPI.delete(id)
      fetchAll()
    } catch {
      alert('Gagal menghapus')
    }
  }

  const handleVerify = async (id) => {
    try {
      await ziswafAPI.verify(id)
      fetchAll()
    } catch {
      alert('Gagal verifikasi')
    }
  }

  const openAdd = () => { setEditRecord(null); setModalOpen(true) }
  const openEdit = (r) => { setEditRecord(r); setModalOpen(true) }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ZISWAF</h1>
          <p className="text-sm text-gray-500 mt-0.5">Zakat · Infaq · Shadaqah · Wakaf</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors text-sm font-medium">
          <Plus className="h-4 w-4" /> Catat ZISWAF
        </button>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {Object.entries(TYPE_META).map(([type, meta]) => {
            const s = summary.by_type.find(b => b.type === type)
            return (
              <div key={type} className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="text-lg mb-1">{meta.emoji}</div>
                <div className="text-xs font-medium text-gray-500">{meta.label}</div>
                <div className="text-sm font-bold text-gray-800 mt-1">
                  {s ? formatCurrency(s.total_amount) : 'Rp 0'}
                </div>
                <div className="text-xs text-gray-400">{s ? `${s.count} transaksi` : '0 transaksi'}</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Grand total */}
      {summary && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-5 flex items-center justify-between">
          <span className="text-sm font-medium text-green-800">Total Terkumpul {currentYear}</span>
          <span className="text-lg font-bold text-green-700">{formatCurrency(summary.grand_total)}</span>
        </div>
      )}

      {/* Filter + Refresh */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex gap-1 flex-wrap">
          {FILTER_TYPES.map(f => (
            <button key={f.value} onClick={() => setFilterType(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterType === f.value ? 'bg-green-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
        <button onClick={fetchAll} className="ml-auto p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto" />
            <p className="mt-2 text-sm text-gray-500">Memuat data...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 text-sm">{error}</div>
        ) : records.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">
            Belum ada data. Klik "Catat ZISWAF" untuk memulai.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Tanggal</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Jenis</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Donatur</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Peruntukan</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Nominal</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map(r => {
                const meta = TYPE_META[r.type] || {}
                const donorLabel = r.is_anonymous ? 'Anonim' : (r.resolved_donor_name || r.donor_name || '-')
                return (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(r.transaction_date)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${meta.color}`}>
                        {meta.emoji} {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{donorLabel}</td>
                    <td className="px-4 py-3 text-gray-500 truncate max-w-[120px]">
                      {r.type === 'wakaf_aset' ? (r.asset_description || '-') : (r.purpose || '-')}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-800 whitespace-nowrap">
                      {r.type === 'wakaf_aset'
                        ? (r.asset_value ? formatCurrency(r.asset_value) : '—')
                        : formatCurrency(r.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.is_verified
                        ? <span className="inline-flex items-center gap-1 text-green-600 text-xs"><CheckCircle className="h-3.5 w-3.5" /> Terverifikasi</span>
                        : <span className="inline-flex items-center gap-1 text-amber-500 text-xs"><Clock className="h-3.5 w-3.5" /> Menunggu</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        {!r.is_verified && (
                          <button onClick={() => handleVerify(r.id)} title="Verifikasi"
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors">
                            <BadgeCheck className="h-4 w-4" />
                          </button>
                        )}
                        <button onClick={() => openEdit(r)} title="Edit"
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(r.id, meta.label)} title="Hapus"
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <ZiswafModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditRecord(null) }}
        onSubmit={handleSubmit}
        record={editRecord}
        jamaahList={jamaahList}
      />
    </div>
  )
}
