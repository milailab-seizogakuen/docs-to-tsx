import React, { useState, useEffect, useRef } from 'react';
import { Copy, Code, Eye, FileText, RefreshCw, Check, ArrowRight, Zap, Download } from 'lucide-react';
import { convertHtmlToTsx } from './utils/convertHtmlToTsx';

function App() {
  const [inputHtml, setInputHtml] = useState('');
  const [generatedJsx, setGeneratedJsx] = useState('');
  const [generatedHtml, setGeneratedHtml] = useState('');
  const [activeTab, setActiveTab] = useState('preview');
  const [copied, setCopied] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const inputRef = useRef(null);

  const handlePaste = (e) => {
    // For plain text, format it as paragraphs
    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');

    if (!html && text) {
      // Only handle plain text specially
      e.preventDefault();
      const formattedHtml = text.split(/\n\s*\n/).map(para => `<p>${para.trim()}</p>`).join('');

      if (document.queryCommandSupported('insertHTML')) {
        document.execCommand('insertHTML', false, formattedHtml);
      } else {
        if (inputRef.current) {
          inputRef.current.innerHTML = formattedHtml;
        }
      }
    }
    // For HTML (rich text), allow browser default behavior
    // No auto-conversion - user must click Convert button
  };


  const handleManualConvert = async () => {
    if (inputRef.current) {
      setIsConverting(true);
      try {
        const html = inputRef.current.innerHTML;
        setInputHtml(html);
        const { jsx, html: previewHtml } = await convertHtmlToTsx(html);
        setGeneratedJsx(jsx);
        setGeneratedHtml(previewHtml);
      } catch (error) {
        console.error('Conversion error:', error);
        alert('変換中にエラーが発生しました。コンソールを確認してください。');
      } finally {
        setIsConverting(false);
      }
    }
  };

  const handleRefresh = () => {
    setInputHtml('');
    setGeneratedJsx('');
    setGeneratedHtml('');
    setCopied(false);
    if (inputRef.current) {
      inputRef.current.innerHTML = '';
    }
  };

  const getFullCode = () => {
    return `import React from 'react';

export default function GeneratedContent() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6 text-gray-800 bg-white rounded-xl shadow-sm border border-gray-100">
${generatedJsx.split('\n').map(line => '      ' + line).join('\n')}
    </div>
  );
}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getFullCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const code = getFullCode();
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'GeneratedContent.tsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Google Docs to TSX</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleManualConvert}
              disabled={isConverting}
              className={`flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium ${isConverting ? 'opacity-75 cursor-wait' : ''}`}
            >
              {isConverting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              <span>{isConverting ? 'Converting & Uploading...' : 'Convert'}</span>
            </button>
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="Reset"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-8">

          {/* Left Column: Input */}
          <div className="flex flex-col">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-semibold text-gray-700 flex items-center">
                <span className="w-2 h-6 bg-blue-600 rounded-full mr-3"></span>
                Input
              </h2>
              <span className="text-xs text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded shadow-sm">Paste (Ctrl+V)</span>
            </div>

            <div className="h-[600px] bg-gray-200/50 rounded-xl border border-gray-200 p-4 overflow-y-auto flex justify-center items-start relative">
              {/* Placeholder */}
              {!inputHtml && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 pointer-events-none select-none pt-32 z-10">
                  <FileText className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg font-medium">Paste from Google Docs</p>
                  <p className="text-sm">Ctrl + V / Cmd + V</p>
                </div>
              )}

              <div
                ref={inputRef}
                className="bg-white shadow-lg w-full max-w-[210mm] min-h-[297mm] p-[20mm] outline-none text-gray-800 transition-all focus:ring-2 focus:ring-blue-500/20 relative z-0"
                contentEditable
                onPaste={handlePaste}
                suppressContentEditableWarning
                style={{
                  fontFamily: '"Times New Roman", Times, serif',
                  lineHeight: '1.5'
                }}
              />
            </div>
          </div>

          {/* Right Column: Output */}
          <div className="flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px]">
            <div className="p-2 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div className="flex space-x-1 bg-gray-200/50 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`flex items-center space-x-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'preview'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                    }`}
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview</span>
                </button>
                <button
                  onClick={() => setActiveTab('code')}
                  className={`flex items-center space-x-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'code'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                    }`}
                >
                  <Code className="w-4 h-4" />
                  <span>Code</span>
                </button>
              </div>

              {generatedJsx && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopy}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${copied
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow'
                      }`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-600 text-white hover:bg-gray-700 shadow-sm hover:shadow transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-50/50 relative">
              {!generatedJsx ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <ArrowRight className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg font-medium">Waiting for input...</p>
                </div>
              ) : (
                <>
                  {activeTab === 'preview' ? (
                    <div className="p-8">
                      <div className="max-w-3xl mx-auto p-6 space-y-6 text-gray-800 bg-white rounded-xl shadow-sm border border-gray-100" dangerouslySetInnerHTML={{ __html: generatedHtml }} />
                    </div>
                  ) : (
                    <div className="p-6">
                      <pre className="font-mono text-sm text-gray-800 bg-gray-900 text-gray-100 p-6 rounded-xl overflow-x-auto">
                        <code>{`import React from 'react';

export default function GeneratedContent() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6 text-gray-800 bg-white rounded-xl shadow-sm border border-gray-100">
${generatedJsx.split('\n').map(line => '      ' + line).join('\n')}
    </div>
  );
}`}</code>
                      </pre>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;
