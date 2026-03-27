"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search } from 'lucide-react';

export interface SelectOption {
  id: string; // the code or value to store
  name: string; // display name
  description?: string; // e.g. flag or additional info
  rightIcon?: React.ReactNode; 
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string; // used to override height/styling if necessary
  dropdownClassName?: string; // used to override dropdown panel
  renderTrigger?: (selected: SelectOption | undefined) => React.ReactNode;
}

export function SearchableSelect({ 
  value, 
  onChange, 
  options, 
  placeholder = "Select...", 
  searchPlaceholder = "Search...",
  className = "",
  dropdownClassName = "left-0 right-0",
  renderTrigger
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.name.toLowerCase().includes(search.toLowerCase()) || 
    (opt.description && opt.description.toLowerCase().includes(search.toLowerCase())) ||
    opt.id.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOpt = options.find(o => o.id === value);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={className || `w-full text-left text-[14px] h-11 px-4 rounded-[10px] border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none flex items-center justify-between font-medium transition-colors bg-white ${selectedOpt ? 'text-gray-900' : 'text-gray-400'}`}
      >
        {renderTrigger ? (
            renderTrigger(selectedOpt)
        ) : (
            <>
              <span className="truncate flex items-center gap-2">
                {selectedOpt ? (
                  <>
                    {selectedOpt.description && <span>{selectedOpt.description}</span>}
                    {selectedOpt.name}
                  </>
                ) : placeholder}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
            </>
        )}
      </button>

      {isOpen && (
        <div className={`absolute top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-md max-h-60 flex flex-col z-[9999] overflow-hidden ${dropdownClassName}`}>
          <div className="p-2 border-b border-gray-100 shrink-0 bg-white">
            <div className="relative">
              <input
                type="text"
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full text-[13px] border-b border-gray-200 px-3 py-2 outline-none focus:border-primary transition-colors text-gray-900 placeholder:text-gray-400"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-1 max-h-48">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-[13px] text-gray-500 text-center italic">No results found</div>
            ) : (
              filteredOptions.map(opt => (
                <div
                  key={opt.id}
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`px-3 py-2.5 hover:bg-gray-50 cursor-pointer text-[13px] text-gray-900 transition-colors flex items-center gap-2 ${value === opt.id ? 'bg-primary/5 text-primary font-medium' : ''}`}
                >
                  {opt.description && <span className="text-[16px] leading-none shrink-0">{opt.description}</span>}
                  <span className="truncate font-medium">{opt.name}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
