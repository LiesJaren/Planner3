import { AgendaEvent, FamilyMember } from '../types/family';

export function downloadICS(events: AgendaEvent[], members: FamilyMember[]): void {
  const memberMap = new Map(members.map((m) => [m.id, m.name]));

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FamiliePlanner//NL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:FamiliePlanner Agenda',
    'X-WR-TIMEZONE:Europe/Amsterdam',
  ];

  events.forEach((ev) => {
    const dateFormatted = ev.date.replace(/-/g, '');
    const startHour = ev.startTime.replace(':', '') + '00';
    const endHour = (ev.endTime ? ev.endTime.replace(':', '') : ev.startTime.replace(':', '')) + '00';

    const involved = ev.memberIds
      .map((id) => memberMap.get(id))
      .filter(Boolean)
      .join(', ');

    lines.push(
      'BEGIN:VEVENT',
      `UID:fp_${ev.id}@familieplanner.local`,
      `DTSTAMP:${dateFormatted}T000000Z`,
      `DTSTART:${dateFormatted}T${startHour}`,
      `DTEND:${dateFormatted}T${endHour}`,
      `SUMMARY:${ev.icon ? `${ev.icon} ` : ''}${ev.title}`,
      `DESCRIPTION:${ev.notes ? ev.notes.replace(/\n/g, '\\n') : ''}${involved ? `\\nVoor: ${involved}` : ''}`,
      ev.location ? `LOCATION:${ev.location}` : '',
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');

  const icsContent = lines.filter(Boolean).join('\r\n');
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `familieplanner_${new Date().toISOString().split('T')[0]}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
