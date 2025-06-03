
const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
window.onload = function() {
  const userDatas = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!loggedInUser) {
      window.location.href = 'login.html';  // Redirect to login page if not logged in
    } else {
      if(loggedInUser.user_type !== "superadmin"){
        document.getElementById('report').remove();
      }
      // console.log(userDatas);
      document.getElementById('displayUsername').textContent = userDatas.fullname;
      document.getElementById('displayUserType').textContent = userDatas.user_type;
      document.getElementById('officehandled').textContent = userDatas.offices;
      fetchUsers();  // Fetch user data if logged in
    }
  };
  let white = [];
  async function fetchUsers() {
    try {
        // Fetch user data from API
        // console.log("asdasd");
        const response = await fetch('/api/fetchUsers');
        const userData = await response.json();
        
        // If no data is returned, exit the function
        if (!userData.users.length) return;
        const flatWhite = userData.lists.map(item => item.name);
        // const idnos = userData.id.map(item => item.id);
        white.push(...flatWhite);
        // console.log(userData);
        const tableHead = document.getElementById('tableHead');
        const tableBody = document.getElementById('tableBody');

        // Clear any existing content from the table
        tableHead.innerHTML = '';
        tableBody.innerHTML = '';

        // Define fixed headers for the table
        const fixedHeaders = ['No.', 'Name', 'User Type', 'Office', 'Office Assignment', 'Update'];

        // Create the table headers dynamically from the fixed headers
        fixedHeaders.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            tableHead.appendChild(th);
        });

        // Populate the table body with user data
        userData.users.forEach(row => {
            const tr = document.createElement('tr');
            
            // Prepare data for each row based on the fixed headers
            const rowData = [
                row.no, // No.
                row.Name, // Name
                row.User_Type, // User Type
                row.Office, // Office
                row.Office_Assignment.join(", "), // Office Assignment (join array to string)
                `<button 
                  class="btn btn-primary update-btn" 
                  data-id="${row.no}" 
                  onclick="loadUpdateAssignmentModal(
                    ${row.no}, 
                    '${encodeURIComponent(JSON.stringify(row.Office_Assignment))}', 
                    '${userData.idno[row.no - 1]}'
                  )">
                  Update Assignment
                </button>` // Update button
                ];

            // Append each cell to the row
            rowData.forEach(cellData => {
                const td = document.createElement('td');
                // If the data is an HTML string (like the button), set innerHTML instead of textContent
                td.innerHTML = cellData;
                tr.appendChild(td);
            });

            // Append the row to the table body
            tableBody.appendChild(tr);
        });

        // Re-initialize DataTable with new data
        $('#data-table').DataTable({
            destroy: true, // Destroy the existing DataTable to avoid issues with re-initialization
            paging: true, // Enable pagination
            searching: true, // Enable searching
            ordering: true // Enable column sorting
        });

        // // Add event listeners for the "Update Assignment" buttons
        // document.querySelectorAll('.update-btn').forEach(button => {
        //     button.addEventListener('click', (e) => {
        //         const rowId = e.target.getAttribute('data-id');
        //         loadUpdateAssignmentModal(rowId);  // Load the modal for updating the assignment
        //     });
        // });

    } catch (err) {
        console.error('Fetch error:', err);
        alert('Failed to load user data.');
    }
}

function loadUpdateAssignmentModal(rowId, user, id) {
    // You can retrieve the specific user data by rowId and update the modal content
    // console.log('Opening modal for user with ID:', rowId);
    const officeAssignments = JSON.parse(decodeURIComponent(user));

    // Example of opening the modal

    // Get the current office assignments and display them
    const currentAssignmentsDiv = document.getElementById('currentAssignments');
    currentAssignmentsDiv.innerHTML = ''; // Clear any existing assignments
    const counter = 1;
    if (officeAssignments && officeAssignments.length) {
        officeAssignments.forEach(office => {
            // console.log(office);
            const officeDiv = document.createElement('div');
            officeDiv.classList.add('office-item', 'd-flex', 'align-items-center', 'mb-2');
            officeDiv.id = 'no-'+counter;

            const officeLabel = document.createElement('span');
            officeLabel.classList.add('badge', 'badge-info', 'mr-2');
            officeLabel.textContent = office;

            const removeBtn = document.createElement('button');
            removeBtn.classList.add('btn', 'btn-sm', 'btn-danger', 'ml-2');
            removeBtn.textContent = 'X';
            removeBtn.onclick = () => removeOfficeAssignment("no-"+counter, office);

            officeDiv.appendChild(officeLabel);
            officeDiv.appendChild(removeBtn);
            currentAssignmentsDiv.appendChild(officeDiv);
            counter+1;
        });
    } else {
        currentAssignmentsDiv.innerHTML = 'No office assignments found.';
    }

    // Add event listener for adding a new office assignment
    const addOfficeBtn = document.getElementById('addOfficeBtn');
    addOfficeBtn.onclick = () => showAddOfficeDropdown(id);

    // Show the modal
    $('#updateAssignmentModal').modal('show');
}
$('#modal-cancel').click(function(){
    $('#updateAssignmentModal').modal('hide');
});

