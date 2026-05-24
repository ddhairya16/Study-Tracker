import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import SubjectCard from './SubjectCard';
import { Plus } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';

export default function CurriculumView() {
  const { subjects, reorderSubjects, addSubject } = useStore();
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState('#00d4ff');

  const presetColors = ['#ff4d4d', '#ffbd2e', '#27c93f', '#00d4ff', '#b366ff', '#ff66b3', '#ffffff', '#888888'];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = subjects.findIndex((s) => s.id === active.id);
      const newIndex = subjects.findIndex((s) => s.id === over.id);
      reorderSubjects(arrayMove(subjects, oldIndex, newIndex));
    }
  };

  const handleAddSubject = (e) => {
    e.preventDefault();
    if (newSubjectName.trim()) {
      addSubject({
        id: `subj-${Date.now()}`,
        name: newSubjectName.trim(),
        color: newSubjectColor,
        topics: []
      });
      setNewSubjectName('');
      setIsAddingSubject(false);
    }
  };

  return (
    <div className="curriculum-view">
      <div className="header-row">
        <h2>Curriculum</h2>
        <button className="primary-btn" onClick={() => setIsAddingSubject(true)}>
          <Plus size={16} /> New Subject
        </button>
      </div>

      <AnimatePresence>
        {isAddingSubject && (
          <motion.div 
            className="add-subject-panel glass"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <form onSubmit={handleAddSubject}>
              <input 
                autoFocus
                className="text-input" 
                placeholder="Subject Name" 
                value={newSubjectName}
                onChange={e => setNewSubjectName(e.target.value)}
              />
              <div className="color-picker">
                {presetColors.map(color => (
                  <div 
                    key={color}
                    className={`color-option ${newSubjectColor === color ? 'selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewSubjectColor(color)}
                  />
                ))}
              </div>
              <div className="actions">
                <button type="button" className="secondary-btn" onClick={() => setIsAddingSubject(false)}>Cancel</button>
                <button type="submit" className="primary-btn">Save</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={subjects.map(s => s.id)} strategy={rectSortingStrategy}>
          <div className="subjects-grid">
            {subjects.map((subject, index) => (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
              >
                <SubjectCard subject={subject} />
              </motion.div>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <style>{`
        .curriculum-view {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .header-row h2 {
          font-weight: 600;
          font-size: 24px;
          letter-spacing: -0.5px;
        }
        .primary-btn {
          background: var(--text-primary);
          color: var(--bg-base);
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 500;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: transform 200ms var(--ease-spring), opacity 200ms var(--ease-standard);
        }
        .primary-btn:hover {
          opacity: 0.9;
        }
        .primary-btn:active {
          transform: scale(0.97);
        }
        .secondary-btn {
          background: transparent;
          color: var(--text-muted);
          border: 1px solid var(--border-glass);
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 500;
          font-size: 14px;
          cursor: pointer;
          transition: all 200ms var(--ease-standard);
        }
        .secondary-btn:hover {
          background: var(--glass-bg);
          color: var(--text-primary);
        }
        .add-subject-panel {
          padding: 24px;
          border-radius: 12px;
          margin-bottom: 8px;
        }
        .add-subject-panel form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .text-input {
          background: var(--bg-card);
          border: 1px solid rgba(255,255,255,0.1);
          color: var(--text-primary);
          padding: 12px;
          border-radius: 8px;
          font-size: 16px;
          outline: none;
          transition: border-color 200ms var(--ease-standard);
        }
        .text-input:focus {
          border-color: var(--accent-vivid);
        }
        .color-picker {
          display: flex;
          gap: 12px;
        }
        .color-option {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid transparent;
          transition: transform 200ms var(--ease-spring);
        }
        .color-option:hover {
          transform: scale(1.1);
        }
        .color-option.selected {
          transform: scale(1.2);
          box-shadow: 0 0 0 2px var(--bg-panel), 0 0 0 4px var(--accent-vivid);
        }
        .actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        .subjects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }
      `}</style>
    </div>
  );
}
