import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'sellerpick_cart_v1';

function readCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeCart(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('cart-updated'));
  } catch {
    // ignore
  }
}

function makeKey({ productId, option, color, size }) {
  return [productId, option || '', color || '', size || ''].join('||');
}

export default function useCart() {
  const [items, setItems] = useState(readCart);

  useEffect(() => {
    const sync = () => setItems(readCart());
    window.addEventListener('cart-updated', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('cart-updated', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const addItem = useCallback((entry) => {
    const items = readCart();
    const key = makeKey(entry);
    const existing = items.find((it) => makeKey(it) === key);
    let next;
    if (existing) {
      next = items.map((it) =>
        makeKey(it) === key ? { ...it, qty: it.qty + (entry.qty || 1) } : it
      );
    } else {
      next = [...items, { ...entry, qty: entry.qty || 1, addedAt: Date.now() }];
    }
    writeCart(next);
    setItems(next);
  }, []);

  const updateQty = useCallback((key, qty) => {
    const items = readCart();
    const next = qty <= 0
      ? items.filter((it) => makeKey(it) !== key)
      : items.map((it) => (makeKey(it) === key ? { ...it, qty } : it));
    writeCart(next);
    setItems(next);
  }, []);

  const removeItem = useCallback((key) => {
    const items = readCart();
    const next = items.filter((it) => makeKey(it) !== key);
    writeCart(next);
    setItems(next);
  }, []);

  const clearCart = useCallback(() => {
    writeCart([]);
    setItems([]);
  }, []);

  const totalCount = items.reduce((s, it) => s + (it.qty || 1), 0);
  const totalPrice = items.reduce((s, it) => s + (it.price || 0) * (it.qty || 1), 0);

  return { items, addItem, updateQty, removeItem, clearCart, totalCount, totalPrice, makeKey };
}
