// FIREBASE CONFIG
var firebaseConfig = {
  apiKey: "AIzaSyAyC3ZPW1XOciNwaJHOhkwSY8vFY1BRlz8",
  authDomain: "PROJECT_ID.firebaseapp.com",
  projectId: "PROJECT_ID",
  databaseURL: "https://PROJECT_ID.firebaseio.com",
  appId: "APP_ID"
};

// INIT FIREBASE
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();

<!-- firebase.js -->
<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
  import { 
    getAuth, 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
  } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

  const firebaseConfig = {
    apiKey: "API_KEY_KAMU",
    authDomain: "PROJECT_ID.firebaseapp.com",
    projectId: "PROJECT_ID",
    appId: "APP_ID"
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  // BIKIN GLOBAL biar bisa dipakai di file lain
  window.auth = auth;
  window.signInWithEmailAndPassword = signInWithEmailAndPassword;
  window.onAuthStateChanged = onAuthStateChanged;
  window.signOut = signOut;
</script>
