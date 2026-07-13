const fs = require('fs');
const path = require('path');

/**
 * Sends a PDF/Image file from disk to Gemini 1.5 Flash to generate a structured analysis/summary.
 * @param {string} filePath - Absolute or relative path to the record file on disk
 * @param {string} customPrompt - Additional developer/user instructions to tailor the output
 * @returns {Promise<string>} HTML formatted summary text
 */
const generateDocumentSummary = async (filePath, customPrompt = '') => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini AI Service Configuration Error: GEMINI_API_KEY is not configured in the server environment.');
  }

  // Resolve the full local path and verify existence
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Archived record file not found on disk at: ${filePath}`);
  }

  // Determine mimeType of the document file based on extension
  const ext = path.extname(filePath).toLowerCase();
  let mimeType = '';
  if (ext === '.pdf') {
    mimeType = 'application/pdf';
  } else if (ext === '.jpg' || ext === '.jpeg') {
    mimeType = 'image/jpeg';
  } else if (ext === '.png') {
    mimeType = 'image/png';
  } else {
    throw new Error(`Security validation failure: Document extension [${ext}] is not supported by AI models. Only PDF, JPEG, JPG, and PNG are allowed.`);
  }

  // Read file and parse content into standard Base64 string
  let base64Data;
  try {
    const fileBuffer = fs.readFileSync(absolutePath);
    base64Data = fileBuffer.toString('base64');
  } catch (readError) {
    throw new Error(`File system read error: Failed to prepare document stream. Details: ${readError.message}`);
  }

  // Define structured police record parsing system prompt
  const systemPrompt = `You are a forensic legal analyst and MERN AI summarization engine for the Bihar Police Record Room. 
Analyze the provided document and produce a highly detailed, professional, and structured summary.
Ensure the output is well-structured using clean HTML formatting suitable for immediate display in a React frontend. Use elements like <h3> for headers, <p> for paragraphs, <ul> and <li> for bullet lists, and <strong> for emphasis. Do NOT wrap it in markdown code blocks like \`\`\`html.
Your summary MUST contain the following sections:
1. 🏢 **Case Identification**: (Extract Case Number, FIR Number, Police Station, District, Year, and Document Type if visible).
2. 👤 **Key Parties**: (List Accused, Victims, Complainants, Investigating Officers, Witnesses, etc.).
3. 📝 **Factual Summary**: (A concise narrative of what happened according to the document).
4. ⚖️ **Accusations & Charges**: (List the sections of Indian Penal Code (IPC) / BNS or specific offenses mentioned).
5. 📅 **Key Dates & Locations**: (Highlight critical dates of occurrence, reporting, and physical locations).

If certain information is not present in the document, explicitly note it as "Not specified in document".
${customPrompt ? `Additional User Instructions: ${customPrompt}` : ''}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [
          { text: systemPrompt },
          {
            inlineData: {
              mimeType,
              data: base64Data
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.15,
      maxOutputTokens: 2048
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Gateway Status ${response.status} - Details: ${errorText}`);
    }

    const responseData = await response.json();
    
    // Validate response payload integrity
    const candidates = responseData.candidates;
    if (!candidates || candidates.length === 0 || !candidates[0].content || !candidates[0].content.parts || candidates[0].content.parts.length === 0) {
      throw new Error('Malformed or empty payload returned from Google AI Gateway.');
    }

    let summaryText = candidates[0].content.parts[0].text;

    // Post-processing cleanup to ensure clean HTML is returned
    summaryText = summaryText
      .replace(/^```html\s*/i, '')
      .replace(/```$/s, '')
      .trim();

    return summaryText;

  } catch (apiError) {
    console.error('[GEMINI API INTEGRATION ERROR]:', apiError);
    throw new Error(`Google Gemini API communication error: ${apiError.message}`);
  }
};

module.exports = {
  generateDocumentSummary
};
