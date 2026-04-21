/* 
  🚀 FEEDBACK V2 - UPLOADER (ZERO-READ & ROBUST)
  -----------------------------------------------
  UPDATES: 
  - Zero Firestore Reads: Uses static OFFICE_MAP for Document IDs.
  - Robust Normalization: Handles spaces, hyphens, and aliases (e.g., HRMU -> PHRMDO).
  - High-Performance: Generates 'date_iso' for optimized sorting.
*/

// 🔒 Firestore Credentials (Service Account)
const PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDozLg5pFsuLwus\nPmedehvUVgKfUTcrdFE6LGHPLqb6WnT0aD57GWYLbdGFZ9BmjNWSeqbmdreEv/KK\nqRHM3Cr86F1VhFTc9iyxjx/f6n990dpB+XlcAC22sq4k6EtYz7myPkNQ+HgnxqTO\nHYPNw8KMTPBE4K/oTPE0/hP1afdJu/LjtApS3eR0Bv6OdlgWoYmun8idckgpypvv\n4iwqGMcDmuRib/qf1dsMvVJICdGodicfDUp0SEDHFMuZIoyQrnL9o5ipIIhqJEBG\na8yKN1wqY74OBvSHzDhPx32tMuYftvOq+MRmdj6kCpMxrduxvmLxAa7ewQx+l0ne\n6w9zzLDVAgMBAAECggEABLrQDV/A+H29M3krGsB120kKEZmRUOEym0d2j0KH4vM+\niA6sIk0gTSAkjxzOV58J4cl7JZiI3voVX+rScUKR3wSLjOa84KZhvxPE1oRJpdFD\nKW77n7pjM2CK+DX9/eZug+gO7xC1RD2dcJCZ8m7FP5t6kDOubz5M8kItPqGyA/3z\nIc3bOqprfbHTNS9bi7Mbn/HqzTrSCvbqxDSkVxKlhrJMimNpmeWHDKecumVI6XUc\nRyzA/Rcf+QRwNX2Y3lm8YggAVBKwDhVdpvSmdxfpi5L7Rz8hbNpvbhnj+VCpkxhy\nozdyExe8ObYnQ5AYmxFc25jz+DCA196CXs+kl9rxqwKBgQD/ZvPLmOEuCWRzXz1m\nlHu0lCyjNlcUBHjb8YrqY1A3NRSvVSoK7ghu5exZMU8/SL7NsW0IqWCxQeBa8ul0\n48BJC748U1VtuoiRAxyOMXWWEHIY8wruyw2c3of0IJSPUpYVolnUXS+8xdyfZ7ov\n9/oFHrtvls1yFWncsO34aRY7hwKBgQDpWDkTp7GBz2q1rEcgaO5+emGy4Y4gGHIB\niDZGWXvUSHQWu/RSdYC4KDoqBL/lYrEmzs879V+Ffsf1nSCztUYUdMEMuTDiNEko\nbH36n3AI6nMRNdKnDNl4QEFZcZREMrxdR/S6Sn1WbSa/QlYT5sNSxhocEbz+aa+8\nVLozThgfwwKBgBH2KpUZ9lQngvH+M7JAJQcJGK6Nxsf4nItTTGK5g02upPrDsYY9\nQUiTUPDg3+LiedC7dqCSUOOGb4HV7Ycz8TTx53oUnkBuSuZv4pU5czyPgYaxqQYs\nL5PlrogDto7xzu5Mkaa2uwG6pI5tXBG9jc7IX4Q0hdRNHznPE51RvqeHAoGAM8Qh\nrW2XYI/uQW19vf/pYN+viuqlCBPEPvjD6alyYi7Mqjp6QkzVCIXMGYRCOhZB7LUW\nnluaHFh67c808Qk3CdS4+ySeZqBo1nHzJMV4KlIwwtGo8OxV1mqS1M/wr4x940fS\nT/20fpbqcKW7yOB51oQiSLXasqoplWNKh5U8ntcCgYABFdU2IVGNRprepcHZYxMf\n9MQbqV303P338LhiXJ/4itNTSFJG90gAw96zf11rc2nZT5c6VQHrRLui0g3FsxBA\nitfxka/oe7Q0hmqmAG3t1OTVSKk0815D/ITXjzW6Mzeo3zy7uwuRhhHozyKHm9rZ\nW8rAji8nzKtmgbdcHsHGLA==\n-----END PRIVATE KEY-----\n";


