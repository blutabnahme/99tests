const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'app/register/bc/page.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

content = content.replace(
  /const steps = \[\s*\{ icon: User, label: "Personal" \},\s*\{ icon: Award, label: "Qualifications" \},\s*\{ icon: BrainCircuit, label: "Experience" \},\s*\{ icon: Settings2, label: "Equipment" \},\s*\{ icon: MapPin, label: "Service Area" \},\s*\{ icon: Euro, label: "Pricing" \},\s*\{ icon: CheckSquare, label: "Review" \},\s*\];/g,
  `const getSteps = (t: any) => [
  { icon: User, label: t("auth.bc.steps.personal") },
  { icon: Award, label: t("auth.bc.steps.qualifications") },
  { icon: BrainCircuit, label: t("auth.bc.steps.experience") },
  { icon: Settings2, label: t("auth.bc.steps.equipment") },
  { icon: MapPin, label: t("auth.bc.steps.area") },
  { icon: Euro, label: t("auth.bc.steps.pricing") },
  { icon: CheckSquare, label: t("auth.bc.steps.review") },
];`
);

content = content.replace(/steps\.length/g, 'getSteps(t).length');
content = content.replace(/steps\.map/g, 'getSteps(t).map');

const replacements = [
  ['>Personal Information</h2>', '>{t("auth.bc.personalTitle")}</h2>'],
  ['>Tell us about yourself. This information will appear on your public profile.</p>', '>{t("auth.bc.personalSub")}</p>'],
  ['>Profile Photo</div>', '>{t("auth.bc.photoLabel")}</div>'],
  ['>A professional photo builds trust with patients. JPG or PNG, max 5MB.</div>', '>{t("auth.bc.photoSub")}</div>'],
  ['Upload Photo', '{t("auth.bc.photoUpload")}'],
  ['>Include numbers & symbols for a strong password.</p>', '>{t("auth.bc.pwdSub")}</p>'],

  ['>Professional Qualifications</h2>', '>{t("auth.bc.qualTitle")}</h2>'],
  ['>Verify your credentials. We\'ll review your documents within 24 hours.</p>', '>{t("auth.bc.qualSub")}</p>'],
  ['>Professional Type</Label>', '>{t("auth.bc.profType")}</Label>'],
  ['label: "Doctor (Arzt)"', 'label: t("auth.bc.typeDoctor")'],
  ['label: "Medical Assistant (MFA)"', 'label: t("auth.bc.typeMFA")'],
  ['label: "Nurse / Pediatric Nurse"', 'label: t("auth.bc.typeNurse")'],
  ['label: "Alternative Practitioner"', 'label: t("auth.bc.typeHeilpraktiker")'],
  ['>Qualification Document</Label>', '>{t("auth.bc.qualDoc")}</Label>'],
  ['<span className="font-semibold text-near-black">Drag and drop your document here</span>', '{t("auth.bc.dragDrop")}'],
  ['>Browse Files', '>{t("auth.bc.browseFiles")}'],
  ['>Practice Website URL / License Number</Label>', '>{t("auth.bc.practiceUrl")}</Label>'],
  ['placeholder="https://..."', 'placeholder={t("auth.bc.urlPlaceholder")}'],

  ['>Experience Profile</h2>', '>{t("auth.bc.expTitle")}</h2>'],
  ['>Help us match you with the right patients. Toggle on the areas where you have experience.</p>', '>{t("auth.bc.expSub")}</p>'],
  ['label="Experience with minors (pediatric)"', 'label={t("auth.bc.expMinor")}'],
  ['sublabel="Experience drawing blood from infants, toddlers, and children under 14."', 'sublabel={t("auth.bc.expMinorSub")}'],
  ['label="Elderly patients"', 'label={t("auth.bc.expElderly")}'],
  ['sublabel="Experience with older patients who may have fragile veins or mobility limitations."', 'sublabel={t("auth.bc.expElderlySub")}'],
  ['label="Difficult veins"', 'label={t("auth.bc.expDiff")}'],
  ['sublabel="Experience with veins that are hard to locate or tend to roll during puncture."', 'sublabel={t("auth.bc.expDiffSub")}'],
  ['label="Obese patients"', 'label={t("auth.bc.expObese")}'],
  ['sublabel="Experience with patients where vein access may be more challenging due to body composition."', 'sublabel={t("auth.bc.expObeseSub")}'],
  ['>Why does this matter?</strong>', '>{t("auth.bc.whyMatter")}</strong>'],
  ['Healthcare companies flag cases that need specialized experience. Your experience profile helps our matching algorithm connect you with cases where your skills make a difference — and earns you more bookings.', '{t("auth.bc.whyMatterDesc")}'],

  ['>Practice Equipment</h2>', '>{t("auth.bc.eqTitle")}</h2>'],
  ['>Some tests require specific equipment. Let us know what you have available.</p>', '>{t("auth.bc.eqSub")}</p>'],
  ['label="Centrifuge available"', 'label={t("auth.bc.eqCent")}'],
  ['sublabel="Required for serum separation. Some specialized labs require centrifuged samples."', 'sublabel={t("auth.bc.eqCentSub")}'],
  ['label="Freezer available (-20°C)"', 'label={t("auth.bc.eqFreez")}'],
  ['sublabel="Required for sample storage when immediate transport isn\'t possible."', 'sublabel={t("auth.bc.eqFreezSub")}'],
  ['>Additional Equipment (optional)</Label>', '>{t("auth.bc.eqAdd")}</Label>'],
  ['placeholder="e.g., Blood gas analyzer, cold chain transport box..."', 'placeholder={t("auth.bc.eqAddPlaceholder")}'],
  ['>Describe any other relevant equipment you have.</p>', '>{t("auth.bc.eqAddSub")}</p>'],

  ['>Service Area</h2>', '>{t("auth.bc.areaTitle")}</h2>'],
  ['>Define where and how you\'re available for blood collection.</p>', '>{t("auth.bc.areaSub")}</p>'],
  ['label="Available at practice"', 'label={t("auth.bc.availPrac")}'],
  ['sublabel="Patients can come to your location for blood draws."', 'sublabel={t("auth.bc.availPracSub")}'],
  ['label="Available for home visits"', 'label={t("auth.bc.availHome")}'],
  ['sublabel="You\'ll travel to the patient\'s location."', 'sublabel={t("auth.bc.availHomeSub")}'],
  ['>Maximum travel radius</Label>', '>{t("auth.bc.maxRadius")}</Label>'],
  ['{radius} km', '{t("auth.bc.radiusKm", {radius})}'],
  ['>Practice / Base Address</Label>', '>{t("auth.bc.baseAdd")}</Label>'],
  ['placeholder="Street, house number, PLZ, city"', 'placeholder={t("auth.bc.baseAddPlaceholder")}'],
  ['>This is used to calculate distances for matching and travel fees.</p>', '>{t("auth.bc.baseAddSub")}</p>'],

  ['>Pricing</h2>', '>{t("auth.bc.priceTitle")}</h2>'],
  ['>Set your base fee. Travel costs are calculated automatically.</p>', '>{t("auth.bc.priceSub")}</p>'],
  ['>Practice Visit Fee</span>', '>{t("auth.bc.pracVisit")}</span>'],
  ['>Base fee</Label>', '>{t("auth.bc.baseFee")}</Label>'],
  ['Min €15 — Max €100', '{t("auth.bc.minMaxRange")}'],
  ['>Home Visit Fee</span>', '>{t("auth.bc.homeVisit")}</span>'],
  ['>Travel fee calculation</div>', '>{t("auth.bc.calcTitle")}</div>'],
  ['>+ €0.40/km automatically calculated by the platform based on the patient\'s distance from your base.</div>', '>{t("auth.bc.calcSub")}</div>'],
  ['>How earnings work:</strong>', '>{t("auth.bc.earningsHow")}</strong>'],
  ['Patients pay through the platform. You receive your fee minus the platform commission (default 17.5%) via credit note, settled bi-weekly. Your net earnings are always visible before you accept a case.', '{t("auth.bc.earningsSub")}'],

  ['>Review your profile before submitting for verification.</p>', '>{t("auth.bc.reviewSubBc")}</p>'],
  ['|| "None specified"', '|| t("auth.bc.noneAssigned")'],
  ['? "Document uploaded" : "No document"', '? t("auth.bc.docUploaded") : t("auth.hc.notUploaded")'],
  ['title: "Personal"', 'title: t("auth.bc.steps.personal")'],
  ['title: "Qualifications"', 'title: t("auth.bc.steps.qualifications")'],
  ['title: "Experience"', 'title: t("auth.bc.steps.experience")'],
  ['title: "Equipment"', 'title: t("auth.bc.steps.equipment")'],
  ['title: "Service Area"', 'title: t("auth.bc.steps.area")'],
  ['title: "Pricing"', 'title: t("auth.bc.steps.pricing")'],
  ['After submitting, our team will review your qualifications within <strong>24 hours</strong>. You\'ll receive an email notification once your profile is approved and you can start receiving requests.', '{t("auth.bc.reviewAfterSubmit")} <strong>{t("auth.bc.hours24")}</strong>{t("auth.bc.reviewAfterSubmitP2")}'],

  ['> Previous', '> {t("auth.btnPrevious")}'],
  ['Continue <', '{t("auth.btnContinue")} <'],
  ['>Submitting...<', '>{t("auth.btnSubmitting")}<'],
  ['>Submit Application <', '>{t("auth.btnSubmitApplication")} <'],
  ['>Edit</button>', '>{t("auth.btnEdit")}</button>'],
  ['Step {step + 1} of {steps.length}', '{t("auth.stepOf", { current: step + 1, total: getSteps(t).length })}'],
  
  // Shared forms (confirm pwd, etc)
  ['placeholder="Create a strong password"', 'placeholder={t("auth.pwdPlaceholderCreate")}'],
  ['placeholder="Re-enter password"', 'placeholder={t("auth.pwdPlaceholderReenter")}'],
  ['>Confirm Password</Label>', '>{t("auth.confirmPassword")}</Label>'],
];

for (const [search, replace] of replacements) {
  content = content.split(search).join(replace);
}

fs.writeFileSync(targetPath, content);
console.log('Successfully translated bc/page.tsx');
