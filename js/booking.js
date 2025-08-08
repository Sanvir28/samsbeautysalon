// Booking system for Sam's Beauty Salon

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

// Global variables
let selectedDate = null;
let selectedTime = null;
let selectedServices = [];
let totalAmount = 0;

// Operating hours
const operatingHours = {
    1: { start: 10, end: 19 }, // Monday
    2: { start: 10, end: 19 }, // Tuesday
    3: { start: 10, end: 19 }, // Wednesday
    4: { start: 10, end: 19 }, // Thursday
    5: { start: 10, end: 19 }, // Friday
    6: { start: 10, end: 18 }, // Saturday
    0: { start: 10, end: 16 }  // Sunday
};

// Initialize booking system
document.addEventListener('DOMContentLoaded', function() {
    initializeBooking();
});

function initializeBooking() {
    generateCalendar();
    setupServiceListeners();
    setupBookingButton();
    
    // Add input validation
    const customerInputs = ['customer-name', 'customer-email', 'customer-phone'];
    customerInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', validateBookingForm);
        }
    });
}

function generateCalendar() {
    const calendar = document.getElementById('calendar');
    if (!calendar) return;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Generate current month and next month
    calendar.innerHTML = '';
    
    for (let monthOffset = 0; monthOffset < 2; monthOffset++) {
        const month = (currentMonth + monthOffset) % 12;
        const year = month < currentMonth ? currentYear + 1 : currentYear;
        
        const monthDiv = createMonthCalendar(year, month);
        calendar.appendChild(monthDiv);
    }
}

function createMonthCalendar(year, month) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    const monthDiv = document.createElement('div');
    monthDiv.className = 'month-calendar';
    
    // Month header
    const header = document.createElement('h3');
    header.textContent = `${monthNames[month]} ${year}`;
    monthDiv.appendChild(header);
    
    // Days grid
    const daysGrid = document.createElement('div');
    daysGrid.className = 'days-grid';
    
    // Day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.textContent = day;
        daysGrid.appendChild(dayHeader);
    });
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'day empty';
        daysGrid.appendChild(emptyDay);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDate = new Date(year, month, day);
        const dayDiv = document.createElement('div');
        dayDiv.className = 'day';
        dayDiv.textContent = day;
        
        // Disable past dates
        if (dayDate < today.setHours(0, 0, 0, 0)) {
            dayDiv.classList.add('disabled');
        } else {
            dayDiv.addEventListener('click', () => selectDate(year, month, day));
        }
        
        daysGrid.appendChild(dayDiv);
    }
    
    monthDiv.appendChild(daysGrid);
    return monthDiv;
}

function selectDate(year, month, day) {
    // Clear previous selection
    document.querySelectorAll('.day.selected').forEach(d => d.classList.remove('selected'));
    
    // Select new date
    event.target.classList.add('selected');
    selectedDate = new Date(year, month, day);
    
    // Generate time slots for selected date
    generateTimeSlots(selectedDate);
    
    // Update summary
    updateBookingSummary();
    validateBookingForm();
}

function generateTimeSlots(date) {
    const timeSlots = document.getElementById('time-slots');
    if (!timeSlots) return;
    
    const dayOfWeek = date.getDay();
    const hours = operatingHours[dayOfWeek];
    
    if (!hours) {
        timeSlots.innerHTML = '<p>Closed on this day</p>';
        return;
    }
    
    timeSlots.innerHTML = '';
    
    // Generate 30-minute time slots
    for (let hour = hours.start; hour < hours.end; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const timeSlot = document.createElement('button');
            timeSlot.className = 'time-slot';
            
            const timeString = formatTime(hour, minute);
            timeSlot.textContent = timeString;
            timeSlot.addEventListener('click', () => selectTime(hour, minute));
            
            timeSlots.appendChild(timeSlot);
        }
    }
}

function selectTime(hour, minute) {
    // Clear previous selection
    document.querySelectorAll('.time-slot.selected').forEach(t => t.classList.remove('selected'));
    
    // Select new time
    event.target.classList.add('selected');
    selectedTime = { hour, minute };
    
    // Update summary
    updateBookingSummary();
    validateBookingForm();
}

function formatTime(hour, minute) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
}

function setupServiceListeners() {
    const serviceCheckboxes = document.querySelectorAll('input[name="service"]');
    serviceCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateSelectedServices);
    });
}

function updateSelectedServices() {
    const serviceCheckboxes = document.querySelectorAll('input[name="service"]:checked');
    selectedServices = [];
    totalAmount = 0;
    
    serviceCheckboxes.forEach(checkbox => {
        const [serviceName, price] = checkbox.value.split('|');
        const servicePrice = parseInt(price);
        
        selectedServices.push({
            name: serviceName,
            price: servicePrice
        });
        
        totalAmount += servicePrice;
    });
    
    updateBookingSummary();
    validateBookingForm();
}

