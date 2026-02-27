import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, onAuthStateChanged, EmailAuthProvider, reauthenticateWithCredential } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  getDocs,
  orderBy,
  getDoc // 👈 This was missing!
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDiadSQEywfoIwTTPzIZeEar3LVCEB13Xc",
  authDomain: "smart-hishab-fc254.firebaseapp.com",
  databaseURL: "https://smart-hishab-fc254-default-rtdb.firebaseio.com",
  projectId: "smart-hishab-fc254",
  storageBucket: "smart-hishab-fc254.firebasestorage.app",
  messagingSenderId: "1087422685673",
  appId: "1:1087422685673:web:cd3117d0fc33f4c833ab78",
  measurementId: "G-ZTZEBL3YNQ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Currency data
const currencies = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "BDT", name: "Bangladeshi Taka", symbol: "৳" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "CHF", name: "Swiss Franc", symbol: "Fr" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
  { code: "MXN", name: "Mexican Peso", symbol: "$" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺" },
  { code: "RUB", name: "Russian Ruble", symbol: "₽" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼" }
];

let currentUser = null;

// ---------- Custom Toast ----------
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.style.cssText = `
    background: ${type === 'success' ? '#4caf50' : '#ff6b6b'};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    margin-bottom: 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: slideIn 0.3s ease;
    font-weight: 500;
    min-width: 250px;
  `;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

// ---------- Currency dropdown ----------
function populateCurrencyDropdown() {
  const select = document.getElementById('target-currency');
  currencies.forEach(c => {
    const option = document.createElement('option');
    option.value = c.code;
    option.textContent = `${c.code} - ${c.symbol} (${c.name})`;
    select.appendChild(option);
  });
}
document.addEventListener('DOMContentLoaded', populateCurrencyDropdown);

// ---------- Auth ----------
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    loadTargets();
  } else {
    window.location.href = 'login.html';
  }
});

function loadTargets() {
  const q = query(collection(db, 'users', currentUser.uid, 'targets'), orderBy('createdAt', 'desc'));
  onSnapshot(q, (snapshot) => {
    const container = document.getElementById('targets-container');
    container.innerHTML = '';
    snapshot.forEach(docSnap => {
      const target = docSnap.data();
      target.id = docSnap.id;
      container.appendChild(createTargetBox(target));
    });
  });
}

function createTargetBox(target) {
  const box = document.createElement('div');
  box.className = 'target-box';
  box.dataset.id = target.id;
  
  const currencyData = currencies.find(c => c.code === target.currency) || { symbol: target.currency || '$' };
  const symbol = currencyData.symbol;
  
  // Header with trash icon
  const header = document.createElement('div');
  header.className = 'target-header';
  header.innerHTML = `
    <h3>Target: ${symbol}${target.targetAmount}</h3>
    <i class="fas fa-trash delete-icon"></i>
  `;
  box.appendChild(header);
  
  // Add completed badge if already completed
  if (target.completed) {
    const badge = document.createElement('span');
    badge.className = 'completed-badge';
    badge.textContent = '✅ Completed';
    badge.style.cssText = 'background: #4caf50; color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; margin-left: 10px;';
    header.querySelector('h3').appendChild(badge);
  }
  
  const dates = document.createElement('div');
  dates.style.cssText = 'font-size: 0.9rem; color: #8b8f9c; margin-bottom: 8px;';
  dates.innerHTML = `📅 ${target.startDate} → ${target.endDate}`;
  box.appendChild(dates);
  
  const countdown = document.createElement('div');
  countdown.className = 'countdown';
  countdown.id = `countdown-${target.id}`;
  box.appendChild(countdown);
  
  const isCompleted = target.completed; // use the flag from Firestore
  
  const addRow = document.createElement('div');
  addRow.style.cssText = 'display: flex; gap: 8px; margin: 10px 0;';
  
  const input = document.createElement('input');
  input.type = 'number';
  input.placeholder = 'Amount';
  input.className = 'amount-input';
  input.style.flex = '2';
  input.disabled = isCompleted;
  
  const addBtn = document.createElement('button');
  addBtn.textContent = 'Add';
  addBtn.className = 'add-money-btn'; // 👈 Using the smaller button class
  addBtn.disabled = isCompleted;
  
  // Add money logic
  addBtn.addEventListener('click', async () => {
    const amount = parseFloat(input.value);
    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid positive amount.', 'error');
      return;
    }
    try {
      console.log('Adding transaction...');
      await addTransaction(target.id, amount);
      console.log('Transaction added, updating total...');
      input.value = '';
      
      // Manually refresh the total for this target
      await refreshTargetTotal(target.id);
      
      showToast('Money added successfully!', 'success');
    } catch (error) {
      console.error('Add money error:', error);
      showToast('Failed to add money: ' + error.message, 'error');
    }
  });
  
  addRow.appendChild(input);
  addRow.appendChild(addBtn);
  box.appendChild(addRow);
  
  const totalSpan = document.createElement('span');
  totalSpan.className = 'total-saved';
  totalSpan.id = `total-${target.id}`;
  totalSpan.textContent = `Saved: ${symbol}${target.saved || 0}`;
  box.appendChild(totalSpan);
  
  const detailsBtn = document.createElement('button');
  detailsBtn.className = 'details-btn';
  detailsBtn.textContent = 'Details';
  detailsBtn.addEventListener('click', () => {
    window.location.href = `details.html?id=${target.id}`;
  });
  box.appendChild(detailsBtn);
  
  // Delete icon event
  const deleteIcon = header.querySelector('.delete-icon');
  deleteIcon.addEventListener('click', (e) => {
    e.stopPropagation();
    showDeleteDialog(box, target);
  });
  
  // Update countdown every second
  updateCountdown(target.id, target.endDate);
  const interval = setInterval(() => updateCountdown(target.id, target.endDate), 1000);
  // Optionally clear interval when box is removed (not implemented here)
  
  return box;
}

