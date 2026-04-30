import { useEffect, useState } from 'preact/hooks';
import ModalAuth from './ModalAuth';
import { ToastContainer, showToast } from './Toast';
import { loadSession, logout } from '../lib/api';

export default function AuthLauncher({ showTrigger = true }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('login');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const session = loadSession();
    if (session?.user) setUser(session.user);

    const onClick = (event) => {
      const trigger = event.target.closest('[data-auth]');
      if (!trigger) return;
      event.preventDefault();
      const nextMode = trigger.getAttribute('data-auth') || 'login';
      setMode(nextMode);
      setOpen(true);
    };

    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, []);

  const handleLogin = (nextUser) => {
    setUser(nextUser);
    showToast(`Bienvenido, ${nextUser.username || 'jugador'}!`, 'success');
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    showToast('Sesion cerrada', 'info');
  };

  return (
    <>
      {showTrigger && (user ? (
        <button className="btn btn-outline" onClick={handleLogout}>
          Cerrar sesion
        </button>
      ) : (
        <>
          <button className="btn btn-red" data-auth="register">
            Registrarse
          </button>
          <button className="btn btn-outline" data-auth="login">
            Iniciar sesion
          </button>
        </>
      ))}
      <ModalAuth
        isOpen={open}
        onClose={() => setOpen(false)}
        onLogin={handleLogin}
        initialTab={mode}
      />
      <ToastContainer />
    </>
  );
}
