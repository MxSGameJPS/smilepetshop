const CART_KEY = "smilepet_cart";

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getCart() {
  const raw = localStorage.getItem(CART_KEY);
  return safeParse(raw);
}

export function saveCart(cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart || []));
  } catch {
    /* ignore */
  }
}

export function getCartCount() {
  const cart = getCart();
  return cart.reduce((sum, it) => sum + (Number(it.quantidade) || 0), 0);
}

// item: { id, nome, variante, quantidade, precoUnit, imagem_url }
export function addToCart(item) {
  if (!item || !item.id) return getCartCount();
  const cart = getCart();
  const keyId = String(item.id);
  const varianteKey = item.variante != null ? String(item.variante) : "";
  const existing = cart.find(
    (it) => String(it.id) === keyId && String(it.variante || "") === varianteKey
  );
  if (existing) {
    existing.quantidade =
      (Number(existing.quantidade) || 0) + (Number(item.quantidade) || 0);
  } else {
    cart.push({
      id: keyId,
      nome: item.nome || "",
      variante: varianteKey,
      quantidade: Number(item.quantidade) || 0,
      precoUnit: item.precoUnit != null ? Number(item.precoUnit) : null,
      imagem_url: item.imagem_url || null,
    });
  }
  saveCart(cart);
  const count = getCartCount();
  try {
    window.dispatchEvent(
      new CustomEvent("smilepet_cart_update", { detail: { count } })
    );
  } catch {
    /* ignore */
  }
  return count;
}

export function updateCartItemQuantity(itemId, variante, quantidade) {
  const cart = getCart();
  const keyId = String(itemId);
  const varianteKey = variante != null ? String(variante) : "";
  const idx = cart.findIndex(
    (it) => String(it.id) === keyId && String(it.variante || "") === varianteKey
  );
  if (idx === -1) return getCartCount();
  if (!quantidade || Number(quantidade) <= 0) {
    cart.splice(idx, 1);
  } else {
    cart[idx].quantidade = Number(quantidade);
  }
  saveCart(cart);
  const count = getCartCount();
  try {
    window.dispatchEvent(
      new CustomEvent("smilepet_cart_update", { detail: { count } })
    );
  } catch {
    /* ignore */
  }
  return count;
}

export function removeCartItem(itemId, variante) {
  const cart = getCart();
  const keyId = String(itemId);
  const varianteKey = variante != null ? String(variante) : "";
  const idx = cart.findIndex(
    (it) => String(it.id) === keyId && String(it.variante || "") === varianteKey
  );
  if (idx === -1) return getCartCount();
  cart.splice(idx, 1);
  saveCart(cart);
  const count = getCartCount();
  try {
    window.dispatchEvent(
      new CustomEvent("smilepet_cart_update", { detail: { count } })
    );
  } catch {
    /* ignore */
  }
  return count;
}

export function clearCart() {
  saveCart([]);
  try {
    window.dispatchEvent(
      new CustomEvent("smilepet_cart_update", { detail: { count: 0 } })
    );
  } catch {}
}

export default {
  getCart,
  saveCart,
  addToCart,
  getCartCount,
  clearCart,
};