function getCountdown(endDate) {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end - now;
  if (diff <= 0) return 'Expired';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (86400000)) / (3600000));
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function updateCountdown(targetId, endDate) {
  const el = document.getElementById(`countdown-${targetId}`);
  if (el) el.textContent = `⏳ Time left: ${getCountdown(endDate)}`;
}

// Refresh target total and completion status
async function refreshTargetTotal(targetId) {
  try {
    // Fetch all transactions for this target
    const q = query(collection(db, 'users', currentUser.uid, 'targets', targetId, 'transactions'));
    const snapshot = await getDocs(q);
    let total = 0;
    snapshot.forEach(doc => total += doc.data().amount);
    
    // Get target document to check target amount and current completed flag
    const targetDoc = await getDoc(doc(db, 'users', currentUser.uid, 'targets', targetId));
    const target = targetDoc.data();
    
    const currencyData = currencies.find(c => c.code === target.currency) || { symbol: target.currency || '$' };
    
    // Update saved field in target document
    await updateDoc(doc(db, 'users', currentUser.uid, 'targets', targetId), { saved: total });
    
    // Check if target is now completed
    const isCompleted = total >= target.targetAmount;
    if (isCompleted && !target.completed) {
      console.log('Target completed! Updating flag and date.');
      await updateDoc(doc(db, 'users', currentUser.uid, 'targets', targetId), {
        completed: true,
        completedAt: new Date()
      });
    } else if (!isCompleted && target.completed) {
      await updateDoc(doc(db, 'users', currentUser.uid, 'targets', targetId), {
        completed: false,
        completedAt: null
      });
    }
    
    // No need to manually update UI; the snapshot listener will recreate the box.
  } catch (error) {
    console.error('Error refreshing target total:', error);
    throw error;
  }
}

async function addTransaction(targetId, amount) {
  const transaction = {
    amount,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString(),
    timestamp: new Date()
  };
  await addDoc(collection(db, 'users', currentUser.uid, 'targets', targetId, 'transactions'), transaction);
}

function showDeleteDialog(box, target) {
  const existing = box.querySelector('.delete-dialog');
  if (existing) existing.remove();
  
  const dialog = document.createElement('div');
  dialog.className = 'delete-dialog';
  dialog.innerHTML = `
    <p style="margin-bottom:10px;">Enter password to delete:</p>
    <input type="password" id="delete-password" placeholder="Password">
    <div style="display:flex; gap:10px;">
      <button class="btn" style="flex:1;" id="confirm-delete">Delete</button>
      <button class="btn btn-secondary" style="flex:1;" id="cancel-delete">Cancel</button>
    </div>
    <p id="delete-error" class="error"></p>
  `;
  box.appendChild(dialog);
  
  document.getElementById('confirm-delete').addEventListener('click', async () => {
    const password = document.getElementById('delete-password').value;
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, password);
      await reauthenticateWithCredential(currentUser, credential);
      await deleteDoc(doc(db, 'users', currentUser.uid, 'targets', target.id));
      dialog.remove();
      showToast('Target deleted successfully.', 'success');
    } catch (error) {
      document.getElementById('delete-error').textContent = 'Incorrect password';
    }
  });
  
  document.getElementById('cancel-delete').addEventListener('click', () => {
    dialog.remove();
  });
}

// Add target modal logic
const modal = document.getElementById('add-target-modal');
const btn = document.getElementById('add-target-btn');
const span = document.querySelector('.close');

btn.onclick = () => modal.style.display = 'block';
span.onclick = () => modal.style.display = 'none';
window.onclick = (e) => { if (e.target == modal) modal.style.display = 'none'; };

document.getElementById('save-target').addEventListener('click', async () => {
  const startDate = document.getElementById('start-date').value;
  const endDate = document.getElementById('end-date').value;
  const targetAmount = parseFloat(document.getElementById('target-amount').value);
  const currency = document.getElementById('target-currency').value;
  
  if (!startDate || !endDate || !targetAmount || !currency) {
    showToast('Please fill all fields', 'error');
    return;
  }
  
  const target = {
    startDate,
    endDate,
    targetAmount,
    currency,
    saved: 0,
    completed: false,
    createdAt: new Date()
  };
  
  try {
    await addDoc(collection(db, 'users', currentUser.uid, 'targets'), target);
    modal.style.display = 'none';
    document.getElementById('start-date').value = '';
    document.getElementById('end-date').value = '';
    document.getElementById('target-amount').value = '';
    document.getElementById('target-currency').value = '';
    showToast('Target created successfully!', 'success');
  } catch (error) {
    showToast('Error creating target: ' + error.message, 'error');
  }
});