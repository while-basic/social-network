import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface Bucket {
  id: string;
  name: string;
  owner: string;
  public: boolean;
  created_at: string;
  updated_at: string;
  file_size_limit?: number;
  allowed_mime_types?: string[];
}

export default function StorageDebug() {
  const { user } = useAuth();
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    checkStorage();
  }, []);

  async function checkStorage() {
    try {
      setLoading(true);
      setError(null);
      console.log('Checking storage system...');

      // Check if we can access storage API
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('Storage access error:', listError);
        setError(`Storage access error: ${listError.message}`);
        return;
      }

      if (!buckets) {
        const msg = 'No storage buckets available';
        console.error(msg);
        setError(msg);
        return;
      }

      console.log('Found buckets:', buckets);
      setBuckets(buckets);

      // Check specifically for 'images' bucket
      const imagesBucket = buckets.find(b => b.id === 'images');
      if (!imagesBucket) {
        const msg = 'Images bucket not found in available buckets';
        console.error(msg);
        setError(msg);
        return;
      }

      console.log('Images bucket found:', imagesBucket);

      // Try to list contents of images bucket
      const { data: files, error: listFilesError } = await supabase.storage
        .from('images')
        .list();

      if (listFilesError) {
        const msg = `Cannot access images bucket: ${listFilesError.message}`;
        console.error(msg);
        setError(msg);
        return;
      }

      console.log('Successfully listed bucket contents:', files);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Storage check error:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function createBucket() {
    try {
      setLoading(true);
      setError(null);
      console.log('Creating images bucket...');

      const { error: createError } = await supabase.storage.createBucket('images', {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg'],
        fileSizeLimit: 5242880 // 5MB
      });

      if (createError) {
        console.error('Bucket creation error:', createError);
        setError(`Failed to create bucket: ${createError.message}`);
        return;
      }

      console.log('Bucket created successfully');
      await checkStorage();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Bucket creation error:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function createTestImage(): Promise<Blob> {
    // Create a 1x1 transparent PNG
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    
    // Make the image transparent
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, 1, 1);
    
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create test image'));
        }
      }, 'image/png');
    });
  }

  async function testBucketAccess() {
    if (!user) {
      setTestResult('Must be logged in to test bucket access');
      return;
    }

    try {
      setTestResult('Testing bucket access...');
      console.log('Starting bucket access test...');

      // Create a small test PNG image
      const testBlob = await createTestImage();
      const testPath = `${user.id}/test.png`;

      console.log('Attempting to upload test image...');
      // Try to upload
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('images')
        .upload(testPath, testBlob, {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload test failed:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', uploadData);

      // Try to delete the test file
      console.log('Attempting to delete test image...');
      const { error: deleteError } = await supabase.storage
        .from('images')
        .remove([testPath]);

      if (deleteError) {
        console.error('Delete test failed:', deleteError);
        throw deleteError;
      }

      console.log('Delete successful');
      setTestResult('Successfully tested bucket access (write and delete)');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Bucket test error:', err);
      setTestResult(`Failed to test bucket access: ${message}`);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Storage System Status</h2>
      
      <div className="space-y-2">
        <p>User authenticated: {user ? 'Yes' : 'No'}</p>
        <p>User ID: {user?.id || 'Not logged in'}</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">Storage Status:</h3>
          <button
            onClick={checkStorage}
            className="text-sm px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
          >
            Refresh
          </button>
        </div>
        
        {loading ? (
          <p>Checking storage system...</p>
        ) : error ? (
          <div className="text-red-600 space-y-2">
            <p>Error: {error}</p>
            {error.includes('not found') && (
              <button
                onClick={createBucket}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                Create Images Bucket
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p>Storage buckets found: {buckets.length}</p>
            <ul className="list-disc pl-5">
              {buckets.map(bucket => (
                <li key={bucket.id} className="break-all">
                  {bucket.id} ({bucket.public ? 'public' : 'private'})
                  {bucket.file_size_limit && ` - Max size: ${bucket.file_size_limit / 1024 / 1024}MB`}
                  {bucket.allowed_mime_types?.length && ` - Types: ${bucket.allowed_mime_types.join(', ')}`}
                </li>
              ))}
            </ul>
            
            <div className="mt-4">
              <button
                onClick={testBucketAccess}
                disabled={loading || !user}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Test Bucket Access
              </button>
              {testResult && (
                <p className={`mt-2 ${testResult.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>
                  {testResult}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 