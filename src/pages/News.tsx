import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Post } from '../types/database';

export default function News() {
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
        .order('created_at', { ascending: false })
        .limit(10);

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
      <h1 className="text-2xl font-bold mb-6">Latest Updates</h1>
      {posts.map((post) => (
        <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b">
            <div className="flex items-center">
              <img
                src={post.profile?.avatar_url || `https://ui-avatars.com/api/?name=${post.profile?.username}`}
                alt={post.profile?.username}
                className="w-10 h-10 rounded-full mr-3"
              />
              <div>
                <p className="font-medium">{post.profile?.username}</p>
                <p className="text-gray-500 text-sm">
                  {new Date(post.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
          <img
            src={post.image_url}
            alt={post.prompt}
            className="w-full h-96 object-cover"
          />
          <div className="p-4">
            <p className="text-gray-800 mb-2">{post.caption}</p>
            <p className="text-gray-500 text-sm">
              <span className="font-medium">Prompt:</span> {post.prompt}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
} 