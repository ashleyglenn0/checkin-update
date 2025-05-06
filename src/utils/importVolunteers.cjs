const admin = require("firebase-admin");
const fs = require("fs");
const csv = require("csv-parser");

// Initialize Firebase Admin
const serviceAccount = require("../../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Path to CSV file
const csvFilePath = "../atl_tech_week_volunteers.csv";

fs.createReadStream(csvFilePath)
  .pipe(csv())
  .on("data", async (row) => {
    const firstName = row.first_name?.trim();
    const lastName = row.last_name?.trim();
    const event = row.event?.trim();

    if (!firstName || !lastName || !event) return;

    try {
      await db.collection("volunteers").add({
        first_name: firstName,
        last_name: lastName,
        event,
      });
      console.log(`✅ Added: ${firstName} ${lastName} (${event})`);
    } catch (error) {
      console.error(`❌ Error adding ${firstName} ${lastName}:`, error);
    }
  })
  .on("end", () => {
    console.log("🎉 All done importing!");
  });
