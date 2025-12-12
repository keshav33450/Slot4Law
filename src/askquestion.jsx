import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import Navbar from './Navbar';
import './askquestion.css';
import Groq from 'groq-sdk';

const AskQuestion = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Add user message
    const userMessage = {
      type: 'user',
      text: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Check if API key exists
      if (!process.env.REACT_APP_GROQ_API_KEY) {
        throw new Error('API key not found. Please add REACT_APP_GROQ_API_KEY to your .env file');
      }

      // Initialize Groq client
      const groq = new Groq({
        apiKey: process.env.REACT_APP_GROQ_API_KEY,
        dangerouslyAllowBrowser: true
      });

      // Call Groq API
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful legal assistant specializing in Indian law. Provide accurate, clear, and professional legal guidance. Keep responses concise but informative. If applicable, mention relevant Indian laws or sections.'
          },
          {
            role: 'user',
            content: inputMessage
          }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 1,
        stream: false
      });

      const botReply = chatCompletion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

      // Add bot response
      const botMessage = {
        type: 'bot',
        text: botReply,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Full Error:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response);
      console.error('Error status:', error.status);
      
      let errorText = 'Sorry, I encountered an error. ';
      
      if (error.message.includes('API key')) {
        errorText += 'Please make sure you have added your Groq API key to the .env file and restarted the server.';
      } else if (error.message.includes('rate limit')) {
        errorText += 'Rate limit exceeded. Please wait a moment and try again.';
      } else {
        errorText += 'Please try again or rephrase your question.';
      }
      
      const errorMessage = {
        type: 'bot',
        text: errorText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="ask-question-page">
      <Navbar />

      <div className="chat-wrapper">
        {/* Decorative Elements */}
        <div className="decorative-scales">
          <svg className="scale-icon scale-top-left" viewBox="0 0 100 100" fill="none" opacity="0.15">
            <path d="M50 20 L30 40 L50 35 L70 40 Z M30 40 L20 80 M70 40 L80 80 M15 80 L25 80 M75 80 L85 80" stroke="currentColor" strokeWidth="3"/>
          </svg>
          <svg className="scale-icon scale-top-right" viewBox="0 0 100 100" fill="none" opacity="0.15">
            <path d="M50 20 L30 40 L50 35 L70 40 Z M30 40 L20 80 M70 40 L80 80 M15 80 L25 80 M75 80 L85 80" stroke="currentColor" strokeWidth="3"/>
          </svg>
          <svg className="scale-icon scale-bottom" viewBox="0 0 100 100" fill="none" opacity="0.15">
            <path d="M50 20 L30 40 L50 35 L70 40 Z M30 40 L20 80 M70 40 L80 80 M15 80 L25 80 M75 80 L85 80" stroke="currentColor" strokeWidth="3"/>
          </svg>
        </div>

        <div className="decorative-dots-chat">
          <span className="dot-chat black-dot"></span>
          <span className="dot-chat gold-dot"></span>
          <span className="dot-chat gold-dot-small"></span>
          <span className="dot-chat black-dot-small"></span>
        </div>

        <div className="decorative-shapes">
          <div className="shape-square"></div>
        </div>

        {/* Main Content */}
        <div className="chat-content-wrapper">
          {/* Header */}
          <div className="chat-header">
            <h1>Ask a Free Question</h1>
            <p>get instant legal guidance from AI</p>
          </div>

          {/* Messages Area */}
          {messages.length > 0 && (
            <div className="messages-container">
              <div className="messages-area">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`message ${message.type === 'user' ? 'user-message' : 'bot-message'}`}
                  >
                    <div className="message-content">
                      <p>{message.text}</p>
                      <span className="message-time">
                        {message.timestamp.toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="message bot-message">
                    <div className="message-content">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="input-area">
            <div className="input-wrapper">
              <input
                type="text"
                placeholder="Type your question here......"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
              />
              <button 
                className="send-button"
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
              >
                <Send size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AskQuestion;
