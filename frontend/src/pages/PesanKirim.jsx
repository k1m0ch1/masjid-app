import { useState, useEffect } from 'react'
import { RefreshCw, CheckCircle, Clock, XCircle, AlertCircle, Trash2, RotateCcw, MessageCircle, Users, Phone, Image } from 'lucide-react'
import { whatsappAPI } from '../services/api'
import WhatsAppSendForm from '../components/WhatsAppSendForm'

const STATUS_META = {
  pending:    { label: 'Menunggu',    color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  processing: { label: 'Memproses',  color: 'bg-blue-100 text-blue-700',    icon: RefreshCw },
  sent:       { label: 'Terkirim',   color: 'bg-green-100 text-green-700',  icon: CheckCircle },
  failed:     { label: 'Gagal',      color: 'bg-red-100 text-red-700',      icon: XCircle },
  cancelled:  { label: 'Dibatalkan', color: 'bg-gray-100 text-gray-500',    icon: AlertCircle },
}

const FILTER_OPTIONS = [
  { value: '', label: 'Semua' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'sent', label: 'Terkirim' },
  { value: 'failed', label: 'Gagal' },
  { value: 'cancelled', label: 'Dibatalkan' },
]

const formatDt = (dt) => dt
  ? new Date(dt).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '-'

export default function PesanKirim() {
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterStatus, setFilterStatus] = useState('')

  const fetchQueue = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = filterStatus ? { status: filterStatus } : {}
      const res = await whatsappAPI.listQueue(params)
      setQueue(res.data)
    } catch {
      setError('Gagal memuat data pesan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchQueue() }, [filterStatus])

  // Auto-refresh every 15s to catch status updates
  useEffect(() => {
    const interval = setInterval(fetchQueue, 15000)
    return () => clearInterval(interval)
  }, [filterStatus])

  const handleCancel = async (id) => {
    if (!confirm('Batalkan pesan ini?')) return
    try { await whatsappAPI.cancelQueue(id); fetchQueue() }
    catch (e) { alert(e.response?.data?.detail || 'Gagal membatalkan') }
  }

  const handleRetry = async (id) => {
    try { await whatsappAPI.retryQueue(id); fetchQueue() }
    catch (e) { alert(e.response?.data?.detail || 'Gagal retry') }
  }

  const counts = {
    pending: queue.filter(q => q.status === 'pending').length,
    sent: queue.filter(q => q.status === 'sent').length,
    failed: queue.filter(q => q.status === 'failed').length,
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pesan Kirim</h1>
          <p className="text-sm text-gray-500 mt-0.5">Antrean & riwayat pengiriman WhatsApp</p>
        </div>
        <button onClick={fetchQueue} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Send Form */}
      <div className="mb-6">
        <WhatsAppSendForm onMessageSent={fetchQueue} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-yellow-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-yellow-500" />
            <span className="text-xs font-medium text-gray-500">Menunggu</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{counts.pending}</p>
        </div>
        <div className="bg-white rounded-lg border border-green-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-xs font-medium text-gray-500">Terkirim</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{counts.sent}</p>
        </div>
        <div className="bg-white rounded-lg border border-red-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-xs font-medium text-gray-500">Gagal</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{counts.failed}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTER_OPTIONS.map(f => (
          <button key={f.value} onClick={() => setFilterStatus(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterStatus === f.value ? 'bg-green-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto" />
            <p className="mt-2 text-sm text-gray-500">Memuat...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-red-500 text-sm">{error}</div>
        ) : queue.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
            <MessageCircle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Belum ada pesan</p>
          </div>
        ) : queue.map(item => {
          const sm = STATUS_META[item.status] || STATUS_META.pending
          const StatusIcon = sm.icon
          return (
            <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Status + type badges */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${sm.color}`}>
                      <StatusIcon className="h-3 w-3" /> {sm.label}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                      item.recipient_type === 'group' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {item.recipient_type === 'group' ? <Users className="h-3 w-3" /> : <Phone className="h-3 w-3" />}
                      {item.recipient_type === 'group' ? 'Grup' : 'Personal'}
                    </span>
                    {item.message_type === 'image' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
                        <Image className="h-3 w-3" /> Gambar
                      </span>
                    )}
                  </div>

                  {/* Recipient */}
                  <p className="text-sm font-medium text-gray-800 truncate">
                    → {item.recipient_name || item.recipient}
                  </p>

                  {/* Message preview */}
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {item.message_type === 'image'
                      ? (item.caption || item.image_url || '(gambar)')
                      : (item.message || '(kosong)')}
                  </p>

                  {/* Error */}
                  {item.error && (
                    <p className="text-xs text-red-500 mt-1 bg-red-50 rounded px-2 py-1">
                      ⚠ {item.error}
                    </p>
                  )}

                  {/* Timestamps */}
                  <div className="flex gap-4 mt-2 text-xs text-gray-400">
                    <span>Dibuat: {formatDt(item.created_at)}</span>
                    {item.scheduled_at && !item.send_now && (
                      <span>Jadwal: {formatDt(item.scheduled_at)}</span>
                    )}
                    {item.sent_at && (
                      <span className="text-green-600">Terkirim: {formatDt(item.sent_at)}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  {item.status === 'pending' && (
                    <button onClick={() => handleCancel(item.id)} title="Batalkan"
                      className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors">
                      <XCircle className="h-4 w-4" />
                    </button>
                  )}
                  {(item.status === 'failed' || item.status === 'cancelled') && (
                    <button onClick={() => handleRetry(item.id)} title="Coba lagi"
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