function updateBookingSummary() {
    const selectedServicesDiv = document.getElementById('selected-services');
    const selectedDatetimeDiv = document.getElementById('selected-datetime');
    const totalAmountSpan = document.getElementById('total-amount');
    
    // Update services
    if (selectedServices.length > 0) {
        const servicesList = selectedServices.map(service => 
            `${service.name} - $${service.price}`
        ).join('<br>');
        selectedServicesDiv.innerHTML = servicesList;
    } else {
        selectedServicesDiv.innerHTML = '<p>No services selected</p>';
    }
    
    // Update date/time
    if (selectedDate && selectedTime) {
        const dateString = selectedDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const timeString = formatTime(selectedTime.hour, selectedTime.minute);
        selectedDatetimeDiv.innerHTML = `${dateString}<br>${timeString}`;
    } else {
        selectedDatetimeDiv.innerHTML = '<p>No date/time selected</p>';
    }
    
    // Update total
    if (totalAmountSpan) {
        totalAmountSpan.textContent = totalAmount;
    }
}

function setupBookingButton() {
    const bookButton = document.getElementById('book-appointment');
    if (bookButton) {
        bookButton.addEventListener('click', handleBookAppointment);
    }
}

function validateBookingForm() {
    const bookButton = document.getElementById('book-appointment');
    if (!bookButton) return;
    
    const name = document.getElementById('customer-name')?.value.trim();
    const email = document.getElementById('customer-email')?.value.trim();
    const phone = document.getElementById('customer-phone')?.value.trim();
    
    const isValid = name && email && phone && 
                   selectedServices.length > 0 && 
                   selectedDate && selectedTime;
    
    bookButton.disabled = !isValid;
}

async function handleBookAppointment() {
    const bookButton = document.getElementById('book-appointment');
    const originalText = bookButton.textContent;
    
    try {
        // Show loading state
        bookButton.textContent = 'Booking...';
        bookButton.disabled = true;
        
        // Get customer details
        const customerName = document.getElementById('customer-name').value.trim();
        const customerEmail = document.getElementById('customer-email').value.trim();
        const customerPhone = document.getElementById('customer-phone').value.trim();
        const customerNotes = document.getElementById('customer-notes').value.trim();
        
        // Create appointment object
        const appointment = {
            customerName: customerName,
            customerEmail: customerEmail,
            customerPhone: customerPhone,
            customerNotes: customerNotes,
            services: selectedServices,
            appointmentDate: selectedDate,
            appointmentTime: selectedTime,
            totalAmount: totalAmount,
            status: 'confirmed',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            bookingId: generateBookingId()
        };
        
        // Save to Firestore
        await db.collection('appointments').add(appointment);
        
        // Show success message
        alert(`Appointment booked successfully!\n\nBooking ID: ${appointment.bookingId}\nDate: ${selectedDate.toLocaleDateString()}\nTime: ${formatTime(selectedTime.hour, selectedTime.minute)}\nTotal: $${totalAmount}\n\nWe'll see you at the salon! Payment will be collected in person.`);
        
        // Reset form
        resetBookingForm();
        
    } catch (error) {
        console.error('Error booking appointment:', error);
        alert('Sorry, there was an error booking your appointment. Please try again or call us directly at (908) 210-9319.');
    } finally {
        // Restore button
        bookButton.textContent = originalText;
        bookButton.disabled = false;
    }
}

function generateBookingId() {
    const date = new Date();
    const dateStr = date.getFullYear().toString().slice(-2) + 
                   (date.getMonth() + 1).toString().padStart(2, '0') + 
                   date.getDate().toString().padStart(2, '0');
    const timeStr = Date.now().toString().slice(-4);
    return `SBS${dateStr}${timeStr}`;
}

function resetBookingForm() {
    // Reset customer info
    document.getElementById('customer-name').value = '';
    document.getElementById('customer-email').value = '';
    document.getElementById('customer-phone').value = '';
    document.getElementById('customer-notes').value = '';
    
    // Reset services
    document.querySelectorAll('input[name="service"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Reset date/time
    document.querySelectorAll('.day.selected').forEach(d => d.classList.remove('selected'));
    document.querySelectorAll('.time-slot.selected').forEach(t => t.classList.remove('selected'));
    
    // Reset variables
    selectedDate = null;
    selectedTime = null;
    selectedServices = [];
    totalAmount = 0;
    
    // Clear time slots
    document.getElementById('time-slots').innerHTML = '';
    
    // Update summary
    updateBookingSummary();
    validateBookingForm();
}