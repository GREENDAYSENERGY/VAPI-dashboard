/**
 * Patches the VAPI assistant to add an analysisPlan.
 * Run once: node scripts/patch-assistant-analysis.mjs
 * Requires VAPI_API_KEY and VAPI_ASSISTANT_ID in .env.local
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Load .env.local manually
const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const [key, ...rest] = line.split("=");
  if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
}

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID;

if (!VAPI_API_KEY || !ASSISTANT_ID) {
  console.error("Missing VAPI_API_KEY or VAPI_ASSISTANT_ID in .env.local");
  process.exit(1);
}

const analysisPlan = {
  // AI-generated summary shown in the call modal
  summaryPrompt:
    "Summarize this call in 2-3 sentences. Include the customer's name if mentioned, their interest level in solar, and the outcome of the conversation.",

  // Pass/fail evaluation
  successEvaluationPrompt:
    "Did the call result in a positive outcome? Answer true if an appointment was booked or the customer clearly requested a callback.",
  successEvaluationRubric: "PassFail",

  // Structured fields extracted from transcript
  structuredDataPrompt:
    "Based on the call transcript, extract the structured data fields. " +
    "disposition options: CB (callback requested), VM (voicemail left), DNC (do not call / not interested), " +
    "NQ (not qualified), Booked (appointment scheduled), Completed (conversation completed, no next step).",

  structuredDataSchema: {
    type: "object",
    properties: {
      disposition: {
        type: "string",
        enum: ["CB", "VM", "DNC", "NQ", "Booked", "Completed"],
        description:
          "Call outcome: CB=Callback requested, VM=Voicemail, DNC=Do Not Call, NQ=Not Qualified, Booked=Appointment booked, Completed=Call finished",
      },
      appointment_booked: {
        type: "boolean",
        description: "True if an appointment was successfully scheduled during this call",
      },
      callback_time: {
        type: "string",
        description:
          "If the customer requested a callback, when (e.g. 'tomorrow morning', 'Friday afternoon'). Empty string if not applicable.",
      },
      interest_level: {
        type: "string",
        enum: ["high", "medium", "low", "none"],
        description: "Customer's apparent interest level in solar energy",
      },
      customer_name: {
        type: "string",
        description: "Customer name if mentioned in the conversation. Empty string if unknown.",
      },
    },
    required: ["disposition", "appointment_booked"],
  },
};

console.log(`Patching assistant ${ASSISTANT_ID}...`);

const res = await fetch(`https://api.vapi.ai/assistant/${ASSISTANT_ID}`, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${VAPI_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ analysisPlan }),
});

const data = await res.json();

if (!res.ok) {
  console.error("❌ Failed:", res.status, JSON.stringify(data, null, 2));
  process.exit(1);
}

console.log("✅ Assistant updated successfully!");
console.log("analysisPlan:", JSON.stringify(data.analysisPlan, null, 2));
