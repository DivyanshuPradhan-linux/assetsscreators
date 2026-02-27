import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

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

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    await loadProfile();
    await loadStats();
    await loadCompletedTargets();
  } else {
    window.location.href = 'login.html';
  }
});

async function loadProfile() {
  const docRef = doc(db, 'profiles', currentUser.uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    document.getElementById('user-name').textContent = `${data.firstName} ${data.lastName}`;
    document.getElementById('user-email').textContent = data.email;
  } else {
    document.getElementById('user-name').textContent = currentUser.email;
    document.getElementById('user-email').textContent = currentUser.email;
  }
}

async function loadStats() {
  const targetsRef = collection(db, 'users', currentUser.uid, 'targets');
  const snapshot = await getDocs(targetsRef);
  const total = snapshot.size;
  let completed = 0;
  let ongoing = 0;
  
  snapshot.forEach(doc => {
    const target = doc.data();
    if (target.completed || target.saved >= target.targetAmount) {
      completed++;
    } else {
      ongoing++;
    }
  });
  
  document.getElementById('total-targets').textContent = total;
  document.getElementById('completed-targets').textContent = completed;
  document.getElementById('ongoing-targets').textContent = ongoing;
}

async function loadCompletedTargets() {
  const targetsRef = collection(db, 'users', currentUser.uid, 'targets');
  const snapshot = await getDocs(targetsRef);
  const container = document.getElementById('completed-targets-container');
  container.innerHTML = '';
  
  snapshot.forEach(docSnap => {
    const target = docSnap.data();
    if (target.completed || target.saved >= target.targetAmount) {
      const currencyData = currencies.find(c => c.code === target.currency) || { symbol: target.currency || '$' };
      const box = document.createElement('div');
      box.className = 'target-box';
      box.innerHTML = `
        <h3>Target: ${currencyData.symbol}${target.targetAmount} ✅</h3>
        <p>Ended: ${target.endDate}</p>
        <p>Saved: ${currencyData.symbol}${target.saved || 0}</p>
        <button class="btn pdf-btn" data-id="${docSnap.id}">Download PDF</button>
      `;
      box.querySelector('.pdf-btn').addEventListener('click', () => generatePDF(docSnap.id, target, currencyData.symbol));
      container.appendChild(box);
    }
  });
}

async function generatePDF(targetId, target, symbol) {
  const transRef = collection(db, 'users', currentUser.uid, 'targets', targetId, 'transactions');
  const transSnap = await getDocs(transRef);
  const transactions = [];
  transSnap.forEach(doc => transactions.push(doc.data()));
  
  const profileDoc = await getDoc(doc(db, 'profiles', currentUser.uid));
  const profile = profileDoc.exists() ? profileDoc.data() : { firstName: '', lastName: '' };
  
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  
  pdf.setFillColor(26, 28, 34);
  pdf.rect(0, 0, 210, 297, 'F');
  pdf.setTextColor(255, 255, 255);
  
  pdf.setFontSize(22);
  pdf.text('Target Details', 14, 22);
  pdf.setFontSize(12);
  pdf.text(`Name: ${profile.firstName} ${profile.lastName}`, 14, 32);
  pdf.text(`Email: ${currentUser.email}`, 14, 42);
  pdf.text(`Target Amount: ${symbol}${target.targetAmount}`, 14, 52);
  pdf.text(`Start: ${target.startDate}`, 14, 62);
  pdf.text(`End: ${target.endDate}`, 14, 72);
  if (target.completedAt) {
    let date;
    if (target.completedAt.seconds) {
      date = new Date(target.completedAt.seconds * 1000).toLocaleDateString();
    } else {
      date = new Date(target.completedAt).toLocaleDateString();
    }
    pdf.text(`Completed On: ${date}`, 14, 82);
  }
  
  let total = 0;
  const tableData = transactions.map(t => {
    total += t.amount;
    return [t.date, t.time, `${symbol}${t.amount}`, `${symbol}${total}`];
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
}

document.getElementById('forgot-password-btn').addEventListener('click', () => {
  window.location.href = 'reset-password.html';
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  await signOut(auth);
  window.location.href = 'login.html';
});