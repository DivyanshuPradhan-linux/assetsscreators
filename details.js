import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query, onSnapshot, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Firebase configuration
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

// Get target ID from URL
const urlParams = new URLSearchParams(window.location.search);
const targetId = urlParams.get('id');
if (!targetId) {
  window.location.href = 'index.html';
}

// Currency data (same as index.js)
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
let currencySymbol = '$';

// Check authentication
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    await loadUserProfile();
    await loadTargetDetails();
    loadTransactions();
  } else {
    window.location.href = 'login.html';
  }
});

// Load user profile (first name, last name, email)
async function loadUserProfile() {
  const profileDoc = await getDoc(doc(db, 'profiles', currentUser.uid));
  if (profileDoc.exists()) {
    const data = profileDoc.data();
    document.getElementById('user-name-display').textContent = `${data.firstName} ${data.lastName}`;
    document.getElementById('user-email-display').textContent = data.email;
  } else {
    document.getElementById('user-name-display').textContent = currentUser.email;
    document.getElementById('user-email-display').textContent = currentUser.email;
  }
}

// Load target details (dates, amount, completion date)
async function loadTargetDetails() {
  const targetDoc = await getDoc(doc(db, 'users', currentUser.uid, 'targets', targetId));
  if (targetDoc.exists()) {
    const target = targetDoc.data();
    const currencyData = currencies.find(c => c.code === target.currency) || { symbol: target.currency || '$' };
    currencySymbol = currencyData.symbol;
    
    document.getElementById('target-amount-display').textContent = `${currencySymbol}${target.targetAmount}`;
    document.getElementById('start-date-display').textContent = target.startDate;
    document.getElementById('end-date-display').textContent = target.endDate;
    
    // Handle completion date
    if (target.completedAt) {
      let completedDate;
      if (target.completedAt.seconds) {
        // Firestore Timestamp
        completedDate = new Date(target.completedAt.seconds * 1000);
      } else {
        // JavaScript Date object
        completedDate = new Date(target.completedAt);
      }
      document.getElementById('completed-date-display').textContent = completedDate.toLocaleDateString();
    } else if (target.completed) {
      // Fallback if completed flag true but no date (should not happen)
      document.getElementById('completed-date-display').textContent = new Date().toLocaleDateString();
    } else {
      document.getElementById('completed-date-display').textContent = 'Not completed yet';
    }
  }
}

// Load and display transactions in table
function loadTransactions() {
  const q = query(collection(db, 'users', currentUser.uid, 'targets', targetId, 'transactions'), orderBy('timestamp', 'asc'));
  onSnapshot(q, (snapshot) => {
    const tbody = document.querySelector('#transactions-table tbody');
    tbody.innerHTML = '';
    let runningTotal = 0;
    snapshot.forEach(docSnap => {
      const trans = docSnap.data();
      runningTotal += trans.amount;
      const row = tbody.insertRow();
      row.insertCell().textContent = trans.date;
      row.insertCell().textContent = trans.time;
      row.insertCell().textContent = `${currencySymbol}${trans.amount}`;
      row.insertCell().textContent = `${currencySymbol}${runningTotal}`;
    });
  });
}

// PDF Download
document.getElementById('download-pdf').addEventListener('click', async () => {
  const targetDoc = await getDoc(doc(db, 'users', currentUser.uid, 'targets', targetId));
  const target = targetDoc.data();
  const profileDoc = await getDoc(doc(db, 'profiles', currentUser.uid));
  const profile = profileDoc.exists() ? profileDoc.data() : { firstName: '', lastName: '' };
  
  // Fetch transactions
  const transSnap = await getDocs(collection(db, 'users', currentUser.uid, 'targets', targetId, 'transactions'));
  const transactions = [];
  transSnap.forEach(doc => transactions.push(doc.data()));
  
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  
  // Dark theme PDF
  pdf.setFillColor(26, 28, 34);
  pdf.rect(0, 0, 210, 297, 'F');
  pdf.setTextColor(255, 255, 255);
  
  pdf.setFontSize(22);
  pdf.text('Target Details', 14, 22);
  pdf.setFontSize(12);
  pdf.text(`Name: ${profile.firstName} ${profile.lastName}`, 14, 32);
  pdf.text(`Email: ${currentUser.email}`, 14, 42);
  pdf.text(`Target Amount: ${currencySymbol}${target.targetAmount}`, 14, 52);
  pdf.text(`Start: ${target.startDate}`, 14, 62);
  pdf.text(`End: ${target.endDate}`, 14, 72);
  if (target.completedAt) {
    let completedDate;
    if (target.completedAt.seconds) {
      completedDate = new Date(target.completedAt.seconds * 1000).toLocaleDateString();
    } else {
      completedDate = new Date(target.completedAt).toLocaleDateString();
    }
    pdf.text(`Completed On: ${completedDate}`, 14, 82);
  }
  
  // Table
  let total = 0;
  const tableData = transactions.map(t => {
    total += t.amount;
    return [t.date, t.time, `${currencySymbol}${t.amount}`, `${currencySymbol}${total}`];
  });
  
  pdf.autoTable({
    head: [
      ['Date', 'Time', 'Amount', 'Total']
    ],
    body: tableData,
    startY: 90,
    styles: { fillColor: [26, 28, 34], textColor: [255, 255, 255], lineColor: [45, 47, 54] },
    headStyles: { fillColor: [45, 47, 54], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [30, 32, 38] }
  });
  
  pdf.save(`target-${targetId}.pdf`);
});