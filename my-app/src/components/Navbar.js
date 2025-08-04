import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-sm shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold">
          Fable
        </Link>
        <div className="space-x-4">
          <Link to="/" className="hover:underline">
            Home
          </Link>
          <Link to="/fable" className="hover:underline">
            Fable
          </Link>
        </div>
      </div>
    </nav>
  );
}