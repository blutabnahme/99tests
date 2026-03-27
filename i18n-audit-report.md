# i18n Audit Report — 2026-03-25

## Summary
- EN keys: 261
- DE: 261 present / 0 missing / 4 untranslated (same as EN)
- ES: 261 present / 0 missing / 0 untranslated (same as EN)
- NL: 261 present / 0 missing / 10 untranslated (same as EN)
- FR: 261 present / 0 missing / 7 untranslated (same as EN)

## Missing Keys by Language

### DE — Missing 0 keys

### ES — Missing 0 keys

### NL — Missing 0 keys

### FR — Missing 0 keys

## Untranslated Keys (value same as EN)

### DE — 4 untranslated
- nav.dashboard → "Dashboard"
- nav.team → "Team"
- hcDashboard.title → "Dashboard"
- team.title → "Team"

### ES — 0 untranslated

### NL — 10 untranslated
- nav.dashboard → "Dashboard"
- nav.cases → "Cases"
- nav.team → "Team"
- auth.login → "Log In"
- hcDashboard.title → "Dashboard"
- cases.title → "Cases"
- team.title → "Team"
- team.roleCaseManager → "Case Manager"
- status.open → "Open"
- bc.account → "Account"

### FR — 7 untranslated
- nav.notifications → "Notifications"
- nav.patients → "Patients"
- nav.configuration → "Configuration"
- auth.email → "Email"
- notifications.title → "Notifications"
- settings.documentation → "Documentation"
- admin.configuration → "Configuration"

## Orphaned Keys (exist in target but not in EN)

### DE — 0 orphaned

### ES — 0 orphaned

### NL — 0 orphaned

### FR — 0 orphaned

## Hardcoded Strings
Found 2104 potential hardcoded strings in .tsx files (excluding admin):

### \app\about\page.tsx
- "About Hematch"
- "Building the infrastructure for on-demand healthcare staffing"
- "Hematch is a healthcare marketplace connecting companies with qualified phlebotomists — matching the right collector to every case, everywhere."
- "Countries"
- "Professionals"
- "Since"
- ""We believe every patient deserves timely, professional blood collection — and every phlebotomist deserves fair access to work.""
- "The problem we're solving"
- "The old way"
- "Blood collection is one of the most common medical procedures in the world. Yet the process of finding, booking, and managing phlebotomists remains fragmented, manual, and opaque. Healthcare companies waste hours coordinating with agencies. Phlebotomists lack direct access to opportunities. Patients have no visibility."
- "What we're building"
- "We are building the direct infrastructure connecting healthcare companies with qualified, independent phlebotomists. Real-time matching, transparent scheduling, automated logistics, and a verified network of professionals setting their own rates. We're fixing this."
- "Our approach"
- "Marketplace, not agency"
- "We connect supply and demand directly. No middlemen inflating costs or reducing transparency."
- "Quality through verification"
- "Every collector on our platform is identity-verified, credential-checked, and reviewed by the healthcare companies they work with."
- "Technology-first"
- "Real-time matching, automated scheduling, secure payments, and full audit trails — built from the ground up for healthcare."
- "What we believe"
- "Transparency"
- "See everything, always."
- "Everyone sees the same information. No hidden fees, no surprises."
- "Quality"
- "Fewer, but better."
- "We'd rather have fewer, better collectors than a large unvetted network."
- "Simplicity"
- "Less is more."
- "Healthcare is complex enough. Our platform shouldn't be."
- "Respect"
- "Your terms, your way."
- "For healthcare workers' time, skills, and right to set their own terms."
- "Trusted by leading healthcare companies"
- "Companies trusting Hematch for their blood collection needs."
- "Join the future of healthcare staffing"
- "Register as Company"
- "Join as Collector"

### \app\admin\cases\new\page.tsx
- "([]);
  const [materials, setMaterials] = useState"
- "([]);
  const [patients, setPatients] = useState"
- "([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorString, setErrorString] = useState("");

  // Form States
  const [hcId, setHcId] = useState("");
  const [hcSearch, setHcSearch] = useState("");
  const [showHcDropdown, setShowHcDropdown] = useState(false);
  const [patientMode, setPatientMode] = useState"
