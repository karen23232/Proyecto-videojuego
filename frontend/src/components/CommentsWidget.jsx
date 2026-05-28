import { useEffect, useMemo, useState } from 'preact/hooks';
import { createComment, deleteComment, listComments, loadSession, updateComment } from '../lib/api';
import { showToast } from './Toast';

const initialComments = [
  {
    _id: 'seed-1',
    rating: 5,
    content: 'Nunca habia sentido tanta tension en un videojuego. Los ultimos 30 minutos me dejaron sin palabras. Aria es mi personaje favorito de todos los tiempos.',
    authorName: 'DarkVoid_99',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    userId: null,
  },
  {
    _id: 'seed-2',
    rating: 5,
    content: 'La narrativa es absolutamente brillante. Cada decision que tome me hizo repensar todo. Jogue 3 veces para ver todos los finales. Vale completamente la pena.',
    authorName: 'MindHunter_X',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    userId: null,
  },
  {
    _id: 'seed-3',
    rating: 4,
    content: 'Los graficos y la atmosfera son increibles. Ethan es un personaje muy bien construido. Espero con ansias el proximo capitulo.',
    authorName: 'ShadowMind',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    userId: null,
  },
];

function Stars({ rating, size = 15 }) {
  return (
    <div className="comment-stars" aria-label={`${rating} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={`comment-star ${n <= rating ? 'filled' : 'empty'}`} style={{ fontSize: size }}>★</span>
      ))}
    </div>
  );
}

function initials(name) {
  const parts = String(name || '').trim().split(' ').filter(Boolean);
  if (!parts.length) return 'RM';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

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

function SkeletonCards() {
  return (
    <div className="comments-loading">
      {[140, 100, 120].map((h, i) => (
        <div className="skeleton-card" key={i}>
          <div className="skeleton-line" style={{ height: 14, width: '40%' }} />
          <div className="skeleton-line" style={{ height: h }} />
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div className="skeleton-line" style={{ height: 38, width: 38, borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="skeleton-line" style={{ height: 12, width: '55%' }} />
              <div className="skeleton-line" style={{ height: 10, width: '30%' }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CommentsWidget() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [session, setSession] = useState(null);
  const [form, setForm] = useState({ authorName: '', rating: 5, content: '' });
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    const s = loadSession();
    setSession(s);
    if (s?.user?.username) setForm((p) => ({ ...p, authorName: s.user.username }));
  }, []);

  useEffect(() => {
    listComments({ limit: 9 })
      .then((data) => {
        setComments(data.comments?.length ? data.comments : initialComments);
        setCursor(data.pageInfo?.nextCursor ?? null);
        setHasMore(Boolean(data.pageInfo?.hasMore));
      })
      .catch(() => setComments(initialComments))
      .finally(() => setLoading(false));
  }, []);

  const average = useMemo(() => {
    if (!comments.length) return '—';
    const total = comments.reduce((acc, c) => acc + Number(c.rating || 0), 0);
    return (total / comments.length).toFixed(1);
  }, [comments]);

  const averageStars = useMemo(() => Math.round(Number(average)), [average]);

  const canManage = (c) =>
    Boolean(session?.user?.id && c.userId && String(c.userId) === String(session.user.id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session) { showToast('Inicia sesión para comentar', 'info'); return; }
    setSubmitting(true);
    try {
      const data = await createComment(form);
      setComments((p) => [data.comment, ...p]);
      setForm((p) => ({ ...p, content: '', rating: 5 }));
      showToast('Comentario publicado', 'success');
    } catch (err) {
      showToast(err.message || 'No se pudo publicar', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoadMore = async () => {
    if (!hasMore || !cursor) return;
    try {
      const data = await listComments({ cursor, limit: 9 });
      setComments((p) => [...p, ...data.comments]);
      setCursor(data.pageInfo?.nextCursor ?? null);
      setHasMore(Boolean(data.pageInfo?.hasMore));
    } catch (err) {
      showToast(err.message || 'Error al cargar', 'error');
    }
  };

  const startEdit = (c) => { setEditingId(c._id); setEditContent(c.content); };
  const cancelEdit = () => { setEditingId(null); setEditContent(''); };

  const saveEdit = async (id) => {
    try {
      const data = await updateComment(id, { content: editContent });
      setComments((p) => p.map((c) => (c._id === id ? data.comment : c)));
      cancelEdit();
      showToast('Comentario actualizado', 'success');
    } catch (err) {
      showToast(err.message || 'No se pudo actualizar', 'error');
    }
  };

  const removeComment = async (id) => {
    if (!confirm('¿Eliminar este comentario?')) return;
    try {
      await deleteComment(id);
      setComments((p) => p.filter((c) => c._id !== id));
      showToast('Comentario eliminado', 'info');
    } catch (err) {
      showToast(err.message || 'No se pudo eliminar', 'error');
    }
  };

  return (
    <>
      {/* ── Header ── */}
      <div className="comments-header">
        <div>
          <p className="section-label">Comunidad</p>
          <h2 className="section-title">
            Lo que dicen los <span style={{ color: 'var(--yellow)' }}>Jugadores</span>
          </h2>
        </div>
        {!loading && (
          <div className="comments-rating-badge">
            <div className="comments-rating-stars">
              {[1,2,3,4,5].map((n) => (
                <span key={n} style={{ color: n <= averageStars ? 'var(--yellow)' : 'rgba(220,214,196,0.2)' }}>★</span>
              ))}
            </div>
            <div className="comments-rating-number">{average}</div>
            <div className="comments-rating-label">{comments.length} reseñas</div>
          </div>
        )}
      </div>

      {/* ── Cards ── */}
      {loading ? (
        <SkeletonCards />
      ) : (
        <div className="comments-grid">
          {comments.map((c) => (
            <article className={`comment-card rating-${c.rating}`} key={c._id}>
              <Stars rating={Number(c.rating || 0)} />

              {editingId === c._id ? (
                <textarea
                  className="comment-edit-input"
                  value={editContent}
                  onInput={(e) => setEditContent(e.target.value)}
                  maxLength={1000}
                />
              ) : (
                <p className="comment-text">"{c.content}"</p>
              )}

              <div className="comment-footer">
                <div className="comment-author">
                  <div className="comment-avatar" aria-hidden="true">{initials(c.authorName)}</div>
                  <div>
                    <div className="comment-author-name">{c.authorName}</div>
                    <div className="comment-author-date">{formatDate(c.createdAt)}</div>
                  </div>
                </div>

                {canManage(c) && (
                  <div className="comment-actions">
                    {editingId === c._id ? (
                      <>
                        <button className="comment-btn" onClick={() => saveEdit(c._id)}>Guardar</button>
                        <button className="comment-btn" onClick={cancelEdit}>Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button className="comment-btn" onClick={() => startEdit(c)}>Editar</button>
                        <button className="comment-btn danger" onClick={() => removeComment(c._id)}>Borrar</button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ── Load more ── */}
      {hasMore && (
        <div className="comments-load-more">
          <button className="btn btn-outline" onClick={handleLoadMore}>
            Cargar más reseñas
          </button>
        </div>
      )}

      {/* ── Form ── */}
      <form className="comment-form" onSubmit={handleSubmit}>
        <div className="form-title">Deja tu Reseña</div>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="commentName">Nombre / Usuario</label>
            <input
              id="commentName"
              type="text"
              placeholder="MindHunter_X"
              value={form.authorName}
              onInput={(e) => setForm((p) => ({ ...p, authorName: e.target.value }))}
              maxLength={40}
              required
            />
          </div>
          <div className="form-group">
            <span className="form-label">Calificación</span>
            <div className="star-rating" role="group" aria-label="Selecciona una calificación">
              {[1,2,3,4,5].map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`star-btn${form.rating >= v ? ' active' : ''}`}
                  onClick={() => setForm((p) => ({ ...p, rating: v }))}
                  aria-label={`${v} estrella${v > 1 ? 's' : ''}`}
                >★</button>
              ))}
            </div>
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label htmlFor="commentText">Tu Experiencia</label>
          <textarea
            id="commentText"
            placeholder="Cuéntanos qué te pareció Recessed Minds..."
            value={form.content}
            onInput={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
            maxLength={1000}
            required
          />
        </div>

        {session ? (
          <button type="submit" className="form-submit" disabled={submitting}>
            {submitting ? 'Publicando...' : 'Publicar Reseña'}
          </button>
        ) : (
          <p className="auth-prompt">
            <button type="button" data-auth="login">Inicia sesión</button>
            {' '}o{' '}
            <button type="button" data-auth="register">regístrate</button>
            {' '}para publicar tu reseña.
          </p>
        )}
      </form>
    </>
  );
}
