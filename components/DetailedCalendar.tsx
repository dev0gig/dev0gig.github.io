import React, { useState, useMemo } from 'react';
import { getHolidaysForMonth, Holiday } from '../utils/holidays';

interface DetailedCalendarProps {
    onHolidayClick: (holiday: { name: string; description: string }) => void;
}

// Helper function to get the ISO week number
const getWeekNumber = (d: Date): number => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7)); // Thursday in current week decides the year.
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    // Calculate full weeks to nearest Thursday
    const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
};

const DetailedCalendar: React.FC<DetailedCalendarProps> = ({ onHolidayClick }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const monthName = currentDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    const dayHeaders = ['KW', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

    const holidays = useMemo(
        () => getHolidaysForMonth(currentDate.getFullYear(), currentDate.getMonth()),
        [currentDate]
    );

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };
    
    const handleGoToToday = () => {
        setCurrentDate(new Date());
    };

    const calendarGrid = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const firstDayOfMonth = new Date(year, month, 1);
        let startDayOfWeek = firstDayOfMonth.getDay() - 1; // 0=Mon, 1=Tue, ..., 6=Sun
        if (startDayOfWeek === -1) startDayOfWeek = 6; // Adjust Sunday

        const gridStartDate = new Date(firstDayOfMonth);
        gridStartDate.setDate(gridStartDate.getDate() - startDayOfWeek);

        const days = [];
        for (let i = 0; i < 42; i++) {
            const date = new Date(gridStartDate);
            date.setDate(date.getDate() + i);
            const dayNum = date.getDate();
            const currentMonth = date.getMonth();
            const holiday = (currentMonth === month) ? holidays.find(h => h.date.getUTCDate() === dayNum) : undefined;

            days.push({
                key: `day-${i}`,
                day: dayNum,
                date: date,
                isToday: date.setHours(0, 0, 0, 0) === today.getTime(),
                isHoliday: !!holiday,
                holidayInfo: holiday,
                isCurrentMonth: currentMonth === month
            });
        }
        
        const weeks = [];
        for (let i = 0; i < days.length; i += 7) {
            const weekSlice = days.slice(i, i + 7);
            const thursday = weekSlice[3]; // Thursday is the 4th day (index 3) of a week starting on Monday
            const weekNumber = getWeekNumber(thursday.date);
            weeks.push({ weekNumber, days: weekSlice });
        }
        return weeks;

    }, [currentDate, holidays]);

    return (
        <div className="bg-zinc-800/80 backdrop-blur-xl border border-zinc-700/60 rounded-2xl shadow-lg w-[28rem] text-zinc-200 p-6 flex flex-col h-[480px]">
            <header className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-xl font-bold">{monthName}</h2>
                <div className="flex items-center space-x-1">
                    <button onClick={handleGoToToday} className="text-sm font-semibold text-zinc-300 bg-zinc-700/50 hover:bg-zinc-700/80 px-3 py-1.5 rounded-md transition-colors">Heute</button>
                    <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-zinc-700 transition-colors" aria-label="Vorheriger Monat"><span className="material-symbols-outlined">chevron_left</span></button>
                    <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-zinc-700 transition-colors" aria-label="Nächster Monat"><span className="material-symbols-outlined">chevron_right</span></button>
                </div>
            </header>
            <div className="grid grid-cols-8 grid-rows-7 gap-y-1 gap-x-1 text-center flex-grow">
                {dayHeaders.map(header => (
                    <div key={header} className="font-semibold text-zinc-400 text-sm py-2 flex items-center justify-center">{header}</div>
                ))}
                {calendarGrid.map((week, weekIndex) => (
                    <React.Fragment key={weekIndex}>
                        <div className="font-semibold text-zinc-500 flex items-center justify-center text-sm h-full">{week.weekNumber}</div>
                        {week.days.map(day => (
                            <button
                                key={day.key}
                                disabled={!day.isHoliday}
                                onClick={() => day.isHoliday && day.holidayInfo && onHolidayClick(day.holidayInfo)}
                                className={`
                                    w-full h-full flex items-center justify-center rounded-lg text-sm
                                    ${day.isToday ? 'bg-violet-600 text-white font-bold' : ''}
                                    ${day.isHoliday ? `bg-violet-500/20 text-violet-300 font-semibold ${!day.isToday && day.isCurrentMonth ? 'hover:bg-violet-500/40' : ''}` : ''}
                                    ${!day.isCurrentMonth ? 'text-zinc-600' : ''}
                                    ${day.isCurrentMonth && !day.isToday && !day.isHoliday ? 'text-zinc-300' : ''}
                                `}
                            >
                                {day.day}
                            </button>
                        ))}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default DetailedCalendar;