import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { ArrowRightLeft, Check, X, MessageSquare, AlertTriangle, Clock, ShieldCheck } from 'lucide-react';

export default function TradeOfferDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [offer, setOffer] = useState<any>(null);
  const [targetItem, setTargetItem] = useState<any>(null);
  const [offeredItems, setOfferedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchOffer = async () => {
      setLoading(true);
      try {
        if (!id) return;
        const offerRef = doc(db, 'trade_offers', id);
        const offerSnap = await getDoc(offerRef);
        
        if (!offerSnap.exists()) {
          toast.error('Teklif bulunamadı.');
          navigate('/');
          return;
        }

        const offerData = { id: offerSnap.id, ...offerSnap.data() };
        
        // Check permissions
        if (offerData.senderUserId !== user.uid && offerData.receiverUserId !== user.uid) {
          toast.error('Bu teklifi görüntüleme yetkiniz yok.');
          navigate('/');
          return;
        }

        setOffer(offerData);

        // Fetch items
        const itemsQ = query(collection(db, 'trade_offer_items'), where('tradeOfferId', '==', id));
        const itemsSnap = await getDocs(itemsQ);
        const items = itemsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const target = items.find(i => i.isTarget);
        const offered = items.filter(i => !i.isTarget);

        if (target) {
          const tDoc = await getDoc(doc(db, 'products', target.listingId));
          if (tDoc.exists()) setTargetItem({ id: tDoc.id, ...tDoc.data() });
        }

        const fetchedOffered = [];
        for (const item of offered) {
          const iDoc = await getDoc(doc(db, 'products', item.listingId));
          if (iDoc.exists()) fetchedOffered.push({ id: iDoc.id, ...iDoc.data() });
        }
        setOfferedItems(fetchedOffered);

        // Mark as viewed if receiver
        if (offerData.receiverUserId === user.uid && offerData.status === 'pending') {
          await updateDoc(offerRef, { status: 'viewed', updatedAt: serverTimestamp() });
          setOffer({ ...offerData, status: 'viewed' });
          
          await addDoc(collection(db, 'trade_status_history'), {
            tradeOfferId: id,
            oldStatus: 'pending',
            newStatus: 'viewed',
            changedBy: user.uid,
            createdAt: serverTimestamp()
          });
        }

      } catch (error) {
        console.error('Error fetching offer:', error);
        toast.error('Teklif yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchOffer();
  }, [id, user, navigate]);

  const handleAction = async (action: 'accepted' | 'rejected' | 'cancelled') => {
    if (!offer || !user) return;
    setActionLoading(true);
    try {
      const offerRef = doc(db, 'trade_offers', offer.id);
      await updateDoc(offerRef, {
        status: action,
        lastActionBy: user.uid,
        updatedAt: serverTimestamp()
      });

      await addDoc(collection(db, 'trade_status_history'), {
        tradeOfferId: offer.id,
        oldStatus: offer.status,
        newStatus: action,
        changedBy: user.uid,
        createdAt: serverTimestamp()
      });

      // If accepted, lock listings
      if (action === 'accepted') {
        const listingsToLock = [targetItem.id, ...offeredItems.map(i => i.id)];
        for (const listingId of listingsToLock) {
          await updateDoc(doc(db, 'products', listingId), {
            status: 'locked',
            lockedByTradeId: offer.id
          });
        }
      }

      // Notify the other party
      const otherUserId = user.uid === offer.senderUserId ? offer.receiverUserId : offer.senderUserId;
      let title = '';
      let body = '';
      if (action === 'accepted') {
        title = 'Takas Teklifi Kabul Edildi!';
        body = 'Teklifiniz kabul edildi. İlgili ilanlar kilitlendi.';
      } else if (action === 'rejected') {
        title = 'Takas Teklifi Reddedildi';
        body = 'Takas teklifiniz reddedildi.';
      } else if (action === 'cancelled') {
        title = 'Takas Teklifi İptal Edildi';
        body = 'Karşı taraf takas teklifini iptal etti.';
      }

      await addDoc(collection(db, 'notifications'), {
        userId: otherUserId,
        type: `trade_${action}`,
        title,
        body,
        isRead: false,
        link: `/trade/offers/${offer.id}`,
        createdAt: serverTimestamp()
      });

      setOffer({ ...offer, status: action });
      toast.success(`Teklif ${action === 'accepted' ? 'kabul edildi' : action === 'rejected' ? 'reddedildi' : 'iptal edildi'}.`);
    } catch (error) {
      console.error('Action error:', error);
      toast.error('İşlem gerçekleştirilemedi.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-white">Yükleniyor...</div>;
  if (!offer || !targetItem) return <div className="text-center py-20 text-white">Teklif bulunamadı.</div>;

  const isSender = user?.uid === offer.senderUserId;
  const isReceiver = user?.uid === offer.receiverUserId;
  const totalOfferedValue = offeredItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0) + (Number(offer.offeredCashAmount) || 0);
  const targetValue = Number(targetItem.estimatedTradeValue) || Number(targetItem.price) || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-bold">Bekliyor</span>;
      case 'viewed': return <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold">Görüldü</span>;
      case 'accepted': return <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">Kabul Edildi</span>;
      case 'rejected': return <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold">Reddedildi</span>;
      case 'cancelled': return <span className="bg-gray-500/20 text-gray-400 px-3 py-1 rounded-full text-xs font-bold">İptal Edildi</span>;
      default: return <span className="bg-gray-500/20 text-gray-400 px-3 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#1a1b23] rounded-xl border border-white/5 flex items-center justify-center">
            <ArrowRightLeft className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Takas Teklifi Detayı</h1>
            <p className="text-gray-400 text-sm">Teklif ID: {offer.id}</p>
          </div>
        </div>
        <div>
          {getStatusBadge(offer.status)}
        </div>
      </div>

      {offer.status === 'accepted' && (
        <div className="mb-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
          <div>
            <h3 className="text-emerald-400 font-bold mb-1">Anlaşma Sağlandı!</h3>
            <p className="text-sm text-emerald-400/80">Bu takas teklifi kabul edildi ve ilgili ilanlar kilitlendi. Lütfen takas işlemini tamamlamak için karşı taraf ile iletişime geçin.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Target Item (What the sender wants) */}
        <div className="bg-[#1a1b23] rounded-xl border border-white/5 p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            {isSender ? 'İstediğiniz Ürün' : 'İlanınız'}
          </h2>
          <div className="flex gap-4 p-4 bg-[#111218] rounded-xl border border-white/5">
            <img src={targetItem.image} alt={targetItem.title} className="w-24 h-24 rounded-lg object-cover" />
            <div>
              <h3 className="text-white font-bold mb-1">{targetItem.title}</h3>
              <p className="text-xs text-emerald-400 mb-2">{targetItem.category}</p>
              <div className="text-lg font-bold text-white">{targetValue.toFixed(2)} ₺</div>
            </div>
          </div>
        </div>

        {/* Offered Items (What the sender offers) */}
        <div className="bg-[#1a1b23] rounded-xl border border-white/5 p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            {isSender ? 'Teklif Ettiğiniz Ürünler' : 'Size Teklif Edilenler'}
          </h2>
          <div className="space-y-3">
            {offeredItems.map(item => (
              <div key={item.id} className="flex gap-4 p-3 bg-[#111218] rounded-xl border border-white/5">
                <img src={item.image} alt={item.title} className="w-16 h-16 rounded-lg object-cover" />
                <div>
                  <h3 className="text-sm text-white font-bold mb-1">{item.title}</h3>
                  <div className="text-sm font-bold text-emerald-400">{Number(item.price).toFixed(2)} ₺</div>
                </div>
              </div>
            ))}
            {offeredItems.length === 0 && (
              <p className="text-sm text-gray-400 italic">Ürün teklif edilmedi.</p>
            )}
            
            {Number(offer.offeredCashAmount) > 0 && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex justify-between items-center">
                <span className="text-amber-400 font-medium">Nakit Fark Teklifi</span>
                <span className="text-amber-400 font-bold text-lg">+{Number(offer.offeredCashAmount).toFixed(2)} ₺</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message */}
      {offer.message && (
        <div className="bg-[#1a1b23] rounded-xl border border-white/5 p-6 mb-8">
          <h3 className="text-sm font-bold text-gray-400 uppercase mb-3">Teklif Mesajı</h3>
          <p className="text-white text-sm bg-[#111218] p-4 rounded-xl border border-white/5">{offer.message}</p>
        </div>
      )}

      {/* Actions */}
      {(offer.status === 'pending' || offer.status === 'viewed') && (
        <div className="bg-[#1a1b23] rounded-xl border border-white/5 p-6 flex flex-wrap gap-4 justify-end">
          {isReceiver && (
            <>
              <button
                onClick={() => handleAction('rejected')}
                disabled={actionLoading}
                className="px-6 py-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 font-bold rounded-xl transition-colors flex items-center gap-2"
              >
                <X className="w-5 h-5" />
                Reddet
              </button>
              <button
                onClick={() => handleAction('accepted')}
                disabled={actionLoading}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
              >
                <Check className="w-5 h-5" />
                Kabul Et
              </button>
            </>
          )}
          {isSender && (
            <button
              onClick={() => handleAction('cancelled')}
              disabled={actionLoading}
              className="px-6 py-3 bg-gray-500/10 text-gray-400 hover:bg-gray-500/20 font-bold rounded-xl transition-colors flex items-center gap-2"
            >
              <X className="w-5 h-5" />
              Teklifi İptal Et
            </button>
          )}
        </div>
      )}
    </div>
  );
}
