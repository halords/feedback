const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const { Storage } = require('@google-cloud/storage');
const os = require('os');

const storage = new Storage();

// 🔐 Handle login logic
async function loginUser(db, { username, password }) {
  if (!username || !password) {
    return { status: 400, data: { error: 'Username and password required' } };
  }

  const userRef = db.collection('users').where('username', '==', username);
  const snapshot = await userRef.get();

  if (snapshot.empty) {
    return { status: 404, data: { error: 'User not found' } };
  }

  const userDoc = snapshot.docs[0];
  const userData = userDoc.data();

  const match = await bcrypt.compare(password, userData.password);
  if (!match) {
    return { status: 401, data: { error: 'Incorrect password' } };
  }

//   console.log('userData.idno:', userData.idno);

    const office_data1 = db.collection('user_data').where('idnumber', '==', userData.idno);
    const offices1 = await office_data1.get();
    const docuser = offices1.docs[0];
    const fullName = docuser.data();
    // console.log(fullName.full_name);
  
  const office_data = db.collection('office_assignment').where('idno', '==', userData.idno);
    const offices = await office_data.get();

    let allOffices = [];

    // Loop through each document and push the office array into allOffices
    offices.forEach(doc => {
    const officeData = doc.data();
    allOffices = allOffices.concat(officeData.office);  // Concatenates all office arrays into one
    });

  return {
    status: 200,
    data: {
      message: 'Login successful',
      user: {
        fullname: fullName.full_name,
        username: userData.username,
        user_type: userData.user_type,
        offices: allOffices // Return offices as part of the login response
      }
    }
  };
}

