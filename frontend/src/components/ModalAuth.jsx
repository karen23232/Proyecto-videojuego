import { useState, useEffect } from 'preact/hooks';
import { login, register, saveSession, loadSession, logout } from '../lib/api';

const logoSrc = "/images/Logo.png";

export default function ModalAuth({ isOpen, onClose, onLogin, initialTab = 'login' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(loginData.email, loginData.password);
      saveSession(data.accessToken || data.token, data.user);
      onLogin && onLogin(data.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await register(
        registerData.username,
        registerData.email,
        registerData.password,
        registerData.confirmPassword
      );
      saveSession(data.accessToken || data.token, data.user);
      onLogin && onLogin(data.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    overlay: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(7,7,7,0.92)',
      zIndex: 800,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      backdropFilter: 'blur(8px)',
      padding: '16px 12px',
      overflowY: 'auto',
    },
    modal: {
      background: 'linear-gradient(135deg, #0e0418 0%, #070714 50%, #070710 100%)',
      border: '1px solid rgba(220,214,196,0.12)',
      width: '460px',
      maxWidth: '100%',
      position: 'relative',
      padding: '20px 20px 16px',
      animation: 'modalIn 0.4s cubic-bezier(0.4,0,0.2,1)',
      margin: 'auto',
    },
    closeBtn: {
      position: 'absolute',
      top: '10px',
      right: '10px',
      background: 'none',
      border: 'none',
      color: 'var(--beige-dim)',
      fontSize: '28px',
      lineHeight: 1,
      padding: '2px 6px',
      cursor: 'pointer',
      fontFamily: 'var(--font-body)',
      zIndex: 2,
    },
    logo: {
      width: '100px',
      display: 'block',
      margin: '0 auto 12px',
    },
    tabs: {
      display: 'flex',
      marginBottom: '14px',
      borderBottom: '1px solid rgba(220,214,196,0.1)',
    },
    tab: (active) => ({
      flex: 1,
      padding: '10px',
      textAlign: 'center',
      fontFamily: 'var(--font-display)',
      fontSize: '11px',
      letterSpacing: '3px',
      textTransform: 'uppercase',
      color: active ? 'var(--beige)' : 'var(--beige-dim)',
      cursor: 'pointer',
      borderBottom: active ? '2px solid var(--red)' : '2px solid transparent',
      marginBottom: '-1px',
      background: 'none',
    }),
    form: {
      display: activeTab === 'login' ? 'block' : 'none',
    },
    formGroup: {
      marginBottom: '8px',
    },
    label: {
      display: 'block',
      fontSize: '10px',
      letterSpacing: '2px',
      textTransform: 'uppercase',
      color: 'var(--beige-dim)',
      fontFamily: 'var(--font-display)',
      marginBottom: '5px',
    },
    input: {
      width: '100%',
      background: 'rgba(46,16,101,0.2)',
      border: '1px solid rgba(220,214,196,0.12)',
      color: 'var(--beige)',
      padding: '10px 14px',
      minHeight: '42px',
      fontFamily: 'var(--font-body)',
      fontSize: '15px',
      outline: 'none',
    },
    btn: {
      width: '100%',
      padding: '12px',
      marginTop: '6px',
      fontSize: '12px',
      background: 'var(--red)',
      color: 'var(--beige)',
      border: 'none',
      cursor: 'pointer',
      fontFamily: 'var(--font-display)',
      letterSpacing: '2px',
      textTransform: 'uppercase',
    },
    error: {
      color: '#ff4448',
      fontSize: '12px',
      marginTop: '3px',
      minHeight: '16px',
      fontFamily: 'var(--font-body)',
    },
    footer: {
      textAlign: 'center',
      marginTop: '10px',
      fontSize: '13px',
      color: 'var(--beige-dim)',
    },
    link: {
      color: 'var(--red)',
      cursor: 'pointer',
    },
  };

  return (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        <button style={styles.closeBtn} onClick={onClose}>✕</button>
        <img src={logoSrc} alt="Recessed Minds" style={styles.logo} />
        
        <div style={styles.tabs}>
          <button style={styles.tab(activeTab === 'login')} onClick={() => setActiveTab('login')}>
            Iniciar Sesión
          </button>
          <button style={styles.tab(activeTab === 'register')} onClick={() => setActiveTab('register')}>
            Registrarse
          </button>
        </div>

        {activeTab === 'login' && (
          <form style={styles.form} onSubmit={handleLogin}>
            <div style={styles.formGroup}>
              <label htmlFor="loginEmail" style={styles.label}>Correo Electrónico</label>
              <input
                id="loginEmail"
                type="email"
                style={styles.input}
                placeholder="tu@correo.com"
                value={loginData.email}
                onInput={(e) => setLoginData({ ...loginData, email: e.target.value })}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="loginPassword" style={styles.label}>Contraseña</label>
              <input
                id="loginPassword"
                type="password"
                style={styles.input}
                placeholder="••••••••"
                value={loginData.password}
                onInput={(e) => setLoginData({ ...loginData, password: e.target.value })}
                required
              />
            </div>
            <div style={styles.error}>{error}</div>
            <button type="submit" style={styles.btn} disabled={loading}>
              {loading ? 'VERIFICANDO...' : 'ENTRAR AL JUEGO'}
            </button>
            <div style={styles.footer}>
              <span>¿Olvidaste tu contraseña?</span>
            </div>
          </form>
        )}

        {activeTab === 'register' && (
          <form style={{ ...styles.form, display: 'block' }} onSubmit={handleRegister}>
            <div style={styles.formGroup}>
              <label htmlFor="registerUsername" style={styles.label}>Usuario / Nickname</label>
              <input
                id="registerUsername"
                type="text"
                style={styles.input}
                placeholder="MindHunter"
                maxLength="20"
                value={registerData.username}
                onInput={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="registerEmail" style={styles.label}>Correo Electrónico</label>
              <input
                id="registerEmail"
                type="email"
                style={styles.input}
                placeholder="tu@correo.com"
                value={registerData.email}
                onInput={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="registerPassword" style={styles.label}>Contraseña</label>
              <input
                id="registerPassword"
                type="password"
                style={styles.input}
                placeholder="Mínimo 6 caracteres"
                value={registerData.password}
                onInput={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="registerConfirmPassword" style={styles.label}>Confirmar Contraseña</label>
              <input
                id="registerConfirmPassword"
                type="password"
                style={styles.input}
                placeholder="Repite la contraseña"
                value={registerData.confirmPassword}
                onInput={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                required
              />
            </div>
            <div style={styles.error}>{error}</div>
            <button type="submit" style={styles.btn} disabled={loading}>
              {loading ? 'CREANDO CUENTA...' : 'CREAR CUENTA'}
            </button>
            <div style={styles.footer}>
              ¿Ya tienes cuenta? <span style={styles.link} onClick={() => setActiveTab('login')}>Inicia sesión</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
