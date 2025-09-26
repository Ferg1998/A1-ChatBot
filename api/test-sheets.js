import { google } from "googleapis";

async function testGoogleSheet() {
  try {
    // Auth using your service account from Vercel
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Append a test row
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Sheet1!A:F",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[new Date().toISOString(), "TEST NAME", "test@example.com", "1234567890", "Test Lead", "Chatbot"]],
      },
    });

    console.log("✅ Row added:", response.statusText || "Success");
  } catch (error) {
    console.error("❌ Error writing to Google Sheet:", error);
  }
}

testGoogleSheet();
