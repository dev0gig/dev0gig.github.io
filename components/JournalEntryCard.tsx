import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { JournalEntry } from '../types';

interface JournalEntryCardProps {
  entry: JournalEntry;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onTagClick: (tag: string) => void;
  showConfirmation: (title: string, message: string | React.ReactNode, onConfirm: () => void) => void;
}

const JournalEntryCard: React.FC<JournalEntryCardProps> = ({ entry, onUpdate, onDelete, onTagClick, showConfirmation }) => {
  const [content, setContent] = useState(entry.content);
  const [isEditing, setIsEditing] = useState(() => entry.content === ''); // Start in edit mode if new
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorState, setCursorState] = useState<{ start: number, end: number } | null>(null);

  useEffect(() => {
    // Sync local state if prop changes from parent (e.g., from global to-do list toggle)
    if (!isEditing) {
      setContent(entry.content);
    }
  }, [entry.content, isEditing]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Only move cursor to the end if we're not specifically setting it (e.g., for tabbing)
      if (!cursorState) {
          const len = textareaRef.current.value.length;
          textareaRef.current.selectionStart = len;
          textareaRef.current.selectionEnd = len;
      }
    }
  }, [isEditing]);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Auto-resize height
      textarea.style.height = 'inherit';
      const scrollHeight = textarea.scrollHeight;
      const minHeight = 48; // Corresponds to Tailwind's h-12
      textarea.style.height = `${Math.max(scrollHeight, minHeight)}px`;

      // Restore cursor/selection position if specified
      if (cursorState) {
        textarea.selectionStart = cursorState.start;
        textarea.selectionEnd = cursorState.end;
        setCursorState(null); // Reset after applying
      }
    }
  }, [content, isEditing, cursorState]);


  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const saveChanges = () => {
    if (content.trim() !== entry.content.trim()) {
      onUpdate(entry.id, content.trim());
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    showConfirmation(
      "Eintrag löschen?",
      "Sind Sie sicher, dass Sie diesen Eintrag unwiderruflich löschen möchten?",
      () => onDelete(entry.id)
    );
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
        e.preventDefault();
        setContent(entry.content); // revert changes
        setIsEditing(false);
        return;
    }

    if (e.key === 'Tab') {
        e.preventDefault();

        const target = e.currentTarget;
        const { value, selectionStart, selectionEnd } = target;
        const indent = '  ';

        // Find the block of lines to operate on
        const startOfLines = value.lastIndexOf('\n', selectionStart - 1) + 1;
        
        let endOfLines = value.indexOf('\n', selectionEnd -1);
        // If selection ends right on a newline, we only want to affect lines up to that point
        if (selectionEnd > startOfLines && value[selectionEnd-1] === '\n') {
          endOfLines = selectionEnd - 1;
        } else if (endOfLines === -1) {
          endOfLines = value.length;
        }
        
        const linesToModify = value.substring(startOfLines, endOfLines);
        const lines = linesToModify.split('\n');

        let charsChangedInSelectionStartLine = 0;
        let totalCharsChanged = 0;

        const newLines = lines.map((line, index) => {
            if (e.shiftKey) { // Outdent
                if (line.startsWith(indent)) {
                    if (index === 0) charsChangedInSelectionStartLine = -indent.length;
                    totalCharsChanged -= indent.length;
                    return line.substring(indent.length);
                }
            } else { // Indent
                if (line.length > 0) { // Don't indent empty lines
                    if (index === 0) charsChangedInSelectionStartLine = indent.length;
                    totalCharsChanged += indent.length;
                    return indent + line;
                }
            }
            return line;
        });

        const newLinesBlock = newLines.join('\n');
        const newContent = value.substring(0, startOfLines) + newLinesBlock + value.substring(endOfLines);

        setContent(newContent);
        
        const newSelectionStart = Math.max(startOfLines, selectionStart + charsChangedInSelectionStartLine);
        const newSelectionEnd = selectionEnd + totalCharsChanged;

        setCursorState({ start: newSelectionStart, end: newSelectionEnd });
    }
  };

  const formattedDate = new Date(entry.createdAt).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const processChildrenForTags = (children: React.ReactNode): React.ReactNode => {
    return React.Children.map(children, child => {
      if (typeof child === 'string') {
        const tagRegex = /#([a-zA-Z0-9_äöüÄÖÜß]+)/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = tagRegex.exec(child)) !== null) {
            if (match.index > lastIndex) {
                parts.push(child.substring(lastIndex, match.index));
            }
            const tagName = match[1];
            parts.push(
                <button
                    key={match.index}
                    onClick={(e) => {
                        e.stopPropagation(); // prevent card click/edit mode
                        onTagClick(tagName);
                    }}
                    className="inline-block align-baseline text-violet-400 hover:text-violet-300 hover:underline focus:outline-none focus:ring-1 focus:ring-violet-500 rounded-sm cursor-pointer"
                >
                    #{tagName}
                </button>
            );
            lastIndex = tagRegex.lastIndex;
        }

        if (lastIndex < child.length) {
            parts.push(child.substring(lastIndex));
        }
        
        return <>{parts.map((part, i) => <React.Fragment key={i}>{part}</React.Fragment>)}</>;
      }
      
      if (React.isValidElement(child)) {
        const props = child.props as {children?: React.ReactNode; [key: string]: any};
        if (props.children) {
            const { children: grandChildren, ...restProps } = props;
            return React.cloneElement(child, restProps, processChildrenForTags(grandChildren));
        }
      }
      return child;
    });
  };

  const customRenderers = {
    p: (props: { children?: React.ReactNode; [key: string]: any }) => <p {...props}>{processChildrenForTags(props.children)}</p>,
    li: (props: { children?: React.ReactNode; [key: string]: any }) => {
        // The special logic for interactive task items is removed.
        // This will now just render list items, and `remark-gfm` will handle the visual checkbox.
        // Our tag processing will still work on the text content.
        const processedChildren = processChildrenForTags(props.children);
        return <li {...props}>{processedChildren}</li>;
    },
  };


  return (
    <div className="bg-zinc-800/70 backdrop-blur-xl border border-zinc-700/60 rounded-xl p-4 shadow-md w-full relative animate-scaleIn">
       <style>{`
         @keyframes scaleIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
         .animate-scaleIn { animation: scaleIn 0.3s ease-out forwards; }
         .markdown-content {
            min-height: 48px;
            line-height: 1.6;
            color: #e4e4e7; /* zinc-300 */
         }
         .markdown-content > *:first-child { margin-top: 0; }
         .markdown-content > *:last-child { margin-bottom: 0; }
         .markdown-content h1, .markdown-content h2, .markdown-content h3 { font-weight: 700; margin-top: 1em; margin-bottom: 0.5em; color: #fafafa; border-bottom: 1px solid #3f3f46; padding-bottom: 0.3em; }
         .markdown-content h1 { font-size: 1.5em; }
         .markdown-content h2 { font-size: 1.25em; }
         .markdown-content h3 { font-size: 1.1em; }
         .markdown-content p { margin-bottom: 0.75em; }
         .markdown-content a { color: #a78bfa; text-decoration: none; }
         .markdown-content a:hover { text-decoration: underline; }
         .markdown-content ul { list-style-type: disc; }
         .markdown-content ol { list-style-type: decimal; }
         .markdown-content ul, .markdown-content ol { padding-left: 1.5rem; margin-bottom: 0.75em; }
         .markdown-content li { margin-bottom: 0.25em; }
         .markdown-content blockquote { border-left: 4px solid #52525b; padding-left: 1rem; margin-left: 0; margin-right: 0; font-style: italic; color: #a1a1aa; }
         .markdown-content code:not(pre > code) { background-color: rgba(82, 82, 91, 0.5); padding: 0.2em 0.4em; margin: 0; font-size: 85%; border-radius: 6px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
         .markdown-content pre { background-color: #27272a; padding: 1rem; border-radius: 8px; overflow-x: auto; }
         .markdown-content pre code { background-color: transparent; padding: 0; margin: 0; font-size: 100%; }
         .markdown-content hr { border: none; border-top: 1px solid #52525b; margin: 1.5em 0; }
         .markdown-content table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
         .markdown-content .task-list-item { list-style-type: none; }
      `}</style>
      <div className="flex justify-between items-start mb-2">
        <p className="text-xs text-zinc-400 font-medium tracking-wide">{formattedDate} Uhr</p>
        <div className="flex items-center space-x-1 -mr-1 mt-[-2px]">
            {isEditing ? (
                 <button
                    onClick={saveChanges}
                    className="text-green-400 hover:text-green-300 transition-all duration-200 w-8 h-8 flex items-center justify-center rounded-full hover:bg-green-500/10"
                    aria-label="Eintrag speichern"
                >
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                </button>
            ) : (
                <>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="text-zinc-400 hover:text-violet-400 transition-all duration-200 w-8 h-8 flex items-center justify-center rounded-full hover:bg-violet-500/10"
                        aria-label="Eintrag bearbeiten"
                    >
                        <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button
                        onClick={handleDelete}
                        className="text-zinc-400 hover:text-red-400 transition-all duration-200 w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-500/10"
                        aria-label="Eintrag löschen"
                    >
                        <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                </>
            )}
        </div>
      </div>
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          onBlur={saveChanges}
          onKeyDown={handleKeyDown}
          placeholder="Schreibe etwas... #tags und - [ ] to-dos werden unterstützt."
          className="w-full bg-transparent text-zinc-200 resize-none focus:outline-none placeholder-zinc-500 overflow-y-hidden leading-relaxed"
          rows={1}
        />
      ) : (
        <div
          className="markdown-content"
        >
          {content.trim() === '' ? (
            <p className="text-zinc-500 italic">Leerer Eintrag.</p>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={customRenderers}>{content}</ReactMarkdown>
          )}
        </div>
      )}
    </div>
  );
};

export default JournalEntryCard;