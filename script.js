// Global variables
let currentStep = 1;
let userProfile = JSON.parse(localStorage.getItem('fitCheckAI_profile') || '{"personality": "", "colors": "", "style": ""}');
let capturedImage = null;
let stream = null;
let currentFacingMode = 'user';
let savedOutfits = JSON.parse(localStorage.getItem('fitCheckAI_outfits') || '[]');
let countdownTimer = 0; // Default to no delay
let countdownInterval = null;

// AI Configuration
// ========================================
// INSERT YOUR GEMINI API KEY HERE:
// ========================================
const GEMINI_API_KEY = 'AIzaSyDcYGMYiikOeni75NUs4LMbKo-fd5PnT2k'; // Replace with your actual API key
// ========================================

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// Tab Navigation
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Hide all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Activate selected tab button
    event.target.classList.add('active');
    
    // Update profile display if switching to profile tab
    if (tabName === 'profile') {
        updateProfileDisplay();
    }
    
    // Update recent outfits if switching to home tab
    if (tabName === 'home') {
        updateRecentOutfits();
    }
}

// Home tab functions
function startNewAnalysis() {
    showTab('capture');
    
    // Check if user profile is complete
    if (isProfileComplete()) {
        // Skip survey and go directly to camera
        showScreen('camera-screen');
        initializeCameraScreen();
        initializeCamera();
    } else {
        // Start survey to complete profile
        startSurvey();
    }
}

function isProfileComplete() {
    return userProfile.personality && userProfile.colors && userProfile.style;
}

function viewHistory() {
    // Show the history in a modal or dedicated screen
    showHistoryModal();
}