// Function to get user data, filtering by offices
async function getUserData(db, offices) {
    // console.log(offices);
    try {
      if (!offices || offices.length === 0) {
        console.log("No offices provided, returning empty data.");
        return []; // Return empty if no offices are passed
      }
  
      // Query Responses collection with the offices list (using 'in' query for multiple offices)
      const snapshot = await db.collection('Responses').where('Office', 'in', offices).get(); 
  
      const data = [];
  
      // Check if snapshot exists and has docs
      if (snapshot.empty) {
        console.log("No documents found!");
        return [];
      }
  
      snapshot.docs.forEach((doc, index) => {
        const docData = doc.data(); // Get data of the document
      
        // Format the date to the desired format
        const formattedDate = new Date(docData.Date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        // Filter the necessary fields and add to the data array
        const filteredData = {
          docID: doc.id,
          user: {
          no: index + 1, // Row number starting from 1
          Name: docData.Name,
          Client_Type: docData.Client_Type,
          Office: docData.Office,
          Service_Availed: docData.Service_Availed,
          Date: formattedDate, // Add formatted date
          Comment: docData.Comment,
          Class: docData.Class || "",
        }
      };
  
        data.push(filteredData); // Add filtered data to the array
        // console.log(filteredData);
      });
      
      return data; // Return filtered data
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw new Error('Error fetching user data');
    }
}
  
async function getUsers(db) {
  try {
    const snapshot = await db.collection('users').get();
    const officeD = [];
    const data = [];
    const id = [];

    if (snapshot.empty) {
      console.log("No documents found!");
      return [];
    }
    // let office_list = [];
    for (const [index, doc] of snapshot.docs.entries()) {
      const docData = doc.data();
      
      // 🔥 Await each Firestore query
      const userinfoSnapshot = await db.collection('user_data')
        .where('idnumber', '==', docData.idno)
        .get();
      id.push(docData.idno);
      const docuser = !userinfoSnapshot.empty 
        ? userinfoSnapshot.docs[0].data() 
        : { full_name: 'Unknown', Office: 'Unknown' };

      const officesSnapshot = await db.collection('office_assignment')
        .where('idno', '==', docData.idno)
        .get();

      const assignment = officesSnapshot.empty 
        ? ['Unknown'] 
        : officesSnapshot.docs.map(d => d.data().office);
      // office_list = assignment;
      // ✅ Build the final object
      const filteredData = {
        no: index + 1,
        Name: docuser.full_name,
        Position: docuser.position,
        Office: docuser.office,
        User_Type: docData.user_type,
        Office_Assignment: assignment // already an array
      };

      data.push(filteredData);
    }

    const officeAssignmentSnapshot = await db.collection('office_assignment').get();
    const assignedOffices = new Set();

    officeAssignmentSnapshot.forEach(doc => {
      assignedOffices.add(doc.data().office); // Adjust key if it's different
    });

    // Step 2: Get all offices from 'office'
    const allOfficesSnapshot = await db.collection('offices').get();
    const unassignedOffices = [];

    allOfficesSnapshot.forEach(doc => {
      const officeData = doc.data();
      const officeName = officeData.name; // Change to actual field name if needed
    
      if (!assignedOffices.has(officeName)) {
        unassignedOffices.push(officeData); // Directly push the officeData object
      }
    });
    // console.log(data);
    officeD.push(...unassignedOffices);
    // console.log(id);
    const finalData = {
      idno: id,
      lists : officeD,
      users : data
    };
    // console.log(finalData);
    return finalData;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw new Error('Error fetching user data');
  }
}

function normalizeKey(key) {
  return key.replace(/-/g, ' ').trim().toLowerCase();
}

async function analyzeResponsesByOffice(db, offices, month, year) {
  if (!offices || offices.length === 0) {
      console.log("No offices provided, returning empty data.");
      return {}; // Return empty object if no offices are passed
  }
  const yearxmonth = month+" "+year;
  const offline = await getOfflineReport(db, offices, month, year);
  // console.log(offline);

  const online = await getOnlineReport(db, offices, month, year);
  // console.log(online);

  const mergeData = {};

  offices.forEach(office =>{
    if(!mergeData[office]){
      const normalized = normalizeKey(office);
      const array1  = Object.keys(offline).find(key => normalizeKey(key) === normalized);
      const array2 = Object.keys(online).find(key => normalizeKey(key) === normalized);
  
       // Get the data for the matched keys (or null if no match)
      const dept1 = array1 ? offline[array1] : null;
      const dept2 = array2 ? online[array2] : null;
  
      if(dept1 && dept2){
        const mergedValues = {};

        for (let i = 0; i <= 9; i++) {
          const key = `Q${i}`;
        
          const q1 = (dept1.qValues[key]?.['1'] || 0) + (dept2.qValues[key]?.['1'] || 0);
          const q2 = (dept1.qValues[key]?.['2'] || 0) + (dept2.qValues[key]?.['2'] || 0);
          const q3 = (dept1.qValues[key]?.['3'] || 0) + (dept2.qValues[key]?.['3'] || 0);
          const q4 = (dept1.qValues[key]?.['4'] || 0) + (dept2.qValues[key]?.['4'] || 0);
          const q5 = (dept1.qValues[key]?.['5'] || 0) + (dept2.qValues[key]?.['5'] || 0);
          const qNA = (dept1.qValues[key]?.NA || 0) + (dept2.qValues[key]?.NA || 0);
        
          const totalCollection = dept1.collection + dept2.collection;
          const denominator = totalCollection - qNA;
          const numerator = q4 + q5;
        
          const rate = denominator > 0
            ? ((numerator / denominator) * 100).toFixed(2) + '%'
            : 'N/A';

            mergedValues[key] = {
            '1': q1,
            '2': q2,
            '3': q3,
            '4': q4,
            '5': q5,
            NA: qNA,
            RATE: rate
          };
        }

        // Helper to extract numeric value from RATE string
        const parseRate = (rate) => {
          if (typeof rate === 'string' && rate.endsWith('%')) {
            return parseFloat(rate);
          }
          return 0;
        };

        // Collect RATEs
        let rate1 = parseRate(mergedValues['Q1']?.RATE);
        let rate1to5 = 0;
        let rate6to9 = 0;

        let count1to5 = 0;
        let count6to9 = 0;

        for (let i = 1; i <= 9; i++) {
          const rateStr = mergedValues[`Q${i}`]?.RATE;
          const rate = parseRate(rateStr);

          if (rateStr === 'N/A' || isNaN(rate)) {
            continue; // Skip invalid or N/A rates
          }

          if (i >= 2 && i <= 6) {
            rate1to5 += rate;
            count1to5++;
          } else if (i >= 7 && i <= 9) {
            rate6to9 += rate;
            count6to9++;
          }
        }

        const avg1to5 = count1to5 > 0 ? (rate1to5 / count1to5).toFixed(2) + '%' : 'N/A';
        const avg6to9 = count6to9 > 0 ? (rate6to9 / count6to9).toFixed(2) + '%' : 'N/A';
        // console.log(avg1to5);
        // Final 3-point average: RATE1, avg(1-5), avg(6-9)
        let finalAverage = 'N/A';
        if (rate1 && avg1to5 !== 'N/A' && avg6to9 !== 'N/A') {
          const totalAvg = ((rate1 + parseFloat(avg1to5) + parseFloat(avg6to9)) / 3).toFixed(2);
          finalAverage = totalAvg + '%';
        }
        let collection = "";
        let collectRate = "";
        let collectDate = "";
        let visitors = 0;
        if(Number(dept1.collection) === 0 && Number(dept2.collection) === 0){
          collection = "No Collection";
        }else if(Number(dept1.collection) === 0 && Number(dept2.collection) !== 0){
          collection = dept2.collection;
          collectRate = "100%";
          collectDate = "Not Applicable";
        }else{
          const totalCollect = dept1.collection + dept2.collection;
          // collection = dept1.collection + dept2.collection;
          if(totalCollect > dept1.visitor){
            visitors = totalCollect;
            collectRate = "100%";
            collection = totalCollect;
            collectDate = dept1.date_collected;
          }else{
            collection = totalCollect;
            collectRate = (((dept1.collection + dept2.collection)/dept1.visitor)*100).toFixed(2)+"%";
            collectDate = dept1.date_collected;
            visitors = dept1.visitor;
          }
        }

        mergeData[office] = {
          department: office,
          fullname: "",
          month: yearxmonth,
          date_collected: dept1.date_collected,
          offline: dept1.collection,
          online: dept2.collection,
          collection: collection,
          visitor: visitors,
          collection_rate: collectRate,
          gender: { Male: dept1.gender.Male + dept2.gender.Male, Female: dept1.gender.Female + dept2.gender.Female, LGBTQ: dept1.gender.LGBTQ + dept2.gender.LGBTQ, Others: dept1.gender.Others },
          cc1: { Yes: dept1.cc1.Yes + dept2.cc1.Yes, "Just Now": dept1.cc1['Just Now'] + dept2.cc1['Just Now'], No: dept1.cc1.No + dept2.cc1.No }, // Added criteria
          cc2: { Visible: dept1.cc2.Visible + dept2.cc2.Visible, "Somewhat Visible": dept1.cc2['Somewhat Visible'] + dept2.cc2['Somewhat Visible'], "Difficult to see": dept1.cc2['Difficult to see'] + dept2.cc2['Difficult to see'], "Not Visible": dept1.cc2['Not Visible'] + dept2.cc2['Not Visible'], "N/A": dept1.cc2['N/A'] + dept2.cc2['N/A'] }, // Added criteria
          cc3: { "Very Much": dept1.cc3['Very Much'] + dept2.cc3['Very Much'], Somewhat: dept1.cc3.Somewhat + dept2.cc3.Somewhat, "Did Not Help": dept1.cc3['Did Not Help'] + dept2.cc3['Did Not Help'], "N/A": dept1.cc3['N/A'] + dept2.cc3['N/A'] }, // Added criteria
          clientType: { Citizen: dept1.clientType.Citizen + dept2.clientType.Citizen, "Government (Employee or another Agency)": dept1.clientType['Government (Employee or another Agency)'] + dept2.clientType['Government (Employee or another Agency)'], Business: dept1.clientType.Business + dept2.clientType.Business }, // Added Client Type
          qValues: mergedValues,
          sysrate: avg1to5,
          staffrate: avg6to9,
          overrate: finalAverage,
          comments: {
            positive: [...dept1.comments.positive, ...dept2.comments.positive],
            negative: [...dept1.comments.negative, ...dept2.comments.negative],
            suggestions: [...dept1.comments.suggestions, ...dept2.comments.suggestions],
          },
        }
        
      }else if(dept1){
        const mergedValues = {};

        for (let i = 0; i <= 9; i++) {
          const key = `Q${i}`;
        
          const q1 = (dept1.qValues[key]?.['1'] || 0);
          const q2 = (dept1.qValues[key]?.['2'] || 0);
          const q3 = (dept1.qValues[key]?.['3'] || 0);
          const q4 = (dept1.qValues[key]?.['4'] || 0);
          const q5 = (dept1.qValues[key]?.['5'] || 0);
          const qNA = (dept1.qValues[key]?.NA || 0);
        
          const totalCollection = dept1.collection;
          const denominator = totalCollection - qNA;
          const numerator = q4 + q5;
          
          const rate = denominator > 0
            ? ((numerator / denominator) * 100).toFixed(2) + '%'
            : 'N/A';
        
            mergedValues[key] = {
            '1': q1,
            '2': q2,
            '3': q3,
            '4': q4,
            '5': q5,
            NA: qNA,
            RATE: rate
          };
        }
        
        // Helper to extract numeric value from RATE string
        const parseRate = (rate) => {
          if (typeof rate === 'string' && rate.endsWith('%')) {
            return parseFloat(rate);
          }
          return 0;
        };

        // Collect RATEs
        let rate1 = parseRate(mergedValues['Q1']?.RATE);
        let rate1to5 = 0;
        let rate6to9 = 0;

        let count1to5 = 0;
        let count6to9 = 0;

        for (let i = 1; i <= 9; i++) {
          const rateStr = mergedValues[`Q${i}`]?.RATE;
          const rate = parseRate(rateStr);

          if (rateStr === 'N/A' || isNaN(rate)) {
            continue; // Skip invalid or N/A rates
          }

          if (i >= 2 && i <= 6) {
            rate1to5 += rate;
            count1to5++;
          } else if (i >= 7 && i <= 9) {
            rate6to9 += rate;
            count6to9++;
          }
        }

        const avg1to5 = count1to5 > 0 ? (rate1to5 / count1to5).toFixed(2) + '%' : 'N/A';
        const avg6to9 = count6to9 > 0 ? (rate6to9 / count6to9).toFixed(2) + '%' : 'N/A';
        // console.log(avg1to5);
        // Final 3-point average: RATE1, avg(1-5), avg(6-9)
        let finalAverage = 'N/A';
        if (rate1 && avg1to5 !== 'N/A' && avg6to9 !== 'N/A') {
          const totalAvg = ((rate1 + parseFloat(avg1to5) + parseFloat(avg6to9)) / 3).toFixed(2);
          finalAverage = totalAvg + '%';
        }
        
        let visitors = 0;
        let collectRate ="";
        // collection = dept1.collection + dept2.collection;
        if(dept1.collection > dept1.visitor){
          visitors = dept1.collection;
          collectRate = "100%";
        }else{
          collectRate = ((dept1.collection/dept1.visitor)*100).toFixed(2)+"%";
          collectDate = dept1.date_collected;
          visitors = dept1.visitor;
        }
        mergeData[office] = {
          department: office,
          fullname: "",
          month: yearxmonth,
          date_collected: dept1.date_collected,
          offline: dept1.collection,
          online: "No online data.",
          collection: dept1.collection,
          visitor: visitors,
          collection_rate: collectRate,
          gender: { Male: dept1.gender.Male, Female: dept1.gender.Female , LGBTQ: dept1.gender.LGBTQ, Others: dept1.gender.Others },
          cc1: { Yes: dept1.cc1.Yes, "Just Now": dept1.cc1['Just Now'], No: dept1.cc1.No }, // Added criteria
          cc2: { Visible: dept1.cc2.Visible, "Somewhat Visible": dept1.cc2['Somewhat Visible'], "Difficult to see": dept1.cc2['Difficult to see'], "Not Visible": dept1.cc2['Not Visible'], "N/A": dept1.cc2['N/A'] }, // Added criteria
          cc3: { "Very Much": dept1.cc3['Very Much'], Somewhat: dept1.cc3.Somewhat, "Did Not Help": dept1.cc3['Did Not Help'], "N/A": dept1.cc3['N/A'] }, // Added criteria
          clientType: { Citizen: dept1.clientType.Citizen, "Government (Employee or another Agency)": dept1.clientType['Government (Employee or another Agency)'], Business: dept1.clientType.Business }, // Added Client Type
          qValues: mergedValues,
          sysrate: avg1to5,
          staffrate: avg6to9,
          overrate: finalAverage,
          comments: {...dept1.comments},
        }
      }else if(dept2){
        const mergedValues = {};

        for (let i = 0; i <= 9; i++) {
          const key = `Q${i}`;
        
          const q1 = (dept2.qValues[key]?.['1'] || 0);
          const q2 = (dept2.qValues[key]?.['2'] || 0);
          const q3 = (dept2.qValues[key]?.['3'] || 0);
          const q4 = (dept2.qValues[key]?.['4'] || 0);
          const q5 = (dept2.qValues[key]?.['5'] || 0);
          const qNA = (dept2.qValues[key]?.NA || 0);
        
          const totalCollection = dept2.collection;
          const denominator = totalCollection - qNA;
          const numerator = q4 + q5;
        
          
          const rate = denominator > 0
            ? ((numerator / denominator) * 100).toFixed(2) + '%'
            : '0.00%';
        
            mergedValues[key] = {
            '1': q1,
            '2': q2,
            '3': q3,
            '4': q4,
            '5': q5,
            NA: qNA,
            RATE: rate
          };
        }

        // Helper to extract numeric value from RATE string
        const parseRate = (rate) => {
          if (typeof rate === 'string' && rate.endsWith('%')) {
            return parseFloat(rate);
          }
          return 0;
        };

        // Collect RATEs
        let rate1 = parseRate(mergedValues['Q1']?.RATE);
        let rate1to5 = 0;
        let rate6to9 = 0;

        let count1to5 = 0;
        let count6to9 = 0;

        for (let i = 1; i <= 9; i++) {
          const rateStr = mergedValues[`Q${i}`]?.RATE;
          const rate = parseRate(rateStr);

          if (rateStr === 'N/A' || isNaN(rate)) {
            continue; // Skip invalid or N/A rates
          }

          if (i >= 2 && i <= 6) {
            rate1to5 += rate;
            count1to5++;
          } else if (i >= 7 && i <= 9) {
            rate6to9 += rate;
            count6to9++;
          }
        }

        const avg1to5 = count1to5 > 0 ? (rate1to5 / count1to5).toFixed(2) + '%' : 'N/A';
        const avg6to9 = count6to9 > 0 ? (rate6to9 / count6to9).toFixed(2) + '%' : 'N/A';

        // Final 3-point average: RATE1, avg(1-5), avg(6-9)
        let finalAverage = 'N/A';
        if (rate1 && avg1to5 !== 'N/A' && avg6to9 !== 'N/A') {
          const totalAvg = ((rate1 + parseFloat(avg1to5) + parseFloat(avg6to9)) / 3).toFixed(2);
          finalAverage = totalAvg + '%';
        }

        mergeData[office] = {
          department: office,
          fullname: "",
          month: yearxmonth,
          date_collected: "Pure online collection.",
          offline: "No offline data.",
          online: dept2.collection,
          collection: dept2.collection,
          visitor: dept2.collection,
          collection_rate: "100%",
          gender: { Male: dept2.gender.Male, Female: dept2.gender.Female , LGBTQ: dept2.gender.LGBTQ, Others: 0 },
          cc1: { Yes: dept2.cc1.Yes, "Just Now": dept2.cc1['Just Now'], No: dept2.cc1.No }, // Added criteria
          cc2: { Visible: dept2.cc2.Visible, "Somewhat Visible": dept2.cc2['Somewhat Visible'], "Difficult to see": dept2.cc2['Difficult to see'], "Not Visible": dept2.cc2['Not Visible'], "N/A": dept2.cc2['N/A'] }, // Added criteria
          cc3: { "Very Much": dept2.cc3['Very Much'], Somewhat: dept2.cc3.Somewhat, "Did Not Help": dept2.cc3['Did Not Help'], "N/A": dept2.cc3['N/A'] }, // Added criteria
          clientType: { Citizen: dept2.clientType.Citizen, "Government (Employee or another Agency)": dept2.clientType['Government (Employee or another Agency)'], Business: dept2.clientType.Business }, // Added Client Type
          qValues: mergedValues,
          sysrate: avg1to5,
          staffrate: avg6to9,
          overrate: finalAverage,
          comments: {...dept2.comments},
        }
      }
    }
  });

  // console.log(mergeData);

  return mergeData;

}

function chunkArray(arr, size) {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

async function getOnlineReport(db, offices, month, year) {
  const batchSize = 30;  // Max number of offices per query
  const officeBatches = chunkArray(offices, batchSize);  // Split offices into batches of 30

  const batchPromises = officeBatches.map(async (batch) => {
    if (batch.length === 0) return {}; // Skip empty batches

    try {
      const snapshot = await db.collection('Responses').where('Office', 'in', batch).get();

      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      const results = {};

      // Pre-populate results with default values for all offices in the batch
      batch.forEach(office => {
        results[office] = {
          collection: 0,
          gender: { Male: 0, Female: 0, LGBTQ: 0 },
          cc1: { Yes: 0, "Just Now": 0, No: 0 },
          cc2: { Visible: 0, "Somewhat Visible": 0, "Difficult to see": 0, "Not Visible": 0, "N/A": 0 },
          cc3: { "Very Much": 0, Somewhat: 0, "Did Not Help": 0, "N/A": 0 },
          clientType: { Citizen: 0, "Government (Employee or another Agency)": 0, Business: 0 },
          qValues: {
            Q0: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, NA: 0 },
            Q1: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, NA: 0 },
            Q2: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, NA: 0 },
            Q3: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, NA: 0 },
            Q4: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, NA: 0 },
            Q5: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, NA: 0 },
            Q6: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, NA: 0 },
            Q7: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, NA: 0 },
            Q8: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, NA: 0 },
            Q9: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, NA: 0 },
          },
          comments: {
            positive: [],
            negative: [],
            suggestions: [],
          },
        };
      });

      snapshot.forEach(doc => {
        const response = doc.data();
        if (!response) return;  // Skip if response data is empty

        const office = response.Office;
        const comment = response.Comment;
        const classs = response.Class;
        const dateStr = new Date(response.Date);  // Convert the 'Date' string to Date object

        // Skip if date is invalid
        if (isNaN(dateStr)) return;

        const docMonth = dateStr.getMonth() + 1; // 0-based month, so +1
        const docYear = dateStr.getFullYear();

        // Filter by selected month & year
        if (months[docMonth - 1] !== month || docYear !== year) return;

        // Gender Processing
        const gender = response.Gender || 'Unknown';
        if (gender === 'Male') {
          results[office].gender.Male++;
        } else if (gender === 'Female') {
          results[office].gender.Female++;
        } else {
          results[office].gender.LGBTQ++;
        }

        results[office].collection = results[office].gender.Male + results[office].gender.Female + results[office].gender.LGBTQ;

        // CC1, CC2, CC3 Processing
        const cc1 = response.CC1 || 'N/A';
        const cc2 = response.CC2 || 'N/A';
        const cc3 = response.CC3 || 'N/A';

        if (results[office].cc1[cc1] !== undefined) {
          results[office].cc1[cc1]++;
        } else {
          results[office].cc1["N/A"]++;
        }

        if (results[office].cc2[cc2] !== undefined) {
          results[office].cc2[cc2]++;
        } else {
          results[office].cc2["N/A"]++;
        }

        if (results[office].cc3[cc3] !== undefined) {
          results[office].cc3[cc3]++;
        } else {
          results[office].cc3["N/A"]++;
        }

        // Client Type Processing
        const clientType = response.Client_Type || 'N/A';
        if (clientType === 'Citizen') {
          results[office].clientType.Citizen++;
        } else if (clientType === 'Government (Employee or another Agency)') {
          results[office].clientType["Government (Employee or another Agency)"]++;
        } else if (clientType === 'Business') {
          results[office].clientType.Business++;
        }
        // Consider adding an 'else' here if you want to handle other client types

        // Q0-Q9 Processing
        for (let i = 0; i <= 9; i++) {
          const qKey = `Q${i}`;
          let qValue = response[qKey];

          if (qValue !== undefined && qValue !== null) {
            if (!results[office].qValues[qKey]) {
              results[office].qValues[qKey] = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, 'NA': 0 };
            }

            // Treat 0 or '0' as NA
            if (qValue === 0 || qValue === '0' || qValue === '') {
              results[office].qValues[qKey]['NA'] += 1;
            } else {
              const valueStr = String(qValue);
              results[office].qValues[qKey][valueStr] = (results[office].qValues[qKey][valueStr] || 0) + 1;
            }
          }
        }

        // Collect Comments
        if (comment) {
          // Step 1: Cleanse the comment (remove special characters, unwanted phrases, and single letters)
          const cleanseText = (comment) => {
            if (!comment) return null;
      
            // Step 1a: Remove non-alphanumeric characters and trim
            const cleanedComment = comment.replace(/[^a-zA-Z0-9\s]/g, '').trim();
      
            // Step 1b: Remove unwanted phrases (using the cleaned comment)
            const unwantedPhrases = [
              "None", "nothing", "No comment", "no comment", "N/A", "n/a", "N/a", "Nothing", "NA", "na"
            ];
            const regex = new RegExp(`\\b(${unwantedPhrases.join("|")})\\b`, "i");
            if (regex.test(cleanedComment)) return null;
      
            // Step 1c: Remove single-letter comments (using the cleaned comment)
            if (cleanedComment.length <= 1) return null;
      
            return cleanedComment;
          };
      
          // Step 2: Remove duplicate words within the comment
          const removeDuplicateWords = (comment) => {
            const words = comment.split(" ");
            const uniqueWords = [...new Set(words)]; // Remove duplicates using Set
            return uniqueWords.join(" "); // Reassemble the comment without duplicate words
          };
      
          // Step 3: Check if the comment is already present in the list for the same category
          const isDuplicateComment = (category, comment) => {
            return results[office].comments[category].some(existingComment => existingComment === comment);
          };
      
          // Cleanse the comment
          const cleanedComment = cleanseText(comment);
      
          // If the comment is not null after cleansing, continue
          if (cleanedComment) {
            const uniqueComment = removeDuplicateWords(cleanedComment); // Remove duplicate words
      
            // Step 4: Classify and add to the appropriate category if it's not a duplicate
            const classType = (classs || "").toLowerCase();
      
            if (classType === "negative") {
              if (!isDuplicateComment('negative', uniqueComment)) {
                results[office].comments.negative.push(uniqueComment);
              }
            } else if (classType === "suggestion") {
              if (!isDuplicateComment('suggestions', uniqueComment)) {
                results[office].comments.suggestions.push(uniqueComment);
              }
            } else {
              if (!isDuplicateComment('positive', uniqueComment)) {
                results[office].comments.positive.push(uniqueComment);
              }
            }
          }
        }                   
      });

      return results;
    } catch (e) {
      console.error('Error analyzing online report:', e);
      return {}; // Return empty object if an error occurs
    }
  });

  const allResults = await Promise.all(batchPromises)
    .then(results => {
      // Merge results from all batches
      return results.reduce((acc, currentResults) => {
        return Object.assign(acc, currentResults);
      }, {});
    })
    .catch(error => {
      console.error('Error processing batches:', error);
      return {}; // Return empty object if an error occurs
    });

  return allResults;
}
function normalizeDateString(dateStr) {
  // Check if already in "Month D, YYYY" format
  const isFormatted = /^[A-Z][a-z]+ \d{1,2}, \d{4}$/.test(dateStr.trim());
  if (isFormatted) {
    return dateStr;
  }

  // Remove time zone in parentheses if present
  const cleanedDateStr = dateStr.replace(/\s*\(.*\)$/, '');

  const parsedDate = new Date(cleanedDateStr);

  if (!isNaN(parsedDate.getTime())) {
    return parsedDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  return dateStr; // Fallback
}
async function getOfflineReport(db, offices, month, year) {
  const batchSize = 20;  // Max number of offices per query
  const officeBatches = chunkArray(offices, batchSize);

  const allBatchResults = await Promise.all(
    officeBatches.map(async (batch) => {
      try {
        const formattedBatchOffices = batch.map(office => office.replace(/-/g, ' '));
        const snapshot = await db
          .collection('physical_report')
          .where('DEPARTMENT', 'in', formattedBatchOffices)
          .get();

        const targetMonthYear = `${month} ${year}`;
        const batchResults = {};

        // Initialize results for all offices in the current batch
        batch.forEach(office => {
          batchResults[office] = {
            collection: 0,
            date_collected: "",
            gender: { Male: 0, Female: 0, LGBTQ: 0, Others: 0 },
            visitor: 0,
            cc1: { Yes: 0, "Just Now": 0, No: 0 },
            cc2: { Visible: 0, "Somewhat Visible": 0, "Difficult to see": 0, "Not Visible": 0, "N/A": 0 },
            cc3: { "Very Much": 0, Somewhat: 0, "Did Not Help": 0, "N/A": 0 },
            clientType: { Citizen: 0, "Government (Employee or another Agency)": 0, Business: 0 },
            qValues: {
              Q0: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, NA: 0 },
              Q1: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, NA: 0 },
              Q2: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, NA: 0 },
              Q3: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, NA: 0 },
              Q4: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, NA: 0 },
              Q5: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, NA: 0 },
              Q6: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, NA: 0 },
              Q7: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, NA: 0 },
              Q8: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, NA: 0 },
              Q9: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, NA: 0 },
            },
            comments: {
              positive: [],
              negative: [],
              suggestions: [],
            },
          };
        });

        snapshot.forEach(item => {
          const data = item.data();
          const docMonthYear = data.FOR_THE_MONTH_OF;
          const dept = data.DEPARTMENT?.trim();
          const originalOfficeName = offices.find(office => office.replace(/-/g, ' ') === dept);

          if (docMonthYear === targetMonthYear && originalOfficeName) {
            if (!batchResults[originalOfficeName]) {
              // This should ideally not happen due to the initialization
              batchResults[originalOfficeName] = { ...batchResults[batch[0]] }; // Initialize if somehow missing
            }
            // console.log(data.DATE_COLLECTED, formattedDate);
            batchResults[originalOfficeName].collection += parseInt(data.COLLECTED_FORMS);
            batchResults[originalOfficeName].gender.Male += parseInt(data.MALE || 0);
            batchResults[originalOfficeName].gender.Female += parseInt(data.FEMALE || 0);
            batchResults[originalOfficeName].gender.LGBTQ += parseInt(data.LGBTQ || 0);
            batchResults[originalOfficeName].gender.Others += parseInt(data.PREFER_NOT_TO_SAY || 0);
            batchResults[originalOfficeName].visitor += parseInt(data.VISITORS || 0);
            const processedDate = normalizeDateString(data.DATE_COLLECTED); // Assuming normalizeDateString is your date processing function
            if (processedDate) {
              batchResults[originalOfficeName].date_collected = processedDate;
            }
            batchResults[originalOfficeName].cc1.Yes += parseInt(data.YES || 0);
            batchResults[originalOfficeName].cc1['Just Now'] += parseInt(data.JUST_NOW || 0);
            batchResults[originalOfficeName].cc1.No += parseInt(data.NO || 0);
            batchResults[originalOfficeName].cc2.Visible += parseInt(data.VISIBLE || 0);
            batchResults[originalOfficeName].cc2['Somewhat Visible'] += parseInt(data.SOMEWHAT_VISIBLE || 0);
            batchResults[originalOfficeName].cc2['Difficult to see'] += parseInt(data.DIFFICULT_TO_SEE || 0);
            batchResults[originalOfficeName].cc2['Not Visible'] += parseInt(data.NOT_VISIBLE || 0);
            batchResults[originalOfficeName].cc2['N/A'] += parseInt(data.NA || 0);
            batchResults[originalOfficeName].cc3['Very Much'] += parseInt(data.VERY_MUCH || 0);
            batchResults[originalOfficeName].cc3.Somewhat += parseInt(data.SOMEWHAT || 0);
            batchResults[originalOfficeName].cc3['Did Not Help'] += parseInt(data.DID_NOT_HELP || 0);
            batchResults[originalOfficeName].cc3['N/A'] += parseInt(data.NA2 || 0);
            batchResults[originalOfficeName].clientType.Citizen += parseInt(data.CITIZEN || 0);
            batchResults[originalOfficeName].clientType.Business += parseInt(data.BUSINESS || 0);
            batchResults[originalOfficeName].clientType['Government (Employee or another Agency)'] += parseInt(data.GOVERNMENT || 0);

            for (let i = 0; i <= 9; i++) {
              const qKey = `Q${i}`;
              const naKey = `${i}NA`;
              if (batchResults[originalOfficeName].qValues[qKey]) {
                batchResults[originalOfficeName].qValues[qKey]['1'] += parseInt(data[`${i}1`] || 0);
                batchResults[originalOfficeName].qValues[qKey]['2'] += parseInt(data[`${i}2`] || 0);
                batchResults[originalOfficeName].qValues[qKey]['3'] += parseInt(data[`${i}3`] || 0);
                batchResults[originalOfficeName].qValues[qKey]['4'] += parseInt(data[`${i}4`] || 0);
                batchResults[originalOfficeName].qValues[qKey]['5'] += parseInt(data[`${i}5`] || 0);
                batchResults[originalOfficeName].qValues[qKey].NA += parseInt(data[naKey] || 0);
              }
            }

            if (data.COMMENTS) {
              const commentList = Array.isArray(data.COMMENTS)
                  ? data.COMMENTS.map(c => (typeof c === 'string' ? c.trim() : String(c).trim())) // Ensure strings, trim
                  : typeof data.COMMENTS === 'string'
                      ? data.COMMENTS.includes('.,') || data.COMMENTS.includes('!,') || data.COMMENTS.includes('?.,')
                          ? data.COMMENTS.split(/(?:\.\,|\!\,|\?\.,)/).map(c => c.trim())
                          : [data.COMMENTS.trim()]
                      : [String(data.COMMENTS).trim()]; // Convert to string and trim if not array/string
          
              // Function to cleanse text based on the given conditions
              const cleanseText = (comment) => {
                  if (!comment) return null;
          
                  // Step 1: Remove non-alphanumeric characters and trim
                  const cleanedComment = comment.replace(/[^a-zA-Z0-9\s]/g, '').trim();
          
                  // Step 2: Remove unwanted phrases (using the cleaned comment)
                  const unwantedPhrases = [
                      "None", "nothing", "No comment", "no comment", "N/A", "n/a", "N/a", "Nothing", "NA", "na"
                  ];
                  const regex = new RegExp(`\\b(${unwantedPhrases.join("|")})\\b`, "i");
                  if (regex.test(cleanedComment)) return null;
          
                  // Step 3: Remove single-letter comments (using the cleaned comment)
                  if (cleanedComment.length <= 1) return null;
          
                  return cleanedComment;
              };
          
              const cleansedComments = commentList.map(cleanseText);
              // console.log(cleansedComments);
              const classList = (data.CLASSIFY || "").split(',').map(c => c.trim()).filter(c => c.length > 0);
          
              commentList.forEach((comment, index) => {
                  if (comment) { // Process only if the comment is not null after cleansing
                      const classType = classList[index];
          
                      // Add cleaned comments to the respective categories
                      if (classType === "negative" || classType === "Negative" || classType === "NEGATIVE") {
                          batchResults[originalOfficeName].comments.negative.push(comment);
                      } else if (classType === "suggestion" || classType === "Suggestion" || classType === "SUGGESTION") {
                          batchResults[originalOfficeName].comments.suggestions.push(comment);
                      } else {
                          batchResults[originalOfficeName].comments.positive.push(comment);
                      }
                  }
              });
          }
          //  console.log('Before merge', originalOfficeName, batchResults[originalOfficeName].date_collected);
          }
        });
        // console.log(batchResults)
        return batchResults;
      } catch (error) {
        console.error('Error analyzing offline report:', error);
        const errorResult = {};
        batch.forEach(office => {
          errorResult[office] = {}; // Return an empty object for each office in case of error
        });
        return errorResult;
      }
    })
  );
  // Merge results from all batches, ensuring all original offices are present
  const finalResults = {};
  offices.forEach(office => {
    finalResults[office] = {}; // Initialize all offices in the final result
    allBatchResults.forEach(batchResult => {
      if (batchResult[office]) {
        // Merge the data fields except date_collected
        finalResults[office] = {
          ...finalResults[office],  // Keep the existing fields in finalResults[office]
          ...batchResult[office],   // Update with new batchResult[office] data
        };
  
        // Manually handle the merging of date_collected
        if (batchResult[office].date_collected) {
          finalResults[office].date_collected = batchResult[office].date_collected;
        }
      }
    });
    // If no data was found, ensure the structure is still there with default values
    if (Object.keys(finalResults[office]).length === 0) {
      finalResults[office] = {
        collection: 0,
        date_collected: "",
        gender: { Male: 0, Female: 0, LGBTQ: 0, Others: 0 },
        visitor: 0,
        cc1: { Yes: 0, "Just Now": 0, No: 0 },
        cc2: { Visible: 0, "Somewhat Visible": 0, "Difficult to see": 0, "Not Visible": 0, "N/A": 0 },
        cc3: { "Very Much": 0, Somewhat: 0, "Did Not Help": 0, "N/A": 0 },
        clientType: { Citizen: 0, "Government (Employee or another Agency)": 0, Business: 0 },
        qValues: {
          Q0: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, NA: 0 },
          Q1: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, NA: 0 },
          Q2: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, NA: 0 },
          Q3: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, NA: 0 },
          Q4: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, NA: 0 },
          Q5: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, NA: 0 },
          Q6: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, NA: 0 },
          Q7: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, NA: 0 },
          Q8: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, NA: 0 },
          Q9: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, NA: 0 },
        },
        comments: {
          positive: [],
          negative: [],
          suggestions: [],
        },
      };
    }
  });
  
  return finalResults;
}

