// Global variables
let currentUser = null;
let isAdmin = false;
let selectedDate = null;
let selectedTime = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the app
    initializeApp();
    
    // Set up form event listeners
    setupFormListeners();
    
    // Generate initial calendar
    generateCalendar();
});

// Initialize the application
function initializeApp() {
    // Auth state listener
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            updateUIForLoggedInUser(user);
            checkNewUserCoupon(user);
        } else {
            currentUser = null;
            updateUIForLoggedOutUser();
        }
    });
    
    // Show home page by default
    showHome();
}

// Setup form event listeners
function setupFormListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Signup form
    document.getElementById('signupForm').addEventListener('submit', handleSignup);
    
    // Appointment form
    document.getElementById('appointmentForm').addEventListener('submit', handleAppointmentBooking);
    
    // Admin booking form
    document.getElementById('adminBookingForm').addEventListener('submit', handleAdminBooking);
    
    // Change password form
    document.getElementById('changePasswordForm').addEventListener('submit', handleChangePassword);
    
    // Delete account form
    document.getElementById('deleteAccountForm').addEventListener('submit', handleDeleteAccount);
    
    // Services selection change
    document.getElementById('selectedServices').addEventListener('change', updateBookingSummary);
}

// Navigation functions
function showHome() {
    hideAllPages();
    document.getElementById('homePage').classList.remove('hidden');
}

function showServices() {
    hideAllPages();
    document.getElementById('servicesPage').classList.remove('hidden');
}

function showContact() {
    hideAllPages();
    document.getElementById('contactPage').classList.remove('hidden');
}

function showBooking() {
    if (!currentUser) {
        showLoginModal();
        return;
    }
    hideAllPages();
    document.getElementById('bookingPage').classList.remove('hidden');
    generateCalendar();
}

function showAccount() {
    if (!currentUser) {
        showLoginModal();
        return;
    }
    hideAllPages();
    document.getElementById('accountPage').classList.remove('hidden');
    loadAccountData();
}

function showAdmin() {
    hideAllPages();
    document.getElementById('adminPage').classList.remove('hidden');
    loadAdminData();
}

function hideAllPages() {
    const pages = ['homePage', 'servicesPage', 'contactPage', 'bookingPage', 'accountPage', 'adminPage'];
    pages.forEach(page => {
        document.getElementById(page).classList.add('hidden');
    });
}

// Modal functions
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function showLoginModal() {
    showModal('loginModal');
}

function showSignupModal() {
    showModal('signupModal');
}

function showAdminBookingModal() {
    showModal('adminBookingModal');
}

function showChangePasswordModal() {
    showModal('changePasswordModal');
}

function showDeleteAccountModal() {
    showModal('deleteAccountModal');
}

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
});

// Authentication functions
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Check for admin credentials
    if (email === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        isAdmin = true;
        currentUser = { email: 'admin@samsbeauty.com', displayName: 'Admin' };
        updateUIForAdmin();
        closeModal('loginModal');
        showAdmin();
        return;
    }
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        closeModal('loginModal');
        showAlert('Login successful!', 'success');
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

