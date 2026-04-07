"use client";

import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';

interface MobileHeaderProps {
 onMenuToggle: () => void;
 isOpen?: boolean;
}

export default function MobileHeader({ onMenuToggle, isOpen }: MobileHeaderProps) {
 const pathname = usePathname();
 const router = useRouter();
 const [unreadCount, setUnreadCount] = useState(0);

 useEffect(() => {
 const fetchUnreadCount = () => {
 fetch('/api/notifications?filter=unread&limit=1')
 .then(res => res.json())
 .then(data => {
 if (typeof data.unreadCount === 'number') {
 setUnreadCount(data.unreadCount);
 }
 })
 .catch(console.error);
 };

 // Initial fetch on mount or path change
 fetchUnreadCount();

 // Poll every 60 seconds
 const intervalId = setInterval(fetchUnreadCount, 60000);

 // Refetch when browser tab becomes visible
 const handleVisibilityChange = () => {
 if (document.visibilityState === 'visible') {
 fetchUnreadCount();
 }
 };
 
 document.addEventListener('visibilitychange', handleVisibilityChange);

 return () => {
 clearInterval(intervalId);
 document.removeEventListener('visibilitychange', handleVisibilityChange);
 };
 }, [pathname]);

 const handleBellClick = () => {
 if (pathname.startsWith('/bc')) {
 router.push('/bc/notifications');
 } else if (pathname.startsWith('/admin')) {
 router.push('/admin/notifications');
 } else {
 router.push('/dashboard/notifications');
 }
 };

 return (
 <div className={`sticky top-0 flex items-center justify-between w-full px-4 h-14 bg-white border-b border-gray-200 z-30 shrink-0 lg:hidden transition-transform duration-300 ease-in-out ${isOpen ? '-translate-y-full' : 'translate-y-0'}`}>
 <div className="flex items-center gap-3">
 <button
 onClick={onMenuToggle}
 className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
 aria-label="Open menu"
 >
 <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
 <path d="M3 5H17" stroke="#1A1D23" strokeWidth="1.5" strokeLinecap="round" />
 <path d="M3 10H17" stroke="#1A1D23" strokeWidth="1.5" strokeLinecap="round" />
 <path d="M3 15H17" stroke="#1A1D23" strokeWidth="1.5" strokeLinecap="round" />
 </svg>
 </button>
 <Image src="/logo.svg" alt="99Tests" width={110} height={24} className="h-6 w-auto" priority />
 </div>
 
 <button 
 onClick={handleBellClick} 
 className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
 >
 <Bell className="w-5 h-5 text-gray-500" />
 {unreadCount > 0 && (
 <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center text-[10px] text-white font-medium">
 {unreadCount > 9 ? '9+' : unreadCount}
 </span>
 )}
 </button>
 </div>
 );
}