// Your existing PDF bytes and fields.json path
async function generatePDF(formData) {
  const sourceFileNameInStorage = 'files/REPORT.pdf'; 

  // CRITICAL CORRECTION: Firebase Storage bucket names end with '.appspot.com'
  const bucketName = 'fir-7db1b.firebasestorage.app'; // CORRECTED BUCKET NAME FORMAT

  // Define the temporary local path where the PDF will be downloaded
  const pdfPath = path.join(os.tmpdir(), 'REPORT.pdf'); // This is the local path on the Cloud Function's disk

  // Get references to your bucket and the specific file within it
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(sourceFileNameInStorage);

  // --- Download the PDF from Firebase Storage to the Function's local /tmp directory ---
  // First, check if the file exists in storage to provide a better error if not found.
  const [exists] = await file.exists();
  if (!exists) {
      console.error(`Error: The file '${sourceFileNameInStorage}' was not found in Firebase Storage bucket '${bucketName}'.`);
      // It's good practice to send an appropriate error response here.
      // This assumes you're inside an Express route handler or similar.
      return res.status(404).send('PDF template file not found in cloud storage.');
  }

  // Perform the download. The file is saved to 'pdfPath' (e.g., /tmp/REPORT.pdf).
  await file.download({ destination: pdfPath });
  console.log(`File '${sourceFileNameInStorage}' downloaded to '${pdfPath}' successfully.`);

  // --- Load the Downloaded PDF into PDFDocument ---
  // This line now correctly reads the file from the /tmp/ directory.
  const existingPdfBytes = fs.readFileSync(pdfPath);

  // CRITICAL CORRECTION: You want to load an EXISTING PDF template.
  // Use PDFDocument.load() to parse the bytes of your existing PDF.
  // PDFDocument.create() would start a brand new, empty PDF.
  const pdfDoc = await PDFDocument.load(existingPdfBytes); // CORRECTED: Load the existing PDF

  // --- Continue with your PDF modifications ---
  // This line is correct for embedding a font into the loaded document.
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  // console.log(formData);
  const fieldMap = {
    department: 'DEPARTMENT',
    fullname: 'fullname',
    month: 'FOR THE MONTH OF',
    collection: 'COLLECTED FORMS',
    collection_rate: 'COLLECTION RATE',
    visitor: 'REGISTERED CLIENTVISITOR',
    'gender.Male': 'MALE',
    'gender.Female': 'FEMALE',
    'gender.LGBTQ': 'LGBTQ',
    'gender.Others': 'PREFER NOT TO SAY',
    'clientType.Citizen': 'CITIZEN',
    'clientType.Business': 'BUSINESS',
    'clientType.Government': 'GOVERNMENT',
    'cc1.Yes': 'YES',
    'cc1.Just Now': 'JUST NOW',
    'cc1.No': 'NO',
    'cc2.Visible': 'VISIBLE',
    'cc2.Somewhat Visible': 'SOMEWHAT VISIBLE',
    'cc2.Difficult to see': 'DIFFICULT TO SEE',
    'cc2.Not Visible': 'NOT VISIBLE',
    'cc2.N/A': 'NA',
    'cc3.Very Much': 'VERY MUCH',
    'cc3.Somewhat': 'SOMEWHAT',
    'cc3.Did Not Help': 'DID NOT HELP',
    'cc3.N/A': 'NA2',
    date_collected: 'DATE COLLECTED',
    sysrate: 'SYSRATE',
    staffrate: 'STAFFRATE',
    overrate: 'OVERRATE',
  };

  for (const departmentName in formData) {
    const dept = formData[departmentName];
    dept.department = departmentName;

    const deptPdf = await PDFDocument.load(existingPdfBytes);
    const form = deptPdf.getForm();

    // Fill form fields
    for (const [key, fieldName] of Object.entries(fieldMap)) {
      let value = getNestedValue(dept, key);
      if (value === "" || value === "0" || value === 0) {
        value = "";
      }

      // Convert fullname to uppercase
      if (key === 'fullname' && typeof value === 'string') {
        value = value.toUpperCase();
      }

      try {
        const field = form.getTextField(fieldName);

         // Draw centered text manually
        const pages = deptPdf.getPages();
        const page = pages[0];
        const { x, y, width, height } = field.acroField.getWidgets()[0].getRectangle();

        const text = String(value);
        if (text.trim()) {
          const textWidth = helveticaFont.widthOfTextAtSize(text, 12);
          const centerX = x + (width - textWidth) / 2;
          const centerY = y + (height - 12) / 2;

          page.drawText(text, {
            x: centerX,
            y: centerY,
            size: 12,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          });
        }
      } catch (err) {
        console.warn(`Error setting field ${fieldName}: ${err.message}`);
      }
    }

    for (let i = 0; i <= 9; i++) {
      const na = `${i}NA`;
      const rate = `${i}RATE`;
      const qKey = `Q${i}`;

      // const field = form.getTextField(na);

      const fieldValue = ['NA', 'RATE', '5', '4', '3', '2', '1'];
      const pdfField = [na, rate, `${i}5`, `${i}4`, `${i}3`, `${i}2`, `${i}1`];

      for(let j=0; j< fieldValue.length; j++){

        const field = form.getTextField(pdfField[j]);

        const pages = deptPdf.getPages();
        const page = pages[0];

        const text = String(dept.qValues[qKey][fieldValue[j]] || '');
        const { x, y, width, height } = field.acroField.getWidgets()[0].getRectangle();
        if (text.trim()) {
          const textWidth = helveticaFont.widthOfTextAtSize(text, 12);
          const centerX = x + (width - textWidth) / 2;
          const centerY = y + (height - 12) / 2;

          page.drawText(text, {
            x: centerX,
            y: centerY,
            size: 10,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          });
        }
      }
    }

    // Handle comments
    function cleanseText(text) {
      if (!text) return "";
  
      // Step 1: Remove non-alphanumeric characters (keeping spaces)
      const alphanumericCleanedText = text.replace(/[^a-zA-Z0-9\s]/g, '');
  
      // Step 2: Normalize whitespace (replace newlines, tabs with spaces, and reduce multiple spaces)
      const normalizedText = alphanumericCleanedText
        .replace(/\n/g, ' ')
        .replace(/\r/g, '')
        .replace(/\t/g, ' ')
        .replace(/\s+/g, ' ')
        .trim(); // Trim leading/trailing spaces
  
      return normalizedText;
    }
  
    function removeRepetitiveComments(commentsArray) {
      if (!Array.isArray(commentsArray)) {
        return [];
      }
  
      // Define the unwanted comments in lowercase
      const unwantedComments = ["n/a", "no comment", "no comments", "none", "na"];
      const seenCleanedComments = new Set();
      const uniqueCleanedComments = [];
  
      for (const comment of commentsArray) {
        // Cleanse the text first
        const cleanedComment = cleanseText(comment);
  
        // Check if the cleaned comment is not an unwanted comment and not a single letter
        const lowercasedCleanedComment = cleanedComment.toLowerCase();
        if (!unwantedComments.includes(lowercasedCleanedComment) && cleanedComment.length > 1) {
          // Check for duplicates based on the cleaned comment
          if (!seenCleanedComments.has(cleanedComment)) {
            uniqueCleanedComments.push(cleanedComment);
            seenCleanedComments.add(cleanedComment);
          }
        }
      }
  
      return uniqueCleanedComments;
    }
    function wrapText(text, font, fontSize, maxWidth){
      const words = text.split(' ');
      const lines = [];
      let line = '';
  
      for (const word of words) {
        const testLine = line + word + ' ';
        const testWidth = font.widthOfTextAtSize(testLine.trim(), fontSize);
        if (testWidth <= maxWidth) {
          line = testLine;
        } else {
          lines.push(line.trim());
          line = word + ' ';
        }
      }
      if (line.trim()) lines.push(line.trim());
      return lines;
    }

    const comments = dept.comments || [];
    const positive = dept.comments.positive || [];
    const negative = dept.comments.negative || [];
    const suggestions = dept.comments.suggestions || [];

    const positiveCount = positive.length;
    const negativeCount = negative.length;
    const suggestionsCount = suggestions.length;
    
    const lineCount = (text) => {
      const maxWidth = 500;
      const fontSize = 12;
      const lines = wrapText(cleanseText(text), helveticaFont, fontSize, maxWidth);
      return lines.length;
    };
    
    // Check if any comment is too long for the allowed lines
    let shouldUseAttachment = false;

    if ((positiveCount === 1 && negativeCount === 0 && suggestionsCount === 0) || (negativeCount === 1 && positiveCount === 0 && suggestionsCount === 0) || (suggestionsCount ===1 && positiveCount === 0 && negativeCount === 0)) {
      const comment = positive[0] || negative[0] || suggestions[0];
      if(lineCount(comment)>2){
        form.getTextField('COM1').setText('Please see attached');
        form.getTextField('COM2').setText('');
        shouldUseAttachment = true;
      }else{
        form.getTextField('COM1').setText('1. ' + cleanseText(comment));
        form.getTextField('COM2').setText('');
      }
    } else if (positiveCount === 2 && negativeCount === 0 && suggestionsCount === 0 ) {
      if(lineCount(positive[0])>1 || lineCount(positive[1])>1 ){
        form.getTextField('COM1').setText('Please see attached');
        form.getTextField('COM2').setText('');
        shouldUseAttachment = true;
      }else{
        form.getTextField('COM1').setText('1. ' + cleanseText(positive[0]));
        form.getTextField('COM2').setText('2. ' + cleanseText(positive[1]));
      }
    } else if(positiveCount === 0 && negativeCount === 2 && suggestionsCount === 0 ){
      if(lineCount(negative[0])>1 || lineCount(negative[1])>1 ){
        form.getTextField('COM1').setText('Please see attached');
        form.getTextField('COM2').setText('');
        shouldUseAttachment = true;
      }else{
        form.getTextField('COM1').setText('1. ' + cleanseText(negative[0]));
        form.getTextField('COM2').setText('2. ' + cleanseText(negative[1]));
      }
    } else if(positiveCount === 0 && negativeCount === 0 && suggestionsCount === 2 ){
      if(lineCount(suggestions[0])>1 || lineCount(suggestions[1])>1 ){
        form.getTextField('COM1').setText('Please see attached');
        form.getTextField('COM2').setText('');
        shouldUseAttachment = true;
      }else{
        form.getTextField('COM1').setText('1. ' + cleanseText(suggestions[0]));
        form.getTextField('COM2').setText('2. ' + cleanseText(suggestions[1]));
      }
    } else if (positiveCount > 2 || negativeCount > 2 || suggestionsCount > 2 || shouldUseAttachment) {
      form.getTextField('COM1').setText('Please see attached');
      form.getTextField('COM2').setText('');
    } else {
      form.getTextField('COM1').setText('No comment/complaint/suggestion.');
      form.getTextField('COM2').setText('');
    }

    form.flatten();

    const [filledPage] = await pdfDoc.copyPages(deptPdf, [0]);
    pdfDoc.addPage(filledPage);

    // Add comments page(s) if > 2
    if (
      (positiveCount > 2 || negativeCount > 2 || suggestionsCount > 2) ||
      (positiveCount === 1 && negativeCount === 1) ||
      (positiveCount === 1 && suggestionsCount === 1) ||
      (negativeCount === 1 && suggestionsCount === 1) || shouldUseAttachment
    ) {
      const { width: pageWidth, height: pageHeight } = filledPage.getSize();
      const lineHeight = 16;
      const fontSize = 12;
      const maxWidth = 500;
      const marginTop = 50;
      const marginBottom = 50;
    
      const wrapText = (text, font, fontSize, maxWidth) => {
        const words = text.split(' ');
        const lines = [];
        let line = '';
    
        for (const word of words) {
          const testLine = line + word + ' ';
          const testWidth = font.widthOfTextAtSize(testLine.trim(), fontSize);
          if (testWidth <= maxWidth) {
            line = testLine;
          } else {
            lines.push(line.trim());
            line = word + ' ';
          }
        }
        if (line.trim()) lines.push(line.trim());
        return lines;
      };
    
      let y = pageHeight - marginTop;
      let commentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    
      const drawCommentsSection = (label, commentsArray) => {
        if (commentsArray.length === 0) return;
    
        // Remove unwanted comments (like "N/A", "No comment", etc.)
        const filteredComments = removeRepetitiveComments(commentsArray);
    
        // Label
        const labelWrapped = cleanseText(label)
          .split('\n') // Split into lines
          .flatMap(line => wrapText(line, helveticaFont, fontSize, maxWidth));
    
        for (const line of labelWrapped) {
          if (y - lineHeight < marginBottom) {
            commentPage = pdfDoc.addPage([pageWidth, pageHeight]);
            y = pageHeight - marginTop;
          }
          commentPage.drawText(cleanseText(line), {
            x: 50,
            y,
            size: fontSize,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          });
          y -= lineHeight;
        }
    
        // Comments
        let commentIndex = 1;
        for (const comment of filteredComments) {
          const fullText = `${commentIndex}. ${comment}`;
          const wrapped = cleanseText(fullText)
            .split('\n') // Split into lines
            .flatMap(line => wrapText(line, helveticaFont, fontSize, maxWidth));
    
          if (y - wrapped.length * lineHeight < marginBottom) {
            commentPage = pdfDoc.addPage([pageWidth, pageHeight]);
            y = pageHeight - marginTop;
    
            // Redraw section label on new page
            commentPage.drawText(cleanseText(label), {
              x: 50,
              y,
              size: fontSize,
              font: helveticaFont,
              color: rgb(0, 0, 0),
            });
            y -= lineHeight;
          }
    
          for (const line of wrapped) {
            commentPage.drawText(cleanseText(line), {
              x: 50,
              y,
              size: fontSize,
              font: helveticaFont,
              color: rgb(0, 0, 0),
            });
            y -= lineHeight;
          }
    
          commentIndex++;
        }
        y -= 10; // Extra space between sections
      };
    
      // Draw each comment section, passing the appropriate array of comments
      drawCommentsSection('Commendation :', positive);
      drawCommentsSection('Complaint/s :', negative);
      drawCommentsSection('Suggestion/s :', suggestions);
    }  
  }

  return await pdfDoc.save();
}

