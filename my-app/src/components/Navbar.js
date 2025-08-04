import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center">
      <div className="text-xl font-bold">Fable Editor</div>
      <div className="space-x-4">
        <Link to="/" className="hover:text-yellow-300 transition">Acasă</Link>
        <Link to="/fable" className="hover:text-yellow-300 transition">Editor</Link>
      </div>
    </nav>
  );
};

export default Navbar;
