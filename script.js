// =====================================
// GURU SOFTWARE SOLUTIONS - JavaScript
// Navigation, Forms, and Interactions
// =====================================

// API base (can be changed by user) - supports online submission to remote server
var API_BASE = localStorage.getItem('api_base') || 'http://localhost:5000';
window.setApiBase = function(url){ API_BASE = url; localStorage.setItem('api_base', url); updateApiDisplay && updateApiDisplay(); };
function updateApiDisplay(){
    const btn = document.getElementById('apiBtn');
    const wrap = document.getElementById('apiSettings');
    if (!btn || !wrap) return;
    btn.textContent = 'API: ' + API_BASE;

    // Hide API button on the Home page to avoid showing localhost there
    const currentPage = document.querySelector('.page:not(.hidden)');
    const hash = (location.hash || '').replace('#','');
    const pageId = currentPage ? currentPage.id : (hash || 'home');
    if (pageId === 'home') {
        wrap.style.display = 'none';
    } else {
        wrap.style.display = 'block';
    }
}
function changeApiBasePrompt(){ const url = prompt('Enter API base URL (e.g., https://api.example.com)', API_BASE); if(url){ setApiBase(url); alert('API base set to ' + url); } }

// ==================== PAGE NAVIGATION ==================== 

/**
 * Initialize navigation on page load
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeFormHandlers();
    initializeSmoothScroll();
    try { updateApiDisplay(); } catch (e) {}

    // If URL has a hash, try to scroll to that in-page section
    try {
        const initialHash = (location.hash || '').replace('#', '');
        if (initialHash) {
            const el = document.getElementById(initialHash);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        }
    } catch (e) { /* ignore */ }
});

/**
 * Initialize navigation functionality
 */
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    // Navigation behavior for multi-page site:
    // - If link is an in-page anchor (#...), prevent default and smooth-scroll.
    // - Otherwise let browser navigate to the target page but still close mobile menu.
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href') || '';
            if (href.startsWith('#')) {
                e.preventDefault();
                const id = href.replace('#', '');
                const target = document.getElementById(id);
                if (target) target.scrollIntoView({ behavior: 'smooth' });
            } else {
                // allow default navigation to other pages
            }

            // Close mobile menu if visible
            if (hamburger && navMenu) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    });

    // Hamburger menu toggle (still useful on very small screens)
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            this.classList.toggle('active');
            if (!navMenu) return;
            navMenu.classList.toggle('active');
        });
    }
}

/**
 * Navigate to a specific section
 * @param {string} sectionId - The ID of the section to navigate to
 */
function navigateToSection(sectionId) {
    // For multi-page site: try to scroll to section if present in current page.
    // If not present, navigate to a page with that name (e.g., 'contact' -> 'contact.html').
    if (!sectionId) return;
    const target = document.getElementById(sectionId);
    if (target) {
        // Hide all other pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.add('hidden');
        });
        // Show the target section
        target.classList.remove('hidden');
        // Scroll to top to show navbar and section
        window.scrollTo({ top: 0, behavior: 'smooth' });
        try { history.replaceState(null, '', `#${sectionId}`); } catch (e) {}
        return;
    }

    // Not found on this page — navigate to a dedicated page
    try {
        location.href = `${sectionId}.html`;
    } catch (e) { console.error(e); }
}

/**
 * Scroll to a specific section
 * @param {string} sectionId - The ID of the section to scroll to
 */
function scrollToSection(sectionId) {
    // Prefer in-page scroll; if not present, go to separate page
    const el = document.getElementById(sectionId);
    if (el) {
        // Hide all other pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.add('hidden');
        });
        // Show the target section
        el.classList.remove('hidden');
        // Scroll to top to show navbar and section
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        // Navigate to dedicated page
        location.href = `${sectionId}.html`;
    }
}

/**
 * Initialize smooth scrolling for anchor links
 */
function initializeSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
        }
        // If target does not exist, allow normal navigation
    });
});
}

/**
 * Toggle "Back to Home" button visibility based on current page
 */
function toggleBackToHomeButton() {
    const backBtn = document.getElementById('backToHomeBtn');
    if (!backBtn) return;

    // Primary: check which page element is visible
    const currentPage = document.querySelector('.page:not(.hidden)');
    if (currentPage && currentPage.id !== 'home') {
        backBtn.style.display = 'flex';
        return;
    }

    // Fallback: check URL hash
    const hash = (location.hash || '').replace('#', '');
    if (hash && hash !== 'home') {
        backBtn.style.display = 'flex';
        return;
    }

    backBtn.style.display = 'none';
}

