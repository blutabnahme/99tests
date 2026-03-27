import { createServer } from 'http';
import crypto from 'crypto';

// The listener port
const PORT = 4000;

// Hardcoded for testing - must match what we set in Supabase for the HC
const WEBHOOK_SECRET = "whsec_0000000000000000000000000000000000000000000000000000000000000000";

let rejectAll = false; // Toggle to test Exponential Backoff

const server = createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      console.log(`\n\n--- INCOMING WEBHOOK at ${new Date().toISOString()} ---`);
      
      const signature = req.headers['x-99tests-signature'] as string;
      console.log(`Signature Header: ${signature}`);
      
      // Verify HMAC
      const expectedSignature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(body)
        .digest('hex');
        
      if (signature !== expectedSignature) {
        console.error("❌ SIGNATURE MISMATCH!");
        console.error(`Expected: ${expectedSignature}`);
        res.writeHead(401);
        res.end("Unauthorized");
        return;
      } else {
        console.log("✅ SIGNATURE VERIFIED");
      }

      console.log(`Payload Summary:\n${JSON.stringify(JSON.parse(body), null, 2)}`);

      if (rejectAll) {
         console.log("🔥 SIMULATING SERVER FAILURE `rejectAll = true` (500 Internal Server Error) 🔥");
         res.writeHead(500);
         res.end("Internal Server Error");
         return;
      }

      // Success
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: "success" }));
    });
  } else if (req.url === '/toggle-failure') {
     rejectAll = !rejectAll;
     console.log(`\n\n[ADMIN] Toggled rejection state to: ${rejectAll}\n\n`);
     res.writeHead(200);
     res.end(`Rejection State: ${rejectAll}`);
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`\n\n🚀 Mock Webhook Listener started on http://localhost:${PORT}`);
  console.log(`Awaiting payloads at POST /webhook`);
  console.log(`Open http://localhost:${PORT}/toggle-failure to easily trigger the Exponential Backoff loop.`);
});
