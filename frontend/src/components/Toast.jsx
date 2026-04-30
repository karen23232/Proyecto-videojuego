import { useState, useEffect } from 'preact/hooks';

export default function Toast({ message, type = 'success', duration = 4000 }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  if (!visible) return null;

  const bgColor = type === 'success' ? 'var(--green)' : type === 'error' ? 'var(--red)' : 'var(--yellow)';

  return (
    <div
      className="toast active"
      style={{
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        background: 'linear-gradient(135deg, var(--violet), #1a0840)',
        border: '1px solid rgba(220,214,196,0.15)',
        borderLeft: `3px solid ${bgColor}`,
        padding: '18px 24px',
        zIndex: 900,
        fontSize: '14px',
        color: 'var(--beige)',
        fontFamily: 'var(--font-body)',
        minWidth: '280px',
        animation: 'slideInRight 0.4s ease',
      }}
    >
      {message}
    </div>
  );
}

let toastCallback = null;

export function showToast(message, type = 'success') {
  if (toastCallback) {
    toastCallback({ message, type });
  }
}

export function ToastContainer({ onMount }) {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    toastCallback = (toast) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { ...toast, id }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };
    if (onMount) onMount(toastCallback);
  }, [onMount]);

  return (
    <>
      {toasts.map((toast) => (
        <Toast key={toast.id} message={toast.message} type={toast.type} />
      ))}
    </>
  );
}