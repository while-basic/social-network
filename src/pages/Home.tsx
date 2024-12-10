import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Post } from '../types/database';

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profile:profiles(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden">
          <img
            src={post.image_url}
            alt={post.prompt}
            className="w-full h-96 object-cover"
          />
          <div className="p-4">
            <div className="flex items-center mb-2">
              <img
                src={post.profile?.avatar_url || `https://ui-avatars.com/api/?name=${post.profile?.username}`}
                alt={post.profile?.username}
                className="w-8 h-8 rounded-full mr-2"
              />
              <span className="font-medium">{post.profile?.username}</span>
            </div>
            <p className="text-gray-600 text-sm mb-2">{post.caption}</p>
            <p className="text-gray-500 text-xs">
              Prompt: {post.prompt}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
} 