// Your existing shopping tracker code

let items = [];

// API URL - make sure this matches your backend server port
const API_URL = 'http://localhost:5001/api';

// Auth state
let authToken = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('user'));

// Load initial data using fetch
// async function loadInitialData() {
//   try {
//     const response = await fetch('data.json');
//     if (!response.ok) throw new Error('Failed to fetch data.');
//     const data = await response.json();
//     items = data;
//     updateTable();
//   } catch (error) {
//     console.error('Error loading data:', error);
//   }
// }

// Show/hide auth forms
document.getElementById('show-register').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('register-form').style.display = 'block';
});

document.getElementById('show-login').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('register-form').style.display = 'none';
  document.getElementById('login-form').style.display = 'block';
});

// Handle login
document.getElementById('login').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  // Basic validation
  if (!email || !password) {
    alert('Please fill in all fields');
    return;
  }

  try {
    console.log('Attempting login with email:', email);
    
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    console.log('Login response:', data);

    if (response.ok) {
      // Store auth data
      authToken = data.token;
      currentUser = data;
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(data));
      
      // Show success message
      alert(data.message || 'Login successful!');
      
      // Show main content and load items
      showMainContent();
      await loadItems();
    } else {
      console.error('Login failed:', data);
      alert(data.message || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('Error connecting to server. Please try again.');
  }
});

// Handle register
document.getElementById('register').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;

  // Basic validation
  if (!name || !email || !password) {
    alert('Please fill in all fields');
    return;
  }

  // Show loading state
  const submitButton = e.target.querySelector('button[type="submit"]');
  const originalButtonText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = 'Registering...';

  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();
    console.log('Registration response:', data); // Debug log

    if (response.ok) {
      // Store auth data
      authToken = data.token;
      currentUser = data;
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(data));
      
      // Show success message
      alert(data.message || 'Registration successful!');
      
      // Show main content and load items
      showMainContent();
      await loadItems();
    } else {
      alert(data.message || 'Registration failed');
    }
  } catch (error) {
    console.error('Registration error:', error);
    alert('Error connecting to server. Please try again.');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalButtonText;
  }
});

// Logout function
function handleLogout(e) {
  e.preventDefault(); // Prevent any default button behavior
  
  try {
    // Clear auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    authToken = null;
    currentUser = null;
    items = [];
    
    // Hide main content first
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.style.display = 'none';
    }
    
    // Show auth container
    const authContainer = document.getElementById('auth-container');
    if (authContainer) {
      authContainer.style.display = 'block';
    }
    
    // Show login form, hide register form
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    if (loginForm) {
      loginForm.style.display = 'block';
      loginForm.reset();
    }
    if (registerForm) {
      registerForm.style.display = 'none';
      registerForm.reset();
    }
    
    // Reset shopping form if it exists
    const shoppingForm = document.getElementById('shopping-form');
    if (shoppingForm) {
      shoppingForm.reset();
    }
    
    // Reset welcome header if it exists
    const welcomeHeader = document.getElementById('welcome-header');
    if (welcomeHeader) {
      welcomeHeader.textContent = 'Personal Shopping Tracker';
    }
    
    // Reload the page to ensure clean state
    window.location.href = window.location.origin;
    
  } catch (error) {
    console.error('Logout error:', error);
    // Try a forced redirect if normal logout fails
    window.location.reload();
  }
}

// Show main content if logged in
function showMainContent() {
  // Hide auth container
  document.getElementById('auth-container').style.display = 'none';
  
  // Show main content
  document.getElementById('main-content').style.display = 'block';
  
  // Update welcome message with user's name
  const welcomeHeader = document.getElementById('welcome-header');
  if (currentUser && currentUser.name) {
    welcomeHeader.textContent = `${currentUser.name}'s Personal Shopping Tracker`;
  }
  
  // Load items from database
  loadItems();
}

// Load items from API
async function loadItems() {
  try {
    const response = await fetch(`${API_URL}/items`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.ok) {
      items = await response.json();
      updateTable();
    } else {
      throw new Error('Failed to load items');
    }
  } catch (error) {
    console.error('Error loading items:', error);
    alert('Error loading items. Please try refreshing the page.');
  }
}

// Update the edit function to store the item being edited
let editingItem = null; // Add this at the top with other global variables

// Update edit function
async function editItem(index) {
  const item = items[index];
  editingItem = item; // Store the item being edited
  
  // Fill the form with item data
  document.getElementById('itemName').value = item.name;
  document.getElementById('itemPrice').value = item.price;
  
  // Format the date properly for the input
  const itemDate = new Date(item.date);
  const formattedDate = itemDate.toISOString().split('T')[0];
  document.getElementById('purchaseDate').value = formattedDate;

  // Change submit button text to indicate editing
  const submitButton = document.getElementById('shopping-form').querySelector('button[type="submit"]');
  submitButton.textContent = 'Update Item';
}

