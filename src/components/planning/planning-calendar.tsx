"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import timeGridPlugin from "@fullcalendar/timegrid";
import frLocale from "@fullcalendar/core/locales/fr";
import type { DateSelectArg, EventClickArg, EventDropArg, EventInput } from "@fullcalendar/core";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import { brandColors, getCalendarEventColor } from "@/lib/theme";
import type { CalendarEvent } from "@/types";

export type CalendarEventPatch = { date: string; startTime: string; endTime: string };

interface PlanningCalendarProps {
  events: CalendarEvent[];
  initialDate: string;
  onEventClick: (eventId: string) => void;
  onDateSelect: (date: string) => void;
  onEventChange: (eventId: string, patch: CalendarEventPatch) => void;
}

const pad = (value: number) => String(value).padStart(2, "0");
const localDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const localTime = (date: Date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

export default function PlanningCalendar({
  events,
  initialDate,
  onEventClick,
  onDateSelect,
  onEventChange,
}: PlanningCalendarProps) {
  const calendarEvents: EventInput[] = events
    // Skip events without a date — an empty date produces an invalid range that
    // FullCalendar silently drops (the event would vanish from the calendar).
    .filter((event) => Boolean(event.date))
    .map((event) => {
      const eventColor = getCalendarEventColor(event.type, event.status);
      // Fall back to sane times so an event with a blank start/end still renders.
      const startTime = event.startTime || "09:00";
      const endTime = event.endTime || event.startTime || "10:00";
      return {
        id: event.id,
        title: event.title,
        start: `${event.date}T${startTime}:00`,
        end: `${event.date}T${endTime}:00`,
        backgroundColor: eventColor,
        borderColor: eventColor,
        textColor: brandColors.ink,
        extendedProps: event,
      };
    });

  function handleChange(info: EventDropArg | EventResizeDoneArg) {
    const start = info.event.start;
    if (!start) return;
    const end = info.event.end;
    onEventChange(info.event.id, {
      date: localDate(start),
      startTime: localTime(start),
      endTime: end ? localTime(end) : localTime(start),
    });
  }

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
        eventDrop={handleChange}
        eventResize={handleChange}
      />
    </div>
  );
}