- "Initializing Creation Wizard..."
- "Back to Cases"
- "New Case"
- "Create a case on behalf of a Healthcare Company"
- "Healthcare Company"
- "Search Company *"
- "Patient"
- "Use existing patient"
- "Create new patient"
- "First Name *"
- "Last Name *"
- "Email"
- "Phone"
- "Date of Birth *"
- "Case Details"
- "Visit Type *"
- "Practice Visit"
- "Home Visit"
- "Urgency Level *"
- "Service Location Data"
- "Street Address"
- "Postal Code"
- "City"
- "Collector Selection Mode *"
- "Reason for Blood Collection *"
- "Materials (Optional)"
- "sm.id === m.id);
                const isChecked = !!selected;
                return ("
- "No materials available"
- "acc + m.quantity, 0)} items total)`}"
- "Admin Notes (Hidden from participants)"
- "Generating..."
- ") : "Create Case"}"

### \app\admin\cases\page.tsx
- "Emergency"
- ";
      case 'urgent': return"
- "Urgent"
- ";
      default: return"
- "Normal"
- "Case Supervision"
- "Global platform overview of all network blood collections natively"
- "New Case"
- "Status"
- "All"
- "Pending"
- "Matched"
- "Booked"
- "Completed"
- "Cancelled"
- "Urgency"
- "Mode"
- "HC Curates"
- "Patient Decides"
- "Case ID"
- "Patient"
- "Healthcare Co."
- "BC Assigned"
- "Selection Mode"
- "Created"
- "Actions"
- "Loading cases..."
- ") : paginatedCases.length === 0 ? ("
- "No cases found matching filters."
- "Unassigned"
- "Previous"
- "Next"

### \app\admin\cases\[id]\page.tsx
- "Loading Case Data..."
- "b.date.getTime() - a.date.getTime());

  return ("
- "Back to Cases"
- "Case Configuration"
- "Status Override"
- "Created"
- "Pending"
- "Matched"
- "Pending Payment"
- "Booked"
- "Completed"
- "Cancelled"
- "Urgency Level"
- "Normal"
- "Urgent"
- "Emergency"
- "Selection Mode"
- "Patient Decides"
- "Clinic Shortlist"
- "Clinic Approval"
- "Admin Internal Notes"
- ": "Save Changes"}"
- "Patient Record"
- "Name"
- "Email"
- "Not provided"
- "Phone"
- "DOB"
- "View Patient Portal Link"
- "No patient attached."
- "Healthcare Company Reassignment"
- "Assigning HC to:"
- "Reassigning will notify both the current and new Healthcare Company."
- ": "Reassign Network HC"}"
- "Confirmed Appointment"
- "Date"
- "Assigned BC"
- "Financial Transfer"
- "Patient Paid"
- "BC Payout"
- "Platform Commission"
- "VAT (19%)"
- "Paid At"
- "Unpaid"
- "No Blood Collector matching attempts yet."
- "Status Override:"
- "Applied"
- "Accepted"
- "Rejected"
- "Withdrawn"
- "Remove Assignment"
- "Manual BC Assignment"
- ": null}
                   Assign BC"
- "Audit Timeline"
- "No events."
- "System Actions"
- "Cancel Case"
- "Reopen Created"
- "Force Complete"

### \app\admin\components\AdminAlertsSection.tsx
- "Critical System Alerts"
- "Run Alert Check"
- "View All"
- "All clear — no critical alerts"
- "Your system is running smoothly."
- ");
  }

  return ("
- "Take Action"

### \app\admin\config\page.tsx
- "Normal"
- "Urgent"
- "Emergency"
- "Minor"
- "Elderly"
- "Difficult veins"
- "When disabled, these flags are informational only and don't affect pricing."
- "Travel Rate"
- "/km"
- "Min BC Fee"
- "Max BC Fee"
- "Min Payout"
- "Practice Visit"
- "Home Visit"
- "Material Shipping"
- "Return Shipping"
- "VAT Rate"
- "Standard German VAT: 19%. Reduced rate: 7%. Change only if legally required based on billing origin."
- "Add Item"
- "Item Name"
- "Type"
- "Unit Price"
- "Centrifuge"
- "Refrigeration"
- "Status"
- "Edit"
- "No materials found in catalog. Run migration 004 to seed."
- "Refrigerated"
- "No materials found in catalog."
- "Blood Tube"
- "Needle / Butterfly"
- "General Supply"
- "Container"
- "Accessory"
- "Cancel"
- "Platform Commission Rate"
- "Deducted from BC payout. Min payout rule still applies."
- "Unmatched case alert"
- "hours"
- "Scheduling conflict: failed attempts"
- "attempts"
- "Scheduling conflict: max time"
- "BC cancellation threshold"
- "in 30 days"
- "Fallback after"
- "Non-response alert after"
- "days"
- "Global Rate Limit"
- "req/min"
- "Webhook URLs are configured per-Healthcare Provider in their individual company settings."
- "Events dispatched:"
- "case.matched"
- "case.bc_selected"
- "case.completed"
- "shortlist.sent"
- "Webhook delivery logs are available in the API Logs database view."
- ");

  return ("
- "Configuration"
- "Manage platform pricing, fees, materials, limits, and behavior."

### \app\admin\faq\page.tsx
- "([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState"
- "("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState"
- "(null);
  const [saving, setSaving] = useState(false);
  
  // Translation Tab State
  const [activeLang, setActiveLang] = useState"
- "FAQ Management"
- "Manage frequently asked questions displayed on the public FAQ page."
- "Add Question"
- "All"
- "All Categories"
- "Loading FAQs..."
- ") : filteredFaqs.length === 0 ? ("
- "No FAQs found in this category."
- "Not translated"
- "Category *"
- "Sort Order"
- "Published Status"
- "Will this be visible on the public FAQ page?"
- "Cancel"
- "}
                  Save Question"

### \app\admin\financial\page.tsx
- "([]);
  const [cases, setCases] = useState"
- "([]);
  const [refunds, setRefunds] = useState"
- "([]);
  
  // Filter State
  const [dateFilter, setDateFilter] = useState"
- "('30d');
  const [breakdownView, setBreakdownView] = useState"
- "Financial & Analytics Overview"
- "Consolidated revenue, platform performance, and spatial distributions."
- "Export PDF"
- "Generate Invoices"
- "Showing Sample Data"
- "You are viewing a demonstration of the analytics engine using generated placeholder cases because your database does not yet have enough completed payments."
- "Revenue Trend"
- "Gross patient payments vs Net platform revenue over time."
- "Revenue Composition"
- "Sources of platform net revenue."
- "Top Healthcare Accounts by Spend"
- "15 ? payload.value.substring(0,15)+'...' : payload.value;
                      return ("
- "VAT Summary"
- "Estimated Value Added Tax collected."
- "Based on processed payments"
- "Revenue Breakdown"
- "Weekly"
- "Monthly"
- "Date Range"
- "Cases"
- "Patient Pay"
- "BC Payouts"
- "Commission"
- "Org Fees"
- "Material"
- "Logistics"
- "Refunds"
- "Net Rev"
- "Loading data..."
- ") : breakdownData.length === 0 ? ("
- "0 && !loading && ("
- "Total"
- "a + b.cases, 0) as number}"
- "a + b.patientPayments, 0) as number).toFixed(2)}"
- "a + b.bcPayouts, 0) as number).toFixed(2)}"
- "a + (p.material_revenue || 0), 0).toFixed(2)}"
- "a + (p.logistics_revenue || 0), 0).toFixed(2)}"
- "No data available"
- "Pending BC Payouts"
- "Action Required"
- "Release All"
- "Blood Collector"
- "Next Payout Date"
- "Outstanding Balance"
- "Action"
- ") : pendingPayoutsList.length === 0 ? ("
- "No pending payouts at this time."
- "Release Payout"
- "Loading..."
- "Loading analytics..."
- "Showing sample data — real data will appear as more cases are processed."

### \app\admin\insights\page.tsx
- "0;
  if (smallerIsBetter) isPositive = !isPositive;

  return ("
- "= 1 && (isPositive ?"
- "No prior period"
- "([]);
  const [applications, setApplications] = useState"
- "([]);
  const [payments, setPayments] = useState"
- "([]);
  const [appointments, setAppointments] = useState"
- "([]);
  const [refunds, setRefunds] = useState"
- "= start && d"
- "c.status === 'completed').length, color: '#dc2626' },
  ];

  // Section 4 BC Selection modes Donut
  const bcModesCount = currentData.cases.reduce((acc: Record"
- "= start && cd"
- "= start && pd"
- "No data yet"
- "Cases and metrics will appear here as your platform grows."
- ");
  }

  return ("
- "This Week"
- "This Month"
- "30 Days"
- "90 Days"
- "This Year"
- "All Time"
- "Review →"
- "Active Users"
- "Math.max(25, (val / baseCount) * 100);
              
              const topWidth = isFirst ? 100 : getW(count);
              const bottomWidth = isLast ? getW(count) : getW(nextCount);

              return ("
- "No cases in this period"
- "Reduce cancellations by improving match speed."
- "No data for this period."
- "High Output Collectors"
- "BC ID"
- "Cases Done"
- "Total Earnings (€)"
- "No completed cases yet."
- "Top collectors will appear as cases are completed."
- "Matching Performance"
- "Total Apps"
- "Acceptance Rate"
- "Avg Apps per Case"
- "Time to First App"

### \app\admin\notifications\page.tsx
- "([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState"
- ";
      case "application_received": return"
- ";
      case "application_accepted": return"
- ";
      case "application_rejected": return"
- ";
      case "case_update": return"
- ";
      case "shortlist_ready": return"
- ";
      case "appointment_reminder": return"
- ";
      case "payment_received": return"
- ";
      case "system_alert": return"
- ";
      default: return"
- "Manage your platform alerts and activities."
- "0 ? "Mark Selected" : "Mark All Read"}"
- "0 ? "Clear Selected" : "Clear Resolved"}"
- "!n.read).length}"
- "Select All"
- "!n.read).length})` : ''}"
- ") : currentItems.length === 0 ? ("
- "No notifications yet"
- "When something important happens, you will see it here."
- "New"
- "Resolve"
- "Resolved"
- "View"
- "Showing"
- "to"
- "of"
- "notifications"

### \app\admin\page.tsx
- "0;
  return ("
- "Welcome back. Here is the current state of Hematch."
- "System Status: Operational"
- "Geographic Demand (Heatmap)"
- "Filter Region"
- "Map integration pending."
- "Will display density of cases vs BC density to identify expansion targets."
- "Review queue & docs"
- "Cases"
- "Manage active network"
- "Global pricing rules"
- "View All"
- "updated status to"
- "No recent cases found."
- "System Event"
- "Triggered Backup routine"
- "2 hours ago • Automated"

### \app\admin\templates\page.tsx
- "([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState"
- "(null);
  const [savingId, setSavingId] = useState"
- "(null);
  const [successId, setSuccessId] = useState"
- "(null);
  const [editState, setEditState] = useState"
- "t.category === filter);

  if (loading) return"
- "Loading templates..."
- ";

  return ("
- "Notification Templates"
- "Manage notification texts across all languages and channels."
- ")) : null}"
- "Channels"
- "Email"
- "SMS"
- "WhatsApp"
- "In-App Portal"
- "Multi-language Content"
- "Subject Line"
- "Body Content"
- "Cancel"
- ") : isSuccess ? ("
- "Saved"
- "Save Template"

### \app\admin\users\CreateUserModal.tsx
- "("admin");
  const [loading, setLoading] = useState(false);
  const [errorString, setErrorString] = useState("");
  const [successData, setSuccessData] = useState"
- "(null);
  const [copied, setCopied] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  
  // HC Fields
  const [companyName, setCompanyName] = useState("");
  const [companyType, setCompanyType] = useState("practice");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");

  // BC Fields
  const [practiceFee, setPracticeFee] = useState("");
  const [homeVisitFee, setHomeVisitFee] = useState("");

  // Patient Fields
  const [selectedHc, setSelectedHc] = useState("");
  const [selectedHcName, setSelectedHcName] = useState("");
  const [hcSearchTerm, setHcSearchTerm] = useState("");
  const [showHcDropdown, setShowHcDropdown] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [insuranceNumber, setInsuranceNumber] = useState("");
  const [hcs, setHcs] = useState"
- "User Created Successfully"
- "Name"
- "Email"
- "Role"
- "Temporary Password"
- "Copied!"
- "Copy"
- "A password reset email has been sent to"
- "Done"
- ");
  }

  return ("
- "Create New User"
- "Select Role"
- "Full Name *"
- "Email Address *"
- "Company Name *"
- "Company Type *"
- "Practice"
- "Lab"
- "Hospital"
- "Clinic"
- "City"
- "Contact Phone"
- "Phone Number"
- "Practice Fee (€)"
- "Home Visit Fee (€)"
- "Healthcare Company"
- "(optional)"
- "No companies found"
- "Date of Birth"
- "Insurance Details"
- "Provider"
- "Insurance Number"
- "Send credentials via email to the user"
- "The user will receive their login credentials at the email address provided."
- "Cancel"
- "Creating..."
- ") : "Create User"}"

### \app\admin\users\HcApiSettingsModal.tsx
- "(null);
  const [logs, setLogs] = useState"
- "([]);
  const [loading, setLoading] = useState(true);
  
  const [newKey, setNewKey] = useState"
- "(null);
  const [copied, setCopied] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [rateLimit, setRateLimit] = useState(100);

  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookLogs, setWebhookLogs] = useState"
- "([]);
  const [newWhSecret, setNewWhSecret] = useState"
- "API Management"
- "View API Documentation"
- "Loading Configuration..."
- "New API Key Generated Successfully"
- "Store this key securely. For security reasons,"
- "it will not be shown again"
- ". If you lose it, you must generate a new one."
- "Authentication Integrity"
- "The active access token prefix tied to this account."
- "Re-Generate Key"
- "API Access Status"
- "Rate Limit (per min)"
- "Automated Webhooks"
- "Push real-time REST payloads to your internal HIS or routing engines."
- "Webhook URL"
- "HMAC-SHA256 Signing Secret"
- "Generate Secret"
- "Copy this Secret immediately! It will never be displayed in plain text again once you close this modal."
- "Recent API Activity"
- "Time"
- "Method"
- "Endpoint"
- "Status"
- "No recent audit logs recorded."
- "Webhook Delivery History"
- "Event"
- "Attempts"
- "No recent webhook deliveries recorded."

### \app\admin\users\page.tsx
- "([]);
  const [bcs, setBcs] = useState"
- "([]);
  const [patients, setPatients] = useState"
- "([]);
  const [admins, setAdmins] = useState"
- "([]);
  const [currentUserId, setCurrentUserId] = useState"
- "('');
  
  // UI states
  const [activeTab, setActiveTab] = useState"
- "(null);
  const [apiModal, setApiModal] = useState"
- "(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState"
- "item.name?.toLowerCase().includes(lower) || 
      item.id?.toLowerCase().includes(lower) ||
      item.hcName?.toLowerCase().includes(lower) ||
      item.email?.toLowerCase().includes(lower)
    );
  };

  const filteredHcs = filterBySearch(hcs);
  const filteredBcs = filterBySearch(bcs);
  const filteredPatients = filterBySearch(patients);
  const filteredAdmins = filterBySearch(admins);

  // Pagination logic
  const currentFilteredItems = activeTab === 'hc' ? filteredHcs : activeTab === 'bc' ? filteredBcs : activeTab === 'patient' ? filteredPatients : filteredAdmins;
  const totalPages = Math.ceil(currentFilteredItems.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, currentFilteredItems.length);

  const paginatedHcs = filteredHcs.slice(startIndex, startIndex + itemsPerPage);
  const paginatedBcs = filteredBcs.slice(startIndex, startIndex + itemsPerPage);
  const paginatedPatients = filteredPatients.slice(startIndex, startIndex + itemsPerPage);
  const paginatedAdmins = filteredAdmins.slice(startIndex, startIndex + itemsPerPage);

  return ("
- "Users Management"
- "Manage your network of Healthcare Companies, Blood Collectors, and Patients."
- "New User"
- "Fetching directory data..."
- ") : activeTab === "hc" ? ("
- "Company Name"
- "Type"
- "Status"
- "Cases"
- "Total Spend"
- "Registration Date"
- "Actions"
- "No healthcare companies found."
- ") : activeTab === "bc" ? ("
- "Collector Name"
- "Qualification"
- "Rating"
- "Collections"
- "Comm. Rate"
- "Joined"
- "No blood collectors found."
- ": 'Default'}"
- ") : activeTab === "patient" ? ("
- "Patient Name"
- "Linked HC"
- "Lifetime Cases"
- "No patients found."
- "Name"
- "Email"
- "Created"
- "Last Login"
- "No admin users found."
- "Never"
- ") : activeTab === "hc" ? (
             filteredHcs.length === 0 ? ("
- ")
          ) : activeTab === "bc" ? (
             filteredBcs.length === 0 ? ("
- ")
          ) : activeTab === "patient" ? (
             filteredPatients.length === 0 ? ("
- ")
          ) : (
             filteredAdmins.length === 0 ? ("
- "Previous"
- "Next"
- "You are about to modify the platform access for"
- "Suspending this user will immediately block their authentication session and prevent them from interacting with new or existing cases."
- "Cancel"
- "Delete User"
- "Are you sure you want to delete"
- "? This action cannot be undone."
- "View Details"
- "Edit Profile"
- "Webhooks & API"
- "Req. Verification"
- "Reset Password"
- "Unsuspend User"
- "Suspend User"

### \app\api-docs\page.tsx
- "Hematch"
- "Developer API"
- "API access requires an API key generated from your Settings page. Contact your Hematch account manager to enable API access."

### \app\bc\appointments\page.tsx
- "Dashboard"
- "Appointments"
- "Manage your schedule and past visits."
- "View Details"
- "No appointments found"

### \app\bc\appointments\[id]\page.tsx
- "(null);
  const [error, setError] = useState"
- "(null);

  // BC Checklist State
  const [equipmentReady, setEquipmentReady] = useState(false);
  const [materialsReady, setMaterialsReady] = useState(false);
  const [transportReady, setTransportReady] = useState(false);
  const allChecked = equipmentReady && materialsReady && transportReady;
  
  const [savingChecklist, setSavingChecklist] = useState(false);

  // Completion Form State
  const [tubesCollected, setTubesCollected] = useState"
- "(0);
  const [issuesEncountered, setIssuesEncountered] = useState"
- "('none');
  const [issuesNotes, setIssuesNotes] = useState"
- "Loading appointment details..."
- ";
  if (error || !appt) return"
- "Back to Appointments"
- "Cancel Appointment"
- "Home Visit"
- "Scheduled For"
- "Call Patient"
- "Navigate"
- "Special Case Flags"
- "Minor Patient"
- "A legal guardian must be present to confirm consent before the draw."
- "Difficult Veins"
- "Use a butterfly needle if necessary. Ensure the patient is kept warm and hydrated."
- "Required Tests & Labs"
- "Preferred Laboratory"
- "Collection Status"
- "The appointment date has arrived. Please confirm if the blood collection was completed successfully."
- "Confirm Collection"
- "Collection Complete"
- "Payout confirmed — will be processed in next batch"
- "Pending final HC confirmation before payout."
- "You're All Set"
- "Your preparation checklist is complete. Proceed to the appointment when ready."
- "Pre-Appointment Checklist"
- "Confirm you have all necessary items before departing."
- "Equipment Ready"
- "Needles, vacutainers, tourniquet, bandages."
- "Materials Verified"
- "Checked labels match the requested tests."
- "Transport Prep"
- "Cooling containers and logistics labels printed."
- "Waiting for Patient"
- "Patient has not confirmed their preparation."
- "Display Address Map"
- "Complete Appointment"
- "Record details before leaving."
- "Tubes collected"
- "Issues Encountered"
- "None - Smooth collection"
- "Difficult vein"
- "Patient fainted/dizzy"
- "Insufficient sample volume"
- "Other"
- "Notes on issues"
- "Sample is secure"
- "I confirm that all tubes are labeled and placed in the secure transport container."
- "Cancel Appointment?"
- "This action cannot be undone. Please provide a reason for the cancellation."
- "Keep it"

### \app\bc\calendar\page.tsx
- "(startOfDay(new Date()));
  const [proposedSlots, setProposedSlots] = useState"
- "([]);
  const [appointments, setAppointments] = useState"
- "Today"
- "1 ? 's' : ''}`}"
- "Nothing scheduled"
- "This day is free"
- "Appointment"
- "Patient"
- "Case Token"
- "Scheduled"
- "Proposed Slot"
- "Waiting for patient"
- "Your proposed times and confirmed appointments"
- "Your schedule is clear"
- "Applied cases and confirmed appointments will appear here"
- "Browse opportunities"
- ");
  }

  return ("
- "Loading schedule..."
- "Proposed"
- "Pending Proposals"
- "No active negotiations"
- "Go to Opportunities →"
- "s.round))}"
- "Patient suggested new times — respond in Opportunities"
- "Waiting for patient to choose"

### \app\bc\components\ConfirmCollectionModal.tsx
- "Confirm Blood Collection"
- "Collection Confirmed"
- "The case has been marked as completed successfully."
- "Collection completed successfully?"
- "Yes"
- "No (Patient issue or access blocked)"
- "Number of tubes collected"
- "Notes (optional)"
- "Any issues during collection?"
- "Cancel"
- ") : "Confirm Completion"}"

### \app\bc\earnings\BankDetailsForm.tsx
- "Bank Details"
- "Saved Successfully"
- "Account Holder Name"
- "IBAN"
- "AES-256 Encrypted"

### \app\bc\earnings\page.tsx
- ": trendUp === false ?"
- "Track your payouts, commission metrics, and manage your bank details."
- "Export CSV"
- "Completed Cases Breakdown"
- "Date"
- "Case"
- "Fee Gross"
- "Commission"
- "Net Payout"
- "Status"
- "No completed cases yet."
- "Batch Payout History"
- "Historically cleared payouts sent to your bank account."
- "Period"
- "Cases"
- "Net Amount"
- "Remittance Ref"
- "No historic payouts available."
- "Your Commission Rate"
- "Contact Partnership Support"

### \app\bc\opportunities\page.tsx
- "('available');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState"
- "(null);
  
  const [availableCases, setAvailableCases] = useState"
- "([]);
  const [myApplications, setMyApplications] = useState"
- "([]);
  const [bcProfile, setBcProfile] = useState"
- "(null);
  
  // Filters & Sorting for Available
  const [sortBy, setSortBy] = useState"
- "('deadline');
  const [filterUrgency, setFilterUrgency] = useState"
- "('all');
  const [filterMobility, setFilterMobility] = useState"
- "('all');
  
  // Detail View Modal State
  const [selectedCase, setSelectedCase] = useState"
- "(null);
  const [applyMessage, setApplyMessage] = useState("");
  const [applying, setApplying] = useState(false);
  const [withdrawAppId, setWithdrawAppId] = useState"
- "([]);
  const [loadingCounter, setLoadingCounter] = useState(false);
  const [openTimeGridId, setOpenTimeGridId] = useState"
- "(null);
  const [activePeriodTab, setActivePeriodTab] = useState"
- "Find active cases in your area and manage your applications."
- "Filters:"
- "All Urgencies"
- "Normal"
- "Urgent"
- "Emergency"
- "All Visit Types"
- "Practice Visit"
- "Home Visit"
- "Sort by:"
- "Deadline Soonest"
- "Closest Match"
- "Highest Fee"
- "Newest Listed"
- "Sort: Deadline Soonest"
- "Sort: Closest Match"
- "Sort: Highest Fee"
- "Sort: Newest Listed"
- "Loading opportunities..."
- ") : tab === 'available' ? ("
- "This action cannot be undone."
- "a.case_id === selectedCase.id) : null;
            return ("
- "Invited by HC"
- "Est. Fee"
- "Application Window"
- "Details"
- "Location"
- "Visit Type"
- "Urgency"
- "Requested Dates"
- "Your Application Log"
- "No message provided."
- "Patient Suggested New Times"
- "The patient could not make your proposed times and has suggested these instead:"
- "(1 hour)"
- "Accept This Time"
- "Suggest Different Times"
- "Send New Proposals"
- "Message to Clinic (Optional)"
- "Propose Your Availability"
- "Emergency: slots must be within 12 hours"
- "Urgent: slots must be within 48 hours"
- "1 hour"
- "s.date).length"
- "+ Add another time"
- "I'm flexible — the patient can suggest other times"
- "Close"
- "HC Invited"
- "Applied On"
- "Withdraw"

### \app\bc\page.tsx
- "now && aptDate"
- "0;

  return ("
- ". Here is your operational status."
- "Today's Appointments"
- "View all"
- "Status"
- "Open"
- "No appointments scheduled for today."
- "Upcoming (Next 7 Days)"
- "View"
- "No other upcoming appointments this week."
- "Recent Past"
- "Awaiting rating"
- "No past appointments yet."
- "Earnings Snapshot"
- "View full report"
- "No earnings data yet"
- "Complete your first appointment to see your monthly chart."
- "Next Payout"
- "Scheduled"
- "Expected approx. 1st of next month"
- "Last Payout"

### \app\bc\profile\components\AvatarUploadClient.tsx
- "(null);
  
  // State
  const [imageUrl, setImageUrl] = useState"
- "(null);
  const [errorMsg, setErrorMsg] = useState"
- "(null);

  const handleFileChange = (e: React.ChangeEvent"
- "Adjust Avatar"
- "Zoom"
- "Cancel"
- "Saving..."
- ": "Save Photo"}"

### \app\bc\profile\components\BcProfileModals.tsx
- "Edit Personal Details"
- "First Name *"
- "Last Name *"
- "Public Email *"
- "Phone Number"
- "Bio"
- "Cancel"
- ");

    return ("
- "Edit Professional Profile"
- "Qualification"
- "Select..."
- "MFA"
- "Doctor"
- "Nurse"
- "Paramedic"
- "Special Experience"
- "Equipment"
- "Edit Service & Pricing"
- "Base Address"
- "Street Address *"
- "Postal Code *"
- "City *"
- "Travel Radius"
- "Pricing Base Rates"
- "Practice Visit (€) *"
- "Home Visit (€) *"
- ");
  };

  return ("

### \app\bc\profile\page.tsx
- "Profile Not Found"
- "It looks like your Blood Collector profile hasn't been completely set up yet. Please complete the registration process to access your dashboard."
- "Sign Out & Complete Profile"
- "Your profile is incomplete"
- "Complete all sections to start receiving matched opportunities."
- "Manage your professional profile and service details."
- "Active"
- "Collections"
- "Average Rating"
- "Full Name"
- "Email"
- "Phone"
- "Bio"
- "No bio yet."
- "Qualification"
- "Special Experience"
- "c.toUpperCase());
                  
                  return ("
- "No special experience stated."
- "Equipment"
- "No equipment stated."
- "Base Address"
- "Travel Radius"
- "0 km"
- "50 km"
- "Base Fees"
- "Practice Visit"
- "Home Visit"
- "No visits offered yet."

### \app\bc\settings\components\BcSettingsClient.tsx
- "(null);

  const [resettingPassword, setResettingPassword] = useState(false);
  const [resetStatus, setResetStatus] = useState"
- "Service Preferences"
- "Choose the types of collections you want to offer to patients."
- "I offer Practice Visits"
- "Patients can come to my physical location."
- "I offer Home Visits"
- "I travel to the patient's location."
- "Notification Preferences"
- "Choose how you want to be alerted about account activity."
- "Event"
- "Email"
- "SMS"
- "Language"
- "Interface language."
- "Translations are being progressively added. Some pages may appear in English."
- "Account & Security"
- "Manage your password and account status."
- "Password"
- "Receive a link to reset your password."
- "Danger Zone"
- "Deactivating your account will hide your profile from all matching algorithms and cancel all pending requests. Historical completed appointment data will be retained for tax purposes."
- "Deactivate my account"
- "Coming soon — GDPR compliance"

### \app\bc\settings\page.tsx
- "Manage your notifications, language, and account security."

### \app\contact\page.tsx
- "Contact"
- "Get in touch"
- "Have questions about Hematch? We'd love to hear from you."
- "Message Sent!"
- "Thank you! We'll get back to you within 24 hours."
- "Send another message"
- "Name*"
- "Email*"
- "Company"
- "Subject*"
- "Select a subject..."
- "General inquiry"
- "Healthcare Company inquiry"
- "Blood Collector inquiry"
- "Partnership opportunity"
- "Technical support"
- "Other"
- "Message*"
- "Send Message"
- "Email"
- "contact@hematch.com"
- "Response time"
- "We typically respond within 24 hours"
- "Office hours"
- "Monday — Friday, 9:00 — 18:00 CET"
- "Location"
- "Frankfurt, Germany"
- "We're a Frankfurt-based team building the future of healthcare staffing."
- "Quick answers"
- "How do I register?"
- "Visit our registration page to create a free account as a healthcare company or blood collector."
- "Is Hematch available in my area?"
- "Hematch currently operates across Germany. EU expansion is planned."
- "How does verification work?"
- "After registration, submit your credentials. Our team reviews and verifies within 1-2 business days."

### \app\dashboard\bc\requests\page.tsx
- "Custom Time Requests"
- "Review and respond to patients who proposed custom booking times."
- "No pending requests"
- "You don't have any custom time requests at the moment."

### \app\dashboard\billing\InvoiceHistoryTable.tsx
- "(prev === id ? null : id));
  };

  return ("
- "Invoice History"
- "Invoice"
- "Period"
- "Cases"
- "Org Fees"
- "Mat/Log Fees"
- "Subtotal"
- "VAT"
- "Total"
- "Status"
- "Action"
- "PDF"
- "Included Cases"
- "Date"
- "Patient"
- "Visit"
- "Tests"
- "Fee (Excl. VAT)"
- "No isolated case data available for this legacy invoice."
- "No historical invoices available."
- "Download PDF"

### \app\dashboard\billing\page.tsx
- "Billing"
- "Track your invoices and accumulated fees."
- "Current Period Tally"
- "Live"
- "Accumulated Org Fees"
- "Materials (Labs/Sticks)"
- "Logistics & Shipping"
- "Projected Subtotal"
- "Estimated VAT (19%)"
- "Projected Total"
- "Payment Methods"
- "Add a credit card or SEPA direct debit mandate to automatically settle invoices at the end of each billing cycle."
- "Add Payment Method"

### \app\dashboard\cases\new\page.tsx
- "(null);

  // Reference Data from Supabase
  const [catalog, setCatalog] = useState"
- "([]);
  const [platformConfig, setPlatformConfig] = useState"
- "([]);
  const [bcSearchQuery, setBcSearchQuery] = useState("");
  const [bcSearchResults, setBcSearchResults] = useState"
- "0 || firstName !== "" || labGroups[0].lab !== "";

  return ("
- "Dashboard"
- "Cases"
- "New Case"
- "Create New Case"
- "Submit a blood collection request for your patient."
- "Your Cost Estimate"
- "Organization Fee"
- "Materials"
- "Total"
- "Your estimate will update as you complete each step."
- "Material Shipping"
- "(&rarr;)"
- "Lab Return"
- "Total (excl. VAT)"
- "This amount will be added to your monthly invoice."
- "Handling Requirements:"
- "Centrifuge required"
- "Refrigeration required"
- "Searching existing records..."
- "Type an email and click away to auto-fill details if this patient already exists."
- "Existing patient found"
- "— details auto-filled. You can edit if needed."
- "First Name"
- "Last Name"
- "Date of Birth"
- "Gender"
- "Address"
- "Phone"
- "Insurance Type (Optional)"
- "Patient is under 18 — guardian required"
- "A legal guardian must be present during the blood draw."
- "Primary Guardian Name"
- "Second Guardian"
- "(optional)"
- "Test Requirements"
- "Specify the tests and target laboratories."
- "c.name).join(", ");

                return ("
- "&times;"
- "1 ? idx + 1 : ""}"
- "Required Tubes & Supplies"
- "Loading catalog..."
- "!selectedMaterialIds.includes(c.id));

                             return ("
- "Select tube/supply..."
- "c.id === m.item_id);
                                   if (!cat) return null;
                                   if (!cat.requires_centrifuge && !cat.requires_refrigeration) return null;

                                   return ("
- "Centrifuge"
- "Refrigerated"
- "Supply via Hematch"
- "c.id === m.item_id)?.price.toFixed(2)}/unit"
- "Remove"
- "Add Tube / Supply"
- "⚠️ Handling Requirements:"
- "Add Another Laboratory"
- "Materials supplied via Hematch include a flat shipping fee of €8.50 per case, added to your cost estimate."
- "Patient Mobility"
- "Urgency Level"
- "Urgent and emergency scheduling are not available when materials are supplied via Hematch, as preparation requires 3 business days."
- "Requested Timeframe"
- "Based on the active urgency, we recommend this window. Need it sooner? You can manually narrow it here."
- "Earliest Date"
- "Latest Date"
- "Materials supplied via Hematch require 3 business days for preparation and shipping. The earliest available date has been adjusted accordingly."
- "Special Case Flags"
- "Pickup Location"
- "BC's Practice Office"
- "Pickup from the collector's practice"
- "Patient's Home"
- "Pickup from the patient's address"
- "Invite Specific Collectors (Optional)"
- "These collectors will receive a priority invitation. All other qualified collectors in the area will also be notified."
- "Invite"
- "= 2 && !searchingBcs && ("
- "Previous"
- "Continue"
- "Submit Case Request"

### \app\dashboard\cases\page.tsx
- "View and manage all your patient blood collection cases."

### \app\dashboard\cases\[id]\matching\MatchingShortlistClient.tsx
- "approved.has(c.id));

  return ("
- "Dashboard"
- "Cases"
- "Approve Shortlist"
- "Approve Blood Collectors"
- "Review applications and select which professionals to include in the patient's shortlist."
- "Date.now() && !sent && ("
- "Sort:"
- "BEST MATCH — RECOMMENDED"
- "APPROVED FOR SHORTLIST"
- "HC Invited"
- "Pediatric"
- "Elderly"
- "Difficult veins"
- "Obese"
- "Centrifuge"
- "Freezer"
- "Est. fee"
- "includes travel"
- "Message from Collector"
- "No matches found"
- "Try removing some filters to see more results."
- "Clear all filters"
- "c.name.split(" ")[0]).join(", ")}"

### \app\dashboard\cases\[id]\matching\page.tsx
- "Patient Chooses Collector"
- "This case is configured for the patient to decide. You do not need to manually shortlist candidates."
- "Return to Case"

### \app\dashboard\cases\[id]\page.tsx
- "-1 ? statuses.indexOf(caseObj.status) : 0;

  const activePayment = payments?.[0] || null;
  const showConfirmationBanner = caseObj.status === 'completed' && activePayment?.payout_status === 'pending_confirmation';
  const showConfirmedBadge = caseObj.status === 'completed' && activePayment?.payout_status === 'confirmed';

  return ("
- "Dashboard"
- "Cases"
- "Urgent"
- "currentStatusIndex;
            
            let colorClass = "bg-white border-gray-200 text-gray-300";
            if (isCompleted) colorClass = "bg-deep-red border-deep-red text-white";
            else if (isCurrent) colorClass = "bg-emerald-500 border-emerald-500 text-white ring-4 ring-emerald-500/20";
            else if (isCancelled) colorClass = "bg-gray-100 border-gray-300 text-gray-400";
            
            return ("
- "Cancelled"
- "Collection Confirmed"
- "The collection has been verified successfully."
- "Lab & Test Requirements"
- "Requested Tests"
- "General Blood Draw"
- "Target Laboratories"
- "Materials:"
- "Logistics & Settings"
- "Mobility Request:"
- "Home Visit"
- "Practice"
- "Return Shipping:"
- "Patient Gender:"
- "BC Selection:"
- "Patient Decides"
- ") : caseObj.bc_selection_mode === 'clinic_shortlist' ? ("
- "Clinic Shortlist"
- ") : caseObj.bc_selection_mode === 'clinic_approval' ? ("
- "Clinic Approval"
- "Assigned Collector & Appointment"
- "Blood Collector"
- "Verified Professional"
- "Waiting for assignment"
- "Appointment Details"
- "Collection completed"
- ") : caseAppointment.status === 'cancelled' ? ("
- "Appointment cancelled"
- "Confirmed · Awaiting collection"
- "Not yet scheduled"
- ") : null}"
- "Patient Details"
- "View Profile"
- "Billing"
- "No payments recorded for this case yet."

### \app\dashboard\cases\[id]\success\page.tsx
- "Case Created!"
- "Case"
- "has been successfully registered. The next step is for the patient to provide their digital consent."
- "Patient Consent Link"
- "Share this securely with your patient."
- "Go to Dashboard"
- "Create another case"

### \app\dashboard\page.tsx
- "Collector Dashboard"
- "Welcome back. To view new cases available in your area and track your active bids, please open the"
- "Opportunities"
- "tab."
- "Recent Activity"
- "Next 48h"
- "Current Invoice"
- "Total (incl. VAT)"
- "Platform Avg"

### \app\dashboard\patients\page.tsx
- "Patients"
- "Manage your patient records."
- "New Patient Case"
- "All Patients"
- "Patient Name"
- "Contact Details"
- "Date of Birth"
- "Total Cases"
- "Latest Case"
- "Actions"
- "View Patient"
- "No patients found."
- "Patients will appear here once you create cases for them."
- "Create First Case"

### \app\dashboard\patients\[id]\page.tsx
- "Dashboard"
- "Patients"
- "Contact & Demographic"
- "Email"
- "Phone"
- "Gender"
- "Date of Birth"
- "Address"
- "Medical & Insurance"
- "Insurance Provider / Type"
- "Case History"
- "Blood collection history mapped to your organization."
- "Date"
- "Type"
- "Collector"
- "Mobility"
- "Status"
- "No applicants"
- "Urgent"
- "No Case History"
- "There are no cases associated with this patient for your organization yet."

### \app\dashboard\settings\page.tsx
- "setLoading(false));
  }, []);

  return ("
- "Practice"
- "Laboratory"
- "Clinic"
- "Hospital"
- "Other"
- "Translations are being progressively added. Some pages may appear in English."
- "Status"
- "Invoice (monthly)"
- "Monthly, net 30 days"
- "€20.00 / case"
- "€35.00 / case"
- "([]);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [showNewKey, setShowNewKey] = useState"
- "k.status === 'active').length;

  return ("
- ") : keys.length === 0 ? ("
- "Name"
- "Key"
- "Created"
- "Actions"

### \app\dashboard\team\page.tsx
- "([]);
  const [activity, setActivity] = useState"
- "([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState"
- "('viewer');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [actionMenuOpen, setActionMenuOpen] = useState"
- "Invited"
- "as"
- "Changed role to"
- "Removed a team member"
- "Reactivated a team member"
- ";
    }
    return"
- ";
  };

  return ("
- "PENDING"

### \app\design-system\page.tsx
- "Ruby Pulse Design System"
- "Showcase of reusable UI components and design tokens."
- "Buttons"
- "Primary Action"
- "Secondary Action"
- "Ghost Button"
- "Danger Action"
- "Disabled"
- "Status Badges"
- "Pending"
- "Matched"
- "Booked"
- "Completed"
- "Cancelled"
- "Urgent"
- "Default"
- "Forms & Inputs"
- "Standard Input"
- "Email Address"
- "Search Query"
- "⌘K"
- "Cards"
- "Case #4092"
- "Fasting blood draw required."
- "View Details"
- "Match BC"
- "System Alert"
- "3 cases are waiting for matching beyond 24h."
- "Action Needed"
- "Review Cases"

### \app\faq\page.tsx
- "([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [openId, setOpenId] = useState"
- "f.category === activeCategory);

  return ("
- "Support"
- "Frequently asked questions"
- "Everything you need to know about Hematch."
- "Loading answers..."
- ") : filteredFaqs.length === 0 ? ("
- "No questions found in this category."
- "Still have questions?"
- "Can't find the answer you're looking for? Please chat to our friendly team."
- "Contact Us"

### \app\for-companies\page.tsx
- "For Healthcare Companies"
- "Stop chasing phlebotomists."
- "Start"
- "matching."
- "Post a blood collection case and get matched with verified, qualified collectors in your area. No phone calls, no agencies, no delays."
- "Get Started Free →"
- "See How It Works"
- "Platform Interface Preview"
- "The old way is broken"
- "Manual processes, endless phone calls, and lack of visibility are costing your operations time and money."
- "Phone tag with agencies"
- "Hours wasted calling agencies, waiting for callbacks, and negotiating rates for each case."
- "Unverified collectors"
- "No standardized way to check qualifications, insurance, or experience before they show up."
- "Zero visibility"
- "Once you hand off a case, you have no idea what's happening until it's done — or not."
- "How Hematch works for you"
- "A streamlined, end-to-end matching workflow designed specifically for modern healthcare companies."
- "Built for healthcare operations"
- "Everything you need to manage decentralized blood collection confidently and reliably."
- "Ready to modernize your blood collection workflow?"
- "Join 250+ healthcare companies already using Hematch to streamline their logistics and save time."
- "Register Now"
- "Contact Sales"

### \app\for-professionals\page.tsx
- "For Blood Collectors"
- "Your skills."
- "Your schedule."
- "Your rates."
- "Join a growing network of qualified phlebotomists. Choose cases that fit your schedule, set your own fees, and get paid securely through the platform."
- "Join the Network →"
- "See How It Works"
- "Platform Interface Preview"
- "Why phlebotomists choose Hematch"
- "Everything you need to build a flexible, rewarding phlebotomy practice."
- "Set your own rates"
- "Choose your practice visit and home visit fees. No rate negotiations, no agency cuts."
- "Flexible schedule"
- "See available cases and apply for the ones that work for you. Propose your own time slots."
- "Secure payments"
- "Get paid directly through the platform after each completed collection. No chasing invoices."
- "Build your reputation"
- "Earn reviews from patients and healthcare companies. Your profile grows with every successful collection."
- "How it works"
- "A simple, streamlined process designed to fit within your schedule seamlessly."
- "Step preview"
- ""Hematch gave me the freedom to build my own practice. I choose my cases, set my hours, and get paid fairly. It's exactly what phlebotomy needed.""
- "Maria S."
- "Mobile Phlebotomist, Frankfurt"
- "Transparent earnings"
- "You set your rates. We handle the rest."
- "Earn €25-€65+ per collection"
- "Practice visit base fee"
- "Home visit base fee"
- "Travel compensation"
- "€0.40/km"
- "Platform commission"
- "Fees shown are examples. You set your own rates."
- "What you need to get started"
- "A few simple prerequisites to ensure quality and safety on the platform."
- "Requirements checklist"
- "Verification typically takes 1-2 business days."
- "Start earning on your own terms"
- "Join 2,400+ verified collectors on Hematch."
- "Create Your Profile →"
- "Learn More"

### \app\how-it-works\page.tsx
- "How It Works"
- "From case to collection in three steps"
- "Hematch connects healthcare companies with qualified blood collectors through a simple, transparent matching process."
- "Healthcare company posts a case"
- "The clinic or organization creates a new request on the platform."
- "Post Case Interface"
- "Collector Dashboard"
- "Collectors apply with time slots"
- "Verified professionals in the area review and apply for the case."
- "Patient selects and pays"
- "The patient is empowered to choose the best option for their schedule."
- "Patient Selection Interface"
- "Collection Tracker"
- "Collection happens"
- "The professional performs the requested service securely."
- "Everyone gets paid"
- "Funds are distributed transparently and efficiently."
- "Financial Overview Dashboard"
- "Three ways to match"
- "Choose the matching mode that fits your workflow."
- "Patient Decides"
- "All qualified applicants are shown to the patient. They choose their preferred collector based on profiles, ratings, and proposed times."
- "Clinic Shortlist"
- "The healthcare company reviews applicants and creates a shortlist. The patient picks from the approved options."
- "Clinic Approval"
- "The healthcare company selects the collector directly. The patient is assigned their chosen professional."
- "Built on trust"
- "Every step is designed for safety and compliance."
- "Identity verified"
- "Every collector's identity is verified before they can accept cases."
- "Credential checked"
- "Professional certifications and insurance are validated."
- "Patient consent"
- "Digital consent flows ensure proper authorization before every collection."
- "Full audit trail"
- "Every action is logged. Complete transparency for compliance."
- "Ready to get started?"
- "I'm a Healthcare Company"
- "Post cases and find qualified phlebotomists in your area instantly."
- "Get Started Free"
- "Contact Sales"
- "I'm a Blood Collector"
- "Build your practice, set your rates, and choose your schedule."
- "Join the Network →"

### \app\imprint\page.tsx
- "Legal"
- "Impressum"
- "Note:"
- "This is a template Impressum. Please replace placeholder information with your actual company details before going live."
- "Angaben gemäß § 5 TMG"
- "Hematch GmbH (i.Gr.)"
- "Musterstraße 1"
- "60311 Frankfurt am Main"
- "Germany"
- "Vertreten durch:"
- "[Managing Director Name]"
- "Kontakt:"
- "Email:"
- "contact@hematch.com"
- "Phone: +49 (0) 69 XXXXXXXX"
- "Registereintrag:"
- "Registration pending"
- "Amtsgericht Frankfurt am Main"
- "Umsatzsteuer-ID:"
- "Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz:"
- "[Pending]"
- "Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV:"
- "[Name]"
- "EU-Streitschlichtung:"
- "Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:"
- "https://ec.europa.eu/consumers/odr/"
- "Unsere E-Mail-Adresse finden Sie oben im Impressum."
- "Verbraucherstreitbeilegung / Universalschlichtungsstelle:"
- "Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen."

### \app\login\page.tsx
- "("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState"
- "(null);
  const [success, setSuccess] = useState"
- "Sign in to your account"
- "Password"
- "Magic Link"

### \app\page.tsx
- "(new Set());
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const router = useRouter();
  const sectionRefs = useRef"
- "visibleSections.has(id);

  return ("
- "Now available across Germany"
- "Trusted by 2,400+ professionals"
- "PLATFORM DEMO"
- "See how Hematch works in 90 seconds"
- "Three steps to organized"
- "blood collection"
- "Healthcare Company Image"
- "For Healthcare Companies"
- "Outsource the logistics."
- "Keep the control."
- "Upload patient cases, get matched with verified phlebotomists nearby, and track everything from booking to lab delivery."
- "Explore platform →"
- "Blood Collector Image"
- "For Blood Collectors"
- "Set your schedule."
- "Build your reputation."
- "Join a growing network of qualified phlebotomists. Set your own rates, choose between practice and home visits, and let the platform handle the rest."
- "Join the network →"
- "What people say"
- "Ready to streamline"
- "blood collection?"
- "Join the platform trusted by healthcare companies and blood collectors across Germany. Get started in minutes."
- "Register Now"
- "Learn More"

### \app\patient\[token]\checkout\page.tsx
- "Hematch"
- "Checkout"
- "Complete your payment to secure the appointment."
- "Credit Card"
- "PayPal"
- "SEPA Direct Debit"
- "Secure encrypted payment processing."
- "Order Summary"
- "Travel Allowance"
- "Urgency Surcharge"
- "Laboratory Materials"
- "Material Shipping"
- "Return Lab Logistics"
- "Subtotal"
- "Total"

### \app\patient\[token]\confirm\page.tsx
- "Loading your appointment details..."

### \app\patient\[token]\page.tsx
- "(null);
  const [applications, setApplications] = useState"
- "([]);
  const [proposedSlots, setProposedSlots] = useState"
- "([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState"
- "(null);

  const [platformConfig, setPlatformConfig] = useState"
- "(null);

  // Appointment & Checklist
  const [appointment, setAppointment] = useState"
- "("");
  const [selectedTime, setSelectedTime] = useState"
- "("");
  const [customRequestMode, setCustomRequestMode] = useState(false);
  const [counterFormOpenFor, setCounterFormOpenFor] = useState"
- "Loading..."
- ";
  if (error || !caseData) return"
- "= 12 && hoursDiff"
- "4;
            return ("
- "has arranged a blood collection for you. We just need a few things before we can finalize your appointment."
- "What to expect"
- "Let's get started"
- "This process takes about 2 minutes. Your data is encrypted and protected under GDPR."
- "Back"
- "Consent"
- "Please review and agree to the following before we proceed."
- "I agree — continue"
- "Choose Your Collector"
- "Your healthcare provider has pre-approved these professionals. Pick the one you prefer."
- "No available collectors found."
- "new Date(a.slot_start).getTime() - new Date(b.slot_start).getTime());

                const isCounter = m.scheduling_status === 'patient_counter_proposed';
                const isFailed = m.scheduling_status === 'failed';

                return ("
- "INVITED BY PROVIDER"
- "&middot; 1 hour"
- "Book"
- "Confirm & Continue to Payment"
- "This collector is also open to other times"
- "None of these times work? Suggest your own →"
- "Suggest 3 Alternative Times"
- "Time"
- "Cancel"
- "These don't work either? Send a message →"
- "Send Message"
- "For urgent cases, please select from available times or choose another collector."
- "Request Sent!"
- "Your time request has been sent to"
- ". We'll notify you by email once they respond."
- "Requested Time"
- "View Confirmation Page"
- "Your Appointment"
- "Here are your booking details."
- "Your assigned collector"
- "Rating"
- "Collections"
- "Price Breakdown"
- "Collector base fee"
- "Travel fee"
- "Materials"
- "Shipping fee"
- "VAT (19%)"
- "Total"
- "Cancel Appointment"
- "Rate your Experience"
- "Payment"
- "Complete your payment to confirm the appointment. Your payment is held securely in escrow until completion."
- "Amount Due"
- "Including 19% VAT"
- "Payment Method"
- "How was your experience?"
- "Share your feedback (optional)"
- "Thank you!"
- "Your rating has been submitted. Your blood sample is being processed — your healthcare provider will receive the results directly."
- "Download Receipt (PDF)"
- "Refund Policy"
- "Reason"
- "Select a reason..."
- "Schedule conflict"
- "No longer needed"
- "Found alternative"
- "Other"
- "Keep Appointment"

### \app\patient\[token]\receipt\page.tsx
- "Receipt not available yet. Please complete payment first."
- ";
  }

  // Determine latest payment record from the appointment relationship
  const appt = caseData.appointment?.[0] || caseData.appointment; // depending on relation cardinalities
  const paymentRecord = appt?.payment?.[0] || appt?.payment;



  return ("
- "Payment Successful"
- "Your appointment has been confirmed and payment was securely processed."
- "Amount Paid"
- "Payment ID"
- "Date"
- "Case Ref"
- "Download PDF Receipt"
- "A copy has also been sent to your email."
- "Back to Patient Portal"

### \app\pricing\page.tsx
- "Pricing"
- "Simple, transparent pricing"
- "No setup fees. No subscriptions. You only pay when blood collections happen."
- "For Healthcare Companies"
- "Per-case organization fees"
- "Practice Visit"
- "/case"
- "Home Visit"
- "Get Started"
- "Billed monthly. No minimum commitment."
- "For Blood Collectors"
- "Platform commission on completed cases"
- "All Visits"
- "per collection"
- "Join Free"
- "Free to join. Commission only on completed work."
- "What patients pay"
- "Patient pricing is transparent and calculated at the time of booking."
- "Collector's base fee"
- "Set by collector"
- "Travel fee"
- "(home visits)"
- "€0.40/km"
- "Urgent surcharge"
- "Emergency surcharge"
- "VAT"
- "(if applicable)"
- "Patients see the total cost before confirming. No hidden fees."
- "Common questions about pricing"
- "Start using Hematch today"
- "No setup fees, no commitments."
- "Register as Company"
- "Join as Collector"

### \app\privacy\page.tsx
- "Legal"
- "Privacy Policy"
- "Last updated: March 2026"
- "Note:"
- "This privacy policy is a template. Please review with legal counsel before publishing."
- "Contents"
- "1. Introduction"
- "2. Data Controller"
- "3. Data We Collect"
- "4. How We Use Your Data"
- "5. Legal Basis for Processing"
- "6. Data Sharing"
- "7. Data Retention"
- "8. Your Rights (GDPR)"
- "9. Cookies"
- "10. Data Security"
- "11. International Transfers"
- "12. Changes to This Policy"
- "13. Contact"
- "Hematch GmbH ("Hematch", "we", "us") operates the hematch.com platform. This Privacy Policy explains how we collect, use, store, and protect your personal data in compliance with the EU General Data Protection Regulation (GDPR) and the German Federal Data Protection Act (BDSG)."
- "Hematch GmbH (i.Gr.)"
- "Musterstraße 1, 60311 Frankfurt am Main, Germany"
- "Email:"
- "privacy@hematch.com"
- "Account data:"
- "name, email, phone, company information"
- "Patient data:"
- "name, date of birth, contact details (processed on behalf of healthcare companies)"
- "Professional data:"
- "qualifications, certifications, insurance details (blood collectors)"
- "Usage data:"
- "IP addresses, browser type, pages visited, timestamps"
- "Payment data:"
- "processed by our payment provider; we do not store full card details"
- "Communication data:"
- "messages, notifications, support requests"
- "Providing and operating the Hematch platform"
- "Matching healthcare companies with blood collectors"
- "Processing payments and generating invoices"
- "Verifying professional qualifications"
- "Sending notifications about cases, appointments, and payments"
- "Improving our services and user experience"
- "Complying with legal obligations"
- "5. Legal Basis for Processing (Art. 6 GDPR)"
- "Contract performance (Art. 6(1)(b))"
- "— to provide our services"
- "Legitimate interest (Art. 6(1)(f))"
- "— for platform security and improvement"
- "Legal obligation (Art. 6(1)(c))"
- "— tax and regulatory compliance"
- "Consent (Art. 6(1)(a))"
- "— for marketing communications (where applicable)"
- "We share data with the following parties conditionally:"
- "Healthcare companies and blood collectors (as necessary for case matching)"
- "Payment processors (for transaction processing)"
- "Cloud infrastructure providers (Supabase/AWS for data hosting)"
- "Legal authorities (when required by law)"
- "We do not sell your personal data"
- "retained while your account is active, deleted within 30 days of account closure"
- "retained per healthcare company instructions and applicable medical record retention laws"
- "Payment records:"
- "retained for 10 years (German tax law requirement)"
- "Usage logs:"
- "retained for 90 days"
- "Under the GDPR, you have the following rights over your personal data:"
- "Right of access (Art. 15)"
- "Right to rectification (Art. 16)"
- "Right to erasure (Art. 17)"
- "Right to restriction of processing (Art. 18)"
- "Right to data portability (Art. 20)"
- "Right to object (Art. 21)"
- "Right to withdraw consent (Art. 7)"
- "To exercise these rights, contact:"
- "We use essential cookies for platform functionality (authentication, language preferences). We do not use tracking or advertising cookies. See our Cookie Policy for details."
- "We implement appropriate technical and organizational measures including encryption in transit (TLS), encrypted storage, access controls, and regular security assessments."
- "Your data is primarily stored within the EU (Frankfurt, Germany). Where data is processed outside the EU, we ensure adequate safeguards per GDPR Chapter V."
- "We may update this Privacy Policy from time to time. Material changes will be communicated via email or platform notification."
- "For privacy-related inquiries:"
- "Hematch GmbH,"
- ", Musterstraße 1, 60311 Frankfurt am Main"

### \app\register\bc\page.tsx
- "(null);

  // Step 2: Qualifications
  const [profType, setProfType] = useState"
- "(null);
  const [docFile, setDocFile] = useState"
- "(null);
  const [practiceUrl, setPracticeUrl] = useState("");

  // Step 3: Experience Profile
  const [expMinor, setExpMinor] = useState(false);
  const [expElderly, setExpElderly] = useState(false);
  const [expRollvenen, setExpRollvenen] = useState(false);
  const [expObese, setExpObese] = useState(false);

  // Step 4: Equipment
  const [hasCentrifuge, setHasCentrifuge] = useState(false);
  const [hasFreezer, setHasFreezer] = useState(false);
  const [additionalEquip, setAdditionalEquip] = useState("");

  // Step 5: Service Area
  const [practiceVisits, setPracticeVisits] = useState(true);
  const [homeVisits, setHomeVisits] = useState(false);
  const [radius, setRadius] = useState("15");
  const [baseAddress, setBaseAddress] = useState("");

  const [practiceFee, setPracticeFee] = useState("35");
  const [homeVisitFee, setHomeVisitFee] = useState("50");

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState"
- "setStep(Math.max(step - 1, 0));

  const handlePhotoChange = (e: React.ChangeEvent"
- "Personal Information"
- "Tell us about yourself. This information will appear on your public profile."
- "Profile Photo"
- "A professional photo builds trust with patients. JPG or PNG, max 5MB."
- "Upload Photo"
- "Include numbers & symbols for a strong password."
- "Confirm Password"
- ");

      case 1:
        return ("
- "Professional Qualifications"
- "Verify your credentials. We'll review your documents within 24 hours."
- "Professional Type"
- "Qualification Document"
- "Click to replace file"
- "Drag and drop your document here"
- "PDF, JPG or PNG (MAX. 10MB)"
- "Browse Files"
- "Practice Website URL / License Number"
- ");

      case 2:
        return ("
- "Experience Profile"
- "Help us match you with the right patients. Toggle on the areas where you have experience."
- "Why does this matter?"
- "Healthcare companies flag cases that need specialized experience. Your experience profile helps our matching algorithm connect you with cases where your skills make a difference — and earns you more bookings."
- ");

      case 3:
        return ("
- "Practice Equipment"
- "Some tests require specific equipment. Let us know what you have available."
- "Additional Equipment (optional)"
- "Describe any other relevant equipment you have."
- ");

      case 4:
        return ("
- "Service Area"
- "Define where and how you're available for blood collection."
- "Maximum travel radius"
- "5 km"
- "50 km"
- "Practice / Base Address"
- "This is used to calculate distances for matching and travel fees."
- ");

      case 5:
        return ("
- "Pricing"
- "Set your base fee. Travel costs are calculated automatically."
- "Practice Visit Fee"
- "Base fee"
- "Min €15 — Max €100"
- "Home Visit Fee"
- "Travel fee calculation"
- "+ €0.40/km automatically calculated by the platform based on the patient's distance from your base."
- "How earnings work:"
- "Patients pay through the platform. You receive your fee minus the platform commission (default 17.5%) via credit note, settled bi-weekly. Your net earnings are always visible before you accept a case."
- ");

      case 6:
        return ("
- "Review & Submit"
- "Review your profile before submitting for verification."
- "Edit"
- "After submitting, our team will review your qualifications within"
- "24 hours"
- ". You'll receive an email notification once your profile is approved and you can start receiving requests."
- ");

      default:
        return null;
    }
  };

  return ("
- "Previous"
- "Continue"
- "Submit Application"

### \app\register\bc\success\page.tsx
- "Hematch"
- ".de"
- "Registration Submitted"
- "Thank you for registering as a Blood Collector! We have received your qualifications and documents. Our medical team will review your application within"
- "24-48 hours"
- "Your profile is currently"
- "Pending Verification"
- ". You will receive an email as soon as your account is activated and you can start accepting cases."
- "Return to Homepage"

### \app\register\hc\page.tsx
- "(null);

  // Step 3: Contact Person Details
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  // Auth Context (Collected in Step 1)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 4: AVV Signature
  const [agreedToAVV, setAgreedToAVV] = useState(false);

  // Loading/Error state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState"
- "setStep(Math.max(step - 1, 0));

  const handleFileChange = (e: React.ChangeEvent"
- "Company Information"
- "Create your account and tell us about your healthcare organization."
- "Confirm Password"
- "Company Type"
- "Medical Practice (Arztpraxis)"
- "Laboratory (Labor)"
- "Telemedicine Provider"
- "Health-Tech Startup"
- "Street and House Number"
- "Postal Code (PLZ)"
- "City"
- "Tax ID (Steuernummer) or VAT ID"
- ");

      case 1:
        return ("
- "Verify your Business"
- "Upload your business license, practice registration, or excerpt from the commercial register."
- "Registration Document"
- "Click to replace file"
- "Click to upload"
- "or drag and drop"
- "PDF, JPG or PNG (MAX. 10MB)"
- ");

      case 2:
        return ("
- "Contact Person"
- "Set up your administrator account to access the platform."
- ");

      case 3:
        return ("
- "Legal Agreements"
- "Sign our Data Processing Agreement (AVV) required under DSGVO / GDPR."
- "Auftragsverarbeitungsvertrag (AVV)"
- "Preamble"
- "This Data Processing Agreement details the parties' obligations on the protection of personal data, associated with the processing of personal data on behalf of the Healthcare Company as the Data Controller by Hematch as the Data Processor, in accordance with Article 28 of the GDPR."
- "1. Subject matter and duration"
- "The Processor shall process personal data on behalf of the Controller solely for the provision of the Hematch platform and matching services. The processing includes patient names, contact details, diagnoses, and test requirements."
- "2. Obligations of the Processor"
- "The Processor implements appropriate technical and organizational measures to ensure the security of processing. The Processor will only use sub-processors located within the European Union that comply with strict data protection standards."
- "I digitally sign and accept the AVV"
- "By checking this box, I confirm I am authorized to enter into this agreement on behalf of the company."
- ");

      case 4:
        return ("
- "Review & Submit"
- "Check your details before submitting for manual verification."
- "Company"
- "Edit"
- "Document"
- "Contact"
- ");

      default:
        return null;
    }
  };

  return ("
- "Previous"
- "Continue"
- "Submit Application"

### \app\register\hc\success\page.tsx
- "Hematch"
- ".de"
- "Registration Submitted"
- "Thank you for registering with Hematch! We have received your company details and verification documents. Our team will review your application within"
- "24-48 hours"
- "Your account is currently"
- "Pending Verification"
- ". You will receive an email as soon as your account is activated and you can start creating cases."
- "Return to Homepage"

### \app\register\page.tsx
- "How will you use Hematch?"
- "I need to organize blood collection for my patients."
- "I am a phlebotomist looking to accept assignments."

### \app\terms\page.tsx
- "Legal"
- "Terms of Service"
- "Last updated: March 2026"
- "Note:"
- "This Terms of Service page is a template. Please review with legal counsel before publishing."
- "Contents"
- "1. Acceptance of Terms"
- "2. Description of Service"
- "3. User Accounts"
- "4. Healthcare Company Obligations"
- "5. Blood Collector Obligations"
- "6. Patient Terms"
- "7. Payments and Fees"
- "8. Verification and Quality"
- "9. Cancellations and Refunds"
- "10. Intellectual Property"
- "11. Limitation of Liability"
- "12. Privacy"
- "13. Modifications"
- "14. Governing Law"
- "15. Contact"
- "By accessing or using the Hematch platform (hematch.com), you agree to be bound by these Terms of Service. If you do not agree, do not use the platform."
- "Hematch is a marketplace platform that connects healthcare companies with qualified blood collectors (phlebotomists) for venous blood sampling services. Hematch facilitates the matching, scheduling, and payment process but is not itself a healthcare provider."
- "You must provide accurate and complete registration information"
- "You are responsible for maintaining the security of your account"
- "You must notify us immediately of any unauthorized access"
- "One account per person; accounts are non-transferable"
- "Provide accurate patient information for case creation"
- "Ensure proper patient consent before creating cases"
- "Pay organization fees as invoiced monthly"
- "Comply with applicable healthcare regulations"
- "Maintain valid professional certifications and insurance"
- "Only accept cases within your qualifications"
- "Arrive at scheduled appointments on time"
- "Perform blood collection according to professional standards"
- "Report any incidents or complications promptly"
- "Patients access the platform via secure links provided by their healthcare company"
- "Patient consent is required before blood collection proceeds"
- "Patients may select their preferred collector and time slot (depending on matching mode)"
- "Payment is required before appointment confirmation"
- "Healthcare companies:"
- "monthly organization fees (€20/practice visit, €35/home visit)"
- "Blood collectors:"
- "platform commission of 17.5% on completed collections"
- "Patient payments:"
- "processed at time of booking, held until collection completion"
- "All prices are in Euros and subject to applicable VAT (19%)"
- "Refund policy: see our Refund Policy section"
- "Blood collectors must complete identity verification and credential checks"
- "Hematch reserves the right to suspend or remove unverified or non-compliant users"
- "Healthcare companies and patients may leave reviews after completed collections"
- "Cases may be cancelled before a collector is assigned at no charge"
- "Late cancellations may be subject to fees"
- "Refunds for completed services are handled on a case-by-case basis"
- "Contact"
- "support@hematch.com"
- "for refund requests"
- "All content, trademarks, and technology on the Hematch platform are owned by Hematch GmbH. Users may not copy, modify, or distribute platform content without written permission."
- "Hematch is a marketplace facilitator, not a healthcare provider"
- "We do not guarantee the availability of blood collectors"
- "We are not liable for the quality of blood collection services performed"
- "Our total liability is limited to the fees paid to Hematch in the preceding 12 months"
- "Your use of Hematch is also governed by our Privacy Policy, available at"
- "hematch.com/privacy"
- "We may update these Terms from time to time. Continued use of the platform after changes constitutes acceptance of the modified Terms."
- "These Terms are governed by the laws of the Federal Republic of Germany. The courts of Frankfurt am Main shall have exclusive jurisdiction."
- "Hematch GmbH"
- "Musterstraße 1, 60311 Frankfurt am Main"
- "Email:"
- "legal@hematch.com"

### \components\admin\AdminSidebar.tsx
- "(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userProfile, setUserProfile] = useState"
- "Platform Admin"

### \components\admin\RejectionModal.tsx
- "Additional notes (optional)"

### \components\admin\VerificationQueue.tsx
- "('pending');
  const [typeFilter, setTypeFilter] = useState"
- "('all'); // NEW
  const [expandedId, setExpandedId] = useState"
- "(null);
  const [hcs, setHcs] = useState"
- "([]);
  const [bcs, setBcs] = useState"
- "([]);
  const [loading, setLoading] = useState(true);

  const [modalState, setModalState] = useState"
- "HC"
- "BC"
- "REJECTED"
- "PENDING"
- "No docs"
- "Re-review"
- "Name"
- "Type"
- "Contact Email"
- "Phone"
- "Address"
- "Full Name"
- "Qualification"
- "Service Area"
- "Offers"
- "Practice Fee"
- "Home Visit Fee"
- "Rejection History"
- "No document uploaded"
- "Approve"
- "Reject"
- ");
  };

  return ("
- "HCs"
- "BCs"
- "renderCard(user))
          )}"

### \components\dashboard\BCSidebar.tsx
- "(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userProfile, setUserProfile] = useState"
- "n[0]).join('').substring(0, 2).toUpperCase() : "BC"}"
- "Blood Collector"

### \components\dashboard\CaseApplicants.tsx
- "([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedApp, setSelectedApp] = useState"
- "Blood Collector Bids"
- ") : error ? ("
- "Shortlisted"
- "Rejected"
- "Withdrawn"
- "Review Bid"
- "Practice Fee"
- "Home Visit Fee"
- "Currently waiting for available Blood Collectors in the area to apply."
- "Special Experience"
- "v)) && ("
- "None explicitly listed"
- "Equipment"
- "No equipment listed"
- ";
                    
                    const labels: Record"
- "Professional Bio"
- "Application Message"
- "Status:"
- "Reject"
- "Approve for Shortlist"
- ") : selectionMode === 'clinic_approval' ? ("
- "Assign Collector"
- ") : null}"
- "Close"

### \components\dashboard\CaseCopyActions.tsx
- "setCopied(false), 2000);
  };

  return ("
- "Patient Portal"
- "Patient Consent URL"
- "Share this unique, secure link with the patient to collect their consent, location, and payment."

### \components\dashboard\CasesOverviewTable.tsx
- "No applicants yet"
- "Emergency"
- ") : c.urgency_level === 'urgent' ? ("
- "Urgent"
- "Normal"
- "Action Needed"
- "View Details"
- "Cancel Case"
- "We couldn't find any cases matching your current filters."
- "Previous"
- "Next"

### \components\dashboard\HCConfirmationBanner.tsx
- "Collection completed — confirmation required"
- "confirmed the blood collection on"
- ". 
          Please review the details and confirm within 48 hours."
- "Confirm Collection"
- "Report Issue"
- "Report Collection Issue"
- "Issue Type"
- "Incomplete collection"
- "Wrong materials used"
- "Patient complaint"
- "No-show"
- "Other"
- "Description"
- "Cancel"

### \components\dashboard\HCSidebar.tsx
- "(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userProfile, setUserProfile] = useState"
- "Healthcare Company"

### \components\dashboard\PatientEditModal.tsx
- "Edit Patient"
- "Create New Case"
- "Edit Patient Details"
- "First Name"
- "Last Name"
- "Email"
- "Phone"
- "Gender"
- "Select Gender"
- "Male"
- "Female"
- "Diverse"
- "Other"
- "Date of Birth"
- "Street Address"
- "Postal Code"
- "City"
- "Insurance Provider / Type"
- "Cancel"

### \components\dashboard\RecentCasesTable.tsx
- "c.status === selectedTab.toLowerCase());
  }

  return ("
- "Recent Cases"
- "View all &rarr;"
- "No applicants yet"
- "Urgent"
- "No cases match the selected filter."

### \components\dashboard\RequestCard.tsx
- "Proposed Time"
- "Patient Details"
- "Test Requirements"
- "Note from patient:"
- "Propose Alternative Time"
- "Cancel"
- "Decline"
- "Propose New Time"

### \components\marketing\Footer.tsx
- "Professional blood collection logistics for healthcare companies across Germany. Quality, compliance, reliability."
- "(
                  link.u === '#cookie-settings' ? ("
- "© 2026 Hematch. All rights reserved."
- "LinkedIn"
- "Twitter"

### \components\marketing\Navbar.tsx
- "60 || mobileMenuOpen;

  return ("

### \components\notifications\NotificationsView.tsx
- "([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState"
- "((searchParams?.filter as any) || 'all');
  const [typeFilter, setTypeFilter] = useState(searchParams?.type || 'all');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState"
- ";
      case "application_received": return"
- ";
      case "application_accepted": return"
- ";
      case "application_rejected": return"
- ";
      case "case_update": return"
- ";
      case "shortlist_ready": return"
- "; 
      case "appointment_reminder": return"
- ";
      case "payment_received": return"
- ";
      case "system_alert": return"
- ";
      default: return"
- "0 ? "Mark Selected" : t('common.markAllRead')}"
- "0 ? "Clear Selected" : "Clear Resolved"}"
- "t.value === typeFilter)?.label || "Filter Type"}"
- "Select All"
- ") : !notifications || notifications.length === 0 ? ("
- "New"
- "Resolve"
- "Resolved"
- "View"
- "Loading..."
- ") : (
                    t('common.loadMore')
                  )}"

### \components\ui\CookieConsent.tsx
- "Cookie Preferences"
- "Manage how we use cookies on Hematch. Essential cookies are required for the platform to function."
- "Essential"
- "Required for the platform to function. Authentication, security, and session management."
- "Analytics"
- "Help us understand how the platform is used to improve the experience."
- "Marketing"
- "Used to deliver relevant information about Hematch services."
- "Cancel"
- "Save Preferences"
- "🍪 We use cookies to improve your experience and analyze platform usage. Learn more in our"
- "Privacy Policy"
- "Manage Preferences"
- "Reject All"
- "Accept All"

### \components\ui\FlagIcon.tsx
- ");
    case 'de':
      return ("
- ");
    case 'es':
      return ("
- ");
    case 'nl':
      return ("
- ");
    case 'fr':
      return ("
- ");
    default:
      return ("

### \components\ui\LanguageSwitcher.tsx
- "l.code === currentLocale) || languages[0];

  return ("

### \components\ui\MobileHeader.tsx
- "9 ? '9+' : unreadCount}"

### \components\ui\MobileLayoutWrapper.tsx
- "setSidebarOpen(false), []);

  const SidebarComponent = sidebars[sidebarType];

  return ("

### \components\ui\NotificationBell.tsx
- ";
      case "application_received": return"
- ";
      case "application_accepted": return"
- ";
      case "application_rejected": return"
- ";
      case "case_update": return"
- ";
      case "shortlist_ready": return"
- "; // Assuming Users available from somewhere or fallback
      case "appointment_reminder": return"
- ";
      case "payment_received": return"
- ";
      case "system_alert": return"
- ";
      default: return"
- ";
    }
  };

  if (!userId) return null;

  return ("
- "Notifications"
- "Mark all read"
- "No notifications yet"
- "We'll let you know when something important happens."
- "View all notifications"

### \components\ui\ResponsiveTable.tsx
- "React.ReactNode;
  isPrimary?: boolean;
  hideOnMobile?: boolean;
}

interface ResponsiveTableProps"
- "React.ReactNode;
  emptyMessage?: string;
}

export default function ResponsiveTable"
- ");
  }

  return ("
- "c !== primaryCol && !c.hideOnMobile);

          return ("

### \components\ui\SidebarNav.tsx
- "(null);

  return ("
- "Hematch"
- ".de"
- "ADMIN"

### \components\ui\Toast.tsx
- "void;
}

const ToastContext = createContext"
- "toast.id !== id));
  }, []);

  return ("

