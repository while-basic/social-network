import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabase';
import { IoWarningOutline } from 'react-icons/io5';

const Auth = () => {
  return (
    <div className="container max-w-md mx-auto mt-12 p-4">
      <h1 className="text-2xl font-bold text-center mb-8">Welcome to AI Social</h1>
      
      {/* Notification Banner */}
      <div className="rounded-md bg-yellow-50 p-4 mb-6 animate-fadeIn">
        <div className="flex">
          <div className="flex-shrink-0">
            <IoWarningOutline className="h-5 w-5 text-yellow-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Social Login Notice
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                Facebook and Google sign-in options are temporarily unavailable. Please use email and password to continue.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <SupabaseAuth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#3b82f6',
                  brandAccent: '#2563eb',
                },
              },
            },
          }}
          providers={[]}
        />
      </div>
    </div>
  );
};

export default Auth; 