const CLIENT_EMAIL = "firebase-adminsdk-fbsvc@fir-7db1b.iam.gserviceaccount.com";
const PROJECT_ID = "fir-7db1b";

// 📋 Authoritative Office Mapping (Resolved Document IDs)
const OFFICE_MAP = {
    "PYESDO": "Oo8SncTif57Par1mD8Qh",
    "PCDO": "EYYhO3hx3qv3Vk7DsLlO",
    "PBO": "6rtAC0Fj6LFXgOtVAqqz",
    "OPAcc": "plDVyZ0k5exlD2ycR2q0",
    "PTO": "Rdk1srVihab79HF2WYQE",
    "OPAss": "coxwPIXceZiW4EVRWxjT",
    "LUPTO": "fyL3Jj0oT9Sz7OFLEJgY",
    "OPAg": "XVDKa8vegxLXGi6Hvpkc",
    "OPVet": "2YDEgjSnDWa04HelhhU3",
    "PEO": "B07H5fOSTTHAINTGLoqH",
    "LEEIPO": "alLavA504RCRVTc6pl2H",
    "PGENRO": "KHYNYnQCS2K6x3li8HpY",
    "PDRRMO": "PE2LWF0kYD3Ts0lIVBtE",
    "PSWDO": "A6N9YCKJPI5MR3gYS0PS",
    "PHO": "4sDwS8BnCW8iEedXwDIB",
    "LUPJ": "yqIWpVz1AltWv8DGUTTj",
    "OPG": "ngwLPpffcn6r6Gmn0JXI",
    "BACSU": "IEybBdoUaWaLo1FWH43a", // Alias for BACSD
    "ICTU": "HrefQV1wXaLk5BCYpkhD",  // Alias for PICTO
    "SSU": "A3OvRcZuc2Qh1bdXdHJE",                   // Missing in map, pending resolve
    "OPA": "nxf5KRcFvee28YDjeGCj",
    "HRMU": "vU1R99QcQlg8uoTQ2Zy2",  // Alias for PHRMDO
    "PIO": "N1oV5MCzrbNlGH2e2WSx",                   // Missing in map
    "LIBRARY": "klZR5KN1BZ7McXrcsYUJ",
    "PGSO": "A9MtgFfNFGo0n1QLaOdd",
    "PLO": "eAFa3HqMFdYKuPFpoxyz",
    "PPDC": "Zz6ZAA1Ke1aMRego2qP3",
    "SPO": "REENG7rp1w9Tl8X3uvMF",
    "PESU": "aHnuD3YqDutSe2CkNY47",  // Alias for PESO
    "ASMU": "JEpiax8iOybCklN0pVVX",  // Alias for ASMD
    "PHO-Clinic": "mtzwGnVKiYzsPfaxtsC4",
    "PHO-Warehouse": "lPItEQvggbonlMGAAMBQ",
    "PTO-Cash": "pB8n1YCNCxtrZU7IDY0M",
    "PTO-Assessor": "iGkSbnWbii1EZwUNeHVq"
};

// 📋 List of valid sheet names
const TARGET_SHEETS = Object.keys(OFFICE_MAP);

// 🔐 Get access token from service account
function getAccessToken_() {
    const jwtHeader = { alg: "RS256", typ: "JWT" };
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 1200; // 20 mins is plenty

    const jwtClaimSet = {
        iss: CLIENT_EMAIL,
        scope: "https://www.googleapis.com/auth/datastore",
        aud: "https://oauth2.googleapis.com/token",
        iat: iat,
        exp: exp
    };

    const encode = (obj) => Utilities.base64EncodeWebSafe(JSON.stringify(obj)).replace(/=+$/, "");
    const unsignedJWT = `${encode(jwtHeader)}.${encode(jwtClaimSet)}`;
    const signatureBytes = Utilities.computeRsaSha256Signature(unsignedJWT, PRIVATE_KEY);
    const signature = Utilities.base64EncodeWebSafe(signatureBytes).replace(/=+$/, "");

    const jwt = `${unsignedJWT}.${signature}`;
    const response = UrlFetchApp.fetch("https://oauth2.googleapis.com/token", {
        method: "post",
        payload: { grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }
    });

    return JSON.parse(response.getContentText()).access_token;
}

