const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'app/register/hc/page.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

const replacements = [
  ['label: "Company Info"', 'label: t("auth.hc.steps.info")'],
  ['label: "Document Upload"', 'label: t("auth.hc.steps.document")'],
  ['label: "Contact Person"', 'label: t("auth.hc.steps.contact")'],
  ['label: "AVV Signature"', 'label: t("auth.hc.steps.avv")'],
  ['label: "Review"', 'label: t("auth.hc.steps.review")'],

  ['>Company Information</h2>', '>{t("auth.hc.infoTitle")}</h2>'],
  ['>Create your account and tell us about your healthcare organization.</p>', '>{t("auth.hc.infoSub")}</p>'],
  ['placeholder="admin@practice.de"', 'placeholder={t("auth.hc.emailPlaceholder")}'],
  ['>Confirm Password</Label>', '>{t("auth.confirmPassword")}</Label>'],
  ['placeholder="Create a strong password"', 'placeholder={t("auth.pwdPlaceholderCreate")}'],
  ['placeholder="Re-enter password"', 'placeholder={t("auth.pwdPlaceholderReenter")}'],
  
  ['>Company Type</Label>', '>{t("auth.hc.companyType")}</Label>'],
  ['>Medical Practice (Arztpraxis)</option>', '>{t("auth.hc.typePractice")}</option>'],
  ['>Laboratory (Labor)</option>', '>{t("auth.hc.typeLab")}</option>'],
  ['>Telemedicine Provider</option>', '>{t("auth.hc.typeTelemedicine")}</option>'],
  ['>Health-Tech Startup</option>', '>{t("auth.hc.typeStartup")}</option>'],
  
  ['>Street and House Number</Label>', '>{t("auth.hc.street")}</Label>'],
  ['placeholder="e.g. Musterstraße 1"', 'placeholder={t("auth.hc.streetPlaceholder")}'],
  ['>Postal Code (PLZ)</Label>', '>{t("auth.hc.zip")}</Label>'],
  ['placeholder="10115"', 'placeholder={t("auth.hc.zipPlaceholder")}'],
  ['>City</Label>', '>{t("auth.hc.city")}</Label>'],
  ['placeholder="Berlin"', 'placeholder={t("auth.hc.cityPlaceholder")}'],
  ['>Tax ID (Steuernummer) or VAT ID</Label>', '>{t("auth.hc.taxId")}</Label>'],
  ['placeholder="e.g. DE123456789"', 'placeholder={t("auth.hc.taxIdPlaceholder")}'],

  ['>Verify your Business</h2>', '>{t("auth.hc.docTitle")}</h2>'],
  ['>Upload your business license, practice registration, or excerpt from the commercial register.</p>', '>{t("auth.hc.docSub")}</p>'],
  ['>Registration Document</Label>', '>{t("auth.hc.docLabel")}</Label>'],
  ['>Click to replace file</p>', '>{t("auth.hc.docReplace")}</p>'],
  ['<span className="font-semibold text-near-black">Click to upload</span> or drag and drop', '{t("auth.hc.docUpload")}'],
  ['>PDF, JPG or PNG (MAX. 10MB)</p>', '>{t("auth.hc.docFormat")}</p>'],

  ['>Contact Person</h2>', '>{t("auth.hc.contactTitle")}</h2>'],
  ['>Set up your administrator account to access the platform.</p>', '>{t("auth.hc.contactSub")}</p>'],
  ['placeholder="First name"', 'placeholder={t("auth.hc.firstNamePlaceholder")}'],
  ['placeholder="Last name"', 'placeholder={t("auth.hc.lastNamePlaceholder")}'],
  ['placeholder="+49 170 1234567"', 'placeholder={t("auth.hc.phonePlaceholder")}'],

  ['>Legal Agreements</h2>', '>{t("auth.hc.legalTitle")}</h2>'],
  ['>Sign our Data Processing Agreement (AVV) required under DSGVO / GDPR.</p>', '>{t("auth.hc.legalSub")}</p>'],
  ['>Auftragsverarbeitungsvertrag (AVV)</h3>', '>{t("auth.hc.legalAvv")}</h3>'],
  ['>I digitally sign and accept the AVV</p>', '>{t("auth.hc.signAvvText")}</p>'],
  ['By checking this box, I confirm I am authorized to enter into this agreement on behalf of the company.', '{t("auth.hc.signAvvSub")}'],

  ['>Review & Submit</h2>', '>{t("auth.hc.reviewTitle")}</h2>'],
  ['>Check your details before submitting for manual verification.</p>', '>{t("auth.hc.reviewSub")}</p>'],

  ['>Company</h4>', '>{t("auth.hc.reviewCompany")}</h4>'],
  ['>Document</h4>', '>{t("auth.hc.reviewDoc")}</h4>'],
  ['>Contact</h4>', '>{t("auth.hc.reviewContact")}</h4>'],
  ['>Not uploaded</p>', '>{t("auth.hc.notUploaded")}</p>'],
  ['? file.name : "Not uploaded"', '? file.name : t("auth.hc.notUploaded")'],
  ['|| "—"', '|| "—"'], // leave this

  ['> Previous', '> {t("auth.btnPrevious")}'],
  ['Continue <', '{t("auth.btnContinue")} <'],
  ['>Submitting...<', '>{t("auth.btnSubmitting")}<'],
  ['>Submit Application <', '>{t("auth.btnSubmitApplication")} <'],
  ['>Edit</button>', '>{t("auth.btnEdit")}</button>'],
  ['Step {step + 1} of {steps.length}', '{t("auth.stepOf", { current: step + 1, total: steps.length })}'],
];

// First, fix the steps array to be dynamic
content = content.replace(
  /const steps = \[\s*\{ icon: Building2, label: "Company Info" \},\s*\{ icon: FileText, label: "Document Upload" \},\s*\{ icon: User, label: "Contact Person" \},\s*\{ icon: ShieldCheck, label: "AVV Signature" \},\s*\{ icon: CheckSquare, label: "Review" \},\s*\];/g,
  `const getSteps = (t: any) => [
  { icon: Building2, label: t("auth.hc.steps.info") },
  { icon: FileText, label: t("auth.hc.steps.document") },
  { icon: User, label: t("auth.hc.steps.contact") },
  { icon: ShieldCheck, label: t("auth.hc.steps.avv") },
  { icon: CheckSquare, label: t("auth.hc.steps.review") },
];`
);

// We must also pass the steps where needed
content = content.replace(/const steps = \[.*?\];/s, '');
content = content.replace(/steps\.length/g, 'getSteps(t).length');
content = content.replace(/steps\.map/g, 'getSteps(t).map');

for (const [search, replace] of replacements) {
  content = content.split(search).join(replace);
}

fs.writeFileSync(targetPath, content);
console.log('Successfully translated hc/page.tsx');