function showAddOfficeDropdown(id){
    document.getElementById("addOfficeBtn").style.display = "none";
    const currentAssignmentsDiv = document.getElementById('currentAssignments');

    // Container for the input and submit button
    const addContainer = document.createElement('div');
    addContainer.classList.add('d-flex', 'align-items-center', 'mb-3', 'gap-2');

    // Create the tag input (text input styled like tagify)
    const addInput = document.createElement("input");
    addInput.type = "text";
    addInput.id = "assign-office";
    addInput.placeholder = "Add office assignments...";
    addInput.classList.add("form-control");

    // Create the submit button
    const submitBtn = document.createElement("button");
    submitBtn.textContent = "Submit";
    submitBtn.id = "submit-office";
    submitBtn.classList.add("btn", "btn-success", "ml-2");

    // Optional: Add a click handler for submitting new tags
    submitBtn.onclick = async () => {
        const inputValue = addInput.value.trim();
        if (inputValue) {
            console.log("Submitted Tags:", inputValue); // Replace with actual save logic
            try {
              const response = await fetch('/api/addOffice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({id: id, office: inputValue }) 
              });
        
              if (!response.ok) throw new Error('Failed to remove office.');
              
              $('#assign-office, #submit-office').remove();
              const count = document.querySelectorAll('.office-item').length;
              // console.log(count);
              const finalisis = JSON.parse(inputValue);
              finalisis.forEach(pushs => {
                loggedInUser.offices.push(pushs.value);
              });
              localStorage.setItem('loggedInuser', JSON.stringify(loggedInUser));
              console.log(loggedInUser);
              // localStorage.setItem('loggedInUser.offices', loggedInUser.offices);
              const counter = 1;
              const officeValue = JSON.parse(inputValue);
              officeValue.forEach(office => {
                const officeDiv = document.createElement('div');
                officeDiv.classList.add('office-item', 'd-flex', 'align-items-center', 'mb-2');
                officeDiv.id = 'no-'+counter+count;

                const officeLabel = document.createElement('span');
                officeLabel.classList.add('badge', 'badge-info', 'mr-2');
                officeLabel.textContent = office.value;

                const removeBtn = document.createElement('button');
                removeBtn.classList.add('btn', 'btn-sm', 'btn-danger', 'ml-2');
                removeBtn.textContent = 'X';
                removeBtn.onclick = () => removeOfficeAssignment("no-"+counter+count, office.value);

                officeDiv.appendChild(officeLabel);
                officeDiv.appendChild(removeBtn);
                currentAssignmentsDiv.appendChild(officeDiv);
                counter+1;
              });

              console.log("Success!");
            } catch (error) {
              console.error('Add user error:', error);
              alert('Failed to add user.');
            }
        }
    };

    // Append input and button
    addContainer.appendChild(addInput);
    addContainer.appendChild(submitBtn);
    currentAssignmentsDiv.appendChild(addContainer);

    const officeInput = document.getElementById("assign-office");
    const tagify = new Tagify(officeInput, {
        enforceWhitelist: true,
        whitelist: [...white], // You can fetch this dynamically
        dropdown: {
          maxItems: 35,
          enabled: 0,
          closeOnSelect: false
        }
      });
}
function logout() {
    localStorage.removeItem('loggedInUser');
    location.reload(); // or reset the DOM to show loginCard
  }

