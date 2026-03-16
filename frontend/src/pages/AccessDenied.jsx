import { useNavigate } from 'react-router-dom'

export default function AccessDenied() {
  const navigate = useNavigate()

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white border border-red-200 rounded-xl p-6 text-center">
        <h1 className="text-2xl font-bold text-red-700">Akses Ditolak</h1>
        <p className="mt-3 text-sm text-gray-600">
          Kamu tidak punya izin untuk membuka halaman ini.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700"
        >
          Kembali ke Beranda
        </button>
      </div>
    </div>
  )
}
