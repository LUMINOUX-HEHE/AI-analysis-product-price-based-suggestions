import Link from "next/link";
import { Search } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="max-w-3xl w-full space-y-8">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Real-Time Product <br />
          <span className="text-blue-500">Price Intelligence</span>
        </h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-xl mx-auto">
          Track prices across major platforms, compare deals and get AI-powered recommendations to save money.
        </p>
        
        <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto mt-12 bg-[#1a1a1a] p-2 rounded-2xl border border-border">
          <div className="flex-1 flex items-center px-4">
            <Search className="text-gray-500 mr-2" size={20} />
            <input 
              type="text" 
              placeholder="Enter product name or URL (Amazon, Flipkart...)"
              className="bg-transparent border-none focus:outline-none w-full py-3 text-white placeholder:text-gray-600"
            />
          </div>
          <Link 
            href="/dashboard"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-xl transition-all"
          >
            Start Tracking
          </Link>
        </div>
        
        <div className="flex flex-wrap justify-center gap-8 pt-12 text-gray-500 text-sm font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Real-time Updates
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Multi-platform Comparison
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            AI Insights
          </div>
        </div>
      </div>
    </main>
  );
}