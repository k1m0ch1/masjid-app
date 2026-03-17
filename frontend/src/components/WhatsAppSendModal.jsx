import { useState, useEffect, useRef, useMemo } from 'react'
import { X, Search, MessageCircle, Users, Phone, Image, Clock, Send, UserSearch, Tag as TagIcon } from 'lucide-react'
import { whatsappAPI, jamaahAPI } from '../services/api'
import { getCachedJamaah, setCachedJamaah } from '../utils/jamaahCache'

const WhatsAppSendModal = ({ isOpen, onClose, event = null }) => {
  const [step, setStep] = useState('target')   // target | compose
  const [recipientType, setRecipientType] = useState('personal')

  // Personal
  const [phone, setPhone] = useState('')
  const [recipientName, setRecipientName] = useState('')

  // Jamaah Search
  const [showJamaahSearch, setShowJamaahSearch] = useState(false)
  const [jamaahList, setJamaahList] = useState([])
  const [jamaahLoading, setJamaahLoading] = useState(false)
  const [jamaahSearchText, setJamaahSearchText] = useState('')

  // Tag Selection
  const [useTag, setUseTag] = useState(false)
  const [tags, setTags] = useState([])
  const [tagSearchText, setTagSearchText] = useState('')
  const [selectedTag, setSelectedTag] = useState(null)

  // Group
  const [groups, setGroups] = useState([])
  const [groupSearch, setGroupSearch] = useState('')
  const [debouncedGroupSearch, setDebouncedGroupSearch] = useState('')
  const [showGroupSuggestions, setShowGroupSuggestions] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [groupsLoading, setGroupsLoading] = useState(false)
  const [groupsError, setGroupsError] = useState(null)
  const groupDebounce = useRef(null)
  const groupSearchRef = useRef(null)

  // Compose
  const [messageType, setMessageType] = useState('text')
  const [message, setMessage] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [caption, setCaption] = useState('')
  const [sendWhen, setSendWhen] = useState('now')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const EVENT_TYPE_LABELS = {
    pengajian: 'Pengajian', tahfidz: 'Tahfidz', kajian: 'Kajian Ilmu',
    tpq: 'TPQ/TPA', friday_prayer: 'Sholat Jumat', tarawih: 'Tarawih',
    eid: 'Hari Raya', qurban: 'Qurban', aqiqah: 'Aqiqah',
    wedding: 'Pernikahan', funeral: 'Pemakaman', meeting: 'Rapat',
    cleaning: 'Kerja Bakti', renovation: 'Renovasi', other: 'Kegiatan',
  }

  // Fetch jamaah & tags on mount
  useEffect(() => {
    if (isOpen) {
      // Check cache first
      const cached = getCachedJamaah()
      if (cached) {
        setJamaahList(cached)
      } else {
        // Fetch from API if no cache
        setJamaahLoading(true)
        jamaahAPI.list({ limit: 500 })
          .then(res => {
            setJamaahList(res.data)
            setCachedJamaah(res.data) // Cache for 10 minutes
          })
          .catch(err => console.error('Failed to load jamaah:', err))
          .finally(() => setJamaahLoading(false))
      }

      jamaahAPI.listTags()
        .then(res => setTags(res.data))
        .catch(err => console.error('Failed to load tags:', err))
    }
  }, [isOpen])

  // Pre-fill message from event
  useEffect(() => {
    if (event && isOpen) {
      const startDate = event.start_datetime ? new Date(event.start_datetime) : null
      const endDate = event.end_datetime ? new Date(event.end_datetime) : null
      const typeLabel = EVENT_TYPE_LABELS[event.event_type] || 'Kegiatan'

      const tanggal = startDate
        ? startDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        : ''
      const jamMulai = startDate
        ? startDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        : ''
      const jamSelesai = endDate
        ? endDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        : ''

      const lines = []
      lines.push(`Assalamu'alaikum Warahmatullahi Wabarakatuh 🌙`)
      lines.push(``)
      lines.push(`*${typeLabel.toUpperCase()}: ${event.title}*`)
      if (event.description) {
        lines.push(``)
        lines.push(event.description)
      }
      lines.push(``)
      lines.push(`━━━━━━━━━━━━━━━━━━━`)
      if (tanggal) lines.push(`📅 *Hari/Tanggal:* ${tanggal}`)
      if (jamMulai) lines.push(`🕐 *Waktu:* ${jamMulai}${jamSelesai ? ` - ${jamSelesai}` : ''} WIB`)
      if (event.location) lines.push(`📍 *Tempat:* ${event.location}`)
      if (event.speaker) lines.push(`🎤 *Pemateri:* ${event.speaker}`)
      if (event.organizer) lines.push(`👥 *Penyelenggara:* ${event.organizer}`)
      if (event.max_participants) lines.push(`👤 *Kuota:* ${event.max_participants} peserta`)
      lines.push(`━━━━━━━━━━━━━━━━━━━`)
      lines.push(``)
      lines.push(`Mohon kehadiran Bapak/Ibu/Saudara/i sekalian.`)
      lines.push(`Jazakumullahu Khairan Katsiran 🤲`)

      setMessage(lines.join('\n'))
    }
  }, [event, isOpen])

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setStep('target')
      setRecipientType('personal')
      setPhone('')
      setRecipientName('')
      setUseTag(false)
      setSelectedTag(null)
      setTagSearchText('')
      setJamaahSearchText('')
      setShowJamaahSearch(false)
      setGroupSearch('')
      setSelectedGroup(null)
      setGroups([])
      setMessageType('text')
      setMessage('')
      setImageUrl('')
      setCaption('')
      setSendWhen('now')
      setScheduledDate('')
      setScheduledTime('')
      setError(null)
    }
  }, [isOpen])

  // Fetch groups once when type=group
  useEffect(() => {
    if (recipientType === 'group' && groups.length === 0) {
      setGroupsLoading(true)
      setGroupsError(null)
      whatsappAPI.getGroups()
        .then(res => {
          const data = res.data?.results?.data || res.data?.data || []
          setGroups(data)
        })
        .catch(() => setGroupsError('Gagal memuat daftar grup'))
        .finally(() => setGroupsLoading(false))
    }
  }, [recipientType])

  // Debounce group search
  const handleGroupSearch = (e) => {
    const val = e.target.value
    setGroupSearch(val)
    setSelectedGroup(null)
    clearTimeout(groupDebounce.current)
    if (val.trim()) {
      groupDebounce.current = setTimeout(() => {
        setDebouncedGroupSearch(val)
        setShowGroupSuggestions(true)
      }, 1000)
    } else {
      setDebouncedGroupSearch('')
      setShowGroupSuggestions(false)
    }
  }

  const filteredGroups = debouncedGroupSearch
    ? groups.filter(g => g.Name?.toLowerCase().includes(debouncedGroupSearch.toLowerCase())).slice(0, 8)
    : []

  useEffect(() => {
    const h = (e) => { if (groupSearchRef.current && !groupSearchRef.current.contains(e.target)) setShowGroupSuggestions(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // Filter jamaah by search
  const filteredJamaah = useMemo(() => {
    if (!jamaahSearchText.trim()) return jamaahList
    const searchLower = jamaahSearchText.toLowerCase()
    return jamaahList.filter(j =>
      j.full_name?.toLowerCase().includes(searchLower) ||
      j.phone?.toLowerCase().includes(searchLower)
    )
  }, [jamaahList, jamaahSearchText])

  // Filter tags by search
  const filteredTags = useMemo(() => {
    if (!tagSearchText.trim()) return tags
    const searchLower = tagSearchText.toLowerCase()
    return tags.filter(t => t.name.toLowerCase().includes(searchLower))
  }, [tags, tagSearchText])

  // Tag member count
  const tagMemberCount = useMemo(() => {
    if (!selectedTag) return 0
    return jamaahList.filter(j => j.tags?.some(t => t.id === selectedTag.id)).length
  }, [selectedTag, jamaahList])

  // Format phone: 08xxx → 628xxx
  const formatPhone = (phone) => {
    if (!phone) return ''
    const clean = phone.replace(/\D/g, '')
    if (clean.startsWith('08')) {
      return '628' + clean.slice(2)
    }
    if (clean.startsWith('8')) {
      return '628' + clean.slice(1)
    }
    return clean
  }

  // Handle select jamaah
  const handleSelectJamaah = (jamaah) => {
    const formatted = formatPhone(jamaah.phone)
    setPhone(formatted)
    setRecipientName(jamaah.full_name || '')
    setShowJamaahSearch(false)
    setJamaahSearchText('')
  }

  // Handle select tag
  const handleSelectTag = (tag) => {
    setSelectedTag(tag)
    setTagSearchText(tag.name)
  }

  const canProceedTarget = () => {
    if (recipientType === 'personal') {
      if (useTag) return !!selectedTag
      return phone.trim().length >= 8
    }
    return !!selectedGroup
  }

  const handleSubmit = async () => {
    setError(null)
    setSubmitting(true)
    try {
      let scheduledAt = null
      if (sendWhen === 'later') {
        if (!scheduledDate || !scheduledTime) {
          setError('Pilih tanggal dan jam pengiriman')
          setSubmitting(false)
          return
        }
        scheduledAt = new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString()
      }

      // Mode: Tag-based bulk send
      if (recipientType === 'personal' && useTag && selectedTag) {
        await whatsappAPI.createQueue({
          event_id: event?.id || null,
          tag_id: selectedTag.id,
          message_type: messageType,
          message: messageType === 'text' ? message : null,
          image_url: messageType === 'image' ? imageUrl : null,
          caption: messageType === 'image' ? caption : null,
          send_now: sendWhen === 'now',
          scheduled_at: scheduledAt,
        })
        onClose()
        alert(`${tagMemberCount} pesan ${sendWhen === 'now' ? 'sedang dikirim' : 'dijadwalkan'}!`)
        return
      }

      // Mode: Single personal or group
      let recipient = ''
      let recipientNameDisplay = ''
      if (recipientType === 'personal') {
        recipient = phone.trim() + '@s.whatsapp.net'
        recipientNameDisplay = recipientName || phone.trim()
      } else {
        recipient = selectedGroup.JID
        recipientNameDisplay = selectedGroup.Name
      }

      await whatsappAPI.createQueue({
        event_id: event?.id || null,
        recipient_type: recipientType,
        recipient,
        recipient_name: recipientNameDisplay,
        message_type: messageType,
        message: messageType === 'text' ? message : null,
        image_url: messageType === 'image' ? imageUrl : null,
        caption: messageType === 'image' ? caption : null,
        send_now: sendWhen === 'now',
        scheduled_at: scheduledAt,
      })
      onClose()
      alert(sendWhen === 'now' ? 'Pesan sedang dikirim!' : 'Pesan dijadwalkan!')
    } catch (e) {
      setError(e.response?.data?.detail || 'Gagal menambahkan ke antrean')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
        <div className="relative z-10 bg-white rounded-xl shadow-xl w-full max-w-md">
          {/* Header */}
          <div className="bg-green-600 px-5 py-4 rounded-t-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-white" />
              <h3 className="text-base font-semibold text-white">
                Kirim Undangan WhatsApp
              </h3>
            </div>
            <button onClick={onClose} className="text-white hover:bg-green-700 rounded-lg p-1">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Event preview */}
          {event && (
            <div className="px-5 py-2 bg-green-50 border-b border-green-100 text-xs text-green-700">
              📅 <span className="font-medium">{event.title}</span>
            </div>
          )}

          <div className="px-5 py-5 space-y-5">
            {/* Step 1: Target */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Kirim ke</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRecipientType('personal')}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                    recipientType === 'personal'
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Phone className="h-4 w-4" /> Personal
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientType('group')}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                    recipientType === 'group'
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Users className="h-4 w-4" /> Grup
                </button>
              </div>
            </div>

            {/* Personal input */}
            {recipientType === 'personal' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nomor WhatsApp</label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(formatPhone(e.target.value))}
                      disabled={useTag}
                      placeholder="628123456789"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={() => setShowJamaahSearch(true)}
                      disabled={useTag}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1 text-sm flex-shrink-0"
                    >
                      <UserSearch className="h-4 w-4" />
                      Cari
                    </button>
                  </div>
                  {recipientName && !useTag && (
                    <p className="text-xs text-gray-500 mt-1">Kepada: {recipientName}</p>
                  )}
                </div>

                {/* Use Tag Toggle */}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useTag}
                      onChange={(e) => {
                        setUseTag(e.target.checked)
                        if (!e.target.checked) {
                          setSelectedTag(null)
                          setTagSearchText('')
                        }
                      }}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Gunakan Tag</span>
                  </label>
                </div>

                {/* Tag Autocomplete */}
                {useTag && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Tag</label>
                    <div className="relative">
                      <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white">
                        <TagIcon className="h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={tagSearchText}
                          onChange={(e) => {
                            setTagSearchText(e.target.value)
                            setSelectedTag(null)
                          }}
                          placeholder="Ketik untuk mencari tag..."
                          className="flex-1 outline-none text-sm"
                        />
                        {selectedTag && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTag(null)
                              setTagSearchText('')
                            }}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {/* Tag dropdown */}
                      {!selectedTag && tagSearchText && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                          {filteredTags.length === 0 ? (
                            <div className="p-3 text-sm text-gray-500 text-center">
                              Tag tidak ditemukan
                            </div>
                          ) : (
                            filteredTags.map(tag => (
                              <button
                                key={tag.id}
                                type="button"
                                onClick={() => handleSelectTag(tag)}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                              >
                                <TagIcon className="h-3 w-3 text-gray-400" />
                                <span className="font-medium text-gray-700">{tag.name}</span>
                                {tag.color && (
                                  <span
                                    className="w-3 h-3 rounded-full ml-auto"
                                    style={{ backgroundColor: tag.color }}
                                  />
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* Tag member count */}
                    {selectedTag && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">
                          {tagMemberCount} orang akan menerima pesan ini
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Group input */}
            {recipientType === 'group' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Grup</label>
                {groupsLoading ? (
                  <p className="text-sm text-gray-400">Memuat daftar grup...</p>
                ) : groupsError ? (
                  <p className="text-sm text-red-500">{groupsError}</p>
                ) : (
                  <div className="relative" ref={groupSearchRef}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        value={groupSearch}
                        onChange={handleGroupSearch}
                        onFocus={() => debouncedGroupSearch && setShowGroupSuggestions(true)}
                        placeholder="Cari nama grup... (tunggu 1 detik)"
                        autoComplete="off"
                        className={`w-full pl-9 pr-8 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                          selectedGroup ? 'border-green-400 bg-green-50' : 'border-gray-300'
                        }`}
                      />
                      {selectedGroup && (
                        <button type="button" onClick={() => { setSelectedGroup(null); setGroupSearch(''); setDebouncedGroupSearch('') }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {showGroupSuggestions && (
                      <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        {filteredGroups.length > 0 ? filteredGroups.map(g => (
                          <li key={g.JID}
                            onMouseDown={() => { setSelectedGroup(g); setGroupSearch(g.Name); setShowGroupSuggestions(false) }}
                            className="px-4 py-2 text-sm cursor-pointer hover:bg-green-50 hover:text-green-700">
                            {g.Name}
                            <span className="ml-2 text-xs text-gray-400">{g.Participants?.length || 0} anggota</span>
                          </li>
                        )) : (
                          <li className="px-4 py-2 text-sm text-gray-400">Grup tidak ditemukan</li>
                        )}
                      </ul>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{groups.length} grup tersedia</p>
                  </div>
                )}
              </div>
            )}

            {/* Compose section */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Isi Pesan</p>

              {/* Message type */}
              <div className="flex gap-2 mb-3">
                <button type="button" onClick={() => setMessageType('text')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    messageType === 'text' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600'
                  }`}>
                  <MessageCircle className="h-4 w-4" /> Teks
                </button>
                <button type="button" onClick={() => setMessageType('image')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    messageType === 'image' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600'
                  }`}>
                  <Image className="h-4 w-4" /> Gambar + Caption
                </button>
              </div>

              {messageType === 'text' ? (
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows="6"
                  placeholder="Ketik pesan..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm font-mono"
                />
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">URL Gambar <span className="text-red-500">*</span></label>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={e => setImageUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Caption</label>
                    <textarea
                      value={caption}
                      onChange={e => setCaption(e.target.value)}
                      rows="4"
                      placeholder="Teks caption gambar..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Schedule */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Waktu Kirim</p>
              <div className="flex gap-3 mb-3">
                {[['now', Send, 'Kirim sekarang'], ['later', Clock, 'Kirim nanti']].map(([val, Icon, label]) => (
                  <button key={val} type="button" onClick={() => setSendWhen(val)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                      sendWhen === val ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600'
                    }`}>
                    <Icon className="h-4 w-4" /> {label}
                  </button>
                ))}
              </div>
              {sendWhen === 'later' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Tanggal</label>
                    <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Jam</label>
                    <input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
                  </div>
                </div>
              )}
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          </div>

          {/* Footer */}
          <div className="px-5 pb-5 flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                submitting ||
                !canProceedTarget() ||
                (messageType === 'text' ? !message.trim() : !imageUrl.trim())
              }
              className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Memproses...</>
              ) : (
                <><Send className="h-4 w-4" /> {sendWhen === 'now' ? 'Kirim' : 'Jadwalkan'}</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Jamaah Search Modal */}
      {showJamaahSearch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Search className="h-5 w-5 text-gray-400" />
                Cari Jamaah
              </h3>
              <button
                onClick={() => {
                  setShowJamaahSearch(false)
                  setJamaahSearchText('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-gray-200">
              <input
                type="text"
                value={jamaahSearchText}
                onChange={(e) => setJamaahSearchText(e.target.value)}
                placeholder="Cari nama atau nomor..."
                autoFocus
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-2">
              {jamaahLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Memuat data jamaah...</p>
                </div>
              ) : filteredJamaah.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                  {jamaahSearchText ? 'Tidak ada hasil' : 'Ketik untuk mencari'}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredJamaah.slice(0, 50).map(jamaah => (
                    <button
                      key={jamaah.id}
                      onClick={() => handleSelectJamaah(jamaah)}
                      className="w-full px-3 py-2 text-left rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <p className="font-medium text-gray-900 text-sm">
                        {jamaah.full_name}
                      </p>
                      {jamaah.phone && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {jamaah.phone}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WhatsAppSendModal
