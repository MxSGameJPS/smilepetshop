// utilitário simples para gerenciar usuário autenticado no localStorage
const STORAGE_KEY = "smilepet_user";

export function setUser(user) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch (e) {
    console.warn("Falha ao salvar usuário no localStorage", e);
  }
}

export function getUser() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}

export function clearUser() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

// helper to broadcast an update so components (Header) can react immediately
export function broadcastUserUpdate(detail) {
  try {
    window.dispatchEvent(new CustomEvent("smilepet_user_update", { detail }));
  } catch {
    // ignore
  }
}

export default { setUser, getUser, clearUser, broadcastUserUpdate };
