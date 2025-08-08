// Admin dashboard for Sam's Beauty Salon

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

// Admin credentials
const ADMIN_EMAIL = 'admin@samsbeautysalon.com';
const ADMIN_PASSWORD = 'SamsAdmin123!';

// Initialize admin system
document.addEventListener('DOMContentLoaded', function() {
    initializeAdmin();
});

function initializeAdmin() {
    const loginForm = document.getElementById('admin-login-form');
    const logoutBtn = document.getElementById('admin-logout');
    const refreshBtn = document.getElementById('refresh-data');
    const dateFilter = document.getElementById('date-filter');
    const statusFilter = document.getElementById('status-filter');
    
    // Set default date to today
    if (dateFilter) {
        dateFilter.value = new Date().toISOString().split('T')[0];
    }
    
    // Event listeners
    if (loginForm) {
        loginForm.addEventListener('submit', handleAdminLogin);
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleAdminLogout);
    }
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadDashboardData);
    }
    
    if (dateFilter) {
        dateFilter.addEventListener('change', loadDashboardData);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', loadDashboardData);
    }
    
    // Check if already logged in
    auth.onAuthStateChanged((user) => {
        if (user && user.email === ADMIN_EMAIL) {
            showDashboard();
            loadDashboardData();
        } else {
            showLogin();
        }
    });
}

async function handleAdminLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Validate admin credentials
    if (email !== ADMIN_EMAIL) {
        alert('Invalid admin credentials');
        return;
    }
    
    try {
        submitBtn.textContent = 'Logging in...';
        submitBtn.disabled = true;
        
        // Create admin user if doesn't exist, then sign in
        try {
            await auth.createUserWithEmailAndPassword(email, password);
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                // Admin user exists, just sign in
                await auth.signInWithEmailAndPassword(email, password);
            } else {
                throw error;
            }
        }
        
        showDashboard();
        loadDashboardData();
        
    } catch (error) {
        console.error('Admin login error:', error);
        alert('Login failed. Please check your credentials.');
    } finally {
        submitBtn.textContent = 'Login';
        submitBtn.disabled = false;
    }
}

function handleAdminLogout() {
    auth.signOut().then(() => {
        showLogin();
    });
}

function showLogin() {
    document.getElementById('admin-login-section').style.display = 'block';
    document.getElementById('admin-dashboard').style.display = 'none';
    document.getElementById('admin-logout').style.display = 'none';
}

function showDashboard() {
    document.getElementById('admin-login-section').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    document.getElementById('admin-logout').style.display = 'block';
}

async function loadDashboardData() {
    try {
        await Promise.all([
            loadAppointments(),
            loadContactMessages(),
            updateStats()
        ]);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        alert('Error loading dashboard data. Please refresh the page.');
    }
}

async function loadAppointments() {
    const tbody = document.getElementById('appointments-tbody');
    if (!tbody) return;
    
    const dateFilter = document.getElementById('date-filter').value;
    const statusFilter = document.getElementById('status-filter').value;
    
    try {
        let query = db.collection('appointments').orderBy('createdAt', 'desc');
        
        // Apply date filter
        if (dateFilter) {
            const filterDate = new Date(dateFilter);
            const startOfDay = new Date(filterDate.setHours(0, 0, 0, 0));
            const endOfDay = new Date(filterDate.setHours(23, 59, 59, 999));
            
            query = query.where('appointmentDate', '>=', startOfDay)
                         .where('appointmentDate', '<=', endOfDay);
        }
        
        const snapshot = await query.get();
        let appointments = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            data.id = doc.id;
            
            // Apply status filter
            if (!statusFilter || data.status === statusFilter) {
                appointments.push(data);
            }
        });
        
        // Clear table
        tbody.innerHTML = '';
        
        if (appointments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #666;">No appointments found</td></tr>';
            return;
        }
        
        // Add appointments to table
        appointments.forEach(appointment => {
            const row = createAppointmentRow(appointment);
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error loading appointments:', error);
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #ff6b6b;">Error loading appointments</td></tr>';
    }
}

