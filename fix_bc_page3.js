const fs = require('fs');

let content = fs.readFileSync('app/bc/opportunities/page.tsx', 'utf8');

// ==== FIX 1: Filter out already-applied cases ====
const hookContent1 = `    if (filterUrgency !== 'all') eligible = eligible.filter((c: any) => c.urgency_level === filterUrgency);
    if (filterMobility !== 'all') eligible = eligible.filter((c: any) => c.mobility === filterMobility);`;

const fix1Patch = `    if (filterUrgency !== 'all') eligible = eligible.filter((c: any) => c.urgency_level === filterUrgency);
    if (filterMobility !== 'all') eligible = eligible.filter((c: any) => c.mobility === filterMobility);

    // Filter out cases where the BC already has an active application
    const appsRes = await fetch('/api/bc/applications');
    if (appsRes.ok) {
       const appsData = await appsRes.json();
       const appliedCaseIds = new Set((appsData.applications || []).filter((a: any) => a.status !== 'withdrawn').map((a: any) => a.case_id));
       eligible = eligible.filter((c: any) => !appliedCaseIds.has(c.id));
    }`;

content = content.replace(hookContent1, fix1Patch);


// ==== FIX 2: Replace Time Select with Expandable Grid ====

// 1. Add state and helper for Time Grid
const hookContent2 = `  const [reproposingSlots, setReproposingSlots] = useState([{ date: '', time: '' }, { date: '', time: '' }, { date: '', time: '' }]);
  const [patientSlots, setPatientSlots] = useState<any[]>([]);
  const [loadingCounter, setLoadingCounter] = useState(false);`;

const fix2StateHelpers = `  const [reproposingSlots, setReproposingSlots] = useState([{ date: '', time: '' }, { date: '', time: '' }, { date: '', time: '' }]);
  const [patientSlots, setPatientSlots] = useState<any[]>([]);
  const [loadingCounter, setLoadingCounter] = useState(false);
  const [openTimeGridId, setOpenTimeGridId] = useState<string | null>(null);

  const updateSlotTime = (idx: number, time: string) => {
    setProposedSlots(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], time };
      return updated;
    });
    setOpenTimeGridId(null);
  };

  const updateReproposingTime = (idx: number, time: string) => {
    setReproposingSlots(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], time };
      return updated;
    });
    setOpenTimeGridId(null);
  };`;

content = content.replace(hookContent2, fix2StateHelpers);

// 2. Replace Time Select in main apply form
const selectOld1 = `<select 
                           value={slot.time}
                           onChange={e => setProposedSlots(prev => { const n = [...prev]; n[idx].time = e.target.value; return n; })}
                           className="flex-1 bg-white border border-[#D4D4D4] rounded-full px-4 py-2 text-[14px] font-body outline-none focus:border-hematch-red focus:ring-[3px] focus:ring-hematch-red/10"
                         >
                           <option value="">Select Time</option>
                           {Array.from({length: 25}, (_, i) => {
                             const hours = Math.floor(i / 2) + 7;
                             const mins = i % 2 === 0 ? '00' : '30';
                             const time = \`\${hours.toString().padStart(2, '0')}:\${mins}\`;
                             return <option key={time} value={time}>{time}</option>;
                           })}
                         </select>`;

