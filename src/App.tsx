import React, { useState, useEffect } from 'react';
import { ChatPanel } from './components/ChatPanel';
import { MetadataPanel } from './components/MetadataPanel';
import { ChatMessage } from './types';
import { lmlaService } from './lmlaService';

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [processingCount, setProcessingCount] = useState(0);
  const isProcessing = processingCount > 0;
  const [inputValue, setInputValue] = useState('');
  const [lastInput, setLastInput] = useState('');
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [retryTimer, setRetryTimer] = useState(0);
  const activeRequestIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (retryTimer > 0) {
      interval = setInterval(() => {
        setRetryTimer((prev) => Math.max(0, prev - 1));
      }, 1000);
    } else if (retryTimer === 0 && rateLimitError) {
      setRateLimitError(null);
    }
    return () => clearInterval(interval);
  }, [retryTimer, rateLimitError]);

  const handleSendMessage = async (text: string) => {
    if (rateLimitError) return;

    const requestId = crypto.randomUUID();
    activeRequestIdRef.current = requestId;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      status: 'processing',
    };

    setLastInput(text);
    setInputValue('');
    setMessages((prev) => [...prev, userMsg]);
    setProcessingCount(prev => prev + 1);
    setSelectedMessageId(userMsg.id);

    try {
      // Step 1: Analyze Input (LMLA + Isotopic)
      const inputMetadata = await lmlaService.analyzeInput(text);
      
      if (activeRequestIdRef.current !== requestId) {
        setMessages((prev) => 
          prev.map((m) => m.id === userMsg.id ? { ...m, metadata: inputMetadata, status: 'error' } : m)
        );
        return;
      }

      setMessages((prev) => 
        prev.map((m) => m.id === userMsg.id ? { ...m, metadata: inputMetadata, status: 'done' } : m)
      );

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        status: 'processing',
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setSelectedMessageId(assistantMsg.id);

      // Step 2: Generate Blueprint (LMLA Reasoner)
      const blueprint = await lmlaService.generateBlueprint(inputMetadata);
      
      if (activeRequestIdRef.current !== requestId) {
        setMessages((prev) => 
          prev.map((m) => m.id === assistantMsg.id ? { ...m, blueprint, status: 'error' } : m)
        );
        return;
      }

      setMessages((prev) => 
        prev.map((m) => m.id === assistantMsg.id ? { ...m, blueprint } : m)
      );

      // Step 3: Synthesis (Linguistic Skin)
      const synthesis = await lmlaService.synthesizeResponse(blueprint);
      
      if (activeRequestIdRef.current !== requestId) return;

      setMessages((prev) => 
        prev.map((m) => m.id === assistantMsg.id ? { ...m, content: synthesis, status: 'done' } : m)
      );

    } catch (error: any) {
      if (activeRequestIdRef.current !== requestId) return;

      console.error('LMLA Process Error:', error);
      
      if (error?.status === 429 || error?.message?.includes('429')) {
        setRateLimitError("Rate limit exceeded. Please wait before sending more requests.");
        setRetryTimer(60); // Suggest 60 seconds
      }

      // Reappear text on input box on fail
      setInputValue(text);
      setMessages((prev) => 
        prev.map((m) => (m.status === 'processing' ? { ...m, status: 'error' } : m))
      );
    } finally {
      if (activeRequestIdRef.current === requestId) {
        activeRequestIdRef.current = null;
      }
      setProcessingCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleStop = () => {
    activeRequestIdRef.current = null;
    setProcessingCount(0);
    // Reappear text on input box on stop
    setInputValue(lastInput);
    setMessages((prev) => 
      prev.map(m => m.status === 'processing' ? { ...m, status: 'error' } : m)
    );
  };

  const selectedMessageIndex = messages.findIndex(m => m.id === selectedMessageId);
  const selectedMessage = messages[selectedMessageIndex];
  
  let displayMetadata = null;
  let displayBlueprint = null;

  if (selectedMessage) {
    if (selectedMessage.role === 'user') {
      displayMetadata = selectedMessage.metadata || null;
      // Look ahead for the assistant's blueprint
      const nextMsg = messages[selectedMessageIndex + 1];
      if (nextMsg && nextMsg.role === 'assistant') {
        displayBlueprint = nextMsg.blueprint || null;
      }
    } else {
      displayBlueprint = selectedMessage.blueprint || null;
      // Look back for the user's metadata
      const prevMsg = messages[selectedMessageIndex - 1];
      if (prevMsg && prevMsg.role === 'user') {
        displayMetadata = prevMsg.metadata || null;
      }
    }
  }

  return (
    <div className="flex h-screen w-screen bg-bg text-ink selection:bg-accent/10">
      <div className="w-[60%] h-full flex flex-col bg-surface overflow-hidden">
        <ChatPanel 
          messages={messages}
          onSendMessage={handleSendMessage}
          onStop={handleStop}
          isProcessing={isProcessing}
          selectedMessageId={selectedMessageId}
          onSelectMessage={setSelectedMessageId}
          inputValue={inputValue}
          onInputChange={setInputValue}
          rateLimitError={rateLimitError}
          retryTimer={retryTimer}
        />
      </div>
      <div className="w-[40%] h-full bg-slate-50/50 border-l border-line relative z-10 flex flex-col overflow-hidden">
        <MetadataPanel 
          metadata={displayMetadata}
          blueprint={displayBlueprint}
          role={selectedMessage?.role || 'user'}
        />
      </div>
    </div>
  );
}
