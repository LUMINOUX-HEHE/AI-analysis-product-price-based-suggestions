"use client";

import React from 'react';
import { TrendingUp } from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface PriceChartProps {
  data: any[];
}

const PriceChart = ({ data }: PriceChartProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
        <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center border border-border">
          <TrendingUp size={24} className="text-gray-700" />
        </div>
        <p className="text-sm font-medium tracking-tight">Gathering market price points...</p>
      </div>
    );
  }

  // Custom Tooltip component for a nicer look
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1a1a1a] border border-border p-4 rounded-2xl shadow-2xl backdrop-blur-md">
          <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-widest">{label}</p>
          <div className="space-y-2">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-8">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                  <span className="text-sm font-medium text-gray-200 capitalize">{entry.name}</span>
                </div>
                <span className="text-sm font-bold text-white">₹{entry.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorAmazon" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorFlipkart" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{fill: '#555', fontSize: 11, fontWeight: 500}}
            dy={15}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{fill: '#555', fontSize: 11, fontWeight: 500}}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="amazon" 
            name="Amazon"
            stroke="#f97316" 
            strokeWidth={4} 
            fillOpacity={1} 
            fill="url(#colorAmazon)" 
            activeDot={{ r: 6, strokeWidth: 0, fill: '#f97316' }}
          />
          <Area 
            type="monotone" 
            dataKey="flipkart" 
            name="Flipkart"
            stroke="#3b82f6" 
            strokeWidth={4} 
            fillOpacity={1} 
            fill="url(#colorFlipkart)" 
            activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceChart;
