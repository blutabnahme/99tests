const fs = require('fs');

let content = fs.readFileSync('app/bc/opportunities/page.tsx', 'utf8');

// 1. Inject activePeriodTab state into the hook area
const stateHookTarget = `  const [openTimeGridId, setOpenTimeGridId] = useState<string | null>(null);`;
const stateHookReplacement = `  const [openTimeGridId, setOpenTimeGridId] = useState<string | null>(null);
  const [activePeriodTab, setActivePeriodTab] = useState<'morning'|'afternoon'|'evening'>('morning');

  const periods = {
    morning: ['07:00','07:30','08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30'],
    afternoon: ['12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30'],
    evening: ['17:00','17:30','18:00','18:30','19:00']
  };`;
content = content.replace(stateHookTarget, stateHookReplacement);


// 2. Add min attribute to the exact locations
content = content.replace(
  `type="date"\n                                   value={slot.date}`,
  `type="date"\n                                   min={new Date().toISOString().split('T')[0]}\n                                   value={slot.date}`
);

content = content.replace(
  `type="date"\n                           value={slot.date}`,
  `type="date"\n                           min={new Date().toISOString().split('T')[0]}\n                           value={slot.date}`
);


// 3. Render logic for reproposingSlots picker:
const reproposingOuterStart = `<div key={idx} className="flex gap-3">
                                 <input 
                                   type="date"
                                   min={new Date().toISOString().split('T')[0]}
                                   value={slot.date}`;

const reproposingOldWholeBlock = `<div key={idx} className="flex gap-3">
                                 <input 
                                   type="date"
                                   min={new Date().toISOString().split('T')[0]}
                                   value={slot.date}
                                   onChange={e => setReproposingSlots(prev => { const n = [...prev]; n[idx].date = e.target.value; return n; })}
                                   className="flex-1 bg-white border border-[#D4D4D4] rounded-full px-3 py-1.5 text-[13px] font-body outline-none focus:border-hematch-red focus:ring-[2px]"
                                 />
                                 <div className="flex-1 relative">
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
                                 </div>
                              </div>`;

const safeExtract = (str, start) => {
  const i = str.indexOf(start);
  if (i === -1) return null;
  const startToExtract = str.substring(i);
  const endMarker = `                              </div>`;
  const j = startToExtract.indexOf(endMarker);
  if (j === -1) return null;
  return startToExtract.substring(0, j + endMarker.length);
};

const blockR = safeExtract(content, reproposingOuterStart);

