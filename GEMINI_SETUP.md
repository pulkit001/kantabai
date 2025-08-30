# Google Gemini AI Setup for Invoice Processing

## 📋 Setup Instructions

### 1. Get Your Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### 2. Add to Environment Variables
Add the following to your `.env.local` file:

```bash
# Google Gemini AI API
GEMINI_API_KEY="your_actual_api_key_here"
```

### 3. Test the Integration
1. Upload a grocery PDF invoice
2. Check the server logs for Gemini processing steps
3. Review the extracted ingredients in the editable table

## 🔧 How It Works

1. **PDF Upload**: User uploads a PDF invoice
2. **Direct AI Analysis**: Gemini Vision analyzes the PDF directly (no text extraction needed)
3. **Visual Processing**: AI understands layout, tables, and formatting
4. **Structured Extraction**: AI returns complete ingredient data in database schema format
5. **User Review**: Ingredients are displayed in an editable table
6. **Database Storage**: User confirms and items are added to their kitchen

## 🎯 Benefits of Direct PDF Analysis

- ✅ **Visual Understanding**: AI sees layout, tables, and formatting
- ✅ **Higher Accuracy**: No text extraction errors or missing data  
- ✅ **Better Structure Recognition**: Understands invoice tables and rows
- ✅ **Brand Detection**: Identifies brands even in complex visual layouts
- ✅ **Multiple Formats**: Works with any PDF invoice design
- ✅ **Image-based PDFs**: Can handle scanned invoices and images
- ✅ **Context Awareness**: Uses visual cues to separate items from headers/footers

## 🚨 Important Notes

- Keep your API key secure and never commit it to version control
- Gemini API has rate limits and usage charges
- The API requires internet connectivity
- For production, consider implementing retry logic and error handling

## 🐛 Troubleshooting

1. **"AI service not configured"**: Check that GEMINI_API_KEY is set
2. **Network errors**: Verify internet connection and API key validity
3. **No items extracted**: Check PDF text quality and try manual text input
4. **JSON parsing errors**: The AI response will be logged for debugging
