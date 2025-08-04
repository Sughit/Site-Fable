import React from 'react';
import FableCanvas from '../components/FableCanvas';
import CodeEditor from '../components/CodeEditor';
import Navbar from '../components/Navbar';

export default function Fable() {
  return (
    <div className="relative h-screen overflow-hidden">
      {/* Navbar overlay */}
      <Navbar />

      {/* Main content: add padding to avoid navbar overlap */}
      <div className="flex h-full pt-16">
        {/* Left: Simulation canvas */}
        <div className="w-1/2 bg-gray-900 p-4 overflow-hidden">
          <FableCanvas />
        </div>

        {/* Right: Blockly code editor */}
        <div className="w-1/2 bg-gray-100 p-4 overflow-auto">
          <CodeEditor />
        </div>
      </div>
    </div>
  );
}