/**
 * Normalizes office names to handle hyphens vs spaces and aliases.
 */
function resolveOfficeId(name) {
    if (!name) return "Unknown";

    // 1. Basic cleaning
    const cleanName = name.trim().toUpperCase();

    // 2. Exact match in map
    if (OFFICE_MAP[name]) return OFFICE_MAP[name];
    if (OFFICE_MAP[cleanName]) return OFFICE_MAP[cleanName];

    // 3. Robust Match: Strip all symbols (Spaces/Hyphens)
    const normalized = cleanName.replace(/[-\s]/g, "");
    for (const key of Object.keys(OFFICE_MAP)) {
        if (key.toUpperCase().replace(/[-\s]/g, "") === normalized) {
            return OFFICE_MAP[key];
        }
    }

    return name; // Final fallback
}

// 🎯 Converts emoji answer to number
function convertEmojiToNumber(val) {
    const map = {
        "😀 Strongly Agree (5)": 5, "😊 Agree (4)": 4, "😐 Neither Agree nor Disagree (3)": 3,
        "☹️ Disagree (2)": 2, "😞 Strongly Disagree (1)": 1, "Not Applicable (0)": 0
    };
    return map[val?.trim()] ?? null;
}

// 🔼 Upload one document to Firestore
function uploadToFirestore(doc, accessToken) {
    if (!accessToken) accessToken = getAccessToken_();
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/Responses`;

    const payload = { fields: {} };
    for (const key in doc) {
        const value = doc[key];
        if (typeof value === 'number') {
            payload.fields[key] = { integerValue: value };
        } else {
            payload.fields[key] = { stringValue: value?.toString() || "" };
        }
    }

    const options = {
        method: 'post', contentType: 'application/json',
        headers: { Authorization: `Bearer ${accessToken}` },
        payload: JSON.stringify(payload)
    };
    UrlFetchApp.fetch(url, options);
}

// 🔁 Loop over all valid sheets and upload new data
function processSheets() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = ss.getSheets();
    const accessToken = getAccessToken_(); // 🚀 Fetch ONCE per run
    let uploadedCount = 0;

    sheets.forEach(sheet => {
        const sheetName = sheet.getName();
        const resolvedId = resolveOfficeId(sheetName);

        // Filter: only process sheets that we can map to an office ID
        // Note: We use TARGET_SHEETS check or just if we can resolve the ID
        if (resolvedId === sheetName && !TARGET_SHEETS.includes(sheetName)) return;

        const data = sheet.getDataRange().getValues();

        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if ((row[21] || "").toString().toLowerCase() === "uploaded") continue;

            const rawDate = row[0];
            let isoDate = "";
            try {
                const feedbackDate = new Date(rawDate);
                isoDate = Utilities.formatDate(feedbackDate, ss.getSpreadsheetTimeZone(), "yyyy-MM-dd");
            } catch (e) {
                Logger.log(`⚠️ Invalid date in ${sheetName} row ${i + 1}: ${rawDate}`);
            }

            const doc = {
                officeId: resolvedId, // 🚀 NEW NORMALIZED ID
                Office: sheetName,    // 📄 RETAINED FOR READABILITY
                Date: row[0],
                date_iso: isoDate,
                Name: row[1],
                Age: row[2],
                Gender: row[3],
                Client_Type: row[4],
                Address: row[5],
                Service_Availed: row[6],
                CC1: row[7],
                CC2: row[8],
                CC3: row[9],
                Comment: row[20]
            };

            for (let j = 0; j <= 9; j++) {
                doc[`Q${j}`] = convertEmojiToNumber(row[10 + j]);
            }

            try {
                uploadToFirestore(doc, accessToken);
                sheet.getRange(i + 1, 22).setValue("uploaded");
                uploadedCount++;
            } catch (e) {
                Logger.log(`❌ Failed: ${sheetName} row ${i + 1}: ${e}`);
            }
        }
    });

    Logger.log(`✅ Total entries uploaded: ${uploadedCount}`);
}
