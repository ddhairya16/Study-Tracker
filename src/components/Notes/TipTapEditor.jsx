import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import { Bold, Italic, Underline as UnderlineIcon, Highlighter, Heading1, Heading2, Heading3, List, ListOrdered, CheckSquare, Code, Minus } from 'lucide-react';

const MenuBar = ({ editor }) => {
  if (!editor) return null;

  const ToolbarBtn = ({ action, isActive, children }) => (
    <button
      onClick={action}
      onMouseDown={e => e.preventDefault()}
      className={`toolbar-btn ${isActive ? 'is-active' : ''}`}
      type="button"
    >
      {children}
    </button>
  );

  return (
    <div className="tiptap-toolbar">
      <div className="toolbar-group">
        <ToolbarBtn action={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')}>
          <Bold size={16} />
        </ToolbarBtn>
        <ToolbarBtn action={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')}>
          <Italic size={16} />
        </ToolbarBtn>
        <ToolbarBtn action={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')}>
          <UnderlineIcon size={16} />
        </ToolbarBtn>
        <ToolbarBtn action={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive('highlight')}>
          <Highlighter size={16} />
        </ToolbarBtn>
      </div>
      
      <div className="toolbar-divider" />
      
      <div className="toolbar-group">
        <ToolbarBtn action={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })}>
          <Heading1 size={16} />
        </ToolbarBtn>
        <ToolbarBtn action={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })}>
          <Heading2 size={16} />
        </ToolbarBtn>
        <ToolbarBtn action={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })}>
          <Heading3 size={16} />
        </ToolbarBtn>
      </div>
      
      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <ToolbarBtn action={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')}>
          <List size={16} />
        </ToolbarBtn>
        <ToolbarBtn action={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')}>
          <ListOrdered size={16} />
        </ToolbarBtn>
        <ToolbarBtn action={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')}>
          <CheckSquare size={16} />
        </ToolbarBtn>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <ToolbarBtn action={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')}>
          <Code size={16} />
        </ToolbarBtn>
        <ToolbarBtn action={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus size={16} />
        </ToolbarBtn>
      </div>
    </div>
  );
};

export default function TipTapEditor({ content, onChange }) {
  const isUpdatingRef = useRef(false);
  const [stats, setStats] = useState({ words: 0, characters: 0 });

  const safeContent = (() => {
    try {
      if (typeof content === 'string') {
        const parsed = JSON.parse(content);
        return parsed && typeof parsed === 'object' ? parsed : { type: 'doc', content: [] };
      }
      if (!content || typeof content !== 'object') return { type: 'doc', content: [] };
      return content;
    } catch { 
      return { type: 'doc', content: [] }; 
    }
  })();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline.configure({
        HTMLAttributes: { class: 'underline' },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight,
      Typography,
    ],
    content: safeContent,
    onUpdate: ({ editor }) => {
      isUpdatingRef.current = true;
      onChange(editor.getJSON());
      const text = editor.getText();
      const chars = text.length;
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      setStats({ words, characters: chars });
    },
    editorProps: {
      attributes: {
        class: 'tiptap-prose',
      },
    },
  });

  useEffect(() => {
    if (editor && !editor.isDestroyed && !isUpdatingRef.current) {
      const parsedContent = (() => {
        try {
          if (typeof content === 'string') {
            const parsed = JSON.parse(content);
            return parsed && typeof parsed === 'object' ? parsed : { type: 'doc', content: [] };
          }
          if (!content || typeof content !== 'object') return { type: 'doc', content: [] };
          return content;
        } catch { 
          return { type: 'doc', content: [] }; 
        }
      })();
      editor.commands.setContent(parsedContent);
      const text = editor.getText();
      const chars = text.length;
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      setStats({ words, characters: chars });
    }
    isUpdatingRef.current = false;
  }, [content, editor]);

  return (
    <div 
      className="tiptap-container editor-panel"
      style={{ flex: 1, overflow: 'auto', cursor: 'text' }}
      onClick={(e) => {
        if (editor && !editor.isFocused) {
          editor.commands.focus('end');
        }
      }}
    >
      <MenuBar editor={editor} />
      <EditorContent editor={editor} className="tiptap-content" style={{ height: '100%', display: 'flex', flexDirection: 'column' }} />
      <div className="tiptap-stats">
        {stats.words} words &middot; {stats.characters.toLocaleString()} characters
      </div>
      
      <style>{`
        .tiptap-container {
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow: hidden;
          position: relative;
        }

        .tiptap-stats {
          position: absolute;
          bottom: 16px;
          right: 24px;
          font-size: 11px;
          color: var(--text-disabled);
          pointer-events: none;
        }

        .tiptap-toolbar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 0;
          margin-bottom: 16px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          flex-wrap: wrap;
        }

        .toolbar-group {
          display: flex;
          gap: 4px;
        }

        .toolbar-divider {
          width: 1px;
          height: 24px;
          background: rgba(255,255,255,0.1);
        }

        .toolbar-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          width: 32px;
          height: 32px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .menu-btn:hover.is-active {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .toolbar-btn.is-active {
          background: var(--bg-subtle);
          color: var(--accent-vivid);
        }

        .tiptap-content {
          flex: 1;
          outline: none;
          display: flex;
          flex-direction: column;
        }

        .ProseMirror {
          min-height: 100%;
          outline: none;
          cursor: text;
          flex: 1;
        }

        /* Prose styles overridden for dark mode */
        .tiptap-prose {
          outline: none;
          color: var(--text-primary);
          font-family: var(--font-primary);
          line-height: 1.6;
        }

        .tiptap-prose > * + * {
          margin-top: 0.75em;
        }

        .tiptap-prose h1, .tiptap-prose h2, .tiptap-prose h3 {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          font-weight: 600;
        }

        .tiptap-prose p {
          margin: 0.5em 0;
        }

        .tiptap-prose a {
          color: var(--accent-vivid);
          text-decoration: underline;
        }

        .ProseMirror blockquote {
          border-left: 3px solid var(--accent-vivid);
          padding-left: 1rem;
          margin-left: 0;
          font-style: italic;
          color: var(--text-muted);
          background: var(--bg-subtle);
          padding: 8px 16px;
          border-radius: 0 8px 8px 0;
          border-right: 1px solid var(--border-subtle);
          border-top: 1px solid var(--border-subtle);
          border-bottom: 1px solid var(--border-subtle);
        }

        .tiptap-prose ul, .tiptap-prose ol {
          padding: 0 1rem;
        }

        .tiptap-prose pre {
          background: var(--bg-subtle);
          color: var(--text-primary);
          font-family: 'JetBrains Mono', monospace;
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid var(--border-subtle);
        }

        .tiptap-prose code {
          background: var(--bg-subtle);
          padding: 0.2em 0.4em;
          border-radius: 4px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.9em;
        }

        .tiptap-prose pre code {
          background: transparent;
          padding: 0;
          color: inherit;
        }

        .tiptap-prose mark {
          background-color: rgba(255, 235, 59, 0.3);
          color: inherit;
          padding: 0.1em 0.2em;
          border-radius: 2px;
        }

        ul[data-type="taskList"] {
          list-style: none;
          padding: 0;
        }

        ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin: 0.5em 0;
        }

        ul[data-type="taskList"] li > label {
          display: flex;
          align-items: center;
          margin-top: 0.2em;
        }
        
        ul[data-type="taskList"] input[type="checkbox"] {
          appearance: none;
          width: 16px;
          height: 16px;
          border: 2px solid var(--text-muted);
          border-radius: 4px;
          cursor: pointer;
          position: relative;
          transition: all 0.2s;
        }

        ul[data-type="taskList"] input[type="checkbox"]:checked {
          background: var(--accent-vivid);
          border-color: var(--accent-vivid);
        }
        
        ul[data-type="taskList"] input[type="checkbox"]:checked::after {
          content: "";
          position: absolute;
          left: 4px;
          top: 1px;
          width: 4px;
          height: 8px;
          border: solid var(--bg-base);
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }

        .tiptap-prose hr {
          border: none;
          border-top: 1px solid rgba(255,255,255,0.1);
          margin: 2rem 0;
        }
      `}</style>
    </div>
  );
}
