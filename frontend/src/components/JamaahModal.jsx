import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const JamaahModal = ({ isOpen, onClose, onSubmit, jamaah = null }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    address: '',
    gender: 'male',
    date_of_birth: '',
    role: 'jamaah',

    // Potensi & Keahlian
    skills: [],
    education_level: '',
    occupation: '',

    // Kebutuhan
    needs: [],
    economic_status: 'menengah',
    health_status: 'sehat',

    // SDM & Honorarium (untuk imam, muadzin, marbot)
    monthly_honorarium: 0,
    bank_account: '',

    // Status
    is_active: true,
    join_date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  const [selectedSkills, setSelectedSkills] = useState([])
  const [selectedNeeds, setSelectedNeeds] = useState([])

  const defaultForm = {
    full_name: '', phone: '', email: '', address: '', gender: 'male',
    date_of_birth: '', role: 'jamaah', skills: [], education_level: '',
    occupation: '', needs: [], economic_status: 'menengah', health_status: 'sehat',
    monthly_honorarium: 0, bank_account: '', is_active: true,
    join_date: new Date().toISOString().split('T')[0], notes: '',
  }

  useEffect(() => {
    if (jamaah) {
      setFormData({
        ...defaultForm,
        ...jamaah,
        email: jamaah.email || '',
        phone: jamaah.phone || '',
        address: jamaah.address || '',
        occupation: jamaah.occupation || '',
        education_level: jamaah.education_level || '',
        bank_account: jamaah.bank_account || '',
        notes: jamaah.notes || '',
        date_of_birth: jamaah.date_of_birth || '',
        join_date: jamaah.join_date || new Date().toISOString().split('T')[0],
        monthly_honorarium: jamaah.monthly_honorarium || 0,
      })
      setSelectedSkills(jamaah.skills || [])
      setSelectedNeeds(jamaah.needs || [])
    } else {
      setFormData(defaultForm)
      setSelectedSkills([])
      setSelectedNeeds([])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jamaah, isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      skills: selectedSkills,
      needs: selectedNeeds,
    })
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const toggleSkill = (skill) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    )
  }

  const toggleNeed = (need) => {
    setSelectedNeeds(prev =>
      prev.includes(need)
        ? prev.filter(n => n !== need)
        : [...prev, need]
    )
  }

  const skillOptions = [
    'Hafidz Al-Quran',
    'Guru Mengaji',
    'Imam',
    'Muadzin',
    'Khatib',
    'Qari/Qariah',
    'Da\'i',
    'Guru TPQ',
    'Ahli Fiqih',
    'Teknologi',
    'Kesehatan',
    'Pendidikan',
    'Bisnis',
    'Konstruksi',
    'Desain',
  ]

  const needOptions = [
    'Bantuan Ekonomi',
    'Bantuan Pendidikan',
    'Bantuan Kesehatan',
    'Bimbingan Agama',
    'Konseling',
    'Pelatihan Keterampilan',
    'Bantuan Sosial',
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        onClick={onClose}
      />
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Modal */}
        <div className="relative z-10 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-green-600 px-6 py-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              {jamaah ? 'Edit Data Jamaah' : 'Tambah Jamaah Baru'}
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
            <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
              {/* Data Pribadi */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4 border-b pb-2">
                  Data Pribadi
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Lengkap <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      No. Telepon
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jenis Kelamin
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="male">Laki-laki</option>
                      <option value="female">Perempuan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tanggal Lahir
                    </label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tanggal Bergabung
                    </label>
                    <input
                      type="date"
                      name="join_date"
                      value={formData.join_date}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alamat
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>

              {/* Peran & Status */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4 border-b pb-2">
                  Peran & Status
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Peran di Masjid
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="jamaah">Jamaah</option>
                      <option value="pengurus">Pengurus</option>
                      <option value="imam">Imam</option>
                      <option value="muadzin">Muadzin</option>
                      <option value="marbot">Marbot</option>
                      <option value="ustadz">Ustadz</option>
                      <option value="bendahara">Bendahara</option>
                      <option value="ketua">Ketua Takmir</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status Ekonomi
                    </label>
                    <select
                      name="economic_status"
                      value={formData.economic_status}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="mampu">Mampu</option>
                      <option value="menengah">Menengah</option>
                      <option value="kurang_mampu">Kurang Mampu</option>
                      <option value="tidak_mampu">Tidak Mampu</option>
                      <option value="tidak_disebutkan">Tidak Disebutkan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pendidikan Terakhir
                    </label>
                    <select
                      name="education_level"
                      value={formData.education_level}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Pilih...</option>
                      <option value="SD">SD</option>
                      <option value="SMP">SMP</option>
                      <option value="SMA">SMA</option>
                      <option value="D3">D3</option>
                      <option value="S1">S1</option>
                      <option value="S2">S2</option>
                      <option value="S3">S3</option>
                      <option value="Pesantren">Pesantren</option>
                      <option value="Tidak Disebutkan">Tidak Disebutkan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pekerjaan
                    </label>
                    <input
                      type="text"
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleChange}
                      placeholder="Contoh: Guru, Wiraswasta, dll"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>

              {/* Potensi & Keahlian */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4 border-b pb-2">
                  Potensi & Keahlian
                </h4>
                <div className="flex flex-wrap gap-2">
                  {skillOptions.map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        selectedSkills.includes(skill)
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kebutuhan */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4 border-b pb-2">
                  Kebutuhan Jamaah
                </h4>
                <div className="flex flex-wrap gap-2">
                  {needOptions.map(need => (
                    <button
                      key={need}
                      type="button"
                      onClick={() => toggleNeed(need)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        selectedNeeds.includes(need)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {need}
                    </button>
                  ))}
                </div>
              </div>

              {/* Honorarium (untuk SDM) */}
              {['imam', 'muadzin', 'marbot'].includes(formData.role) && (
                <div className="mb-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-4 border-b pb-2">
                    Honorarium Bulanan
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nominal (Rp)
                      </label>
                      <input
                        type="number"
                        name="monthly_honorarium"
                        value={formData.monthly_honorarium}
                        onChange={handleChange}
                        min="0"
                        step="10000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        No. Rekening
                      </label>
                      <input
                        type="text"
                        name="bank_account"
                        value={formData.bank_account}
                        onChange={handleChange}
                        placeholder="Contoh: BCA 1234567890"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Catatan */}
              <div className="mb-4">
                <h4 className="text-md font-semibold text-gray-900 mb-4 border-b pb-2">
                  Catatan Tambahan
                </h4>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Catatan khusus tentang jamaah ini..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Status Aktif */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Status Aktif
                </label>
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
                {jamaah ? 'Simpan Perubahan' : 'Tambah Jamaah'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default JamaahModal
