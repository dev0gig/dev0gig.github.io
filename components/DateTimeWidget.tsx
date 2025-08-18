
import React from 'react';

const getWeekNumber = (d: Date): number => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
};


const DateTimeWidget: React.FC = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    const monthName = today.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    const dayHeaders = ['KW', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

    const getCalendarGrid = () => {
        const firstDayOfMonth = new Date(year, month, 1);
        let startDayOfWeek = firstDayOfMonth.getDay() - 1; // 0=Mon, 1=Tue, ..., 6=Sun
        if (startDayOfWeek === -1) startDayOfWeek = 6; // Adjust Sunday

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();
        
        const days = [];
        
        // Previous month's days
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push({ day: daysInPrevMonth - startDayOfWeek + 1 + i, isCurrent: false });
        }
        
        // Current month's days
        for (let i = 1; i <= daysInMonth; i++) {
            const isToday = i === today.getDate();
            days.push({ day: i, isCurrent: true, isToday });
        }

        // Next month's days
        const gridsize = 42; // 6 weeks * 7 days
        let nextMonthDay = 1;
        while (days.length % 7 !== 0 || days.length < gridsize) {
            days.push({ day: nextMonthDay++, isCurrent: false });
        }
        
        // Chunk into weeks and add week number
        const weeks = [];
        for (let i = 0; i < days.length; i += 7) {
            const weekSlice = days.slice(i, i + 7);
            const dateForWeek = weekSlice.find(d => d.isCurrent)?.day || (i === 0 ? 28 : 5);
            const monthForWeek = i === 0 && weekSlice.some(d => d.day > 20) ? month -1 : (i > 20 && weekSlice.some(d => d.day < 7) ? month + 1 : month);
            const weekNumber = getWeekNumber(new Date(year, monthForWeek, dateForWeek));
            weeks.push({ weekNumber, days: weekSlice });
        }
        return weeks;
    };

    const calendarWeeks = getCalendarGrid();

    return (
        <div className="flex flex-col h-full text-white p-2">
            <h2 className="text-center font-bold text-sm mb-1 flex-shrink-0">{monthName}</h2>
            <div className="grid grid-cols-8 gap-y-1 text-center text-xs flex-grow">
                {dayHeaders.map(header => (
                    <div key={header} className="font-semibold text-zinc-400 flex items-center justify-center">{header}</div>
                ))}
                {calendarWeeks.map((week, weekIndex) => (
                    <React.Fragment key={weekIndex}>
                        <div className="font-semibold text-zinc-500 flex items-center justify-center">{week.weekNumber}</div>
                        {week.days.map((day, dayIndex) => (
                            <div
                                key={dayIndex}
                                className={`flex items-center justify-center rounded
                                    ${day.isToday ? 'bg-violet-500 font-bold' : ''}
                                    ${!day.isToday && day.isCurrent ? 'text-zinc-200' : ''}
                                    ${!day.isCurrent ? 'text-zinc-600' : ''}
                                `}
                            >
                                {day.day}
                            </div>
                        ))}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default DateTimeWidget;
