const fs = require('fs');
const path = require('path');

const locales = ['en', 'de', 'es', 'nl', 'fr'];

const confirmTranslations = {
  loading: "Loading your appointment details..."
};

const receiptTranslations = {
  errors: {
    notAvailable: "Receipt not available yet. Please complete payment first."
  },
  title: "Payment Successful",
  desc: "Your appointment has been confirmed and payment was securely processed.",
  amountPaid: "Amount Paid",
  paymentId: "Payment ID",
  date: "Date",
  caseRef: "Case Ref",
  btnDownload: "Download PDF Receipt",
  emailCopy: "A copy has also been sent to your email.",
  btnBack: "Back to Patient Portal"
};

for (const loc of locales) {
  const filePath = path.join(__dirname, 'messages', `${loc}.json`);
  let raw = fs.readFileSync(filePath, 'utf8');
  if (raw.endsWith('\n')) raw = raw.slice(0, -1);
  const data = JSON.parse(raw);
  
  if (!data.patient) data.patient = {};
  
  data.patient.confirm = confirmTranslations;
  data.patient.receipt = receiptTranslations;

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

console.log('Successfully injected patient.confirm and patient.receipt');