function showHistoryModal() {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'history-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Style History</h2>
                <button class="close-btn" onclick="closeHistoryModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="history-grid" id="history-grid">
                    ${generateHistoryHTML()}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function generateHistoryHTML() {
    if (savedOutfits.length === 0) {
        return '<div class="no-outfits"><span>📷</span><p>No outfits saved yet</p></div>';
    }
    
    return savedOutfits.map((outfit, index) => `
        <div class="history-item" onclick="viewOutfitDetails(${index})">
            <div class="outfit-image">
                <img src="${outfit.image}" alt="Outfit ${index + 1}">
                <div class="outfit-rating">${'★'.repeat(Math.floor(outfit.rating))}${'☆'.repeat(5 - Math.floor(outfit.rating))}</div>
            </div>
            <div class="outfit-info">
                <h4>${outfit.occasion ? capitalizeFirst(outfit.occasion) : 'Unknown Occasion'}</h4>
                <p>${outfit.date}</p>
                <p>${outfit.weather ? capitalizeFirst(outfit.weather) : 'Unknown Weather'}</p>
            </div>
            <button class="delete-btn" onclick="deleteOutfit(${index}, event)">🗑️</button>
        </div>
    `).join('');
}

function viewOutfitDetails(index) {
    const outfit = savedOutfits[index];
    if (outfit) {
        const details = `
Outfit Details:
• Date: ${outfit.date}
• Occasion: ${outfit.occasion ? capitalizeFirst(outfit.occasion) : 'Not specified'}
• Weather: ${outfit.weather ? capitalizeFirst(outfit.weather) : 'Not specified'}
• Rating: ${outfit.rating.toFixed(1)}/5.0
• Personality: ${outfit.personality ? capitalizeFirst(outfit.personality) : 'Not set'}
• Colors: ${outfit.colors ? capitalizeFirst(outfit.colors) : 'Not set'}
• Style: ${outfit.style ? capitalizeFirst(outfit.style) : 'Not set'}
        `;
        alert(details);
    }
}

function deleteOutfit(index, event) {
    event.stopPropagation(); // Prevent triggering viewOutfitDetails
    if (confirm('Are you sure you want to delete this outfit?')) {
        savedOutfits.splice(index, 1);
        localStorage.setItem('fitCheckAI_outfits', JSON.stringify(savedOutfits));
        
        // Update the history display
        const historyGrid = document.getElementById('history-grid');
        if (historyGrid) {
            historyGrid.innerHTML = generateHistoryHTML();
        }
        
        // Update recent outfits on home page
        updateRecentOutfits();
    }
}

function closeHistoryModal() {
    const modal = document.querySelector('.history-modal');
    if (modal) {
        modal.remove();
    }
}

// Profile tab functions
function updateProfileDisplay() {
    document.getElementById('profile-personality').textContent = 
        userProfile.personality ? capitalizeFirst(userProfile.personality) : 'Not set';
    document.getElementById('profile-colors').textContent = 
        userProfile.colors ? capitalizeFirst(userProfile.colors) : 'Not set';
    document.getElementById('profile-style').textContent = 
        userProfile.style ? capitalizeFirst(userProfile.style) : 'Not set';
}

function editProfile() {
    showTab('capture');
    startSurvey();
    
    // Pre-select current profile values if they exist
    setTimeout(() => {
        if (userProfile.personality) {
            const personalityBtn = document.querySelector(`[onclick="selectOption('${userProfile.personality}')"]`);
            if (personalityBtn) personalityBtn.classList.add('selected');
        }
        if (userProfile.colors) {
            const colorBtn = document.querySelector(`[data-color="${userProfile.colors}"]`);
            if (colorBtn) colorBtn.classList.add('selected');
        }
        if (userProfile.style) {
            const styleBtn = document.querySelector(`[onclick="selectStyle('${userProfile.style}')"]`);
            if (styleBtn) styleBtn.classList.add('selected');
        }
    }, 100);
}

function clearProfile() {
    if (confirm('Are you sure you want to clear your style profile? You will need to complete the survey again.')) {
        userProfile = { personality: '', colors: '', style: '' };
        localStorage.removeItem('fitCheckAI_profile');
        updateProfileDisplay();
        alert('Profile cleared! Complete the survey again to set your preferences.');
    }
}

// API Key is now configured directly in the code above

function updateRecentOutfits() {
    const grid = document.getElementById('recent-outfits-grid');
    if (savedOutfits.length === 0) {
        grid.innerHTML = '<div class="outfit-placeholder"><span>📷</span><p>No outfits yet</p></div>';
    } else {
        grid.innerHTML = savedOutfits.map((outfit, index) => 
            `<div class="outfit-item" onclick="viewOutfit(${index})">
                <img src="${outfit.image}" alt="Outfit ${index + 1}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 8px;">
                <div class="outfit-rating">${'★'.repeat(Math.floor(outfit.rating))}${'☆'.repeat(5 - Math.floor(outfit.rating))}</div>
            </div>`
        ).join('');
    }
}

function viewOutfit(index) {
    const outfit = savedOutfits[index];
    if (outfit) {
        alert(`Outfit from ${outfit.date}\nRating: ${outfit.rating.toFixed(1)}/5\nOccasion: ${outfit.occasion}`);
    }
}

// Survey functionality
function startSurvey() {
    showScreen('survey-screen');
    currentStep = 1;
    updateSurveyStep();
}

function selectOption(personality) {
    // Remove previous selection
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Add selection to clicked button
    event.target.closest('.option-btn').classList.add('selected');
    
    userProfile.personality = personality;
    localStorage.setItem('fitCheckAI_profile', JSON.stringify(userProfile));
    enableNextButton();
}

function selectColor(colors) {
    // Remove previous selection
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Add selection to clicked button
    event.target.closest('.color-btn').classList.add('selected');
    
    userProfile.colors = colors;
    localStorage.setItem('fitCheckAI_profile', JSON.stringify(userProfile));
    enableNextButton();
}

function selectStyle(style) {
    // Remove previous selection
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Add selection to clicked button
    event.target.closest('.option-btn').classList.add('selected');
    
    userProfile.style = style;
    localStorage.setItem('fitCheckAI_profile', JSON.stringify(userProfile));
    enableNextButton();
}

function nextStep() {
    if (currentStep < 3) {
        currentStep++;
        updateSurveyStep();
    } else {
        // Survey complete, save profile and go to camera
        localStorage.setItem('fitCheckAI_profile', JSON.stringify(userProfile));
        showScreen('camera-screen');
        initializeCameraScreen();
        initializeCamera();
    }
}

function previousStep() {
    if (currentStep > 1) {
        currentStep--;
        updateSurveyStep();
    }
}

function updateSurveyStep() {
    // Hide all steps
    document.querySelectorAll('.survey-step').forEach(step => {
        step.style.display = 'none';
    });
    
    // Show current step
    document.getElementById(`step-${currentStep}`).style.display = 'block';
    
    // Update navigation buttons
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    prevBtn.style.display = currentStep > 1 ? 'block' : 'none';
    
    if (currentStep === 3) {
        nextBtn.textContent = 'Start Camera';
    } else {
        nextBtn.textContent = 'Next';
    }
    
    // Reset button states
    nextBtn.disabled = true;
    document.querySelectorAll('.option-btn, .color-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
}

function enableNextButton() {
    document.getElementById('next-btn').disabled = false;
}

// Camera functionality
async function initializeCamera() {
    try {
        // Check if we already have camera permission
        const hasPermission = localStorage.getItem('fitCheckAI_cameraPermission') === 'granted';
        
        if (!hasPermission) {
            // Request permission once
            const permissionStream = await navigator.mediaDevices.getUserMedia({ video: true });
            permissionStream.getTracks().forEach(track => track.stop()); // Stop immediately
            localStorage.setItem('fitCheckAI_cameraPermission', 'granted');
        }
        
        const constraints = {
            video: {
                facingMode: currentFacingMode,
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        };
        
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        const video = document.getElementById('video');
        video.srcObject = stream;
    } catch (err) {
        console.error('Error accessing camera:', err);
        alert('Unable to access camera. Please check permissions and try again.');
        goBack();
    }
}

// Countdown Timer Functions
function setTimer(seconds) {
    countdownTimer = seconds;
    
    // Update button states
    document.querySelectorAll('.timer-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Highlight selected button
    event.target.classList.add('active');
}

function startCapture() {
    if (countdownTimer === 0) {
        // No delay - capture immediately
        capturePhoto();
    } else {
        // Start countdown
        startCountdown();
    }
}

function startCountdown() {
    const countdownDisplay = document.getElementById('countdown-display');
    const countdownNumber = document.getElementById('countdown-number');
    const captureBtn = document.querySelector('.btn-capture');
    
    // Disable capture button during countdown
    captureBtn.disabled = true;
    captureBtn.textContent = '⏱️';
    
    // Show countdown display
    countdownDisplay.style.display = 'block';
    
    let timeLeft = countdownTimer;
    countdownNumber.textContent = timeLeft;
    
    countdownInterval = setInterval(() => {
        timeLeft--;
        countdownNumber.textContent = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            countdownDisplay.style.display = 'none';
            captureBtn.disabled = false;
            captureBtn.textContent = '📷';
            capturePhoto();
        }
    }, 1000);
}

function capturePhoto() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to data URL
    capturedImage = canvas.toDataURL('image/jpeg', 0.8);
    
    // Stop camera stream
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    
    // Go to context screen
    showScreen('context-screen');
}

function switchCamera() {
    currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    
    // Stop current stream
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    
    // Initialize with new facing mode
    initializeCamera();
}

function goBack() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    showScreen('survey-screen');
}

// Initialize camera screen with default timer selection
function initializeCameraScreen() {
    // Set default timer selection (3 seconds)
    countdownTimer = 3;
    document.querySelectorAll('.timer-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent === '3 Seconds') {
            btn.classList.add('active');
        }
    });
}

