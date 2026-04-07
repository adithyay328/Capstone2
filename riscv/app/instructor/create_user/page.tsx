'use client';

import { useState } from 'react';
import { createUser } from './api/frontend';
import type { CreateUserRole } from './api/types';

const roleOptions: Array<{
  value: CreateUserRole;
  label: string;
  description: string;
}> = [
  {
    value: 'student',
    label: 'Student',
    description: 'Standard student account with student portal access.',
  },
  {
    value: 'ta',
    label: 'TA',
    description: 'Creates the account now; TA admin access becomes active after course-role assignment.',
  },
  {
    value: 'instructor',
    label: 'Instructor',
    description: 'Full instructor account with instructor dashboard access.',
  },
];

export default function CreateUserPage() {
  const [username, setUsername] = useState('');
  const [asuid, setAsuid] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<CreateUserRole>('student');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{success: boolean; text: string} | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    
    try {
      const result = await createUser(username, asuid, password, role);
      setMessage({ success: result.success, text: result.message });
      
      if (result.success) {
        // Clear form on success
        setUsername('');
        setAsuid('');
        setPassword('');
        setRole('student');
      }
    } catch (error) {
      setMessage({ 
        success: false, 
        text: error instanceof Error ? error.message : 'An unknown error occurred' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <div className="w-full max-w-md px-4">
        <h1 className="text-2xl font-bold mb-6 text-center">Create User</h1>
        
        {message && (
          <div className={`mb-4 p-3 rounded-md ${message.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="asuid" className="block text-sm font-medium mb-1">
              ASU ID
            </label>
            <input
              type="text"
              id="asuid"
              value={asuid}
              onChange={(e) => setAsuid(e.target.value)}
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium mb-1">
              Account Type
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as CreateUserRole)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-sm text-gray-600">
              {roleOptions.find((option) => option.value === role)?.description}
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}