async function handleSignup(event) {
    event.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Update profile with name
        await user.updateProfile({
            displayName: name
        });
        
        // Create user document in Firestore
        await db.collection('users').doc(user.uid).set({
            name: name,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            isNewUser: true,
            hasCoupon: true
        });
        
        closeModal('signupModal');
        showAlert('Account created successfully!', 'success');
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

async function loginWithGoogle() {
    try {
        const result = await auth.signInWithPopup(googleProvider);
        const user = result.user;
        
        // Check if this is a new user
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (!userDoc.exists) {
            // Create user document for new Google user
            await db.collection('users').doc(user.uid).set({
                name: user.displayName,
                email: user.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isNewUser: true,
                hasCoupon: true
            });
        }
        
        closeModal('loginModal');
        closeModal('signupModal');
        showAlert('Login successful!', 'success');
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

async function signupWithGoogle() {
    await loginWithGoogle(); // Same process for signup
}

async function logout() {
    if (isAdmin) {
        isAdmin = false;
        currentUser = null;
        updateUIForLoggedOutUser();
        showHome();
        return;
    }
    
    try {
        await auth.signOut();
        showAlert('Logged out successfully!', 'success');
        showHome();
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

// UI update functions
function updateUIForLoggedInUser(user) {
    document.getElementById('loginButtons').classList.add('hidden');
    document.getElementById('userSection').classList.remove('hidden');
    document.getElementById('bookingNav').classList.remove('hidden');
    document.getElementById('accountNav').classList.remove('hidden');
    
    document.getElementById('userName').textContent = user.displayName || user.email;
    document.getElementById('userAvatar').src = user.photoURL || 'https://via.placeholder.com/35/e91e63/ffffff?text=' + (user.displayName ? user.displayName.charAt(0) : 'U');
}

function updateUIForLoggedOutUser() {
    document.getElementById('loginButtons').classList.remove('hidden');
    document.getElementById('userSection').classList.add('hidden');
    document.getElementById('bookingNav').classList.add('hidden');
    document.getElementById('accountNav').classList.add('hidden');
}

function updateUIForAdmin() {
    document.getElementById('loginButtons').classList.add('hidden');
    document.getElementById('userSection').classList.remove('hidden');
    document.getElementById('bookingNav').classList.add('hidden');
    document.getElementById('accountNav').classList.add('hidden');
    
    document.getElementById('userName').textContent = 'Admin';
    document.getElementById('userAvatar').src = 'https://via.placeholder.com/35/e91e63/ffffff?text=A';
}

// Check for new user coupon
async function checkNewUserCoupon(user) {
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists && userDoc.data().isNewUser && userDoc.data().hasCoupon) {
            document.getElementById('newUserCoupon').classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error checking user coupon:', error);
    }
}

// Calendar functions
function generateCalendar() {
    const calendar = document.getElementById('calendarGrid');
    calendar.innerHTML = '';
    
    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.textContent = day;
        dayHeader.style.fontWeight = 'bold';
        dayHeader.style.background = '#e91e63';
        dayHeader.style.color = 'white';
        dayHeader.style.padding = '0.5rem';
        dayHeader.style.textAlign = 'center';
        calendar.appendChild(dayHeader);
    });
    
    // Update month display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('currentMonth').textContent = `${monthNames[currentMonth]} ${currentYear}`;
    
    // Get first day of month and number of days
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.classList.add('calendar-day', 'disabled');
        calendar.appendChild(emptyDay);
    }
    
    // Add days of the month
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.classList.add('calendar-day');
        dayElement.textContent = day;
        
        const dayDate = new Date(currentYear, currentMonth, day);
        
        // Disable past dates
        if (dayDate < today.setHours(0, 0, 0, 0)) {
            dayElement.classList.add('disabled');
        } else {
            dayElement.addEventListener('click', () => selectDate(dayDate));
        }
        
        calendar.appendChild(dayElement);
    }
}

function previousMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    generateCalendar();
}

function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    generateCalendar();
}

function selectDate(date) {
    selectedDate = date;
    
    // Update selected date styling
    document.querySelectorAll('.calendar-day').forEach(day => {
        day.classList.remove('selected');
    });
    event.target.classList.add('selected');
    
    // Show time slots
    showTimeSlots(date);
    
    // Update booking summary
    updateBookingSummary();
}

