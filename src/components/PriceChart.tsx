"use client";

import React from 'react';
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
      <div className="h-[300px] flex items-center justify-center text-gray-500">
        <p>No price data available yet.</p>
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorAmazon" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorFlipkart" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{fill: '#737373', fontSize: 12}}
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{fill: '#737373', fontSize: 12}}
            domain={['auto', 'auto']}
          />
          <Tooltip 
            contentStyle={{backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '12px'}}
            itemStyle={{fontSize: '12px'}}
          />
          <Area type="monotone" dataKey="amazon" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAmazon)" />
          <Area type="monotone" dataKey="flipkart" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorFlipkart)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceChart;
