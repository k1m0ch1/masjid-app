import { useState, useEffect } from 'react'
import { Users, DollarSign, TrendingUp, TrendingDown, Calendar, ArrowRight } from 'lucide-react'
import { format, isFuture, startOfMonth } from 'date-fns'
import { id } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { jamaahAPI, transactionAPI, eventAPI } from '../services/api'

const Dashboard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, balance: 0 })
  const [jamaahCount, setJamaahCount] = useState(0)
  const [jamaahByRole, setJamaahByRole] = useState({})
  const [upcomingEvents, setUpcomingEvents] = useState([])

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const now = new Date()
        const startDate = format(startOfMonth(now), 'yyyy-MM-dd')
        const endDate = format(now, 'yyyy-MM-dd')

        const [jamaahRes, summaryRes, eventsRes] = await Promise.allSettled([
          jamaahAPI.list({ limit: 500 }),
          transactionAPI.summary({ start_date: startDate, end_date: endDate }),
          eventAPI.list({ limit: 20 }),
        ])

        if (jamaahRes.status === 'fulfilled') {
          const jamaahList = jamaahRes.value.data || []
          setJamaahCount(jamaahList.length)
          const roleCount = {}
          jamaahList.forEach((j) => {
            const role = j.role || 'jamaah'
            roleCount[role] = (roleCount[role] || 0) + 1
          })
          setJamaahByRole(roleCount)
        }

        if (summaryRes.status === 'fulfilled') {
          const s = summaryRes.value.data
          setSummary({
            total_income: Number(s.total_income) || 0,
            total_expense: Number(s.total_expense) || 0,
            balance: Number(s.balance) || 0,
          })
        }

        if (eventsRes.status === 'fulfilled') {
          const events = eventsRes.value.data || []
          const upcoming = events
            .filter((e) => isFuture(new Date(e.start_datetime)))
            .slice(0, 5)
          setUpcomingEvents(upcoming)
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const roleLabels = {
    imam: 'Imam',
    muadzin: 'Muadzin',
    marbot: 'Marbot',
    guru: 'Guru TPQ/Tahfidz',
    pengurus: 'Pengurus',
    jamaah: 'Jamaah Umum',
  }

  const roleColors = {
    imam: 'bg-purple-100',
    muadzin: 'bg-blue-100',
    marbot: 'bg-orange-100',
    guru: 'bg-yellow-100',
    pengurus: 'bg-teal-100',
    jamaah: 'bg-gray-100',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Ringkasan bulan {format(new Date(), 'MMMM yyyy', { locale: id })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-500">Total Pemasukan</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(summary.total_income)}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Total Expense */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-500">Total Pengeluaran</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {formatCurrency(summary.total_expense)}
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        {/* Balance */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-500">Saldo</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {formatCurrency(summary.balance)}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Total Jamaah */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/jamaah')}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-500">Total Jamaah</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {jamaahCount}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/jamaah')}
          className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 shadow hover:shadow-lg transition-all hover:-translate-y-1"
        >
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="text-sm opacity-90">Data Jamaah</p>
              <p className="text-lg font-semibold mt-1">Kelola SDM & Marbot</p>
            </div>
            <ArrowRight className="h-6 w-6" />
          </div>
        </button>

        <button
          onClick={() => navigate('/finance')}
          className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 shadow hover:shadow-lg transition-all hover:-translate-y-1"
        >
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="text-sm opacity-90">Keuangan</p>
              <p className="text-lg font-semibold mt-1">Catat Transaksi</p>
            </div>
            <ArrowRight className="h-6 w-6" />
          </div>
        </button>

        <button
          onClick={() => navigate('/events')}
          className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow hover:shadow-lg transition-all hover:-translate-y-1"
        >
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="text-sm opacity-90">Kegiatan</p>
              <p className="text-lg font-semibold mt-1">Jadwal Acara</p>
            </div>
            <ArrowRight className="h-6 w-6" />
          </div>
        </button>
      </div>

      {/* Recent Activity & Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kegiatan Mendatang */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Kegiatan Mendatang</h2>
            <button
              onClick={() => navigate('/events')}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              Lihat Semua →
            </button>
          </div>
          <div className="p-4">
            {upcomingEvents.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Belum ada kegiatan mendatang</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                        {event.event_type}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm">{event.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {format(new Date(event.start_datetime), 'EEEE, dd MMM • HH:mm', { locale: id })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Statistik Jamaah */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Statistik Jamaah</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {Object.keys(roleLabels).map((role) => {
                const count = jamaahByRole[role] || 0
                return (
                  <div key={role} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{roleLabels[role]}</span>
                    <div className="flex items-center gap-2">
                      <div className={`${roleColors[role] || 'bg-gray-100'} h-2 rounded-full w-16`}></div>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  </div>
                )
              })}
              {Object.keys(jamaahByRole).filter(r => !roleLabels[r]).map((role) => (
                <div key={role} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{role}</span>
                  <div className="flex items-center gap-2">
                    <div className="bg-gray-100 h-2 rounded-full w-16"></div>
                    <span className="text-sm font-medium text-gray-900">{jamaahByRole[role]}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => navigate('/jamaah')}
                className="w-full px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium text-sm"
              >
                Kelola Data Jamaah
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
