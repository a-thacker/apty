#!/usr/bin/env node
// Generates a VAPID keypair for Web Push. Paste the output into your .env.
import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();

console.log("\nWeb Push VAPID keys — add these to .env (and rebuild the image):\n");
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log("\nAlso set VAPID_SUBJECT to a contact URL, e.g. mailto:you@example.com\n");
