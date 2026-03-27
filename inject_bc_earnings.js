const fs = require('fs');
const path = require('path');

const locales = ['en', 'de', 'es', 'nl', 'fr'];

const translations = {
  header: {
    title: "Earnings",
    subtitle: "Track your payouts, commission metrics, and manage your bank details.",
    export: "Export CSV"
  },
  metrics: {
    averagePayout: "Average Payout / Case",
    active: "+ Active",
    pendingTooltip: "Funds currently clearing the banking network. Typically takes 1-3 business days."
  },
  statusLabel: {
    unknown: "Unknown",
    awaiting: "Awaiting HC confirmation",
    confirmed: "Confirmed — pending payout",
    disputed: "Disputed",
    released: "Payout released",
    paid: "Paid"
  },
  breakdown: {
    title: "Completed Cases Breakdown",
    date: "Date",
    case: "Case",
    gross: "Fee Gross",
    commission: "Commission",
    net: "Net Payout",
    status: "Status",
    emptyState: "No completed cases yet."
  },
  history: {
    title: "Batch Payout History",
    subtitle: "Historically cleared payouts sent to your bank account.",
    period: "Period",
    cases: "Cases",
    netAmount: "Net Amount",
    status: "Status",
    ref: "Remittance Ref",
    emptyState: "No historic payouts available."
  },
  commission: {
    title: "Your Commission Rate",
    desc: "Platform commission is deducted transparently from each completed case. The minimum secure payout per case is €{amount}.",
    support: "Contact Partnership Support"
  }
};

for (const loc of locales) {
  const filePath = path.join(__dirname, 'messages', `${loc}.json`);
  let raw = fs.readFileSync(filePath, 'utf8');
  if (raw.endsWith('\n')) raw = raw.slice(0, -1);
  const data = JSON.parse(raw);
  
  if (!data.bc) data.bc = {};
  data.bc.earningsPage = translations;

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

console.log('Successfully injected bc.earningsPage');
