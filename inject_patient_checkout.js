const fs = require('fs');
const path = require('path');

const locales = ['en', 'de', 'es', 'nl', 'fr'];

const translations = {
  title: "Checkout",
  subtitle: "Complete your payment to secure the appointment.",
  card: "Credit Card",
  paypal: "PayPal",
  sepa: "SEPA Direct Debit",
  secureText: "Secure encrypted payment processing.",
  orderSummary: "Order Summary",
  baseFee: "Base Fee",
  travelAllowance: "Travel Allowance",
  urgencySurcharge: "Urgency Surcharge",
  labMaterials: "Laboratory Materials",
  materialShipping: "Material Shipping",
  returnLogistics: "Return Lab Logistics",
  subtotal: "Subtotal",
  vat: "VAT ({pct}%)",
  total: "Total",
  btnProcessing: "Processing payment...",
  btnConfirm: "Confirm & Pay — €{amount}",
  paymentFailed: "Payment failed"
};

for (const loc of locales) {
  const filePath = path.join(__dirname, 'messages', `${loc}.json`);
  let raw = fs.readFileSync(filePath, 'utf8');
  if (raw.endsWith('\n')) raw = raw.slice(0, -1);
  const data = JSON.parse(raw);
  
  if (!data.patient) data.patient = {};
  if (!data.patient.checkout) data.patient.checkout = {};
  
  data.patient.checkout = translations;

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

console.log('Successfully injected patient.checkout');
