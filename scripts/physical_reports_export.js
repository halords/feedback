// 🔒 Firestore Credentials
const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDozLg5pFsuLwus\nPmedehvUVgKfUTcrdFE6LGHPLqb6WnT0aD57GWYLbdGFZ9BmjNWSeqbmdreEv/KK\nqRHM3Cr86F1VhFTc9iyxjx/f6n990dpB+XlcAC22sq4k6EtYz7myPkNQ+HgnxqTO\nHYPNw8KMTPBE4K/oTPE0/hP1afdJu/LjtApS3eR0Bv6OdlgWoYmun8idckgpypvv\n4iwqGMcDmuRib/qf1dsMvVJICdGodicfDUp0SEDHFMuZIoyQrnL9o5ipIIhqJEBG\na8yKN1wqY74OBvSHzDhPx32tMuYftvOq+MRmdj6kCpMxrduxvmLxAa7ewQx+l0ne\n6w9zzLDVAgMBAAECggEABLrQDV/A+H29M3krGsB120kKEZmRUOEym0d2j0KH4vM+\niA6sIk0gTSAkjxzOV58J4cl7JZiI3voVX+rScUKR3wSLjOa84KZhvxPE1oRJpdFD\nKW77n7pjM2CK+DX9/eZug+gO7xC1RD2dcJCZ8m7FP5t6kDOubz5M8kItPqGyA/3z\nIc3bOqprfbHTNS9bi7Mbn/HqzTrSCvbqxDSkVxKlhrJMimNpmeWHDKecumVI6XUc\nRyzA/Rcf+QRwNX2Y3lm8YggAVBKwDhVdpvSmdxfpi5L7Rz8hbNpvbhnj+VCpkxhy\nozdyExe8ObYnQ5AYmxFc25jz+DCA196CXs+kl9rxqwKBgQD/ZvPLmOEuCWRzXz1m\nlHu0lCyjNlcUBHjb8YrqY1A3NRSvVSoK7ghu5exZMU8/SL7NsW0IqWCxQeBa8ul0\n48BJC748U1VtuoiRAxyOMXWWEHIY8wruyw2c3of0IJSPUpYVolnUXS+8xdyfZ7ov\n9/oFHrtvls1yFWncsO34aRY7hwKBgQDpWDkTp7GBz2q1rEcgaO5+emGy4Y4gGHIB\niDZGWXvUSHQWu/RSdYC4KDoqBL/lYrEmzs879V+Ffsf1nSCztUYUdMEMuTDiNEko\nbH36n3AI6nMRNdKnDNl4QEFZcZREMrxdR/S6Sn1WbSa/QlYT5sNSxhocEbz+aa+8\nVLozThgfwwKBgBH2KpUZ9lQngvH+M7JAJQcJGK6Nxsf4nItTTGK5g02upPrDsYY9\nQUiTUPDg3+LiedC7dqCSUOOGb4HV7Ycz8TTx53oUnkBuSuZv4pU5czyPgYaxqQYs\nL5PlrogDto7xzu5Mkaa2uwG6pI5tXBG9jc7IX4Q0hdRNHznPE51RvqeHAoGAM8Qh\nrW2XYI/uQW19vf/pYN+viuqlCBPEPvjD6alyYi7Mqjp6QkzVCIXMGYRCOhZB7LUW\nnluaHFh67c808Qk3CdS4+ySeZqBo1nHzJMV4KlIwwtGo8OxV1mqS1M/wr4x940fS\nT/20fpbqcKW7yOB51oQiSLXasqoplWNKh5U8ntcCgYABFdU2IVGNRprepcHZYxMf\n9MQbqV303P338LhiXJ/4itNTSFJG90gAw96zf11rc2nZT5c6VQHrRLui0g3FsxBA\nitfxka/oe7Q0hmqmAG3t1OTVSKk0815D/ITXjzW6Mzeo3zy7uwuRhhHozyKHm9rZ\nW8rAji8nzKtmgbdcHsHGLA==\n-----END PRIVATE KEY-----\n`.replace(/\\n/g, '\n');

const CLIENT_EMAIL = "firebase-adminsdk-fbsvc@fir-7db1b.iam.gserviceaccount.com";
const PROJECT_ID = "fir-7db1b";

// 🔐 Get access token from service account
let cachedAccessToken = null;
let accessTokenExpirationTime = 0; // Unix timestamp in seconds

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
    "SSU": "SSU",                   // Missing in map
    "OPA": "nxf5KRcFvee28YDjeGCj",
    "HRMU": "vU1R99QcQlg8uoTQ2Zy2",  // Alias for PHRMDO
    "PIO": "PIO",                   // Missing in map
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

/**
 * Normalizes office names to handle hyphens vs spaces and aliases.
 */
function resolveOfficeId(name) {
    if (!name) return "Unknown";
    const cleanName = name.trim().toUpperCase();
    if (OFFICE_MAP[name]) return OFFICE_MAP[name];
    if (OFFICE_MAP[cleanName]) return OFFICE_MAP[cleanName];
    const normalized = cleanName.replace(/[-\s]/g, "");
    for (const key of Object.keys(OFFICE_MAP)) {
        if (key.toUpperCase().replace(/[-\s]/g, "") === normalized) {
            return OFFICE_MAP[key];
        }
    }
    return name;
}

// 🔼 Upload one document to Firestore (revised for robust path and error handling)
function uploadToFirestore(doc) {
    // ...
    const accessToken = getAccessToken_();
    // Correctly form the URL for POSTing to a collection, resulting in an auto-generated ID
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/physical_report`;

    const payload = {
        fields: {}
    };

    for (const key in doc) {
        const value = doc[key];
        // Improved type mapping for Firestore's REST API
        if (typeof value === 'number') {
            // Use integerValue for whole numbers, doubleValue for decimals
            // Note: integerValue must be a string if it exceeds 32-bit signed integer range
            if (Number.isInteger(value)) {
                payload.fields[key] = { integerValue: value.toString() }; // Firestore expects string for integerValue
            } else {
                payload.fields[key] = { doubleValue: value };
            }
        } else if (typeof value === 'boolean') {
            payload.fields[key] = { booleanValue: value };
        } else if (value === null) {
            payload.fields[key] = { nullValue: null };
        } else if (Array.isArray(value)) {
            // Basic array handling: assuming elements are strings
            payload.fields[key] = {
                arrayValue: {
                    values: value.map(item => ({ stringValue: String(item) }))
                }
            };
        } else {
            // Default to stringValue for other types, ensuring it's always a string
            payload.fields[key] = { stringValue: String(value || "") };
        }
    }

    const options = {
        method: 'post', // POST to a collection creates a new document with an auto-generated ID
        contentType: 'application/json',
        headers: {
            Authorization: `Bearer ${accessToken}`
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true // Crucial for explicit error handling
    };

    Logger.log(`Attempting to upload to Firestore collection 'physical_report'.`);
    // Logger.log(`Payload: ${JSON.stringify(payload)}`); // Uncomment to log payload

    try {
        const response = UrlFetchApp.fetch(url, options);
        const responseCode = response.getResponseCode();
        const responseText = response.getContentText();

        if (responseCode >= 200 && responseCode < 300) {
            Logger.log(`Firestore upload successful! Document created. Status: ${responseCode}`);
            // Logger.log(`Response: ${responseText}`); // Uncomment to see full successful response
            return JSON.parse(responseText); // Return the document created response
        } else {
            Logger.log(`Firestore upload failed! Status: ${responseCode}, Error: ${responseText}`);
            throw new Error(`Firestore upload error (${responseCode}): ${responseText}`);
        }
    } catch (error) {
        Logger.log(`Error during Firestore upload: ${error.message}`);
        throw error; // Re-throw to indicate failure in processSheets
    }
}

