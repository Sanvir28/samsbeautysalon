// Firebase configuration
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

// Initialize Firestore
const db = firebase.firestore();

// Initialize Auth
const auth = firebase.auth();

// Global variables
let currentUser = null;

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Initialize navigation
    initializeNavigation();
    
    // Initialize auth state listener
    auth.onAuthStateChanged(function(user) {
        currentUser = user;
        updateUIForAuthState(user);
    });
    
    // Initialize page-specific functionality
    const currentPage = getCurrentPage();
    switch (currentPage) {
        case 'booking':
            initializeBooking();
            break;
        case 'admin':
            initializeAdmin();
            break;
    }
}

function getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('booking.html')) return 'booking';
    if (path.includes('admin.html')) return 'admin';
    if (path.includes('contact.html')) return 'contact';
    if (path.includes('account.html')) return 'account';
    if (path.includes('services.html')) return 'services';
    return 'home';
}

function initializeNavigation() {
    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }
    
    // Close mobile menu when clicking on a link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (navMenu) {
                navMenu.classList.remove('active');
            }
        });
    });
}

function updateUIForAuthState(user) {
    const authBtn = document.getElementById('auth-btn');
    const accountLink = document.getElementById('account-link');
    
    if (user) {
        // User is signed in
        if (authBtn) {
            authBtn.textContent = 'Sign Out';
            authBtn.onclick = signOut;
        }
        
        if (accountLink) {
            accountLink.style.display = 'block';
        }
        
        // Check for admin access
        if (user.email === 'admin@samsbeautysalon.com') {
            addAdminLink();
        }
        
    } else {
        // User is signed out
        if (authBtn) {
            authBtn.textContent = 'Sign In';
            authBtn.onclick = showAuthModal;
        }
        
        if (accountLink) {
            accountLink.style.display = 'none';
        }
        
        removeAdminLink();
    }
}

function addAdminLink() {
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu && !document.getElementById('admin-link')) {
        const adminLi = document.createElement('li');
        adminLi.innerHTML = '<a href="admin.html" class="nav-link" id="admin-link">Admin</a>';
        navMenu.insertBefore(adminLi, navMenu.children[navMenu.children.length - 2]);
    }
}

function removeAdminLink() {
    const adminLink = document.getElementById('admin-link');
    if (adminLink) {
        adminLink.parentElement.remove();
    }
}

function showAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function hideAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function signOut() {
    auth.signOut().then(() => {
        window.location.href = 'index.html';
    }).catch((error) => {
        console.error('Sign out error:', error);
    });
}

// Initialize booking functionality
function initializeBooking() {
    // Check if user is authenticated
    auth.onAuthStateChanged(function(user) {
        if (user) {
            document.getElementById('login-required').style.display = 'none';
            document.getElementById('booking-form-container').style.display = 'block';
            
            // Check for new user coupon
            checkForNewUserCoupon(user);
            
            // Initialize booking components
            initializeCalendar();
            initializeTimeSlots();
            initializeServicesSelection();
            initializeBookingForm();
        } else {
            document.getElementById('login-required').style.display = 'block';
            document.getElementById('booking-form-container').style.display = 'none';
        }
    });
}

function checkForNewUserCoupon(user) {
    const userRef = db.collection('users').doc(user.uid);
    
    userRef.get().then((doc) => {
        if (!doc.exists) {
            // New user - create user document and add welcome coupon
            const userData = {
                email: user.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                totalAppointments: 0
            };
            
            userRef.set(userData).then(() => {
                // Add welcome coupon
                const couponData = {
                    type: 'Welcome Coupon',
                    description: 'Welcome to Sam\'s Beauty Salon! Enjoy 5% off your first booking.',
                    discount: 5,
                    code: 'WELCOME5',
                    used: false,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                userRef.collection('coupons').add(couponData).then(() => {
                    // Show coupon banner
                    const couponBanner = document.getElementById('coupon-banner');
                    if (couponBanner) {
                        couponBanner.style.display = 'flex';
                    }
                });
            });
        } else {
            // Existing user - check for unused coupons
            userRef.collection('coupons').where('used', '==', false).get()
                .then((querySnapshot) => {
                    if (!querySnapshot.empty) {
                        const couponBanner = document.getElementById('coupon-banner');
                        if (couponBanner) {
                            couponBanner.style.display = 'flex';
                        }
                    }
                });
        }
    });
}

// Initialize admin functionality
function initializeAdmin() {
    auth.onAuthStateChanged(function(user) {
        if (user && user.email === 'admin@samsbeautysalon.com') {
            document.getElementById('access-denied').style.display = 'none';
            document.getElementById('admin-dashboard').style.display = 'block';
            loadAdminData();
        } else {
            document.getElementById('access-denied').style.display = 'block';
            document.getElementById('admin-dashboard').style.display = 'none';
        }
    });
}

// Utility functions
function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatTime(time) {
    return time.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function isStoreOpen(date) {
    const day = date.getDay(); // 0 = Sunday, 6 = Saturday
    const hour = date.getHours();
    
    // Store hours
    const storeHours = {
        0: { open: 10, close: 16 }, // Sunday 10 AM - 4 PM
        1: { open: 10, close: 19 }, // Monday 10 AM - 7 PM
        2: { open: 10, close: 19 }, // Tuesday 10 AM - 7 PM
        3: { open: 10, close: 19 }, // Wednesday 10 AM - 7 PM
        4: { open: 10, close: 19 }, // Thursday 10 AM - 7 PM
        5: { open: 10, close: 19 }, // Friday 10 AM - 7 PM
        6: { open: 10, close: 18 }  // Saturday 10 AM - 6 PM
    };
    
    const hours = storeHours[day];
    return hour >= hours.open && hour < hours.close;
}

function generateTimeSlots(date) {
    const slots = [];
    const day = date.getDay();
    
    // Store hours
    const storeHours = {
        0: { open: 10, close: 16 }, // Sunday
        1: { open: 10, close: 19 }, // Monday
        2: { open: 10, close: 19 }, // Tuesday
        3: { open: 10, close: 19 }, // Wednesday
        4: { open: 10, close: 19 }, // Thursday
        5: { open: 10, close: 19 }, // Friday
        6: { open: 10, close: 18 }  // Saturday
    };
    
    const hours = storeHours[day];
    
    for (let hour = hours.open; hour < hours.close; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            slots.push(time);
        }
    }
    
    return slots;
}

// Error handling
function handleError(error, userMessage = 'An error occurred. Please try again.') {
    console.error('Error:', error);
    alert(userMessage);
}

// Loading states
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<div class="loading">Loading...</div>';
    }
}

function hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        const loading = element.querySelector('.loading');
        if (loading) {
            loading.remove();
        }
    }
}
