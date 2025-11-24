import { redirect } from 'next/navigation';

export default function Home() {
  // This page should never be reached due to middleware protection
  // but we'll redirect to login just in case
  redirect('/login');
}
