import { useState, useEffect } from 'react';
import { useComments } from '../hooks/useComments';
import { useAuth } from '../hooks/useAuth';
import type { Comment } from '../types/database';
import { FaTrash, FaEdit, FaTimes } from 'react-icons/fa';

interface CommentsProps {
  postId: string;
  onClose?: () => void;
}

export default function Comments({ postId, onClose }: CommentsProps) {
  const { user } = useAuth();
  const { fetchComments, addComment, deleteComment, updateComment, loading } = useComments();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<{ id: string; content: string } | null>(null);

  useEffect(() => {
    loadComments();
  }, [postId]);

  async function loadComments() {
    const data = await fetchComments(postId);
    setComments(data);
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment = await addComment(postId, newComment.trim());
    if (comment) {
      setComments([...comments, comment]);
      setNewComment('');
    }
  }

  async function handleDeleteComment(commentId: string) {
    const success = await deleteComment(commentId);
    if (success) {
      setComments(comments.filter(c => c.id !== commentId));
    }
  }

  async function handleUpdateComment(e: React.FormEvent) {
    e.preventDefault();
    if (!editingComment) return;

    const updated = await updateComment(editingComment.id, editingComment.content);
    if (updated) {
      setComments(comments.map(c => c.id === updated.id ? updated : c));
      setEditingComment(null);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold">Comments</h3>
        {onClose && (
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {comments.map(comment => (
          <div key={comment.id} className="flex gap-3">
            <img
              src={comment.profile?.avatar_url || `https://ui-avatars.com/api/?name=${comment.profile?.username}`}
              alt={comment.profile?.username}
              className="w-8 h-8 rounded-full"
            />
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-medium">{comment.profile?.username}</span>
                  <span className="text-gray-500 text-sm ml-2">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                {user?.id === comment.user_id && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingComment({ id: comment.id, content: comment.content })}
                      className="text-gray-500 hover:text-blue-500"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <FaTrash />
                    </button>
                  </div>
                )}
              </div>
              {editingComment?.id === comment.id ? (
                <form onSubmit={handleUpdateComment} className="mt-2">
                  <input
                    type="text"
                    value={editingComment.content}
                    onChange={e => setEditingComment({ ...editingComment, content: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setEditingComment(null)}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Save
                    </button>
                  </div>
                </form>
              ) : (
                <p className="mt-1 text-gray-800">{comment.content}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleAddComment} className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={loading || !newComment.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Post
          </button>
        </div>
      </form>
    </div>
  );
} 