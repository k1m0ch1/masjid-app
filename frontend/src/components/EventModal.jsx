import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const EventModal = ({ isOpen, onClose, onSubmit, event = null }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'pengajian',
    start_datetime: '',
    end_datetime: '',
    location: 'Masjid',
    organizer: '',
    speaker: '',
    max_participants: '',
    is_recurring: false,
    recurrence_pattern: 'weekly',
    recurrence_days: [],
    recurrence_end_date: '',
    registration_required: false,
    registration_deadline: '',
    notes: '',
  })

  const [selectedDays, setSelectedDays] = useState([])

  useEffect(() => {
    if (event) {
      setFormData(event)
      setSelectedDays(event.recurrence_days || [])
    }
  }, [event])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      recurrence_days: selectedDays,
    })
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const toggleDay = (day) => {
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    )
  }

  const eventTypes = [
    { value: 'pengajian',     label: 'Pengajian',    active: 'border-purple-500 bg-purple-100 text-purple-800',  idle: 'border-gray-200 text-gray-600 hover:border-purple-300 hover:bg-purple-50' },
    { value: 'tahfidz',      label: 'Tahfidz',       active: 'border-indigo-500 bg-indigo-100 text-indigo-800',  idle: 'border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50' },
    { value: 'kajian',       label: 'Kajian',        active: 'border-blue-500 bg-blue-100 text-blue-800',        idle: 'border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50' },
    { value: 'tpq',          label: 'TPQ/TPA',       active: 'border-cyan-500 bg-cyan-100 text-cyan-800',        idle: 'border-gray-200 text-gray-600 hover:border-cyan-300 hover:bg-cyan-50' },
    { value: 'friday_prayer',label: 'Jumat',         active: 'border-green-500 bg-green-100 text-green-800',     idle: 'border-gray-200 text-gray-600 hover:border-green-300 hover:bg-green-50' },
    { value: 'tarawih',      label: 'Tarawih',       active: 'border-emerald-500 bg-emerald-100 text-emerald-800', idle: 'border-gray-200 text-gray-600 hover:border-emerald-300 hover:bg-emerald-50' },
    { value: 'eid',          label: 'Hari Raya',     active: 'border-yellow-500 bg-yellow-100 text-yellow-800',  idle: 'border-gray-200 text-gray-600 hover:border-yellow-300 hover:bg-yellow-50' },
    { value: 'qurban',       label: 'Qurban',        active: 'border-orange-500 bg-orange-100 text-orange-800',  idle: 'border-gray-200 text-gray-600 hover:border-orange-300 hover:bg-orange-50' },
    { value: 'aqiqah',       label: 'Aqiqah',        active: 'border-pink-500 bg-pink-100 text-pink-800',        idle: 'border-gray-200 text-gray-600 hover:border-pink-300 hover:bg-pink-50' },
    { value: 'wedding',      label: 'Pernikahan',    active: 'border-rose-500 bg-rose-100 text-rose-800',        idle: 'border-gray-200 text-gray-600 hover:border-rose-300 hover:bg-rose-50' },
    { value: 'funeral',      label: 'Pemakaman',     active: 'border-gray-500 bg-gray-200 text-gray-800',        idle: 'border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-100' },
    { value: 'meeting',      label: 'Rapat',         active: 'border-slate-500 bg-slate-100 text-slate-800',     idle: 'border-gray-200 text-gray-600 hover:border-slate-300 hover:bg-slate-50' },
    { value: 'cleaning',     label: 'Bersih-bersih', active: 'border-teal-500 bg-teal-100 text-teal-800',        idle: 'border-gray-200 text-gray-600 hover:border-teal-300 hover:bg-teal-50' },
    { value: 'renovation',   label: 'Renovasi',      active: 'border-amber-500 bg-amber-100 text-amber-800',     idle: 'border-gray-200 text-gray-600 hover:border-amber-300 hover:bg-amber-50' },
    { value: 'other',        label: 'Lainnya',       active: 'border-neutral-500 bg-neutral-100 text-neutral-800', idle: 'border-gray-200 text-gray-600 hover:border-neutral-400 hover:bg-neutral-50' },
  ]

  const recurrencePatterns = [
    { value: 'daily', label: 'Harian' },
    { value: 'weekly', label: 'Mingguan' },
    { value: 'monthly', label: 'Bulanan' },
  ]

  const daysOfWeek = [
    { value: 'monday', label: 'Sen' },
    { value: 'tuesday', label: 'Sel' },
    { value: 'wednesday', label: 'Rab' },
    { value: 'thursday', label: 'Kam' },
    { value: 'friday', label: 'Jum' },
    { value: 'saturday', label: 'Sab' },
    { value: 'sunday', label: 'Min' },
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Modal */}
        <div className="relative z-10 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          {/* Header */}
          <div className="bg-green-600 px-6 py-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              {event ? 'Edit Kegiatan' : 'Tambah Kegiatan Baru'}
            </h3>
            <button
              onClick={onClose}
              className="text-white hover:bg-green-700 rounded-lg p-1 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white">
            <div className="px-6 py-6 max-h-[70vh] overflow-y-auto space-y-6">
              {/* Tipe Kegiatan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipe Kegiatan <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {eventTypes.map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, event_type: type.value }))}
                      className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                        formData.event_type === type.value ? type.active : type.idle
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Judul */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Judul Kegiatan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="Contoh: Pengajian Ahad Pagi"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Deskripsi kegiatan..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Waktu */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mulai <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="start_datetime"
                    value={formData.start_datetime}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Selesai
                  </label>
                  <input
                    type="datetime-local"
                    name="end_datetime"
                    value={formData.end_datetime}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Lokasi & Pembicara */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lokasi
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Contoh: Masjid, Aula, dll"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pembicara / Ustadz
                  </label>
                  <input
                    type="text"
                    name="speaker"
                    value={formData.speaker}
                    onChange={handleChange}
                    placeholder="Nama pembicara"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Penyelenggara */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Penyelenggara
                </label>
                <input
                  type="text"
                  name="organizer"
                  value={formData.organizer}
                  onChange={handleChange}
                  placeholder="Contoh: Takmir Masjid, Remaja Masjid"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Kegiatan Berulang */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="is_recurring"
                    name="is_recurring"
                    checked={formData.is_recurring}
                    onChange={handleChange}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label htmlFor="is_recurring" className="text-sm font-medium text-gray-700">
                    Kegiatan Berulang
                  </label>
                </div>

                {formData.is_recurring && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pola Pengulangan
                      </label>
                      <select
                        name="recurrence_pattern"
                        value={formData.recurrence_pattern}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        {recurrencePatterns.map(pattern => (
                          <option key={pattern.value} value={pattern.value}>{pattern.label}</option>
                        ))}
                      </select>
                    </div>

                    {formData.recurrence_pattern === 'weekly' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hari
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {daysOfWeek.map(day => (
                            <button
                              key={day.value}
                              type="button"
                              onClick={() => toggleDay(day.value)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                selectedDays.includes(day.value)
                                  ? 'bg-green-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {day.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Berakhir Pada
                      </label>
                      <input
                        type="date"
                        name="recurrence_end_date"
                        value={formData.recurrence_end_date}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Pendaftaran */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="registration_required"
                    name="registration_required"
                    checked={formData.registration_required}
                    onChange={handleChange}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label htmlFor="registration_required" className="text-sm font-medium text-gray-700">
                    Butuh Pendaftaran
                  </label>
                </div>

                {formData.registration_required && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Maksimal Peserta
                      </label>
                      <input
                        type="number"
                        name="max_participants"
                        value={formData.max_participants}
                        onChange={handleChange}
                        min="1"
                        placeholder="Contoh: 50"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Batas Pendaftaran
                      </label>
                      <input
                        type="date"
                        name="registration_deadline"
                        value={formData.registration_deadline}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                )}
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
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {event ? 'Simpan Perubahan' : 'Buat Kegiatan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EventModal