// Context and analysis functionality
function updateContext() {
    // This function is called when form inputs change
    // Could add real-time validation here if needed
}

async function analyzeOutfit() {
    const occasion = document.getElementById('occasion').value;
    const weather = document.getElementById('weather').value;
    const customPrompt = document.getElementById('custom-prompt').value;
    
    if (!occasion) {
        alert('Please select an occasion for your outfit.');
        return;
    }
    
    if (!capturedImage) {
        alert('Please take a photo first.');
        return;
    }
    
    // Show loading state
    const analyzeBtn = event.target;
    const originalText = analyzeBtn.textContent;
    analyzeBtn.innerHTML = '<span class="loading"></span> Analyzing with AI...';
    analyzeBtn.disabled = true;
    
    try {
        // Use real AI analysis
        const analysis = await performRealAIAnalysis(occasion, weather, customPrompt);
        displayAnalysisResults(analysis);
        showScreen('results-screen');
    } catch (error) {
        console.error('AI Analysis Error:', error);
        alert('AI analysis failed. Please check your API key and try again.');
        // Fallback to simulated analysis
        performOutfitAnalysis(occasion, weather, customPrompt);
    } finally {
        analyzeBtn.textContent = originalText;
        analyzeBtn.disabled = false;
    }
}

async function performRealAIAnalysis(occasion, weather, customPrompt) {
    // Display the captured image
    const outfitImage = document.getElementById('outfit-image');
    outfitImage.src = capturedImage;
    
    // Convert base64 image to blob for API
    const imageBlob = await base64ToBlob(capturedImage);
    
    // Create the prompt for Gemini AI
    const prompt = createAIPrompt(occasion, weather, customPrompt);
    
    // Call Gemini AI API
    const aiResponse = await callGeminiAPI(imageBlob, prompt);
    
    // Parse AI response and return structured analysis
    return parseAIResponse(aiResponse);
}

