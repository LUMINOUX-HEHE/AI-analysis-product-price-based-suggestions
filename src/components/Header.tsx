"use client";

import Link from "next/link";
import { BarChart3, TrendingUp, Home, Settings } from "lucide-react";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 border-b border-border bg-background/80 backdrop-blur-md z-50 px-6 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2 font-bold text-xl">
        <TrendingUp className="text-blue-500" />
        <span>PriceIntel</span>
      </Link>
      
      <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
        <Link href="/" className="hover:text-white transition-colors">Home</Link>
        <Link href="/dashboard" className="text-white">Dashboard</Link>
        <Link href="#" className="hover:text-white transition-colors">Alerts</Link>
        <Link href="#" className="hover:text-white transition-colors">Settings</Link>
      </nav>
      
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">
          JD
        </div>
      </div>
    </header>
  );
}