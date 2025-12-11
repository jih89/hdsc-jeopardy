const points = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
const categories = [
    { id: 0, name: "Matematika Dasar", dbId: 1 },  // Database ID is 1
    { id: 1, name: "Biologi", dbId: 2 },            // Database ID is 2
    { id: 2, name: "Kedokteran Gigi Dasar", dbId: 3 } // Database ID is 3
];

let sessionToken = null;
let currentQuestions = {};
let currentEditCell = null;
let originalEditData = null; // Store original data when editor opens for conflict detection

// Check for existing session on load
window.addEventListener('DOMContentLoaded', () => {
    const storedToken = localStorage.getItem('admin_session_token');
    const storedExpiry = localStorage.getItem('admin_session_expiry');
    
    if (storedToken && storedExpiry && new Date(storedExpiry) > new Date()) {
        verifySession(storedToken);
    } else {
        showLoginScreen();
    }
});

async function handleLogin() {
    const passcodeInput = document.getElementById('passcode-input');
    const errorDiv = document.getElementById('login-error');
    const passcode = passcodeInput.value.trim();

    if (!passcode) {
        errorDiv.textContent = 'Please enter a passcode';
        return;
    }

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ passcode }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
            sessionToken = data.sessionToken;
            localStorage.setItem('admin_session_token', sessionToken);
            localStorage.setItem('admin_session_expiry', data.expiresAt);
            showAdminPanel();
            loadQuestions();
        } else {
            errorDiv.textContent = data.error || 'Invalid passcode';
            passcodeInput.value = '';
        }
    } catch (error) {
        errorDiv.textContent = 'Error connecting to server';
        console.error('Login error:', error);
    }
}

async function verifySession(token) {
    try {
        const response = await fetch('/api/auth/verify', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (response.ok) {
            sessionToken = token;
            showAdminPanel();
            loadQuestions();
        } else {
            showLoginScreen();
        }
    } catch (error) {
        showLoginScreen();
    }
}

function showLoginScreen() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('admin-panel').style.display = 'none';
    sessionToken = null;
    localStorage.removeItem('admin_session_token');
    localStorage.removeItem('admin_session_expiry');
}

function showAdminPanel() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
}

function handleLogout() {
    showLoginScreen();
}

async function loadQuestions() {
    try {
        const response = await fetch('/api/questions');
        if (response.ok) {
            currentQuestions = await response.json();
            
            // Ensure all question arrays have exactly 3 items (pad with empty if needed)
            // Note: API returns point indices (0-9) as keys, not point values
            for (const catId in currentQuestions) {
                for (const pointIndex in currentQuestions[catId]) {
                    const questions = currentQuestions[catId][pointIndex];
                    // Pad to 3 questions if needed
                    while (questions.length < 3) {
                        questions.push({ q: '', a: '' });
                    }
                    // Trim to 3 if somehow more
                    if (questions.length > 3) {
                        currentQuestions[catId][pointIndex] = questions.slice(0, 3);
                    }
                }
            }
            
            initAdminBoard();
        } else {
            console.error('Failed to load questions');
            initAdminBoard();
        }
    } catch (error) {
        console.error('Error loading questions:', error);
        initAdminBoard();
    }
}

function initAdminBoard() {
    const board = document.getElementById('admin-board');
    
    // Clear existing cards (keep category headers)
    const headers = board.querySelectorAll('.category-header');
    board.innerHTML = '';
    headers.forEach(header => board.appendChild(header));

    for (let i = 0; i < points.length; i++) {
        for (let j = 0; j < categories.length; j++) {
            const point = points[i];
            const card = document.createElement('div');
            card.className = 'admin-card';
            card.innerText = point;
            card.dataset.cat = j;
            card.dataset.ptIdx = i;

            // API returns data with point indices (0-9), not point values (10, 20, 30, etc.)
            // So we need to use the index 'i' to look up questions, not the point value
            const questions = currentQuestions[j] && currentQuestions[j][i] 
                ? currentQuestions[j][i] 
                : [];
            
            // Check if all 3 questions are complete (both question and answer filled)
            const allQuestionsComplete = questions.length >= 3 && 
                questions.every(q => q.q && q.q.trim() !== '' && q.a && q.a.trim() !== '');
            
            // Check if at least one question is started but not all complete
            const hasPartialQuestions = questions.some(q => q.q && q.q.trim() !== '') && !allQuestionsComplete;
            
            if (allQuestionsComplete) {
                card.classList.add('has-questions'); // All complete - show checkmark
            } else if (hasPartialQuestions) {
                card.classList.add('waiting-questions'); // Partial - show waiting status
            }

            card.onclick = () => openEditor(j, point);
            board.appendChild(card);
        }
    }
}

function openEditor(categoryId, pointValue) {
    currentEditCell = { categoryId, pointValue };
    
    const editor = document.getElementById('question-editor');
    const title = document.getElementById('editor-title');
    const category = categories.find(c => c.id === categoryId);
    
    title.textContent = `${category.name} - ${pointValue} Points`;
    
    // API returns data with point indices (0-9), not point values (10, 20, 30, etc.)
    // Convert point value to index
    const pointIndex = points.indexOf(pointValue);
    
    // Get current questions or create empty ones
    const questions = currentQuestions[categoryId] && currentQuestions[categoryId][pointIndex]
        ? JSON.parse(JSON.stringify(currentQuestions[categoryId][pointIndex])) // Deep copy
        : [{ q: '', a: '' }, { q: '', a: '' }, { q: '', a: '' }];

    // Ensure we have 3 questions
    while (questions.length < 3) {
        questions.push({ q: '', a: '' });
    }
    
    // Store original data for conflict detection
    originalEditData = JSON.parse(JSON.stringify(questions));

    editor.innerHTML = '';
    questions.forEach((q, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-item';
        questionDiv.innerHTML = `
            <h3>Question ${index + 1}</h3>
            <label>Question:</label>
            <textarea id="q-${index}" rows="3">${q.q || ''}</textarea>
            <label>Answer:</label>
            <textarea id="a-${index}" rows="2">${q.a || ''}</textarea>
        `;
        editor.appendChild(questionDiv);
    });

    document.getElementById('editor-modal').style.display = 'flex';
    document.getElementById('save-status').textContent = '';
}