// 🔁 Loop over all valid sheets and upload new data
function processSheets() {
    const sheetName = "cecile"; // Use the sheet name from myFunction
    const rangeOffice = 4; // Use the range from myFunction. This means it will process only 1 "office" block.

    try {
        for (let i = 0; i < rangeOffice; i++) {
            const offset = i * 10; // Assuming each "office" block is 10 columns wide
            const dataArray = getSheetData(sheetName, offset); // Get the data using getSheetData
            if (dataArray && dataArray.length > 0) {
                Logger.log("Processing data for offset " + offset + " (first document in block):");
                // We're expecting getSheetData to return an array of data objects,
                // but your uploadToFirestore processes only one doc at a time.
                // Assuming dataArray[0] is the intended single document to upload.
                uploadToFirestore(dataArray[0]);
                console.log(dataArray);
            } else {
                Logger.log(`No data found for offset ${offset} in sheet '${sheetName}'.`);
            }
        }
        Logger.log("Finished processing sheets and uploading data.");
    } catch (error) {
        Logger.log(`An error occurred during sheet processing: ${error.message}`);
    }
}

function getSheetData(sheetName, offset) {
    try {
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);

        if (!sheet) {
            throw new Error(`Sheet with name '${sheetName}' not found.`);
        }

        const lastRow = sheet.getLastRow();
        const lastColumn = sheet.getLastColumn();
        // Get all values to prevent multiple API calls to `getRange`
        const values = sheet.getRange(1, 1, lastRow, lastColumn).getValues();

        // --- 🕒 TIME OPTIMIZATION LOGIC ---
        const monthName = getSafeValue(values, 1, 2 + offset); // E.g., "JANUARY"
        const year = "2026";
        const monthMap = {
            'JANUARY': '01', 'FEBRUARY': '02', 'MARCH': '03', 'APRIL': '04',
            'MAY': '05', 'JUNE': '06', 'JULY': '07', 'AUGUST': '08',
            'SEPTEMBER': '09', 'OCTOBER': '10', 'NOVEMBER': '11', 'DECEMBER': '12'
        };
        const periodIso = `${year}-${monthMap[monthName.toUpperCase()] || '00'}`;
        // ----------------------------------

        const dataArray = [];

        const dataObject = {
            officeId: resolveOfficeId(getSafeValue(values, 1, 0 + offset)), // 🚀 NEW NORMALIZED ID
            DEPARTMENT: getSafeValue(values, 1, 0 + offset),              // 📄 RETAINED FOR READABILITY
            FOR_THE_MONTH_OF: monthName + " " + year,
            period_iso: periodIso,
            COLLECTED_FORMS: getSafeValue(values, 14, 1 + offset), // B15
            VISITORS: getSafeValue(values, 14, 3 + offset), // D15
            MALE: getSafeValue(values, 15, 5 + offset), // F16
            FEMALE: getSafeValue(values, 15, 3 + offset), // D16
            LGBTQ: getSafeValue(values, 15, 1 + offset), // B16
            PREFER_NOT_TO_SAY: getSafeValue(values, 15, 7 + offset), // H16
            DATE_COLLECTED: getSafeValue(values, 13, 1 + offset), // B14
            CITIZEN: getSafeValue(values, 17, 1 + offset), // B18
            BUSINESS: getSafeValue(values, 17, 3 + offset), // D18
            GOVERNMENT: getSafeValue(values, 17, 5 + offset), // F18
            YES: getSafeValue(values, 20, 1 + offset), // B21
            JUST_NOW: getSafeValue(values, 20, 2 + offset), // C21
            NO: getSafeValue(values, 20, 3 + offset), // D21
            VISIBLE: getSafeValue(values, 22, 1 + offset), // B23
            SOMEWHAT_VISIBLE: getSafeValue(values, 22, 2 + offset), // C23
            DIFFICULT_TO_SEE: getSafeValue(values, 22, 3 + offset), // D23
            NOT_VISIBLE: getSafeValue(values, 22, 4 + offset), // E23
            NA: getSafeValue(values, 22, 5 + offset), // F23
            VERY_MUCH: getSafeValue(values, 24, 1 + offset), // B25
            SOMEWHAT: getSafeValue(values, 24, 2 + offset), // C25
            DID_NOT_HELP: getSafeValue(values, 24, 3 + offset), // D25
            NA2: getSafeValue(values, 24, 4 + offset), // E25
            COMMENTS: [],
            CLASSIFY: []
        };

        for (let rowIdx = 2; rowIdx < lastRow; rowIdx++) {
            const comment = getSafeValue(values, rowIdx, 50 + offset);
            const classify = getSafeValue(values, rowIdx, 51 + offset);

            if (typeof comment === 'string' && comment.trim() !== "" &&
                !["#n/a", "n/a", "no comment"].includes(comment.trim().toLowerCase())
            ) {
                dataObject.COMMENTS.push(comment + ".");
                dataObject.CLASSIFY.push(typeof classify === 'string' && classify.trim().toLowerCase() !== "#n/a" ? classify.trim() : "");
            }
        }

        for (let rowIndex = 4; rowIndex <= 13; rowIndex++) {
            const dataRowIndexInValues = rowIndex - 1;
            dataObject[`${rowIndex - 4}NA`] = getSafeValue(values, dataRowIndexInValues, 1 + offset);
            for (let groupNum = 1; groupNum <= 5; groupNum++) {
                dataObject[`${rowIndex - 4}${groupNum}`] = getSafeValue(values, dataRowIndexInValues, groupNum + 1 + offset);
            }
        }

        dataArray.push(dataObject);
        return dataArray;
    } catch (error) {
        Logger.log("Error extracting sheet data: " + error.message);
        return null;
    }
}


function getSafeValue(values, rowIdx, colIdx) {
    // Ensure rowIdx and colIdx are within bounds of the 'values' 2D array
    if (values && values[rowIdx] && values[rowIdx][colIdx] !== undefined) {
        return values[rowIdx][colIdx];
    }
    return ""; // Return an empty string if cell is out of bounds or undefined
}