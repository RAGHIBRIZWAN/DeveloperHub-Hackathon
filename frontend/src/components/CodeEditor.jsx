import { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Play, 
  Send, 
  RotateCcw, 
  Settings,
  Terminal,
  Copy,
  Check,
  Loader2,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { codeAPI } from '../services/api';
import { useSettingsStore } from '../stores/settingsStore';
import toast from 'react-hot-toast';

const LANGUAGE_CONFIG = {
  python: {
    id: 71,
    name: 'Python',
    icon: '🐍',
    defaultCode: `# Write your Python code here
def main():
    print("Hello, World!")

if __name__ == "__main__":
    main()
`,
  },
  cpp: {
    id: 54,
    name: 'C++',
    icon: '⚡',
    defaultCode: `// Write your C++ code here
#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}
`,
  },
  javascript: {
    id: 63,
    name: 'JavaScript',
    icon: '🌐',
    defaultCode: `// Write your JavaScript code here
function main() {
    console.log("Hello, World!");
}

main();
`,
  },
};

const CodeEditor = ({
  initialCode = '',
  language: initialLanguage,
  readOnly = false,
  showLanguageSelector = true,
  showRunButton = true,
  showSubmitButton = false,
  onSubmit,
  onCodeChange,
  height = '400px',
  testCases = [],
}) => {
  const { t } = useTranslation();
  const editorRef = useRef(null);
  const { programmingLanguage, editorFontSize, editorTheme } = useSettingsStore();
  
  const [language, setLanguage] = useState(initialLanguage || programmingLanguage);
  const [code, setCode] = useState(initialCode || LANGUAGE_CONFIG[language]?.defaultCode || '');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('output'); // output, input

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const handleCodeChange = (value) => {
    setCode(value || '');
    onCodeChange?.(value || '');
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    if (!initialCode) {
      setCode(LANGUAGE_CONFIG[newLang]?.defaultCode || '');
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    setOutput('Running...');
    setActiveTab('output');
    
    try {
      const response = await codeAPI.runCode({
        code,
        language,
        stdin: input,
      });
      
      const result = response.data;
      
      if (result.status === 'Accepted') {
        setOutput(result.stdout || 'No output');
      } else if (result.compile_output) {
        setOutput(`Compilation Error:\n${result.compile_output}`);
      } else if (result.stderr) {
        setOutput(`Runtime Error:\n${result.stderr}`);
      } else {
        setOutput(`Status: ${result.status}\nTime: ${result.time}s\nMemory: ${result.memory}KB`);
      }
    } catch (error) {
      setOutput(`Error: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit?.({ code, language });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCode(initialCode || LANGUAGE_CONFIG[language]?.defaultCode || '');
    setOutput('');
    setInput('');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const editorOptions = {
    fontSize: editorFontSize || 14,
    fontFamily: "'Fira Code', 'Consolas', 'Courier New', monospace",
    fontLigatures: false, // Disable ligatures to fix cursor positioning
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 4,
    wordWrap: 'on',
    lineNumbers: 'on',
    renderLineHighlight: 'all',
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'off', // Disable smooth caret for accurate positioning
    readOnly,
    padding: { top: 16, bottom: 16 },
  };

  return (
    <div className={`flex flex-col bg-gray-900 rounded-xl border border-gray-700 overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          {/* Language Selector */}
          {showLanguageSelector && (
            <select
              value={language}
              onChange={handleLanguageChange}
              disabled={readOnly}
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:border-blue-500"
            >
              {Object.entries(LANGUAGE_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.icon} {config.name}
                </option>
              ))}
            </select>
          )}
          
          {/* Language Badge (when selector hidden) */}
          {!showLanguageSelector && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 rounded-lg">
              <span>{LANGUAGE_CONFIG[language]?.icon}</span>
              <span className="text-white text-sm">{LANGUAGE_CONFIG[language]?.name}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
            title="Copy code"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
          </button>
          
          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
            title="Reset code"
          >
            <RotateCcw size={18} />
          </button>
          
          {/* Fullscreen Button */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>

          {/* Run Button */}
          {showRunButton && (
            <button
              onClick={handleRun}
              disabled={isRunning || !code.trim()}
              className="flex items-center gap-2 px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Play size={16} />
              )}
              {isRunning ? 'Running...' : t('editor.run')}
            </button>
          )}

          {/* Submit Button */}
          {showSubmitButton && (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !code.trim()}
              className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              {isSubmitting ? 'Submitting...' : t('editor.submit')}
            </button>
          )}
        </div>
      </div>

      {/* Editor */}
      <div style={{ height: isFullscreen ? 'calc(100vh - 250px)' : height }}>
        <Editor
          height="100%"
          language={language === 'cpp' ? 'cpp' : language}
          theme={editorTheme || 'vs-dark'}
          value={code}
          onChange={handleCodeChange}
          onMount={handleEditorDidMount}
          options={editorOptions}
        />
      </div>

      {/* I/O Panel */}
      <div className="border-t border-gray-700">
        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('output')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'output'
                ? 'text-white border-b-2 border-blue-500 bg-gray-800'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Terminal size={16} />
            Output
          </button>
          <button
            onClick={() => setActiveTab('input')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'input'
                ? 'text-white border-b-2 border-blue-500 bg-gray-800'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Input
          </button>
        </div>

        {/* Tab Content */}
        <div className="h-32 overflow-auto">
          {activeTab === 'output' ? (
            <pre className={`p-4 text-sm font-mono whitespace-pre-wrap ${
              output.includes('Error') ? 'text-red-400' : 'text-green-400'
            }`}>
              {output || 'Run your code to see output here...'}
            </pre>
          ) : (
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter input for your program..."
              className="w-full h-full p-4 bg-transparent text-white font-mono text-sm resize-none focus:outline-none"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