function getNestedValue(obj, key) {
  return key.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : ''), obj);
}

async function updateComments(db, admin, comData){
  // const snapshot = await db.collection('Responses').where('Office', 'in', offices).get(); 
  try{
    for (const { documentID, classification } of comData) {
      // Get the document reference in Firestore
      const commentRef = db.collection('Responses').doc(documentID);

      // Update the classification field
      await commentRef.update({
        Class:classification,  // Set the new classification (Positive, Negative, Suggestion)
        updatedAt: admin.firestore.FieldValue.serverTimestamp()  // Optional: set timestamp for update
      });

      console.log(`Comment with Document ID: ${documentID} updated with classification: ${classification}`);
    }

    return { message: 'Classifications updated successfully!' };
  }catch (error) {
    console.error('Error updating comments:', error);
    throw new Error('Error updating comments: ' + error.message);
  }
}

async function addUser(db, userData){
  // const snapshot = await db.collection('Responses').where('Office', 'in', offices).get(); 
  try{

    await db.collection('user_data').add({
      full_name: userData.full_name,
      idnumber: userData.idno,
      office: "OPA-ASMU",
      position: userData.position
    });

    const officeAssignments = userData.office_assignment.map(office => {
      return db.collection('office_assignment').add({
        idno: userData.idno,
        office: office
      });
    });
    
    await Promise.all(officeAssignments);
    const hashedPassword = await bcrypt.hash('p@ssw0rd', 12); 
    await db.collection('users').add({
      idno: userData.idno,
      username: userData.idno,
      user_type: userData.user_type,
      password: hashedPassword
    });

    return { message: 'User added succesffully!' };
  }catch (error) {
    console.error('Error updating comments:', error);
    throw new Error('Error updating comments: ' + error.message);
  }
}