const timeGridComponentPropsOut1 = `<div className="flex-1 relative">
                           <button 
                             type="button"
                             onClick={() => setOpenTimeGridId(openTimeGridId === \`proposed-\${idx}\` ? null : \`proposed-\${idx}\`)}
                             className={\`w-full text-left bg-white border border-[#D4D4D4] rounded-full px-4 py-2 text-[14px] font-body outline-none transition-all \${slot.time ? 'text-near-black border-near-black shadow-sm' : 'text-gray-400'}\`}
                           >
                             {slot.time || "Select time"}
                           </button>
                           {openTimeGridId === \`proposed-\${idx}\` && (
                             <div className="absolute top-12 left-0 w-[260px] bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-2">
                               <div className="text-[12px] font-bold text-gray-400 mb-2 px-1 uppercase tracking-wider">Available Times</div>
                               <div className="grid grid-cols-4 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                                 {Array.from({length: 25}, (_, i) => {
                                   const hours = Math.floor(i / 2) + 7;
                                   const mins = i % 2 === 0 ? '00' : '30';
                                   const time = \`\${hours.toString().padStart(2, '0')}:\${mins}\`;
                                   const isSelected = slot.time === time;
                                   return (
                                     <button
                                       key={time}
                                       type="button"
                                       onClick={() => updateSlotTime(idx, time)}
                                       className={\`px-2 py-1.5 rounded-[8px] text-[13px] font-medium transition-all \${
                                         isSelected
                                           ? 'bg-hematch-red text-white shadow-sm ring-2 ring-hematch-red/20'
                                           : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-near-black border border-gray-200'
                                       }\`}
                                     >
                                       {time}
                                     </button>
                                   );
                                 })}
                               </div>
                             </div>
                           )}
                         </div>`;

content = content.replace(selectOld1, timeGridComponentPropsOut1);


// 3. Replace Time Select in Counter-Propose (reproposingSlots)
const selectOld2 = `<select 
                                   value={slot.time}
                                   onChange={e => setReproposingSlots(prev => { const n = [...prev]; n[idx].time = e.target.value; return n; })}
                                   className="flex-1 bg-white border border-[#D4D4D4] rounded-full px-3 py-1.5 text-[13px] font-body outline-none focus:border-hematch-red focus:ring-[2px]"
                                 >
                                   <option value="">Select</option>
                                   {Array.from({length: 25}, (_, i) => {
                                     const hours = Math.floor(i / 2) + 7;
                                     const mins = i % 2 === 0 ? '00' : '30';
                                     const time = \`\${hours.toString().padStart(2, '0')}:\${mins}\`;
                                     return <option key={time} value={time}>{time}</option>;
                                   })}
                                 </select>`;

const timeGridComponentPropsOut2 = `<div className="flex-1 relative">
                                   <button 
                                     type="button"
                                     onClick={() => setOpenTimeGridId(openTimeGridId === \`repropose-\${idx}\` ? null : \`repropose-\${idx}\`)}
                                     className={\`w-full text-left bg-white border border-[#D4D4D4] rounded-full px-3 py-1.5 text-[13px] font-body outline-none transition-all \${slot.time ? 'text-near-black border-near-black shadow-sm' : 'text-gray-400'}\`}
                                   >
                                     {slot.time || "Select time"}
                                   </button>
                                   {openTimeGridId === \`repropose-\${idx}\` && (
                                     <div className="absolute top-10 right-0 md:left-0 md:right-auto w-[240px] bg-white border border-gray-200 rounded-xl shadow-xl z-[150] p-2">
                                       <div className="text-[12px] font-bold text-gray-400 mb-2 px-1 uppercase tracking-wider">Available Times</div>
                                       <div className="grid grid-cols-4 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                                         {Array.from({length: 25}, (_, i) => {
                                           const hours = Math.floor(i / 2) + 7;
                                           const mins = i % 2 === 0 ? '00' : '30';
                                           const time = \`\${hours.toString().padStart(2, '0')}:\${mins}\`;
                                           const isSelected = slot.time === time;
                                           return (
                                             <button
                                               key={time}
                                               type="button"
                                               onClick={() => updateReproposingTime(idx, time)}
                                               className={\`px-1.5 py-1.5 rounded-[8px] text-[12px] font-medium transition-all \${
                                                 isSelected
                                                   ? 'bg-hematch-red text-white shadow-sm ring-2 ring-hematch-red/20'
                                                   : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-near-black border border-gray-200'
                                               }\`}
                                             >
                                               {time}
                                             </button>
                                           );
                                         })}
                                       </div>
                                     </div>
                                   )}
                                 </div>`;

content = content.replace(selectOld2, timeGridComponentPropsOut2);

fs.writeFileSync('app/bc/opportunities/page.tsx', content);
console.log('Successfully patched UI updates.');
