// api/test.js
import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    // Auth using Service Account JSON from Vercel
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Append a test row
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Sheet1!A:F",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          new Date().toISOString(),
          "TEST NAME",
          "test@example.com",
          "1234567890",
          "Test Lead",
          "Chatbot"
        ]],
      },
    });

    console.log("✅ Test row added to Google Sheet");

    return res.status(200).json({
      success: true,
      message: "✅ Test row added to Google Sheet",
    });
  } catch (error) {
    console.error("❌ Google Sheets test error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
