const fs = require('fs');
const path = require('path');

const locales = ['en', 'de', 'es', 'nl', 'fr'];

const authTranslations = {
  loginSub: "Sign in to your account",
  passwordMethod: "Password",
  magicLinkMethod: "Magic Link",
  magicLinkSent: "Check your email for the magic link!",
  signingIn: "Signing in...",
  sendMagicLink: "Send Magic Link",
  forgotPassword: "Forgot password?",
  noAccount: "Don't have an account?",
  
  registerSub: "How will you use Hematch?",
  registerHCDesc: "I need to organize blood collection for my patients.",
  registerBCDesc: "I am a phlebotomist looking to accept assignments.",

  btnPrevious: "Previous",
  btnContinue: "Continue",
  btnSubmitting: "Submitting...",
  btnSubmitApplication: "Submit Application",
  btnEdit: "Edit",
  stepOf: "Step {current} of {total}",

  confirmPassword: "Confirm Password",
  pwdPlaceholderCreate: "Create a strong password",
  pwdPlaceholderReenter: "Re-enter password",

  hc: {
    steps: {
      info: "Company Info",
      document: "Document Upload",
      contact: "Contact Person",
      avv: "AVV Signature",
      review: "Review"
    },
    infoTitle: "Company Information",
    infoSub: "Create your account and tell us about your healthcare organization.",
    emailPlaceholder: "admin@practice.de",
    companyName: "Company Name",
    companyNamePlaceholder: "e.g. Dr. Schmidt Medical Practice",
    companyType: "Company Type",
    typePractice: "Medical Practice (Arztpraxis)",
    typeLab: "Laboratory (Labor)",
    typeTelemedicine: "Telemedicine Provider",
    typeStartup: "Health-Tech Startup",
    street: "Street and House Number",
    streetPlaceholder: "e.g. Musterstraße 1",
    zip: "Postal Code (PLZ)",
    zipPlaceholder: "10115",
    city: "City",
    cityPlaceholder: "Berlin",
    taxId: "Tax ID (Steuernummer) or VAT ID",
    taxIdPlaceholder: "e.g. DE123456789",

    docTitle: "Verify your Business",
    docSub: "Upload your business license, practice registration, or excerpt from the commercial register.",
    docLabel: "Registration Document",
    docReplace: "Click to replace file",
    docUpload: "Click to upload or drag and drop",
    docFormat: "PDF, JPG or PNG (MAX. 10MB)",
    notUploaded: "Not uploaded",
    
    contactTitle: "Contact Person",
    contactSub: "Set up your administrator account to access the platform.",
    firstNamePlaceholder: "First name",
    lastNamePlaceholder: "Last name",
    phonePlaceholder: "+49 170 1234567",

    legalTitle: "Legal Agreements",
    legalSub: "Sign our Data Processing Agreement (AVV) required under DSGVO / GDPR.",
    legalAvv: "Auftragsverarbeitungsvertrag (AVV)",
    legalPreamble: "Preamble\nThis Data Processing Agreement details the parties' obligations...",
    legalSubjets: "1. Subject matter and duration\nThe Processor shall process personal data...",
    legalObligations: "2. Obligations of the Processor\nThe Processor implements...",
    signAvvText: "I digitally sign and accept the AVV",
    signAvvSub: "By checking this box, I confirm I am authorized to enter into this agreement on behalf of the company.",

    reviewTitle: "Review & Submit",
    reviewSub: "Check your details before submitting for manual verification.",
    reviewCompany: "Company",
    reviewDoc: "Document",
    reviewContact: "Contact"
  },

  bc: {
    steps: {
      personal: "Personal",
      qualifications: "Qualifications",
      experience: "Experience",
      equipment: "Equipment",
      area: "Service Area",
      pricing: "Pricing",
      review: "Review"
    },
    personalTitle: "Personal Information",
    personalSub: "Tell us about yourself. This information will appear on your public profile.",
    photoLabel: "Profile Photo",
    photoSub: "A professional photo builds trust with patients. JPG or PNG, max 5MB.",
    photoUpload: "Upload Photo",
    pwdSub: "Include numbers & symbols for a strong password.",

    qualTitle: "Professional Qualifications",
    qualSub: "Verify your credentials. We'll review your documents within 24 hours.",
    profType: "Professional Type",
    typeDoctor: "Doctor (Arzt)",
    typeMFA: "Medical Assistant (MFA)",
    typeNurse: "Nurse / Pediatric Nurse",
    typeHeilpraktiker: "Alternative Practitioner",
    qualDoc: "Qualification Document",
    dragDrop: "Drag and drop your document here",
    browseFiles: "Browse Files",
    practiceUrl: "Practice Website URL / License Number",
    urlPlaceholder: "https://...",

    expTitle: "Experience Profile",
    expSub: "Help us match you with the right patients. Toggle on the areas where you have experience.",
    expMinor: "Experience with minors (pediatric)",
    expMinorSub: "Experience drawing blood from infants, toddlers, and children under 14.",
    expElderly: "Elderly patients",
    expElderlySub: "Experience with older patients who may have fragile veins or mobility limitations.",
    expDiff: "Difficult veins",
    expDiffSub: "Experience with veins that are hard to locate or tend to roll during puncture.",
    expObese: "Obese patients",
    expObeseSub: "Experience with patients where vein access may be more challenging due to body composition.",
    whyMatter: "Why does this matter?",
    whyMatterDesc: "Healthcare companies flag cases that need specialized experience. Your experience profile helps our matching algorithm connect you with cases where your skills make a difference — and earns you more bookings.",

    eqTitle: "Practice Equipment",
    eqSub: "Some tests require specific equipment. Let us know what you have available.",
    eqCent: "Centrifuge available",
    eqCentSub: "Required for serum separation. Some specialized labs require centrifuged samples.",
    eqFreez: "Freezer available (-20°C)",
    eqFreezSub: "Required for sample storage when immediate transport isn't possible.",
    eqAdd: "Additional Equipment (optional)",
    eqAddPlaceholder: "e.g., Blood gas analyzer, cold chain transport box...",
    eqAddSub: "Describe any other relevant equipment you have.",

    areaTitle: "Service Area",
    areaSub: "Define where and how you're available for blood collection.",
    availPrac: "Available at practice",
    availPracSub: "Patients can come to your location for blood draws.",
    availHome: "Available for home visits",
    availHomeSub: "You'll travel to the patient's location.",
    maxRadius: "Maximum travel radius",
    radiusKm: "{radius} km",
    baseAdd: "Practice / Base Address",
    baseAddPlaceholder: "Street, house number, PLZ, city",
    baseAddSub: "This is used to calculate distances for matching and travel fees.",

    priceTitle: "Pricing",
    priceSub: "Set your base fee. Travel costs are calculated automatically.",
    pracVisit: "Practice Visit Fee",
    baseFee: "Base fee",
    minMaxRange: "Min €15 — Max €100",
    homeVisit: "Home Visit Fee",
    calcTitle: "Travel fee calculation",
    calcSub: "+ €0.40/km automatically calculated by the platform based on the patient's distance from your base.",
    earningsHow: "How earnings work:",
    earningsSub: "Patients pay through the platform. You receive your fee minus the platform commission (default 17.5%) via credit note, settled bi-weekly. Your net earnings are always visible before you accept a case.",

    reviewSubBc: "Review your profile before submitting for verification.",
    noneAssigned: "None specified",
    docUploaded: "Document uploaded",
    reviewAfterSubmit: "After submitting, our team will review your qualifications within",
    hours24: "24 hours",
    reviewAfterSubmitP2: ". You'll receive an email notification once your profile is approved and you can start receiving requests."
  },

  success: {
    title: "Registration Submitted",
    hcDesc: "Thank you for registering with Hematch! We have received your company details and verification documents. Our team will review your application within",
    timeBlock: "24-48 hours",
    hcStatus: "Your account is currently",
    pending: "Pending Verification",
    hcStatusP2: ". You will receive an email as soon as your account is activated and you can start creating cases.",
    bcDesc: "Thank you for registering as a Blood Collector! We have received your qualifications and documents. Our medical team will review your application within",
    bcStatusP2: ". You will receive an email as soon as your account is activated and you can start accepting cases.",
    returnHome: "Return to Homepage"
  }
};

for (const loc of locales) {
  const filePath = path.join(__dirname, 'messages', `${loc}.json`);
  let raw = fs.readFileSync(filePath, 'utf8');
  if (raw.endsWith('\n')) raw = raw.slice(0, -1);
  const data = JSON.parse(raw);
  
  if (!data.auth) data.auth = {};
  
  // Merge Object deeply but safely given structure
  const currentAuth = data.auth;
  data.auth = { ...currentAuth, ...authTranslations, hc: { ...currentAuth.hc, ...authTranslations.hc }, bc: { ...currentAuth.bc, ...authTranslations.bc }, success: { ...currentAuth.success, ...authTranslations.success } };

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

console.log('Successfully injected auth strings');
