let emergencyContacts = JSON.parse(localStorage.getItem('emergencyContacts')) || [];

// DOM elements
const emergencyBtn = document.getElementById('emergencyBtn');
const shareLocationBtn = document.getElementById('shareLocationBtn');
const fakeCallBtn = document.getElementById('fakeCallBtn');
const alarmBtn = document.getElementById('alarmBtn');
const addContactBtn = document.getElementById('addContactBtn');
const contactName = document.getElementById('contactName');
const contactPhone = document.getElementById('contactPhone');
const contactsList = document.getElementById('contactsList');
const statusMessage = document.getElementById('statusMessage');
const fakeCallModal = document.getElementById('fakeCallModal');
const answerBtn = document.getElementById('answerBtn');
const declineBtn = document.getElementById('declineBtn');

// Audio for alarm
let alarmSound = null;
let isAlarmPlaying = false;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    renderContacts();
    setupEventListeners();
});

function setupEventListeners() {
    emergencyBtn.addEventListener('click', handleEmergency);
    shareLocationBtn.addEventListener('click', shareLocation);
    fakeCallBtn.addEventListener('click', showFakeCall);
    alarmBtn.addEventListener('click', toggleAlarm);
    addContactBtn.addEventListener('click', addContact);
    answerBtn.addEventListener('click', hideFakeCall);
    declineBtn.addEventListener('click', hideFakeCall);
    
    // Enter key support for contact form
    contactName.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') contactPhone.focus();
    });
    
    contactPhone.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addContact();
    });
}

function handleEmergency() {
    if (emergencyContacts.length === 0) {
        showStatus('Please add emergency contacts first!', 'error');
        return;
    }
    
    // Vibrate if available
    if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 200]);
    }
    
    // Get location and send SOS
    getCurrentLocation().then(location => {
        const message = `🚨 EMERGENCY ALERT 🚨\n\nI need help! My current location:\n${location}\n\nSent from SafeGuard App`;
        sendSOSMessages(message);
    }).catch(() => {
        const message = `🚨 EMERGENCY ALERT 🚨\n\nI need help! Location not available.\n\nSent from SafeGuard App`;
        sendSOSMessages(message);
    });
    
    showStatus('Emergency alert sent!', 'success');
}

function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject('Geolocation not supported');
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                resolve(`https://maps.google.com/maps?q=${latitude},${longitude}`);
            },
            error => reject(error),
            { enableHighAccuracy: true, timeout: 5000 }
        );
    });
}

function sendSOSMessages(message) {
    emergencyContacts.forEach(contact => {
        // Create SMS link
        const smsLink = `sms:${contact.phone}?body=${encodeURIComponent(message)}`;
        
        // Open SMS app
        const link = document.createElement('a');
        link.href = smsLink;
        link.click();
    });
}

function shareLocation() {
    getCurrentLocation().then(location => {
        if (navigator.share) {
            navigator.share({
                title: 'My Current Location',
                text: 'Here is my current location:',
                url: location
            });
        } else {
            // Fallback to copying to clipboard
            navigator.clipboard.writeText(location).then(() => {
                showStatus('Location copied to clipboard!', 'success');
            }).catch(() => {
                showStatus('Location: ' + location, 'success');
            });
        }
    }).catch(() => {
        showStatus('Unable to get location', 'error');
    });
}

function showFakeCall() {
    fakeCallModal.style.display = 'block';
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
        hideFakeCall();
    }, 10000);
}

function hideFakeCall() {
    fakeCallModal.style.display = 'none';
}

function toggleAlarm() {
    if (!isAlarmPlaying) {
        startAlarm();
    } else {
        stopAlarm();
    }
}

function startAlarm() {
    // Create alarm sound using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    
    oscillator.start();
    
    // Create pulsing effect
    const pulseAlarm = () => {
        if (isAlarmPlaying) {
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            setTimeout(() => {
                if (isAlarmPlaying) {
                    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
                    setTimeout(pulseAlarm, 300);
                }
            }, 300);
        }
    };
    
    pulseAlarm();
    
    alarmSound = { oscillator, audioContext };
    isAlarmPlaying = true;
    alarmBtn.textContent = '🔇 Stop Alarm';
    alarmBtn.style.background = 'linear-gradient(45deg, #ff4757, #ff3742)';
    
    // Vibrate pattern
    if (navigator.vibrate) {
        const vibratePattern = () => {
            if (isAlarmPlaying) {
                navigator.vibrate([200, 200, 200, 200]);
                setTimeout(vibratePattern, 800);
            }
        };
        vibratePattern();
    }
    
    showStatus('Alarm activated!', 'success');
}

function stopAlarm() {
    if (alarmSound) {
        alarmSound.oscillator.stop();
        alarmSound.audioContext.close();
        alarmSound = null;
    }
    
    isAlarmPlaying = false;
    alarmBtn.innerHTML = '<span class="icon">🔔</span> Sound Alarm';
    alarmBtn.style.background = 'linear-gradient(45deg, #5c7cfa, #4c6ef5)';
    
    showStatus('Alarm stopped', 'success');
}

function addContact() {
    const name = contactName.value.trim();
    const phone = contactPhone.value.trim();
    
    if (!name || !phone) {
        showStatus('Please enter both name and phone number', 'error');
        return;
    }
    
    if (emergencyContacts.find(c => c.phone === phone)) {
        showStatus('Contact already exists', 'error');
        return;
    }
    
    const contact = {
        id: Date.now(),
        name: name,
        phone: phone
    };
    
    emergencyContacts.push(contact);
    localStorage.setItem('emergencyContacts', JSON.stringify(emergencyContacts));
    
    contactName.value = '';
    contactPhone.value = '';
    
    renderContacts();
    showStatus('Contact added successfully!', 'success');
}

function deleteContact(id) {
    emergencyContacts = emergencyContacts.filter(c => c.id !== id);
    localStorage.setItem('emergencyContacts', JSON.stringify(emergencyContacts));
    renderContacts();
    showStatus('Contact deleted', 'success');
}

function renderContacts() {
    contactsList.innerHTML = '';
    
    if (emergencyContacts.length === 0) {
        contactsList.innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">No emergency contacts added yet</p>';
        return;
    }
    
    emergencyContacts.forEach(contact => {
        const contactDiv = document.createElement('div');
        contactDiv.className = 'contact-item';
        contactDiv.innerHTML = `
            <div class="contact-info">
                <h4>${contact.name}</h4>
                <p>${contact.phone}</p>
            </div>
            <button class="delete-btn" onclick="deleteContact(${contact.id})">Delete</button>
        `;
        contactsList.appendChild(contactDiv);
    });
}

function showStatus(message, type = 'success') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type} show`;
    
    setTimeout(() => {
        statusMessage.classList.remove('show');
    }, 3000);
}

// Handle page visibility change to stop alarm when page is not visible
document.addEventListener('visibilitychange', function() {
    if (document.hidden && isAlarmPlaying) {
        stopAlarm();
    }
});

// Make deleteContact function globally accessible
window.deleteContact = deleteContact;
