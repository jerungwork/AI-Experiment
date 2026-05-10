import { GoogleGenAI, Type } from "@google/genai";
import { LMLAMetadata, IsotopicBreak, LMLAVariables } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const VARIABLE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    value: { type: Type.STRING },
    metaphor: { type: Type.STRING, description: "Optional metaphor for this specific variable" },
    crossTopic: { type: Type.STRING, description: "Optional cross-topic reference for this specific variable" },
  },
  required: ["value"],
};

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    isotopicBreaks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          sentence: { type: Type.STRING },
          x: { type: Type.NUMBER, description: "Sequence index" },
          y: { type: Type.NUMBER, description: "Thematic layer (0-5)" },
          z: { type: Type.NUMBER, description: "Hierarchy depth (0-5)" },
          w: { type: Type.NUMBER, description: "Granularity/Importance (0.0-1.0)" },
          variables: {
            type: Type.OBJECT,
            properties: {
              subject: VARIABLE_SCHEMA,
              action: VARIABLE_SCHEMA,
              object: VARIABLE_SCHEMA,
              result: VARIABLE_SCHEMA,
              preCondition: VARIABLE_SCHEMA,
              situation: VARIABLE_SCHEMA,
            },
            required: ["subject", "action", "object", "result", "preCondition", "situation"],
          },
        },
        required: ["sentence", "x", "y", "z", "w", "variables"],
      },
    },
  },
  required: ["isotopicBreaks"],
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      // Check for rate limit error (429)
      if (error?.status === 429 || error?.message?.includes('429')) {
        const waitTime = Math.pow(2, i) * 1000 + Math.random() * 1000;
        console.warn(`Rate limit hit. Retrying in ${waitTime}ms...`);
        await delay(waitTime);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export const lmlaService = {
  /**
   * Step 1: Breakdown input text into LMLA structure.
   */
  async analyzeInput(text: string): Promise<LMLAMetadata> {
    return withRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Perform LMLA (Linguistic Multi-head Latent Attention) Analysis on the following text.
        1. Break the text into Isotopic Breaks (sentences or distinct conceptual units).
        2. For each break, assign WXYZ coordinates based on these strict rules:
           - IF ONLY 1 SENTENCE EXISTS: Set X=0, Y=0, Z=0, W=0.
           - X (Horizontal Sequence): The sequence index of the sentence (1, 2, 3...).
           - Y (Vertical Topology): The paragraph or thematic block index (1, 2, 3...).
           - Z (Structure-Hierarchy): The depth of information in a logical outline (e.g., 1 for Top-level, 2 for Sub-topic, 3 for Detail).
           - W (Granularity/Importance): Relative importance to the overall picture (0.0 to 1.0).
        3. For each sentence, extract the 6 variables simultaneously:
           [1] Subject, [2] Action, [3] Object, [4] Result, [5] Pre-condition, [6] Situation.
        4. MATH EXCEPTION: If the input is a pure math question (e.g. "2+2"):
           - Subject: "[the equation] (math)" (e.g. "2+2 (math)")
           - Action: "calculate math"
           - Object/Result/Pre-condition/Situation: "null"
        5. PHATIC EXCEPTION: If the input is a greeting or pure phatic expression (e.g. "Hello", "Hi"):
           - Subject: "[the greeting] (phatic)" (e.g. "Hello (phatic)")
           - Action: "greeting"
           - Object/Result/Pre-condition/Situation: "null"
        6. ONLY if absolutely necessary to decode conceptual/abstract imagery, add one Metaphor and one Cross-Topic label per variable.
           - For nonsensical words (e.g. "afafa"), use Metaphor to flag it as "not a real word/undefined".
           - For simple greetings or math, do NOT use metaphors.
        
        Text: "${text}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: ANALYSIS_SCHEMA as any,
        },
      });

      return JSON.parse(response.text || "{}");
    });
  },

  /**
   * Step 2: Generate Answer Blueprint using Gemini Pro.
   */
  async generateBlueprint(analyzedInput: LMLAMetadata): Promise<LMLAMetadata> {
    return withRetry(async () => {
      const inputStr = JSON.stringify(analyzedInput);
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `You are the LMLA Reasoner. Based on this structured input blueprint, generate a RESPONSE BLUEPRINT.
        Always answer what is asked only. Don't explain unnecessary topics.
        
        SUGGESTIONS RULE:
        - Provide UP TO 3 suggestions ONLY if there is clear conceptual space for further inquiry.
        - For simple greetings ("Hello", "Hi"), direct math ("2+2"), or nonsensical input ("afafa"), provide ZERO suggestions.
        
        MATH RULE:
        - If Input Subject contains "(math)", the response blueprint should contain the calculation steps.
        - Each step should be in its own isotopic break if complex, or just the final answer if simple (e.g. 2+2 = 4).
        - For simple math, just 1 line (e.g. "4").
        
        PHATIC RULE:
        - If Input Subject contains "(phatic)", provide a short, polite, and mannered response.
        - Do not provide suggestions for phatic inputs.
        
        Use the same LMLA structure for your response.
        
        Note: The response blueprint IS the "Linguistic Truth". Do NOT add metaphors or cross-topics to the output variables, as the blueprint state is already decoded.
        
        Input Blueprint: ${inputStr}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: ANALYSIS_SCHEMA as any,
        },
      });

      return JSON.parse(response.text || "{}");
    });
  },

  /**
   * Step 3: Apply "Linguistic Skin" (Creative synthesis) using Gemini Flash.
   */
  async synthesizeResponse(blueprint: LMLAMetadata): Promise<string> {
    return withRetry(async () => {
      const blueprintStr = JSON.stringify(blueprint);
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are the Linguistic Synthesizer. Convert this LMLA Response Blueprint into natural, elegant human language ("Linguistic Skin").
        
        Rules:
        1. Preserve the underlying truth of the blueprint.
        2. MATH EXCEPTION: If the blueprint contains math results or steps (subject contains "(math)"), output them purely and concisely. For simple math like "2+2", output exactly only the result (e.g. "4").
        3. PHATIC EXCEPTION: If the blueprint is phatic (subject contains "(phatic)"), output a short, polite, mannered greeting.
        4. Generate the main response sentences. Put a line-break after each sentence.
        5. After the main response is complete, add an empty line.
        4. ONLY IF suggestions are provided in the blueprint, add the exact phrase: "Next, would you like to explore :" followed by an empty line.
        5. Provide the suggestions exactly as listed in the blueprint (max 3).
        6. Each suggestion MUST be followed by an empty line (Start New Line after the text, then another Start New Line).
        7. Suggestions must use this exact format:
           [1] Suggestion text
           
           [2] Suggestion text
           
           [3] Suggestion text
        8. Answer exactly what is asked only.
        
        Blueprint: ${blueprintStr}`,
      });

      return response.text || "";
    });
  }
};
