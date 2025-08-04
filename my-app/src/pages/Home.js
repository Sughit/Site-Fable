import React from 'react';
import Navbar from '../components/Navbar';

export default function Home() {
  return (
    <div className="relative h-screen overflow-hidden">
      {/* Navbar overlay */}
      <Navbar />

      {/* Main content: add top padding to avoid navbar overlap and enable scrolling */}
      <div className="h-full pt-16 overflow-auto px-4">
        {/* TODO: Insert your existing Home page content here */}
        Text test
      </div>
    </div>
  );
}