import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, onAuthStateChanged, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

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

// Check if user is logged in
onAuthStateChanged(auth, (user) => {
  if (!user) {
    // If not logged in, redirect to login with a message
    alert("You must be logged in to change your password.");
    window.location.href = "login.html";
  } else {
    // Pre-fill email field (disabled)
    document.getElementById("reset-email").value = user.email;
    document.getElementById("reset-email").disabled = true;
  }
});

document.getElementById("reset-btn").addEventListener("click", async () => {
  const email = document.getElementById("reset-email").value;
  const newPassword = document.getElementById("new-password").value;
  const confirmPassword = document.getElementById("confirm-password").value;
  const messageEl = document.getElementById("reset-message");
  
  // Basic validation
  if (!newPassword || !confirmPassword) {
    messageEl.style.color = "#ff6b6b";
    messageEl.textContent = "Please fill in all fields.";
    return;
  }
  
  if (newPassword.length < 6) {
    messageEl.style.color = "#ff6b6b";
    messageEl.textContent = "Password must be at least 6 characters.";
    return;
  }
  
  if (newPassword !== confirmPassword) {
    messageEl.style.color = "#ff6b6b";
    messageEl.textContent = "Passwords do not match.";
    return;
  }
  
  const user = auth.currentUser;
  if (!user) {
    messageEl.style.color = "#ff6b6b";
    messageEl.textContent = "You are not logged in.";
    return;
  }
  
  try {
    // Update password directly (user is already authenticated)
    await updatePassword(user, newPassword);
    messageEl.style.color = "#4caf50";
    messageEl.textContent = "Password changed successfully!";
    // Clear fields
    document.getElementById("new-password").value = "";
    document.getElementById("confirm-password").value = "";
  } catch (error) {
    console.error(error);
    if (error.code === "auth/requires-recent-login") {
      messageEl.style.color = "#ff6b6b";
      messageEl.textContent = "For security, please log in again and retry.";
      // Optionally, you could prompt for reauthentication here
    } else {
      messageEl.style.color = "#ff6b6b";
      messageEl.textContent = error.message;
    }
  }
});