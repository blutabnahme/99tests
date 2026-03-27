const fs = require('fs');

let content = fs.readFileSync('app/bc/opportunities/page.tsx', 'utf8');

// 1. Remove bc_availability imports/stuff
content = content.replace(
  `const [calendarBlocks, setCalendarBlocks] = useState<any[]>([]);\n`, 
  ``
);

content = content.replace(
  `        // Get BC Availability map\n        const { data: blocks } = await supabase.from('bc_availability').select('*').eq('bc_id', user.id);\n        if (blocks) setCalendarBlocks(blocks);\n`,
  ``
);

content = content.replace(
  /  const checkAvailability = \(\) => \{[\s\S]*?  const hasAvailability = selectedCase \? checkAvailability\(\) : true;\n/m,
  ''
);

// 2. State setup for slots
content = content.replace(
  `  const [withdrawAppId, setWithdrawAppId] = useState<string | null>(null);`,
  `  const [withdrawAppId, setWithdrawAppId] = useState<string | null>(null);\n  const [proposedSlots, setProposedSlots] = useState([{ date: '', time: '' }, { date: '', time: '' }, { date: '', time: '' }]);\n  const [isFlexible, setIsFlexible] = useState(false);\n  const [reproposingSlots, setReproposingSlots] = useState([{ date: '', time: '' }, { date: '', time: '' }, { date: '', time: '' }]);\n  const [patientSlots, setPatientSlots] = useState<any[]>([]);\n  const [loadingCounter, setLoadingCounter] = useState(false);`
);

// 3. submitApplication rewrite
content = content.replace(
  /  const submitApplication = async \(\) => \{[\s\S]*?  \};\n/m,
  `  const submitApplication = async () => {
    if (!userId || !selectedCase) return;
    
    // VALIDATION
    const isUrgent = selectedCase.urgency_level === 'urgent';
    const isEmergency = selectedCase.urgency_level === 'emergency';
    
    let validSlots = proposedSlots.filter(s => s.date && s.time);
    
    if (isEmergency && validSlots.length === 0) {
      alert("Emergency cases require at least 1 proposed slot.");
      return;
    }
    if (!isEmergency && validSlots.length < 3) {
      alert("Normal and Urgent cases require 3 proposed slots.");
      return;
    }
    
    const now = new Date();
    const isoSlots = validSlots.map(s => ({ start: new Date(\`\${s.date}T\${s.time}:00\`).toISOString() }));
    
    // Future validation and deadlines
    for (const s of isoSlots) {
       const d = new Date(s.start);
       if (d <= now) {
         alert("All slots must be in the future.");
         return;
       }
       if (isUrgent && d > new Date(now.getTime() + 48 * 60 * 60 * 1000)) {
         alert("Urgent cases require all slots to be within 48 hours.");
         return;
       }
       if (isEmergency && d > new Date(now.getTime() + 12 * 60 * 60 * 1000)) {
         alert("Emergency cases require all slots to be within 12 hours.");
         return;
       }
    }
    
    // Check overlapping identical times
    const uniqueTimes = new Set(isoSlots.map(s => s.start));
    if (uniqueTimes.size !== isoSlots.length) {
       alert("Proposed slots cannot overlap / must be distinct.");
       return;
    }
    
    setApplying(true);
    try {
      // Step A: Apply
      const resA = await fetch(\`/api/cases/\${selectedCase.id}/apply\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bcId: userId, message: applyMessage })
      });

      if (!resA.ok) {
        throw new Error((await resA.json()).error || "Failed to apply");
      }
      
      const applyData = await resA.json();
      
      // Step B: Propose slots
      const resB = await fetch(\`/api/bc/applications/\${applyData.application.id}/propose-slots\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: isoSlots, is_flexible: isEmergency || isUrgent ? false : isFlexible })
      });
      
      if (!resB.ok) {
         alert("Application submitted but time slots failed to save. Please go to My Applications to add your proposed times.");
      } else {
         // Send HC Notification
         await supabase.from('notifications').insert({
           user_id: selectedCase.hc_id,
           type: 'application_received',
           title: 'New Case Application',
           message: \`A blood collector has applied for case \${selectedCase.id}.\`,
           link: \`/dashboard/cases/\${selectedCase.id}\`,
           read: false
         });
      }

      setSelectedCase(null);
      setApplyMessage("");
      setProposedSlots([{ date: '', time: '' }, { date: '', time: '' }, { date: '', time: '' }]);
      setIsFlexible(false);
      await fetchData();

    } catch (e) {
      alert((e as any).message);
    }
    setApplying(false);
  };\n`
);

// 4. Reproposing / Answering Counter actions
content = content.replace(
  `  const handleWithdraw = async (appId: string) => {    `,
  `
  const handleCounterRespond = async (appId: string, action: 'accept' | 'reject', slotId?: string) => {
    setApplying(true);
    try {
       let payload: any = { action };
       if (action === 'accept') payload.slot_id = slotId;
       if (action === 'reject') {
           let validSlots = reproposingSlots.filter(s => s.date && s.time);
           if (validSlots.length !== 3) {
              alert("You must provide exactly 3 new slots to suggest different times.");
              setApplying(false);
              return;
           }
           payload.new_slots = validSlots.map(s => ({ start: new Date(\`\${s.date}T\${s.time}:00\`).toISOString() }));
       }
       
       const res = await fetch(\`/api/bc/applications/\${appId}/respond-counter\`, {
         method: 'POST',
         headers: {'Content-Type': 'application/json'},
         body: JSON.stringify(payload)
       });
       
       if (!res.ok) throw new Error((await res.json()).error || "Failed to respond");
       alert(action === 'accept' ? 'Time accepted! Case booked.' : 'New times suggested');
       
       setSelectedCase(null);
       const r = await fetch('/api/bc/applications');
       if (r.ok) {
          const { applications } = await r.json();
          setMyApplications(applications.map((ap: any) => ({...ap, case: Array.isArray(ap.case) ? ap.case[0] : ap.case})));
       }
    } catch(e) {
       alert((e as any).message);
    }
    setApplying(false);
  };
  
  const handleWithdraw = async (appId: string) => {    `
);

// Fetch patient slots on select case in application
content = content.replace(
  `  useEffect(() => {
    fetchData();
  }, [tab, sortBy, filterUrgency, filterMobility]);`,
  `  useEffect(() => {
    fetchData();
  }, [tab, sortBy, filterUrgency, filterMobility]);
  
  useEffect(() => {
    if (selectedCase && tab === 'applications') {
      const app = myApplications.find(a => a.case_id === selectedCase.id);
      if (app && app.scheduling_status === 'patient_counter_proposed') {
          // fetch slots
          fetch('/api/bc/calendar').then(r => r.json()).then(data => {
              if (data.proposed_slots) {
                  const s = data.proposed_slots.filter((ps: any) => ps.case_application_id === app.id && ps.round === 2 && ps.proposed_by === 'patient');
                  setPatientSlots(s);
              }
          });
      }
    }
  }, [selectedCase, tab]);`
);


// 6. New Apply Options Section instead of just message
const newApplySection = `                <div>
                  <h3 className="text-[13px] font-medium text-near-black uppercase tracking-wider mb-2">Message to Clinic (Optional)</h3>
                  <textarea 
                    value={applyMessage}
                    onChange={e => setApplyMessage(e.target.value)}
                    placeholder="e.g. I have extensive experience with elderly patients and available tomorrow morning..."
                    maxLength={200}
                    className="w-full h-24 bg-[#FFFFFF] border border-[#D4D4D4] px-4 py-2 rounded-xl text-[14px] font-body placeholder-[#9CA3AF] outline-none focus:border-hematch-red focus:ring-[3px] focus:ring-hematch-red/10 transition-all resize-none mb-4"
                  />
                  
                  <h3 className="text-[13px] font-medium text-near-black uppercase tracking-wider mb-2">Propose Your Availability</h3>
                  {(selectedCase.urgency_level === 'emergency') && <p className="text-[12px] text-deep-red mb-2 bg-match-pink/20 px-3 py-1.5 rounded-lg border border-match-pink">Emergency: slots must be within 12 hours</p>}
                  {(selectedCase.urgency_level === 'urgent') && <p className="text-[12px] text-orange-600 mb-2 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200">Urgent: slots must be within 48 hours</p>}
                  
                  <div className="space-y-3">
                    {proposedSlots.slice(0, selectedCase.urgency_level === 'emergency' ? proposedSlots.filter(s=>s.date).length > 0 ? proposedSlots.length : 1 : 3).map((slot, idx) => (
                      <div key={idx} className="flex gap-3">
                         <input 
                           type="date"
                           value={slot.date}
                           onChange={e => setProposedSlots(prev => { const n = [...prev]; n[idx].date = e.target.value; return n; })}
                           className="flex-1 bg-white border border-[#D4D4D4] rounded-full px-4 py-2 text-[14px] font-body outline-none focus:border-hematch-red focus:ring-[3px] focus:ring-hematch-red/10"
                         />
                         <select 
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
                         </select>
                         <div className="flex items-center text-[13px] text-gray-500 bg-gray-50 px-3 rounded-full border border-gray-200 shrink-0">1 hour</div>
                      </div>
                    ))}
                    {(selectedCase.urgency_level === 'emergency' && proposedSlots.filter(s=>s.date).length < 3) && (
                       <button onClick={() => setProposedSlots(prev => [...prev].concat({date: '', time: ''}))} className="text-hematch-red text-[13px] font-medium">+ Add another time</button>
                    )}
                  </div>
                  
                  {selectedCase.urgency_level === 'normal' && (
                     <label className="flex items-center gap-2 mt-4 cursor-pointer">
                        <input type="checkbox" checked={isFlexible} onChange={e => setIsFlexible(e.target.checked)} className="rounded text-hematch-red focus:ring-hematch-red w-4 h-4 border-gray-300" />
                        <span className="text-[14px] text-near-black">I'm flexible — the patient can suggest other times</span>
                     </label>
                  )}
                </div>`;

const messageOld = `                <div>
                  <h3 className="text-[13px] font-medium text-near-black uppercase tracking-wider mb-2">Message to Clinic (Optional)</h3>
                  <textarea 
                    value={applyMessage}
                    onChange={e => setApplyMessage(e.target.value)}
                    placeholder="e.g. I have extensive experience with elderly patients and available tomorrow morning..."
                    maxLength={200}
                    className="w-full h-24 bg-[#FFFFFF] border border-[#D4D4D4] px-4 py-2 rounded-lg text-[14px] font-body placeholder-[#9CA3AF] outline-none focus:border-hematch-red focus:ring-[3px] focus:ring-hematch-red/10 transition-all resize-none"
                  />
                  <div className="text-right text-[11px] text-gray-500 mt-1">{applyMessage.length}/200 chars</div>
                </div>`;

content = content.replace(messageOld, newApplySection);


// Counter-proposal view logic
const patientCounterView = `                <div>
                  <h3 className="text-[13px] font-medium text-near-black uppercase tracking-wider mb-2">Your Application Log</h3>
                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex items-start gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-near-black text-[14px]">Status: {selectedApp ? selectedApp.status : 'Applied'}</div>
                      <div className="text-[12px] text-gray-500 mb-2">On {selectedApp ? new Date(selectedApp.applied_at).toLocaleDateString() : 'recent'}</div>
                      {selectedApp?.bc_message ? (
                        <div className="text-[13px] text-gray-500 italic bg-white p-3 border border-gray-200 rounded-lg">"{selectedApp.bc_message}"</div>
                      ) : (
                        <div className="text-[13px] text-gray-500 italic">No message provided.</div>
                      )}
                    </div>
                  </div>
                  
                  {selectedApp?.scheduling_status === 'patient_counter_proposed' && (
                     <div className="mt-4 border-t border-gray-200 pt-5">
                       <h3 className="text-[13px] font-medium text-hematch-red uppercase tracking-wider mb-3">Patient Suggested New Times</h3>
                       <p className="text-[13px] text-gray-600 mb-4">The patient could not make your proposed times and has suggested these instead:</p>
                       <div className="space-y-3 mb-6">
                         {patientSlots.map((s, idx) => (
                           <div key={idx} className="flex justify-between items-center p-4 rounded-xl border border-gray-200 bg-white hover:border-hematch-red transition-all group">
                             <div className="font-medium text-[14px] text-near-black">
                               {format(new Date(s.slot_start), "EEE, MMM d — h:mm a")} <span className="text-gray-400 font-normal">(1 hour)</span>
                             </div>
                             <button 
                               onClick={() => handleCounterRespond(selectedApp.id, 'accept', s.id)}
                               disabled={applying}
                               className="px-4 py-1.5 rounded-full bg-hematch-red text-white text-[13px] font-bold opacity-0 group-hover:opacity-100 transition-opacity disabled:bg-gray-400"
                             >
                               Accept This Time
                             </button>
                           </div>
                         ))}
                       </div>
                       
                       <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                         <button onClick={() => setLoadingCounter(!loadingCounter)} className="text-[14px] font-bold text-near-black mb-3">Suggest Different Times</button>
                         {loadingCounter && (
                           <div className="space-y-3">
                             {reproposingSlots.map((slot, idx) => (
                              <div key={idx} className="flex gap-3">
                                 <input 
                                   type="date"
                                   value={slot.date}
                                   onChange={e => setReproposingSlots(prev => { const n = [...prev]; n[idx].date = e.target.value; return n; })}
                                   className="flex-1 bg-white border border-[#D4D4D4] rounded-full px-3 py-1.5 text-[13px] font-body outline-none focus:border-hematch-red focus:ring-[2px]"
                                 />
                                 <select 
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
                                 </select>
                              </div>
                            ))}
                            <button 
                               onClick={() => handleCounterRespond(selectedApp.id, 'reject')}
                               disabled={applying}
                               className="mt-2 w-full px-4 py-2 rounded-full bg-deep-red text-white text-[13px] font-bold disabled:bg-gray-400"
                            >
                               Send New Proposals
                            </button>
                           </div>
                         )}
                       </div>
                     </div>
                  )}
                </div>`;

const logOld = `                <div>
                  <h3 className="text-[13px] font-medium text-near-black uppercase tracking-wider mb-2">Your Application Log</h3>
                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-near-black text-[14px]">Status: {selectedApp ? selectedApp.status : 'Applied'}</div>
                      <div className="text-[12px] text-gray-500 mb-2">On {selectedApp ? new Date(selectedApp.applied_at).toLocaleDateString() : 'recent'}</div>
                      {selectedApp?.bc_message ? (
                        <div className="text-[13px] text-gray-500 italic bg-white p-3 border border-gray-200 rounded-lg">"{selectedApp.bc_message}"</div>
                      ) : (
                        <div className="text-[13px] text-gray-500 italic">No message provided.</div>
                      )}
                    </div>
                  </div>
                </div>`;

content = content.replace(logOld, patientCounterView);

// Badges on OpportunityCard
const badgeOld = `             {isApp && appStatus && (
               <span className={\`w-max px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider \${
                 appStatus === 'invited' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' :
                 appStatus === 'applied' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                 appStatus === 'accepted' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                 appStatus === 'rejected' ? 'bg-red-100 text-red-700 border border-red-200' :
                 'bg-gray-100 text-gray-500 border border-gray-200'
               }\`}>
                 {appStatus}
               </span>
             )}`;

content = content.replace(
  `appStatus={app.status}`,
  `appStatus={app.status}\n                   appSchedStatus={app.scheduling_status}`
);

content = content.replace(
  `function OpportunityCard({ c, onClick, isApp, appStatus, appliedAt, onWithdraw }: {`,
  `function OpportunityCard({ c, onClick, isApp, appStatus, appSchedStatus, appliedAt, onWithdraw }: {`
);
content = content.replace(
  `  onWithdraw?: () => void\n}) {`,
  `  appSchedStatus?: string;\n  onWithdraw?: () => void\n}) {`
);

const badgeNewFixed = badgeOld + `\n             {isApp && appSchedStatus && appSchedStatus !== 'pending' && (
               <span className={\`mt-1 w-max px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider \${
                 appSchedStatus === 'patient_counter_proposed' ? 'bg-hematch-red/10 text-hematch-red border border-hematch-red/20' :
                 appSchedStatus === 'patient_picking' ? 'bg-match-pink text-deep-red border border-match-pink' :
                 appSchedStatus === 'scheduled' ? 'bg-signal-teal text-white border border-signal-teal' :
                 'bg-gray-100 text-gray-500 border border-gray-300'
               }\`}>
                 {appSchedStatus === 'patient_counter_proposed' ? 'ACTION NEEDED' : 
                  appSchedStatus === 'bc_proposed' ? 'Slots Proposed' : 
                  appSchedStatus === 'patient_picking' ? 'Patient Choosing' :
                  appSchedStatus === 'bc_reproposing' ? 'New Slots Sent' :
                  appSchedStatus === 'scheduled' ? 'Scheduled' : 'Scheduling Failed'
                 }
               </span>
             )}`;
content = content.replace(badgeOld, badgeNewFixed);

const timeframeRegex = /              \{\!hasAvailability && selectedCase\.preferred_date_from && \([\s\S]*?              \}\)\n/g;
content = content.replace(timeframeRegex, '');


fs.writeFileSync('app/bc/opportunities/page.tsx', content);
console.log("Done patching page.tsx");