// Ensure the button is set correctly on load
document.addEventListener('DOMContentLoaded', function() {
    toggleBackToHomeButton();
    // Also toggle when hash changes (in case user navigates via anchor links)
    window.addEventListener('hashchange', toggleBackToHomeButton);
});

// ==================== CAREERS PAGE ==================== 

/**
 * Expand or collapse job card details
 * @param {Element} jobCard - The job card element
 * @param {Event} event - The click event
 */
function expandJob(jobCard, event) {
    // Prevent collapsing when clicking on buttons inside
    if (event && (event.target.closest('button') || event.target.closest('a'))) {
        return;
    }
    
    const details = jobCard.querySelector('.job-details');
    
    // Close other job cards
    document.querySelectorAll('.job-card .job-details').forEach(detail => {
        if (detail !== details) {
            detail.classList.add('hidden');
        }
    });
    
    // Toggle current card
    details.classList.toggle('hidden');
}

/**
 * Show job application form with selected role
 * @param {string} roleName - The job role name
 */
function showApplicationForm(roleName) {
    const formSection = document.getElementById('applicationForm');
    const selectedRoleInput = document.getElementById('selectedRole');
    
    selectedRoleInput.value = roleName;
    formSection.classList.remove('hidden');
    
    // Scroll to form
    formSection.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Close job application form
 */
function closeApplicationForm() {
    const formSection = document.getElementById('applicationForm');
    const form = document.getElementById('jobApplicationForm');
    formSection.classList.add('hidden');
    form.reset();
}

/**
 * Submit job application form
 * @param {Event} event - The form submit event
 */
function submitJobApplication(event) {
    event.preventDefault();
    
    // Collect form data
    const form = document.getElementById('jobApplicationForm');

    const jobApplicationData = {
        role: document.getElementById('selectedRole').value,
        name: document.getElementById('applicantName').value,
        email: document.getElementById('applicantEmail').value,
        phone: document.getElementById('applicantPhone').value,
        experience: document.getElementById('applicantExperience').value,
        message: document.getElementById('applicantMessage').value,
    };

    // Validate form
    if (!validateJobApplication(jobApplicationData)) {
        return;
    }

    // Build FormData including resume file
    const formData = new FormData(form);
    const resumeInput = document.getElementById('resumeFile');
    if (resumeInput && resumeInput.files && resumeInput.files[0]) {
        formData.append('resume', resumeInput.files[0]);
    }

    // Ensure role is included (readOnly input) in case it's not part of form fields
    if (!formData.has('selectedRole')) {
        formData.append('role', jobApplicationData.role);
    }

    // Send multipart/form-data to backend
    fetch(`${API_BASE}/api/apply-job`, {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showSuccessMessage('Application submitted successfully! We will review and contact you soon.');
            closeApplicationForm();
        } else {
            showErrorMessage(data.error || 'Error submitting application');
        }
    })
    .catch(error => {
        console.error('Job application error:', error);
        // Save application locally for later sync
        try {
            saveOfflineApplication(jobApplicationData, resumeInput && resumeInput.files && resumeInput.files[0]);
            showSuccessMessage('Network error — application saved locally and will be retried when online.');
            closeApplicationForm();
        } catch (e) {
            console.error('Failed to save offline application', e);
            showErrorMessage(`Network error. Please check API URL: ${API_BASE}`);
        }
    });
}

/**
 * Validate job application form
 * @param {Object} data - Job application data
 * @returns {boolean} - Validation result
 */
function validateJobApplication(data) {
    if (!data.role || !data.name || !data.email || !data.phone || !data.experience) {
        showErrorMessage('Please fill in all required fields');
        return false;
    }

    if (!validateEmail(data.email)) {
        showErrorMessage('Please enter a valid email address');
        return false;
    }

    if (!validatePhone(data.phone)) {
        showErrorMessage('Please enter a valid phone number');
        return false;
    }

    return true;
}

// ==================== CONTACT PAGE ==================== 

/**
 * Submit contact form
 * @param {Event} event - The form submit event
 */
