import { useState, useEffect } from 'preact/hooks';
import { loadSession, logout, logoutRequest, fetchWithAuth, listComments, updateComment, deleteComment } from '../lib/api';

function formatDate(value) {
  const ms = Date.now() - new Date(value).getTime();
  const day = 86400000;
  const days = Math.floor(ms / day);
  if (days <= 0) return 'Hoy';
  if (days === 1) return 'Hace 1 día';
  if (days < 7) return `Hace ${days} días`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return 'Hace 1 semana';
  if (weeks < 5) return `Hace ${weeks} semanas`;
  const months = Math.floor(days / 30);
  return months === 1 ? 'Hace 1 mes' : `Hace ${months} meses`;
}

function Stars({ rating, size = 13 }) {
  return (
    <span class="db-stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} class={`db-star ${n <= rating ? 'filled' : 'empty'}`} style={{ fontSize: size }}>★</span>
      ))}
    </span>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div class="db-stat-card" style={{ '--stat-accent': accent }}>
      <div class="db-stat-value">{value}</div>
      <div class="db-stat-label">{label}</div>
    </div>
  );
}

function CommentCard({ c, editingId, editContent, setEditContent, onEdit, onSave, onCancel, onDelete }) {
  const isEditing = editingId === c._id;
  return (
    <article class={`db-comment-card rating-${c.rating}`}>
      <div class="db-comment-header">
        <Stars rating={Number(c.rating || 0)} />
        <span class="db-comment-date">{formatDate(c.createdAt)}</span>
      </div>
      {isEditing ? (
        <>
          <textarea
            class="db-edit-textarea"
            value={editContent}
            onInput={(e) => setEditContent(e.target.value)}
            maxLength={1000}
          />
          <div class="db-comment-actions">
            <button class="db-action-btn" onClick={() => onSave(c._id)}>Guardar</button>
            <button class="db-action-btn" onClick={onCancel}>Cancelar</button>
          </div>
        </>
      ) : (
        <>
          <p class="db-comment-text">"{c.content}"</p>
          <div class="db-comment-actions">
            <button class="db-action-btn" onClick={() => onEdit(c)}>Editar</button>
            <button class="db-action-btn db-action-btn--danger" onClick={() => onDelete(c._id)}>Eliminar</button>
          </div>
        </>
      )}
    </article>
  );
}

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    const session = loadSession();
    if (!session?.user) {
      window.location.href = '/';
      return;
    }
    setUser(session.user);
    fetchWithAuth('/api/v1/auth/me')
      .then(() => listComments({ limit: 50 }))
      .then((data) => {
        const mine = (data.comments || []).filter((c) => c.userId === session.user.id);
        setComments(mine);
      })
      .catch(() => {
        logout();
        window.location.href = '/';
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    try { await logoutRequest(); } catch (_) {}
    logout();
    window.location.href = '/';
  };

  const startEdit = (comment) => { setEditingId(comment._id); setEditContent(comment.content); };
  const cancelEdit = () => { setEditingId(null); setEditContent(''); };

  const saveEdit = async (id) => {
    try {
      const { comment } = await updateComment(id, { content: editContent });
      setComments((prev) => prev.map((c) => (c._id === id ? comment : c)));
      cancelEdit();
    } catch (err) { alert(err.message); }
  };

  const removeComment = async (id) => {
    if (!confirm('¿Eliminar este comentario?')) return;
    try {
      await deleteComment(id);
      setComments((prev) => prev.filter((c) => c._id !== id));
    } catch (err) { alert(err.message); }
  };

  const avgRating = comments.length
    ? (comments.reduce((s, c) => s + Number(c.rating), 0) / comments.length).toFixed(1)
    : '—';
  const fiveStarCount = comments.filter((c) => Number(c.rating) === 5).length;

  if (loading) {
    return (
      <div class="db-loading">
        <div class="db-loading-inner">
          <div class="db-loading-bar" />
          <span class="db-loading-text">CARGANDO EXPEDIENTE...</span>
        </div>
      </div>
    );
  }

  return (
    <div class="db-root">
      <div class="db-scanlines" aria-hidden="true" />

      <nav class="db-nav">
        <a href="/" class="db-nav-brand">
          <img src="/images/Logo.png" alt="Recessed Minds" class="db-nav-logo" />
        </a>
        <span class="db-nav-title" data-text="ARCHIVO MENTAL">ARCHIVO MENTAL</span>
        <div class="db-nav-user">
          <div class="db-nav-userinfo">
            <span class="db-nav-username">{user?.username}</span>
            <span class="db-nav-status">◉ ACTIVO</span>
          </div>
          <button class="db-logout-btn" onClick={handleLogout}>SALIR</button>
        </div>
      </nav>

      <div class="db-content">
        <section class="db-greeting">
          <p class="db-greeting-label">EXPEDIENTE — ACCESO CONCEDIDO</p>
          <h1 class="db-greeting-title">
            BIENVENIDO,{' '}
            <span class="db-greeting-name">{user?.username?.toUpperCase()}</span>
          </h1>
          <p class="db-greeting-sub">
            {user?.email} · Paciente activo del Instituto Olvidado
          </p>
        </section>

        <div class="db-stats-grid">
          <StatCard label="RESEÑAS PUBLICADAS" value={comments.length} accent="var(--red)" />
          <StatCard label="CALIFICACIÓN MEDIA" value={avgRating} accent="var(--yellow)" />
          <StatCard label="PUNTUACIÓN MÁXIMA" value={fiveStarCount} accent="var(--green)" />
          <StatCard label="ESTADO" value="ACTIVO" accent="var(--violet-mid)" />
        </div>

        <div class="db-layout">
          <main class="db-main">
            <h2 class="db-section-title">MIS REGISTROS</h2>

            {comments.length === 0 ? (
              <div class="db-empty">
                <p>No has publicado ningún registro aún.</p>
                <a href="/#comunidad" class="db-empty-link">Ir a la sección de reseñas →</a>
              </div>
            ) : (
              comments.map((c) => (
                <CommentCard
                  key={c._id}
                  c={c}
                  editingId={editingId}
                  editContent={editContent}
                  setEditContent={setEditContent}
                  onEdit={startEdit}
                  onSave={saveEdit}
                  onCancel={cancelEdit}
                  onDelete={removeComment}
                />
              ))
            )}
          </main>

          <aside class="db-side-panel">
            <div class="db-panel-block">
              <h3 class="db-section-title">TRANSMISIÓN ACTIVA</h3>
              <p class="db-lore-text">
                "El Instituto Olvidado guarda secretos que la mente racional se niega a procesar.
                Aria y Ethan avanzan por sus pasillos, cada decisión moldeando la realidad de
                un lugar donde la cordura es el precio de la verdad."
              </p>
              <p class="db-lore-sub">— Expediente de investigación, Nivel 3</p>
            </div>

            <div class="db-panel-block">
              <h3 class="db-section-title">ACTIVIDAD RECIENTE</h3>
              {comments.length === 0 ? (
                <p class="db-activity-empty">Sin registros recientes.</p>
              ) : (
                <div class="db-activity-list">
                  {comments.slice(0, 4).map((c) => (
                    <div key={c._id} class="db-activity-item">
                      <div class="db-activity-meta">
                        <Stars rating={Number(c.rating)} size={11} />
                        <span class="db-activity-date">{formatDate(c.createdAt)}</span>
                      </div>
                      <p class="db-activity-excerpt">
                        {c.content.length > 80 ? c.content.slice(0, 80) + '…' : c.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      <div class="db-bottom-bar">
        <div class="db-sanity-wrap">
          <span class="db-sanity-label">ESTABILIDAD MENTAL</span>
          <div class="db-sanity-track">
            <div class="db-sanity-fill" />
          </div>
        </div>
        <a href="/" class="db-back-link">← VOLVER AL INSTITUTO</a>
      </div>
    </div>
  );
}