function performOutfitAnalysis(occasion, weather, customPrompt) {
    // Display the captured image
    const outfitImage = document.getElementById('outfit-image');
    outfitImage.src = capturedImage;
    
    // Generate AI analysis based on user profile and context
    const analysis = generateAIAnalysis(occasion, weather, customPrompt);
    
    // Display results
    displayAnalysisResults(analysis);
    
    // Show results screen
    showScreen('results-screen');
}

function generateAIAnalysis(occasion, weather, customPrompt) {
    // This simulates AI analysis based on the user's profile and context
    const { personality, colors, style } = userProfile;
    
    // Generate more realistic rating with more variation
    const baseRating = Math.random() * 3 + 1.5; // 1.5-4.5 stars (more realistic range)
    const occasionBonus = getOccasionMatch(occasion, personality);
    const weatherBonus = getWeatherMatch(weather, style);
    const clothingMatchBonus = getClothingMatchBonus(personality, colors, style);
    const finalRating = Math.min(5, Math.max(1, baseRating + occasionBonus + weatherBonus + clothingMatchBonus));
    
    // Generate analysis text
    const occasionAnalysis = generateOccasionAnalysis(occasion, personality, finalRating);
    const styleAnalysis = generateStyleAnalysis(colors, style, personality);
    const clothingMatching = generateClothingMatchingAnalysis(personality, colors, style, finalRating);
    const clothingSuggestions = generateClothingSuggestions(occasion, weather, personality, style, finalRating);
    const suggestions = generateSuggestions(occasion, weather, personality, style, finalRating);
    
    return {
        rating: finalRating,
        occasionAnalysis,
        styleAnalysis,
        clothingMatching,
        clothingSuggestions,
        suggestions
    };
}

function getOccasionMatch(occasion, personality) {
    const matches = {
        casual: { casual: 0.5, elegant: -0.3, trendy: 0.2, minimalist: 0.3, sporty: 0.4 },
        work: { casual: -0.2, elegant: 0.4, trendy: 0.1, minimalist: 0.3, sporty: -0.1 },
        date: { casual: 0.1, elegant: 0.5, trendy: 0.3, minimalist: 0.2, sporty: 0.1 },
        party: { casual: -0.1, elegant: 0.2, trendy: 0.6, minimalist: -0.2, sporty: 0.2 },
        sports: { casual: 0.4, elegant: -0.4, trendy: 0.1, minimalist: 0.1, sporty: 0.8 },
        wedding: { casual: -0.3, elegant: 0.6, trendy: 0.1, minimalist: 0.2, sporty: -0.2 },
        travel: { casual: 0.3, elegant: -0.1, trendy: 0.2, minimalist: 0.4, sporty: 0.5 },
        gym: { casual: 0.5, elegant: -0.5, trendy: 0.1, minimalist: 0.2, sporty: 0.9 }
    };
    
    return matches[occasion]?.[personality] || 0;
}

function getWeatherMatch(weather, style) {
    const matches = {
        sunny: { comfortable: 0.2, fashionable: 0.3, classic: 0.1, experimental: 0.4 },
        cloudy: { comfortable: 0.1, fashionable: 0.1, classic: 0.2, experimental: 0.1 },
        rainy: { comfortable: 0.3, fashionable: -0.1, classic: 0.2, experimental: -0.2 },
        cold: { comfortable: 0.4, fashionable: 0.1, classic: 0.3, experimental: 0.1 }
    };
    
    return matches[weather]?.[style] || 0;
}

function getClothingMatchBonus(personality, colors, style) {
    // Simulate clothing matching analysis
    let bonus = 0;
    
    // Color coordination bonus
    if (colors === 'neutral') bonus += 0.3;
    else if (colors === 'mixed') bonus += 0.1;
    else if (colors === 'bright') bonus -= 0.1; // Can be harder to match
    
    // Style consistency bonus
    if (style === 'classic') bonus += 0.2;
    else if (style === 'experimental') bonus -= 0.2; // More risky
    
    // Personality matching
    if (personality === 'minimalist') bonus += 0.2;
    else if (personality === 'trendy') bonus -= 0.1; // Can be hit or miss
    
    return bonus;
}