async function showTimeSlots(date) {
    const dayOfWeek = date.getDay();
    const storeHours = STORE_HOURS[dayOfWeek];
    
    if (!storeHours) {
        document.getElementById('timeSlotSection').classList.add('hidden');
        return;
    }
    
    const timeSlotsContainer = document.getElementById('timeSlots');
    timeSlotsContainer.innerHTML = '';
    
    // Get existing bookings for this date
    const dateStr = date.toISOString().split('T')[0];
    const bookingsSnapshot = await db.collection('appointments')
        .where('date', '==', dateStr)
        .where('status', '!=', 'cancelled')
        .get();
    
    const bookingCounts = {};
    bookingsSnapshot.forEach(doc => {
        const time = doc.data().time;
        bookingCounts[time] = (bookingCounts[time] || 0) + 1;
    });
    
    // Generate time slots
    TIME_SLOTS.forEach(time => {
        const [hour] = time.split(':').map(Number);
        
        // Check if time is within store hours
        if (hour >= storeHours.open && hour < storeHours.close) {
            const slotElement = document.createElement('div');
            slotElement.classList.add('time-slot');
            slotElement.textContent = time;
            
            const bookingCount = bookingCounts[time] || 0;
            const countElement = document.createElement('div');
            countElement.classList.add('booking-count');
            countElement.textContent = `${bookingCount}/${MAX_BOOKINGS_PER_SLOT}`;
            slotElement.appendChild(countElement);
            
            if (bookingCount >= MAX_BOOKINGS_PER_SLOT) {
                slotElement.classList.add('unavailable');
            } else {
                slotElement.addEventListener('click', () => selectTime(time, slotElement));
            }
            
            timeSlotsContainer.appendChild(slotElement);
        }
    });
    
    document.getElementById('timeSlotSection').classList.remove('hidden');
}

function selectTime(time, element) {
    selectedTime = time;
    
    // Update selected time styling
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.classList.remove('selected');
    });
    element.classList.add('selected');
    
    // Show booking form
    document.getElementById('bookingForm').classList.remove('hidden');
    
    // Update booking summary
    updateBookingSummary();
}

function updateBookingSummary() {
    if (selectedDate) {
        document.getElementById('selectedDate').textContent = selectedDate.toLocaleDateString();
    }
    if (selectedTime) {
        document.getElementById('selectedTime').textContent = selectedTime;
    }
    
    const servicesSelect = document.getElementById('selectedServices');
    const selectedServices = Array.from(servicesSelect.selectedOptions).map(option => option.text);
    document.getElementById('summaryServices').textContent = selectedServices.length > 0 ? selectedServices.join(', ') : 'None selected';
}

