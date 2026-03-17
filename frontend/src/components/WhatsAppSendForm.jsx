import { useState, useEffect, useMemo } from 'react'
import { Send, Search, X, UserSearch, Tag as TagIcon, Users } from 'lucide-react'
import { whatsappAPI, jamaahAPI } from '../services/api'
import { getCachedJamaah, setCachedJamaah } from '../utils/jamaahCache'

export default function WhatsAppSendForm({ onMessageSent }) {
  const [showJamaahSearch, setShowJamaahSearch] = useState(false)
  const [jamaahList, setJamaahList] = useState([])
  const [jamaahLoading, setJamaahLoading] = useState(false)
  const [jamaahSearchText, setJamaahSearchText] = useState('')
  const [tags, setTags] = useState([])
  const [tagSearchText, setTagSearchText] = useState('')
  const [selectedTag, setSelectedTag] = useState(null)

  const [phoneNumber, setPhoneNumber] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [message, setMessage] = useState('')
  const [useTag, setUseTag] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)

  // Fetch jamaah list for search (load once, with cache)
  useEffect(() => {
    const fetchJamaah = async () => {
      // Check cache first
      const cached = getCachedJamaah()
      if (cached) {
        setJamaahList(cached)
        return
      }

      // Fetch from API if no cache
      setJamaahLoading(true)
      try {
        const res = await jamaahAPI.list({ limit: 500 })
        setJamaahList(res.data)
        setCachedJamaah(res.data) // Cache for 10 minutes
      } catch (err) {
        console.error('Failed to load jamaah:', err)
      } finally {
        setJamaahLoading(false)
      }
    }
    fetchJamaah()
  }, [])

  // Fetch tags for autocomplete
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await jamaahAPI.listTags()
        setTags(res.data)
      } catch (err) {
        console.error('Failed to load tags:', err)
      }
    }
    fetchTags()
  }, [])

  // Filter jamaah by search text
  const filteredJamaah = useMemo(() => {
    if (!jamaahSearchText.trim()) return jamaahList
    const searchLower = jamaahSearchText.toLowerCase()
    return jamaahList.filter(j =>
      j.full_name?.toLowerCase().includes(searchLower) ||
      j.phone?.toLowerCase().includes(searchLower)
    )
  }, [jamaahList, jamaahSearchText])

  // Filter tags by search text
  const filteredTags = useMemo(() => {
    if (!tagSearchText.trim()) return tags
    const searchLower = tagSearchText.toLowerCase()
    return tags.filter(t => t.name.toLowerCase().includes(searchLower))
  }, [tags, tagSearchText])

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

  // Handle select jamaah from search popup
  const handleSelectJamaah = (jamaah) => {
    const formatted = formatPhone(jamaah.phone)
    setPhoneNumber(formatted)
    setRecipientName(jamaah.full_name || '')
    setShowJamaahSearch(false)
    setJamaahSearchText('')
  }

  // Handle tag selection
  const handleSelectTag = (tag) => {
    setSelectedTag(tag)
    setTagSearchText(tag.name)
  }

  // Get count of people in selected tag
  const tagMemberCount = useMemo(() => {
    if (!selectedTag) return 0
    return jamaahList.filter(j =>
      j.tags?.some(t => t.id === selectedTag.id)
    ).length
  }, [selectedTag, jamaahList])

  // Handle send
  const handleSend = async () => {
    setError(null)

    if (useTag) {
      // Validate tag mode
      if (!selectedTag) {
        setError('Pilih tag terlebih dahulu')
        return
      }
      if (!message.trim()) {
        setError('Tulis pesan terlebih dahulu')
        return
      }
    } else {
      // Validate personal mode
      if (!phoneNumber.trim()) {
        setError('Isi nomor WhatsApp terlebih dahulu')
        return
      }
      if (!message.trim()) {
        setError('Tulis pesan terlebih dahulu')
        return
      }
    }

    setSending(true)
    try {
      if (useTag && selectedTag) {
        // Bulk send via tag
        const payload = {
          tag_id: selectedTag.id,
          message: message.trim(),
        }
        await whatsappAPI.createQueue(payload)
      } else {
        // Single personal send
        const payload = {
          recipient_type: 'personal',
          recipient: phoneNumber.trim() + '@s.whatsapp.net',
          recipient_name: recipientName || phoneNumber,
          message_type: 'text',
          message: message.trim(),
          send_now: true,
        }
        await whatsappAPI.createQueue(payload)
      }

      // Reset form
      setPhoneNumber('')
      setRecipientName('')
      setMessage('')
      setSelectedTag(null)
      setTagSearchText('')
      setUseTag(false)

      if (onMessageSent) onMessageSent()
    } catch (err) {
      setError(err.response?.data?.detail || 'Gagal mengirim pesan')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Send className="h-5 w-5 text-green-600" />
        Kirim Pesan WhatsApp
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Phone Number Field */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nomor WhatsApp
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(formatPhone(e.target.value))}
            disabled={useTag}
            placeholder="628123456789"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            type="button"
            onClick={() => setShowJamaahSearch(true)}
            disabled={useTag}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <UserSearch className="h-4 w-4" />
            Cari Jamaah
          </button>
        </div>
        {recipientName && !useTag && (
          <p className="mt-1 text-xs text-gray-500">Kepada: {recipientName}</p>
        )}
      </div>

      {/* Use Tag Toggle */}
      <div className="mb-4">
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
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pilih Tag
          </label>
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
                className="flex-1 outline-none"
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
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
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
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>
                {tagMemberCount} orang akan menerima pesan ini
              </span>
            </div>
          )}
        </div>
      )}

      {/* Message Field */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pesan
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tulis pesan Anda di sini..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Send Button */}
      <button
        onClick={handleSend}
        disabled={sending}
        className="w-full py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {sending ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            Mengirim...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Kirim Pesan
          </>
        )}
      </button>

      {/* Jamaah Search Modal */}
      {showJamaahSearch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