function generateOccasionAnalysis(occasion, personality, rating) {
    // More realistic and honest analysis
    let analysis = "";
    
    if (rating >= 4.0) {
        const goodTexts = {
            casual: "This works well for a casual setting. The relaxed vibe fits the occasion perfectly.",
            work: "Professional and appropriate. This outfit shows you understand workplace expectations.",
            date: "Good choice for a date. The outfit strikes a nice balance between casual and put-together.",
            party: "Party-ready! This outfit has the right energy for a fun night out.",
            sports: "Perfect for the game! Athletic and comfortable without being too casual.",
            wedding: "Wedding-appropriate. You've found the right balance of formal and stylish.",
            travel: "Great for travel. Comfortable yet presentable for your journey.",
            gym: "Perfect gym attire. Functional and appropriate for your workout."
        };
        analysis = goodTexts[occasion] || "This outfit works well for the occasion.";
    } else if (rating >= 3.0) {
        const okayTexts = {
            casual: "This is okay for casual wear, but could use some improvement in coordination.",
            work: "This might work for work, but consider something more polished for better impact.",
            date: "Decent for a date, though it could be more memorable or flattering.",
            party: "This works for a party, but you might want something with more personality.",
            sports: "Good for sports, though the fit or style could be better.",
            wedding: "This is acceptable for a wedding, but consider something more elegant.",
            travel: "Functional for travel, though not the most stylish choice.",
            gym: "Works for the gym, but proper athletic wear would be better."
        };
        analysis = okayTexts[occasion] || "This outfit is okay but could be improved.";
    } else {
        const poorTexts = {
            casual: "This doesn't quite work for casual wear. The pieces don't coordinate well.",
            work: "This isn't appropriate for work. You need something more professional.",
            date: "This isn't ideal for a date. Consider something more flattering or stylish.",
            party: "This doesn't have the right energy for a party. Try something more fun.",
            sports: "This isn't suitable for sports. You need proper athletic wear.",
            wedding: "This isn't appropriate for a wedding. You need something more formal.",
            travel: "This isn't practical for travel. Consider comfort and versatility.",
            gym: "This isn't suitable for the gym. You need proper workout clothes."
        };
        analysis = poorTexts[occasion] || "This outfit doesn't work well for the occasion.";
    }
    
    // Add personality-specific feedback
    if (personality === 'sporty' && (occasion === 'work' || occasion === 'wedding')) {
        analysis += " Your sporty style might need some adjustment for this formal occasion.";
    } else if (personality === 'elegant' && (occasion === 'gym' || occasion === 'sports')) {
        analysis += " Your elegant style doesn't quite fit this athletic occasion.";
    }
    
    return analysis;
}

function generateStyleAnalysis(colors, style, personality) {
    // More realistic style analysis
    let analysis = "";
    
    // Color analysis
    if (colors === 'neutral') {
        analysis = "The neutral color palette is safe and versatile, though it might lack personality.";
    } else if (colors === 'bright') {
        analysis = "The bright colors show confidence, but make sure they coordinate well together.";
    } else if (colors === 'dark') {
        analysis = "Dark tones create a sleek look, but ensure there's enough contrast to avoid looking flat.";
    } else if (colors === 'mixed') {
        analysis = "The mixed color palette shows creativity, though it can be challenging to coordinate properly.";
    }
    
    // Style analysis
    if (style === 'comfortable') {
        analysis += " The focus on comfort is good, but make sure it doesn't look sloppy.";
    } else if (style === 'fashionable') {
        analysis += " You're following trends, which is great, but ensure the pieces work together.";
    } else if (style === 'classic') {
        analysis += " Classic pieces are timeless, though they might need updating to avoid looking dated.";
    } else if (style === 'experimental') {
        analysis += " Your experimental approach is bold, but make sure it's not overwhelming.";
    }
    
    return analysis;
}