function createAppointmentRow(appointment) {
    const row = document.createElement('tr');
    
    // Format date and time
    const appointmentDate = appointment.appointmentDate.toDate();
    const dateStr = appointmentDate.toLocaleDateString();
    const timeStr = formatTime(appointment.appointmentTime.hour, appointment.appointmentTime.minute);
    
    // Format services
    const servicesStr = appointment.services.map(s => `${s.name} ($${s.price})`).join('<br>');
    
    // Status badge
    const statusClass = getStatusClass(appointment.status);
    
    row.innerHTML = `
        <td>${appointment.bookingId || 'N/A'}</td>
        <td>
            <strong>${appointment.customerName}</strong><br>
            <small>${appointment.customerEmail}</small>
        </td>
        <td>${appointment.customerPhone}</td>
        <td>${dateStr}<br>${timeStr}</td>
        <td>${servicesStr}</td>
        <td><strong>$${appointment.totalAmount}</strong></td>
        <td><span class="status-badge ${statusClass}">${appointment.status}</span></td>
        <td>
            <button class="btn btn-small btn-secondary" onclick="updateAppointmentStatus('${appointment.id}', 'completed')">Complete</button>
            <button class="btn btn-small btn-danger" onclick="updateAppointmentStatus('${appointment.id}', 'cancelled')">Cancel</button>
        </td>
    `;
    
    return row;
}

function formatTime(hour, minute) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
}

function getStatusClass(status) {
    switch (status) {
        case 'confirmed': return 'status-confirmed';
        case 'completed': return 'status-completed';
        case 'cancelled': return 'status-cancelled';
        default: return 'status-pending';
    }
}

async function updateAppointmentStatus(appointmentId, newStatus) {
    if (!confirm(`Are you sure you want to mark this appointment as ${newStatus}?`)) {
        return;
    }
    
    try {
        await db.collection('appointments').doc(appointmentId).update({
            status: newStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Reload appointments
        loadAppointments();
        updateStats();
        
    } catch (error) {
        console.error('Error updating appointment status:', error);
        alert('Error updating appointment status');
    }
}

async function loadContactMessages() {
    const container = document.getElementById('messages-container');
    if (!container) return;
    
    try {
        const snapshot = await db.collection('contacts').orderBy('timestamp', 'desc').limit(10).get();
        
        container.innerHTML = '';
        
        if (snapshot.empty) {
            container.innerHTML = '<p style="text-align: center; color: #666;">No contact messages found</p>';
            return;
        }
        
        snapshot.forEach(doc => {
            const message = doc.data();
            const messageDiv = createMessageCard(message);
            container.appendChild(messageDiv);
        });
        
    } catch (error) {
        console.error('Error loading contact messages:', error);
        container.innerHTML = '<p style="text-align: center; color: #ff6b6b;">Error loading messages</p>';
    }
}

function createMessageCard(message) {
    const card = document.createElement('div');
    card.className = 'message-card';
    
    const timestamp = message.timestamp ? message.timestamp.toDate().toLocaleString() : 'Unknown';
    
    card.innerHTML = `
        <div class="message-header">
            <h4>${message.name}</h4>
            <span class="message-time">${timestamp}</span>
        </div>
        <div class="message-info">
            <p><strong>Email:</strong> ${message.email}</p>
            ${message.phone ? `<p><strong>Phone:</strong> ${message.phone}</p>` : ''}
            <p><strong>Subject:</strong> ${message.subject}</p>
        </div>
        <div class="message-content">
            <p>${message.message}</p>
        </div>
    `;
    
    return card;
}

async function updateStats() {
    try {
        // Get all appointments
        const appointmentsSnapshot = await db.collection('appointments').get();
        const appointments = appointmentsSnapshot.docs.map(doc => doc.data());
        
        // Get contact messages
        const messagesSnapshot = await db.collection('contacts').get();
        
        // Calculate stats
        const totalAppointments = appointments.length;
        
        // Today's appointments
        const today = new Date();
        const todayStart = new Date(today.setHours(0, 0, 0, 0));
        const todayEnd = new Date(today.setHours(23, 59, 59, 999));
        
        const todayAppointments = appointments.filter(apt => {
            const aptDate = apt.appointmentDate.toDate();
            return aptDate >= todayStart && aptDate <= todayEnd;
        }).length;
        
        // Total revenue
        const totalRevenue = appointments
            .filter(apt => apt.status === 'completed')
            .reduce((sum, apt) => sum + apt.totalAmount, 0);
        
        const totalMessages = messagesSnapshot.size;
        
        // Update UI
        document.getElementById('total-appointments').textContent = totalAppointments;
        document.getElementById('today-appointments').textContent = todayAppointments;
        document.getElementById('total-revenue').textContent = `$${totalRevenue}`;
        document.getElementById('total-messages').textContent = totalMessages;
        
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}