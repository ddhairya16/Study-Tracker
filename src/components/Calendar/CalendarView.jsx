import React, { useState, useRef, useCallback, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useStore } from '../../store/useStore';
import CalendarToolbar from './CalendarToolbar';
import EventPanel from './EventPanel';

export default function CalendarView() {
  const { events, updateEvent, settings } = useStore();
  const dateFormat = settings?.dateFormat || 'DD/MM/YYYY';
  const calendarRef = useRef(null);
  
  const [currentView, setCurrentView] = useState('timeGridWeek');
  const [currentTitle, setCurrentTitle] = useState('');
  
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [defaultDate, setDefaultDate] = useState(null);

  const handleDateSet = useCallback((dateInfo) => {
    setCurrentTitle(dateInfo.view.title);
  }, []);

  const handleNavigate = (action) => {
    const calendarApi = calendarRef.current.getApi();
    if (action === 'PREV') calendarApi.prev();
    if (action === 'NEXT') calendarApi.next();
    if (action === 'TODAY') calendarApi.today();
  };

  const handleViewChange = (viewName) => {
    const calendarApi = calendarRef.current.getApi();
    calendarApi.changeView(viewName);
    setCurrentView(viewName);
  };

  const handleDateSelect = (selectInfo) => {
    const calendarApi = selectInfo.view.calendar;
    calendarApi.unselect();
    
    setSelectedEvent(null);
    setDefaultDate(selectInfo.start);
    setIsPanelOpen(true);
  };

  const handleEventClick = (clickInfo) => {
    const eventId = clickInfo.event.id;
    const event = events.find(e => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
      setIsPanelOpen(true);
    }
  };

  const handleEventDrop = (dropInfo) => {
    const eventId = dropInfo.event.id;
    const updatedStart = dropInfo.event.startStr;
    const updatedEnd = dropInfo.event.endStr;
    
    updateEvent(eventId, {
      start: updatedStart,
      end: updatedEnd
    });
  };

  const handleEventResize = (resizeInfo) => {
    const eventId = resizeInfo.event.id;
    const updatedEnd = resizeInfo.event.endStr;
    
    updateEvent(eventId, {
      end: updatedEnd
    });
  };

  const calendarEvents = useMemo(() => events.map(e => ({
    id: e.id,
    title: e.title,
    start: e.start,
    end: e.end,
    backgroundColor: e.color,
    borderColor: 'transparent',
    textColor: '#ffffff',
    extendedProps: {
      completed: e.completed
    }
  })), [events]);

  const calendarFormats = useMemo(() => {
    const isIntl = dateFormat === 'DD/MM/YYYY';
    const isISO = dateFormat === 'YYYY-MM-DD';
    
    return {
      titleFormat: isISO
        ? { year: 'numeric', month: '2-digit', day: '2-digit' }
        : isIntl
          ? { day: 'numeric', month: 'long', year: 'numeric' }
          : { month: 'long', day: 'numeric', year: 'numeric' },
      
      dayHeaderFormat: isIntl
        ? { weekday: 'short', day: 'numeric', month: 'numeric' }
        : { weekday: 'short', month: 'numeric', day: 'numeric' },
      
      eventTimeFormat: isIntl
        ? { hour: '2-digit', minute: '2-digit', hour12: false }
        : { hour: 'numeric', minute: '2-digit', hour12: true },
    };
  }, [dateFormat]);

  const renderEventContent = (eventInfo) => {
    const { event } = eventInfo;
    const isCompleted = event.extendedProps.completed;
    
    return (
      <div className={`fc-event-custom ${isCompleted ? 'completed' : ''}`}>
        <div className="fc-event-time">{eventInfo.timeText}</div>
        <div className="fc-event-title">{event.title}</div>
      </div>
    );
  };

  return (
    <div className="calendar-view">
      <div style={{ padding: '32px 40px 0' }}>
        <CalendarToolbar 
          title={currentTitle}
          view={currentView}
          onNavigate={handleNavigate}
          onViewChange={handleViewChange}
        />
      </div>
      
      <div className="calendar-container">
        {useMemo(() => (
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            headerToolbar={false}
            initialView={currentView}
            events={calendarEvents}
            titleFormat={calendarFormats.titleFormat}
            dayHeaderFormat={calendarFormats.dayHeaderFormat}
            eventTimeFormat={calendarFormats.eventTimeFormat}
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            slotMinTime="06:00:00"
            slotMaxTime="23:00:00"
            datesSet={handleDateSet}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            eventContent={renderEventContent}
            height="100%"
            allDaySlot={false}
            nowIndicator={true}
          />
        ), [calendarEvents, currentView, calendarFormats])}
      </div>

      <EventPanel 
        isOpen={isPanelOpen} 
        onClose={() => setIsPanelOpen(false)} 
        selectedEvent={selectedEvent}
        defaultDate={defaultDate}
      />

      <style>{`
        .calendar-view {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .calendar-container {
          flex: 1;
          min-height: 0;
          background: var(--bg-card);
          border: var(--border-glass);
          border-radius: 12px;
          padding: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .fc {
          --fc-page-bg-color: transparent !important;
          height: 100%;
        }
        
        .fc .fc-col-header-cell {
          background-color: var(--bg-panel);
          padding: 8px 0;
          font-weight: 500;
        }
        
        .fc-theme-standard th, 
        .fc-theme-standard td, 
        .fc-theme-standard .fc-scrollgrid {
          border-color: rgba(255, 255, 255, 0.08) !important;
        }

        .fc-event-custom {
          padding: 2px 4px;
          display: flex;
          flex-direction: column;
          font-size: 11px;
          line-height: 1.2;
          overflow: hidden;
          width: 100%;
          height: 100%;
        }
        .fc-event-custom.completed {
          opacity: 0.5;
          text-decoration: line-through;
        }
        .fc-event-time {
          font-weight: 600;
          opacity: 0.8;
          margin-bottom: 2px;
        }
        .fc-event-title {
          font-weight: 500;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }
        
        .fc .fc-timegrid-slot {
          height: 3em;
        }
        
        .fc .fc-timegrid-col.fc-day-today {
          background-color: rgba(0, 212, 255, 0.02) !important;
        }

        .fc-scroller::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .fc-scroller::-webkit-scrollbar-thumb {
          background: var(--text-disabled);
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}
