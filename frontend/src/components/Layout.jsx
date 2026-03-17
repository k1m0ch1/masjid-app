import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Home, Users, DollarSign, Calendar, Menu, LogOut, Settings } from 'lucide-react'
import { useMemo, useState } from 'react'
import useAuthStore from '../stores/useAuthStore'
import packageJson from '../../package.json'

const APP_VERSION = packageJson.version

const Layout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signOut } = useAuthStore()
  const [showMenu, setShowMenu] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const navItems = useMemo(
    () => [
      { path: '/', icon: Home, label: 'Beranda', module: 'dashboard' },
      { path: '/jamaah', icon: Users, label: 'Jamaah', module: 'jamaah' },
      { path: '/finance', icon: DollarSign, label: 'Keuangan', module: 'finance' },
      { path: '/events', icon: Calendar, label: 'Kegiatan', module: 'events' },
      { path: '/setting', icon: Settings, label: 'Pengaturan', module: 'setting' },
    ],
    []
  )

  const allowedModules = user?.allowed_modules || []
  const filteredNavItems = navItems.filter((item) => allowedModules.includes(item.module))

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top App Bar - Mobile */}
      <div className="lg:hidden bg-white border-b border-gray-200 safe-top">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Admin Masjid</h1>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {showMenu && (
          <div className="border-t border-gray-200 py-2">
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-2 text-left flex items-center gap-2 text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              <span>Keluar</span>
            </button>
          </div>
        )}
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block">
        {/* Desktop Sidebar */}
        <aside className="fixed top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-30">
          <div className="p-6">
            <h1 className="text-xl font-bold text-gray-900">Admin Masjid</h1>
            <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
          </div>

          <nav className="px-3 space-y-1 flex-1">
            {filteredNavItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-3 border-t border-gray-200 space-y-2">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" />
              <span>Keluar</span>
            </button>
            <div className="text-center text-xs text-gray-400">
              v{APP_VERSION}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="ml-64 h-screen overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Main Content */}
      <div className="lg:hidden flex-1">
        <main className="pb-20">
          <Outlet />
        </main>
      </div>

      {/* Bottom Navigation - Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom">
        <nav className="flex items-center justify-around px-2 py-2">
          {filteredNavItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'text-green-600'
                  : 'text-gray-500'
              }`}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="text-center text-[10px] text-gray-400 pb-1">
          v{APP_VERSION}
        </div>
      </div>
    </div>
  )
}

export default Layout
