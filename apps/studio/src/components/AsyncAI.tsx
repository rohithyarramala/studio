import React, { useEffect, useState, useRef } from 'react';
import { useFilesState, useDocumentsState } from '@/state';
import { VscArrowRight, VscPin, VscCopy, VscWarning } from 'react-icons/vsc';

interface NavigationProps {
  className?: string;
}

export const AsyncAI: React.FunctionComponent<NavigationProps> = ({
  className = '',
}) => {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    [
      {
        role: 'assistant',
        content:
          'Greetings! How may I assist you with your AsyncAPI document today? 📄✨',
      },
    ]
  );
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const rawSpec = useFilesState((state) => state.files['asyncapi']?.content);

  //   console.log('Raw Spec:', rawSpec);
  const document = useDocumentsState(
    (state) => state.documents['asyncapi']?.document
  );
  // console.log('Document:', document);
  const isDocumentValid = rawSpec && document;

  // Simple YAML detection: check for lines with key-value pairs or indentation
  const isYamlContent = (content: string): boolean => {
    const lines = content.split('\n');
    return lines.some(
      (line) =>
        line.trim().startsWith('-') ||
        line.trim().startsWith('#') ||
        line.match(/^\s*[a-zA-Z0-9_-]+:\s*/) ||
        line.match(/^\s{2,}/)
    );
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage], rawSpec }),
      });
      console.log('Response:', rawSpec);
      const data = await response.json();

      const aiMessage = { role: 'assistant', content: data.reply };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error communicating with AI assistant:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'An error occurred. Please try again later. 😔',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyContent = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div
      className={`flex h-full flex-col bg-gray-900 text-gray-100 ${className}`}
      id='ai-assistant-panel'
    >
      {/* Header */}
      <div className='p-4 border-b border-gray-800'>
        <h1 className='text-xl font-semibold'>AsyncAI Assistant</h1>
        <div className='flex items-center text-sm text-gray-400 mt-1'>
          <VscPin className='mr-1' />
          <span>Referencing your AsyncAPI document</span>
        </div>
        {!isDocumentValid && (
          <div className='flex items-center text-sm text-yellow-400 mt-2'>
            <VscWarning className='mr-1' />
            <span>
              Document contains errors but you can still interact with the
              assistant.
            </span>
          </div>
        )}
      </div>

      {/* Chat Section */}
      <div className='flex-1 flex flex-col p-4 overflow-y-auto'>
        <div className='flex-1 flex flex-col-reverse rounded-lg bg-gray-800 p-4 shadow-inner overflow-y-auto'>
          {isLoading && (
            <div className='mb-4 flex justify-start'>
              <div className='max-w-[80%] rounded-lg bg-gray-700 p-3 text-gray-100 shadow-md'>
                <p className='text-sm animate-pulse'>Typing...</p>
              </div>
            </div>
          )}
          {messages
            .slice()
            .reverse()
            .map((message, index) => (
              <div
                key={`message-${index}`}
                className={`mb-4 flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 shadow-md ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-100'
                  }`}
                >
                  {isYamlContent(message.content) ? (
                    <div>
                      <div className='flex justify-between items-center mb-2'>
                        <span className='text-xs text-gray-400'>
                          YAML Content
                        </span>
                        <button
                          onClick={() =>
                            handleCopyContent(message.content, index)
                          }
                          className='flex items-center text-xs text-gray-400 hover:text-gray-200'
                          title='Copy YAML'
                        >
                          <VscCopy className='mr-1' />
                          {copiedIndex === index ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <pre
                        className='text-sm text-gray-100 whitespace-pre-wrap overflow-x-auto'
                        style={{ fontFamily: 'monospace', maxHeight: '200px' }}
                      >
                        {message.content}
                      </pre>
                    </div>
                  ) : (
                    <p className='text-sm leading-relaxed break-words'>
                      {message.content}
                    </p>
                  )}
                </div>
              </div>
            ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className='flex items-center space-x-3 my-4'>
          <input
            type='text'
            className='flex-1 rounded-lg border border-gray-700 bg-gray-800 p-3 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
            placeholder='Ask about your AsyncAPI document... 🗨️'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
          />
          <button
            className='rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50'
            onClick={handleSendMessage}
            disabled={isLoading}
          >
            <VscArrowRight className='h-5 w-5' />
          </button>
        </div>
      </div>
    </div>
  );
};
