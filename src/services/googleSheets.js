import { google } from "googleapis";
import fs from "fs";

const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

export async function appendOrder(spreadsheetId, row) {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Orders!A:D", // kell, hogy legyen "Orders" nevű sheet
        valueInputOption: "RAW",
        resource: {
            values: [row],
        },
    });
}
