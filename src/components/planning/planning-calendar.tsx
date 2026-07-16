"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import timeGridPlugin from "@fullcalendar/timegrid";
import frLocale from "@fullcalendar/core/locales/fr";
import type { DateSelectArg, EventClickArg, EventDropArg, EventInput } from "@fullcalendar/core";
import { brandColors, getCalendarEventColor } from "@/lib/theme";
import type { CalendarEvent } from "@/types";

interface PlanningCalendarProps {
  events: CalendarEvent[];
  initialDate: string;
  onEventClick: (eventId: string) => void;
  onDateSelect: (date: string) => void;
  onEventDrop: (eventId: string, date: string) => void;
}

export default function PlanningCalendar({
  events,
  initialDate,
  onEventClick,
  onDateSelect,
  onEventDrop,
}: PlanningCalendarProps) {
  const calendarEvents: EventInput[] = events.map((event) => {
    const eventColor = getCalendarEventColor(event.type, event.status);
    return {
      id: event.id,
      title: event.title,
      start: `${event.date}T${event.startTime}:00`,
      end: `${event.date}T${event.endTime}:00`,
      backgroundColor: eventColor,
      borderColor: eventColor,
      textColor: brandColors.ink,
      extendedProps: event,
    };
  });

  return (
    <div className="premium-calendar">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        initialDate={initialDate}
        locale={frLocale}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
        }}
        buttonText={{
          today: "Aujourd'hui",
          month: "Mois",
          week: "Semaine",
          day: "Jour",
          list: "Liste",
        }}
        events={calendarEvents}
        editable
        selectable
        nowIndicator
        weekends
        height="auto"
        slotMinTime="07:00:00"
        slotMaxTime="22:00:00"
        select={(info: DateSelectArg) => onDateSelect(info.startStr.slice(0, 10))}
        eventClick={(info: EventClickArg) => onEventClick(info.event.id)}
        eventDrop={(info: EventDropArg) => onEventDrop(info.event.id, info.event.startStr.slice(0, 10))}
      />
    </div>
  );
}
