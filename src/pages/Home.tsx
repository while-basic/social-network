import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { Post, Profile } from '../types/database';
import { FaImage, FaMagic, FaHeart, FaComment, FaUserFriends, FaChartLine, FaTimes, FaCalendar } from 'react-icons/fa';

interface ImageModalProps {
  post: Post;
  onClose: () => void;
}

function ImageModal({ post, onClose }: ImageModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    // Add escape key listener
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleEscape);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    // Wait for animation to complete before closing
    setTimeout(onClose, 300);
  };

  return (
    <div 
      className={`fixed inset-0 bg-black flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${
        isVisible ? 'bg-opacity-75' : 'bg-opacity-0'
      }`}
      onClick={handleClose}
    >
      <div 
        className={`bg-white rounded-lg overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3 animate-fadeIn">
            <img
              src={post.profile?.avatar_url || `https://ui-avatars.com/api/?name=${post.profile?.username}`}
              alt={post.profile?.username}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <h3 className="font-semibold">{post.profile?.username}</h3>
              <p className="text-sm text-gray-500">
                {new Date(post.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition-colors duration-200 hover:rotate-90 transform"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Image and Details */}
        <div className="flex-1 overflow-auto flex flex-col md:flex-row">
          {/* Image */}
          <div className="md:flex-1 bg-black flex items-center justify-center">
            <img
              src={post.image_url}
              alt={post.prompt}
              className={`max-h-[60vh] md:max-h-[80vh] object-contain transition-all duration-500 ${
                isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
            />
          </div>

          {/* Details */}
          <div className={`w-full md:w-80 p-4 border-t md:border-t-0 md:border-l transition-transform duration-300 ${
            isVisible ? 'translate-x-0' : 'translate-x-full'
          }`}>
            {/* Stats */}
            <div className="flex items-center justify-around mb-4 p-3 bg-gray-50 rounded-lg transform transition-all duration-500">
              <div className="text-center hover:scale-110 transition-transform">
                <div className="flex items-center gap-1 text-red-500">
                  <FaHeart className="animate-pulse" />
                  <span className="font-semibold">{post.likes_count}</span>
                </div>
                <p className="text-sm text-gray-600">Likes</p>
              </div>
              <div className="text-center hover:scale-110 transition-transform">
                <div className="flex items-center gap-1 text-blue-500">
                  <FaComment />
                  <span className="font-semibold">{post.comments_count}</span>
                </div>
                <p className="text-sm text-gray-600">Comments</p>
              </div>
              <div className="text-center hover:scale-110 transition-transform">
                <div className="flex items-center gap-1 text-green-500">
                  <FaCalendar />
                  <span className="font-semibold">{new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
                <p className="text-sm text-gray-600">Created</p>
              </div>
            </div>

            {/* Caption */}
            {post.caption && (
              <div className="mb-4 transform transition-all duration-500 delay-100">
                <h4 className="font-semibold text-sm text-gray-700 mb-1">Caption</h4>
                <p className="text-gray-600">{post.caption}</p>
              </div>
            )}

            {/* Prompt */}
            <div className="transform transition-all duration-500 delay-200">
              <h4 className="font-semibold text-sm text-gray-700 mb-1">Prompt</h4>
              <p className="text-gray-600 text-sm italic">{post.prompt}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0,
    recentPosts: 0
  });

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  async function fetchUserData() {
    try {
      setLoading(true);

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch user's posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          profile:profiles (*)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(6);

      if (postsError) throw postsError;
      setPosts(postsData || []);

      // Calculate stats
      const now = new Date();
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const recentPosts = (postsData || []).filter(post => 
        new Date(post.created_at) > lastWeek
      ).length;

      const totalLikes = (postsData || []).reduce((sum, post) => sum + (post.likes_count || 0), 0);
      const totalComments = (postsData || []).reduce((sum, post) => sum + (post.comments_count || 0), 0);

      setStats({
        totalPosts: postsData?.length || 0,
        totalLikes,
        totalComments,
        recentPosts
      });

    } catch (error) {
      console.error('Error fetching user data:', error);
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
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 mb-8 text-white">
        <div className="flex items-center gap-6">
          <img
            src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.username}`}
            alt={profile?.username}
            className="w-20 h-20 rounded-full border-4 border-white"
          />
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {profile?.username}!</h1>
            <p className="text-blue-100">Ready to create something amazing today?</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link
          to="/create"
          className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow flex items-center gap-4"
        >
          <div className="bg-blue-100 p-4 rounded-full">
            <FaMagic className="text-2xl text-blue-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Create New Art</h3>
            <p className="text-gray-600">Generate a new AI masterpiece</p>
          </div>
        </Link>

        <Link
          to="/profile"
          className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow flex items-center gap-4"
        >
          <div className="bg-purple-100 p-4 rounded-full">
            <FaUserFriends className="text-2xl text-purple-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">View Profile</h3>
            <p className="text-gray-600">See your complete collection</p>
          </div>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <FaImage className="text-2xl text-blue-500" />
            <span className="text-2xl font-bold">{stats.totalPosts}</span>
          </div>
          <p className="text-gray-600">Total Creations</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <FaHeart className="text-2xl text-red-500" />
            <span className="text-2xl font-bold">{stats.totalLikes}</span>
          </div>
          <p className="text-gray-600">Total Likes</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <FaComment className="text-2xl text-green-500" />
            <span className="text-2xl font-bold">{stats.totalComments}</span>
          </div>
          <p className="text-gray-600">Total Comments</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <FaChartLine className="text-2xl text-purple-500" />
            <span className="text-2xl font-bold">{stats.recentPosts}</span>
          </div>
          <p className="text-gray-600">Posts This Week</p>
        </div>
      </div>

      {/* Recent Creations */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Recent Creations</h2>
          <Link to="/profile" className="text-blue-500 hover:text-blue-600">
            View All
          </Link>
        </div>

        {posts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {posts.map((post) => (
              <div 
                key={post.id} 
                className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
                onClick={() => setSelectedPost(post)}
              >
                <img
                  src={post.image_url}
                  alt={post.prompt}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <div className="text-white">
                    <p className="text-sm mb-1 line-clamp-2">{post.caption || 'Untitled'}</p>
                    <div className="flex items-center gap-3 text-sm">
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
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FaImage className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No creations yet</p>
            <Link
              to="/create"
              className="mt-4 inline-block px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Create Your First Art
            </Link>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedPost && (
        <ImageModal 
          post={selectedPost} 
          onClose={() => setSelectedPost(null)} 
        />
      )}
    </div>
  );
} 