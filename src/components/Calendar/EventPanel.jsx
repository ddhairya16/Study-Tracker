import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function EventPanel({ isOpen, onClose, selectedEvent, defaultDate }) {
  const { subjects, addEvent, updateEvent, deleteEvent } = useStore();
  
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [date, setDate] = useState('');
  const [start, setStart] = useState('10:00');
  const [end, setEnd] = useState('11:00');
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState('#4da6ff');

  const isEditing = !!selectedEvent;

  useEffect(() => {
    if (selectedEvent) {
      setTitle(selectedEvent.title || '');
      setSubjectId(selectedEvent.subjectId || '');
      setTopicId(selectedEvent.topicId || '');
      
      const startDate = new Date(selectedEvent.start);
      const endDate = new Date(selectedEvent.end);
      
      setDate(format(startDate, 'yyyy-MM-dd'));
      setStart(format(startDate, 'HH:mm'));
      setEnd(format(endDate, 'HH:mm'));
      setNotes(selectedEvent.notes || '');
      setColor(selectedEvent.color || '#4da6ff');
    } else {
      setTitle('');
      setSubjectId('');
      setTopicId('');
      setDate(defaultDate ? format(defaultDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
      setStart(defaultDate ? format(defaultDate, 'HH:mm') : '10:00');
      setEnd(defaultDate ? format(new Date(defaultDate.getTime() + 60*60000), 'HH:mm') : '11:00');
      setNotes('');
      setColor('#4da6ff');
    }
  }, [selectedEvent, defaultDate, isOpen]);

  const currentSubject = subjects.find(s => s.id === subjectId);
  const availableTopics = currentSubject ? currentSubject.topics : [];

  const handleSave = () => {
    let finalColor = color;
    let finalTitle = title.trim();

    if (subjectId && !topicId && availableTopics.length > 0) {
      alert("Please select a topic for the subject.");
      return;
    }

    if (subjectId) {
      finalColor = currentSubject.color;
      if (!finalTitle && topicId) {
        const currentTopic = availableTopics.find(t => t.id === topicId);
        if (currentTopic) finalTitle = `${currentSubject.name} - ${currentTopic.name}`;
      }
    }
    
    if (!finalTitle) finalTitle = 'Untitled Event';

    const eventData = {
      title: finalTitle,
      subjectId: subjectId || null,
      topicId: topicId || null,
      start: `${date}T${start}:00`,
      end: `${date}T${end}:00`,
      color: finalColor,
      notes,
      completed: selectedEvent ? selectedEvent.completed : false,
    };

    if (selectedEvent) {
      updateEvent(selectedEvent.id, eventData);
    } else {
      addEvent({ ...eventData, id: `evt-${Date.now()}` });
    }
    onClose();
  };

  const handleDelete = () => {
    if(window.confirm('Delete this event?')) {
      deleteEvent(selectedEvent.id);
      onClose();
    }
  };

  // Wait, wait... the user's styling instruction was:
  // "Use inputStyle and selectStyle"
  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 8,
    color: 'var(--text-primary)',
    fontSize: 13,
    outline: 'none',
    transition: 'border-color 150ms',
    boxSizing: 'border-box',
  };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    paddingRight: 32,
  };

  const FormField = ({ label, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
              zIndex: 499
            }}
          />
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              position: 'fixed',
              top: 40, // below title bar
              right: 0,
              bottom: 0,
              width: 380,
              background: 'var(--bg-panel)',
              borderLeft: '1px solid var(--border-subtle)',
              backdropFilter: 'blur(20px)',
              zIndex: 500,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-8px 0 40px rgba(0,0,0,0.4)',
            }}
          >
            {/* Header */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 16, fontWeight: 600 }}>{isEditing ? 'Edit Event' : 'New Event'}</span>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, borderRadius: 6 }}>
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              {/* Title */}
              <FormField label="Title">
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Study session"
                  style={inputStyle}
                  autoFocus
                />
              </FormField>

              {/* Subject + Topic side by side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormField label="Subject">
                  <select value={subjectId} onChange={e => { setSubjectId(e.target.value); setTopicId(''); }} style={selectStyle}>
                    <option value="">No subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </FormField>
                <FormField label="Topic">
                  <select value={topicId} onChange={e => setTopicId(e.target.value)} style={selectStyle} disabled={!subjectId}>
                    <option value="">No topic</option>
                    {availableTopics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </FormField>
              </div>

              {/* Date */}
              <FormField label="Date">
                <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
              </FormField>

              {/* Time range side by side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormField label="Start time">
                  <input type="time" value={start} onChange={e => setStart(e.target.value)} style={inputStyle} />
                </FormField>
                <FormField label="End time">
                  <input type="time" value={end} onChange={e => setEnd(e.target.value)} style={inputStyle} />
                </FormField>
              </div>

              {/* Color */}
              <FormField label="Color">
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['#4da6ff','#f59e0b','#10b981','#ef4444','#a855f7','#f97316','#06b6d4','#ec4899'].map(c => (
                    <button key={c} onClick={() => setColor(c)} type="button" style={{
                      width: 28, height: 28, borderRadius: '50%', background: c, border: color === c ? '3px solid #fff' : '3px solid transparent',
                      cursor: 'pointer', transition: 'border 150ms', flexShrink: 0
                    }} />
                  ))}
                </div>
              </FormField>

              {/* Notes */}
              <FormField label="Notes (optional)">
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Any details..." style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }} />
              </FormField>
            </div>

            {/* Footer actions */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 10 }}>
              {isEditing && (
                <button onClick={handleDelete} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#ef4444', padding: '10px 16px', cursor: 'pointer', fontSize: 13 }}>Delete</button>
              )}
              <button onClick={onClose} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-muted)', padding: '10px 16px', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              <button onClick={handleSave} style={{ flex: 2, background: 'var(--accent-vivid)', border: 'none', borderRadius: 8, color: '#000', padding: '10px 16px', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Save Event</button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
