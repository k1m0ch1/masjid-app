import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Search, Edit, Trash2, Phone, Briefcase, RefreshCw, Tag } from 'lucide-react'
import JamaahModal from '../components/JamaahModal'
import { jamaahAPI } from '../services/api'
import { getCachedJamaah, setCachedJamaah } from '../utils/jamaahCache'
const INITIAL_VISIBLE_JAMAAH = 16
const LOAD_MORE_JAMAAH = 12

const Jamaah = () => {
  const [jamaahList, setJamaahList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState('all')
  const [allTags, setAllTags] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedJamaah, setSelectedJamaah] = useState(null)
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_JAMAAH)

  const fetchJamaah = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Check cache first
      const cached = getCachedJamaah()
      if (cached) {
        setJamaahList(cached)
        setLoading(false)
        return
      }

      // Load all jamaah once, no filters (let client-side handle filtering)
      const res = await jamaahAPI.list({ limit: 500 })
      setJamaahList(res.data)
      setCachedJamaah(res.data) // Cache for 10 minutes
    } catch (err) {
      setError('Gagal memuat data jamaah. Pastikan backend berjalan.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchJamaah()
  }, [fetchJamaah])

  useEffect(() => {
    jamaahAPI.listTags().then(r => setAllTags(r.data)).catch(() => {})
  }, [])

  // Client-side filtering (no API call on filter change)
  const filteredJamaah = useMemo(() => {
    let result = jamaahList

    // Filter by search (name, phone, email)
    if (search.trim()) {
      const searchLower = search.toLowerCase()
      result = result.filter(j =>
        j.full_name?.toLowerCase().includes(searchLower) ||
        j.phone?.toLowerCase().includes(searchLower) ||
        j.email?.toLowerCase().includes(searchLower)
      )
    }

    // Filter by role
    if (roleFilter !== 'all') {
      result = result.filter(j => j.role === roleFilter)
    }

    // Filter by tag
    if (tagFilter !== 'all') {
      result = result.filter(j => j.tags?.some(t => t.id === tagFilter))
    }

    return result
  }, [jamaahList, search, roleFilter, tagFilter])

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_JAMAAH)
  }, [search, roleFilter, tagFilter])

  const handleAdd = () => {
    setSelectedJamaah(null)
    setIsModalOpen(true)
  }

  const handleEdit = (jamaah) => {
    setSelectedJamaah(jamaah)
    setIsModalOpen(true)
  }

  const handleSubmit = async (formData) => {
    try {
      const cleaned = cleanFormData(formData)
      if (selectedJamaah) {
        await jamaahAPI.update(selectedJamaah.id, cleaned)
      } else {
        await jamaahAPI.create(cleaned)
      }
      setIsModalOpen(false)
      setSelectedJamaah(null)
      fetchJamaah()
    } catch (err) {
      console.error('Gagal menyimpan data:', err)
      alert('Gagal menyimpan data: ' + (err.response?.data?.detail || err.message))
    }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Hapus data jamaah "${name}"?`)) return
    try {
      await jamaahAPI.delete(id)
      fetchJamaah()
    } catch (err) {
      alert('Gagal menghapus data: ' + (err.response?.data?.detail || err.message))
    }
  }

  const cleanFormData = (data) => {
    const result = { ...data }
    const optionalStr = ['email', 'phone', 'address', 'rt_rw', 'kelurahan', 'kecamatan', 'city',
      'postal_code', 'occupation', 'education_level', 'bank_account', 'notes', 'health_status',
      'date_of_birth', 'join_date']
    optionalStr.forEach(k => {
      if (result[k] === '') result[k] = null
    })
    if (result.monthly_honorarium === '' || result.monthly_honorarium === undefined) {
      result.monthly_honorarium = 0
    } else {
      result.monthly_honorarium = Number(result.monthly_honorarium) || 0
    }
    return result
  }

  const getRoleLabel = (role) => ({
    jamaah: 'Jamaah', pengurus: 'Pengurus', imam: 'Imam',
    muadzin: 'Muadzin', marbot: 'Marbot', bendahara: 'Bendahara',
    ketua: 'Ketua Takmir', ustadz: 'Ustadz',
  })[role] || role

  const getRoleBadgeColor = (role) => ({
    imam: 'bg-purple-100 text-purple-700',
    muadzin: 'bg-blue-100 text-blue-700',
    marbot: 'bg-orange-100 text-orange-700',
    pengurus: 'bg-green-100 text-green-700',
    bendahara: 'bg-indigo-100 text-indigo-700',
    ketua: 'bg-red-100 text-red-700',
    ustadz: 'bg-teal-100 text-teal-700',
    jamaah: 'bg-gray-100 text-gray-700',
  })[role] || 'bg-gray-100 text-gray-700'

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)

  const sdmRoles = ['imam', 'muadzin', 'marbot']
  const visibleJamaah = filteredJamaah.slice(0, visibleCount)
  const canLoadMoreJamaah = visibleCount < filteredJamaah.length

  const stats = {
    total: filteredJamaah.length,
    sdm: filteredJamaah.filter(j => sdmRoles.includes(j.role)).length,
    pengurus: filteredJamaah.filter(j => ['pengurus', 'bendahara', 'ketua'].includes(j.role)).length,
    butuhBantuan: filteredJamaah.filter(j => j.needs && j.needs.length > 0).length,
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jamaah</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola data jamaah dan SDM masjid</p>
        </div>
        <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Jamaah</span>
          </button>
      </div>

      {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Jamaah', value: stats.total, color: 'text-gray-900' },
              { label: 'SDM Aktif', value: stats.sdm, color: 'text-green-600' },
              { label: 'Pengurus', value: stats.pengurus, color: 'text-blue-600' },
              { label: 'Butuh Bantuan', value: stats.butuhBantuan, color: 'text-orange-600' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Search & Filter */}
          <div className="bg-white rounded-lg shadow p-4 space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari nama, telepon, atau email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <button
                onClick={fetchJamaah}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
            {/* Role filter chips */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { value: 'all', label: 'Semua', color: 'bg-gray-700 text-white' },
                { value: 'jamaah', label: 'Jamaah', color: 'bg-gray-100 text-gray-700' },
                { value: 'pengurus', label: 'Pengurus', color: 'bg-green-100 text-green-700' },
                { value: 'imam', label: 'Imam', color: 'bg-purple-100 text-purple-700' },
                { value: 'muadzin', label: 'Muadzin', color: 'bg-blue-100 text-blue-700' },
                { value: 'marbot', label: 'Marbot', color: 'bg-orange-100 text-orange-700' },
                { value: 'ustadz', label: 'Ustadz', color: 'bg-teal-100 text-teal-700' },
                { value: 'bendahara', label: 'Bendahara', color: 'bg-indigo-100 text-indigo-700' },
                { value: 'ketua', label: 'Ketua', color: 'bg-red-100 text-red-700' },
              ].map(({ value, label, color }) => (
                <button
                  key={value}
                  onClick={() => setRoleFilter(value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all border-2 ${
                    roleFilter === value
                      ? `${color} border-current opacity-100`
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Tag filter chips */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 items-center">
                <Tag className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                <button
                  onClick={() => setTagFilter('all')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all border-2 ${
                    tagFilter === 'all'
                      ? 'bg-gray-700 text-white border-current'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Semua Tag
                </button>
                {allTags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => setTagFilter(tagFilter === tag.id ? 'all' : tag.id)}
                    className="px-3 py-1 rounded-full text-xs font-medium transition-all border-2"
                    style={
                      tagFilter === tag.id
                        ? { backgroundColor: tag.color, borderColor: tag.color, color: '#fff' }
                        : { backgroundColor: '#fff', color: '#6b7280', borderColor: '#e5e7eb' }
                    }
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* List */}
          <div className="bg-white rounded-lg shadow">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Memuat data...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <p className="text-red-500 text-sm">{error}</p>
                <button onClick={fetchJamaah} className="mt-3 text-sm text-green-600 hover:underline">
                  Coba lagi
                </button>
              </div>
            ) : jamaahList.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {search
                  ? 'Tidak ditemukan data jamaah'
                  : 'Belum ada data jamaah. Klik "Tambah Jamaah" untuk memulai.'}
              </div>
            ) : (
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {visibleJamaah.map((jamaah) => (
                  <div key={jamaah.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow flex flex-col gap-2">
                    {/* Name + badges */}
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate" title={jamaah.full_name}>
                        {jamaah.full_name}
                      </h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(jamaah.role)}`}>
                          {getRoleLabel(jamaah.role)}
                        </span>
                        {!jamaah.is_active && (
                          <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-600">
                            Nonaktif
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex flex-col gap-1 text-xs text-gray-500 flex-1">
                      {jamaah.phone && (
                        <div className="flex items-center gap-1.5 truncate">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{jamaah.phone}</span>
                        </div>
                      )}
                      {jamaah.occupation && (
                        <div className="flex items-center gap-1.5 truncate">
                          <Briefcase className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{jamaah.occupation}</span>
                        </div>
                      )}
                      {jamaah.monthly_honorarium > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-green-600 font-medium">{formatCurrency(jamaah.monthly_honorarium)}/bln</span>
                        </div>
                      )}
                      {jamaah.skills && jamaah.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {jamaah.skills.slice(0, 2).map((skill, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">
                              {skill}
                            </span>
                          ))}
                          {jamaah.skills.length > 2 && (
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">+{jamaah.skills.length - 2}</span>
                          )}
                        </div>
                      )}
                      {jamaah.tags && jamaah.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {jamaah.tags.slice(0, 2).map(tag => (
                            <span
                              key={tag.id}
                              className="px-1.5 py-0.5 rounded text-xs font-medium text-white"
                              style={{ backgroundColor: tag.color }}
                            >
                              {tag.name}
                            </span>
                          ))}
                          {jamaah.tags.length > 2 && (
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">+{jamaah.tags.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 pt-1 border-t border-gray-100">
                      <button
                        onClick={() => handleEdit(jamaah)}
                        className="flex-1 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors flex items-center justify-center gap-1"
                      >
                        <Edit className="h-3 w-3" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(jamaah.id, jamaah.full_name)}
                        className="flex-1 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors flex items-center justify-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" /> Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && !error && jamaahList.length > 0 && (
              <div className="px-4 pb-4 flex justify-center">
                {canLoadMoreJamaah ? (
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + LOAD_MORE_JAMAAH)}
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Load More ({Math.min(LOAD_MORE_JAMAAH, jamaahList.length - visibleCount)} lagi)
                  </button>
                ) : (
                  <span className="text-xs text-gray-500">Semua data jamaah sudah ditampilkan</span>
                )}
              </div>
            )}
          </div>

      <JamaahModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedJamaah(null) }}
        onSubmit={handleSubmit}
        jamaah={selectedJamaah}
      />
    </div>
  )
}

export default Jamaah
