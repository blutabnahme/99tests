const fs = require('fs');
let content = fs.readFileSync('app/patient/[token]/page.tsx', 'utf8');

// 1. Add proposedSlots to state
content = content.replace(
  `  const [applications, setApplications] = useState<any[]>([]);\n  const [loading, setLoading] = useState(true);`,
  `  const [applications, setApplications] = useState<any[]>([]);\n  const [proposedSlots, setProposedSlots] = useState<any[]>([]);\n  const [loading, setLoading] = useState(true);`
);

// 2. Add counter-proposal states
content = content.replace(
  `  const [customRequestMode, setCustomRequestMode] = useState(false);`,
  `  const [customRequestMode, setCustomRequestMode] = useState(false);\n  const [counterFormOpenFor, setCounterFormOpenFor] = useState<string | null>(null);\n  const [counterSlots, setCounterSlots] = useState([{ date: '', time: '' }, { date: '', time: '' }, { date: '', time: '' }]);\n  const [counterMessage, setCounterMessage] = useState("");`
);

// 3. Inject proposedSlots in API load
content = content.replace(
  `setApplications(enhancedApplications);`,
  `setApplications(enhancedApplications);\n        setProposedSlots(json.proposedSlots || []);`
);

// 4. Update the time formatting and slot generation
// We have `chosenApplication` and `fees` logic later on.
// Let's create `handleSlotSelect`, `handleCounterSubmit`, `handleMessageFallback` handlers around line 280.
const slotHandlers = `
  const handleSlotSelect = async (appId: string, slotId: string) => {
    setSubmittingTime(true);
    try {
      const res = await fetch(\`/api/patient/\${token}/select-slot\`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ application_id: appId, slot_id: slotId })
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to book slot.");
      setStep(5); // Go directly to Payment (Step 5)
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmittingTime(false);
    }
  };

  const handleCounterSubmit = async (appId: string) => {
    const validSlots = counterSlots.filter(s => s.date && s.time);
    if (validSlots.length !== 3) {
      alert("Please provide exactly 3 proposed times.");
      return;
    }
    const isoSlots = validSlots.map(s => ({ start: new Date(\`\${s.date}T\${s.time}:00\`).toISOString() }));
    // Future check
    for (const s of isoSlots) {
       if (new Date(s.start) <= new Date()) {
         alert("All slots must be in the future.");
         return;
       }
    }

    setSubmittingTime(true);
    try {
      const res = await fetch(\`/api/patient/\${token}/counter-propose\`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ application_id: appId, slots: isoSlots })
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to counter propose.");
      window.location.reload();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmittingTime(false);
    }
  };

  const handleMessageFallback = async (appId: string) => {
    if (!counterMessage) return;
    setSubmittingTime(true);
    try {
      const res = await fetch(\`/api/patient/\${token}/scheduling-message\`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ application_id: appId, message: counterMessage })
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to send message.");
      window.location.reload();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmittingTime(false);
    }
  };
`;
content = content.replace(
  `  const handleTimeSubmit = async () => {`,
  `${slotHandlers}\n  const handleTimeSubmit = async () => {`
);

// 5. Replace Step 3 implementation with a dummy fragment since it's merged into Step 2 now, but we don't want to mess up the indexing step counts:
// Actually `step === 3` is the old time picking. We can just empty it.
const step3Regex = /\{\/\* STEP 3: CHOOSE TIME \*\/\}(.|\n)*?\{\/\* STEP 4\/5: REQUEST SENT \(PATH B TERMINAL STATE\) \*\/\}/g;
content = content.replace(step3Regex, '{/* STEP 3 REMOVED - MERGED IN STEP 2 */}\n\n        {/* STEP 4/5: REQUEST SENT (PATH B TERMINAL STATE) */}');


// 6. Rewrite the BC card mapping block inside Step 2
// Look for `applications.map(m => {`
// Let's replace the whole `applications.map(m => { ...` block.
// Wait, replacing a huge block using replace is risky. It's better to construct the component dynamically.

const bcCardOldStart = `              {applications.map(m => {\n                const bc = m.blood_collector;`;
const bcCardOldEnd = `                  </div>\n                );\n              })}\n            </div>\n\n            <Button`;

