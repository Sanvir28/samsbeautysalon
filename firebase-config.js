// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCUGurfyk5_djQa3lZx0qq0Aq8UQA9clAY",
    authDomain: "sams-beauty-salon.firebaseapp.com",
    projectId: "sams-beauty-salon",
    storageBucket: "sams-beauty-salon.firebasestorage.app",
    messagingSenderId: "259520219442",
    appId: "1:259520219442:web:7c3a43e90d17786456af2b"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Auth and Firestore
const auth = firebase.auth();
const db = firebase.firestore();

// Admin credentials (easy to change)
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'samsadmin'
};

// Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Store hours for validation
const STORE_HOURS = {
    0: { open: 10, close: 16 }, // Sunday
    1: { open: 10, close: 19 }, // Monday
    2: { open: 10, close: 19 }, // Tuesday
    3: { open: 10, close: 19 }, // Wednesday
    4: { open: 10, close: 19 }, // Thursday
    5: { open: 10, close: 19 }, // Friday
    6: { open: 10, close: 18 }  // Saturday
};

// Time slots (30-minute intervals)
function generateTimeSlots() {
    const slots = [];
    for (let hour = 10; hour < 19; hour++) {
        slots.push(`${hour}:00`);
        slots.push(`${hour}:30`);
    }
    return slots;
}

const TIME_SLOTS = generateTimeSlots();

// Maximum bookings per time slot
const MAX_BOOKINGS_PER_SLOT = 3;