function closeEditor() {
    document.getElementById('editor-modal').style.display = 'none';
    currentEditCell = null;
    originalEditData = null; // Clear original data when closing
}

function reloadEditor() {
    // Reload questions from server and reopen editor
    if (!currentEditCell) return;
    
    const { categoryId, pointValue } = currentEditCell;
    
    // Reload all questions
    loadQuestions().then(() => {
        // Reopen editor with fresh data
        openEditor(categoryId, pointValue);
        
        const statusDiv = document.getElementById('save-status');
        statusDiv.textContent = '✓ Reloaded latest data';
        statusDiv.className = 'save-status success';
        
        setTimeout(() => {
            statusDiv.textContent = '';
            statusDiv.className = 'save-status';
        }, 2000);
    });
}

// Expose functions globally for onclick handlers
window.reloadEditor = reloadEditor;
window.saveQuestions = saveQuestions;
window.closeEditor = closeEditor;

async function saveQuestions(forceOverwrite = false) {
    if (!currentEditCell || !sessionToken) {
        alert('Session expired. Please login again.');
        showLoginScreen();
        return;
    }

    const { categoryId, pointValue } = currentEditCell;
    const statusDiv = document.getElementById('save-status');
    
    // Check for conflicts before saving (unless force overwrite)
    if (!forceOverwrite && originalEditData) {
        try {
            // Fetch current data from server to check for conflicts
            const response = await fetch('/api/questions');
            if (response.ok) {
                const serverQuestions = await response.json();
                const pointIndex = points.indexOf(pointValue);
                const serverData = serverQuestions[categoryId] && serverQuestions[categoryId][pointIndex]
                    ? serverQuestions[categoryId][pointIndex]
                    : [{ q: '', a: '' }, { q: '', a: '' }, { q: '', a: '' }];
                
                // Ensure server data has 3 items
                while (serverData.length < 3) {
                    serverData.push({ q: '', a: '' });
                }
                
                // Compare with original data (what was loaded when editor opened)
                const hasConflict = JSON.stringify(serverData) !== JSON.stringify(originalEditData);
                
                if (hasConflict) {
                    // Show conflict warning
                    statusDiv.innerHTML = `
                        <div style="color: #ff6b6b; font-weight: bold; margin-bottom: 10px;">
                            ⚠️ Conflict Detected!
                        </div>
                        <div style="color: #fff; margin-bottom: 15px; font-size: 0.9em;">
                            This question block was modified by another organizer while you were editing.
                            Your changes will overwrite theirs.
                        </div>
                        <div style="display: flex; gap: 10px; justify-content: center;">
                            <button onclick="saveQuestions(true)" style="padding: 8px 20px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer;">
                                Overwrite Anyway
                            </button>
                            <button onclick="reloadEditor()" style="padding: 8px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">
                                Reload & Cancel
                            </button>
                        </div>
                    `;
                    statusDiv.className = 'save-status error';
                    return;
                }
            }
        } catch (error) {
            console.error('Error checking for conflicts:', error);
            // Continue with save if conflict check fails
        }
    }
    
    statusDiv.textContent = 'Saving...';
    statusDiv.className = 'save-status';

    try {
        const questions = [];
        for (let i = 0; i < 3; i++) {
            const qText = document.getElementById(`q-${i}`).value.trim();
            const aText = document.getElementById(`a-${i}`).value.trim();
            questions.push({ q: qText, a: aText });
        }

        // Save each question
        const savePromises = questions.map((q, index) => 
            fetch('/api/questions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionToken}`,
                },
                body: JSON.stringify({
                    categoryId: categories[categoryId].dbId, // Use database ID, not array index
                    pointValue,
                    questionIndex: index,
                    questionText: q.q,
                    answerText: q.a,
                }),
            })
        );

        const results = await Promise.all(savePromises);
        const allSuccess = results.every(r => r.ok);

        if (allSuccess) {
            statusDiv.textContent = '✓ Saved successfully!';
            statusDiv.className = 'save-status success';
            
            // Update local cache
            // API uses point indices (0-9), not point values (10, 20, 30, etc.)
            const pointIndex = points.indexOf(pointValue);
            if (!currentQuestions[categoryId]) {
                currentQuestions[categoryId] = {};
            }
            if (!currentQuestions[categoryId][pointIndex]) {
                currentQuestions[categoryId][pointIndex] = [];
            }
            currentQuestions[categoryId][pointIndex] = questions;
            
            // Clear original data after successful save
            originalEditData = null;
            
            // Update UI
            setTimeout(() => {
                closeEditor();
                initAdminBoard();
            }, 1000);
        } else {
            throw new Error('Some questions failed to save');
        }
    } catch (error) {
        statusDiv.textContent = '✗ Error saving questions';
        statusDiv.className = 'save-status error';
        console.error('Save error:', error);
    }
}

// Allow Enter key to submit login
document.addEventListener('DOMContentLoaded', () => {
    const passcodeInput = document.getElementById('passcode-input');
    if (passcodeInput) {
        passcodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleLogin();
            }
        });
    }
});