const safeExtract = (str, start, end) => {
  const i = str.indexOf(start);
  if (i === -1) return null;
  const j = str.indexOf(end, i);
  if (j === -1) return null;
  return str.substring(i, j + end.length);
};

const blockToReplace = safeExtract(content, bcCardOldStart, bcCardOldEnd);

const bcCardNew = `              {applications.map(m => {
                const bc = m.blood_collector;
                const isSelected = selectedApplicationId === m.id;
                const appliedHoursAgo = m.applied_at ? Math.ceil((Date.now() - new Date(m.applied_at).getTime()) / (1000 * 60 * 60)) : 0;
                const distVal = m.calculated_distance === '--' ? 0 : Number(m.calculated_distance || 0);
                const bcHomeVisitFee = Number(bc.home_visit_fee || 0);
                const bcPracticeFee = Number(bc.practice_fee || 0);
                const isHome = caseData?.mobility === 'home' || caseData?.mobility === 'home_visit';
                const baseF = isHome ? bcHomeVisitFee : bcPracticeFee;
                const feeStr = (baseF + (distVal * Number(bc.travel_fee_per_km || 0))).toFixed(2);
                
                const appSlots = proposedSlots.filter(s => s.case_application_id === m.id);
                // Get highest round
                const highestRound = appSlots.reduce((max, s) => Math.max(max, s.round || 1), 1);
                // Filter to display slots
                const displaySlots = appSlots.filter(s => s.round === highestRound && (m.scheduling_status === 'bc_reproposing' ? s.proposed_by === 'bc' : (m.scheduling_status === 'patient_counter_proposed' ? s.proposed_by === 'patient' : true)));
                // Sort by time
                displaySlots.sort((a,b) => new Date(a.slot_start).getTime() - new Date(b.slot_start).getTime());

                const isCounter = m.scheduling_status === 'patient_counter_proposed';
                const isFailed = m.scheduling_status === 'failed';

                return (
                  <div key={m.id} className="p-4 rounded-[20px] transition-all border-2 border-gray-200 bg-white mb-4 shadow-sm relative overflow-hidden group">
                    {m.invited_by_hc && (
                      <div className="absolute top-0 right-0 rounded-bl-xl bg-indigo-100 border-b border-l border-indigo-200 text-indigo-700 text-[10px] font-extrabold px-3 py-1.5 tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> INVITED BY PROVIDER
                      </div>
                    )}
                    
                    {/* Status Banners */}
                    {isCounter && (
                       <div className="mb-4 bg-orange-50 border border-orange-200 rounded-xl p-3 text-[13px] text-orange-800 font-medium animate-pulse">
                          Waiting for {bc.first_name} to respond to your suggested times...
                       </div>
                    )}
                    {isFailed && (
                       <div className="mb-4 bg-gray-100 border border-gray-200 rounded-xl p-3 text-[13px] text-gray-600 font-medium">
                          Message sent to {bc.first_name}. They will suggest new times soon.
                       </div>
                    )}
                    {m.scheduling_status === 'bc_reproposing' && (
                       <div className="mb-4 bg-hematch-red/10 border border-hematch-red/20 rounded-xl p-3 text-[13px] text-deep-red font-bold">
                          New times available from {bc.first_name} — please select one
                       </div>
                    )}

                    <div className="flex gap-4 items-start">
                      <img src={bc.avatar_url || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop"} alt={bc.first_name} className="w-[64px] h-[64px] rounded-full object-cover border-[3px] border-white shadow-sm shrink-0" />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-0.5 mt-1">
                          <div className="font-heading text-[18px] font-medium text-near-black leading-tight">{bc.first_name} {bc.last_name}</div>
                          <div className="text-[14px] font-heading font-medium text-deep-red">
                            €{feeStr}
                          </div>
                        </div>
                        <div className="text-[13px] text-gray-500 mb-2 font-medium">{bc.qualification}</div>
                        
                        <div className="flex items-center gap-2 flex-wrap mb-4 bg-gray-50 p-2 rounded-lg w-fit">
                          <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span className="text-[13px] font-bold text-amber-700">{bc.rating}</span>
                          </div>
                          <span className="text-[12px] font-bold text-steel-700 flex items-center gap-1 border-r border-gray-200 pr-2"><FileText className="w-3.5 h-3.5 opacity-40"/> {bc.total_collections} draws</span>
                          <span className="text-[12px] font-bold text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3 opacity-40"/> {m.calculated_distance} km</span>
                        </div>

                        {/* SLOT SELECTION AREA */}
                        {(!isCounter && !isFailed && m.scheduling_status !== 'scheduled') && (
                          <div className="mt-5 border-t border-gray-200 pt-4">
                            <div className="text-[13px] font-bold text-near-black uppercase tracking-wider mb-3">
                              {m.scheduling_status === 'bc_reproposing' ? 'New Proposed Times' : 'Available Times'}
                            </div>
                            
                            <div className="space-y-2 mb-3">
                              {displaySlots.map(s => {
                                const active = selectedTime === s.id && isSelected;
                                return (
                                  <div key={s.id}>
                                    <div 
                                      onClick={() => { setSelectedTime(s.id); setSelectedApplicationId(m.id); }}
                                      className={\`p-3 rounded-xl border-2 cursor-pointer transition-all flex justify-between items-center group/slot \${
                                        active ? 'border-hematch-red bg-hematch-red/10 ring-2 ring-hematch-red/20' : 'bg-gray-50 border-gray-200 hover:border-hematch-red hover:bg-hematch-red/5'
                                      }\`}
                                    >
                                      <div className={\`text-[14px] font-semibold \${active ? 'text-deep-red' : 'text-near-black'}\`}>
                                        {new Date(s.slot_start).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} — {new Date(s.slot_start).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                                        <span className="text-gray-400 font-normal ml-1">(1 hour)</span>
                                      </div>
                                      <div className={\`w-4 h-4 rounded-full border-2 \${active ? 'border-[5px] border-deep-red' : 'border-gray-300'}\`} />
                                    </div>
                                    
                                    {active && (
                                       <div className="mt-2 bg-white rounded-xl border border-hematch-red p-4 shadow-sm animate-in slide-in-from-top-2">
                                         <div className="text-[14px] font-medium text-near-black mb-3 text-center">
                                           Book <strong>{bc.first_name}</strong> for {new Date(s.slot_start).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at {new Date(s.slot_start).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}?
                                         </div>
                                         <div className="flex gap-2">
                                           <Button disabled={submittingTime} onClick={() => handleSlotSelect(m.id, s.id)} className="flex-1 bg-hematch-red hover:bg-deep-red text-white py-2 rounded-full shadow-md text-[13px]">
                                              Confirm & Continue to Payment
                                           </Button>
                                         </div>
                                       </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            
                            {/* Counter Proposals & Options */}
                            {(caseData?.urgency_level === 'normal' && m.is_flexible && m.scheduling_status !== 'bc_reproposing') && (
                              <div className="mt-4">
                                <div className="text-[12px] text-gray-500 mb-1">This collector is also open to other times</div>
                                <button onClick={() => setCounterFormOpenFor(m.id)} className="text-[13px] font-bold text-hematch-red hover:text-deep-red">
                                  None of these times work? Suggest your own →
                                </button>
                                
                                {counterFormOpenFor === m.id && (
                                   <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-4 animate-in slide-in-from-top-2">
                                      <div className="text-[13px] font-bold text-near-black mb-3">Suggest 3 Alternative Times</div>
                                      <div className="space-y-3 mb-4">
                                        {counterSlots.map((slot, idx) => (
                                          <div key={idx} className="flex gap-2">
                                             <input type="date" value={slot.date} onChange={e => { const n = [...counterSlots]; n[idx].date = e.target.value; setCounterSlots(n); }} className="flex-1 bg-white border border-[#D4D4D4] rounded-lg px-3 py-1.5 text-[13px] font-body outline-none focus:border-hematch-red focus:ring-2" />
                                             <select value={slot.time} onChange={e => { const n = [...counterSlots]; n[idx].time = e.target.value; setCounterSlots(n); }} className="flex-1 bg-white border border-[#D4D4D4] rounded-lg px-3 py-1.5 text-[13px] font-body outline-none focus:border-hematch-red focus:ring-2">
                                               <option value="">Time</option>
                                               {Array.from({length: 25}, (_, i) => {
                                                 const hours = Math.floor(i / 2) + 7;
                                                 const mins = i % 2 === 0 ? '00' : '30';
                                                 const time = \`\${hours.toString().padStart(2, '0')}:\${mins}\`;
                                                 return <option key={time} value={time}>{time}</option>;
                                               })}
                                             </select>
                                          </div>
                                        ))}
                                      </div>
                                      <div className="flex gap-2">
                                        <button onClick={() => setCounterFormOpenFor(null)} className="px-4 py-2 bg-white border border-gray-200 text-gray-500 text-[13px] font-bold rounded-full">Cancel</button>
                                        <button disabled={submittingTime} onClick={() => handleCounterSubmit(m.id)} className="flex-1 px-4 py-2 bg-hematch-red text-white text-[13px] font-bold rounded-full">Send to {bc.first_name}</button>
                                      </div>
                                   </div>
                                )}
                              </div>
                            )}

                            {m.scheduling_status === 'bc_reproposing' && (
                              <div className="mt-4">
                                <button onClick={() => setCounterFormOpenFor(m.id)} className="text-[13px] font-bold text-hematch-red hover:text-deep-red">
                                  These don't work either? Send a message →
                                </button>
                                {counterFormOpenFor === m.id && (
                                  <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
                                    <div className="text-[13px] font-bold text-near-black mb-2">Tell {bc.first_name} what works for you</div>
                                    <textarea value={counterMessage} onChange={e => setCounterMessage(e.target.value)} maxLength={200} placeholder="e.g. I work from home and am flexible +/- 1 hour." rows={3} className="w-full bg-[#FFFFFF] border border-[#D4D4D4] px-4 py-2 rounded-lg text-[14px] font-body outline-none focus:border-hematch-red focus:ring-2 resize-none mb-1" />
                                    <div className="text-[11px] text-gray-500 text-right mb-3">{counterMessage.length}/200</div>
                                    <div className="flex gap-2">
                                      <button onClick={() => setCounterFormOpenFor(null)} className="px-4 py-2 bg-white border border-gray-200 text-gray-500 text-[13px] font-bold rounded-full">Cancel</button>
                                      <button disabled={submittingTime} onClick={() => handleMessageFallback(m.id)} className="flex-1 bg-hematch-red text-white text-[13px] font-bold rounded-full py-2">Send Message</button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {(caseData?.urgency_level === 'emergency' || caseData?.urgency_level === 'urgent') && (
                              <div className="mt-3 text-[12px] text-gray-500 bg-gray-50 p-2 rounded-lg inline-block">
                                For urgent cases, please select from available times or choose another collector.
                              </div>
                            )}
                          </div>
                        )}
                        
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <Button disabled className="hidden"`;

if (!blockToReplace) {
  console.log("Failed to find block matching criteria.");
  process.exit(1);
}

content = content.replace(blockToReplace, bcCardNew);


// Handle old code navigation
content = content.replace(
  `router.push(\`/patient/\${token}/booking?application_id=\${selectedApplicationId}\`)`,
  `console.log('Skipping routing')`
);

// Format date helper in top
const importsOld = `import { Button } from "@/components/ui/Button";`;
const importsNew = `import { Button } from "@/components/ui/Button";\nimport { format } from "date-fns";`;
// wait, format is not imported. We need format.
content = content.replace(importsOld, importsNew);


// Fix Step 4 references to the appointment
content = content.replace(
  `{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at {selectedTime}`,
  `{appointment ? new Date(appointment.scheduled_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : ''} at {appointment ? new Date(appointment.scheduled_at).toLocaleTimeString('en-US', { hour: "numeric", minute: "2-digit" }) : ''}`
);


fs.writeFileSync('app/patient/[token]/page.tsx', content);
console.log("Successfully rebuilt patient portal.");