async function removeOffice(db, officeName){
  // const snapshot = await db.collection('Responses').where('Office', 'in', offices).get(); 
  try{

    console.log(officeName.office);

    const snapshot = await db.collection('office_assignment')
      .where('office', '==', officeName.office)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { message: `No office found with name "${officeName.office}".` };
    }

    // Delete the first matching document
    const docRef = snapshot.docs[0].ref;
    await docRef.delete();

    return { message: 'Office removed succesffully!' };
  }catch (error) {
    console.error('Error updating office:', error);
    throw new Error('Error updating office: ' + error.message);
  }
}

async function addOffice(db, userOffice){
  // const snapshot = await db.collection('Responses').where('Office', 'in', offices).get(); 
  try{
    const offices =  JSON.parse(userOffice.office);

    await Promise.all(
      offices.map(office => {
        return db.collection('office_assignment').add({
          idno: userOffice.id,
          office: office.value
        });
      })
    );

    return { message: 'Office removed succesffully!' };
  }catch (error) {
    console.error('Error updating office:', error);
    throw new Error('Error updating office: ' + error.message);
  }
}

async function fetchDashboard(db, months){
  // const snapshot = await db.collection('Responses').where('Office', 'in', offices).get(); 
  try{
    const data = [];
    for (let i = 0; i<months.months.month.length; i++){
      // console.log(month+" "+months.months.year[index]);
      const offline = await analyzeResponsesByOffice(db, months.months.offices, months.months.month[i], months.months.year[i]);
      data.push(offline);
    }
    // console.log(data);

    return data;

  }catch (error) {
    console.error('Error updating office:', error);
    throw new Error('Error updating office: ' + error.message);
  }
}

