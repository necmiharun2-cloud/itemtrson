/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Navbar */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold text-xl">
              İ
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">İtemsatış <span className="text-blue-600">Market</span></span>
          </div>
          <nav className="hidden md:flex gap-6">
            <a href="#" className="text-gray-600 hover:text-blue-600 font-medium">İlanlar</a>
            <a href="#" className="text-gray-600 hover:text-blue-600 font-medium">Kategoriler</a>
            <a href="#" className="text-gray-600 hover:text-blue-600 font-medium">Destek</a>
          </nav>
          <div className="flex items-center gap-3">
            <button className="text-gray-600 hover:text-gray-900 font-medium px-3 py-2">Giriş Yap</button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              Kayıt Ol
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 sm:p-12 text-white mb-12 shadow-lg">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            Dijital Dünyanın Pazaryerine Hoş Geldiniz
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl mb-8">
            Oyun hesapları, dijital pinler, yazılımlar ve daha fazlasını güvenle alın, satın.
          </p>
          <div className="flex gap-4">
            <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-50 transition-colors shadow-sm">
              İlanları Keşfet
            </button>
            <button className="bg-blue-500 bg-opacity-30 border border-blue-400 text-white px-6 py-3 rounded-lg font-bold hover:bg-opacity-40 transition-colors">
              Ücretsiz İlan Ver
            </button>
          </div>
        </div>

        {/* Placeholder for Listings */}
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Öne Çıkan İlanlar</h2>
          <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Tümünü Gör &rarr;</a>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
              <div className="h-40 bg-gray-200 flex items-center justify-center text-gray-400">
                Görsel {item}
              </div>
              <div className="p-4">
                <div className="text-xs font-semibold text-blue-600 mb-1">Oyun Hesapları</div>
                <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">Örnek İlan Başlığı - Seviye 99 Full Hesap</h3>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-lg font-bold text-gray-900">₺250.00</span>
                  <span className="text-xs text-gray-500">Bugün eklendi</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
