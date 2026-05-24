import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { X, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function EventPanel({ isOpen, onClose, selectedEvent, defaultDate }) {
  const { subjects, addEvent, updateEvent, deleteEvent } = useStore();
  
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [date, setDate] = useState('');
  const [start, setStart] = useState('10:00');
  const [end, setEnd] = useState('11:00');
  const [notes, setNotes] = useState('');
  const [isExam, setIsExam] = useState(false);
  const [examVisibilityMonths, setExamVisibilityMonths] = useState(1);

  useEffect(() => {
    if (selectedEvent) {
      setTitle(selectedEvent.title);
      setSubjectId(selectedEvent.subjectId);
      setTopicId(selectedEvent.topicId);
      
      const startDate = new Date(selectedEvent.start);
      const endDate = new Date(selectedEvent.end);
      
      setDate(format(startDate, 'yyyy-MM-dd'));
      setStart(format(startDate, 'HH:mm'));
      setEnd(format(endDate, 'HH:mm'));
      setNotes(selectedEvent.notes || '');
      setIsExam(selectedEvent.isExam || false);
      setExamVisibilityMonths(selectedEvent.examVisibilityMonths || 1);
    } else {
      setTitle('');
      setSubjectId('');
      setTopicId('');
      setDate(defaultDate ? format(defaultDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
      setStart(defaultDate ? format(defaultDate, 'HH:mm') : '10:00');
      setEnd(defaultDate ? format(new Date(defaultDate.getTime() + 60*60000), 'HH:mm') : '11:00');
      setNotes('');
      setIsExam(false);
      setExamVisibilityMonths(1);
    }
  }, [selectedEvent, defaultDate, isOpen]);

  // Handle subject change to reset topic
  const handleSubjectChange = (e) => {
    setSubjectId(e.target.value);
    setTopicId('');
  };

  const currentSubject = subjects.find(s => s.id === subjectId);
  const availableTopics = currentSubject ? currentSubject.topics : [];

  const handleSave = (e) => {
    e.preventDefault();
    if (!subjectId || !topicId) {
      alert("Please select a subject and topic");
      return;
    }

    const currentTopic = availableTopics.find(t => t.id === topicId);
    const eventColor = currentSubject.color;
    const computedTitle = title.trim() || `${currentSubject.name} - ${currentTopic.name}`;

    const eventData = {
      title: computedTitle,
      subjectId,
      topicId,
      start: `${date}T${start}:00`,
      end: `${date}T${end}:00`,
      color: eventColor,
      notes,
      completed: selectedEvent ? selectedEvent.completed : false,
      ...(isExam ? { isExam, examVisibilityMonths: parseInt(examVisibilityMonths, 10) } : { isExam: false })
    };

    if (selectedEvent) {
      updateEvent(selectedEvent.id, eventData);
    } else {
      addEvent({ ...eventData, id: `evt-${Date.now()}` });
    }
    onClose();
  };

  return (
    <>
      <div className={`panel-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <div className={`event-panel glass ${isOpen ? 'open' : ''}`}>
        <div className="panel-header">
          <h3>{selectedEvent ? 'Edit Event' : 'New Event'}</h3>
          <div className="panel-actions">
            {selectedEvent && (
              <button type="button" className="icon-btn danger" onClick={() => {
                if(window.confirm('Delete this event?')) {
                  deleteEvent(selectedEvent.id);
                  onClose();
                }
              }}>
                <Trash2 size={18} />
              </button>
            )}
            <button type="button" className="icon-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="panel-content">
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label>Subject</label>
              <select className="form-control" value={subjectId} onChange={handleSubjectChange} required>
                <option value="">Select Subject</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Topic</label>
              <select className="form-control" value={topicId} onChange={e => setTopicId(e.target.value)} required disabled={!subjectId}>
                <option value="">Select Topic</option>
                {availableTopics.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Title (Optional)</label>
              <input 
                type="text" 
                className="form-control" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="Auto-filled from Subject + Topic"
              />
            </div>

            <div className="form-group">
              <label>Date</label>
              <input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Start</label>
                <input type="time" className="form-control" value={start} onChange={e => setStart(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>End</label>
                <input type="time" className="form-control" value={end} onChange={e => setEnd(e.target.value)} required />
              </div>
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea 
                className="form-control textarea" 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
                placeholder="Add notes or goals for this session..."
              />
            </div>
            
            <div className="exam-section">
              <div className="form-group toggle-group">
                <label>Mark as Exam</label>
                <label className="toggle-switch">
                  <input type="checkbox" checked={isExam} onChange={e => setIsExam(e.target.checked)} />
                  <span className="slider"></span>
                </label>
              </div>

              {isExam && (
                <div className="form-group">
                  <label>Show countdown from</label>
                  <select className="form-control" value={examVisibilityMonths} onChange={e => setExamVisibilityMonths(e.target.value)}>
                    <option value={1}>1 month before</option>
                    <option value={2}>2 months before</option>
                    <option value={3}>3 months before</option>
                  </select>
                </div>
              )}
            </div>

            <div className="panel-footer">
              <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
              <button type="submit" className="primary-btn">Save</button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        .panel-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          opacity: 0;
          pointer-events: none;
          transition: opacity 280ms var(--ease-standard);
          z-index: 100;
        }
        .panel-overlay.open {
          opacity: 1;
          pointer-events: auto;
        }
        .event-panel {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 360px;
          background: var(--bg-panel);
          z-index: 101;
          transform: translateX(100%);
          transition: transform 320ms var(--ease-spring);
          display: flex;
          flex-direction: column;
          border-left: var(--border-glass);
        }
        .event-panel.open {
          transform: translateX(0);
        }
        .panel-header {
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: var(--border-glass);
        }
        .panel-actions {
          display: flex;
          gap: 8px;
        }
        .panel-content {
          flex: 1;
          padding: 24px;
          overflow-y: auto;
        }
        .form-group {
          margin-bottom: 20px;
        }
        .form-group label {
          display: block;
          font-size: 13px;
          color: var(--text-muted);
          margin-bottom: 8px;
          font-weight: 500;
        }
        .form-row {
          display: flex;
          gap: 16px;
        }
        .form-row .form-group {
          flex: 1;
        }
        .form-control {
          width: 100%;
          background: var(--bg-card);
          border: 1px solid rgba(255,255,255,0.1);
          color: var(--text-primary);
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          transition: border-color 200ms var(--ease-standard);
        }
        .form-control:focus {
          border-color: var(--accent-vivid);
        }
        .form-control:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .textarea {
          min-height: 100px;
          resize: vertical;
        }
        .panel-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 32px;
        }
        input[type="time"]::-webkit-calendar-picker-indicator,
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
          cursor: pointer;
        }
        
        .exam-section {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--border-subtle);
          border-left: 2px solid #f59e0b;
          padding-left: 16px;
        }

        .toggle-group {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .toggle-group label:first-child {
          margin-bottom: 0;
        }

        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 32px;
          height: 18px;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-switch .slider {
          position: absolute;
          cursor: pointer;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: rgba(255, 255, 255, 0.1);
          transition: .4s;
          border-radius: 18px;
        }

        .toggle-switch .slider:before {
          position: absolute;
          content: "";
          height: 14px;
          width: 14px;
          left: 2px;
          bottom: 2px;
          background-color: var(--text-muted);
          transition: .4s;
          border-radius: 50%;
        }

        .toggle-switch input:checked + .slider {
          background-color: #f59e0b;
        }

        .toggle-switch input:checked + .slider:before {
          transform: translateX(14px);
          background-color: #000;
        }
      `}</style>
    </>
  );
}
