import { useState, useEffect } from 'react'
import { Save, RefreshCw, Plus, Shield, Trash2 } from 'lucide-react'
import api, { userAccessAPI } from '../services/api'
import useAuthStore from '../stores/useAuthStore'

const INITIAL_FORM = {
  mosque_name: '',
  mosque_address: '',
  mosque_city: '',
  mosque_province: '',
  mosque_phone: '',
  mosque_email: '',
  mosque_website: '',
  mosque_founded_year: '',
  mosque_capacity: '',
  mosque_area: '',
  chairman_name: '',
  secretary_name: '',
  treasurer_name: '',
  bank_name: '',
  bank_account: '',
  bank_account_name: '',
  google_map_location: '',
  notes: '',
}

const MODULE_OPTIONS = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'jamaah', label: 'Jamaah' },
  { value: 'ziswaf', label: 'ZISWAF' },
  { value: 'finance', label: 'Keuangan' },
  { value: 'events', label: 'Kegiatan' },
  { value: 'pesan_kirim', label: 'Pesan' },
  { value: 'setting', label: 'Pengaturan' },
]

const ROLE_OPTIONS = [
  'admin',
  'pengurus',
  'bendahara',
  'imam',
  'muadzin',
  'member',
]

const INITIAL_INVITE = {
  email: '',
  full_name: '',
  role: 'member',
  is_allowed: true,
  allowed_modules: MODULE_OPTIONS.map((item) => item.value),
}

