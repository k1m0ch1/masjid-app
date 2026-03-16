import { useState, useEffect } from 'react'
import { Plus, Calendar, MapPin, Users, User, Edit, Trash2, Clock, MessageCircle, RefreshCw, Search } from 'lucide-react'
import { format, isFuture, isPast } from 'date-fns'
import { id } from 'date-fns/locale'
import EventModal from '../components/EventModal'
import WhatsAppSendModal from '../components/WhatsAppSendModal'
import { eventAPI } from '../services/api'

const EVENT_TYPES = [
  { value: 'all', label: 'Semua Tipe' },
  { value: 'pengajian', label: 'Pengajian' },
  { value: 'tahfidz', label: 'Tahfidz' },
  { value: 'kajian', label: 'Kajian' },
  { value: 'tpq', label: 'TPQ/TPA' },
  { value: 'friday_prayer', label: 'Jumat' },
  { value: 'tarawih', label: 'Tarawih' },
  { value: 'eid', label: 'Hari Raya' },
  { value: 'qurban', label: 'Qurban' },
  { value: 'aqiqah', label: 'Aqiqah' },
  { value: 'wedding', label: 'Pernikahan' },
  { value: 'funeral', label: 'Pemakaman' },
  { value: 'meeting', label: 'Rapat' },
  { value: 'cleaning', label: 'Bersih-bersih' },
  { value: 'renovation', label: 'Renovasi' },
  { value: 'other', label: 'Lainnya' },
]

const INITIAL_VISIBLE_EVENTS = 5
const LOAD_MORE_EVENTS = 5

