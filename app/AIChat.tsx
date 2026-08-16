'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './page.module.css';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

interface AIChatProps {
  stats?: any;
}

export default function AIChat({ stats }: AIChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'مرحباً! أنا **مساعد داعم الذكي**. كيف يمكنني مساعدتك اليوم؟' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const query = input;
    setInput('');
    await sendMessage(query);
  };

  const sendMessage = async (queryText: string) => {
    const userMessage: Message = { role: 'user', content: queryText };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, userMessage],
          stats: stats 
        }),
      });

      const data = await response.json();
      if (data.error) {
        let errorMsg = 'عذراً، يبدو أن هناك مشكلة في الاتصال بالمساعد الذكي. تأكد من إعداد مفتاح API الخاص بـ Gemini.';
        if (data.error === 'rate_limit') {
          errorMsg = '⚠️ تم تجاوز حد الاستفسارات المسموح به مؤقتاً (Rate Limit). يرجى الانتظار لمدة دقيقة ثم المحاولة مرة أخرى.';
        } else if (data.message) {
          errorMsg = `عذراً، حدث خطأ: ${data.message}`;
        }
        setMessages((prev) => [...prev, { role: 'assistant', content: errorMsg }]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.content }]);
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'حدث خطأ ما، يرجى المحاولة مرة أخرى.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShortcutClick = async (queryText: string) => {
    if (isLoading) return;
    await sendMessage(queryText);
  };

  const shortcuts = [
    { label: '📊 إحصائيات اليوم', query: 'أعطني إحصائيات اليوم بالتفصيل' },
    { label: '🔍 آخر بلاغ', query: 'ما هو تفاصيل آخر بلاغ تم استقباله ومن مستقبله؟' },
    { label: '⚖️ الموزع القادم', query: 'من هو الموظف الذي عليه الدور لاستقبال البلاغ القادم؟' },
    { label: '❓ البلاغات المفتوحة', query: 'كم عدد البلاغات المفتوحة (التي لم تُحل)؟' }
  ];

  // Helper for parsing bold text inside segments
  const parseBold = (text: string): React.ReactNode[] => {
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      parts.push(<strong key={match.index} style={{ fontWeight: '800', color: '#ffffff' }}>{match[1]}</strong>);
      lastIndex = boldRegex.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    return parts;
  };

  // Helper function to format responses with bold, links, WhatsApp buttons, and list items
  const formatMessage = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let currentList: React.ReactNode[] = [];

    const flushList = (key: string | number) => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${key}`} style={{ paddingRight: '1.25rem', marginBlock: '6px', listStyleType: 'disc', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {currentList}
          </ul>
        );
        currentList = [];
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ');
      const textToProcess = isBullet ? trimmed.replace(/^[-*•]\s+/, '') : line;

      const nodes: React.ReactNode[] = [];
      let lastIdx = 0;

      // Match markdown links: [label](url)
      const linkRegex = /\[(.*?)\]\((https?:\/\/.*?)\)/g;
      let linkMatch;

      while ((linkMatch = linkRegex.exec(textToProcess)) !== null) {
        const textBefore = textToProcess.substring(lastIdx, linkMatch.index);
        if (textBefore) {
          nodes.push(...parseBold(textBefore));
        }

        const label = linkMatch[1];
        const url = linkMatch[2];

        // Check if it is a WhatsApp link
        if (url.includes('wa.me')) {
          nodes.push(
            <a
              key={`wa-${linkMatch.index}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#25D366',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '0.82rem',
                fontWeight: 'bold',
                margin: '4px 2px',
                boxShadow: '0 2px 6px rgba(37, 211, 102, 0.25)',
                transition: 'all 0.2s',
                fontFamily: 'Cairo, sans-serif'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .004 5.412.001 12.04c0 2.123.542 4.19 1.594 6.02l-1.595 5.821 5.956-1.562a11.754 11.754 0 005.441 1.341h.005c6.635 0 12.044-5.414 12.048-12.044 0-3.212-1.251-6.232-3.524-8.504"/>
              </svg>
              <span>{label}</span>
            </a>
          );
        } else {
          // Standard Link
          nodes.push(
            <a
              key={`link-${linkMatch.index}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#3b82f6', textDecoration: 'underline' }}
            >
              {label}
            </a>
          );
        }
        lastIdx = linkRegex.lastIndex;
      }

      if (lastIdx < textToProcess.length) {
        nodes.push(...parseBold(textToProcess.substring(lastIdx)));
      }

      const contentNode = nodes.length > 0 ? nodes : textToProcess;

      if (isBullet) {
        currentList.push(
          <li key={`li-${idx}`} style={{ marginBlock: '2px', color: 'inherit' }}>
            {contentNode}
          </li>
        );
      } else {
        flushList(idx);
        elements.push(
          <p key={idx} style={{ marginBlock: '4px', minHeight: '1.1em', lineHeight: '1.5', color: 'inherit' }}>
            {contentNode}
          </p>
        );
      }
    });

    flushList('end');
    return elements;
  };

  return (
    <div className={styles.aiChatWrapper}>
      {/* Chat Toggle Button */}
      <button 
        className={`${styles.chatToggleButton} ${isOpen ? styles.chatOpen : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
        title="مساعد داعم الذكي"
      >
        {isOpen ? (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        ) : (
          <span style={{fontSize: '2rem'}}>🤖</span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={styles.chatWindow}>
          <div className={styles.chatHeader}>
            <div className={styles.chatHeaderInfo}>
              <span className={styles.aiAvatar}>🤖</span>
              <div>
                <h3 className={styles.chatTitle}>مساعد داعم الذكي</h3>
                <span className={styles.chatStatus}>متصل الآن</span>
              </div>
            </div>
          </div>

          <div className={styles.chatMessages}>
            {messages.map((m, i) => (
              <div key={i} className={`${styles.messageWrapper} ${m.role === 'user' ? styles.userWrapper : styles.assistantWrapper}`}>
                <div className={`${styles.messageBubble} ${m.role === 'user' ? styles.userBubble : styles.assistantBubble}`}>
                  {formatMessage(m.content)}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className={styles.assistantWrapper}>
                <div className={`${styles.messageBubble} ${styles.assistantBubble}`}>
                  <span className={styles.typingDots}>...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions Shortcuts */}
          <div className={styles.chatShortcuts} style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            padding: '8px 12px',
            background: 'var(--card-bg)',
            borderTop: '1px solid var(--border)'
          }}>
            {shortcuts.map((shortcut, sIdx) => (
              <button
                key={sIdx}
                type="button"
                disabled={isLoading}
                onClick={() => handleShortcutClick(shortcut.query)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '15px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                  fontSize: '0.68rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                  opacity: isLoading ? 0.6 : 1
                }}
                onMouseOver={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = 'var(--primary)';
                    e.currentTarget.style.color = 'white';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = 'var(--foreground)';
                  }
                }}
              >
                {shortcut.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className={styles.chatInputArea}>
            <input 
              type="text" 
              className={styles.chatInput} 
              placeholder="اكتب سؤالك هنا..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button type="submit" className={styles.chatSendBtn} disabled={isLoading}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
