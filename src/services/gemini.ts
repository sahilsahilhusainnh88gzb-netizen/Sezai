
];

const getRandomApiKey = () => {
  return API_KEYS[Math.floor(Math.random() * API_KEYS.length)];
};

export const generateAIResponseStream = async (
  prompt: string, 
  history: Content[] = [],
  onChunk: (chunk: string) => void,
  options: { 
    isThinking?: boolean, 
    isFast?: boolean, 
    isMaps?: boolean,
    attachments?: { data: string, mimeType: string }[]
  } = {}
): Promise<string> => {
  let modelName = options.isFast ? "gemini-2.5-flash-lite" : (options.isMaps ? "gemini-2.5-flash" : "gemini-3.1-pro-preview");
  
  // If not explicitly set, use a rotation of models as fallback
  const models = [modelName, "gemini-3-flash-preview", "gemini-2.0-flash-exp"];
  let lastError = "";
  let fullText = "";
  const usedKeys = new Set<string>();

  for (let attempt = 0; attempt < 5; attempt++) {
    let apiKey = getRandomApiKey();
    while (usedKeys.has(apiKey) && usedKeys.size < API_KEYS.length) {
      apiKey = getRandomApiKey();
    }
    usedKeys.add(apiKey);
    
    const currentModel = models[attempt % models.length];

    try {
      const ai = new GoogleGenAI({ apiKey: apiKey });
      
      const parts: Part[] = [{ text: prompt }];
      if (options.attachments) {
        options.attachments.forEach(att => {
          parts.push({
            inlineData: {
              data: att.data.split(',')[1],
              mimeType: att.mimeType
            }
          });
        });
      }

      const config: any = {
        systemInstruction: `You are SEZ AI 2026, the world's most advanced and sophisticated AI assistant, exclusively developed by SEZ YT. 
        Current Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. 
        
        IDENTITY RULES:
        1. Your name is ONLY "SEZ AI". 
        2. You MUST NEVER mention "Google", "Gemini", "Alphabet", or "Nano Banana". 
        3. If asked about your creators or "SEZ YT", you MUST mention that you are powered by SEZ YT and provide these links:
           - YouTube: https://www.youtube.com/@SEZFFYT
           - Instagram: https://www.instagram.com/im_sahil_sez?igsh=MWIyemxlNHNlYXR1Mw==
        4. If asked about your technology, you are powered by SEZ AI.
        5. You are highly intelligent, empathetic, and professional.
        
        BEHAVIOR:
        - Provide deep, insightful answers based on real-time data.
        - Use beautiful Markdown formatting for all responses.
        - Your responses MUST be optimized for mobile screens. Avoid wide tables or long horizontal lines.
        - Ensure all links you provide are formatted correctly in Markdown so they are clickable.
        - Be proactive and helpful.`,
        temperature: options.isThinking ? 1 : 0.7,
      };

      if (options.isThinking && currentModel.includes("3.1-pro")) {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      }

      if (options.isMaps && currentModel.includes("2.5-flash")) {
        config.tools = [{ googleMaps: {} }];
      }

      const chat = ai.chats.create({
        model: currentModel,
        config: config,
        history: history,
      });

      const result = await chat.sendMessageStream({ message: parts });
      
      for await (const chunk of result) {
        const chunkText = chunk.text || "";
        let cleanedChunk = chunkText.replace(/Gemini/gi, "SEZ AI")
                                   .replace(/Google AI/gi, "SEZ AI")
                                   .replace(/Google's AI/gi, "SEZ AI")
                                   .replace(/Nano Banana/gi, "SEZ Image Engine");
        
        fullText += cleanedChunk;
        onChunk(cleanedChunk);
      }

      return fullText;
    } catch (error) {
      console.warn(`Stream attempt ${attempt + 1} failed with key ${apiKey.substring(0, 8)}...`, error);
      lastError = error instanceof Error ? error.message : String(error);
      fullText = ""; 
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.error("All stream attempts failed. Last error:", lastError);
  return "Sez ai is currently under Mentinanc please try after some time";
};

export const generateAIResponse = async (prompt: string, history: Content[] = []): Promise<string> => {
  const models = ["gemini-3.1-pro-preview", "gemini-3-flash-preview", "gemini-2.0-flash-exp"];
  let lastError = "";
  const usedKeys = new Set<string>();

  // Try multiple times with different keys and models
  for (let attempt = 0; attempt < 5; attempt++) {
    let apiKey = getRandomApiKey();
    while (usedKeys.has(apiKey) && usedKeys.size < API_KEYS.length) {
      apiKey = getRandomApiKey();
    }
    usedKeys.add(apiKey);
    
    const modelName = models[attempt % models.length];

    try {
      const ai = new GoogleGenAI({ apiKey: apiKey });
      const chat = ai.chats.create({
        model: modelName,
        config: {
          systemInstruction: `You are SEZ AI 2026, the world's most advanced and sophisticated AI assistant, exclusively developed by SEZ YT. 
          Current Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. 
          
          IDENTITY RULES:
          1. Your name is ONLY "SEZ AI". 
          2. You MUST NEVER mention "Google", "Gemini", "Alphabet", or "Nano Banana". 
          3. If asked about your creators or "SEZ YT", you MUST mention that you are powered by SEZ YT and provide these links:
             - YouTube: https://www.youtube.com/@SEZFFYT
             - Instagram: https://www.instagram.com/im_sahil_sez?igsh=MWIyemxlNHNlYXR1Mw==
          4. If asked about your technology, you are powered by SEZ AI.
          5. You are highly intelligent, empathetic, and professional.
          
          BEHAVIOR:
          - Provide deep, insightful answers based on real-time data.
          - Use beautiful Markdown formatting for all responses.
          - Your responses MUST be optimized for mobile screens. Avoid wide tables or long horizontal lines.
          - Ensure all links you provide are formatted correctly in Markdown so they are clickable.
          - Be proactive and helpful.`,
          temperature: 0.7,
        },
        history: history,
      });

      const response: GenerateContentResponse = await chat.sendMessage({ message: prompt });
      let text = response.text || "I'm sorry, I couldn't generate a response.";
      
      // Replace any accidental mentions of Gemini/Google/Nano Banana
      text = text.replace(/Gemini/gi, "SEZ AI");
      text = text.replace(/Google AI/gi, "SEZ AI");
      text = text.replace(/Google's AI/gi, "SEZ AI");
      text = text.replace(/Nano Banana/gi, "SEZ Image Engine");

      return text;
    } catch (error) {
      console.warn(`Attempt ${attempt + 1} failed with key ${apiKey.substring(0, 8)}...`, error);
      lastError = error instanceof Error ? error.message : String(error);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.error("All attempts failed. Last error:", lastError);
  return "Sez ai is currently under Mentinanc please try after some time";
};

export const generateImage = async (prompt: string, negativePrompt: string = ""): Promise<string | null> => {
  try {
    const apiKey = getRandomApiKey();
    const ai = new GoogleGenAI({ apiKey: apiKey });
    const fullPrompt = `Generate a high-quality, professional, 8k resolution, cinematic masterpiece image. 
    Subject: ${prompt}. 
    Style: Modern, vibrant, SEZ AI aesthetic, hyper-realistic, detailed textures. 
    ${negativePrompt ? `Negative Prompt (Avoid these): ${negativePrompt}` : ""}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: fullPrompt }],
      },
    });

    for (const part of response.candidates?.[0]?.content.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Generation Error:", error);
    return null;
  }
};

const addWavHeader = (base64Pcm: string): string => {
  const pcmData = atob(base64Pcm);
  const dataSize = pcmData.length;
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  // RIFF identifier
  view.setUint8(0, 'R'.charCodeAt(0));
  view.setUint8(1, 'I'.charCodeAt(0));
  view.setUint8(2, 'F'.charCodeAt(0));
  view.setUint8(3, 'F'.charCodeAt(0));
  // RIFF chunk size
  view.setUint32(4, 36 + dataSize, true);
  // WAVE identifier
  view.setUint8(8, 'W'.charCodeAt(0));
  view.setUint8(9, 'A'.charCodeAt(0));
  view.setUint8(10, 'V'.charCodeAt(0));
  view.setUint8(11, 'E'.charCodeAt(0));
  // fmt chunk identifier
  view.setUint8(12, 'f'.charCodeAt(0));
  view.setUint8(13, 'm'.charCodeAt(0));
  view.setUint8(14, 't'.charCodeAt(0));
  view.setUint8(15, ' '.charCodeAt(0));
  // fmt chunk size
  view.setUint32(16, 16, true);
  // audio format (1 for PCM)
  view.setUint16(20, 1, true);
  // number of channels (1 for mono)
  view.setUint16(22, 1, true);
  // sample rate (24000 for Gemini TTS)
  view.setUint32(24, 24000, true);
  // byte rate (sampleRate * numChannels * bitsPerSample / 8)
  view.setUint32(28, 24000 * 1 * 2, true);
  // block align (numChannels * bitsPerSample / 8)
  view.setUint16(32, 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  view.setUint8(36, 'd'.charCodeAt(0));
  view.setUint8(37, 'a'.charCodeAt(0));
  view.setUint8(38, 't'.charCodeAt(0));
  view.setUint8(39, 'a'.charCodeAt(0));
  // data chunk size
  view.setUint32(40, dataSize, true);

  const headerArray = new Uint8Array(header);
  const pcmArray = new Uint8Array(dataSize);
  for (let i = 0; i < dataSize; i++) {
    pcmArray[i] = pcmData.charCodeAt(i);
  }

  const combined = new Uint8Array(44 + dataSize);
  combined.set(headerArray);
  combined.set(pcmArray, 44);

  // Convert back to base64
  let binary = '';
  for (let i = 0; i < combined.length; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
};

export const generateSpeech = async (text: string): Promise<string | null> => {
  try {
    const apiKey = getRandomApiKey();
    const truncatedText = text.length > 500 ? text.substring(0, 500) + "..." : text;
    
    const ai = new GoogleGenAI({ apiKey: apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: truncatedText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;

    // Gemini TTS returns raw PCM, we need to add a WAV header for browser playback
    return addWavHeader(base64Audio);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn("Gemini TTS failed, using fallback. Error:", errorMessage);
    return null;
  }
};