// Update form submission handler
document.getElementById('shopping-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('itemName').value;
  const price = parseFloat(document.getElementById('itemPrice').value);
  const date = document.getElementById('purchaseDate').value;

  try {
    if (editingItem) {
      // Update existing item
      const response = await fetch(`${API_URL}/items/${editingItem._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ 
          name, 
          price, 
          date: new Date(date).toISOString() 
        })
      });

      if (response.ok) {
        const updatedItem = await response.json();
        // Replace the old item with updated one
        const index = items.findIndex(item => item._id === editingItem._id);
        if (index !== -1) {
          items[index] = updatedItem;
        }
        // Reload items from server to ensure consistency
        await loadItems();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update item');
      }
    } else {
      // Add new item
      const response = await fetch(`${API_URL}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ 
          name, 
          price, 
          date: new Date(date).toISOString() 
        })
      });

      if (response.ok) {
        // Reload items from server
        await loadItems();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add item');
      }
    }

    // Reset form and update UI
    document.getElementById('shopping-form').reset();
    const submitButton = document.getElementById('shopping-form').querySelector('button[type="submit"]');
    submitButton.textContent = 'Add Item';
    editingItem = null; // Reset editing state
  } catch (error) {
    console.error('Error saving item:', error);
    alert(error.message || 'Error saving item');
  }
});

// Update delete function to use API
async function deleteItem(index) {
  const item = items[index];
  try {
    const response = await fetch(`${API_URL}/items/${item._id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.ok) {
      items.splice(index, 1);
      updateTable();
    } else {
      throw new Error('Failed to delete item');
    }
  } catch (error) {
    console.error('Error deleting item:', error);
    alert('Error deleting item');
  }
}

// Check auth status on page load
if (authToken) {
  showMainContent();
} else {
  document.getElementById('auth-container').style.display = 'block';
  document.getElementById('main-content').style.display = 'none';
}

// Function to format date
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

// Update the updateTable function
function updateTable() {
  const tableBody = document.getElementById('item-list');
  tableBody.innerHTML = ''; // Clear table

  items.forEach((item, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.name}</td>
      <td>$${item.price.toFixed(2)}</td>
      <td>${formatDate(item.date)}</td>
      <td>
        <button class="btn btn-warning btn-sm" onclick="editItem(${index})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteItem(${index})">Delete</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

function handleSortFilter(key) {
  const priceSortValue = document.getElementById('price-sort').value;
  const dateSortValue = document.getElementById('date-sort').value;

  if (key === 'price') {
    if (priceSortValue === 'high-to-low') {
      items.sort((a, b) => b.price - a.price);
    } else if (priceSortValue === 'low-to-high') {
      items.sort((a, b) => a.price - b.price);
    }
  } else if (key === 'date') {
    if (dateSortValue === 'earliest-to-latest') {
      items.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (dateSortValue === 'latest-to-earliest') {
      items.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
  }

  updateTable();
}

// Random Quote API Integration
const quoteElement = document.getElementById('quote');
const quoteButton = document.getElementById('new-quote');

// Replace 'YOUR_API_KEY' with your actual API key from API Ninjas
const apiKey = 'YOUR_API_KEY'; // Your API key here

async function fetchRandomQuote() {
  try {
    const response = await fetch('https://api.api-ninjas.com/v1/quotes', {
      method: 'GET',
      headers: {
        'X-Api-Key': 'NKC6yp1P9o/ePc7z0IDREQ==xZByUHWQ4BkKuNfp' // Your actual API key
      }
    });

    if (!response.ok) throw new Error('Failed to fetch quote.');
    const data = await response.json();
    
    // Display the quote and author
    quoteElement.textContent = `"${data[0].quote}" — ${data[0].author}`;
  } catch (error) {
    console.error('Error fetching quote:', error);
    quoteElement.textContent = 'Unable to load quote at the moment.';
  }
}

// Fetch a random quote when the page loads
fetchRandomQuote();

// Add event listener for button click to fetch a new quote
quoteButton.addEventListener('click', fetchRandomQuote);

// Add event listener when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.removeEventListener('click', handleLogout); // Remove any existing listeners
    logoutBtn.addEventListener('click', handleLogout); // Add new listener
  }
});

// Add a function to test server connection
async function testServerConnection() {
  try {
    console.log('Testing server connection...');
    const response = await fetch('http://localhost:5001/test', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Server test response:', data);
    return true;
  } catch (error) {
    console.error('Server connection test failed:', error);
    return false;
  }
}

// Test connection when page loads
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Testing server connection on page load...');
  const isServerConnected = await testServerConnection();
  if (!isServerConnected) {
    console.error('Cannot connect to server');
    alert('Server connection failed. Please ensure the backend server is running on port 5001.');
  }
});

// Search functionality
async function searchItems(searchTerm) {
  try {
    const response = await fetch(`${API_URL}/items/search?name=${encodeURIComponent(searchTerm)}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.ok) {
      const searchResults = await response.json();
      items = searchResults; // Update items array with search results
      updateTable();
    } else {
      throw new Error('Failed to search items');
    }
  } catch (error) {
    console.error('Error searching items:', error);
    alert('Error searching items');
  }
}

// Add event listeners for search
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const searchButton = document.getElementById('searchButton');
  const clearSearch = document.getElementById('clearSearch');

  // Search button click
  searchButton.addEventListener('click', () => {
    const searchTerm = searchInput.value.trim();
    if (searchTerm) {
      searchItems(searchTerm);
    }
  });

  // Search on Enter key
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission
      const searchTerm = searchInput.value.trim();
      if (searchTerm) {
        searchItems(searchTerm);
      }
    }
  });

  // Clear search
  clearSearch.addEventListener('click', () => {
    searchInput.value = '';
    loadItems(); // Reset to show all items
  });
});