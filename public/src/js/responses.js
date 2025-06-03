window.onload = function() {
    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  
    if (!loggedInUser) {
      window.location.href = 'login.html';  // Redirect to login page if not logged in
    } else {
      if(loggedInUser.user_type !== "superadmin"){
        document.getElementById('report').remove();
      }
      // console.log(loggedInUser.offices); // This is the user object that is stored in local storag
      document.getElementById('displayUsername').textContent = loggedInUser.fullname;
      document.getElementById('displayUserType').textContent = loggedInUser.user_type;
      document.getElementById('officehandled').textContent = loggedInUser.offices;
      fetchUserData(loggedInUser.offices);  // Fetch user data if logged in
    }
  };
  
  let coms = [];

  async function fetchUserData(offices) {
    const selectedMonth = $('#filterMonth').val();
    const selectedYear = $('#filterYear').val();
    try {
      const response = await fetch('/api/fetchUserData', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ offices }),
      });
      const userData = await response.json();
      // console.log(userData);
      if (!userData.length) return;
      
      // console.log(userData.user);
      userData.forEach(data => {
        const comment = data.user.Comment?.trim().toLowerCase() || "";

        const isTooShort = /^[a-z]{1,2}$/.test(comment);
        const excludedPhrases = ["na", "n/a", "no comment", "none", "not applicable", "", "awan", "wala"];
        const isExcludedPhrase = excludedPhrases.includes(comment);

        const dat = new Date(data.user.Date);
        const year = dat.getFullYear();
        const month = dat.toLocaleString('default', {month: 'long'})

        if(!isTooShort && !isExcludedPhrase && data.user.Class ===""){
          const infos = {
            documentID: data.docID,
            office: data.user.Office,
            comment: data.user.Comment,
            month: month,
            year: year,
          }
          coms.push(infos)
        }

      });
      
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      const filtered = coms.filter(com => {
        const matchMonth = com.month === months[selectedMonth-1];
        const matchYear = com.year.toString() === selectedYear;

        return matchMonth && matchYear;
      });
      // console.log(coms);

      // if(filtered.length<1){
      //   $('#updateComs').prop('disabled', true);  // Disable the button
      //   $('#updateComs span').hide(); 
      // }else{
      //   $('#updateComs').prop('disabled', false); // Enable the button
      //   $('#updateComs span').text(filtered.length).show();
      // }
      // console.log(coms);
      // Format Date of Visit before initializing the table
      const formattedData = userData.map(data => {
        const dateString = data.user.Date;  
        const date = new Date(dateString);  
        const formattedDate = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
  
        return {
          ...data.user, 
          Date: formattedDate,
        };
      });

      // Render table headers dynamically
      renderTableHeaders(formattedData);
  
      // Initialize DataTable with formatted data
      const table = initializeDataTable(formattedData);
  
      // Reset row numbering after filters, pagination, or sort
      table.on('order.dt search.dt draw.dt', function () {
        const startIndex = table.page.info().start;
        table
          .column(0, { search: 'applied', order: 'applied', page: 'current' })
          .nodes()
          .each(function (cell, i) {
            cell.innerHTML = startIndex + i + 1;
          });
      });
  
      // Apply filters immediately after table initialization
      applyFilters(table, formattedData);
      setupFilterListeners(table, formattedData);
  
    } catch (err) {
      console.error('Fetch error:', err);
      alert('Failed to load user data.');
    }
  }
  
  function renderTableHeaders(userData) {
    const tableHead = document.getElementById('tableHead');
    const keys = Object.keys(userData[0]);
    const customLabels = {
      Name: 'Client Name',
      Client_Type: 'Client Type',
      Office: 'Office',
      Service_Availed: 'Service Availed',
      Comment: 'Comment',
      Class: 'Comment Type',
      Date: 'Date of Visit',
    };
  
    tableHead.innerHTML = keys
      .map((key) => `<th>${customLabels[key] || key}</th>`)
      .join('');
  }
  
  function initializeDataTable(userData) {
    // console.log("asdads");
    return $('#data-table').DataTable({
      data: userData,
      columns: [
        { title: 'No.', data: null },
        { data: 'Name', title: 'Client Name' },
        { data: 'Client_Type', title: 'Client Type' },
        { data: 'Office', title: 'Office' },
        { data: 'Service_Availed', title: 'Service Availed' },
        { data: 'Comment', title: 'Comment' },
        { data: 'Class', title: 'Comment Type' },
        { data: 'Date', title: 'Date of Visit' },
      ],
      autoWidth: false,
      order: [[6, 'desc']],
    });
  }
  
  function applyFilters(table, userData) {
    const month = document.getElementById('filterMonth').value;
    const year = document.getElementById('filterYear').value;
  
    const filteredData = userData.filter((row) => {
      const rowDate = new Date(row.Date);
      const rowYear = rowDate.getFullYear();
      const rowMonth = rowDate.getMonth() + 1;
  
      return (
        (year === 'all' || rowYear === parseInt(year)) &&
        (month === 'all' || rowMonth === parseInt(month))
      );
    });
  
    table.clear();
    table.rows.add(filteredData).draw();
  }
  
  function setupFilterListeners(table, userData) {
    document.getElementById('filterMonth').addEventListener('change', () => {
      applyFilters(table, userData);
    });
  
    document.getElementById('filterYear').addEventListener('change', () => {
      applyFilters(table, userData);
    });
  }

  function populateFilterDropdowns() {
    const baselineYear = 2025;
  const baselineMonth = 3; // March (1-indexed)

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-indexed (0 = January)

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const filterMonths = [document.getElementById('filterMonth')].filter(Boolean);
  const filterYears = [document.getElementById('filterYear')].filter(Boolean);

  if (currentYear > baselineYear) {
    for (let year = baselineYear; year <= currentYear; year++) {
      filterYears.forEach(filterYear => {
        const option = document.createElement('option');
        option.value = year;
        option.innerText = year;
        option.selected = year === currentYear;
        filterYear.appendChild(option);
      });
    }

    for (let month = 1; month <= 12; month++) {
      filterMonths.forEach(filterMonth => {
        const option2 = document.createElement('option');
        option2.value = month;
        option2.innerText = months[month - 1];
        option2.selected = month - 1 === currentMonth-1; // Fix: `month-1` to match 0-indexed month
        filterMonth.appendChild(option2);
      });
    }

  } else if (currentYear === baselineYear) {
    filterYears.forEach(filterYear => {
      const option = document.createElement('option');
      option.value = currentYear;
      option.innerText = currentYear;
      option.selected = true;
      filterYear.appendChild(option);
    });

    for (let month = baselineMonth; month <= currentMonth + 1; month++) {
      filterMonths.forEach(filterMonth => {
        const option2 = document.createElement('option');
        option2.value = month;
        option2.innerText = months[month - 1];
        option2.selected = month - 1 === currentMonth-1;
        filterMonth.appendChild(option2);
      });
    }
  }
}
  
  // Call dropdown population on page load
  populateFilterDropdowns();  
  
  function logout() {
    localStorage.removeItem('loggedInUser');
    window.location.href = 'login.html';  // Redirect to login page
  }
  
  document.getElementById('updateComs').addEventListener('click', function () {
    const selectedMonth = $('#filterMonth').val();
    const selectedYear = $('#filterYear').val();

    const filtered = coms.filter(com => {
      const matchMonth = com.month === selectedMonth;
      const matchYear = com.year.toString() === selectedYear;
      return matchMonth && matchYear;
    });

    const modalBody = document.getElementById('commentsModalBody');
    modalBody.innerHTML = ''; // Clear previous content
  
    const table = document.createElement('table');
    table.classList.add('table', 'table-bordered');
  
    table.innerHTML = `
      <thead>
        <tr>
          <th>Office</th>
          <th>Comment</th>
          <th>Classification</th>
        </tr>
      </thead>
      <tbody>
        ${coms.map(com => `
          <tr>
            <td>${com.office}</td>
            <td>${com.comment}</td>
            <td>
              <select class="form-select classification-dropdown" data-id="${com.documentID}">
                <option value="">Select...</option>
                <option value="Positive">Positive</option>
                <option value="Negative">Negative</option>
                <option value="Suggestion">Suggestion</option>
              </select>
            </td>
          </tr>
        `).join('')}
      </tbody>
    `;
  
    modalBody.appendChild(table);
  
    // Show the modal using Bootstrap's modal method
    const modal = new bootstrap.Modal(document.getElementById('commentsModal'));
    modal.show();
  });
  
  document.getElementById('submitClassifications').addEventListener('click', () => {
    const selections = [];
  
    // Collect all selected values
    document.querySelectorAll('.classification-dropdown').forEach(select => {
      const value = select.value;
      const id = select.dataset.id;
      if (value) {
        // Change the dropdown to show the selected classification (value)
        select.disabled = true; // Disable dropdown after submission
        select.innerHTML = `<option value="${value}" selected>${value}</option>`; // Set value as the selected option
        selections.push({ documentID: id, classification: value });
      }
    });
  
    // Make API request to /api/updateComments
    fetch('/api/updateComments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(selections),
    })
      .then(response => response.json())
      .then(data => {
        console.log('Server response:', data);
        alert('Classifications updated successfully!');
        const comp = coms.length>selections.length;
        // if(coms.length>selections.length){
        //   $('#updateComs span').text(comp).show();
        // }else{
        //   $('#updateComs').prop('disabled', true);
        //   $('#updateComs span').text("").show();
        // }
        // Optionally, close the modal after submission
        const modalEl = document.getElementById('commentsModal');
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
      
        if (modalInstance) {
          modalInstance.hide();
        }
      
        // ✅ Extra cleanup: remove leftover backdrop manually
        $('.modal-backdrop').remove();
        $('body').removeClass('modal-open'); // Prevent scroll lock
        $('body').css('padding-right', ''); // Reset padding if added by Bootstrap
      })
      .catch(error => {
        console.error('Error submitting classifications:', error);
        alert('An error occurred while updating classifications.');
      });
  });

  $('#modal-cancel').click(function () {
    const modalEl = document.getElementById('commentsModal');
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
  
    if (modalInstance) {
      modalInstance.hide();
    }
  
    // ✅ Extra cleanup: remove leftover backdrop manually
    $('.modal-backdrop').remove();
    $('body').removeClass('modal-open'); // Prevent scroll lock
    $('body').css('padding-right', ''); // Reset padding if added by Bootstrap
  });
  
  