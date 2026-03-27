const fs = require('fs');

let content = fs.readFileSync('app/bc/calendar/page.tsx', 'utf8');

// 1. Add X icon and selectedDate state
content = content.replace(
  `import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, User, ArrowRight } from "lucide-react";`,
  `import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, User, ArrowRight, X, CalendarX } from "lucide-react";`
);

content = content.replace(
  `  const [currentDate, setCurrentDate] = useState(new Date());`,
  `  const [currentDate, setCurrentDate] = useState(new Date());\n  const [selectedDate, setSelectedDate] = useState<Date | null>(null);`
);

// 2. Clear selectedDate on month change
content = content.replace(
  `  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));`,
  `  const nextMonth = () => { setCurrentDate(addMonths(currentDate, 1)); setSelectedDate(null); };`
);
content = content.replace(
  `  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));`,
  `  const prevMonth = () => { setCurrentDate(subMonths(currentDate, 1)); setSelectedDate(null); };`
);

// 3. Update Calendar cell click handler and styling
const oldCellStartString = `                  return (
                    <div 
                      key={i} 
                      className={\`min-h-[90px] p-1.5 flex flex-col rounded-xl border \${
                        isToday ? 'bg-hematch-red/5 border-hematch-red border-2' : 
                        isPast ? 'bg-gray-50/50 border-gray-100 text-gray-300' :
                        !isCurrentMonth ? 'bg-gray-50/30 border-transparent text-gray-300' : 
                        'bg-white border-gray-100'
                      }\`}`;

const newCellStartString = `                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  
                  return (
                    <div 
                      key={i} 
                      onClick={() => setSelectedDate(isSelected ? null : day)}
                      className={\`min-h-[90px] p-1.5 flex flex-col transition-colors cursor-pointer \${
                        isSelected && isToday ? 'border-hematch-red bg-hematch-red/5 border-2 ring-2 ring-near-black rounded-lg' :
                        isSelected ? 'bg-near-black/5 border-2 border-near-black rounded-lg' :
                        isToday ? 'bg-hematch-red/5 border-hematch-red border-2 rounded-xl hover:bg-hematch-red/10' : 
                        isPast ? 'bg-gray-50/50 border-gray-100 text-gray-300 rounded-xl hover:bg-gray-100/50' :
                        !isCurrentMonth ? 'bg-gray-50/30 border-transparent text-gray-300 rounded-xl hover:bg-gray-50' : 
                        'bg-white border-gray-100 border rounded-xl hover:bg-gray-50'
                      }\`}`;

content = content.replace(oldCellStartString, newCellStartString);

// 4. Create the detail panel component logic above the main return tree
// Note: We need a Panel view that takes selectedDate and renders its events inline or overlay.
const panelCode = `
  const renderDetailPanel = () => {
    if (!selectedDate) return null;
    const events = getDayEvents(selectedDate);
    
    return (
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="font-heading text-[18px] font-medium text-near-black">
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </h3>
            <p className="text-[14px] text-gray-500">
              {events.length === 0 ? "No events" : \`\${events.length} event\${events.length > 1 ? 's' : ''}\`}
            </p>
          </div>
          <button onClick={() => setSelectedDate(null)} className="p-1 text-gray-400 hover:text-near-black transition-colors rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-gray-400 py-10">
              <CalendarX className="w-10 h-10 mb-3 opacity-50" />
              <p className="text-[13px] font-medium">Nothing scheduled</p>
              <p className="text-[13px]">This day is free</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((ev: any, idx) => {
                if (ev.type === 'appt') {
                  const sDate = new Date(ev.time);
                  const isHome = ev.raw?.case?.mobility === 'home_visit';
                  return (
                    <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:border-gray-300 transition-colors">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-2 h-2 rounded-full bg-hematch-red" />
                        <span className="text-[12px] font-bold text-hematch-red uppercase tracking-wider">Appointment</span>
                      </div>
                      <div className="text-[14px] font-medium text-near-black mb-2">
                        {format(sDate, "h:mm a")} \u2014 {format(addHours(sDate, 1), "h:mm a")}
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[13px]">
                          <span className="text-gray-500">Patient</span>
                          <span className="font-medium text-near-black">{ev.raw?.patient_name || 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between items-center text-[13px]">
                          <span className="text-gray-500">Case Token</span>
                          <span className="font-mono text-[11px] text-gray-400">{ev.raw?.case_id}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                           <span className={\`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider \${isHome ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}\`}>
                             {isHome ? 'Home Visit' : 'Practice'}
                           </span>
                           <span className="bg-signal-teal/10 text-signal-teal text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">Scheduled</span>
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div key={idx} className="bg-amber-50/50 border border-amber-100 rounded-lg p-3 shadow-sm mb-2">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-[12px] font-bold text-amber-700 uppercase tracking-wider">Proposed Slot</span>
                      </div>
                      <div className="text-[14px] font-medium text-near-black mb-2">
                        {format(ev.time, "h:mm a")} \u2014 {format(addHours(ev.time, 1), "h:mm a")}
                      </div>
                      <div className="space-y-1.5">
                         <div className="flex justify-between items-center text-[13px]">
                          <span className="text-gray-500">Case Token</span>
                          <span className="font-mono text-[11px] text-gray-400">{ev.raw?.case_id}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-amber-200/50">
                          <span className="text-[12px] text-gray-400 italic">Waiting for patient</span>
                          <span className="bg-white/60 text-amber-800 border border-amber-200 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">Round {ev.raw?.round || 1}</span>
                        </div>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          )}
        </div>
      </div>
    );
  };
`;

