import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import LocationSearch from '../components/LocationSearch';
import { Button, CardHeading, EmptyState, money, PageHeader } from '../components/UI';

const MEALS = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Anytime'];
const DEFAULT_DELIVERY = { address: 'South Eastern University of Sri Lanka, Oluvil', coordinates: [81.856875, 7.300617] };

export default function StorePage({ type = 'product' }) {
  const isFood = type === 'food';
  const navigate = useNavigate();
  const [catalogue, setCatalogue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meal, setMeal] = useState('All');
  const [category, setCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [deliveryAddress, setDeliveryAddress] = useState(DEFAULT_DELIVERY);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(100);
  useEffect(() => { api.get('/pricing').then(({ data }) => setDeliveryFee(Number(data.item.deliverySurcharge ?? 100))).catch(() => {}); }, []);
  useEffect(() => {
    setCart([]);
    setError('');
    setLoading(true);
    api.get(isFood ? '/catalog/food' : '/catalog/products').then(({ data }) => setCatalogue(isFood ? data.foods : data.products)).catch((err) => setError(getErrorMessage(err))).finally(() => setLoading(false));
  }, [isFood]);
  const categories = useMemo(() => ['All', ...new Set(catalogue.map((item) => item.category).filter(Boolean))], [catalogue]);
  const visibleItems = useMemo(() => catalogue.filter((item) => isFood ? meal === 'All' || item.meal === meal : category === 'All' || item.category === category), [catalogue, isFood, meal, category]);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + deliveryFee;
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const add = (item) => {
    setError('');
    if (cart.length && cart[0].shop !== item.shop) {
      setError(`Your cart contains items from ${cart[0].shop}. Place that order first to order from ${item.shop}.`);
      return;
    }
    const existing = cart.find((x) => x._id === item._id);
    setCart(existing ? cart.map((x) => x._id === item._id ? { ...x, quantity: Math.min(30, x.quantity + 1) } : x) : [...cart, { ...item, quantity: 1 }]);
  };
  const changeQty = (id, delta) => setCart((prev) => prev.map((item) => item._id === id ? { ...item, quantity: item.quantity + delta } : item).filter((item) => item.quantity > 0));
  const checkout = async () => {
    if (!cart.length) return;
    if (!deliveryAddress?.address) { setError('Choose a delivery address before placing the order.'); return; }
    setError(''); setBusy(true);
    try {
      const first = cart[0];
      const payload = {
        orderType: type,
        items: cart.map((item) => ({ itemId: item._id, name: item.name, image: item.image, shop: item.shop, price: item.price, quantity: item.quantity })),
        shop: first.shop,
        meal: isFood ? meal : '',
        deliveryAddress: deliveryAddress.address,
        deliveryCoordinates: deliveryAddress.coordinates,
        pickupAddress: first.pickupAddress || `${first.shop}, Oluvil`,
        pickupCoordinates: first.pickupCoordinates || [81.8592, 7.3021],
        paymentMethod: 'Cash on delivery'
      };
      const { data } = await api.post('/orders', payload);
      setCart([]);
      navigate('/rider/active', { state: { notice: data.message } });
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setBusy(false); }
  };
  return <>
    <PageHeader eyebrow={isFood ? 'UNIRIDE FOOD DELIVERY' : 'UNIRIDE PRODUCT DELIVERY'} title={isFood ? 'Order food' : 'Shop products'} subtitle={isFood ? 'Choose from campus meals, snacks and drinks, then have your order delivered.' : 'Browse useful products and have your order delivered to your location.'} action={<button className="cart-nav-button" onClick={() => setShowCart((x) => !x)}>Cart <span>{count}</span></button>}/>
    {isFood ? <div className="meal-tabs">{MEALS.map((item) => <button key={item} type="button" className={meal === item ? 'active' : ''} onClick={() => setMeal(item)}>{item}</button>)}</div> : <div className="category-tabs">{categories.map((item) => <button type="button" key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div>}
    {error && <div className="alert alert-error">{error}</div>}
    <div className="store-layout"><section className="store-main"><div className="store-grid">{loading ? <div className="loading-panel">Loading catalogue…</div> : visibleItems.map((item) => <article className="store-item-card" key={item._id}><div className="store-image-wrap"><img src={item.image} alt={item.name} loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none'; }}/>{isFood && <span className="food-meal-tag">{item.meal}</span>}</div><div className="store-item-content"><div className="store-item-meta">{isFood ? item.shop : item.category}</div><h3>{item.name}</h3><p>{item.description}</p><div className="store-item-bottom"><strong>{money(item.price)}</strong><button type="button" className="add-item-button" onClick={() => add(item)}>{cart.some((x) => x._id === item._id) ? 'Add more' : 'Add'}</button></div>{isFood && <small className="store-shop-label">From {item.shop}</small>}</div></article>)}</div>{!loading && !visibleItems.length && <EmptyState title="No items in this section" text="Try another category."/>}</section>
      <aside className={`cart-panel ${showCart ? 'cart-panel-mobile-open' : ''}`}><div className="cart-panel-heading"><div><strong>Your cart</strong><span>{count} {count === 1 ? 'item' : 'items'}</span></div><button type="button" className="cart-close-mobile" onClick={() => setShowCart(false)}>Close</button></div>
        {cart.length ? <><div className="cart-lines">{cart.map((item) => <div className="cart-line" key={item._id}><img src={item.image} alt=""/><div className="cart-line-main"><strong>{item.name}</strong><small>{money(item.price)} each</small><div className="quantity-stepper"><button type="button" onClick={() => changeQty(item._id, -1)}>Remove</button><span>{item.quantity}</span><button type="button" onClick={() => changeQty(item._id, 1)}>Add</button></div></div><strong>{money(item.price * item.quantity)}</strong></div>)}</div>
          <div className="cart-delivery"><LocationSearch label="Deliver to" value={deliveryAddress} onChange={setDeliveryAddress} placeholder="Search your delivery address"/></div>
          <div className="cart-total-line"><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div className="cart-total-line"><span>Delivery fee</span><strong>{money(deliveryFee)}</strong></div><div className="cart-total-line grand-total"><span>Total</span><strong>{money(total)}</strong></div><Button block className="checkout-button" onClick={checkout} disabled={busy}>{busy ? 'Placing order…' : 'Place order'}</Button><small className="cart-payment-note">Cash on delivery · Secure order</small>
        </> : <EmptyState title="Your cart is empty" text="Add an item to get started."/>}
      </aside>
    </div>
  </>;
}
