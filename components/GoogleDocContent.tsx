interface GoogleDocContentProps {
  html: string;
  className?: string;
}

export default function GoogleDocContent({ html, className = '' }: GoogleDocContentProps) {
  return (
    <div
      className={`google-doc-content max-w-3xl text-gray-300 leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{
        __html: html,
      }}
      style={{
        '--google-doc-heading-color': '#F46325',
      } as React.CSSProperties}
    />
  );
}

const styles = `
  .google-doc-content h1,
  .google-doc-content h2,
  .google-doc-content h3,
  .google-doc-content h4,
  .google-doc-content h5,
  .google-doc-content h6 {
    color: #F46325;
    font-weight: bold;
    margin-top: 1.5rem;
    margin-bottom: 1rem;
    line-height: 1.4;
  }

  .google-doc-content h1 { font-size: 2rem; }
  .google-doc-content h2 { font-size: 1.5rem; }
  .google-doc-content h3 { font-size: 1.25rem; }
  .google-doc-content h4 { font-size: 1.1rem; }

  .google-doc-content span[style*="font-size"] {
    font-size: inherit !important;
  }

  .google-doc-content p {
    margin-bottom: 1rem;
    color: #d1d5db;
  }

  .google-doc-content strong {
    font-weight: bold;
    color: #ffffff;
  }

  .google-doc-content em {
    font-style: italic;
  }

  .google-doc-content ul,
  .google-doc-content ol {
    margin-left: 1.5rem;
    margin-bottom: 1rem;
  }

  .google-doc-content li {
    margin-bottom: 0.5rem;
    color: #d1d5db;
  }

  .google-doc-content a {
    color: #F46325;
    text-decoration: underline;
    transition: opacity 0.2s;
  }

  .google-doc-content a:hover {
    opacity: 0.8;
  }

  .google-doc-content table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5rem 0;
    border: 1px solid #374151;
  }

  .google-doc-content th {
    background-color: #1f2937;
    color: #F46325;
    padding: 0.75rem;
    text-align: left;
    border: 1px solid #374151;
    font-weight: bold;
  }

  .google-doc-content td {
    padding: 0.75rem;
    border: 1px solid #374151;
    color: #d1d5db;
  }

  .google-doc-content blockquote {
    border-left: 4px solid #F46325;
    padding-left: 1rem;
    margin-left: 0;
    margin-bottom: 1rem;
    color: #9ca3af;
    font-style: italic;
  }

  .google-doc-content code {
    background-color: #1f2937;
    color: #F46325;
    padding: 0.2rem 0.4rem;
    border-radius: 0.25rem;
    font-family: 'Courier New', monospace;
  }

  .google-doc-content pre {
    background-color: #1f2937;
    color: #d1d5db;
    padding: 1rem;
    border-radius: 0.5rem;
    overflow-x: auto;
    margin-bottom: 1rem;
    border: 1px solid #374151;
  }

  .google-doc-content pre code {
    background-color: transparent;
    padding: 0;
    color: #d1d5db;
  }

  .google-doc-content img {
    max-width: 100%;
    height: auto;
    border-radius: 0.5rem;
    margin: 1.5rem 0;
  }
`;

// Inject styles into document head
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = styles;
  document.head.appendChild(style);
}