const Events = () => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [waEvent, setWaEvent] = useState(null)
  const [filter, setFilter] = useState('upcoming')
  const [search, setSearch] = useState('')
  const [eventTypeFilter, setEventTypeFilter] = useState('all')
  const [speakerFilter, setSpeakerFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_EVENTS)

  const fetchEvents = async () => {
    setLoading(true)
    setError(null)
    setVisibleCount(INITIAL_VISIBLE_EVENTS)
    try {
      const res = await eventAPI.list({ limit: 200 })
      setEvents(res.data)
    } catch {
      setError('Gagal memuat data kegiatan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEvents() }, [])

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_EVENTS)
  }, [search, eventTypeFilter, speakerFilter, startDate, endDate, filter])

  const filteredEvents = events.filter((event) => {
    const eventDate = new Date(event.start_datetime)

    if (filter === 'upcoming' && !isFuture(eventDate)) return false
    if (filter === 'past' && !isPast(eventDate)) return false

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      const haystack = [event.title, event.description, event.location, event.organizer]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(q)) return false
    }

    if (eventTypeFilter !== 'all' && event.event_type !== eventTypeFilter) return false

    if (speakerFilter.trim()) {
      const speaker = (event.speaker || '').toLowerCase()
      if (!speaker.includes(speakerFilter.trim().toLowerCase())) return false
    }

    if (startDate) {
      const start = new Date(`${startDate}T00:00:00`)
      if (eventDate < start) return false
    }

    if (endDate) {
      const end = new Date(`${endDate}T23:59:59`)
      if (eventDate > end) return false
    }

    return true
  }).sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime))

  const visibleEvents = filteredEvents.slice(0, visibleCount)
  const canLoadMoreEvents = visibleCount < filteredEvents.length

  const handleAdd = () => { setSelectedEvent(null); setIsModalOpen(true) }
  const handleEdit = (event) => { setSelectedEvent(event); setIsModalOpen(true) }

  const handleSubmit = async (formData) => {
    try {
      // Clean empty strings to null
      const clean = Object.fromEntries(
        Object.entries(formData).map(([k, v]) => [k, v === '' ? null : v])
      )
      if (selectedEvent) {
        await eventAPI.update(selectedEvent.id, clean)
      } else {
        await eventAPI.create(clean)
      }
      setIsModalOpen(false)
      setSelectedEvent(null)
      fetchEvents()
    } catch (e) {
      alert(e.response?.data?.detail || 'Gagal menyimpan kegiatan')
    }
  }

  const handleDelete = async (id, title) => {
    if (!confirm(`Hapus kegiatan "${title}"?`)) return
    try {
      await eventAPI.delete(id)
      fetchEvents()
    } catch {
      alert('Gagal menghapus')
    }
  }

  const getEventTypeLabel = (type) => ({
    pengajian: 'Pengajian', tahfidz: 'Tahfidz', kajian: 'Kajian', tpq: 'TPQ/TPA',
    friday_prayer: 'Jumat', tarawih: 'Tarawih', eid: 'Hari Raya', qurban: 'Qurban',
    aqiqah: 'Aqiqah', wedding: 'Pernikahan', funeral: 'Pemakaman', meeting: 'Rapat',
    cleaning: 'Bersih-bersih', renovation: 'Renovasi', other: 'Lainnya',
  }[type] || type)

  const getEventColor = (type) => ({
    pengajian: 'bg-purple-100 text-purple-700 border-purple-200',
    tahfidz: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    kajian: 'bg-blue-100 text-blue-700 border-blue-200',
    tpq: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    friday_prayer: 'bg-green-100 text-green-700 border-green-200',
    tarawih: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    eid: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    qurban: 'bg-orange-100 text-orange-700 border-orange-200',
    aqiqah: 'bg-pink-100 text-pink-700 border-pink-200',
    wedding: 'bg-rose-100 text-rose-700 border-rose-200',
    funeral: 'bg-gray-100 text-gray-700 border-gray-200',
    meeting: 'bg-slate-100 text-slate-700 border-slate-200',
    cleaning: 'bg-teal-100 text-teal-700 border-teal-200',
    renovation: 'bg-amber-100 text-amber-700 border-amber-200',
    other: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  }[type] || 'bg-neutral-100 text-neutral-700 border-neutral-200')

  const getBorderColor = (type) => getEventColor(type).split(' ')[2]

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kegiatan & Acara</h1>
          <p className="text-sm text-gray-500 mt-1">Jadwal kegiatan masjid</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchEvents} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
            <Plus className="h-4 w-4" /> Tambah Kegiatan
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{events.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Mendatang</p>
          <p className="text-2xl font-bold text-green-600">
            {events.filter(e => isFuture(new Date(e.start_datetime))).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Berulang</p>
          <p className="text-2xl font-bold text-blue-600">
            {events.filter(e => e.is_recurring).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Butuh Daftar</p>
          <p className="text-2xl font-bold text-purple-600">
            {events.filter(e => e.registration_required).length}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari judul, deskripsi, lokasi, penyelenggara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <input
            type="text"
            placeholder="Filter pembicara"
            value={speakerFilter}
            onChange={(e) => setSpeakerFilter(e.target.value)}
            className="w-full md:w-56 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {EVENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <button
            type="button"
            onClick={() => {
              setSearch('')
              setEventTypeFilter('all')
              setSpeakerFilter('')
              setStartDate('')
              setEndDate('')
              setFilter('upcoming')
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            Reset Filter
          </button>
        </div>

        <div className="flex gap-2">
          {[['upcoming', 'Mendatang', 'green'], ['past', 'Selesai', 'gray'], ['all', 'Semua', 'blue']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === val
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto" />
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-red-500 text-sm">{error}</p>
            <button onClick={fetchEvents} className="mt-2 text-sm text-green-600 hover:underline">Coba lagi</button>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500 text-sm">
            {filter === 'upcoming' ? 'Tidak ada kegiatan mendatang' : 'Belum ada kegiatan'}
          </div>
        ) : visibleEvents.map((event) => (
          <div key={event.id}
            className={`bg-white rounded-lg shadow hover:shadow-md transition-shadow border-l-4 ${getBorderColor(event.event_type)}`}>
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEventColor(event.event_type)}`}>
                      {getEventTypeLabel(event.event_type)}
                    </span>
                    {event.is_recurring && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">🔁 Berulang</span>
                    )}
                    {event.registration_required && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">📝 Daftar</span>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{event.title}</h3>
                  {event.description && <p className="text-sm text-gray-600 mb-3">{event.description}</p>}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>{format(new Date(event.start_datetime), 'EEEE, dd MMM yyyy', { locale: id })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span>
                        {format(new Date(event.start_datetime), 'HH:mm')}
                        {event.end_datetime && ` - ${format(new Date(event.end_datetime), 'HH:mm')}`}
                      </span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span>{event.location}</span>
                      </div>
                    )}
                    {event.speaker && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <User className="h-4 w-4 flex-shrink-0" />
                        <span>{event.speaker}</span>
                      </div>
                    )}
                    {event.max_participants && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Users className="h-4 w-4 flex-shrink-0" />
                        <span>Maks. {event.max_participants} peserta</span>
                      </div>
                    )}
                    {event.organizer && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Users className="h-4 w-4 flex-shrink-0" />
                        <span>{event.organizer}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <button onClick={() => setWaEvent(event)} title="Kirim via WhatsApp"
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                    <MessageCircle className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleEdit(event)} title="Edit"
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(event.id, event.title)} title="Hapus"
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!loading && !error && filteredEvents.length > 0 && (
        <div className="flex justify-center">
          {canLoadMoreEvents ? (
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + LOAD_MORE_EVENTS)}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Load More ({Math.min(LOAD_MORE_EVENTS, filteredEvents.length - visibleCount)} lagi)
            </button>
          ) : (
            <span className="text-xs text-gray-500">Semua kegiatan sudah ditampilkan</span>
          )}
        </div>
      )}

      <EventModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedEvent(null) }}
        onSubmit={handleSubmit}
        event={selectedEvent}
      />

      <WhatsAppSendModal
        isOpen={!!waEvent}
        onClose={() => setWaEvent(null)}
        event={waEvent}
      />
    </div>
  )
}

export default Events