// Booking functions
async function handleAppointmentBooking(event) {
    event.preventDefault();
    
    if (!selectedDate || !selectedTime) {
        showAlert('Please select a date and time.', 'error');
        return;
    }
    
    const clientName = document.getElementById('clientName').value;
    const clientPhone = document.getElementById('clientPhone').value;
    const servicesSelect = document.getElementById('selectedServices');
    const selectedServices = Array.from(servicesSelect.selectedOptions).map(option => option.value);
    
    if (selectedServices.length === 0) {
        showAlert('Please select at least one service.', 'error');
        return;
    }
    
    try {
        // Check availability again
        const dateStr = selectedDate.toISOString().split('T')[0];
        const existingBookings = await db.collection('appointments')
            .where('date', '==', dateStr)
            .where('time', '==', selectedTime)
            .where('status', '!=', 'cancelled')
            .get();
        
        if (existingBookings.size >= MAX_BOOKINGS_PER_SLOT) {
            showAlert('This time slot is no longer available.', 'error');
            return;
        }
        
        // Create appointment
        await db.collection('appointments').add({
            userId: currentUser.uid,
            clientName: clientName,
            clientPhone: clientPhone,
            services: selectedServices,
            date: dateStr,
            time: selectedTime,
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Mark new user coupon as used
        if (currentUser) {
            await db.collection('users').doc(currentUser.uid).update({
                isNewUser: false
            });
            document.getElementById('newUserCoupon').classList.add('hidden');
        }
        
        showAlert('Appointment booked successfully!', 'success');
        
        // Reset form
        document.getElementById('appointmentForm').reset();
        document.getElementById('bookingForm').classList.add('hidden');
        document.getElementById('timeSlotSection').classList.add('hidden');
        selectedDate = null;
        selectedTime = null;
        generateCalendar();
        
    } catch (error) {
        showAlert('Error booking appointment: ' + error.message, 'error');
    }
}

// Admin functions
async function handleAdminBooking(event) {
    event.preventDefault();
    
    const clientName = document.getElementById('adminClientName').value;
    const clientPhone = document.getElementById('adminClientPhone').value;
    const date = document.getElementById('adminDate').value;
    const time = document.getElementById('adminTime').value;
    const services = document.getElementById('adminServices').value;
    const overrideLimit = document.getElementById('overrideLimit').checked;
    
    try {
        // Check existing bookings unless override is enabled
        if (!overrideLimit) {
            const existingBookings = await db.collection('appointments')
                .where('date', '==', date)
                .where('time', '==', time)
                .where('status', '!=', 'cancelled')
                .get();
            
            if (existingBookings.size >= MAX_BOOKINGS_PER_SLOT) {
                showAlert('Time slot is full. Check override limit to proceed.', 'error');
                return;
            }
        }
        
        // Create appointment
        await db.collection('appointments').add({
            userId: 'admin',
            clientName: clientName,
            clientPhone: clientPhone,
            services: [services],
            date: date,
            time: time,
            status: 'confirmed',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            bookedByAdmin: true
        });
        
        showAlert('Appointment booked successfully!', 'success');
        closeModal('adminBookingModal');
        document.getElementById('adminBookingForm').reset();
        loadAdminData();
        
    } catch (error) {
        showAlert('Error booking appointment: ' + error.message, 'error');
    }
}

async function loadAdminData() {
    try {
        const appointmentsSnapshot = await db.collection('appointments')
            .orderBy('date', 'asc')
            .orderBy('time', 'asc')
            .get();
        
        const tableBody = document.getElementById('adminBookingsBody');
        tableBody.innerHTML = '';
        
        appointmentsSnapshot.forEach(doc => {
            const appointment = doc.data();
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${appointment.date}</td>
                <td>${appointment.time}</td>
                <td>${appointment.clientName}</td>
                <td>${appointment.clientPhone}</td>
                <td>${Array.isArray(appointment.services) ? appointment.services.join(', ') : appointment.services}</td>
                <td><span class="status-${appointment.status}">${appointment.status}</span></td>
                <td>
                    ${appointment.status === 'pending' ? `<button class="action-btn confirm-btn" onclick="confirmAppointment('${doc.id}')">Confirm</button>` : ''}
                    ${appointment.status !== 'cancelled' ? `<button class="action-btn cancel-btn" onclick="cancelAppointment('${doc.id}')">Cancel</button>` : ''}
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
    } catch (error) {
        showAlert('Error loading admin data: ' + error.message, 'error');
    }
}

async function confirmAppointment(appointmentId) {
    try {
        await db.collection('appointments').doc(appointmentId).update({
            status: 'confirmed'
        });
        showAlert('Appointment confirmed!', 'success');
        loadAdminData();
    } catch (error) {
        showAlert('Error confirming appointment: ' + error.message, 'error');
    }
}

async function cancelAppointment(appointmentId) {
    if (confirm('Are you sure you want to cancel this appointment?')) {
        try {
            await db.collection('appointments').doc(appointmentId).update({
                status: 'cancelled'
            });
            showAlert('Appointment cancelled!', 'success');
            loadAdminData();
        } catch (error) {
            showAlert('Error cancelling appointment: ' + error.message, 'error');
        }
    }
}

function refreshAdminData() {
    loadAdminData();
}

function exportBookings() {
    // This would export bookings to CSV
    showAlert('Export feature coming soon!', 'info');
}

// Account management functions
async function loadAccountData() {
    try {
        // Load user info
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        const userData = userDoc.data();
        
        document.getElementById('accountDetails').innerHTML = `
            <p><strong>Name:</strong> ${currentUser.displayName || 'Not provided'}</p>
            <p><strong>Email:</strong> ${currentUser.email}</p>
            <p><strong>Member since:</strong> ${userData?.createdAt?.toDate().toLocaleDateString() || 'Unknown'}</p>
        `;
        
        // Load user appointments
        const appointmentsSnapshot = await db.collection('appointments')
            .where('userId', '==', currentUser.uid)
            .orderBy('date', 'desc')
            .orderBy('time', 'desc')
            .get();
        
        const appointmentsContainer = document.getElementById('userAppointments');
        appointmentsContainer.innerHTML = '';
        
        if (appointmentsSnapshot.empty) {
            appointmentsContainer.innerHTML = '<p>No appointments found.</p>';
        } else {
            appointmentsSnapshot.forEach(doc => {
                const appointment = doc.data();
                const appointmentCard = document.createElement('div');
                appointmentCard.classList.add('appointment-card');
                
                appointmentCard.innerHTML = `
                    <h4>${appointment.date} at ${appointment.time}</h4>
                    <p><strong>Services:</strong> ${Array.isArray(appointment.services) ? appointment.services.join(', ') : appointment.services}</p>
                    <p><strong>Status:</strong> <span class="status-${appointment.status}">${appointment.status}</span></p>
                    <div class="appointment-actions">
                        ${appointment.status !== 'cancelled' && new Date(appointment.date) > new Date() ? 
                            `<button class="btn" style="background: #f44336; color: white; font-size: 0.9rem;" onclick="cancelUserAppointment('${doc.id}')">Cancel</button>` : ''}
                    </div>
                `;
                
                appointmentsContainer.appendChild(appointmentCard);
            });
        }
        
    } catch (error) {
        showAlert('Error loading account data: ' + error.message, 'error');
    }
}

async function cancelUserAppointment(appointmentId) {
    if (confirm('Are you sure you want to cancel this appointment?')) {
        try {
            await db.collection('appointments').doc(appointmentId).update({
                status: 'cancelled'
            });
            showAlert('Appointment cancelled successfully!', 'success');
            loadAccountData();
        } catch (error) {
            showAlert('Error cancelling appointment: ' + error.message, 'error');
        }
    }
}

async function handleChangePassword(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        showAlert('New passwords do not match.', 'error');
        return;
    }
    
    try {
        // Re-authenticate user
        const credential = firebase.auth.EmailAuthProvider.credential(
            currentUser.email,
            currentPassword
        );
        await currentUser.reauthenticateWithCredential(credential);
        
        // Update password
        await currentUser.updatePassword(newPassword);
        
        showAlert('Password changed successfully!', 'success');
        closeModal('changePasswordModal');
        document.getElementById('changePasswordForm').reset();
        
    } catch (error) {
        showAlert('Error changing password: ' + error.message, 'error');
    }
}

async function handleDeleteAccount(event) {
    event.preventDefault();
    
    const password = document.getElementById('deletePassword').value;
    
    try {
        // Re-authenticate user
        const credential = firebase.auth.EmailAuthProvider.credential(
            currentUser.email,
            password
        );
        await currentUser.reauthenticateWithCredential(credential);
        
        // Delete user data from Firestore
        await db.collection('users').doc(currentUser.uid).delete();
        
        // Cancel all user appointments
        const appointmentsSnapshot = await db.collection('appointments')
            .where('userId', '==', currentUser.uid)
            .get();
        
        const batch = db.batch();
        appointmentsSnapshot.forEach(doc => {
            batch.update(doc.ref, { status: 'cancelled' });
        });
        await batch.commit();
        
        // Delete user account
        await currentUser.delete();
        
        showAlert('Account deleted successfully!', 'success');
        closeModal('deleteAccountModal');
        showHome();
        
    } catch (error) {
        showAlert('Error deleting account: ' + error.message, 'error');
    }
}

// Utility functions
function showAlert(message, type = 'info') {
    // Create alert element
    const alert = document.createElement('div');
    alert.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 1rem 2rem;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 3000;
        max-width: 300px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    `;
    
    // Set background color based on type
    switch(type) {
        case 'success':
            alert.style.backgroundColor = '#4caf50';
            break;
        case 'error':
            alert.style.backgroundColor = '#f44336';
            break;
        case 'warning':
            alert.style.backgroundColor = '#ff9800';
            break;
        default:
            alert.style.backgroundColor = '#2196f3';
    }
    
    alert.textContent = message;
    document.body.appendChild(alert);
    
    // Remove alert after 5 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            alert.parentNode.removeChild(alert);
        }
    }, 5000);
    
    // Add click to dismiss
    alert.addEventListener('click', () => {
        if (alert.parentNode) {
            alert.parentNode.removeChild(alert);
        }
    });
}