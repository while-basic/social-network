import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import type { Post, Profile } from '../types/database';
import { FaImage, FaHeart, FaComment } from 'react-icons/fa';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUserPosts();
    }
  }, [user]);

  async function fetchProfile() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }

  async function fetchUserPosts() {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          profile:profiles (*)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;
      setPosts(postsData || []);
    } catch (error) {
      console.error('Error fetching user posts:', error);
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
    <div className="container mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center gap-4">
          <img
            src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.username}`}
            alt={profile?.username}
            className="w-20 h-20 rounded-full"
          />
          <div>
            <h1 className="text-2xl font-bold">{profile?.username}</h1>
            {profile?.bio && (
              <p className="text-gray-600 mt-1">{profile.bio}</p>
            )}
          </div>
        </div>
        <div className="mt-4 flex gap-4">
          <div>
            <span className="font-bold">{posts.length}</span>
            <span className="text-gray-600 ml-1">posts</span>
          </div>
        </div>
      </div>

      {/* Generated Images Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="aspect-square">
              <img
                src={post.image_url}
                alt={post.prompt}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-2">{post.caption}</p>
              <p className="text-xs text-gray-500 italic">Prompt: {post.prompt}</p>
              <div className="flex items-center gap-4 mt-2 text-gray-600">
                <div className="flex items-center gap-1">
                  <FaHeart />
                  <span>{post.likes_count}</span>
                </div>
                <div className="flex items-center gap-1">
                  <FaComment />
                  <span>{post.comments_count}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-12">
          <FaImage className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No images generated yet</p>
        </div>
      )}
    </div>
  );
} 