$('#addUserBtn').click(function(){
    loadAddUserForm();
    $('#addUserBtn').hide();
});

function loadAddUserForm() {
    const contentDiv = document.getElementById('data-content');
    const tableContainer = document.getElementById('tableSection');
    tableContainer.style.display = 'none';
  
    // Inject the form
    contentDiv.innerHTML += `
      <div id="addUserForm">
      <form id="userForm">
      <h5>Add New User</h5>
        <div class="row">
          <div class="mb-3 col-md-6">
            <label for="fullName" class="form-label">Full Name</label>
            <input type="text" class="form-control" id="fullName" required>
          </div>
          <div class="mb-3 col-md-6">
            <label for="idNumber" class="form-label">ID Number</label>
            <input type="text" class="form-control" id="idNumber" required>
          </div>
        </div>
        <div class="row">
          <div class="mb-3 col-md-6">
            <label for="office" class="form-label">Office</label>
            <input type="text" class="form-control" id="office" required>
          </div>
          <div class="mb-3 col-md-6">
            <label for="position" class="form-label">Position</label>
            <input type="text" class="form-control" id="position" required>
          </div>
        </div>
        <div class="row">
          <div class="mb-3 col-md-6">
            <label for="userType" class="form-label">User Type</label>
            <select class="form-select" id="userType" required>
              <option value="">Select user type</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>
          <div class="mb-3 col-md-6">
            <label for="officeAssignment" class="form-label">Office Assignment</label>
            <input id="officeAssignment" class="form-control" placeholder="Select office(s)">
          </div>
        </div>

        <div class="row">
          <div class="col-12 d-flex gap-2">
            <button id="saveUser" type="submit" class="btn btn-success">Submit</button>
            <button type="button" class="btn btn-secondary" id="cancelAddUser">Cancel</button>
          </div>
        </div>
        </form>
    </div>
    `;
  
    // Initialize Tagify for Office Assignment
    // console.log(white);
    const officeInput = document.getElementById('officeAssignment');
    const tagify = new Tagify(officeInput, {
      enforceWhitelist: true,
      whitelist:[...white], // You can fetch this dynamically
      dropdown: {
        maxItems: 35,
        enabled: 0,
        closeOnSelect: false
      }
    });

    // Cancel button functionality
    document.getElementById('cancelAddUser').addEventListener('click', () => {
      document.getElementById('addUserForm').remove(); // Remove the form
      document.getElementById('tableSection').style.display = 'block';
      $('#addUserBtn').show();
    });
  
    document.getElementById('userForm').addEventListener('submit', async function(e){
      e.preventDefault();
      const officeInput = document.getElementById('officeAssignment');
      const tagify = new Tagify(officeInput);
      const newUser = {
        full_name: document.getElementById('fullName').value,
        idno: document.getElementById('idNumber').value,
        office: document.getElementById('office').value,
        position:document.getElementById('position').value,
        user_type: document.getElementById('userType').value,
        office_assignment: tagify.value.map(tag => tag.value)
      };
      // console.log(newUser);
      try {
        const response = await fetch('/api/addUser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newUser)
        });
  
        if (!response.ok) throw new Error('Failed to add user.');
  
        // Remove form, show table again, and refresh data
        document.getElementById('addUserForm').remove(); // Remove the form
        document.getElementById('tableSection').style.display = 'block';
        $('#addUserBtn').show();
        fetchUsers();
        console.log("Success!");
      } catch (error) {
        console.error('Add user error:', error);
        alert('Failed to add user.');
      }
    });
  }  
  
async function removeOfficeAssignment(classs, office){
  // console.log(classs+" x "+office);
  document.getElementById(classs).remove();
  try {
    const response = await fetch('/api/removeOffice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ office: office }) 
    });
    if (!response.ok) throw new Error('Failed to remove office.');
    
    const index = loggedInUser.offices.indexOf(office);

    if (index !== -1) {
      // Remove it using splice
      loggedInUser.offices.splice(index, 1);
    }
    localStorage.setItem('loggedInuser', JSON.stringify(loggedInUser));
    console.log(loggedInUser);
    console.log("Success!");
  } catch (error) {
    console.error('Add user error:', error);
    alert('Failed to add user.');
  }
}