async function summaryPDF(formData, month) {
  try {
    const sourceFileNameInStorage = 'files/conso.pdf'; 

    // CRITICAL CORRECTION: Firebase Storage bucket names end with '.appspot.com'
    const bucketName = 'fir-7db1b.firebasestorage.app'; // CORRECTED BUCKET NAME FORMAT

    // Define the temporary local path where the PDF will be downloaded
    const pdfPath = path.join(os.tmpdir(), 'conso.pdf'); // This is the local path on the Cloud Function's disk

    // Get references to your bucket and the specific file within it
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(sourceFileNameInStorage);

    // --- Download the PDF from Firebase Storage to the Function's local /tmp directory ---
    // First, check if the file exists in storage to provide a better error if not found.
    const [exists] = await file.exists();
    if (!exists) {
        console.error(`Error: The file '${sourceFileNameInStorage}' was not found in Firebase Storage bucket '${bucketName}'.`);
        // It's good practice to send an appropriate error response here.
        // This assumes you're inside an Express route handler or similar.
        return res.status(404).send('PDF template file not found in cloud storage.');
    }

    // Perform the download. The file is saved to 'pdfPath' (e.g., /tmp/REPORT.pdf).
    await file.download({ destination: pdfPath });
    console.log(`File '${sourceFileNameInStorage}' downloaded to '${pdfPath}' successfully.`);

    // --- Load the Downloaded PDF into PDFDocument ---
    // This line now correctly reads the file from the /tmp/ directory.
    const existingPdfBytes = fs.readFileSync(pdfPath);

    // CRITICAL CORRECTION: You want to load an EXISTING PDF template.
    // Use PDFDocument.load() to parse the bytes of your existing PDF.
    // PDFDocument.create() would start a brand new, empty PDF.
    const pdfDoc = await PDFDocument.load(existingPdfBytes); // CORRECTED: Load the existing PDF
    const fontSize = 7;

    const page = pdfDoc.getPage(0);
    const { width, height } = page.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    // const fontSize = 10;
    const cellPadding = 5;

    const startX = 35;
    const startY = height - 130;
    const rowHeight = 12.5;

    const colWidths = Array(14).fill(62); // 14 columns

    // Define the table structure
    const table = [
      [ 
        { text: 'DEPARTMENT/ OFFICE', colspan: 1, rowspan: 3, bgColor: rgb(0.8, 0.9, 1) },
        { text: 'NUMBER OF RESPONDENTS', colspan: 1, rowspan: 3 },
        { text: 'NUMBER OF REGISTERED CLIENTS', colspan: 1, rowspan: 3 },
        { text: 'GENDER', colspan: 4, rowspan: 1 },
        { text: 'CRITERIA', colspan: 3, rowspan: 1 },
        { text: 'GENERAL RATING', colspan: 1, rowspan: 3, bgColor: rgb(0.718, 0.518, 0.961)},
        { text: 'COMMENTS', colspan: 3, rowspan: 1 },
      ],
      [
        { text: 'MALE', colspan: 1, rowspan: 2 },
        { text: 'FEMALE', colspan: 1, rowspan: 2 },
        { text: 'LGBTQ', colspan: 1, rowspan: 2 },
        { text: 'UNDEFINED', colspan: 1, rowspan: 2 },
        { text: 'ENVIRONMENT', colspan: 1, rowspan: 2 },
        { text: 'SYSTEMS AND PROCEDURE', colspan: 1, rowspan: 2 },
        { text: 'STAFF SERVICE', colspan: 1, rowspan: 2 },
        { text: 'POSITIVE', colspan: 1, rowspan: 2, bgColor: rgb(0.000, 0.859, 0.145) },
        { text: 'NEGATIVE', colspan: 1, rowspan: 2, bgColor: rgb(1.000, 0.239, 0.353) },
        { text: 'SUGGESTIONS', colspan: 1, rowspan: 2, bgColor: rgb(1.000, 0.867, 0.000) },
      ]
    ];

    let y = startY;
    const cellState = {}; // Track which positions are occupied due to rowspan

    for (let rowIndex = 0; rowIndex < table.length; rowIndex++) {
      let x = startX;
      let physicalCol = 0;
      const row = table[rowIndex];

      for (let logicalCol = 0; logicalCol < row.length; logicalCol++) {
        while (cellState[`${rowIndex},${physicalCol}`]) {
          x += colWidths[physicalCol];
          physicalCol++;
        }

        const cell = row[logicalCol];
        if (!cell) {
          x += colWidths[physicalCol];
          physicalCol++;
          continue;
        }

        // Calculate width and height
        let cellWidth = 0;
        for (let i = 0; i < (cell.colspan || 1); i++) {
          cellWidth += colWidths[physicalCol + i];
        }
        const cellHeight = rowHeight * (cell.rowspan || 1);

        // Draw cell background
        page.drawRectangle({
          x: x,
          y: y - (cellHeight - rowHeight),
          width: cellWidth,
          height: cellHeight,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
          color: cell.bgColor || undefined
        });

        // === Draw text with wrapping ===
        const maxTextWidth = cellWidth - (cellPadding * 2);
        const textHeight = font.heightAtSize(fontSize);

        function splitTextIntoLines(text, maxWidth, font, size) {
          const words = text.split(' ');
          const lines = [];
          let currentLine = '';

          for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const testWidth = font.widthOfTextAtSize(testLine, size);
            if (testWidth <= maxWidth) {
              currentLine = testLine;
            } else {
              if (currentLine) lines.push(currentLine);
              currentLine = word;
            }
          }
          if (currentLine) lines.push(currentLine);
          return lines;
        }

        const lines = splitTextIntoLines(cell.text, maxTextWidth, font, fontSize);
        const totalTextHeight = lines.length * textHeight;

        let currentY = (y - (cellHeight - rowHeight)) + (cellHeight / 2) + (totalTextHeight / 2) - textHeight;

        for (const line of lines) {
          const lineWidth = font.widthOfTextAtSize(line, fontSize);
          page.drawText(line, {
            x: x + (cellWidth / 2) - (lineWidth / 2),
            y: currentY,
            size: fontSize,
            font,
            color: rgb(0, 0, 0)
          });
          currentY -= textHeight;
        }
        // === end Draw text ===

        // Mark rowspan-occupied cells
        if (cell.rowspan > 1) {
          for (let r = 1; r < cell.rowspan; r++) {
            for (let c = 0; c < (cell.colspan || 1); c++) {
              cellState[`${rowIndex + r},${physicalCol + c}`] = true;
            }
          }
        }

        x += cellWidth;
        physicalCol += cell.colspan || 1;
      }

      y -= rowHeight;
    }

    const dataFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    Object.keys(formData).forEach((key) => {
      const total = formData[key].online + formData[key].offline;
      let rowData = [];
      let office_name = formData[key].department;
      if (total === 0) {
        office_name = office_name === "PHO-Warehouse" ? "PHOWarehouse" : office_name;
        rowData = [
          { text: office_name, colspan: 1, rowspan: 1 },
          { text: "No Collection", colspan: 10, rowspan: 1, bgColor: rgb(0.769, 0.753, 0.753) },
          { text: "", colspan: 1, rowspan: 1, bgColor: rgb(0.000, 0.859, 0.145) },
          { text: "", colspan: 1, rowspan: 1, bgColor: rgb(1.000, 0.239, 0.353) },
          { text: "", colspan: 1, rowspan: 1, bgColor: rgb(1.000, 0.867, 0.000) },
        ];
      } else {
        office_name = office_name === "PHO-Warehouse" ? "PHOWarehouse" : office_name;
        rowData = [
          { text: office_name, colspan: 1, rowspan: 1 },
          { text: Number(total) === 0 ? "" : total, colspan: 1, rowspan: 1 },
          { text: Number(formData[key].visitor) === 0 ? "" : formData[key].visitor, colspan: 1, rowspan: 1 },
          { text: Number(formData[key].gender.Male) === 0 ? "" : formData[key].gender.Male, colspan: 1, rowspan: 1 },
          { text: Number(formData[key].gender.Female) === 0 ? "" : formData[key].gender.Female, colspan: 1, rowspan: 1 },
          { text: Number(formData[key].gender.LGBTQ) === 0 ? "" : formData[key].gender.LGBTQ, colspan: 1, rowspan: 1 },
          { text: Number(formData[key].gender.Others) === 0 ? "" : formData[key].gender.Others, colspan: 1, rowspan: 1 },
          { text: formData[key].qValues.Q1.RATE === "N/A" ? "" : formData[key].qValues.Q1.RATE, colspan: 1, rowspan: 1 },
          { text: formData[key].sysrate === "N/A" ? "" : formData[key].sysrate, colspan: 1, rowspan: 1 },
          { text: formData[key].staffrate === "N/A" ? "" : formData[key].staffrate, colspan: 1, rowspan: 1 },
          { text: formData[key].overrate === "N/A" ? "" : formData[key].overrate, colspan: 1, rowspan: 1, bgColor: rgb(0.718, 0.518, 0.961) },
          { text: Number(formData[key].comments.positive.length) === 0 ? "" : formData[key].comments.positive.length, colspan: 1, rowspan: 1, bgColor: rgb(0.000, 0.859, 0.145) },
          { text: Number(formData[key].comments.negative.length) === 0 ? "" : formData[key].comments.negative.length, colspan: 1, rowspan: 1, bgColor: rgb(1.000, 0.239, 0.353) },
          { text: Number(formData[key].comments.suggestions.length) === 0 ? "" : formData[key].comments.suggestions.length, colspan: 1, rowspan: 1, bgColor: rgb(1.000, 0.867, 0.000) },
        ];
      }

      let x = startX;
      let currentColumn = 0; // Keep track of the current column index in the row

      for (let i = 0; i < rowData.length; i++) {
        const cellData = rowData[i];
        const cellText = String(cellData.text); // Ensure it's a string
        const colSpan = cellData.colspan || 1; // Default colspan to 1 if not specified
        const spannedWidth = colWidths.slice(currentColumn, currentColumn + colSpan).reduce((sum, width) => sum + width, 0);

        // Draw cell background (if bgColor is present)
        if (cellData.bgColor) {
          page.drawRectangle({
            x,
            y: y - rowHeight,
            width: spannedWidth,
            height: rowHeight,
            color: cellData.bgColor,
          });
        }

        // Draw cell border
        page.drawRectangle({
          x,
          y: y - rowHeight,
          width: spannedWidth,
          height: rowHeight,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
        });

        // Calculate text dimensions and position for vertical centering
        const maxTextWidth = spannedWidth - (cellPadding * 2);
        const textHeight = dataFont.heightAtSize(fontSize);
        const words = cellText.split(' ');
        let lines = [];
        let currentLine = '';

        for (const word of words) {
          const potentialLine = currentLine ? `${currentLine} ${word}` : word;
          const lineWidth = dataFont.widthOfTextAtSize(potentialLine, fontSize);
          if (lineWidth <= maxTextWidth) {
            currentLine = potentialLine;
          } else {
            lines.push(currentLine);
            currentLine = word;
          }
        }
        lines.push(currentLine); // Add the last line

        const totalTextHeight = lines.length * textHeight;
        let currentY = y - (rowHeight / 2) + (totalTextHeight / 2) - textHeight;

        // Draw each line of text, horizontally centered within the spanned width
        for (const line of lines) {
          const lineWidth = dataFont.widthOfTextAtSize(line, fontSize);
          let textX = x + (spannedWidth / 2) - (lineWidth / 2);
          // Apply left alignment for the first column (Department)
          if (i === 0) { // Use the index of rowData to check the first column
            textX = x + cellPadding;
          }
          page.drawText(line, {
            x: textX,
            y: currentY,
            size: fontSize,
            font: dataFont,
            color: rgb(0, 0, 0),
          });
          currentY -= textHeight;
        }

        x += spannedWidth;
        currentColumn += colSpan;
      }
      y -= rowHeight; // Move to the next row
    });

    const form = pdfDoc.getForm();
    try {
      const monthYearField = form.getTextField('monthYear');
      monthYearField.setText(month.toUpperCase());
    } catch (error) {
      console.error("Error accessing or setting 'monthYear' field:", error);
    }
    form.flatten();

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  } catch (error) {
    console.error('Error processing PDF:', error);
    throw error;
  }
}

async function chartPDF(images) {
  try {
    const pdfDoc = await PDFDocument.create(); // Create new PDF doc

    for (const imageBase64 of images) {
      const imageBytes = Buffer.from(imageBase64.split(',')[1], 'base64'); // Strip base64 prefix

      let image;
      if (imageBase64.startsWith('data:image/png')) {
        image = await pdfDoc.embedPng(imageBytes);
      } else if (imageBase64.startsWith('data:image/jpeg')) {
        image = await pdfDoc.embedJpg(imageBytes);
      } else {
        throw new Error('Unsupported image format');
      }

      const { width: imgWidth, height: imgHeight } = image.scale(1); // Original image size

      // Create a page that exactly fits the image size
      const page = pdfDoc.addPage([imgWidth, imgHeight]);

      // Draw image at (0, 0) using original dimensions (no scaling, no centering)
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: imgWidth,
        height: imgHeight
      });
    }

    return await pdfDoc.save();
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}

module.exports = {
  loginUser,
  getUserData, 
  getUsers,
  analyzeResponsesByOffice,
  generatePDF,
  updateComments,
  addUser,
  removeOffice,
  addOffice,
  fetchDashboard,
  summaryPDF,
  chartPDF
};
