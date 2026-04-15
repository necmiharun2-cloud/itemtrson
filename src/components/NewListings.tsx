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

export default function NewListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(30);

  useEffect(() => {
    const fetchListings = async () => {
      try {
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
        
        let finalData = fetched.length > 0 ? fetched : (getShowcaseFallback() as Listing[]);
        if (finalData.length < 30) {
          finalData = [...finalData, ...finalData, ...finalData].slice(0, 90);
        }
        
        setListings(finalData);
      } catch (error) {
        console.error('Error fetching listings:', error);
        let fallback = getShowcaseFallback() as Listing[];
        fallback = [...fallback, ...fallback, ...fallback].slice(0, 90);
        setListings(fallback);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, []);

  // Filter out SERVER TANITIMI to keep it separate
  const filteredListings = listings.filter(
    (l) => String((l as any).category).toUpperCase() !== 'SERVER TANITIMI'
  );

  const visibleListings = filteredListings.slice(0, visibleCount);

  return (
    <section className="py-0">
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-1">Yeni İlanlar</h2>
            <p className="text-white/50 text-sm">Pazara yeni eklenen en güncel ilanlar.</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
            {[...Array(25)].map((_, i) => (
              <div key={i} className="bg-[#1a1b23] rounded-xl aspect-[3/4] animate-pulse border border-white/5" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {visibleListings.map((listing, idx) => (
                <Link
                  key={`${listing.id}-${idx}`}
                  to={`/product/${listing.id}`}
                  className="group bg-[#1a1b23] rounded-xl overflow-hidden border border-transparent hover:border-white/10 transition-all flex flex-col"
                >
                  {/* YENİ İLAN Badge */}
                  <div className="text-center py-1.5 text-[10px] font-bold tracking-wider text-white bg-blue-500">
                    YENİ İLAN
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

            {filteredListings.length > visibleCount && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => setVisibleCount(prev => prev + 30)}
                  className="px-8 py-2.5 rounded-full text-sm font-medium bg-[#8b5cf6] text-white hover:bg-[#7c3aed] transition-colors"
                >
                  + Daha fazla yeni ilan göster
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
