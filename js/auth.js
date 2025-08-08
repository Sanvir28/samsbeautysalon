// Authentication module for Sam's Beauty Salon

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
const db = firebase.firestore();
const auth = firebase.auth();

let isSignUp = false;

// Initialize authentication
document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
});

function initializeAuth() {
    // Get DOM elements after page loads
    const authModal = document.getElementById('auth-modal');
    const authForm = document.getElementById('auth-form');
    const googleSignInBtn = document.getElementById('google-signin');
    const authSwitchLink = document.getElementById('auth-switch-link');
    const closeModal = document.querySelector('.auth-close');
    const authBtn = document.getElementById('auth-btn');
    
    // Show auth modal when clicking Sign In
    if (authBtn) {
        authBtn.addEventListener('click', showAuthModal);
    }
    
    // Modal event listeners
    if (closeModal) {
        closeModal.addEventListener('click', hideAuthModal);
    }
    
    // Close modal when clicking outside
    if (authModal) {
        authModal.addEventListener('click', function(e) {
            if (e.target === authModal) {
                hideAuthModal();
            }
        });
    }
    
    // Auth form submission
    if (authForm) {
        authForm.addEventListener('submit', handleAuthSubmit);
    }
    
    // Google sign-in
    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', handleGoogleSignIn);
    }
    
    // Switch between sign in and sign up
    if (authSwitchLink) {
        authSwitchLink.addEventListener('click', function(e) {
            e.preventDefault();
            toggleAuthMode();
        });
    }
    
    // Check for Google sign-in redirect result
    auth.getRedirectResult().then((result) => {
        if (result.user) {
            console.log('Google sign-in successful:', result.user.email);
            hideAuthModal();
            
            // Check if this is a new user and add welcome coupon
            if (result.additionalUserInfo && result.additionalUserInfo.isNewUser) {
                createUserDocument(result.user, true);
            }
        }
    }).catch((error) => {
        console.error('Google sign-in error:', error);
        handleAuthError(error);
    });
    
    // Listen to auth state changes
    auth.onAuthStateChanged((user) => {
        const authBtn = document.getElementById('auth-btn');
        const accountLink = document.getElementById('account-link');
        
        if (user) {
            // User is signed in
            if (authBtn) {
                authBtn.textContent = 'Sign Out';
                authBtn.onclick = () => auth.signOut();
            }
            if (accountLink) {
                accountLink.style.display = 'block';
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
        }
    });
}

function showAuthModal() {
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
        authModal.style.display = 'block';
    }
}

function hideAuthModal() {
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
        authModal.style.display = 'none';
        resetAuthForm();
    }
}

function toggleAuthMode() {
    isSignUp = !isSignUp;
    const authTitle = document.getElementById('auth-title');
    const authSubmit = document.getElementById('auth-submit');
    const authSwitchText = document.getElementById('auth-switch-text');
    const authSwitchLink = document.getElementById('auth-switch-link');
    
    if (isSignUp) {
        authTitle.textContent = 'Sign Up';
        authSubmit.textContent = 'Sign Up';
        authSwitchText.textContent = 'Already have an account?';
        authSwitchLink.textContent = 'Sign in';
    } else {
        authTitle.textContent = 'Sign In';
        authSubmit.textContent = 'Sign In';
        authSwitchText.textContent = "Don't have an account?";
        authSwitchLink.textContent = 'Sign up';
    }
}

function handleAuthSubmit(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        handleAuthError(new Error('Please fill in all fields'));
        return;
    }
    
    // Show loading state
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Loading...';
    submitButton.disabled = true;
    
    if (isSignUp) {
        // Create new account
        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                console.log('Sign up successful:', userCredential.user.email);
                
                // Create user document with welcome coupon
                createUserDocument(userCredential.user, true);
                
                hideAuthModal();
                e.target.reset();
            })
            .catch((error) => {
                console.error('Auth error:', error);
                handleAuthError(error);
            })
            .finally(() => {
                // Restore button
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            });
    } else {
        // Sign in existing user
        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                console.log('Sign in successful:', userCredential.user.email);
                
                hideAuthModal();
                e.target.reset();
            })
            .catch((error) => {
                console.error('Auth error:', error);
                handleAuthError(error);
            })
            .finally(() => {
                // Restore button
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            });
    }
}

function handleGoogleSignIn() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');
        
        // Use redirect method for better mobile compatibility
        auth.signInWithRedirect(provider);
        
    } catch (error) {
        console.error('Google sign-in error:', error);
        handleAuthError(error);
    }
}

function createUserDocument(user, isNewUser = false) {
    const userDoc = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
        totalAppointments: 0
    };
    
    // Add welcome coupon for new users
    if (isNewUser) {
        userDoc.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        userDoc.welcomeCoupon = {
            code: 'NEWCLIENT5',
            discount: 5,
            used: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
    }
    
    db.collection('users').doc(user.uid).set(userDoc, { merge: true })
        .then(() => {
            console.log('User document created/updated successfully');
            
            if (isNewUser) {
                showWelcomeMessage();
            }
        })
        .catch((error) => {
            console.error('Error creating user document:', error);
        });
}

function showWelcomeMessage() {
    // Show a welcome message with coupon info
    alert('Welcome to Sam\'s Beauty Salon! You\'ve received a 5% discount coupon (NEWCLIENT5) for your first visit. Mention this when booking your appointment!');
}

function resetAuthForm() {
    const authForm = document.getElementById('auth-form');
    if (authForm) {
        authForm.reset();
    }
    
    // Reset to sign in mode
    isSignUp = false;
    const authTitle = document.getElementById('auth-title');
    const authSubmit = document.getElementById('auth-submit');
    const authSwitchText = document.getElementById('auth-switch-text');
    const authSwitchLink = document.getElementById('auth-switch-link');
    
    if (authTitle) authTitle.textContent = 'Sign In';
    if (authSubmit) authSubmit.textContent = 'Sign In';
    if (authSwitchText) authSwitchText.textContent = "Don't have an account?";
    if (authSwitchLink) authSwitchLink.textContent = 'Sign up';
}

function handleAuthError(error) {
    let message = 'An error occurred. Please try again.';
    
    switch (error.code) {
        case 'auth/user-not-found':
            message = 'No account found with this email. Please sign up first.';
            break;
        case 'auth/wrong-password':
            message = 'Incorrect password. Please try again.';
            break;
        case 'auth/email-already-in-use':
            message = 'An account with this email already exists. Please sign in instead.';
            break;
        case 'auth/weak-password':
            message = 'Password should be at least 6 characters long.';
            break;
        case 'auth/invalid-email':
            message = 'Please enter a valid email address.';
            break;
        case 'auth/popup-blocked':
            message = 'Popup was blocked. Please allow popups and try again.';
            break;
        default:
            message = error.message || message;
    }
    
    // Show error message to user
    alert(message);
}