// Contact form functionality
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');
    
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactFormSubmit);
    }
});

async function handleContactFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const contactData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        subject: formData.get('subject'),
        message: formData.get('message'),
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        // Show loading state
        const submitButton = e.target.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Sending...';
        submitButton.disabled = true;
        
        // Save to Firestore
        await db.collection('contacts').add(contactData);
        
        // Show success message
        showFormStatus('success', 'Thank you for your message! We\'ll get back to you soon.');
        
        // Reset form
        e.target.reset();
        
        // Restore button
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        
    } catch (error) {
        console.error('Error sending message:', error);
        showFormStatus('error', 'Sorry, there was an error sending your message. Please try again or call us directly.');
        
        // Restore button
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.textContent = 'Send Message';
        submitButton.disabled = false;
    }
}

function showFormStatus(type, message) {
    const formStatus = document.getElementById('form-status');
    if (formStatus) {
        formStatus.className = `form-status ${type}`;
        formStatus.textContent = message;
        formStatus.style.display = 'block';
        
        // Hide after 5 seconds
        setTimeout(() => {
            formStatus.style.display = 'none';
        }, 5000);
    }
}