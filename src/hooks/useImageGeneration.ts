import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { Post } from '../types/database';

export type ImageSize = '1024x1024' | '1792x1024' | '1024x1792';
export type ImageQuality = 'standard' | 'hd';
export type ImageStyle = 'vivid' | 'natural';

export interface GenerationOptions {
  quality: ImageQuality;
  style: ImageStyle;
  size: ImageSize;
}

const BUCKET_ID = 'images';

export function useImageGeneration() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateImage(prompt: string, options: GenerationOptions) {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    setLoading(true);
    try {
      // Generate image using DALL-E 3
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt,
          n: 1,
          response_format: 'b64_json',
          ...options
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to generate image');
      }

      const data = await response.json();
      return `data:image/png;base64,${data.data[0].b64_json}`;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate image';
      console.error('Generation error:', err);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function ensureBucketExists() {
    try {
      // First check if we can access storage at all
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        const errorMessage = `Storage access error: ${listError.message}`;
        console.error(errorMessage, listError);
        throw new Error(errorMessage);
      }

      if (!buckets) {
        const errorMessage = 'No storage buckets available';
        console.error(errorMessage);
        throw new Error(errorMessage);
      }

      // Check if our bucket exists
      const bucket = buckets.find(b => b.id === BUCKET_ID);
      if (!bucket) {
        const errorMessage = `Storage bucket '${BUCKET_ID}' not found`;
        console.error(errorMessage);
        throw new Error(errorMessage);
      }

      // Try to list the contents to verify access
      const { error: listFilesError } = await supabase.storage
        .from(BUCKET_ID)
        .list();

      if (listFilesError) {
        console.error('Storage access error:', listFilesError);
        throw new Error(`Cannot access storage bucket: ${listFilesError.message}`);
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize storage system';
      console.error('Storage initialization error:', err);
      throw new Error(errorMessage);
    }
  }

  async function base64ToBlob(dataUrl: string): Promise<Blob> {
    try {
      const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
      const byteString = atob(base64Data);
      const arrayBuffer = new ArrayBuffer(byteString.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      
      for (let i = 0; i < byteString.length; i++) {
        uint8Array[i] = byteString.charCodeAt(i);
      }
      
      return new Blob([arrayBuffer], { type: 'image/png' });
    } catch (err) {
      console.error('Base64 conversion error:', err);
      throw new Error('Failed to convert image data');
    }
  }

  async function saveImagePost(imageDataUrl: string, prompt: string, caption?: string): Promise<Post | null> {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    setLoading(true);
    try {
      // First, ensure the user has a profile
      const { data: _profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        // If profile doesn't exist, create it
        if (profileError.code === 'PGRST116') {
          const { error: createProfileError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              username: user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`
            });

          if (createProfileError) {
            throw new Error(`Failed to create profile: ${createProfileError.message}`);
          }
        } else {
          throw new Error(`Failed to fetch profile: ${profileError.message}`);
        }
      }

      // Ensure storage is accessible
      await ensureBucketExists();

      // Convert base64 to blob
      const blob = await base64ToBlob(imageDataUrl);
      
      // Create a unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      const filename = `${user.id}/${timestamp}-${randomId}.png`;

      console.log('Uploading image:', {
        bucket: BUCKET_ID,
        filename,
        contentType: 'image/png',
        size: blob.size
      });

      // Upload to Supabase Storage
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from(BUCKET_ID)
        .upload(filename, blob, {
          contentType: 'image/png',
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      if (!uploadData) {
        throw new Error('Upload succeeded but no data returned');
      }

      console.log('Image uploaded successfully:', uploadData);

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_ID)
        .getPublicUrl(filename);

      console.log('Generated public URL:', publicUrl);

      // Create the post
      const { data: newPost, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          image_url: publicUrl,
          prompt,
          caption: caption?.trim() || null
        })
        .select(`
          *,
          profile:profiles!posts_user_id_fkey (*)
        `)
        .single();

      if (postError) {
        console.error('Database error:', postError);
        throw new Error(`Failed to save post to database: ${postError.message}`);
      }

      console.log('Post saved successfully:', newPost);
      return newPost as Post;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save post';
      console.error('Save error:', err);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function generateAndSaveImage(
    prompt: string,
    options: GenerationOptions,
    caption?: string
  ): Promise<Post | null> {
    try {
      const imageDataUrl = await generateImage(prompt, options);
      if (!imageDataUrl) {
        throw new Error('Failed to generate image');
      }

      return await saveImagePost(imageDataUrl, prompt, caption);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process image';
      console.error('Process error:', err);
      setError(errorMessage);
      return null;
    }
  }

  return {
    generateImage,
    saveImagePost,
    generateAndSaveImage,
    loading,
    error,
    clearError: () => setError(null)
  };
} 