const getDayEventsTarget = `    // Combine events for rendering pills
    const allEvents = [
      ...dayAppointments.map(a => ({ type: 'appt', time: new Date(a.scheduled_at) })),
      ...dayProposals.map(p => ({ type: 'prop', time: new Date(p.slot_start) }))
    ].sort((a, b) => a.time.getTime() - b.time.getTime());

    return allEvents;
  };`;
const getDayEventsReplace = `    // Combine events for rendering pills
    const allEvents = [
      ...dayAppointments.map(a => ({ type: 'appt', time: new Date(a.scheduled_at), raw: a })),
      ...dayProposals.map(p => ({ type: 'prop', time: new Date(p.slot_start), raw: p }))
    ].sort((a, b) => a.time.getTime() - b.time.getTime());

    return allEvents;
  };
  
${panelCode}

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedDate(null); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);
`;
content = content.replace(getDayEventsTarget, getDayEventsReplace);

// 5. Build Slide Out desktop logic and Inline mobile logic
// Re-format Left Column: Add Mobile Inline Panel
const mobilePanelTarget = `            {/* PENDING PROPOSALS SECTION */}`;
const mobilePanelReplace = `            {/* MOBILE INLINE PANEL */}
            {selectedDate && (
              <div className="md:hidden bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-4 animate-in slide-in-from-top-4">
                {renderDetailPanel()}
              </div>
            )}

            {/* PENDING PROPOSALS SECTION */}`;
content = content.replace(mobilePanelTarget, mobilePanelReplace);

// Wrap main page block for Slide Out desktop logic
const returnTopTarget = `      {loading ? (`;
const returnTopReplace = `      <div className="relative">
      {/* DESKTOP SLIDE OUT PANEL */}
      {selectedDate && (
        <>
          <div className="hidden md:block absolute top-0 right-[-32px] bottom-0 w-[380px] z-[100] translate-x-0 animate-in slide-in-from-right-8 duration-200">
            <div className="h-full bg-white border-l border border-gray-200 shadow-2xl rounded-r-none rounded-l-2xl p-6">
               {renderDetailPanel()}
            </div>
          </div>
          <div className="hidden md:block fixed inset-0 z-[90]" onClick={() => setSelectedDate(null)} />
        </>
      )}

      {loading ? (`;
content = content.replace(returnTopTarget, returnTopReplace);

// Close the relative div wrapper at bottom
const returnBotTarget = `        </div>
      )}
    </div>
  );
}`;
const returnBotReplace = `        </div>
      )}
      </div>
    </div>
  );
}`;
content = content.replace(returnBotTarget, returnBotReplace);

// We should hide the right column when panel is open on desktop?
// The prompt says "It should overlay or push the 'Upcoming' right column"
// My absolute positioning with high Z-index inside "relative" overlaying the right column fulfills this cleanly!

fs.writeFileSync('app/bc/calendar/page.tsx', content);
console.log('Successfully added slide out detail panel!');