const formatDateTime = (value) => {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getMapEmbedUrl = (value) => {
  if (!value) return ''
  return `https://www.google.com/maps?q=${encodeURIComponent(value)}&output=embed`
}

export default function Setting() {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'

  const [form, setForm] = useState(INITIAL_FORM)
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  const [accessUsers, setAccessUsers] = useState([])
  const [accessLoading, setAccessLoading] = useState(false)
  const [accessError, setAccessError] = useState(null)
  const [inviteForm, setInviteForm] = useState(INITIAL_INVITE)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteMessage, setInviteMessage] = useState(null)
  const [userDrafts, setUserDrafts] = useState({})
  const [updatingUserId, setUpdatingUserId] = useState(null)
  const [removingUserId, setRemovingUserId] = useState(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [editingUserId, setEditingUserId] = useState(null)

  useEffect(() => {
    api
      .get('/settings')
      .then((r) => {
        setForm({ ...INITIAL_FORM, ...r.data })
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  const loadUserAccess = async () => {
    if (user?.role !== 'admin') return

    setAccessLoading(true)
    setAccessError(null)
    try {
      const response = await userAccessAPI.list()
      const users = response.data || []
      setAccessUsers(users)

      const drafts = {}
      users.forEach((item) => {
        drafts[item.id] = {
          full_name: item.full_name || '',
          role: item.role,
          is_active: item.is_active,
          is_allowed: item.is_allowed,
          allowed_modules: item.allowed_modules || [],
        }
      })
      setUserDrafts(drafts)
    } catch (err) {
      setAccessError(err?.response?.data?.detail || 'Gagal memuat daftar akses user.')
    } finally {
      setAccessLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      loadUserAccess()
    }
  }, [isAdmin])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async () => {
    setSaving(true)
    setError(null)
    try {
      await api.put('/settings', form)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Gagal menyimpan pengaturan. Silakan coba lagi.')
    } finally {
      setSaving(false)
    }
  }

  const handleInviteChange = (field, value) => {
    setInviteForm((prev) => ({ ...prev, [field]: value }))
  }

  const toggleInviteModule = (module) => {
    setInviteForm((prev) => {
      const exists = prev.allowed_modules.includes(module)
      const nextModules = exists
        ? prev.allowed_modules.filter((item) => item !== module)
        : [...prev.allowed_modules, module]
      return { ...prev, allowed_modules: nextModules }
    })
  }

  const getModuleTagClass = (isSelected) => {
    if (isSelected) {
      return 'border-green-500 bg-green-100 text-green-800'
    }
    return 'border-gray-200 text-gray-600 hover:border-green-300 hover:bg-green-50'
  }

  const handleInvite = async (e) => {
    e.preventDefault()
    setInviteMessage(null)
    setAccessError(null)

    if (!inviteForm.allowed_modules.length) {
      setAccessError('Pilih minimal 1 modul untuk user baru.')
      return
    }

    setInviteLoading(true)
    try {
      const payload = {
        email: inviteForm.email.trim(),
        full_name: inviteForm.full_name.trim() || undefined,
        role: inviteForm.role,
        is_allowed: inviteForm.is_allowed,
        allowed_modules: inviteForm.allowed_modules,
      }
      const response = await userAccessAPI.invite(payload)
      setInviteMessage(response.data?.message || 'Invite berhasil diproses.')
      setInviteForm({ ...INITIAL_INVITE, email: '', full_name: '' })
      setShowInviteModal(false)
      await loadUserAccess()
    } catch (err) {
      setAccessError(err?.response?.data?.detail || 'Gagal mengirim invite user.')
    } finally {
      setInviteLoading(false)
    }
  }

  const handleDraftChange = (userId, field, value) => {
    setUserDrafts((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value,
      },
    }))
  }

  const toggleUserModule = (userId, module) => {
    const draft = userDrafts[userId]
    if (!draft) return

    const exists = draft.allowed_modules.includes(module)
    const nextModules = exists
      ? draft.allowed_modules.filter((item) => item !== module)
      : [...draft.allowed_modules, module]

    handleDraftChange(userId, 'allowed_modules', nextModules)
  }

  const saveUserAccess = async (userId) => {
    const draft = userDrafts[userId]
    if (!draft) return

    setUpdatingUserId(userId)
    setAccessError(null)
    setInviteMessage(null)
    try {
      await userAccessAPI.update(userId, draft)
      setInviteMessage('Perubahan user berhasil disimpan.')
      await loadUserAccess()
      if (editingUserId === userId) {
        setEditingUserId(null)
      }
    } catch (err) {
      setAccessError(err?.response?.data?.detail || 'Gagal menyimpan perubahan user.')
    } finally {
      setUpdatingUserId(null)
    }
  }

  const openEditModal = (userId) => {
    setEditingUserId(userId)
    setAccessError(null)
    setInviteMessage(null)
  }

  const removeUserAccess = async (item) => {
    const confirmed = window.confirm(`Hapus user ${item.email}?`)
    if (!confirmed) return

    setRemovingUserId(item.id)
    setInviteMessage(null)
    setAccessError(null)
    try {
      const response = await userAccessAPI.remove(item.id)
      setInviteMessage(response?.data?.message || 'User berhasil dihapus.')
      if (editingUserId === item.id) {
        setEditingUserId(null)
      }
      await loadUserAccess()
    } catch (err) {
      setAccessError(err?.response?.data?.detail || 'Gagal menghapus user.')
    } finally {
      setRemovingUserId(null)
    }
  }

  const editingUser = accessUsers.find((item) => item.id === editingUserId) || null
  const editingDraft = editingUserId ? userDrafts[editingUserId] : null
  const mapEmbedUrl = getMapEmbedUrl(form.google_map_location)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan Masjid</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola profil masjid dan akses user</p>
      </div>

      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'profile'
                ? 'bg-white border border-gray-200 border-b-white text-gray-900'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Profil Masjid
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('access')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === 'access'
                  ? 'bg-white border border-gray-200 border-b-white text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Manajemen Akses User
            </button>
          )}
        </div>
      </div>

      {activeTab === 'profile' && saved && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
          Pengaturan berhasil disimpan!
        </div>
      )}
      {activeTab === 'profile' && error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="space-y-6">
        {/* Identitas Masjid */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Identitas Masjid</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Masjid <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="mosque_name"
                value={form.mosque_name}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Nama masjid"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
              <input
                type="text"
                name="mosque_address"
                value={form.mosque_address}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Alamat lengkap"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kota/Kabupaten</label>
              <input
                type="text"
                name="mosque_city"
                value={form.mosque_city}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Kota"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provinsi</label>
              <input
                type="text"
                name="mosque_province"
                value={form.mosque_province}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Provinsi"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label>
              <input
                type="text"
                name="mosque_phone"
                value={form.mosque_phone}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Contoh: 021-1234567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="mosque_email"
                value={form.mosque_email}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="email@masjid.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                type="text"
                name="mosque_website"
                value={form.mosque_website}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="https://masjid.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Berdiri</label>
              <input
                type="text"
                name="mosque_founded_year"
                value={form.mosque_founded_year}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Contoh: 1995"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Google Map Location</label>
              <input
                type="text"
                name="google_map_location"
                value={form.google_map_location}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="https://maps.app.goo.gl/... atau nama lokasi"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kapasitas (orang)</label>
              <input
                type="text"
                name="mosque_capacity"
                value={form.mosque_capacity}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Contoh: 500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Luas Area (m²)</label>
              <input
                type="text"
                name="mosque_area"
                value={form.mosque_area}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Contoh: 1000"
              />
            </div>
          </div>
        </div>

        {mapEmbedUrl && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Preview Lokasi Map</h2>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <iframe
                title="Google Map Location"
                src={mapEmbedUrl}
                className="w-full h-72"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        )}

        {/* Pengurus */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Pengurus</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ketua / Takmir</label>
              <input
                type="text"
                name="chairman_name"
                value={form.chairman_name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Nama ketua"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sekretaris</label>
              <input
                type="text"
                name="secretary_name"
                value={form.secretary_name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Nama sekretaris"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bendahara</label>
              <input
                type="text"
                name="treasurer_name"
                value={form.treasurer_name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Nama bendahara"
              />
            </div>
          </div>
        </div>

        {/* Rekening Bank */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Rekening Bank</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Bank</label>
              <input
                type="text"
                name="bank_name"
                value={form.bank_name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Contoh: BRI, BNI, Mandiri"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Rekening</label>
              <input
                type="text"
                name="bank_account"
                value={form.bank_account}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Nomor rekening"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Atas Nama</label>
              <input
                type="text"
                name="bank_account_name"
                value={form.bank_account_name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Nama pemilik rekening"
              />
            </div>
          </div>
        </div>

        {/* Catatan */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Catatan</h2>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            placeholder="Catatan tambahan tentang masjid..."
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end pb-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saved ? 'Tersimpan!' : saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
        </div>
      )}

      {activeTab === 'access' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-gray-700" />
              <h2 className="text-base font-semibold text-gray-800">Manajemen Akses User</h2>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setShowInviteModal(true)
                  setInviteMessage(null)
                  setAccessError(null)
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
              >
                <Plus className="h-4 w-4" />
                Invite User Baru
              </button>
            )}
          </div>

          {user?.role !== 'admin' ? (
            <p className="text-sm text-gray-600">Hanya admin yang bisa mengelola akses user.</p>
          ) : (
            <>
              {accessError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {accessError}
                </div>
              )}
              {inviteMessage && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  {inviteMessage}
                </div>
              )}

              {accessLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Memuat daftar user...
                </div>
              ) : (
                <div className="space-y-3">
                  {accessUsers.map((item) => {
                    const draft = userDrafts[item.id] || {
                      full_name: item.full_name || '',
                      role: item.role,
                      is_active: item.is_active,
                      is_allowed: item.is_allowed,
                      allowed_modules: item.allowed_modules || [],
                    }
                    const displayName = draft.full_name || item.full_name || '-'

                    return (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-900">{displayName}</p>
                            <p className="text-xs text-gray-500">{item.email}</p>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                              <span>Joined: {formatDateTime(item.created_at)}</span>
                              <span className="hidden sm:inline">•</span>
                              <span>Last login: {formatDateTime(item.last_login_at)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-medium">
                              {draft.role}
                            </span>
                            <button
                              type="button"
                              onClick={() => openEditModal(item.id)}
                              className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => removeUserAccess(item)}
                              disabled={removingUserId === item.id || item.id === user?.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-60"
                              title={item.id === user?.id ? 'Tidak bisa menghapus akun sendiri' : 'Hapus user'}
                            >
                              <Trash2 className="h-4 w-4" />
                              {removingUserId === item.id ? 'Menghapus...' : 'Hapus'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {!accessUsers.length && (
                    <p className="text-sm text-gray-600">Belum ada user terdaftar.</p>
                  )}
                </div>
              )}

              {showInviteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                  <div className="absolute inset-0 bg-black/40" onClick={() => setShowInviteModal(false)} />
                  <div className="relative z-10 w-full max-w-2xl bg-white rounded-xl shadow-xl border border-gray-200 p-5">
                    <h3 className="font-medium text-gray-800 mb-3">Invite User Baru</h3>

                    <form onSubmit={handleInvite}>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                        <input
                          type="email"
                          placeholder="email@domain.com"
                          value={inviteForm.email}
                          onChange={(e) => handleInviteChange('email', e.target.value)}
                          required
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Nama lengkap (opsional)"
                          value={inviteForm.full_name}
                          onChange={(e) => handleInviteChange('full_name', e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                        <select
                          value={inviteForm.role}
                          onChange={(e) => handleInviteChange('role', e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        >
                          {ROLE_OPTIONS.map((role) => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </div>

                      <label className="flex items-center gap-2 text-sm text-gray-700 mb-3">
                        <input
                          type="checkbox"
                          checked={inviteForm.is_allowed}
                          onChange={(e) => handleInviteChange('is_allowed', e.target.checked)}
                        />
                        User diizinkan login
                      </label>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                        {MODULE_OPTIONS.map((module) => {
                          const selected = inviteForm.allowed_modules.includes(module.value)
                          return (
                            <button
                              key={module.value}
                              type="button"
                              onClick={() => toggleInviteModule(module.value)}
                              className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${getModuleTagClass(selected)}`}
                            >
                              {module.label}
                            </button>
                          )
                        })}
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowInviteModal(false)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={inviteLoading}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-60"
                        >
                          {inviteLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                          {inviteLoading ? 'Memproses...' : 'Invite & Simpan Akses'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {editingUser && editingDraft && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                  <div className="absolute inset-0 bg-black/40" onClick={() => setEditingUserId(null)} />
                  <div className="relative z-10 w-full max-w-2xl bg-white rounded-xl shadow-xl border border-gray-200 p-5">
                    <h3 className="font-medium text-gray-800 mb-1">Edit User</h3>
                    <p className="text-xs text-gray-500 mb-3">{editingUser.email}</p>

                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editingDraft.full_name || ''}
                        onChange={(e) => handleDraftChange(editingUser.id, 'full_name', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        placeholder="Nama lengkap"
                      />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <select
                          value={editingDraft.role}
                          onChange={(e) => handleDraftChange(editingUser.id, 'role', e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        >
                          {ROLE_OPTIONS.map((role) => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>

                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={editingDraft.is_active}
                            onChange={(e) => handleDraftChange(editingUser.id, 'is_active', e.target.checked)}
                          />
                          Aktif
                        </label>

                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={editingDraft.is_allowed}
                            onChange={(e) => handleDraftChange(editingUser.id, 'is_allowed', e.target.checked)}
                          />
                          Diizinkan login
                        </label>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {MODULE_OPTIONS.map((module) => {
                          const selected = (editingDraft.allowed_modules || []).includes(module.value)
                          return (
                            <button
                              key={module.value}
                              type="button"
                              onClick={() => toggleUserModule(editingUser.id, module.value)}
                              className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${getModuleTagClass(selected)}`}
                            >
                              {module.label}
                            </button>
                          )
                        })}
                      </div>

                      <div className="text-[11px] text-gray-500">
                        Joined: {formatDateTime(editingUser.created_at)} • Last login: {formatDateTime(editingUser.last_login_at)}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => setEditingUserId(null)}
                        disabled={updatingUserId === editingUser.id}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-60"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={() => saveUserAccess(editingUser.id)}
                        disabled={updatingUserId === editingUser.id || removingUserId === editingUser.id}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-black disabled:opacity-60"
                      >
                        {updatingUserId === editingUser.id ? 'Menyimpan...' : 'Simpan'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
