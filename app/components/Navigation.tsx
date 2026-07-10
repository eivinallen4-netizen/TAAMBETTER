'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black border-b-2 border-red-600">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="text-2xl font-black text-white hover:text-red-600 transition"
        >
          TAAM
        </Link>

        <div className="hidden md:flex gap-8 items-center">
          <Link
            href="/"
            className="text-white hover:text-red-600 transition font-semibold uppercase text-sm tracking-wide"
          >
            Home
          </Link>
          <Link
            href="/about"
            className="text-white hover:text-red-600 transition font-semibold uppercase text-sm tracking-wide"
          >
            About
          </Link>
          <Link
            href="/work"
            className="text-white hover:text-red-600 transition font-semibold uppercase text-sm tracking-wide"
          >
            Work
          </Link>
        </div>

        <button
          className="md:hidden text-white hover:text-red-600 transition"
          onClick={() => setIsOpen(!isOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 bg-black border-b-2 border-red-600 p-6 flex flex-col gap-4 md:hidden">
            <Link href="/" className="text-white hover:text-red-600 font-semibold uppercase">
              Home
            </Link>
            <Link href="/about" className="text-white hover:text-red-600 font-semibold uppercase">
              About
            </Link>
            <Link href="/work" className="text-white hover:text-red-600 font-semibold uppercase">
              Work
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