const reproposingNewBlock = `<div key={idx} className="flex flex-col gap-2">
                               <div className="flex gap-3">
                                 <input 
                                   type="date"
                                   min={new Date().toISOString().split('T')[0]}
                                   value={slot.date}
                                   onChange={e => setReproposingSlots(prev => { const n = [...prev]; n[idx].date = e.target.value; return n; })}
                                   className="flex-1 bg-white border border-[#D4D4D4] rounded-full px-3 py-1.5 text-[13px] font-body outline-none focus:border-hematch-red focus:ring-[2px]"
                                 />
                                 <button 
                                   type="button"
                                   onClick={() => {
                                     if (openTimeGridId === \`repropose-\${idx}\`) setOpenTimeGridId(null);
                                     else {
                                       setOpenTimeGridId(\`repropose-\${idx}\`);
                                       if (slot.time) {
                                         const h = parseInt(slot.time.split(':')[0]);
                                         setActivePeriodTab(h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening');
                                       } else { setActivePeriodTab('morning'); }
                                     }
                                   }}
                                   className={\`flex-1 text-left bg-white border border-[#D4D4D4] rounded-full px-3 py-1.5 text-[13px] font-body outline-none transition-all \${slot.time ? 'text-near-black border-near-black shadow-sm' : 'text-gray-400'}\`}
                                 >
                                   {slot.time || "Select time"}
                                 </button>
                               </div>
                               
                               {openTimeGridId === \`repropose-\${idx}\` && (
                                 <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm mt-1 animate-in slide-in-from-top-2">
                                   <div className="flex gap-1.5 mb-3 bg-gray-50 p-1 rounded-full w-max border border-gray-100">
                                     {['morning', 'afternoon', 'evening'].map(p => (
                                       <button
                                         key={p}
                                         type="button"
                                         onClick={() => setActivePeriodTab(p as any)}
                                         className={\`capitalize px-4 py-1.5 rounded-full text-[12px] font-semibold transition-all \${activePeriodTab === p ? 'bg-near-black text-white shadow-sm' : 'text-gray-500 hover:text-near-black hover:bg-white'}\`}
                                       >
                                         {p}
                                       </button>
                                     ))}
                                   </div>
                                   <div className="grid grid-cols-3 gap-2">
                                     {periods[activePeriodTab].map(time => {
                                       const isSelected = slot.time === time;
                                       return (
                                         <button
                                           key={time}
                                           type="button"
                                           onClick={() => updateReproposingTime(idx, time)}
                                           className={\`px-3 py-2 rounded-lg text-[13px] font-medium transition-all cursor-pointer \${
                                             isSelected
                                               ? 'bg-hematch-red text-white shadow-sm'
                                               : 'bg-white border border-gray-200 text-gray-600 hover:border-hematch-red hover:text-hematch-red'
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

if (blockR) {
  content = content.replace(blockR, reproposingNewBlock);
} else {
  console.log("Failed to find reproposing block");
}


// 4. Render logic for proposedSlots picker
const proposedOuterStart = `<div key={idx} className="flex gap-3">
                         <input 
                           type="date"
                           min={new Date().toISOString().split('T')[0]}
                           value={slot.date}`;

const blockP = safeExtract(content, proposedOuterStart);

const proposedNewBlock = `<div key={idx} className="flex flex-col gap-2">
                       <div className="flex gap-3">
                         <input 
                           type="date"
                           min={new Date().toISOString().split('T')[0]}
                           value={slot.date}
                           onChange={e => setProposedSlots(prev => { const n = [...prev]; n[idx].date = e.target.value; return n; })}
                           className="flex-1 bg-white border border-[#D4D4D4] rounded-full px-4 py-2 text-[14px] font-body outline-none focus:border-hematch-red focus:ring-[3px] focus:ring-hematch-red/10"
                         />
                         <button 
                             type="button"
                             onClick={() => {
                               if (openTimeGridId === \`proposed-\${idx}\`) setOpenTimeGridId(null);
                               else {
                                 setOpenTimeGridId(\`proposed-\${idx}\`);
                                 if (slot.time) {
                                   const h = parseInt(slot.time.split(':')[0]);
                                   setActivePeriodTab(h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening');
                                 } else { setActivePeriodTab('morning'); }
                               }
                             }}
                             className={\`flex-1 text-left bg-white border border-[#D4D4D4] rounded-full px-4 py-2 text-[14px] font-body outline-none transition-all \${slot.time ? 'text-near-black border-near-black shadow-sm' : 'text-gray-400'}\`}
                           >
                             {slot.time || "Select time"}
                         </button>
                         <div className="flex items-center justify-center text-[13px] text-gray-500 bg-gray-50 px-3 rounded-full border border-gray-200 shrink-0">1 hour</div>
                       </div>
                       
                       {openTimeGridId === \`proposed-\${idx}\` && (
                         <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm mt-1 animate-in slide-in-from-top-2">
                           <div className="flex gap-1.5 mb-3 bg-gray-50 p-1 rounded-full w-max border border-gray-100">
                             {['morning', 'afternoon', 'evening'].map(p => (
                               <button
                                 key={p}
                                 type="button"
                                 onClick={() => setActivePeriodTab(p as any)}
                                 className={\`capitalize px-4 py-1.5 rounded-full text-[12px] font-semibold transition-all \${activePeriodTab === p ? 'bg-near-black text-white shadow-sm' : 'text-gray-500 hover:text-near-black hover:bg-white'}\`}
                               >
                                 {p}
                               </button>
                             ))}
                           </div>
                           <div className="grid grid-cols-3 gap-2">
                             {periods[activePeriodTab].map(time => {
                               const isSelected = slot.time === time;
                               return (
                                 <button
                                   key={time}
                                   type="button"
                                   onClick={() => updateSlotTime(idx, time)}
                                   className={\`px-3 py-2 rounded-lg text-[13px] font-medium transition-all cursor-pointer \${
                                     isSelected
                                       ? 'bg-hematch-red text-white shadow-sm'
                                       : 'bg-white border border-gray-200 text-gray-600 hover:border-hematch-red hover:text-hematch-red'
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

if (blockP) {
  content = content.replace(blockP, proposedNewBlock);
} else {
  console.log("Failed to find proposed block");
}

fs.writeFileSync('app/bc/opportunities/page.tsx', content);
console.log('Successfully applied UX fixes!');
