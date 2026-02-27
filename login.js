import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

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

// Tab switching
document.getElementById('login-tab').addEventListener('click', () => {
  document.getElementById('login-tab').classList.add('active');
  document.getElementById('signup-tab').classList.remove('active');
  document.getElementById('login-form').classList.add('active');
  document.getElementById('signup-form').classList.remove('active');
});

document.getElementById('signup-tab').addEventListener('click', () => {
  document.getElementById('signup-tab').classList.add('active');
  document.getElementById('login-tab').classList.remove('active');
  document.getElementById('signup-form').classList.add('active');
  document.getElementById('login-form').classList.remove('active');
});

// Login
document.getElementById('login-btn').addEventListener('click', async () => {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');
  
  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = 'index.html';
  } catch (error) {
    console.error(error);
    // Show a generic error message for invalid credentials
    if (error.code === 'auth/invalid-login-credentials' ||
      error.code === 'auth/user-not-found' ||
      error.code === 'auth/wrong-password') {
      errorEl.textContent = 'Incorrect email or password.';
    } else {
      errorEl.textContent = error.message; // Keep other errors as is
    }
  }
});

// Signup
document.getElementById('signup-btn').addEventListener('click', async () => {
  const firstName = document.getElementById('signup-firstname').value;
  const lastName = document.getElementById('signup-lastname').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const errorEl = document.getElementById('signup-error');
  
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await setDoc(doc(db, 'profiles', user.uid), {
      firstName,
      lastName,
      email
    });
    window.location.href = 'index.html';
  } catch (error) {
    console.error(error);
    errorEl.textContent = error.message; // For signup, keep original errors
  }
});