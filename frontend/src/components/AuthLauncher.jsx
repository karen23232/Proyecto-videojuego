import { useEffect, useRef, useState } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import ModalAuth from './ModalAuth';
import { ToastContainer, showToast } from './Toast';
import { loadSession, logout, logoutRequest } from '../lib/api';

function initials(name) {
  const parts = String(name || '').trim().split(' ').filter(Boolean);
  if (!parts.length) return 'RM';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default function AuthLauncher({ showTrigger = true }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('login');
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(() => {
    try { return loadSession()?.user ?? null; } catch { return null; }
  });
  const badgeRef = useRef(null);

  useEffect(() => {
    const onDocClick = (event) => {
      // Cerrar dropdown si click fuera del badge
      if (menuOpen && badgeRef.current && !badgeRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
      // Abrir modal de auth por data-auth
      const trigger = event.target.closest('[data-auth]');
      if (!trigger) return;
      event.preventDefault();
      const nextMode = trigger.getAttribute('data-auth') || 'login';
      setMode(nextMode);
      setOpen(true);
    };

    window.addEventListener('click', onDocClick);
    return () => window.removeEventListener('click', onDocClick);
  }, [menuOpen]);

  const handleLogin = (nextUser) => {
    setUser(nextUser);
    showToast(`Bienvenido, ${nextUser.username || 'jugador'}!`, 'success');
    window.location.href = '/dashboard';
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    try { await logoutRequest(); } catch (_) {}
    logout();
    setUser(null);
    showToast('Sesión cerrada', 'info');
  };

  return (
    <>
      {showTrigger && (user ? (
        <div className="nav-user-badge" ref={badgeRef}>
          <button
            className="nav-user-trigger"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-haspopup="true"
          >
            <span className="nav-user-avatar">{initials(user.username)}</span>
            <span className="nav-user-name">{user.username}</span>
            <span className={`nav-user-chevron ${menuOpen ? 'open' : ''}`}>▾</span>
          </button>

          {menuOpen && (
            <div className="nav-dropdown">
              <div className="nav-dropdown-header">
                <span className="nav-dropdown-username">{user.username}</span>
                <span className="nav-dropdown-email">{user.email}</span>
              </div>
              <div className="nav-dropdown-divider" />
              <a href="/dashboard" className="nav-dropdown-item" onClick={() => setMenuOpen(false)}>
                <span className="nav-dropdown-icon">◈</span>
                Dashboard
              </a>
              <a href="/#comunidad" className="nav-dropdown-item" onClick={() => setMenuOpen(false)}>
                <span className="nav-dropdown-icon">✦</span>
                Publicar reseña
              </a>
              <div className="nav-dropdown-divider" />
              <button className="nav-dropdown-item nav-dropdown-item--danger" onClick={handleLogout}>
                <span className="nav-dropdown-icon">⏻</span>
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          <button className="btn btn-red" data-auth="register">
            Registrarse
          </button>
          <button className="btn btn-outline" data-auth="login">
            Iniciar sesión
          </button>
        </>
      ))}
      {createPortal(
        <>
          <ModalAuth
            isOpen={open}
            onClose={() => setOpen(false)}
            onLogin={handleLogin}
            initialTab={mode}
          />
          <ToastContainer />
        </>,
        document.body
      )}
    </>
  );
}
