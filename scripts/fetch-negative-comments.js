const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Function to load env variables from .env.local if they exist
function loadEnvLocal() {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();
          if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
          process.env[key] = value;
        }
      });
    }
  } catch (err) {
    console.warn("Could not load .env.local:", err.message);
  }
}

async function fetchNegativeComments() {
  loadEnvLocal();
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    console.error('Error: FIREBASE_SERVICE_ACCOUNT_KEY not found in .env.local or environment.');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(serviceAccountKey);
  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }

  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
  }

  const db = admin.firestore();
  const allNegativeComments = [];

  console.log('Fetching negative comments from "Responses" collection...');
  const responsesSnapshot = await db.collection('Responses').get();
  responsesSnapshot.forEach(doc => {
    const data = doc.data();
    const rawClass = (data.Class || "").toLowerCase().trim();
    
    if (rawClass === "negative" && data.Comment && data.Comment.trim().length > 1) {
      let month = "Unknown";
      if (data.Date) {
        const date = new Date(data.Date);
        if (!isNaN(date.getTime())) {
          month = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        }
      }
      
      allNegativeComments.push({
        Month: month,
        Department: data.Office || "Unknown",
        "Negative Comment": data.Comment.trim()
      });
    }
  });

  console.log('Fetching negative comments from "physical_report" collection...');
  const physicalSnapshot = await db.collection('physical_report').get();
  physicalSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.COMMENTS && Array.isArray(data.COMMENTS)) {
      const classifications = Array.isArray(data.CLASSIFY) ? data.CLASSIFY : [];
      const month = data.FOR_THE_MONTH_OF || "Unknown";
      const department = data.DEPARTMENT || "Unknown";

      data.COMMENTS.forEach((comment, index) => {
        const rawClass = (classifications[index] || "").toLowerCase().trim();
        if (rawClass === "negative" && comment && comment.trim().length > 1) {
          allNegativeComments.push({
            Month: month,
            Department: department,
            "Negative Comment": comment.trim()
          });
        }
      });
    }
  });

  console.log('Deduplicating entries...');
  const uniqueKeys = new Set();
  const uniqueComments = [];

  allNegativeComments.forEach(item => {
    const key = `${item.Month}|${item.Department}|${item["Negative Comment"]}`;
    if (!uniqueKeys.has(key)) {
      uniqueKeys.add(key);
      uniqueComments.push(item);
    }
  });

  console.log('Sorting results by date...');
  const monthOrder = {
    'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
    'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
  };

  uniqueComments.sort((a, b) => {
    const parse = (str) => {
      if (!str || str === "Unknown") return new Date(0);
      const parts = str.split(' ');
      const monthIndex = monthOrder[parts[0]] || 0;
      const year = parseInt(parts[1]) || 0;
      return new Date(year, monthIndex);
    };
    return parse(a.Month) - parse(b.Month);
  });

  const outputPath = path.join(__dirname, '../negative_comments.json');
  fs.writeFileSync(outputPath, JSON.stringify(uniqueComments, null, 2));
  console.log(`Successfully fetched, deduplicated, and sorted ${uniqueComments.length} negative comments.`);
  console.log(`Data saved to ${outputPath}`);
}

fetchNegativeComments().catch(err => {
  console.error('Error fetching negative comments:', err);
  process.exit(1);
});