function generateClothingMatchingAnalysis(personality, colors, style, rating) {
    // Simulate analysis of how well shirt and pants match
    let analysis = "";
    
    // Simulate clothing matching based on rating
    if (rating >= 4.0) {
        analysis = "Your shirt and pants coordinate well together. The colors complement each other and the styles are consistent. ";
        if (colors === 'neutral') {
            analysis += "The neutral tones create a cohesive look that's easy to accessorize.";
        } else if (colors === 'bright') {
            analysis += "The bright colors work well together without clashing.";
        }
    } else if (rating >= 3.0) {
        analysis = "Your shirt and pants match okay, but there's room for improvement. ";
        if (colors === 'mixed') {
            analysis += "The mixed colors might be creating some visual confusion - try to establish a clearer color scheme.";
        } else if (style === 'experimental') {
            analysis += "The experimental pieces might be competing with each other rather than working together.";
        }
    } else {
        analysis = "Your shirt and pants don't match well. ";
        if (colors === 'bright') {
            analysis += "The bright colors are clashing rather than complementing each other.";
        } else if (personality === 'sporty' && style === 'elegant') {
            analysis += "There's a mismatch between your sporty and elegant pieces - pick one direction.";
        } else {
            analysis += "The colors, styles, or proportions don't work together harmoniously.";
        }
    }
    
    // Add specific matching advice
    if (personality === 'minimalist') {
        analysis += " For a minimalist look, focus on clean lines and subtle color variations.";
    } else if (personality === 'trendy') {
        analysis += " For trendy looks, ensure your pieces are from the same fashion season or complementary styles.";
    } else if (personality === 'sporty') {
        analysis += " For sporty looks, make sure both pieces have similar athletic or casual vibes.";
    }
    
    return analysis;
}

function generateClothingSuggestions(occasion, weather, personality, style, rating) {
    let suggestions = [];
    
    // More honest and realistic suggestions based on rating
    if (rating < 2.5) {
        suggestions.push("This outfit needs significant improvement. Consider starting over with a completely different approach.");
        if (occasion === 'work') {
            suggestions.push("For work, you need professional pieces - a proper blazer, dress shirt, or business-appropriate dress.");
        } else if (occasion === 'date') {
            suggestions.push("For a date, choose something that makes you feel confident and attractive - this isn't working.");
        }
    } else if (rating < 3.5) {
        suggestions.push("This outfit has potential but needs refinement. The basic idea is there, but execution needs work.");
        
        // Occasion-specific suggestions
        if (occasion === 'work') {
            if (personality === 'casual') {
                suggestions.push("Try a crisp white button-down shirt or a structured blazer to elevate your professional look.");
            } else if (personality === 'sporty') {
                suggestions.push("Consider a polo shirt or a smart-casual jacket instead of athletic wear for a more professional appearance.");
            }
        }
        
        if (occasion === 'date') {
            if (personality === 'sporty') {
                suggestions.push("Try a nice polo shirt or a casual button-down instead of athletic wear for a more romantic vibe.");
            } else if (personality === 'casual') {
                suggestions.push("Consider a nice blouse or a dress shirt to add some elegance to your casual look.");
            }
        }
        
        if (occasion === 'party') {
            if (personality === 'minimalist') {
                suggestions.push("Try a statement piece like a sequined top or bold accessories to match the party energy.");
            } else if (personality === 'sporty') {
                suggestions.push("Consider a trendy crop top or a stylish jacket instead of athletic wear for the party scene.");
            }
        }
    } else {
        // Good rating - minor improvements
        suggestions.push("This outfit works well overall. Here are some ways to make it even better:");
        
        if (occasion === 'work' && personality === 'elegant') {
            suggestions.push("A tailored blazer or a pencil skirt would perfect your sophisticated office look.");
        }
        
        if (occasion === 'date' && personality === 'elegant') {
            suggestions.push("A little black dress or a silk blouse would be perfect for this romantic occasion.");
        }
        
        if (occasion === 'sports' || occasion === 'gym') {
            if (personality === 'elegant') {
                suggestions.push("Switch to moisture-wicking athletic wear and supportive sneakers for better performance.");
            } else if (personality === 'casual') {
                suggestions.push("Consider proper athletic shoes and breathable fabrics for optimal comfort during activity.");
            }
        }
    }
    
    // Weather-specific suggestions
    if (weather === 'cold') {
        suggestions.push("Layer with a stylish coat, scarf, or cardigan. Consider thermal base layers for extra warmth.");
    } else if (weather === 'sunny') {
        suggestions.push("Light, breathable fabrics like cotton or linen would be perfect. Don't forget sun protection!");
    } else if (weather === 'rainy') {
        suggestions.push("A stylish raincoat or waterproof jacket would be both functional and fashionable.");
    }
    
    // Personality-specific suggestions
    if (personality === 'sporty' && (occasion !== 'gym' && occasion !== 'sports')) {
        suggestions.push("For non-athletic occasions, try athleisure pieces that blend comfort with style.");
    } else if (personality === 'trendy') {
        suggestions.push("Experiment with current fashion trends like oversized pieces or bold patterns.");
    } else if (personality === 'minimalist') {
        suggestions.push("Focus on clean lines and quality fabrics. A well-fitted piece makes all the difference.");
    }
    
    return suggestions.length > 0 ? suggestions.join(' ') : "Your current clothing choices work well! Consider experimenting with different styles to find new favorites.";
}

