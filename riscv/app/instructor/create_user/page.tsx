'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createUser } from './api/frontend';
import { ins } from '@/components/instructor-shell';

export default function CreateUserPage() {
  const [username, setUsername] = useState('');
  const [asuid, setAsuid] = useState('');
  const [password, setPassword] = useState('');
  const [isInstructor, setIsInstructor] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ success: boolean; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await createUser(username, asuid, password, isInstructor);
      setMessage({ success: result.success, text: result.message });

      if (result.success) {
        setUsername('');
        setAsuid('');
        setPassword('');
        setIsInstructor(false);
      }
    } catch (error) {
      setMessage({
        success: false,
        text: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`${ins.pageWrapSm} max-w-md`}>
      <Link href="/instructor" className={ins.backLink}>
        ← Back to dashboard
      </Link>
      <h1 className={`${ins.h1} mt-4 text-center`}>Create User</h1>

      {message && (
        <div className={`mt-4 ${message.success ? ins.msgOk : ins.msgErr}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className={`mt-6 space-y-4 ${ins.card} ${ins.cardPad}`}>
        <div>
          <label htmlFor="username" className={ins.label}>
            Username
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={ins.input}
            required
          />
        </div>

        <div>
          <label htmlFor="password" className={ins.label}>
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={ins.input}
            required
          />
        </div>

        <div>
          <label htmlFor="asuid" className={ins.label}>
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
            className={ins.input}
            required
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="instructor"
            checked={isInstructor}
            onChange={(e) => setIsInstructor(e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-stone-900 text-amber-500 focus:ring-amber-500/40"
          />
          <label htmlFor="instructor" className="text-sm text-stone-800">
            Instructor
          </label>
        </div>

        <button type="submit" disabled={isSubmitting} className={`${ins.btnPrimary} w-full`}>
          {isSubmitting ? 'Creating...' : 'Submit'}
        </button>
      </form>
    </div>
  );
}
