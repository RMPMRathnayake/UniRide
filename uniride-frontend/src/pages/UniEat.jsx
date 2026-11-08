import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Search,
  ShoppingCart,
  Menu,
  X,
  Heart,
  HelpCircle,
  Tag,
  Gift,
  Star,
  Upload,
  User,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Receipt,
  ShieldCheck,
  Navigation,
  Plus,
  Minus,
  Trash2,
  Share2,
  Users,
  Info,
  MoreHorizontal,
  CreditCard,
  Banknote,
  Zap,
  Calendar,
  Briefcase,
  Lock,
  Loader2,
  Truck,
  Car,
  Utensils,
  ShoppingBag,
  Bike,
} from 'lucide-react';
import ConciergePersonaSwitcher, {
  DEMO_ACTORS,
} from '../components/concierge/ConciergePersonaSwitcher.jsx';
import RiderDashboard from '../components/concierge/RiderDashboard.jsx';
import ReceiptModal from '../components/concierge/ReceiptModal.jsx';

export default function UniEat() {
  // =========================================================================
  // 1. REACT HOOKS (useState) FOR DELIVERY ADDRESS & CAMPUS COORDINATES
  // =========================================================================
  const [deliveryAddress, setDeliveryAddress] = useState('South Eastern University, Oluvil');
  const [deliveryCoords, setDeliveryCoords] = useState({ lat: 7.2974, lng: 81.8504 });
  const [addressInput, setAddressInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [deliveryTime, setDeliveryTime] = useState('Deliver now');
  const [showTimeMenu, setShowTimeMenu] = useState(false);

  // Concierge Shopping & Demonstrative Identity State
  const [currentActor, setCurrentActor] = useState(DEMO_ACTORS[0]); // Ruvini (Customer)
  const [viewingReceiptOrderId, setViewingReceiptOrderId] = useState(null);

  // Page view:
  // 'landing'          -> Location Hero (initial page)
  // 'storefront'       -> Full UniGroceries / UniEats Storefront
  // 'store-catalog'    -> Full-Page Store Product Catalog
  // 'checkout-details' -> Delivery Details & Order Total Form (Screenshots 3 & 4)
  // 'payment-gateway'  -> Global Multi-Service Payment Gateway (uniEats / uniRider / uniParcel)
  const [pageView, setPageView] = useState('landing');

  // Dining mode in clean Navbar (Screenshot 2: Delivery | Pickup)
  const [storeDiningMode, setStoreDiningMode] = useState('DELIVERY'); // 'DELIVERY' | 'PICKUP'

  // Logged-in user state & profile image upload
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [userProfile, setUserProfile] = useState({
    name: 'Ruvini',
    email: 'ruvini@unieats.lk',
    phone: '+94 77 234 5678',
    campus: 'Parakaduwa / Kuruwita',
    avatarUrl: '',
    isUniOneMember: true,
  });

  // Slide-out left drawer
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Active modals
  const [activeModal, setActiveModal] = useState(null);

  // Storefront filters & search
  const [sidebarCategory, setSidebarCategory] = useState('home');
  const [topIconFilter, setTopIconFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [favoriteStoreIds, setFavoriteStoreIds] = useState([
    'store-pizzahut',
    'store-keells',
    'store-onlinekade',
  ]);

  // Featured Ads Slider offset
  const [adSlideIndex, setAdSlideIndex] = useState(0);

  // =========================================================================
  // 2. STORES, RIDERS, METADATA & FULL-PAGE STORE CATALOG STATE ("Dumb UI")
  // =========================================================================
  const [stores, setStores] = useState([]);
  const [riders, setRiders] = useState([]);
  const [sidebarCategories, setSidebarCategories] = useState([]);
  const [topIconCategories, setTopIconCategories] = useState([]);
  const [featuredAds, setFeaturedAds] = useState([]);
  const [helpCenterTopics, setHelpCenterTopics] = useState([]);

  // Currently selected store ID for the Full-Page Store Product Catalog
  const [selectedStoreId, setSelectedStoreId] = useState('store-pizzahut');
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const [priceSort, setPriceSort] = useState(''); // '' | 'highest' | 'lowest' | 'popular'
  const [activeMenuSection, setActiveMenuSection] = useState('Featured items');
  const [apiCatalogProducts, setApiCatalogProducts] = useState([]);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Product Detail Add-to-Order Modal State
  const [productDetailModal, setProductDetailModal] = useState(null); // { store, item }
  const [productModalQty, setProductModalQty] = useState(1);
  const [productModalNote, setProductModalNote] = useState('');

  // =========================================================================
  // 3. PERSISTENT SHOPPING CART (LocalStorage + MongoDB Sync)
  // =========================================================================
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('unieats_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [cartOrderNote, setCartOrderNote] = useState('');
  const [promoCode, setPromoCode] = useState('UNIEATS50');
  const [promoDiscount, setPromoDiscount] = useState(550);

  // Checkout Delivery Details Form State (Screenshots 3 & 4)
  const [editingAddressInCheckout, setEditingAddressInCheckout] = useState(false);
  const [editingInstructionsInCheckout, setEditingInstructionsInCheckout] = useState(false);
  const [dropoffMethod, setDropoffMethod] = useState('Meet at my door');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [deliveryOptionType, setDeliveryOptionType] = useState('standard'); // 'priority' | 'standard' | 'schedule'
  const [scheduledSlot, setScheduledSlot] = useState('Today, 8:00 PM – 8:30 PM');
  const [uberOneTrialChecked, setUberOneTrialChecked] = useState(false);
  const [cartSummaryExpanded, setCartSummaryExpanded] = useState(false);

  // =========================================================================
  // 4. GLOBAL MULTI-SERVICE PAYMENT GATEWAY STATE (uniEats, uniRider, uniParcel)
  // =========================================================================
  const [gatewayServiceHeader, setGatewayServiceHeader] = useState('uniEats'); // 'uniEats' | 'uniRider' | 'uniParcel' | 'uniGroceries'
  const [paymentOption, setPaymentOption] = useState('card'); // 'card' | 'unicash' | 'cod'
  const [cardForm, setCardForm] = useState({
    number: '4242 •••• •••• 4242',
    name: 'RUVINI THACKSHILA',
    expiry: '08/29',
    cvv: '842',
    otp: '123456',
  });
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [completedReceipt, setCompletedReceipt] = useState(null);

  // Ratings state
  const [ratingTargetType, setRatingTargetType] = useState('shop');
  const [selectedShopToRate, setSelectedShopToRate] = useState('store-pizzahut');
  const [selectedRiderToRate, setSelectedRiderToRate] = useState('rider-1');
  const [starValue, setStarValue] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewsHistory, setReviewsHistory] = useState([
    {
      id: 'rev-1',
      type: 'shop',
      targetName: 'Pizza Hut – Kuruwita',
      stars: 5,
      comment: 'Hot Wing IT BBQ wings & pizza delivered fresh!',
      author: 'Ruvini',
      date: 'Yesterday',
    },
  ]);

  const [toastMsg, setToastMsg] = useState(null);
  const [dbHealth, setDbHealth] = useState(null);
  const fileInputRef = useRef(null);
  const cartLoadedRef = useRef(false);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // =========================================================================
  // 5. PURE CLIENT-SERVER API FETCHING (GET /api/health, /api/meta, /api/stores, /api/locations, /api/products)
  // =========================================================================
  // Verify Backend & MongoDB Connection via GET /api/health
  useEffect(() => {
    let cancelled = false;
    fetch('/api/health')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled && json?.success) {
          setDbHealth(json);
          console.log('✅ Frontend ↔ Backend ↔ MongoDB Connected:', json);
        }
      })
      .catch((err) => console.error('Backend /api/health unreachable:', err));
    return () => {
      cancelled = true;
    };
  }, []);
  // Fetch UI metadata (Riders, Sidebar Categories, Top Icons, Featured Ads, FAQs) via GET /api/meta
  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({
      location: deliveryAddress,
      lat: deliveryCoords.lat,
      lng: deliveryCoords.lng,
    });
    fetch(`/api/meta?${params}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const metadata = json?.data || json;
        if (!cancelled && json?.success && metadata) {
          setSidebarCategories(metadata.sidebarCategories || []);
          setTopIconCategories(metadata.topIconCategories || []);
          setFeaturedAds(metadata.featuredAds || []);
          setHelpCenterTopics(metadata.helpCenterTopics || metadata.helpTopics || []);
          setRiders(metadata.riders || []);
          if (metadata.riders?.[0]?.id) {
            setSelectedRiderToRate(metadata.riders[0].id);
          }
        }
      })
      .catch((err) => console.error('Failed to fetch /api/meta:', err));
    return () => {
      cancelled = true;
    };
  }, [deliveryAddress, deliveryCoords]);

  // Fetch initial persistent cart from MongoDB GET /api/cart
  useEffect(() => {
    let cancelled = false;
    const currentUserId = userProfile.email || 'ruvini';
    fetch(`/api/cart?userId=${encodeURIComponent(currentUserId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled && json?.success && Array.isArray(json.data)) {
          if (json.data.length > 0) {
            setCart(json.data);
            try {
              localStorage.setItem('unieats_cart', JSON.stringify(json.data));
            } catch {}
          } else {
            // If MongoDB has no cart yet but localStorage has user-added items, upload to MongoDB
            try {
              const localItems = JSON.parse(localStorage.getItem('unieats_cart') || '[]');
              if (Array.isArray(localItems) && localItems.length > 0) {
                fetch('/api/cart', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    userId: currentUserId,
                    items: localItems,
                  }),
                }).catch(() => {});
              }
            } catch {}
          }
          cartLoadedRef.current = true;
        }
      })
      .catch(() => {
        cartLoadedRef.current = true;
      });
    return () => {
      cancelled = true;
    };
  }, [userProfile.email]);

  // Sync cart changes to LocalStorage and MongoDB POST /api/cart (Guarded against race conditions)
  useEffect(() => {
    if (!cartLoadedRef.current) return;
    try {
      localStorage.setItem('unieats_cart', JSON.stringify(cart));
    } catch {}
    fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userProfile.email || 'ruvini',
        items: cart,
      }),
    }).catch(() => {});
  }, [cart, userProfile.email]);

  // Fetch stores from backend GET /api/stores?lat=&lng=&search=
  useEffect(() => {
    let cancelled = false;
    const searchParam = searchQuery.trim()
      ? `&search=${encodeURIComponent(searchQuery.trim())}`
      : '';
    fetch(`/api/stores?lat=${deliveryCoords.lat}&lng=${deliveryCoords.lng}&location=${encodeURIComponent(deliveryAddress)}${searchParam}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled && json?.success && Array.isArray(json.data)) {
          setStores(json.data);
          if (json.data[0]?.id) {
            setSelectedShopToRate((prev) => prev || json.data[0].id);
          }
        }
      })
      .catch((err) => console.error('Failed to fetch /api/stores:', err));
    return () => {
      cancelled = true;
    };
  }, [deliveryAddress, deliveryCoords, searchQuery]);

  // Fetch autocomplete food & shop search suggestions as customer types
  useEffect(() => {
    let cancelled = false;
    const q = searchQuery.trim();
    if (!q) {
      setSearchSuggestions([]);
      return;
    }
    fetch(`/api/stores/search-suggestions?q=${encodeURIComponent(q)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled && json?.success && Array.isArray(json.data)) {
          setSearchSuggestions(json.data);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [searchQuery]);

  // Fetch location suggestions from backend GET /api/locations/suggestions?q=
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/locations/suggestions?q=${encodeURIComponent(addressInput)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled && json?.success && Array.isArray(json.data)) {
          setLocationSuggestions(json.data);
        }
      })
      .catch((err) => console.error('Failed to fetch /api/locations/suggestions:', err));
    return () => {
      cancelled = true;
    };
  }, [addressInput]);

  // Fetch store catalog products from backend GET /api/products?storeId=&search=&sort=&tag=
  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({
      storeId: selectedStoreId,
      search: storeSearchQuery,
      sort: priceSort,
      tag: activeMenuSection,
    });
    fetch(`/api/products?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled && json?.success && Array.isArray(json.data)) {
          setApiCatalogProducts(json.data);
        } else if (!cancelled) {
          setApiCatalogProducts([]);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch /api/products:', err);
        if (!cancelled) setApiCatalogProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedStoreId, storeSearchQuery, priceSort, activeMenuSection]);

  const storesWithGeo = useMemo(() => {
    return stores.map((st) => ({
      ...st,
      items: Array.isArray(st.items) ? st.items : st.products || [],
    }));
  }, [stores]);

  const activeStore = useMemo(() => {
    return storesWithGeo.find((s) => s.id === selectedStoreId) || storesWithGeo[0];
  }, [storesWithGeo, selectedStoreId]);

  const handleOpenStorePage = (store) => {
    if (!store) return;
    setSelectedStoreId(store.id);
    setStoreSearchQuery('');
    setPriceSort('');
    setActiveMenuSection(store.menuSections?.[0] || 'Featured items');
    setPageView('store-catalog');
    window.scrollTo(0, 0);
    setTimeout(() => window.scrollTo(0, 0), 10);
  };

  const handleSelectActor = (actor) => {
    setCurrentActor(actor);
    if (actor.role === 'rider') {
      setPageView('rider-dashboard');
      showToast(`Switched to Student Rider: ${actor.name}`);
    } else {
      if (pageView === 'rider-dashboard') setPageView('storefront');
      showToast(`Switched to Customer: ${actor.name}`);
    }
  };

  const activeStoreMenuSections = useMemo(() => {
    if (!activeStore) return ['Featured items', 'Picked for you'];
    if (activeStore.menuSections && activeStore.menuSections.length > 0) {
      return activeStore.menuSections;
    }
    const uniqueTags = Array.from(new Set((activeStore.items || []).map((i) => i.tag)));
    return ['Featured items', 'Picked for you', ...uniqueTags];
  }, [activeStore]);

  const activeStoreFilteredItems = useMemo(() => {
    let list =
      Array.isArray(apiCatalogProducts) && apiCatalogProducts.length > 0
        ? apiCatalogProducts
        : activeStore?.items || [];

    if (storeSearchQuery.trim()) {
      const q = storeSearchQuery.toLowerCase();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.tag && i.tag.toLowerCase().includes(q)) ||
          (i.desc && i.desc.toLowerCase().includes(q))
      );
    }

    if (priceSort === 'highest') {
      list = [...list].sort((a, b) => b.price - a.price);
    } else if (priceSort === 'lowest') {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (priceSort === 'popular') {
      list = [...list].sort((a, b) => (b.likesPct || 0) - (a.likesPct || 0));
    } else if (priceSort === 'top-budget') {
      list = list.filter((i) => i.price <= 1200).sort((a, b) => a.price - b.price);
    }

    return list;
  }, [apiCatalogProducts, activeStore, storeSearchQuery, priceSort]);

  // =========================================================================
  // 6. HANDLERS FOR ADDRESS SEARCH & BROWSER GEOLOCATION ("Allow location access")
  // =========================================================================
  const handleSelectSuggestion = (suggestion) => {
    setShowSuggestions(false);

    // If user clicks "Allow location access" (isGps === true), detect coordinates via Geolocation API
    // and resolve nearest campus via GET /api/locations/detect?lat=&lng=
    if (suggestion.isGps) {
      showToast('Detecting your current campus/town location...');
      const resolveFromBackend = async (lat, lng) => {
        try {
          const res = await fetch(`/api/locations/detect?lat=${lat}&lng=${lng}`);
          if (res.ok) {
            const json = await res.json();
            if (json?.success && json.data) {
              setAddressInput(json.data.addressValue);
              setDeliveryAddress(json.data.addressValue);
              setDeliveryCoords({ lat: json.data.lat, lng: json.data.lng });
              showToast(`Location detected: ${json.data.addressValue}`);
            }
          }
        } catch (err) {
          console.error('Failed to detect location via backend:', err);
        }
      };

      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolveFromBackend(pos.coords.latitude, pos.coords.longitude);
          },
          () => {
            // If permission is denied, ask backend for default fallback campus
            resolveFromBackend(NaN, NaN);
          },
          { timeout: 6000 }
        );
      } else {
        resolveFromBackend(NaN, NaN);
      }
      return;
    }

    setAddressInput(suggestion.addressValue);
    setDeliveryAddress(suggestion.addressValue);
    if (suggestion.lat && suggestion.lng) {
      setDeliveryCoords({ lat: suggestion.lat, lng: suggestion.lng });
    }
  };

  const handleFindFood = (e) => {
    if (e) e.preventDefault();
    const finalAddress = addressInput.trim() || deliveryAddress || 'Parakaduwa';
    setDeliveryAddress(finalAddress);
    setAddressInput(finalAddress);
    setShowSuggestions(false);

    if (!isLoggedIn) {
      setActiveModal('auth');
      showToast('Please log in to view full UniGroceries & UniEats stores for your address.');
      return;
    }

    setPageView('storefront');
    showToast(`Showing stores delivering to ${finalAddress}`);
  };

  // =========================================================================
  // 7. FILTERED STORES ON STOREFRONT
  // =========================================================================
  const filteredStores = useMemo(() => {
    return storesWithGeo.filter((store) => {
      if (onlyFavorites && !favoriteStoreIds.includes(store.id)) return false;
      if (sidebarCategory === 'offers' && !store.saleBadge) return false;
      if (
        sidebarCategory !== 'home' &&
        sidebarCategory !== 'grocery' &&
        sidebarCategory !== 'offers' &&
        store.category !== sidebarCategory
      ) {
        return false;
      }
      if (topIconFilter && store.subCategory !== topIconFilter && topIconFilter !== 'offers') {
        return false;
      }
      if (topIconFilter === 'offers' && !store.saleBadge) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = store.name.toLowerCase().includes(q);
        const matchArea = deliveryAddress.toLowerCase().includes(q);
        const matchCategory =
          store.category?.toLowerCase().includes(q) ||
          store.subCategory?.toLowerCase().includes(q) ||
          store.templateKey?.toLowerCase().includes(q);
        const matchItems = store.items?.some(
          (it) =>
            it.name.toLowerCase().includes(q) ||
            (it.tag && it.tag.toLowerCase().includes(q)) ||
            (it.desc && it.desc.toLowerCase().includes(q))
        );
        const matchMenus = store.menuSections?.some((m) => m.toLowerCase().includes(q));
        return matchName || matchArea || matchCategory || matchItems || matchMenus;
      }
      return true;
    });
  }, [storesWithGeo, onlyFavorites, favoriteStoreIds, sidebarCategory, topIconFilter, searchQuery, deliveryAddress]);

  const toggleFavorite = (storeId, e) => {
    if (e) e.stopPropagation();
    setFavoriteStoreIds((prev) =>
      prev.includes(storeId) ? prev.filter((id) => id !== storeId) : [...prev, storeId]
    );
  };

  // =========================================================================
  // 8. CART, CHECKOUT ORDER TOTAL & GLOBAL PAYMENT GATEWAY CALCULATIONS
  // =========================================================================
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.qty, 0), [cart]);
  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cart]
  );

  // Exact Order Total math matching Screenshot 4:
  // Subtotal (e.g., LKR 2,070.00)
  // Promotion (-LKR 550.00)
  // Delivery Fee (LKR 99.00, or +99 if Priority, or 0 if Uber One trial checked)
  // Estimated Taxes & Other Fees (LKR 146.10 or ~7% of subtotal)
  const baseDeliveryFee = storeDiningMode === 'PICKUP' ? 0 : 99;
  const priorityExtraFee = deliveryOptionType === 'priority' ? 99 : 0;
  const effectiveDeliveryFee = uberOneTrialChecked ? 0 : baseDeliveryFee + priorityExtraFee;
  const estimatedTaxesAndFees = useMemo(
    () => Number((cartSubtotal * 0.07058).toFixed(2)), // e.g., 2070 * 0.07058 = 146.10
    [cartSubtotal]
  );
  const appliedPromotion = cartSubtotal > 0 ? Math.min(promoDiscount, cartSubtotal) : 0;
  const finalOrderTotal = useMemo(
    () =>
      Math.max(
        0,
        Number(
          (cartSubtotal - appliedPromotion + effectiveDeliveryFee + estimatedTaxesAndFees).toFixed(
            2
          )
        )
      ),
    [cartSubtotal, appliedPromotion, effectiveDeliveryFee, estimatedTaxesAndFees]
  );

  const getItemCartQty = (itemId) => {
    const found = cart.find((c) => c.itemId === itemId);
    return found ? found.qty : 0;
  };

  // Fetches single product by ID via GET /api/products/:id (Product.findById) when user clicks a product card
  const openProductDetailModal = async (store, item, e) => {
    if (e) e.stopPropagation();
    const existing = cart.find((c) => c.itemId === item.id);
    setProductModalQty(existing ? existing.qty : 1);
    setProductModalNote(existing?.note || '');
    setProductDetailModal({ store, item });

    try {
      const res = await fetch(`/api/products/${encodeURIComponent(item.id)}`);
      if (res.ok) {
        const json = await res.json();
        if (json?.success && json.data) {
          setProductDetailModal({ store, item: json.data });
        }
      }
    } catch {
      // Uses local item object if backend is offline
    }
  };

  const handleAddFromProductModal = () => {
    if (!productDetailModal) return;
    const { store, item } = productDetailModal;
    const displayStoreName = store.displayName || store.name;

    cartLoadedRef.current = true;
    setCart((prev) => {
      const existing = prev.find((i) => i.itemId === item.id);
      if (existing) {
        return prev.map((i) =>
          i.itemId === item.id ? { ...i, qty: productModalQty, note: productModalNote } : i
        );
      }
      return [
        ...prev,
        {
          itemId: item.id,
          storeId: store.id,
          storeName: displayStoreName,
          storeAddress: store.streetAddress || deliveryAddress,
          storeLogo: store.logoImg,
          name: item.name,
          price: item.price,
          qty: productModalQty,
          note: productModalNote,
          img: item.img,
        },
      ];
    });

    setProductDetailModal(null);
    showToast(`Added ${productModalQty} × "${item.name}" to your cart!`);
  };

  const updateCartQty = (itemId, delta) => {
    cartLoadedRef.current = true;
    setCart((prev) =>
      prev
        .map((item) => (item.itemId === itemId ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0)
    );
  };

  // Step 1: Clicking "Go to checkout" in the Cart Drawer opens the Delivery Details Form (Screenshots 3 & 4)
  const handleGoToDeliveryDetails = () => {
    if (cart.length === 0) return;
    setCartOpen(false);
    setPageView('checkout-details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 2: Clicking "Next" on the Delivery Details Form redirects to the Global Payment Gateway Section
  const handleProceedToGlobalPaymentGateway = () => {
    setCompletedReceipt(null);
    setGatewayServiceHeader('uniEats');
    setPageView('payment-gateway');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Redirected to Global Payment Gateway (uniEats)');
  };

  // Step 3: Completing payment inside the Global Payment Gateway & saving via POST /api/orders
  const handleProcessGlobalPayment = (e) => {
    if (e) e.preventDefault();
    setIsProcessingPayment(true);
    setTimeout(async () => {
      const txnId = `TXN-${gatewayServiceHeader.toUpperCase()}-${Math.floor(
        100000 + Math.random() * 900000
      )}`;
      const orderPayload = {
        txnId,
        service: gatewayServiceHeader,
        storeName: cart[0]?.storeName || activeStore?.name || 'UniEats Partner Store',
        deliveryAddress,
        dropoffMethod,
        deliveryInstructions,
        deliveryOptionType,
        items: cart,
        subtotal: cartSubtotal,
        promotion: appliedPromotion,
        deliveryFee: effectiveDeliveryFee,
        taxes: estimatedTaxesAndFees,
        totalPaid: finalOrderTotal,
        paymentMethod:
          paymentOption === 'card'
            ? `Visa Card (${cardForm.number})`
            : paymentOption === 'unicash'
            ? 'UniPay / Uber Cash Wallet'
            : 'Cash on Delivery',
        paidAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload),
        });
        if (res.ok) {
          const saved = await res.json();
          if (saved?.orderId) {
            orderPayload.orderId = saved.orderId;
          }
        }
      } catch {
        // Fallback if backend is offline
      }

      setCompletedReceipt(orderPayload);
      setCart([]);
      try {
        localStorage.removeItem('unieats_cart');
      } catch {}
      fetch(`/api/cart?userId=${encodeURIComponent(userProfile.email || 'ruvini')}`, {
        method: 'DELETE',
      }).catch(() => {});
      setIsProcessingPayment(false);
      showToast(`Payment Successful (${txnId})!`);
    }, 1500);
  };

  // =========================================================================
  // 9. USER PROFILE IMAGE UPLOAD & RATINGS HANDLERS
  // =========================================================================
  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setUserProfile((prev) => ({ ...prev, avatarUrl: String(reader.result) }));
      showToast('Profile picture updated successfully!');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitRating = (e) => {
    e.preventDefault();
    if (ratingTargetType === 'shop') {
      const targetShop = stores.find((s) => s.id === selectedShopToRate);
      if (targetShop) {
        setStores((prev) =>
          prev.map((s) => {
            if (s.id !== targetShop.id) return s;
            const newCount = s.ratingCount + 1;
            const newRating = Number(((s.rating * s.ratingCount + starValue) / newCount).toFixed(1));
            return { ...s, rating: newRating, ratingCount: newCount };
          })
        );
        setReviewsHistory((prev) => [
          {
            id: `rev-${Date.now()}`,
            type: 'shop',
            targetName: `${targetShop.name} (${deliveryAddress})`,
            stars: starValue,
            comment: reviewComment || 'Great store & fast packing!',
            author: userProfile.name,
            date: 'Just now',
          },
          ...prev,
        ]);
        showToast(`Thank you for rating ${targetShop.name} (${starValue}★)!`);
      }
    } else {
      const targetRider = riders.find((r) => r.id === selectedRiderToRate);
      if (targetRider) {
        setRiders((prev) =>
          prev.map((r) => {
            if (r.id !== targetRider.id) return r;
            const newRating = Number(((r.rating * 10 + starValue) / 11).toFixed(1));
            return { ...r, rating: newRating, completedDeliveries: r.completedDeliveries + 1 };
          })
        );
        showToast(`Thank you for rating ${targetRider.name} (${starValue}★)!`);
      }
    }
    setReviewComment('');
  };

  // Service metadata for the Global Payment Gateway header switcher
  const GLOBAL_SERVICES_META = {
    uniEats: {
      brandTitle: 'uniEats',
      subtitle: 'Campus Food & Restaurant Delivery Checkout',
      accent: '#F59E0B',
      icon: <Utensils size={18} />,
    },
    uniRider: {
      brandTitle: 'uniRider',
      subtitle: 'Campus Bike & Tuk Ride Booking Payment',
      accent: '#2563eb',
      icon: <Car size={18} />,
    },
    uniParcel: {
      brandTitle: 'uniParcel',
      subtitle: 'Express Campus Courier & Parcel Service Payment',
      accent: '#d97706',
      icon: <Truck size={18} />,
    },
    uniGroceries: {
      brandTitle: 'uniGroceries',
      subtitle: 'Supermarket & Daily Essentials Checkout',
      accent: '#16a34a',
      icon: <ShoppingBag size={18} />,
    },
  };

  const currentServiceInfo =
    GLOBAL_SERVICES_META[gatewayServiceHeader] || GLOBAL_SERVICES_META.uniEats;

  return (
    <div className="ue-root">
      {/* =====================================================================
          HEADER 1: CLEAN STOREFRONT & CATALOG NAVBAR (Exact match to Screenshot 2!)
          Removed: All Stores link, Store Catalog link, UniRide link, + Add Shop,
          Tracker, and Wallet tab. Expanded the Search Bar width!
         ===================================================================== */}
      {(pageView === 'landing' ||
        pageView === 'storefront' ||
        pageView === 'store-catalog' ||
        pageView === 'rider-dashboard') && (
        <header
          className={`ue-navbar ${
            pageView === 'landing' ? 'ue-navbar-landing' : 'ue-navbar-clean-white'
          }`}
        >
          <div className="ue-navbar-clean-inner">
            {/* Left Group: Hamburger + Uber Eats / UniEats Logo + Delivery/Pickup Toggle + Location */}
            <div className="ue-clean-nav-left">
              <button
                type="button"
                className="ue-clean-hamburger"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
              >
                <Menu size={22} />
              </button>

              <button
                type="button"
                className="ue-clean-logo"
                onClick={() => setPageView(pageView === 'landing' ? 'storefront' : 'landing')}
              >
                {pageView === 'landing' ? (
                  <span className="ue-landing-logo-text">
                    uni<span className="ue-fresh-green">Eats</span>.
                  </span>
                ) : (
                  <span className="ue-ubereats-logo-text">
                    uni<strong className="ue-fresh-green">Eats</strong>
                  </span>
                )}
              </button>

              {pageView !== 'landing' && (
                <>
                  {/* Delivery | Pickup Toggle Pill (Screenshot 2) */}
                  <div className="ue-clean-mode-Switch">
                    <button
                      type="button"
                      className={storeDiningMode === 'DELIVERY' ? 'active' : ''}
                      onClick={() => setStoreDiningMode('DELIVERY')}
                    >
                      Delivery
                    </button>
                    <button
                      type="button"
                      className={storeDiningMode === 'PICKUP' ? 'active' : ''}
                      onClick={() => setStoreDiningMode('PICKUP')}
                    >
                      Pickup
                    </button>
                  </div>

                  {/* Customer Delivery Address Pill (React useState) */}
                  <button
                    type="button"
                    className="ue-clean-location-btn"
                    onClick={() => setActiveModal('address-edit')}
                    title="Change delivery address"
                  >
                    <MapPin size={16} />
                    <span>
                      {deliveryAddress} · {deliveryTime === 'Deliver now' ? 'Now' : 'Schedule'}
                    </span>
                    <ChevronDown size={15} />
                  </button>
                </>
              )}
            </div>

            {/* Wide Search Bar with Live Autocomplete Suggestions (Screenshots 4 & 5) */}
            {pageView !== 'landing' && (
              <div className="ue-clean-wide-search-container">
                <div className="ue-clean-wide-search">
                  <Search size={18} className="ue-clean-search-icon" />
                  <input
                    type="text"
                    value={searchQuery}
                    onFocus={() => setShowSearchDropdown(true)}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSearchDropdown(true);
                      if (pageView !== 'storefront') setPageView('storefront');
                    }}
                    placeholder="Search stores, food or cuisine (e.g. kottu, pizza, burger, keells)"
                    aria-label="Search uniEats"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="ue-clear-search"
                      onClick={() => {
                        setSearchQuery('');
                        setShowSearchDropdown(false);
                      }}
                      aria-label="Clear search"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                {/* Autocomplete Dropdown list (Screenshot 4: kottu, kottu near me, chicken kottu, etc.) */}
                {showSearchDropdown && searchSuggestions.length > 0 && (
                  <ul className="ue-search-dropdown-menu" role="listbox">
                    {searchSuggestions.map((sug, i) => (
                      <li key={i}>
                        <button
                          type="button"
                          className="ue-search-sugg-row"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            const cleanQuery = sug.startsWith('Search for "')
                              ? sug.slice(12, -1)
                              : sug;
                            setSearchQuery(cleanQuery);
                            setShowSearchDropdown(false);
                            if (pageView !== 'storefront') setPageView('storefront');
                          }}
                        >
                          <Search size={16} className="ue-search-sugg-icon" />
                          <span>{sug}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Right: Persona Switcher & Cart Icon with Green Badge */}
            <div className="ue-clean-nav-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ConciergePersonaSwitcher
                currentActor={currentActor}
                onSelectActor={handleSelectActor}
              />
              <button
                type="button"
                className="ue-clean-cart-btn"
                onClick={() => setCartOpen(true)}
                aria-label="Shopping cart"
              >
                <ShoppingCart size={22} />
                <span className="ue-clean-cart-badge">{cartCount}</span>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* =====================================================================
          HEADER 2: MINIMAL CHECKOUT HEADER (Exact match to Screenshot 3!)
          Shows "← Back to store" on the left and centered "Uber Eats" title.
         ===================================================================== */}
      {pageView === 'checkout-details' && (
        <header className="ue-checkout-topbar">
          <div className="ue-checkout-topbar-inner">
            <button
              type="button"
              className="ue-checkout-back-btn"
              onClick={() => setPageView('store-catalog')}
            >
              <ArrowLeft size={18} />
              <span>Back to store</span>
            </button>

            <div
              className="ue-checkout-center-logo"
              onClick={() => setPageView('storefront')}
              role="button"
              tabIndex={0}
            >
              uni<strong className="ue-fresh-green">Eats</strong>
            </div>

            <div style={{ width: 110 }} />
          </div>
        </header>
      )}

      {/* =====================================================================
          HEADER 3: GLOBAL PAYMENT GATEWAY DYNAMIC HEADER
          Only changes header text between uniEats, uniRider, uniParcel, uniGroceries!
         ===================================================================== */}
      {pageView === 'payment-gateway' && (
        <header className="ue-global-pg-header">
          <div className="ue-global-pg-header-inner">
            <button
              type="button"
              className="ue-checkout-back-btn"
              onClick={() => setPageView('checkout-details')}
            >
              <ArrowLeft size={18} />
              <span>Back to delivery details</span>
            </button>

            {/* Dynamic Service Heading Text (uniEats / uniRider / uniParcel / uniGroceries) */}
            <div className="ue-global-pg-brand">
              <span
                className="ue-global-pg-icon"
                style={{ backgroundColor: currentServiceInfo.accent }}
              >
                {currentServiceInfo.icon}
              </span>
              <div>
                <h1 className="ue-global-pg-title">
                  {gatewayServiceHeader === 'uniEats' ? (
                    <>
                      uni<span className="ue-fresh-green">Eats</span>.
                    </>
                  ) : (
                    `${currentServiceInfo.brandTitle}.`
                  )}
                </h1>
                <span className="ue-global-pg-sub">{currentServiceInfo.subtitle}</span>
              </div>
            </div>

            {/* Service Switcher Pills to demonstrate that all services share this gateway */}
            <div className="ue-global-pg-switcher">
              {Object.keys(GLOBAL_SERVICES_META).map((svcKey) => (
                <button
                  key={svcKey}
                  type="button"
                  className={`ue-pg-svc-pill ${gatewayServiceHeader === svcKey ? 'active' : ''}`}
                  onClick={() => setGatewayServiceHeader(svcKey)}
                >
                  {svcKey}
                </button>
              ))}
            </div>
          </div>
        </header>
      )}

      {/* =====================================================================
          SLIDE-OUT LEFT MOBILE / ACCOUNT MENU DRAWER (Customer Only — No Admin Add Shop)
         ===================================================================== */}
      {drawerOpen && (
        <div className="ue-drawer-backdrop" onClick={() => setDrawerOpen(false)}>
          <aside
            className="ue-drawer"
            onClick={(e) => e.stopPropagation()}
            aria-label="Account and Mobile Menu"
          >
            <div className="ue-drawer-profile">
              <div
                className="ue-drawer-avatar"
                onClick={() => {
                  setDrawerOpen(false);
                  setActiveModal('profile');
                }}
                title="Click to upload profile photo"
              >
                {userProfile.avatarUrl ? (
                  <img src={userProfile.avatarUrl} alt={userProfile.name} />
                ) : (
                  <User size={26} color="#ffffff" />
                )}
              </div>
              <div className="ue-drawer-user-info">
                <div className="ue-drawer-username">
                  {isLoggedIn ? userProfile.name : 'Guest User'}
                </div>
                <button
                  type="button"
                  className="ue-manage-account-link"
                  onClick={() => {
                    setDrawerOpen(false);
                    setActiveModal('profile');
                  }}
                >
                  Manage account
                </button>
              </div>
              <button
                type="button"
                className="ue-drawer-close"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            <div
              className="ue-drawer-address-box"
              onClick={() => {
                setDrawerOpen(false);
                setActiveModal('address-edit');
              }}
            >
              <MapPin size={15} />
              <div>
                <div className="ue-drawer-addr-label">Delivering to</div>
                <div className="ue-drawer-addr-val">{deliveryAddress}</div>
              </div>
            </div>

            <div style={{ padding: '0 16px 14px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6b7280', fontWeight: 700, marginBottom: '6px' }}>
                Demonstration Persona
              </div>
              <ConciergePersonaSwitcher
                currentActor={currentActor}
                onSelectActor={(act) => {
                  handleSelectActor(act);
                  setDrawerOpen(false);
                }}
              />
            </div>

            <ul className="ue-drawer-list">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    setPageView('storefront');

                  }}
                  style={{ color: '#0D253F', fontWeight: 700 }}
                >
                  <Store size={19} />
                  <span>Browse shops</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    setPageView('rider-dashboard');
                  }}
                  style={{ color: '#0D253F', fontWeight: 700 }}
                >
                  <Bike size={19} />
                  <span>Student Rider Terminal</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    setCartOpen(true);
                  }}
                >
                  <Receipt size={19} />
                  <span>Orders & Cart ({cartCount})</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    setPageView('storefront');
                    setOnlyFavorites((f) => !f);
                    showToast(
                      !onlyFavorites ? 'Showing your Favorite stores' : 'Showing all stores'
                    );
                  }}
                >
                  <Heart size={19} />
                  <span>Favorites ({favoriteStoreIds.length})</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    setActiveModal('help');
                  }}
                >
                  <HelpCircle size={19} />
                  <span>Help</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    setActiveModal('promotions');
                  }}
                >
                  <Tag size={19} />
                  <span>Promotions</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    setActiveModal('ratings');
                  }}
                >
                  <Star size={19} />
                  <span>Rate Shops & Riders</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="ue-drawer-multi"
                  onClick={() => {
                    setDrawerOpen(false);
                    showToast('Uber One active: LKR 0 Delivery Fee perks unlocked!');
                  }}
                >
                  <Sparkles size={19} />
                  <div>
                    <div className="ue-drawer-item-title">Uber One</div>
                    <div className="ue-drawer-gold-sub">Get savings on deliveries and rides</div>
                  </div>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="ue-drawer-multi"
                  onClick={() => {
                    setDrawerOpen(false);
                    showToast('Referral link copied! Invite friends to get LKR 0 Delivery Fee.');
                  }}
                >
                  <Gift size={19} />
                  <div>
                    <div className="ue-drawer-item-title">Invite friends</div>
                    <div className="ue-drawer-gray-sub">You get LKR 0 Delivery Fee</div>
                  </div>
                </button>
              </li>
            </ul>

            <div className="ue-drawer-signout">
              <button
                type="button"
                onClick={() => {
                  setIsLoggedIn(false);
                  setDrawerOpen(false);
                  setPageView('landing');
                  showToast('Signed out successfully');
                }}
              >
                Sign out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* =====================================================================
          VIEW 1: LANDING HERO PAGE
         ===================================================================== */}
      {pageView === 'landing' && (
        <section className="ue-landing-hero">
          <div className="ue-landing-overlay" />
          <div className="ue-landing-content">
            <h1 className="ue-landing-title">Order delivery near you</h1>

            <form className="ue-landing-search-bar" onSubmit={handleFindFood}>
              <div className="ue-landing-input-wrap">
                <MapPin size={18} className="ue-landing-pin" />
                <div className="ue-landing-input-inner">
                  <label htmlFor="delivery-address-input">Enter delivery address</label>
                  <input
                    id="delivery-address-input"
                    type="text"
                    value={addressInput}
                    onFocus={() => setShowSuggestions(true)}
                    onChange={(e) => {
                      setAddressInput(e.target.value);
                      setDeliveryAddress(e.target.value || 'Parakaduwa');
                      setShowSuggestions(true);
                    }}
                    placeholder="Enter a street, town or campus address"
                    autoComplete="off"
                  />
                </div>

                {showSuggestions && (
                  <ul className="ue-address-dropdown" role="listbox">
                    {locationSuggestions.map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectSuggestion(s)}
                          className="ue-suggestion-item"
                        >
                          <span className={`ue-sugg-icon ${s.isGps ? 'gps' : ''}`}>
                            {s.isGps ? <Navigation size={16} /> : <MapPin size={16} />}
                          </span>
                          <div>
                            <div className="ue-sugg-title">{s.title}</div>
                            <div className="ue-sugg-sub">{s.subtitle}</div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="ue-landing-time-wrap">
                <button
                  type="button"
                  className="ue-landing-time-btn"
                  onClick={() => setShowTimeMenu((v) => !v)}
                >
                  <Clock size={16} />
                  <span>{deliveryTime}</span>
                  <ChevronDown size={15} />
                </button>
                {showTimeMenu && (
                  <div className="ue-time-dropdown">
                    <button
                      type="button"
                      onClick={() => {
                        setDeliveryTime('Deliver now');
                        setShowTimeMenu(false);
                      }}
                    >
                      Deliver now
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeliveryTime('Schedule for later');
                        setShowTimeMenu(false);
                      }}
                    >
                      Schedule for later
                    </button>
                  </div>
                )}
              </div>

              <button type="submit" className="ue-find-food-btn">
                Find Food
              </button>
            </form>

            <div className="ue-landing-helper">
              <span>Current active delivery address (useState):</span>{' '}
              <strong>{deliveryAddress}</strong> ·{' '}
              <button
                type="button"
                className="ue-inline-link"
                onClick={() => setPageView('storefront')}
              >
                Open Storefront directly →
              </button>
              {dbHealth?.mongodb?.connected && (
                <span style={{ marginLeft: 10, color: '#05944f', fontWeight: 700 }}>
                  ● MongoDB Connected ({dbHealth.collections?.stores || 0} Stores ·{' '}
                  {dbHealth.collections?.products || 0} Products)
                </span>
              )}
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          VIEW 2: FULL UNIGROCERIES / UNIEATS STOREFRONT
         ===================================================================== */}
      {pageView === 'storefront' && (
        <div className="ue-storefront-layout">
          <aside className="ue-left-sidebar" aria-label="Store categories">
            <ul className="ue-sidebar-list">
              {sidebarCategories.map((cat) => (
                <React.Fragment key={cat.id}>
                  {cat.dividerAbove && <li className="ue-sidebar-divider" />}
                  <li>
                    <button
                      type="button"
                      className={`ue-sidebar-btn ${sidebarCategory === cat.id ? 'active' : ''}`}
                      onClick={() => {
                        setSidebarCategory(cat.id);
                        setTopIconFilter(null);
                        setOnlyFavorites(false);
                      }}
                    >
                      <span className="ue-sidebar-emoji">{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  </li>
                </React.Fragment>
              ))}
            </ul>
          </aside>

          <main className="ue-storefront-main">
            {/* TOP HORIZONTAL CATEGORY ICONS STRIP */}
            <div className="ue-top-icons-strip">
              {topIconCategories.map((ic) => (
                <button
                  key={ic.id}
                  type="button"
                  className={`ue-top-icon-item ${topIconFilter === ic.id ? 'selected' : ''}`}
                  onClick={() => setTopIconFilter((prev) => (prev === ic.id ? null : ic.id))}
                >
                  <span className="ue-top-icon-circle" style={{ background: ic.bg }}>
                    {ic.emoji}
                  </span>
                  <span className="ue-top-icon-label">{ic.label}</span>
                </button>
              ))}
            </div>

            {/* FEATURED / ADVERTISEMENT SLIDER */}
            <section className="ue-featured-section">
              <div className="ue-section-bar">
                <h2>
                  Featured on uni<span className="ue-fresh-green">Eats</span>
                </h2>
                <div className="ue-slider-controls">
                  <button
                    type="button"
                    className="ue-see-all-btn"
                    onClick={() => {
                      setTopIconFilter(null);
                      setSidebarCategory('home');
                    }}
                  >
                    See all
                  </button>
                  <button
                    type="button"
                    className="ue-round-arrow"
                    onClick={() =>
                      setAdSlideIndex((prev) =>
                        featuredAds.length
                          ? (prev - 1 + featuredAds.length) % featuredAds.length
                          : 0
                      )
                    }
                    aria-label="Previous slide"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <button
                    type="button"
                    className="ue-round-arrow"
                    onClick={() =>
                      setAdSlideIndex((prev) =>
                        featuredAds.length ? (prev + 1) % featuredAds.length : 0
                      )
                    }
                    aria-label="Next slide"
                  >
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              <div className="ue-featured-grid">
                {featuredAds.map((ad, idx) => {
                  const isHighlighted = idx === adSlideIndex;
                  const linkedStore =
                    storesWithGeo.find((s) => s.id === ad.storeId) || storesWithGeo[0];
                  const isFav = favoriteStoreIds.includes(ad.storeId);
                  return (
                    <article
                      key={ad.id}
                      className={`ue-featured-card ${isHighlighted ? 'active-slide' : ''}`}
                      onClick={() => handleOpenStorePage(linkedStore)}
                    >
                      <div className="ue-featured-banner" style={{ background: ad.bannerBg }}>
                        <img src={ad.image} alt={ad.name} className="ue-featured-img" />
                        <div className="ue-featured-overlay">
                          {ad.badge && <span className="ue-sale-badge">{ad.badge}</span>}
                          <div className="ue-banner-text">
                            <h3>{ad.bannerTitle}</h3>
                            <span>{ad.bannerSub}</span>
                          </div>
                        </div>
                      </div>

                      <div className="ue-featured-info">
                        <div className="ue-featured-row">
                          <h4>
                            {ad.name}
                          </h4>
                          <button
                            type="button"
                            className={`ue-heart-btn ${isFav ? 'liked' : ''}`}
                            onClick={(e) => toggleFavorite(ad.storeId, e)}
                            aria-label="Favorite store"
                          >
                            <Heart size={17} fill={isFav ? '#e03131' : 'none'} />
                          </button>
                        </div>
                        <div className="ue-featured-meta">
                          <span>{ad.deliveryFee}</span>
                          <span>·</span>
                          <span>
                            {ad.fastDelivery ? '⚡ ' : ''}
                            {linkedStore?.eta || ad.eta}
                          </span>
                        </div>
                        <div className="ue-featured-rating">
                          <strong>{ad.rating}★</strong> ({ad.reviewsCount}) · {ad.timeNote}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            {/* ALL STORES GRID OR SEARCH RESULTS (Exact match to Screenshot 5) */}
            <section className="ue-all-stores-section">
              <div className="ue-section-bar">
                {searchQuery.trim() ? (
                  <div className="ue-search-header-box">
                    <h2 className="ue-search-results-h2">
                      {filteredStores.length} results for "{searchQuery}"
                    </h2>
                    <span className="ue-store-count">
                      Showing stores &amp; dishes matching "{searchQuery}" near {deliveryAddress}
                    </span>
                  </div>
                ) : (
                  <div>
                    <h2>All stores</h2>
                    <span className="ue-store-count">{filteredStores.length} stores delivering to {deliveryAddress}</span>
                  </div>
                )}
              </div>

              <div className="ue-all-stores-grid">
                {filteredStores.map((store) => {
                  const isFav = favoriteStoreIds.includes(store.id);
                  return (
                    <article
                      key={store.id}
                      className="ue-store-card"
                      onClick={() => handleOpenStorePage(store)}
                    >
                      <div className="ue-store-logo-wrap" style={{ backgroundColor: store.logoBg }}>
                        <img src={store.logoImg} alt={store.name} className="ue-store-logo-img" />
                      </div>

                      <div className="ue-store-card-body">
                        <div className="ue-store-title-row">
                          <h3 className="ue-store-name">
                            {store.displayName || store.name}
                          </h3>
                          <button
                            type="button"
                            className={`ue-heart-btn ${isFav ? 'liked' : ''}`}
                            onClick={(e) => toggleFavorite(store.id, e)}
                            aria-label={`Save ${store.name}`}
                          >
                            <Heart size={17} fill={isFav ? '#e03131' : 'none'} />
                          </button>
                        </div>

                        <div className="ue-store-sub-meta">
                          <span>{store.timeSlot || store.eta}</span>
                          <span>·</span>
                          <span className="ue-store-star">
                            ★ {store.rating} ({store.ratingCount})
                          </span>
                        </div>

                        {store.saleBadge && (
                          <span className="ue-store-sale-tag">{store.saleBadge}</span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
      </main>
        </div>
      )}

      {/* =====================================================================
          VIEW 3: FULL-PAGE STORE PRODUCT CATALOG
         ===================================================================== */}
      {pageView === 'store-catalog' && activeStore && (
        <main className="ue-sc-page">
          <div className="ue-sc-container">
            <div className="ue-sc-back-row">
              <button
                type="button"
                className="ue-sc-back-btn"
                onClick={() => setPageView('storefront')}
              >
                <ArrowLeft size={16} />
                <span>Back to all stores</span>
              </button>
            </div>

            {/* 1. WIDE STORE HERO BANNER (Uber Eats style matching Screenshot 1) */}
            <div className="ue-sc-hero-wrap">
              <div className="ue-sc-hero-banner">
                <img
                  src={activeStore.bannerImg || activeStore.logoImg}
                  alt={activeStore.name}
                  className="ue-sc-hero-img"
                />
              </div>
            </div>

            {/* 2. STORE HEADER & CONTROLS ROW (Matches Screenshot 1 - Hotel Chanaka Bro) */}
            <div className="ue-sc-header-grid">
              <div className="ue-sc-store-info">
                <h1 className="ue-sc-store-title">
                  {activeStore.name}
                </h1>

                <div className="ue-sc-rating-line">
                  <strong>{activeStore.rating} ★</strong>
                  <span>({activeStore.ratingCount})</span>
                  <span>•</span>
                  <span>LKR{activeStore.deliveryFee} Delivery Fee</span>
                  <span>•</span>
                  <span className="ue-sc-uberone-inline">Uber One</span>
                  <span>•</span>
                  <button
                    type="button"
                    className="ue-sc-info-link"
                    onClick={() => setActiveModal('ratings')}
                  >
                    Info
                  </button>
                </div>

                <div className="ue-sc-address-line">
                  {activeStore.streetAddress || `No 217, Paradise, Kuruwita, APAC 70500`}
                </div>

                {/* Delivery / Pickup mode + Group order (Screenshot 1) */}
                <div className="ue-sc-mode-row-left">
                  <div className="ue-sc-mode-toggle">
                    <button
                      type="button"
                      className={storeDiningMode === 'DELIVERY' ? 'active' : ''}
                      onClick={() => setStoreDiningMode('DELIVERY')}
                    >
                      Delivery
                    </button>
                    <button
                      type="button"
                      className={storeDiningMode === 'PICKUP' ? 'active' : ''}
                      onClick={() => setStoreDiningMode('PICKUP')}
                    >
                      Pickup
                    </button>
                  </div>

                  <button
                    type="button"
                    className="ue-sc-group-order-btn"
                    onClick={() =>
                      showToast('Group order link generated! Share with friends.')
                    }
                  >
                    <Users size={15} />
                    <span>Group order</span>
                  </button>
                </div>
              </div>

              <div className="ue-sc-right-controls">
                <div className="ue-sc-in-search-row">
                  <div className="ue-sc-in-search">
                    <Search size={16} />
                    <input
                      type="text"
                      value={storeSearchQuery}
                      onChange={(e) => setStoreSearchQuery(e.target.value)}
                      placeholder={`Search in ${activeStore.name}`}
                    />
                    {storeSearchQuery && (
                      <button type="button" onClick={() => setStoreSearchQuery('')}>
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="ue-sc-fulfillment-bar">
                  <div className="ue-sc-fee-box">
                    <strong>LKR{activeStore.deliveryFee} Delivery Fee</strong>
                    <span>Pricing & fees</span>
                  </div>
                  <div className="ue-sc-fee-divider" />
                  <div className="ue-sc-fee-box">
                    <strong>{activeStore.eta || '41 min'}</strong>
                    <span>
                      Earliest arrival <Info size={11} style={{ verticalAlign: 'middle' }} />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. TWO-COLUMN CATALOG BODY */}
            <div className="ue-sc-body-grid">
              <aside className="ue-sc-menu-sidebar">
                <div className="ue-sc-menu-head">
                  <div className="ue-sc-menu-title-row">
                    <strong>{activeStore.menuTitle || 'Menu'}</strong>
                    <ChevronDown size={15} />
                  </div>
                  <span className="ue-sc-menu-hours">
                    {activeStore.menuHours || '11:00 AM – 11:00 PM'}
                  </span>
                </div>

                <ul className="ue-sc-menu-nav">
                  {activeStoreMenuSections.map((sec) => (
                    <li key={sec}>
                      <button
                        type="button"
                        className={`ue-sc-menu-link ${activeMenuSection === sec ? 'active' : ''}`}
                        onClick={() => setActiveMenuSection(sec)}
                      >
                        {sec}
                      </button>
                    </li>
                  ))}
                </ul>
              </aside>

              <div className="ue-sc-catalog-main">
                {/* SAVINGS AND MORE */}
                <section className="ue-sc-savings-section">
                  <h2 className="ue-sc-sec-heading">Savings and more</h2>

                  <div className="ue-sc-uberone-card">
                    <div className="ue-sc-uberone-left">
                      <h3>Try Uber One free for 1 month</h3>
                      <button
                        type="button"
                        className="ue-sc-join-btn"
                        onClick={() => {
                          setUberOneTrialChecked(true);
                          showToast('Uber One 1-month free trial enabled!');
                        }}
                      >
                        Join now
                      </button>
                    </div>
                    <div className="ue-sc-uberone-right">
                      <img
                        src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80"
                        alt="Uber One Promo"
                      />
                      <span className="ue-sc-uberone-emblem">1</span>
                    </div>
                  </div>
                </section>

                {/* DEDICATED PRODUCT CATALOG FILTER & SORT TOOLBAR (Screenshots 1 & 2) */}
                <div className="ue-sc-catalog-filter-bar">
                  <div className="ue-sc-cfb-left">
                    <span className="ue-sc-cfb-label">Filter &amp; Sort:</span>
                    <div className="ue-sc-pills-wrap">
                      <button
                        type="button"
                        className={`ue-sc-filter-pill ${priceSort === '' ? 'active' : ''}`}
                        onClick={() => setPriceSort('')}
                      >
                        ✨ Featured
                      </button>
                      <button
                        type="button"
                        className={`ue-sc-filter-pill ${priceSort === 'lowest' ? 'active' : ''}`}
                        onClick={() => setPriceSort('lowest')}
                      >
                        Price: Low to High
                      </button>
                      <button
                        type="button"
                        className={`ue-sc-filter-pill ${priceSort === 'highest' ? 'active' : ''}`}
                        onClick={() => setPriceSort('highest')}
                      >
                        Price: High to Low
                      </button>
                      <button
                        type="button"
                        className={`ue-sc-filter-pill ${priceSort === 'popular' ? 'active' : ''}`}
                        onClick={() => setPriceSort('popular')}
                      >
                        🔥 Most Popular
                      </button>
                      <button
                        type="button"
                        className={`ue-sc-filter-pill ${priceSort === 'top-budget' ? 'active' : ''}`}
                        onClick={() => setPriceSort('top-budget')}
                      >
                        🏷️ Top Budget (&lt; LKR 1,200)
                      </button>
                    </div>
                  </div>

                  <div className="ue-sc-cfb-right">
                    <span className="ue-sc-items-counter">
                      {activeStoreFilteredItems.length} items available
                    </span>
                  </div>
                </div>

                {/* FEATURED ITEMS */}
                <section className="ue-sc-featured-items-sec">
                  <div className="ue-sc-sec-header-row">
                    <h2 className="ue-sc-sec-heading">Featured items</h2>
                    <div className="ue-sc-arrows">
                      <button type="button" className="ue-round-arrow" aria-label="Previous items">
                        <ArrowLeft size={16} />
                      </button>
                      <button type="button" className="ue-round-arrow" aria-label="Next items">
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="ue-sc-featured-cards-grid">
                    {activeStoreFilteredItems.slice(0, 4).map((item) => {
                      const inCartQty = getItemCartQty(item.id);
                      return (
                        <article
                          key={item.id}
                          className="ue-sc-product-card"
                          onClick={(e) => openProductDetailModal(activeStore, item, e)}
                        >
                          <div className="ue-sc-product-img-box">
                            <img src={item.img} alt={item.name} />
                            {item.rankBadge && (
                              <span className="ue-sc-rank-badge">{item.rankBadge}</span>
                            )}
                            <button
                              type="button"
                              className={`ue-sc-circle-add-btn ${inCartQty > 0 ? 'has-qty' : ''}`}
                              onClick={(e) => openProductDetailModal(activeStore, item, e)}
                            >
                              {inCartQty > 0 ? inCartQty : <Plus size={18} />}
                            </button>
                          </div>

                          <div className="ue-sc-product-meta">
                            <h4>{item.name}</h4>
                            <p>
                              LKR {item.price.toLocaleString()}.00 • 👍 {item.likesPct}% (
                              {item.likesCount})
                            </p>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>

                {/* PICKED FOR YOU */}
                <section className="ue-sc-picked-sec">
                  <h2 className="ue-sc-sec-heading">
                    {activeMenuSection === 'Featured items' ? 'Picked for you' : activeMenuSection}
                  </h2>

                  <div className="ue-sc-picked-grid">
                    {activeStoreFilteredItems.map((item) => {
                      const inCartQty = getItemCartQty(item.id);
                      return (
                        <article
                          key={`picked-${item.id}`}
                          className="ue-sc-horiz-card"
                          onClick={(e) => openProductDetailModal(activeStore, item, e)}
                        >
                          <div className="ue-sc-horiz-info">
                            <h4>{item.name}</h4>
                            <div className="ue-sc-horiz-price">
                              LKR {item.price.toLocaleString()}.00 • 👍 {item.likesPct}% (
                              {item.likesCount})
                            </div>
                            <p className="ue-sc-horiz-desc">{item.desc}</p>
                          </div>

                          <div className="ue-sc-horiz-img-wrap">
                            <img src={item.img} alt={item.name} />
                            <button
                              type="button"
                              className={`ue-sc-circle-add-btn ${inCartQty > 0 ? 'has-qty' : ''}`}
                              onClick={(e) => openProductDetailModal(activeStore, item, e)}
                            >
                              {inCartQty > 0 ? inCartQty : <Plus size={18} />}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* =====================================================================
          VIEW 4: CHECKOUT DELIVERY DETAILS & ORDER TOTAL PAGE (Screenshots 3 & 4!)
          Includes Delivery details (Address + Meet at my door), Delivery options
          (Priority +LKR 99, Standard, Schedule), Payment (Uber Cash: LKR 0.00),
          Cart summary, Send as a gift, Promotion (50% off / -LKR 550.00),
          Order total (Subtotal, Promotion, Delivery Fee, Estimated Taxes & Other Fees,
          Total), and bottom red banner "Saving LKR 550 with promotions".
         ===================================================================== */}
      {pageView === 'checkout-details' && (
        <main className="ue-chk-page">
          <div className="ue-chk-container">
            {/* LEFT COLUMN: Delivery details, Delivery options, Payment, Next */}
            <div className="ue-chk-left-col">
              <div className="ue-chk-card">
                {/* Delivery details header */}
                <div className="ue-chk-card-head">
                  <h2>Delivery details</h2>
                  <div className="ue-clean-mode-Switch">
                    <button
                      type="button"
                      className={storeDiningMode === 'DELIVERY' ? 'active' : ''}
                      onClick={() => setStoreDiningMode('DELIVERY')}
                    >
                      Delivery
                    </button>
                    <button
                      type="button"
                      className={storeDiningMode === 'PICKUP' ? 'active' : ''}
                      onClick={() => setStoreDiningMode('PICKUP')}
                    >
                      Pickup
                    </button>
                  </div>
                </div>

                {/* Row 1: Delivery Address */}
                <div className="ue-chk-detail-row">
                  <div className="ue-chk-detail-icon">
                    <Briefcase size={18} />
                  </div>
                  <div className="ue-chk-detail-body">
                    {editingAddressInCheckout ? (
                      <input
                        type="text"
                        className="ue-text-input"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        onBlur={() => setEditingAddressInCheckout(false)}
                        autoFocus
                      />
                    ) : (
                      <strong>{deliveryAddress}</strong>
                    )}
                  </div>
                  <button
                    type="button"
                    className="ue-chk-edit-pill"
                    onClick={() => setEditingAddressInCheckout((v) => !v)}
                  >
                    {editingAddressInCheckout ? 'Save' : 'Edit'}
                  </button>
                </div>

                <div className="ue-chk-row-divider" />

                {/* Row 2: Meet at my door / Add delivery instructions */}
                <div className="ue-chk-detail-row">
                  <div className="ue-chk-detail-icon">
                    <User size={18} />
                  </div>
                  <div className="ue-chk-detail-body">
                    <strong>{dropoffMethod}</strong>
                    {editingInstructionsInCheckout ? (
                      <div style={{ marginTop: 6 }}>
                        <select
                          className="ue-text-input"
                          style={{ marginBottom: 6 }}
                          value={dropoffMethod}
                          onChange={(e) => setDropoffMethod(e.target.value)}
                        >
                          <option value="Meet at my door">Meet at my door</option>
                          <option value="Leave at my door">Leave at my door</option>
                          <option value="Meet outside / hostel gate">Meet outside / hostel gate</option>
                        </select>
                        <input
                          type="text"
                          className="ue-text-input"
                          placeholder="Add gate code, landmark or phone note..."
                          value={deliveryInstructions}
                          onChange={(e) => setDeliveryInstructions(e.target.value)}
                        />
                      </div>
                    ) : (
                      <span
                        className="ue-chk-green-sub"
                        onClick={() => setEditingInstructionsInCheckout(true)}
                      >
                        {deliveryInstructions || 'Add delivery instructions'}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="ue-chk-edit-pill"
                    onClick={() => setEditingInstructionsInCheckout((v) => !v)}
                  >
                    {editingInstructionsInCheckout ? 'Save' : 'Edit'}
                  </button>
                </div>

                {/* Delivery options section */}
                <h3 className="ue-chk-sub-heading">Delivery options</h3>

                <div className="ue-chk-options-stack">
                  {/* Priority */}
                  <div
                    className={`ue-chk-option-box ${
                      deliveryOptionType === 'priority' ? 'selected' : ''
                    }`}
                    onClick={() => setDeliveryOptionType('priority')}
                  >
                    <div className="ue-chk-opt-icon green">
                      <Zap size={18} fill="#16a34a" color="#16a34a" />
                    </div>
                    <div className="ue-chk-opt-text">
                      <strong>Priority</strong>
                      <span>7:07–7:37 PM • Direct to you</span>
                    </div>
                    <div className="ue-chk-opt-price">+LKR 99.00</div>
                  </div>

                  {/* Standard (Selected by default with 2px black border) */}
                  <div
                    className={`ue-chk-option-box ${
                      deliveryOptionType === 'standard' ? 'selected' : ''
                    }`}
                    onClick={() => setDeliveryOptionType('standard')}
                  >
                    <div className="ue-chk-opt-icon">
                      <ShoppingBag size={18} />
                    </div>
                    <div className="ue-chk-opt-text">
                      <strong>Standard</strong>
                      <span>7:24–7:55 PM</span>
                    </div>
                  </div>

                  {/* Schedule */}
                  <div
                    className={`ue-chk-option-box ${
                      deliveryOptionType === 'schedule' ? 'selected' : ''
                    }`}
                    onClick={() => setDeliveryOptionType('schedule')}
                  >
                    <div className="ue-chk-opt-icon">
                      <Calendar size={18} />
                    </div>
                    <div className="ue-chk-opt-text">
                      <strong>Schedule</strong>
                      <span>
                        {deliveryOptionType === 'schedule' ? scheduledSlot : 'Choose a time'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Card (Screenshot 4) */}
              <div className="ue-chk-card">
                <h2>Payment</h2>
                <div className="ue-chk-detail-row" style={{ paddingTop: 10 }}>
                  <div className="ue-chk-uber-cash-icon">Uber</div>
                  <div className="ue-chk-detail-body">
                    <strong>Uber Cash: LKR 0.00</strong>
                    <span className="ue-chk-green-sub">+ Cash</span>
                  </div>
                  <button
                    type="button"
                    className="ue-chk-edit-pill"
                    onClick={handleProceedToGlobalPaymentGateway}
                  >
                    Edit
                  </button>
                </div>
              </div>

              {/* Full-width Black "Next" Button (Screenshot 4 bottom-left) */}
              <button
                type="button"
                className="ue-chk-next-btn"
                onClick={handleProceedToGlobalPaymentGateway}
              >
                Next
              </button>
            </div>

            {/* RIGHT COLUMN: Store Card, Cart summary, Send as a gift, Promotion, Order total */}
            <div className="ue-chk-right-col">
              {/* Top Store & Next Card */}
              <div className="ue-chk-card">
                <div
                  className="ue-chk-store-row"
                  onClick={() => setPageView('store-catalog')}
                >
                  <img
                    src={cart[0]?.storeLogo || activeStore?.logoImg}
                    alt={cart[0]?.storeName || 'Store'}
                    className="ue-chk-store-avatar"
                  />
                  <div style={{ flex: 1 }}>
                    <strong>{cart[0]?.storeName || 'Gamlath Restaurant & Hotel'}</strong>
                    <span>{cart[0]?.storeAddress || `Paradise, ${deliveryAddress}`}</span>
                  </div>
                  <ChevronRight size={18} color="#6b7280" />
                </div>

                <label className="ue-chk-trial-checkbox">
                  <input
                    type="checkbox"
                    checked={uberOneTrialChecked}
                    onChange={(e) => setUberOneTrialChecked(e.target.checked)}
                  />
                  <span>
                    Save an extra <strong>LKR 99.00</strong> on this order with a free trial of Uber
                    One
                  </span>
                </label>

                <button
                  type="button"
                  className="ue-chk-next-btn"
                  onClick={handleProceedToGlobalPaymentGateway}
                >
                  Next
                </button>
              </div>

              {/* Collapsible Cart summary (1 item) */}
              <div className="ue-chk-card ue-chk-compact-card">
                <button
                  type="button"
                  className="ue-chk-collapse-header"
                  onClick={() => setCartSummaryExpanded((v) => !v)}
                >
                  <div className="ue-chk-collapse-left">
                    <ShoppingCart size={18} />
                    <strong>
                      Cart summary ({cartCount} {cartCount === 1 ? 'item' : 'items'})
                    </strong>
                  </div>
                  {cartSummaryExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {cartSummaryExpanded && (
                  <div className="ue-chk-expanded-items">
                    {cart.map((c) => (
                      <div key={c.itemId} className="ue-chk-mini-item">
                        <img src={c.img} alt={c.name} />
                        <div style={{ flex: 1 }}>
                          <strong>
                            {c.qty} × {c.name}
                          </strong>
                          <span>LKR {(c.price * c.qty).toLocaleString()}.00</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Send as a gift */}
              <div
                className="ue-chk-card ue-chk-compact-card"
                onClick={() => showToast('Gift message attached to your delivery!')}
                style={{ cursor: 'pointer' }}
              >
                <div className="ue-chk-gift-line">
                  <span style={{ fontSize: 22 }}>🎁</span>
                  <div style={{ flex: 1 }}>
                    <strong>Send as a gift</strong>
                    <span>Add a personal message</span>
                  </div>
                  <ChevronRight size={18} color="#6b7280" />
                </div>
              </div>

              {/* Promotion Card (Screenshot 3 & 4) */}
              <div
                className="ue-chk-card"
                onClick={() => setActiveModal('promotions')}
                style={{ cursor: 'pointer' }}
              >
                <h3 className="ue-chk-side-title">Promotion</h3>
                <div className="ue-chk-promo-row">
                  <Tag size={18} />
                  <div style={{ flex: 1 }}>
                    <strong>Promotion applied</strong>
                    <span>50% off (Saving LKR {appliedPromotion})</span>
                  </div>
                  <ChevronRight size={18} color="#6b7280" />
                </div>
              </div>

              {/* Order total Breakdown Card (Exact match to Screenshot 4!) */}
              <div className="ue-chk-card">
                <h3 className="ue-chk-side-title">Order total</h3>

                <div className="ue-chk-totals-list">
                  <div className="ue-chk-total-line">
                    <span>Subtotal</span>
                    <span>
                      LKR {cartSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="ue-chk-total-line">
                    <span>Promotion</span>
                    <span className="ue-chk-red-pill">
                      -LKR {appliedPromotion.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="ue-chk-total-line">
                    <span>
                      Delivery Fee <Info size={13} style={{ verticalAlign: 'middle' }} />
                    </span>
                    <span>
                      LKR{' '}
                      {effectiveDeliveryFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="ue-chk-total-line">
                    <span>
                      Estimated Taxes &amp; Other Fees{' '}
                      <Info size={13} style={{ verticalAlign: 'middle' }} />
                    </span>
                    <span>
                      LKR{' '}
                      {estimatedTaxesAndFees.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="ue-chk-total-line grand">
                    <strong>Total</strong>
                    <strong>
                      LKR {finalOrderTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                </div>

                <p className="ue-chk-disclaimer">
                  If you&apos;re not around when the delivery person arrives, they&apos;ll leave your
                  order at the door. By placing your order, you agree to take full responsibility
                  for it once it&apos;s delivered. Orders containing alcohol or other restricted
                  items may not be eligible for leave at door and will be returned to the store if
                  you are not available.
                </p>
              </div>
            </div>
          </div>

          {/* Fixed Bottom Full-Width Red Promo Bar (Screenshots 3 & 4) */}
          <div className="ue-chk-bottom-red-bar">
            <Tag size={15} />
            <span>Saving LKR {appliedPromotion} with promotions</span>
          </div>
        </main>
      )}

      {/* =====================================================================
          VIEW 5: GLOBAL MULTI-SERVICE PAYMENT GATEWAY SECTION
          Shared across all services (uniEats, uniRider, uniParcel, uniGroceries)
          where only the header brand text dynamically changes!
         ===================================================================== */}
      {pageView === 'payment-gateway' && (
        <main className="ue-global-pg-main">
          <div className="ue-global-pg-container">
            {completedReceipt ? (
              <div className="ue-pg-receipt-card">
                <div
                  className="ue-pg-receipt-badge"
                  style={{ backgroundColor: currentServiceInfo.accent }}
                >
                  <CheckCircle2 size={28} color="#ffffff" />
                </div>
                <h2>{currentServiceInfo.brandTitle} Payment Confirmed!</h2>
                <p>
                  Transaction <strong>{completedReceipt.txnId}</strong> processed via Global Payment
                  Gateway at {completedReceipt.paidAt}.
                </p>

                <div className="ue-pg-receipt-grid">
                  <div>
                    <span>Service Header</span>
                    <strong>{completedReceipt.service}</strong>
                  </div>
                  <div>
                    <span>Store / Provider</span>
                    <strong>{completedReceipt.storeName}</strong>
                  </div>
                  <div>
                    <span>Delivery Address</span>
                    <strong>
                      {completedReceipt.deliveryAddress} ({completedReceipt.dropoffMethod})
                    </strong>
                  </div>
                  <div>
                    <span>Payment Method</span>
                    <strong>{completedReceipt.paymentMethod}</strong>
                  </div>
                  <div>
                    <span>Promotion Saved</span>
                    <strong style={{ color: '#dc2626' }}>
                      -LKR {completedReceipt.promotion.toFixed(2)}
                    </strong>
                  </div>
                  <div>
                    <span>Total Paid</span>
                    <strong style={{ color: '#0D253F', fontSize: 18 }}>
                      LKR {completedReceipt.totalPaid.toFixed(2)}
                    </strong>
                  </div>
                </div>

                <div className="ue-pg-receipt-actions">
                  <button
                    type="button"
                    className="ue-secondary-btn"
                    onClick={() => setCompletedReceipt(null)}
                  >
                    ← Back to Payment Gateway
                  </button>
                  <button
                    type="button"
                    className="ue-primary-btn"
                    onClick={() => {
                      setCart([]);
                      setPageView('storefront');
                    }}
                  >
                    Back to {currentServiceInfo.brandTitle} Home
                  </button>
                </div>
              </div>
            ) : (
              <div className="ue-global-pg-grid">
                {/* Left: Payment Method & Card Details */}
                <div className="ue-pg-box">
                  <div className="ue-pg-box-head">
                    <span
                      className="ue-pg-service-tag"
                      style={{ backgroundColor: currentServiceInfo.accent }}
                    >
                      GLOBAL PAYMENT GATEWAY · {currentServiceInfo.brandTitle.toUpperCase()}
                    </span>
                    <h2>Complete Your {currentServiceInfo.brandTitle} Payment</h2>
                    <p>
                      Universal checkout gateway for <strong>uniEats</strong>,{' '}
                      <strong>uniRider</strong>, <strong>uniParcel</strong> &amp;{' '}
                      <strong>uniGroceries</strong>.
                    </p>
                  </div>

                  {/* 3 Payment Methods */}
                  <div className="ue-gateway-options">
                    <button
                      type="button"
                      className={`ue-gateway-tab ${paymentOption === 'card' ? 'active' : ''}`}
                      onClick={() => setPaymentOption('card')}
                    >
                      <CreditCard size={18} />
                      <div>
                        <strong>Credit / Debit Card</strong>
                        <span>Visa / MasterCard</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`ue-gateway-tab ${paymentOption === 'unicash' ? 'active' : ''}`}
                      onClick={() => setPaymentOption('unicash')}
                    >
                      <Zap size={18} />
                      <div>
                        <strong>{currentServiceInfo.brandTitle} Cash</strong>
                        <span>Instant Wallet Pay</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`ue-gateway-tab ${paymentOption === 'cod' ? 'active' : ''}`}
                      onClick={() => setPaymentOption('cod')}
                    >
                      <Banknote size={18} />
                      <div>
                        <strong>Cash on Delivery</strong>
                        <span>Pay on Arrival</span>
                      </div>
                    </button>
                  </div>

                  <form onSubmit={handleProcessGlobalPayment} className="ue-pg-form">
                    {paymentOption === 'card' && (
                      <>
                        <div className="ue-form-group">
                          <label>Cardholder Name</label>
                          <input
                            type="text"
                            className="ue-text-input"
                            value={cardForm.name}
                            onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="ue-form-group">
                          <label>Card Number</label>
                          <input
                            type="text"
                            className="ue-text-input"
                            value={cardForm.number}
                            onChange={(e) => setCardForm({ ...cardForm, number: e.target.value })}
                            required
                          />
                        </div>
                        <div
                          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}
                        >
                          <div className="ue-form-group">
                            <label>Expiry Date</label>
                            <input
                              type="text"
                              className="ue-text-input"
                              value={cardForm.expiry}
                              onChange={(e) =>
                                setCardForm({ ...cardForm, expiry: e.target.value })
                              }
                              required
                            />
                          </div>
                          <div className="ue-form-group">
                            <label>CVV</label>
                            <input
                              type="password"
                              className="ue-text-input"
                              value={cardForm.cvv}
                              onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value })}
                              required
                            />
                          </div>
                          <div className="ue-form-group">
                            <label>OTP Code</label>
                            <input
                              type="text"
                              className="ue-text-input"
                              value={cardForm.otp}
                              onChange={(e) => setCardForm({ ...cardForm, otp: e.target.value })}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {paymentOption === 'unicash' && (
                      <div className="ue-gateway-panel" style={{ marginBottom: 16 }}>
                        <p>
                          Pay <strong>LKR {finalOrderTotal.toFixed(2)}</strong> instantly using your
                          linked <strong>{currentServiceInfo.brandTitle}</strong> account balance.
                        </p>
                      </div>
                    )}

                    {paymentOption === 'cod' && (
                      <div className="ue-gateway-panel" style={{ marginBottom: 16 }}>
                        <p>
                          Confirm your order now and pay{' '}
                          <strong>LKR {finalOrderTotal.toFixed(2)}</strong> in cash upon delivery at{' '}
                          <strong>{deliveryAddress}</strong>.
                        </p>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="ue-chk-next-btn"
                      disabled={isProcessingPayment}
                      style={{ backgroundColor: '#0D253F' }}
                    >
                      {isProcessingPayment ? (
                        <>
                          <Loader2 size={18} className="ue-spin" /> Processing{' '}
                          {currentServiceInfo.brandTitle} Payment...
                        </>
                      ) : (
                        <>
                          <Lock size={16} /> Pay LKR{' '}
                          {finalOrderTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} (
                          {currentServiceInfo.brandTitle})
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Right: Complete Order & Delivery Summary from Checkout Step */}
                <div className="ue-pg-box">
                  <h3>{currentServiceInfo.brandTitle} Order &amp; Delivery Summary</h3>

                  <div className="ue-pg-delivery-summary">
                    <div>
                      <small>DELIVERY ADDRESS</small>
                      <strong>{deliveryAddress}</strong>
                      <span>
                        {dropoffMethod}
                        {deliveryInstructions ? ` · "${deliveryInstructions}"` : ''}
                      </span>
                    </div>
                    <div>
                      <small>DELIVERY SPEED</small>
                      <strong style={{ textTransform: 'capitalize' }}>
                        {deliveryOptionType} Delivery
                      </strong>
                    </div>
                  </div>

                  <div className="ue-chk-totals-list" style={{ marginTop: 18 }}>
                    <div className="ue-chk-total-line">
                      <span>Subtotal ({cartCount} items)</span>
                      <span>
                        LKR {cartSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="ue-chk-total-line">
                      <span>Promotion (Offer)</span>
                      <span className="ue-chk-red-pill">
                        -LKR{' '}
                        {appliedPromotion.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="ue-chk-total-line">
                      <span>Delivery Fee (Shipping Cost)</span>
                      <span>
                        LKR{' '}
                        {effectiveDeliveryFee.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="ue-chk-total-line">
                      <span>Estimated Taxes &amp; Other Fees</span>
                      <span>
                        LKR{' '}
                        {estimatedTaxesAndFees.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="ue-chk-total-line grand">
                      <strong>Total Payable</strong>
                      <strong>
                        LKR {finalOrderTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      )}

      {/* =====================================================================
          VIEW 8: STUDENT RIDER DASHBOARD & MISSION DISPATCH TERMINAL
         ===================================================================== */}
      {pageView === 'rider-dashboard' && (
        <RiderDashboard
          riderActor={currentActor}
          onOpenReceipt={(orderId) => setViewingReceiptOrderId(orderId)}
        />
      )}

      {/* =====================================================================
          PRODUCT QUICK-VIEW / ADD-TO-ORDER MODAL
         ===================================================================== */}
      {productDetailModal && (
        <div className="ue-modal-backdrop" onClick={() => setProductDetailModal(null)}>
          <div className="ue-pm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ue-pm-top-bar">
              <button
                type="button"
                className="ue-pm-icon-btn"
                onClick={() => setProductDetailModal(null)}
                aria-label="Close product modal"
              >
                <X size={20} />
              </button>
              <button
                type="button"
                className="ue-pm-icon-btn"
                onClick={() => showToast('Product link copied to clipboard!')}
                aria-label="Share product"
              >
                <Share2 size={18} />
              </button>
            </div>

            <div className="ue-pm-body-grid">
              <div className="ue-pm-img-col">
                <img
                  src={productDetailModal.item.img}
                  alt={productDetailModal.item.name}
                  className="ue-pm-main-img"
                />
              </div>

              <div className="ue-pm-details-col">
                <h2 className="ue-pm-title">{productDetailModal.item.name}</h2>
                <div className="ue-pm-price">
                  LKR {productDetailModal.item.price.toLocaleString()}.00
                </div>

                <div className="ue-pm-badges-row">
                  {productDetailModal.item.rankBadge && (
                    <span className="ue-pm-pill">{productDetailModal.item.rankBadge}</span>
                  )}
                  <span className="ue-pm-pill">
                    👍 {productDetailModal.item.likesPct}% ({productDetailModal.item.likesCount})
                  </span>
                </div>

                <div className="ue-pm-divider" />

                <div className="ue-pm-instructions">
                  <h4>Special Instructions</h4>
                  <textarea
                    rows={3}
                    placeholder="Add a note"
                    value={productModalNote}
                    onChange={(e) => setProductModalNote(e.target.value)}
                  />
                  <small>You may be charged for extras.</small>
                </div>

                <div className="ue-pm-qty-wrap">
                  <select
                    value={productModalQty}
                    onChange={(e) => setProductModalQty(Number(e.target.value))}
                    className="ue-pm-qty-select"
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="ue-pm-footer">
              <button
                type="button"
                className="ue-pm-add-order-btn"
                onClick={handleAddFromProductModal}
              >
                Add {productModalQty} to order • LKR{' '}
                {(productDetailModal.item.price * productModalQty).toLocaleString()}.00
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          RIGHT-SIDE SLIDE-OUT CART DRAWER
          Clicking "Go to checkout" opens the Delivery Details Form (Screenshots 3 & 4)
         ===================================================================== */}
      {cartOpen && (
        <div className="ue-modal-backdrop" onClick={() => setCartOpen(false)}>
          <aside className="ue-ubereats-cart-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="ue-ucd-top-bar">
              <button
                type="button"
                className="ue-pm-icon-btn"
                onClick={() => setCartOpen(false)}
                aria-label="Close cart"
              >
                <X size={20} />
              </button>
              <button type="button" className="ue-pm-icon-btn" aria-label="More options">
                <MoreHorizontal size={20} />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="ue-empty-cart">
                <ShoppingCart size={42} />
                <p>Your cart is empty. Click any store and add products to your order!</p>
              </div>
            ) : (
              <div className="ue-ucd-body">
                <div
                  className="ue-ucd-store-row"
                  onClick={() => {
                    const st = storesWithGeo.find((s) => s.id === cart[0].storeId);
                    setCartOpen(false);
                    if (st) handleOpenStorePage(st);
                  }}
                >
                  <img
                    src={cart[0].storeLogo || activeStore?.logoImg}
                    alt={cart[0].storeName}
                    className="ue-ucd-store-logo"
                  />
                  <div className="ue-ucd-store-meta">
                    <strong>{cart[0].storeName}</strong>
                    <span>{cart[0].storeAddress || '496 Ratnapura Road'}</span>
                  </div>
                  <ChevronRight size={18} color="#6b7280" />
                </div>

                <div className="ue-ucd-items-list">
                  {cart.map((c) => (
                    <div key={c.itemId} className="ue-ucd-item-row">
                      <img src={c.img} alt={c.name} className="ue-ucd-item-thumb" />
                      <div className="ue-ucd-item-info">
                        <h4>{c.name}</h4>
                        <span>LKR {(c.price * c.qty).toLocaleString()}.00</span>
                        {c.note && <small>Note: {c.note}</small>}
                      </div>

                      <div className="ue-ucd-qty-pill">
                        <button
                          type="button"
                          onClick={() => updateCartQty(c.itemId, -1)}
                          aria-label="Decrease or remove"
                        >
                          {c.qty <= 1 ? <Trash2 size={14} /> : <Minus size={14} />}
                        </button>
                        <span>{c.qty}</span>
                        <button
                          type="button"
                          onClick={() => updateCartQty(c.itemId, 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="ue-ucd-note-box">
                  <div>
                    <strong>Add an order note</strong>
                    <input
                      type="text"
                      value={cartOrderNote}
                      onChange={(e) => setCartOrderNote(e.target.value)}
                      placeholder="Utensils, special instructions, etc."
                    />
                  </div>
                  <Plus size={18} color="#6b7280" />
                </div>

                <div
                  className="ue-ucd-gift-row"
                  onClick={() => showToast('Gift message option enabled for this delivery!')}
                >
                  <span className="ue-ucd-gift-icon">🎁</span>
                  <div style={{ flex: 1 }}>
                    <strong>Send as a gift</strong>
                    <span>Add a personal message</span>
                  </div>
                  <ChevronRight size={18} color="#6b7280" />
                </div>

                <div className="ue-ucd-spacer" />

                <div className="ue-ucd-subtotal-row">
                  <span>Subtotal</span>
                  <strong>LKR {cartSubtotal.toLocaleString()}.00</strong>
                </div>

                <div className="ue-ucd-uberone-banner">
                  Save an extra <span>LKR 99.00</span> on this order with a free trial of Uber One
                </div>

                <div className="ue-ucd-red-promo-bar">
                  Saving LKR {appliedPromotion} with promotions
                </div>

                <div className="ue-ucd-checkout-wrap">
                  <button
                    type="button"
                    className="ue-ucd-checkout-btn"
                    onClick={handleGoToDeliveryDetails}
                  >
                    Go to checkout
                  </button>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* =====================================================================
          UTILITY MODALS (Address Edit, Profile, Ratings, Help, Promotions)
         ===================================================================== */}
      {activeModal && (
        <div className="ue-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="ue-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ue-modal-header">
              <h2>
                {activeModal === 'address-edit' && 'Update Delivery Address'}
                {activeModal === 'profile' && 'Profile Settings & Photo Upload'}
                {activeModal === 'ratings' && 'Rate Shops & Riders'}
                {activeModal === 'help' && 'Help Center & Customer Support'}
                {activeModal === 'promotions' && 'Promotions & Offers'}
                {activeModal === 'auth' && 'Sign in to UniEats'}
              </h2>
              <button
                type="button"
                className="ue-close-btn"
                onClick={() => setActiveModal(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="ue-modal-body">
              {activeModal === 'address-edit' && (
                <div>
                  <div className="ue-form-group">
                    <label>Enter Street, Campus or Town Address</label>
                    <input
                      type="text"
                      className="ue-text-input"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="e.g., Parakaduwa or Cool Planet Pelawatte"
                    />
                  </div>
                  <div className="ue-quick-locations">
                    {locationSuggestions.map((loc) => (
                      <button
                        key={loc.id}
                        type="button"
                        className="ue-loc-chip"
                        onClick={() => {
                          setDeliveryAddress(loc.addressValue);
                          setAddressInput(loc.addressValue);
                          if (loc.lat && loc.lng) {
                            setDeliveryCoords({ lat: loc.lat, lng: loc.lng });
                          }
                          setActiveModal(null);
                          showToast(`Delivery address updated to ${loc.addressValue}`);
                        }}
                      >
                        <MapPin size={13} /> {loc.title}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="ue-primary-btn full"
                    style={{ marginTop: 16 }}
                    onClick={() => {
                      setActiveModal(null);
                      showToast(`Address saved: ${deliveryAddress}`);
                    }}
                  >
                    Save Address
                  </button>
                </div>
              )}

              {activeModal === 'profile' && (
                <div className="ue-profile-modal">
                  <div className="ue-profile-upload-row">
                    <div className="ue-profile-big-avatar">
                      {userProfile.avatarUrl ? (
                        <img src={userProfile.avatarUrl} alt={userProfile.name} />
                      ) : (
                        <User size={40} />
                      )}
                    </div>
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        style={{ display: 'none' }}
                      />
                      <button
                        type="button"
                        className="ue-primary-btn"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload size={16} /> Upload User Image
                      </button>
                    </div>
                  </div>

                  <div className="ue-form-group">
                    <label>Customer Full Name</label>
                    <input
                      type="text"
                      className="ue-text-input"
                      value={userProfile.name}
                      onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                    />
                  </div>
                  <div className="ue-form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      className="ue-text-input"
                      value={userProfile.email}
                      onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                    />
                  </div>
                  <div className="ue-form-group">
                    <label>Default Delivery Address (useState)</label>
                    <input
                      type="text"
                      className="ue-text-input"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                    />
                  </div>

                  <button
                    type="button"
                    className="ue-primary-btn full"
                    onClick={() => {
                      setActiveModal(null);
                      showToast('Profile settings saved!');
                    }}
                  >
                    Save Profile Settings
                  </button>
                </div>
              )}

              {activeModal === 'ratings' && (
                <div>
                  <div className="ue-rating-tabs">
                    <button
                      type="button"
                      className={ratingTargetType === 'shop' ? 'active' : ''}
                      onClick={() => setRatingTargetType('shop')}
                    >
                      🏪 Rate a Shop
                    </button>
                    <button
                      type="button"
                      className={ratingTargetType === 'rider' ? 'active' : ''}
                      onClick={() => setRatingTargetType('rider')}
                    >
                      🛵 Rate a Delivery Rider
                    </button>
                  </div>

                  <form onSubmit={handleSubmitRating} className="ue-rating-form">
                    {ratingTargetType === 'shop' ? (
                      <div className="ue-form-group">
                        <label>Select Store</label>
                        <select
                          className="ue-text-input"
                          value={selectedShopToRate}
                          onChange={(e) => setSelectedShopToRate(e.target.value)}
                        >
                          {stores.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} (★ {s.rating})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="ue-form-group">
                        <label>Select Rider</label>
                        <select
                          className="ue-text-input"
                          value={selectedRiderToRate}
                          onChange={(e) => setSelectedRiderToRate(e.target.value)}
                        >
                          {riders.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name} (★ {r.rating})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="ue-star-picker">
                      <span>Your Rating:</span>
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          type="button"
                          className={`ue-star-btn ${starValue >= num ? 'lit' : ''}`}
                          onClick={() => setStarValue(num)}
                        >
                          ★
                        </button>
                      ))}
                      <strong>{starValue} / 5</strong>
                    </div>

                    <div className="ue-form-group">
                      <label>Review Comment</label>
                      <input
                        type="text"
                        className="ue-text-input"
                        placeholder="Share your experience..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                      />
                    </div>

                    <button type="submit" className="ue-primary-btn full">
                      Submit Rating
                    </button>
                  </form>
                </div>
              )}

              {activeModal === 'help' && (
                <div className="ue-help-center">
                  <div className="ue-help-banner">
                    <ShieldCheck size={22} />
                    <div>
                      <strong>24/7 UniEats Help Center</strong>
                      <p>Active support for orders delivering to {deliveryAddress}</p>
                    </div>
                  </div>
                  <div className="ue-faq-list">
                    {helpCenterTopics.map((topic) => (
                      <details key={topic.id} className="ue-faq-item" open={topic.id === 'h1'}>
                        <summary>
                          <span className="ue-faq-cat">{topic.category}</span>
                          <strong>{topic.question}</strong>
                        </summary>
                        <p>{topic.answer}</p>
                      </details>
                    ))}
                  </div>
                </div>
              )}

              {activeModal === 'promotions' && (
                <div>
                  <div className="ue-form-group">
                    <label>Promo Code (50% Off Offer)</label>
                    <input
                      type="text"
                      className="ue-text-input"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    />
                  </div>
                  <button
                    type="button"
                    className="ue-primary-btn full"
                    onClick={() => {
                      setPromoDiscount(550);
                      setActiveModal(null);
                      showToast(`Promotion applied! Saving LKR 550.00.`);
                    }}
                  >
                    Apply Promotion
                  </button>
                </div>
              )}

              {activeModal === 'auth' && (
                <div>
                  <div className="ue-form-group">
                    <label>Your Name</label>
                    <input
                      type="text"
                      className="ue-text-input"
                      value={userProfile.name}
                      onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                    />
                  </div>
                  <button
                    type="button"
                    className="ue-primary-btn full"
                    onClick={() => {
                      setIsLoggedIn(true);
                      setActiveModal(null);
                      setPageView('storefront');
                    }}
                  >
                    Log In &amp; Continue
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          COMMON FOOTER
         ===================================================================== */}
      {pageView !== 'checkout-details' && (
        <footer className="ue-footer">
          <div className="ue-footer-inner">
            <div className="ue-footer-brand-col">
              <div className="ue-brand-logo">
                <span className="ue-brand-icon">
                  <Navigation size={14} />
                </span>
                <span className="ue-brand-text">uniride.</span>
              </div>
              <p className="ue-footer-tagline">
                UniEats Food &amp; Grocery Delivery · Delivering to{' '}
                <strong>{deliveryAddress}</strong>.
              </p>
              <div className="ue-footer-quick-pills">
                <button type="button" onClick={() => setActiveModal('profile')}>
                  <User size={13} /> Manage User Account
                </button>
                <button type="button" onClick={() => setActiveModal('help')}>
                  <HelpCircle size={13} /> Help Center Tab
                </button>
              </div>
            </div>

            <div className="ue-footer-col">
              <h4>Explore</h4>
              <ul>
                <li>
                  <button type="button" onClick={() => setPageView('storefront')}>
                    UniEats &amp; UniGroceries
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => setPageView('checkout-details')}>
                    Checkout &amp; Delivery Details
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => setPageView('payment-gateway')}>
                    Global Payment Gateway
                  </button>
                </li>
              </ul>
            </div>

            <div className="ue-footer-col">
              <h4>Customer Account</h4>
              <ul>
                <li>
                  <button type="button" onClick={() => setActiveModal('profile')}>
                    Manage User &amp; Upload Photo
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => setActiveModal('ratings')}>
                    Rate Shops &amp; Riders
                  </button>
                </li>
              </ul>
            </div>

            <div className="ue-footer-col">
              <h4>Support</h4>
              <ul>
                <li>
                  <button type="button" onClick={() => setActiveModal('help')}>
                    Help Center &amp; Live Support
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => setActiveModal('address-edit')}>
                    Change Delivery Area ({deliveryAddress})
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </footer>
      )}

      {/* =====================================================================
          MODAL: STORE PAPER RECEIPT PHOTO VIEWER
         ===================================================================== */}
      {viewingReceiptOrderId && (
        <ReceiptModal
          orderId={viewingReceiptOrderId}
          actor={currentActor}
          onClose={() => setViewingReceiptOrderId(null)}
        />
      )}

      {toastMsg && (
        <div className="ue-toast" role="status">
          <CheckCircle2 size={16} color="#40c057" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