function generateSuggestions(occasion, weather, personality, style, rating) {
    let suggestions = [];
    
    // More honest and realistic general suggestions
    if (rating < 2.5) {
        suggestions.push("Honestly, this outfit isn't working. Consider these fundamental improvements:");
        suggestions.push("1. Make sure your clothes fit properly - nothing too tight or too loose");
        suggestions.push("2. Choose colors that actually work together");
        suggestions.push("3. Pick pieces that match the occasion");
        suggestions.push("4. Consider your body type and what flatters you");
    } else if (rating < 3.5) {
        suggestions.push("This outfit has potential but needs work. Focus on these areas:");
        suggestions.push("1. Better color coordination between pieces");
        suggestions.push("2. Ensuring the style is consistent throughout");
        suggestions.push("3. Making sure the fit is flattering");
    } else if (rating >= 4.0) {
        suggestions.push("This outfit works well! To make it even better:");
        suggestions.push("1. Add accessories that complement the look");
        suggestions.push("2. Consider the details - shoes, bag, jewelry");
        suggestions.push("3. Make sure everything is clean and well-pressed");
    }
    
    // Occasion-specific general advice
    if (occasion === 'work') {
        suggestions.push("For work, always err on the side of being slightly overdressed rather than underdressed.");
    } else if (occasion === 'date') {
        suggestions.push("For dates, choose something that makes you feel confident and comfortable.");
    } else if (occasion === 'party') {
        suggestions.push("For parties, don't be afraid to have fun with your outfit - it's a celebration!");
    }
    
    // Weather-specific general advice
    if (weather === 'cold') {
        suggestions.push("In cold weather, layering is key - but make sure each layer works together.");
    } else if (weather === 'sunny') {
        suggestions.push("In sunny weather, consider UV protection and breathable fabrics.");
    }
    
    // Personality-specific general advice
    if (personality === 'minimalist') {
        suggestions.push("For minimalist style, focus on quality over quantity - one perfect piece is better than many mediocre ones.");
    } else if (personality === 'trendy') {
        suggestions.push("For trendy style, make sure you're not just following trends blindly - pick ones that suit you.");
    } else if (personality === 'sporty') {
        suggestions.push("For sporty style, remember that athleisure can work for many occasions, but not all.");
    }
    
    return suggestions.length > 0 ? suggestions.join(' ') : "Keep experimenting with different combinations to find what works best for you.";
}

function displayAnalysisResults(analysis) {
    // Display rating
    const ratingStars = document.getElementById('rating-stars');
    const ratingScore = document.getElementById('rating-score');
    
    const stars = '★'.repeat(Math.floor(analysis.rating)) + '☆'.repeat(5 - Math.floor(analysis.rating));
    ratingStars.textContent = stars;
    ratingScore.textContent = `${analysis.rating.toFixed(1)}/5.0`;
    
    // Display analysis sections
    document.getElementById('occasion-analysis').textContent = analysis.occasionAnalysis;
    document.getElementById('style-analysis').textContent = analysis.styleAnalysis;
    document.getElementById('clothing-matching').textContent = analysis.clothingMatching;
    document.getElementById('clothing-suggestions').textContent = analysis.clothingSuggestions;
    document.getElementById('suggestions').textContent = analysis.suggestions;
}

// Navigation functions
function showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show target screen
    document.getElementById(screenId).classList.add('active');
    
    // Add fade-in animation
    setTimeout(() => {
        document.getElementById(screenId).classList.add('fade-in');
    }, 50);
}

function tryAgain() {
    // Reset to camera screen
    showScreen('camera-screen');
    initializeCameraScreen();
    initializeCamera();
}

