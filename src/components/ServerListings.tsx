import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs, limit, orderBy } from 'firebase/firestore';
import { getShowcaseFallback } from '../lib/catalog';

type Listing = {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  seller?: {
    name: string;
    avatar?: string;
  };
  isVitrin?: boolean;
  type?: string;
};

export default function ServerListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(24);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        // Fetch specifically SERVER TANITIMI or just fetch all and filter if where clause fails due to missing index
        const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(100));
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map((doc) => {
          const data = doc.data() as any;
          return {
            id: doc.id,
            title: data.title || 'İlan',
            price: Number(data.price) || 0,
            originalPrice: data.originalPrice ? Number(data.originalPrice) : undefined,
            image: data.image || data.images?.[0] || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
            category: data.category || 'Genel',
            seller: data.seller || { name: 'Satıcı' },
            isVitrin: data.isVitrin || data.featured,
            type: data.type,
          };
        });
        
        let finalData = fetched.filter(l => String(l.category).toUpperCase() === 'SERVER TANITIMI');
        
        setListings(finalData);
      } catch (error) {
        console.error('Error fetching listings:', error);
        setListings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, []);

  const visibleListings = listings.slice(0, visibleCount);

  return (
    <section className="py-0">
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-1">Server Tanıtımı</h2>
            <p className="text-white/50 text-sm">En popüler oyun sunucularını keşfedin.</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="bg-[#1a1b23] rounded-xl aspect-[3/4] animate-pulse border border-white/5" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-[#1a1b23] rounded-xl p-8 text-center border border-white/5">
            <p className="text-white/50">Henüz server tanıtımı bulunmuyor.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {visibleListings.map((listing, idx) => (
                <Link
                  key={`${listing.id}-${idx}`}
                  to={`/server-tanitimi/${listing.id}`}
                  className="group bg-[#1a1b23] rounded-xl overflow-hidden border border-transparent hover:border-white/10 transition-all flex flex-col"
                >
                  {/* SERVER TANITIMI Badge */}
                  <div className="text-center py-1.5 text-[10px] font-bold tracking-wider text-white bg-orange-500">
                    SERVER TANITIMI
                  </div>
                  
                  {/* Image */}
                  <div className="relative aspect-[16/9] overflow-hidden shrink-0">
                    <img
                      src={listing.image}
                      alt={listing.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Content */}
                  <div className="p-3 flex-1 flex flex-col">
                    {/* Seller Info */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                        {listing.seller?.name?.charAt(0) || 'S'}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[9px] text-white/50 leading-none">SATICI</span>
                        <span className="text-xs text-white font-medium leading-tight truncate">{listing.seller?.name || 'Satıcı'}</span>
                      </div>
                    </div>

                    {/* Category */}
                    <div className="text-[10px] text-white/50 font-medium uppercase tracking-wider mb-1 truncate">
                      {listing.category}
                    </div>

                    {/* Title */}
                    <div className="text-sm text-white font-medium line-clamp-2 leading-snug mb-3 group-hover:text-[#facc15] transition-colors flex-1">
                      {listing.title}
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-2 mt-auto">
                      <span className="text-[#facc15] font-bold text-base">
                        {listing.price.toFixed(2)} ₺
                      </span>
                      {listing.originalPrice && listing.originalPrice > listing.price && (
                        <span className="text-white/40 text-xs line-through">
                          {listing.originalPrice.toFixed(2)} ₺
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {listings.length > visibleCount && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => setVisibleCount(prev => prev + 24)}
                  className="px-8 py-2.5 rounded-full text-sm font-medium bg-[#8b5cf6] text-white hover:bg-[#7c3aed] transition-colors"
                >
                  + Daha fazla server tanıtımı göster
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
