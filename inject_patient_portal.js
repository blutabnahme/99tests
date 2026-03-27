const fs = require('fs');
const path = require('path');

const locales = ['en', 'de', 'es', 'nl', 'fr'];

const translations = {
  portal: {
    errors: {
      invalidToken: "Invalid token or case not found.",
      failedConsent: "Failed to save consent.",
      failedBook: "Failed to book slot.",
      failedCounter: "Failed to counter propose.",
      failedSend: "Failed to send message.",
      failedTime: "Failed to submit time.",
      failedPayment: "Payment failed",
      failedRating: "Failed to submit rating.",
      failedChecklist: "Failed to save checklist.",
      failedCancel: "Failed to cancel appointment.",
      generic: "An error occurred"
    },
    alerts: {
      counterNeed3: "Please provide exactly 3 proposed times.",
      counterFuture: "All slots must be in the future.",
      cancelSuccess: "Appointment cancelled successfully. {refundedMsg}",
      refunded: "€{amount} refunded."
    },
    loading: "Loading...",
    errorPrefix: "Error: ",
    step0: {
      greeting: "Hello, {name}!",
      desc: "has arranged a blood collection for you. We just need a few things before we can finalize your appointment.",
      whatToExpect: "What to expect",
      item1: "Sign consent forms",
      item2: "Choose your blood collector",
      item3: "Review your appointment details",
      item4: "Complete payment",
      btnStart: "Let's get started",
      footer: "This process takes about 2 minutes. Your data is encrypted and protected under GDPR."
    },
    step1: {
      back: "Back",
      title: "Consent",
      desc: "Please review and agree to the following before we proceed.",
      blood: "Consent for blood collection",
      bloodDesc: "I consent to venous blood sampling and understand the associated risks (minor bruising, discomfort at the puncture site, and in rare cases, dizziness).",
      data: "Consent for data transfer",
      dataDesc: "I agree that my personal data may be shared with the assigned blood collector for the purpose of performing the blood draw.",
      gdpr: "GDPR data processing consent",
      gdprDesc: "I consent to the processing of my health data in accordance with GDPR for organizing this collection.",
      btnAgree: "I agree — continue"
    },
    step2: {
      title: "Choose Your Collector",
      desc: "Your healthcare provider has pre-approved these professionals. Pick the one you prefer.",
      noCollectors: "No available collectors found.",
      invited: "INVITED BY PROVIDER",
      waitingCounter: "Waiting for {name} to respond to your suggested times...",
      messageSent: "Message sent to {name}. They will suggest new times soon.",
      newTimes: "New times available from {name} — please select one",
      draws: "draws",
      newProposedTimes: "New Proposed Times",
      availableTimes: "Available Times",
      book1Hour: "1 hour",
      bookPrompt: "Book",
      bookPromptFor: "for",
      bookPromptAt: "at",
      btnConfirm: "Confirm & Continue to Payment",
      btnSuggest: "None of these times work? Suggest your own →",
      suggestTitle: "Suggest 3 Alternative Times",
      timeSelector: "Time",
      btnCancel: "Cancel",
      btnSendTo: "Send to {name}",
      btnDontWork: "These don't work either? Send a message →",
      tellBc: "Tell {name} what works for you",
      suggestPh: "e.g. I work from home and am flexible +/- 1 hour.",
      btnSendMessage: "Send Message",
      urgentWarning: "For urgent cases, please select from available times or choose another collector.",
      flexibleOpen: "This collector is also open to other times"
    },
    pathB: {
      title: "Request Sent!",
      desc: "Your time request has been sent to",
      desc2: "We'll notify you by email once they respond.",
      requestedTime: "Requested Time",
      btnView: "View Confirmation Page",
      footer: "You will complete the payment for your appointment only after {name} confirms the time."
    },
    step4: {
      title: "Your Appointment",
      desc: "Here are your booking details.",
      assigned: "Your assigned collector",
      rating: "Rating",
      collections: "Collections",
      time: "Time",
      homeVisit: "Home Visit",
      inPractice: "In Practice",
      priceBreakdown: "Price Breakdown",
      baseFee: "Collector base fee",
      travelFee: "Travel fee",
      materials: "Materials",
      shipping: "Shipping fee",
      vat: "VAT (19%)",
      total: "Total",
      btnCancelAppt: "Cancel Appointment",
      btnRate: "Rate your Experience"
    },
    step5: {
      title: "Payment",
      desc: "Complete your payment to confirm the appointment. Your payment is held securely in escrow until completion.",
      amountDue: "Amount Due",
      inclVat: "Including 19% VAT",
      paymentMethod: "Payment Method",
      card: "Credit Card",
      cardDesc: "Visa, Mastercard",
      sepa: "SEPA Direct",
      sepaDesc: "German bank account",
      paypal: "PayPal",
      paypalDesc: "Pay with your PayPal account",
      btnProcessing: "Processing...",
      btnPay: "Pay €{amount}"
    },
    step6: {
      title: "How was your experience?",
      desc: "Rate your blood collection with {name}.",
      feedback: "Share your feedback (optional)",
      feedbackPh: "Tell us about your experience...",
      btnSubmitting: "Submitting...",
      btnSubmit: "Submit Rating",
      successTitle: "Thank you!",
      successDesc: "Your rating has been submitted. Your blood sample is being processed — your healthcare provider will receive the results directly.",
      btnDownload: "Download Receipt (PDF)"
    },
    footer: "© {year} Hematch • Secure Portal",
    cancelModal: {
      title: "Cancel Appointment",
      desc: "Are you sure you want to cancel your blood test appointment with {name}?",
      policy: "Refund Policy",
      refundFull: "You will be refunded the full €{amount}.",
      collectorNoComp: "Your blood collector will not receive compensation.",
      refundHalf: "12-24h cancellation: You will be refunded €{amount}.",
      collectorHalfComp: "Your blood collector will receive €{amount} for the reserved time.",
      refundNone: "Less than 12h cancellation: No refund applies.",
      collectorFullComp: "Your blood collector will receive €{amount} for the reserved time.",
      reasonLabel: "Reason",
      reasonOptionEmpty: "Select a reason...",
      reasonConflict: "Schedule conflict",
      reasonNotNeeded: "No longer needed",
      reasonAlternative: "Found alternative",
      reasonOther: "Other",
      otherPh: "Please specify...",
      btnKeep: "Keep Appointment",
      btnCancelling: "Cancelling...",
      btnConfirm: "Confirm Cancel"
    }
  }
};

for (const loc of locales) {
  const filePath = path.join(__dirname, 'messages', `${loc}.json`);
  let raw = fs.readFileSync(filePath, 'utf8');
  if (raw.endsWith('\n')) raw = raw.slice(0, -1);
  const data = JSON.parse(raw);
  
  if (!data.patient) data.patient = {};
  // Avoid overriding completely, just set the keys
  if (!data.patient.portal) data.patient.portal = {};
  
  // Overwrite the portal namespace
  data.patient.portal = translations.portal;

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

console.log('Successfully injected patient.portal');