function saveOutfit() {
    // Get current analysis data
    const occasion = document.getElementById('occasion').value;
    const weather = document.getElementById('weather').value;
    const rating = parseFloat(document.getElementById('rating-score').textContent.split('/')[0]);
    
    // Create outfit object
    const outfit = {
        id: Date.now(),
        image: capturedImage,
        occasion: occasion,
        weather: weather,
        rating: rating,
        personality: userProfile.personality,
        colors: userProfile.colors,
        style: userProfile.style,
        date: new Date().toLocaleDateString(),
        timestamp: Date.now()
    };
    
    // Save to local storage
    savedOutfits.unshift(outfit); // Add to beginning of array
    if (savedOutfits.length > 10) {
        savedOutfits = savedOutfits.slice(0, 10); // Keep only last 10 outfits
    }
    localStorage.setItem('fitCheckAI_outfits', JSON.stringify(savedOutfits));
    
    // Show success message
    const saveBtn = event.target;
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Saved! ✓';
    saveBtn.style.background = '#28a745';
    
    setTimeout(() => {
        saveBtn.textContent = originalText;
        saveBtn.style.background = '';
    }, 2000);
    
    // Update recent outfits display
    updateRecentOutfits();
}

// AI Helper Functions
async function base64ToBlob(base64) {
    const response = await fetch(base64);
    return await response.blob();
}

function createAIPrompt(occasion, weather, customPrompt) {
    const { personality, colors, style } = userProfile;
    
    return `Analyze this outfit photo and provide a detailed fashion analysis. 

CONTEXT:
- Occasion: ${occasion}
- Weather: ${weather}
- User's style personality: ${personality}
- User's color preference: ${colors}
- User's style preference: ${style}
- Additional notes: ${customPrompt || 'None'}

Please analyze the outfit and provide a JSON response with the following structure:
{
  "rating": 3.5,
  "occasionAnalysis": "Detailed analysis of how well the outfit matches the occasion",
  "styleAnalysis": "Analysis of colors, style, and overall aesthetic",
  "clothingMatching": "Specific analysis of how well the shirt and pants match together",
  "clothingSuggestions": "Specific suggestions for better clothing pieces",
  "suggestions": "General improvement tips and advice"
}

Be honest and realistic in your analysis. Look at the actual colors, fit, style, and coordination of the outfit. Rate from 1-5 stars and provide specific, actionable feedback.`;
}

async function callGeminiAPI(imageBlob, prompt) {
    if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
        throw new Error('Please set your Gemini API key');
    }
    
    // Convert image to base64 for API
    const base64Image = await blobToBase64(imageBlob);
    
    const requestBody = {
        contents: [{
            parts: [
                { text: prompt },
                {
                    inline_data: {
                        mime_type: "image/jpeg",
                        data: base64Image
                    }
                }
            ]
        }],
        generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
        }
    };
    
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

async function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function parseAIResponse(aiResponse) {
    try {
        // Try to extract JSON from the response
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        } else {
            // Fallback if JSON parsing fails
            return {
                rating: 3.0,
                occasionAnalysis: "AI analysis completed but response format was unexpected.",
                styleAnalysis: aiResponse.substring(0, 200) + "...",
                clothingMatching: "Unable to parse specific clothing matching analysis.",
                clothingSuggestions: "Please try again or check your API configuration.",
                suggestions: "AI analysis completed with some formatting issues."
            };
        }
    } catch (error) {
        console.error('Error parsing AI response:', error);
        return {
            rating: 3.0,
            occasionAnalysis: "Error parsing AI response. Please try again.",
            styleAnalysis: "AI analysis completed but couldn't be properly formatted.",
            clothingMatching: "Unable to parse clothing matching analysis.",
            clothingSuggestions: "Please try again or check your API configuration.",
            suggestions: "There was an issue processing the AI response."
        };
    }
}

// Utility functions
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Add any initialization code here
    console.log('FitCheck-AI app loaded successfully!');
    
    // Initialize the app with home tab active
    updateProfileDisplay();
    updateRecentOutfits();
});

// Camera permission is now handled when needed, not at startup

// Handle back button
window.addEventListener('popstate', function(event) {
    // Handle browser back button if needed
});

// Add some demo functionality for testing without camera
function addDemoImage() {
    // This function can be used to add a demo image for testing
    // when camera is not available
    const demoImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkRlbW8gT3V0Zml0IEltYWdlPC90ZXh0Pgo8L3N2Zz4K';
    
    capturedImage = demoImage;
    showScreen('context-screen');
}

// Add demo button for testing (remove in production)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    document.addEventListener('DOMContentLoaded', function() {
        const demoBtn = document.createElement('button');
        demoBtn.textContent = 'Demo Mode (No Camera)';
        demoBtn.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 1000; background: #ff6b6b; color: white; border: none; padding: 5px 10px; border-radius: 5px; font-size: 12px;';
        demoBtn.onclick = addDemoImage;
        document.body.appendChild(demoBtn);
    });
}
