window.onload = () => {
  const savedUser = localStorage.getItem("loggedInUser");
  if (savedUser) {
    window.location.replace("dashboard.html");
  }
};

async function login() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('error');
  errorDiv.textContent = '';

  if (!username || !password) {
    errorDiv.textContent = "Please enter both fields.";
    return;
  }
  const showLoadingOverlay = () => {
        let overlay = document.getElementById('loadingOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loadingOverlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // Semi-transparent black
            overlay.style.display = 'flex';
            overlay.style.justifyContent = 'center';
            overlay.style.alignItems = 'center';
            overlay.style.color = 'white';
            overlay.style.fontSize = '20px';
            overlay.style.zIndex = '9999'; // Ensure it's on top
            overlay.innerHTML = '<div class="spinner"></div><p>Loading...</p>'; // Updated message
            document.body.appendChild(overlay);
        }
        overlay.style.display = 'flex';
    };

    const hideLoadingOverlay = () => {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    };

    showLoadingOverlay(); // Call this before your async operations
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    // Log the full response object to understand what you're getting
    // console.log('Response:', response);

    if (!response.ok) {
      throw new Error('Login failed, status code: ' + response.status);
    }

    const data = await response.json();
    console.log("Response Data:", data.data.user);

    if (data && data.data.user) {
      localStorage.setItem("loggedInUser", JSON.stringify(data.data.user));
      window.location.replace("dashboard.html");
    } else {
      errorDiv.textContent = data.error || 'Login failed.';
    }
    hideLoadingOverlay();
  } catch (error) {
    console.error('Login error:', error);
    errorDiv.textContent = "Something went wrong. Please try again.";
  }
}