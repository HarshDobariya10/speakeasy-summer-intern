'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <>
      <link
        rel="preconnect"
        href="https://fonts.googleapis.com"
      />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,600&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap"
        rel="stylesheet"
      />
      <style>{`
        html, body {
          background: #0c0b09 !important;
          margin: 0;
          padding: 0;
        }
        *, *::before, *::after {
          box-sizing: border-box;
        }
        :root {
          --bg: #0c0b09;
          --surface: #161410;
          --border: #2a2520;
          --accent: #c9a84c;
          --accent-hover: #e8c97a;
          --text-primary: #f0ead6;
          --text-muted: #7a6f5e;
          --error: #e05252;
          --input-bg: #1e1b17;
          --font-heading: 'Cormorant Garamond', serif;
          --font-body: 'DM Sans', sans-serif;
        }
      `}</style>
      {children}
    </>
  );
}
