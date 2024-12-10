import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useLikes() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  async function toggleLike(postId: string, currentLikeStatus: boolean) {
    if (!user) return;
    
    setLoading(true);
    try {
      if (currentLikeStatus) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .match({ user_id: user.id, post_id: postId });
        
        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({ user_id: user.id, post_id: postId });
        
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLoading(false);
    }
  }

  async function checkLikeStatus(postId: string) {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .match({ user_id: user.id, post_id: postId })
        .single();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking like status:', error);
      return false;
    }
  }

  return {
    toggleLike,
    checkLikeStatus,
    loading
  };
} 