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

function starsFromRating(rating) {
  return `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}`;
}

function initials(name) {
  const parts = String(name || '').trim().split(' ').filter(Boolean);
  if (!parts.length) return 'RM';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function formatRelativeDate(value) {
  const ms = Date.now() - new Date(value).getTime();
  const day = 24 * 60 * 60 * 1000;
  const days = Math.floor(ms / day);
  if (days <= 0) return 'Hoy';
  if (days === 1) return 'Hace 1 dia';
  if (days < 7) return `Hace ${days} dias`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return 'Hace 1 semana';
  return `Hace ${weeks} semanas`;
}

export default function CommentsWidget() {
  const [comments, setComments] = useState(initialComments);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [session, setSession] = useState(null);
  const [form, setForm] = useState({ authorName: '', rating: 5, content: '' });
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    const currentSession = loadSession();
    setSession(currentSession);
    if (currentSession?.user?.username) {
      setForm((prev) => ({ ...prev, authorName: currentSession.user.username }));
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await listComments({ limit: 10 });
        setComments((data.comments && data.comments.length ? data.comments : initialComments));
        setCursor(data.pageInfo?.nextCursor || null);
        setHasMore(Boolean(data.pageInfo?.hasMore));
      } catch (error) {
        showToast(error.message || 'No se pudieron cargar comentarios', 'error');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const average = useMemo(() => {
    if (!comments.length) return '0.0';
    const total = comments.reduce((acc, item) => acc + Number(item.rating || 0), 0);
    return (total / comments.length).toFixed(1);
  }, [comments]);

  const canManage = (comment) => {
    return Boolean(session?.user?.id && comment.userId && String(comment.userId) === String(session.user.id));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const data = await createComment(form);
      setComments((prev) => [data.comment, ...prev]);
      setForm((prev) => ({ ...prev, content: '', rating: 5 }));
      showToast('Comentario publicado', 'success');
    } catch (error) {
      showToast(error.message || 'No se pudo publicar', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoadMore = async () => {
    if (!hasMore || !cursor) return;
    try {
      const data = await listComments({ cursor, limit: 10 });
      setComments((prev) => [...prev, ...data.comments]);
      setCursor(data.pageInfo?.nextCursor || null);
      setHasMore(Boolean(data.pageInfo?.hasMore));
    } catch (error) {
      showToast(error.message || 'No se pudieron cargar mas comentarios', 'error');
    }
  };

  const startEdit = (comment) => {
    setEditingId(comment._id);
    setEditContent(comment.content);
  };

  const saveEdit = async (commentId) => {
    try {
      const data = await updateComment(commentId, { content: editContent });
      setComments((prev) => prev.map((item) => (item._id === commentId ? data.comment : item)));
      setEditingId(null);
      setEditContent('');
      showToast('Comentario actualizado', 'success');
    } catch (error) {
      showToast(error.message || 'No se pudo actualizar', 'error');
    }
  };

  const removeComment = async (commentId) => {
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((item) => item._id !== commentId));
      showToast('Comentario eliminado', 'info');
    } catch (error) {
      showToast(error.message || 'No se pudo eliminar', 'error');
    }
  };

  return (
    <>
      <div className="comments-header">
        <div>
          <p className="section-label">Comunidad</p>
          <h2 className="section-title">Lo que dicen los <span style={{ color: 'var(--yellow)' }}>Jugadores</span></h2>
        </div>
        <div className="badge badge-green"><span className="badge-dot"></span> {average} / 5 promedio</div>
      </div>

      <div className="comments-grid">
        {comments.map((comment) => (
          <div className="comment-card" key={comment._id}>
            <div className="comment-stars">{starsFromRating(Number(comment.rating || 0))}</div>
            {editingId === comment._id ? (
              <textarea
                className="comment-edit-input"
                value={editContent}
                onInput={(event) => setEditContent(event.target.value)}
              />
            ) : (
              <p className="comment-text">{comment.content}</p>
            )}
            <div className="comment-author">
              <div className="comment-avatar">{initials(comment.authorName)}</div>
              <div className="comment-author-info">
                <div className="name">{comment.authorName}</div>
                <div className="date">{formatRelativeDate(comment.createdAt)}</div>
              </div>
            </div>
            {canManage(comment) && (
              <div className="comment-actions">
                {editingId === comment._id ? (
                  <>
                    <button type="button" className="btn btn-outline" onClick={() => saveEdit(comment._id)}>Guardar</button>
                    <button type="button" className="btn btn-outline" onClick={() => setEditingId(null)}>Cancelar</button>
                  </>
                ) : (
                  <>
                    <button type="button" className="btn btn-outline" onClick={() => startEdit(comment)}>Editar</button>
                    <button type="button" className="btn btn-outline" onClick={() => removeComment(comment._id)}>Eliminar</button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="comments-load-more">
          <button type="button" className="btn btn-outline" onClick={handleLoadMore}>Cargar mas comentarios</button>
        </div>
      )}

      <form className="comment-form" onSubmit={handleSubmit}>
        <div className="form-title">DEJAR UN COMENTARIO</div>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="commentName">Tu Nombre / Usuario</label>
            <input
              id="commentName"
              type="text"
              placeholder="MindHunter_X"
              value={form.authorName}
              onInput={(event) => setForm((prev) => ({ ...prev, authorName: event.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <span className="form-label">Tu Calificacion</span>
            <div className="star-rating" aria-label="calificacion">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`star-btn ${form.rating >= value ? 'active' : ''}`}
                  onClick={() => setForm((prev) => ({ ...prev, rating: value }))}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label htmlFor="commentText">Tu Comentario</label>
          <textarea
            id="commentText"
            placeholder="Cuentanos tu experiencia con Recessed Minds..."
            value={form.content}
            onInput={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
            required
          ></textarea>
        </div>

        <button type="submit" className="btn btn-red" disabled={submitting || loading}>
          {submitting ? 'PUBLICANDO...' : 'PUBLICAR COMENTARIO'}
        </button>
      </form>
    </>
  );
}
