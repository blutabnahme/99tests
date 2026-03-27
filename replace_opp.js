const fs = require('fs');

const filePath = 'c:/Blutabnahme/app/bc/opportunities/page.tsx';
let code = fs.readFileSync(filePath, 'utf8');

const replacements = [
  // Header
  ["{t('bc.opportunities')}", "{t('bc.opportunities.title')}"],
  ["Find active cases in your area and manage your applications.", "{t('bc.opportunities.subtitle')}"],
  ["{t('bc.availableCases')}", "{t('bc.opportunities.tabs.available')}"],
  ["{t('bc.myApplications')}", "{t('bc.opportunities.tabs.applications')}"],
  
  // Desktop Filters
  ["<Filter className=\"w-4 h-4\" /> Filters:", "<Filter className=\"w-4 h-4\" /> {t('bc.opportunities.filters.filters')}"],
  ["<option value=\"all\">All Urgencies</option>", "<option value=\"all\">{t('bc.opportunities.filters.allUrgencies')}</option>"],
  ["<option value=\"normal\">Normal</option>", "<option value=\"normal\">{t('bc.opportunities.filters.normal')}</option>"],
  ["<option value=\"urgent\">Urgent</option>", "<option value=\"urgent\">{t('bc.opportunities.filters.urgent')}</option>"],
  ["<option value=\"emergency\">Emergency</option>", "<option value=\"emergency\">{t('bc.opportunities.filters.emergency')}</option>"],
  ["<option value=\"all\">All Visit Types</option>", "<option value=\"all\">{t('bc.opportunities.filters.allVisitTypes')}</option>"],
  ["<option value=\"practice\">Practice Visit</option>", "<option value=\"practice\">{t('bc.opportunities.filters.practiceVisit')}</option>"],
  ["<option value=\"home_visit\">Home Visit</option>", "<option value=\"home_visit\">{t('bc.opportunities.filters.homeVisit')}</option>"],
  
  // Desktop Sort
  ["<ArrowUpDown className=\"w-4 h-4\" /> Sort by:", "<ArrowUpDown className=\"w-4 h-4\" /> {t('bc.opportunities.sort.sortBy')}"],
  ["<option value=\"deadline\">Deadline Soonest</option>", "<option value=\"deadline\">{t('bc.opportunities.sort.deadline')}</option>"],
  ["<option value=\"closest\">Closest Match</option>", "<option value=\"closest\">{t('bc.opportunities.sort.closest')}</option>"],
  ["<option value=\"highest_fee\">Highest Fee</option>", "<option value=\"highest_fee\">{t('bc.opportunities.sort.highestFee')}</option>"],
  ["<option value=\"newest\">Newest Listed</option>", "<option value=\"newest\">{t('bc.opportunities.sort.newest')}</option>"],
  
  // Mobile Sort
  ["<option value=\"deadline\">Sort: Deadline Soonest</option>", "<option value=\"deadline\">{t('bc.opportunities.sort.mobileDeadline')}</option>"],
  ["<option value=\"closest\">Sort: Closest Match</option>", "<option value=\"closest\">{t('bc.opportunities.sort.mobileClosest')}</option>"],
  ["<option value=\"highest_fee\">Sort: Highest Fee</option>", "<option value=\"highest_fee\">{t('bc.opportunities.sort.mobileHighestFee')}</option>"],
  ["<option value=\"newest\">Sort: Newest Listed</option>", "<option value=\"newest\">{t('bc.opportunities.sort.mobileNewest')}</option>"],
  
  // Empty states
  ["Loading opportunities...", "{t('bc.opportunities.states.loading')}"],
  ["{t('bc.noCases')}", "{t('bc.opportunities.states.noCases')}"],
  ["{t('bc.noApplications')}", "{t('bc.opportunities.states.noApplications')}"],
  
  // Withdraw Modal
  ["{t('bc.withdrawConfirm')}", "{t('bc.opportunities.modal.withdrawTitle')}"],
  ["This action cannot be undone.", "{t('bc.opportunities.modal.withdrawDesc')}"],
  ["{t('common.cancel')}", "{t('bc.opportunities.modal.cancel')}"],
  ["{t('bc.withdraw')}", "{t('bc.opportunities.modal.withdrawBtn')}"],
  
  // Detail Modal
  ["<CheckCircle2 className=\"w-3 h-3\" /> Invited by HC", "<CheckCircle2 className=\"w-3 h-3\" /> {t('bc.opportunities.modal.invitedByHc')}"],
  ["Est. Fee", "{t('bc.opportunities.modal.estFee')}"],
  ["Application Window", "{t('bc.opportunities.modal.appWindow')}"],
  ["Details</h3>", "{t('bc.opportunities.modal.details')}</h3>"],
  ["<span className=\"text-gray-500\">Location</span>", "<span className=\"text-gray-500\">{t('bc.opportunities.modal.location')}</span>"],
  ["<span className=\"text-gray-500\">Visit Type</span>", "<span className=\"text-gray-500\">{t('bc.opportunities.modal.visitType')}</span>"],
  ["? 'Practice' : 'Home Visit'", "? t('bc.opportunities.modal.practice') : t('bc.opportunities.modal.homeVisit')"],
  ["<span className=\"text-gray-500\">Urgency</span>", "<span className=\"text-gray-500\">{t('bc.opportunities.modal.urgency')}</span>"],
  ["<span className=\"text-gray-500\">Requested Dates</span>", "<span className=\"text-gray-500\">{t('bc.opportunities.modal.reqDates')}</span>"],
  ["Your Application Log</h3>", "{t('bc.opportunities.modal.appLog')}</h3>"],
  ["Status: {selectedApp ? selectedApp.status : 'Applied'}", "{t('bc.opportunities.modal.status')} {selectedApp ? selectedApp.status : t('bc.opportunities.modal.applied')}"],
  ["On {selectedApp ? new Date(selectedApp.applied_at).toLocaleDateString() : 'recent'}", "{t('bc.opportunities.modal.on')} {selectedApp ? new Date(selectedApp.applied_at).toLocaleDateString() : t('bc.opportunities.modal.recent')}"],
  ["No message provided.", "{t('bc.opportunities.modal.noMessage')}"],
  ["Patient Suggested New Times</h3>", "{t('bc.opportunities.modal.patientSuggested')}</h3>"],
  ["The patient could not make your proposed times and has suggested these instead:", "{t('bc.opportunities.modal.patientText')}"],
  ["<span className=\"text-gray-400 font-normal\">(1 hour)</span>", "<span className=\"text-gray-400 font-normal\">({t('bc.opportunities.modal.oneHour')})</span>"],
  ["Accept This Time", "{t('bc.opportunities.modal.acceptTime')}"],
  ["Suggest Different Times</button>", "{t('bc.opportunities.modal.suggestDiff')}</button>"],
  ["{slot.time || \"Select time\"}", "{slot.time || t('bc.opportunities.modal.selectTime')}"],
  ["Send New Proposals", "{t('bc.opportunities.modal.sendProposals')}"],
  ["Message to Clinic (Optional)</h3>", "{t('bc.opportunities.modal.msgToClinic')}</h3>"],
  ["placeholder=\"e.g. I have extensive experience with elderly patients and available tomorrow morning...\"", "placeholder={t('bc.opportunities.modal.msgPlaceholder')}"],
  ["Propose Your Availability</h3>", "{t('bc.opportunities.modal.proposeAvail')}</h3>"],
  ["Emergency: slots must be within 12 hours", "{t('bc.opportunities.modal.emergencyWarning')}"],
  ["Urgent: slots must be within 48 hours", "{t('bc.opportunities.modal.urgentWarning')}"],
  ["+ Add another time", "{t('bc.opportunities.modal.addTime')}"],
  ["I'm flexible — the patient can suggest other times", "{t('bc.opportunities.modal.flexibleCheckbox')}"],
  ["{applying ? \"Applying...\" : \"Submit Application\"}", "{applying ? t('bc.opportunities.modal.applyingCmd') : t('bc.opportunities.modal.submitCmd')}"],
  [">Close</button>", ">{t('bc.opportunities.modal.close')}</button>"],
  
  // Card
  ["<CheckCircle2 className=\"w-3 h-3\" /> HC Invited", "<CheckCircle2 className=\"w-3 h-3\" /> {t('bc.opportunities.card.hcInvited')}"],
  ["ACTION NEEDED", "{t('bc.opportunities.card.actionNeeded')}"],
  ["Slots Proposed", "{t('bc.opportunities.card.slotsProposed')}"],
  ["Patient Choosing", "{t('bc.opportunities.card.patientChoosing')}"],
  ["New Slots Sent", "{t('bc.opportunities.card.newSlotsSent')}"],
  ["'Scheduled'", "t('bc.opportunities.card.scheduled')"],
  ["'Scheduling Failed'", "t('bc.opportunities.card.failed')"],
  ["<Timer className=\"w-3 h-3 text-gray-500\" /> Applied On", "<Timer className=\"w-3 h-3 text-gray-500\" /> {t('bc.opportunities.card.appliedOn')}"],
  ["Withdraw Application\"", "Withdraw Application\""],
  ["{isApp ? 'View Case' : 'View & Apply'}", "{isApp ? t('bc.opportunities.card.viewCase') : t('bc.opportunities.card.viewApply')}"]
];

for (const [find, rep] of replacements) {
    // using split join to replace all instances
    code = code.split(find).join(rep);
}

fs.writeFileSync(filePath, code);
console.log('Successfully updated page.tsx with translation keys');
