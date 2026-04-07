"use client";

import { useEffect } from 'react';
import { X } from 'lucide-react';

interface MobileSidebarProps {
 isOpen: boolean;
 onClose: () => void;
 children: React.ReactNode;
}

export default function MobileSidebar({ isOpen, onClose, children }: MobileSidebarProps) {
 useEffect(() => {
 const handleEscape = (e: KeyboardEvent) => {
 if (e.key === 'Escape') onClose();
 };
 if (isOpen) {
 document.addEventListener('keydown', handleEscape);
 document.body.style.overflow = 'hidden';
 }
 return () => {
 document.removeEventListener('keydown', handleEscape);
 document.body.style.overflow = '';
 };
 }, [isOpen, onClose]);

 return (
 <>
 <div
 className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
 onClick={onClose}
 aria-hidden="true"
 />
 <div className={`fixed top-0 left-0 h-full w-[280px] sm:w-[320px] bg-white z-50 shadow-xl flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
 {/* Header with logo + close button */}
 <div className="flex items-center justify-between px-4 py-3 shrink-0">
 <img src="/logo.svg" alt="99Tests" className="h-6 w-auto" />
 <button
 onClick={onClose}
 className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
 aria-label="Close menu"
 >
 <X className="w-5 h-5 text-gray-400" />
 </button>
 </div>

 {/* Sidebar content */}
 <div className="flex flex-col flex-1 min-h-0">
 {children}
 </div>
 </div>
 </>
 );
}
