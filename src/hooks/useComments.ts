import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { Comment } from '../types/database';

export function useComments() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  async function fetchComments(postId: string) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  }

  async function addComment(postId: string, content: string) {
    if (!user) return null;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          user_id: user.id,
          post_id: postId,
          content
        })
        .select(`
          *,
          profile:profiles(*)
        `)
        .single();

      if (error) throw error;
      return data as Comment;
    } catch (error) {
      console.error('Error adding comment:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function deleteComment(commentId: string) {
    if (!user) return false;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .match({ id: commentId, user_id: user.id });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function updateComment(commentId: string, content: string) {
    if (!user) return null;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .update({ content })
        .match({ id: commentId, user_id: user.id })
        .select(`
          *,
          profile:profiles(*)
        `)
        .single();

      if (error) throw error;
      return data as Comment;
    } catch (error) {
      console.error('Error updating comment:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }

  return {
    fetchComments,
    addComment,
    deleteComment,
    updateComment,
    loading
  };
} 