# FitCheck-Ai - Your Personal Style Assistant

A mobile-first web application that uses **real AI** to analyze your outfit photos and provide intelligent fashion feedback. Simply take a photo of your outfit and get instant, honest analysis on how it looks and suggestions for improvement.

## ✨ **NEW: Real AI Integration!**

This app now uses **Google's Gemini AI** to actually look at your outfit photos and provide intelligent analysis based on what it sees, not just random simulations!

## Features

### 🎯 Style Survey
- Quick 3-step survey to understand your fashion personality
- Choose from Casual, Elegant, Trendy, Minimalist, or Sporty styles
- Select your preferred color palette
- Define your style preferences
- **One-time setup** - no need to repeat the survey

### 📸 Camera Integration
- Take photos directly in the app using your device's camera
- Switch between front and back cameras
- Real-time camera preview with outfit framing guide
- **One-time camera permission** request

### 🤖 **Real AI Analysis**
- **Actual photo analysis** using Google's Gemini AI
- **Honest ratings** (1-5 stars) based on what the AI sees
- **Specific feedback** on colors, fit, and coordination
- **Shirt and pants matching** analysis
- **Occasion appropriateness** assessment
- **Realistic suggestions** for improvement

### 🎨 Context-Aware Analysis
- Specify the occasion (casual, work, date, party, sports, wedding, travel, gym)
- Add weather conditions for better suggestions
- Include custom details about your outfit needs

### 💾 Save Your Looks
- Save your favorite outfit combinations
- Track your style evolution over time
- **Fully functional history** with delete/view options

## 🚀 **Setup Instructions**

### 1. Get Your Free Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### 2. Configure the App
1. Open `script.js` in a text editor
2. Find the section at the top that says:
   ```javascript
   // ========================================
   // INSERT YOUR GEMINI API KEY HERE:
   // ========================================
   const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY_HERE'; // Replace with your actual API key
   // ========================================
   ```
3. Replace `'YOUR_GEMINI_API_KEY_HERE'` with your actual API key
4. Save the file

### 3. Start Using AI Analysis
1. Open `index.html` in your browser
2. Complete the style survey (one-time only)
3. Take a photo of your outfit
4. Select the occasion and weather
5. Get real AI analysis of your outfit!

## How It Works

1. **Take a Photo** - Use the camera to capture your outfit
2. **Add Context** - Tell the app about the occasion and weather
3. **AI Analysis** - Gemini AI analyzes your actual photo
4. **Get Feedback** - Receive honest, specific feedback about your outfit
5. **Save Favorites** - Keep track of your best looks

## How to Use

1. **Open the app** - Simply open `index.html` in your web browser
2. **Complete the survey** - Answer 3 quick questions about your style preferences
3. **Take a photo** - Use the camera to capture your outfit
4. **Add context** - Tell the app about the occasion and weather
5. **Get analysis** - Receive instant feedback and suggestions
6. **Save favorites** - Keep track of your best looks

## Technical Details

- **Pure HTML, CSS, and JavaScript** - No frameworks or dependencies required
- **Mobile-first design** - Optimized for smartphones and tablets
- **Responsive layout** - Works on all screen sizes
- **Camera API integration** - Uses device camera for photo capture
- **Local storage** - Saves your preferences and outfit history

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## Camera Permissions

The app requires camera access to take outfit photos. When prompted:
1. Click "Allow" to grant camera permissions
2. If denied, you can use the "Demo Mode" button for testing

## Demo Mode

For testing without camera access, there's a "Demo Mode" button that appears in development environments. This allows you to test all features except the actual photo capture.

## File Structure

```
fashion-app/
├── index.html      # Main HTML file
├── styles.css      # CSS styling
├── script.js       # JavaScript functionality
└── README.md       # This file
```

## Getting Started

1. Download all files to a folder
2. Open `index.html` in your web browser
3. Grant camera permissions when prompted
4. Start using the app!

## Customization

The app is designed to be easily customizable:

- **Colors**: Modify the CSS variables in `styles.css`
- **Survey questions**: Edit the HTML in `index.html`
- **AI responses**: Customize the analysis functions in `script.js`
- **Occasions**: Add or modify occasion options in the select dropdown

## Future Enhancements

Potential features for future versions:
- Real AI integration (currently simulated)
- Outfit history and favorites
- Social sharing capabilities
- Weather API integration
- Style trend analysis
- Outfit recommendation engine

## Support

This is a demo application. For questions or issues, please check the code comments or modify the functionality as needed.

Enjoy styling with FitCheck-Ai! 👗✨

