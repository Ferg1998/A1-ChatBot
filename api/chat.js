import fs from "fs";
import path from "path";

// Load the JSON flow once
const flowPath = path.join(process.cwd(), "flow.json");
const flow = JSON.parse(fs.readFileSync(flowPath, "utf8")).flow;

// Simple in-memory sessions for testing
const sessions = {};

function getStep(stepId) {
  return flow.find((s) => s.id === stepId);
}

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, session_id = "default" } = req.body;

  if (!sessions[session_id]) {
    // start at greeting
    sessions[session_id] = {
      currentStep: "greeting",
      data: {}
    };
  }

  let session = sessions[session_id];
  let step = getStep(session.currentStep);

  // Save user response if needed
  if (step.save_as) {
    if (Array.isArray(step.save_as)) {
      const parts = message.split(" ");
      if (parts.length >= 2) {
        session.data.email = parts[0];
        session.data.phone = parts[1];
      }
    } else {
      session.data[step.save_as] = message;
    }
  }

  // Handle branching logic
  if (step.branch) {
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.startsWith("y")) {
      session.currentStep = step.branch.yes;
    } else {
      session.currentStep = step.branch.no;
    }
  } else {
    session.currentStep = step.next;
  }

  // If we're at confirmation, finalize lead
  if (session.currentStep === "confirmation") {
    session.data.timestamp = new Date().toISOString();
    session.data.status = "New Lead";

    const confirmStep = getStep("confirmation");
    res.json({
      reply: confirmStep.bot
        .replace("{{name}}", session.data.name || "")
        .replace("{{email}}", session.data.email || "")
        .replace("{{phone}}", session.data.phone || ""),
      lead: session.data
    });

    // ⚡️ Here’s where you’d call your Google Sheets append function
    console.log("Captured lead:", session.data);

    // Reset session for new conversation
    delete sessions[session_id];
    return;
  }

  // Get the next step
  step = getStep(session.currentStep);

  // Fill placeholders in bot reply
  let reply = step.bot;
  for (const key in session.data) {
    reply = reply.replace(`{{${key}}}`, session.data[key]);
  }

  res.json({ reply });
}
