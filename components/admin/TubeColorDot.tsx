import React from 'react';

const colorMap: Record<string, string> = {
 red: '#DC2626',
 purple: '#9333EA',
 yellow: '#EAB308',
 blue: '#2563EB',
 green: '#16A34A',
 gray: '#6B7280',
 white: '#F3F4F6',
 orange: '#EA580C'
};

export const AVAILABLE_TUBE_COLORS = Object.keys(colorMap);

export function TubeColorDot({ color }: { color?: string }) {
 if (!color) return null;
 const c = color.toLowerCase();
 const hex = colorMap[c];
 if (!hex) return null;
 
 return (
 <div 
 className={`w-4 h-4 rounded-full shrink-0 ${c === 'white' ? 'border border-gray-300' : ''}`} 
 style={{ backgroundColor: hex }}
 title={color}
 />
 );
}