function submitContactForm(event) {
    event.preventDefault();
    
    const contactData = {
        name: document.getElementById('contactName').value,
        email: document.getElementById('contactEmail').value,
        phone: document.getElementById('contactPhone').value,
        subject: document.getElementById('contactSubject').value,
        message: document.getElementById('contactMessage').value,
    };

    // Validate form
    if (!validateContactForm(contactData)) {
        return;
    }

    // Send to backend
    fetch(`${API_BASE}/api/contact`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showSuccessMessage('Thank you! We have received your message and will get back to you soon.');
            document.getElementById('contactForm').reset();
        } else {
            showErrorMessage(data.error || 'Error sending message');
        }
    })
    .catch(error => {
        console.error('Contact form error:', error);
        // Save contact locally for later sync
        try {
            queueOffline('contact', contactData);
            showSuccessMessage('Network error — message saved locally and will be retried when online.');
            document.getElementById('contactForm').reset();
        } catch (e) {
            console.error('Failed to save offline contact', e);
            showErrorMessage(`Network error. Please check API URL: ${API_BASE}`);
        }
    });
}

// ==================== OFFLINE QUEUE HELPERS ==================== 

function queueOffline(key, item) {
    try {
        const lsKey = `offline_${key}s`;
        const list = JSON.parse(localStorage.getItem(lsKey) || '[]');
        list.push(Object.assign({ _queued_at: Date.now() }, item));
        localStorage.setItem(lsKey, JSON.stringify(list));
    } catch (e) {
        console.error('queueOffline error', e);
        throw e;
    }
}

function saveOfflineApplication(data, resumeFile) {
    return new Promise((resolve, reject) => {
        if (resumeFile) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const payload = Object.assign({}, data, { resume_data_url: e.target.result, resume_name: resumeFile.name });
                queueOffline('application', payload);
                resolve();
            };
            reader.onerror = function(err) { queueOffline('application', data); resolve(); };
            reader.readAsDataURL(resumeFile);
        } else {
            queueOffline('application', data);
            resolve();
        }
    });
}

// Try to sync local queues when online
window.addEventListener('online', function() {
    try {
        syncOfflineQueues();
    } catch (e) { console.error('syncOfflineQueues error', e); }
});

// Attempt sync on page load if online
window.addEventListener('load', function() {
    if (navigator.onLine) {
        try { syncOfflineQueues(); } catch (e) { console.error(e); }
    }
});

function syncOfflineQueues() {
    // Sync contacts
    const contacts = JSON.parse(localStorage.getItem('offline_contacts') || '[]');
    if (contacts && contacts.length) {
        contacts.slice().forEach(item => {
            fetch(`${API_BASE}/api/contact`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item)
            }).then(res => res.json()).then(data => {
                if (data && data.success) {
                    // remove item
                    const current = JSON.parse(localStorage.getItem('offline_contacts') || '[]');
                    const filtered = current.filter(c => c._queued_at !== item._queued_at);
                    localStorage.setItem('offline_contacts', JSON.stringify(filtered));
                }
            }).catch(err => console.error('Sync contact failed', err));
        });
    }

    // Sync applications
    const apps = JSON.parse(localStorage.getItem('offline_applications') || '[]');
    if (apps && apps.length) {
        apps.slice().forEach(item => {
            // If resume_data_url exists, send as multipart/form-data
            if (item.resume_data_url) {
                try {
                    const fd = new FormData();
                    fd.append('name', item.name || '');
                    fd.append('email', item.email || '');
                    fd.append('phone', item.phone || '');
                    fd.append('role', item.role || '');
                    fd.append('experience', item.experience || '');
                    fd.append('message', item.message || '');
                    // convert dataURL to blob
                    const blob = dataURLtoBlob(item.resume_data_url);
                    fd.append('resume', blob, item.resume_name || 'resume');

                    fetch(`${API_BASE}/api/apply-job`, { method: 'POST', body: fd })
                        .then(res => res.json())
                        .then(data => {
                            if (data && data.success) {
                                const current = JSON.parse(localStorage.getItem('offline_applications') || '[]');
                                const filtered = current.filter(a => a._queued_at !== item._queued_at);
                                localStorage.setItem('offline_applications', JSON.stringify(filtered));
                            }
                        }).catch(err => console.error('Sync application failed', err));
                } catch (e) { console.error('Sync application error', e); }
            } else {
                fetch(`${API_BASE}/api/apply-job`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item)
                }).then(res => res.json()).then(data => {
                    if (data && data.success) {
                        const current = JSON.parse(localStorage.getItem('offline_applications') || '[]');
                        const filtered = current.filter(a => a._queued_at !== item._queued_at);
                        localStorage.setItem('offline_applications', JSON.stringify(filtered));
                    }
                }).catch(err => console.error('Sync application failed', err));
            }
        });
    }
}

function dataURLtoBlob(dataurl) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

/**
 * Validate contact form
 * @param {Object} data - Contact form data
 * @returns {boolean} - Validation result
 */
function validateContactForm(data) {
    if (!data.name || !data.email || !data.subject || !data.message) {
        showErrorMessage('Please fill in all required fields');
        return false;
    }

    if (!validateEmail(data.email)) {
        showErrorMessage('Please enter a valid email address');
        return false;
    }

    return true;
}

// ==================== FORM VALIDATION ==================== 

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} - Validation result
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - Validation result
 */
function validatePhone(phone) {
    const phoneRegex = /^[0-9\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

/**
 * Initialize form handlers
 */
function initializeFormHandlers() {
    // Add real-time validation to contact form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('input', function() {
            const inputs = this.querySelectorAll('[required]');
            inputs.forEach(input => {
                if (input.value.trim()) {
                    input.style.borderColor = '#4CAF50';
                } else {
                    input.style.borderColor = '#e0e0e0';
                }
            });
        });
    }

    // Add real-time validation to job application form
    const jobForm = document.getElementById('jobApplicationForm');
    if (jobForm) {
        jobForm.addEventListener('input', function() {
            const inputs = this.querySelectorAll('[required]');
            inputs.forEach(input => {
                if (input.value.trim()) {
                    input.style.borderColor = '#4CAF50';
                } else {
                    input.style.borderColor = '#e0e0e0';
                }
            });
        });
    }
}

// ==================== NOTIFICATION MESSAGES ==================== 

/**
 * Show success message
 * @param {string} message - The success message
 */
function showSuccessMessage(message) {
    const notification = createNotification(message, 'success');
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

/**
 * Show error message
 * @param {string} message - The error message
 */
function showErrorMessage(message) {
    const notification = createNotification(message, 'error');
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

/**
 * Create notification element
 * @param {string} message - The notification message
 * @param {string} type - The notification type (success or error)
 * @returns {Element} - The notification element
 */
function createNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Styles for notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 20px',
        borderRadius: '5px',
        color: 'white',
        fontSize: '14px',
        zIndex: '10000',
        animation: 'slideInRight 0.3s ease-out',
        backgroundColor: type === 'success' ? '#4CAF50' : '#f44336',
    });
    
    return notification;
}

// ==================== UTILITY FUNCTIONS ==================== 

/**
 * Format date
 * @param {Date} date - The date to format
 * @returns {string} - Formatted date string
 */
function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString('en-US', options);
}

/**
 * Debounce function for performance optimization
 * @param {Function} func - The function to debounce
 * @param {number} wait - The debounce delay in milliseconds
 * @returns {Function} - The debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ==================== SCROLL EFFECTS ==================== 

/**
 * Add scroll animation effects
 */
window.addEventListener('scroll', debounce(function() {
    // Add scroll-based animations if needed
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.08)';
    }
}, 10));

// ==================== MOBILE MENU HANDLING ==================== 

/**
 * Close mobile menu when clicking outside
 */
document.addEventListener('click', function(event) {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu && 
        !hamburger.contains(event.target) && 
        !navMenu.contains(event.target)) {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    }
});

// ==================== DYNAMIC LOGO GENERATION ==================== 

/**
 * Generate a simple logo SVG
 */
function generateLogo() {
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="40" height="40">
            <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect x="10" y="10" width="30" height="30" fill="url(#grad)" rx="5"/>
            <rect x="60" y="10" width="30" height="30" fill="url(#grad)" rx="5"/>
            <rect x="10" y="60" width="30" height="30" fill="url(#grad)" rx="5"/>
            <rect x="60" y="60" width="30" height="30" fill="url(#grad)" rx="5"/>
        </svg>
    `;
    
    const logoImg = document.querySelector('.logo-img');
    if (logoImg) {
        logoImg.outerHTML = svg;
    }
}

// Generate logo on page load
window.addEventListener('load', generateLogo);

// ==================== INITIALIZE ON PAGE LOAD ==================== 

window.addEventListener('load', function() {
    console.log('Guru Software Solutions website loaded successfully!');
    // Any additional initialization can go here
});
