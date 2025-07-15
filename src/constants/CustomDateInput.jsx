import { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { CalendarIcon } from "lucide-react";
import "react-day-picker/dist/style.css";

const CustomDateInput = ({ value, onChange }) => {
    const [show, setShow] = useState(false);
    const [tempRange, setTempRange] = useState({ from: null, to: null });
    const ref = useRef(null);

    useEffect(() => {
        const close = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setShow(false);
                setTempRange({ from: null, to: null });
            }
        };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);

    const formatRange = () => {
        const shortMonth = (date) => date.toLocaleString("default", { month: "short" });
        const day = (date) => date.getDate();
        const year = (date) => date.getFullYear();

        if (value?.from && value?.to) {
            const from = new Date(value.from);
            const to = new Date(value.to);
            const sameMonth = from.getMonth() === to.getMonth();
            const sameYear = from.getFullYear() === to.getFullYear();

            if (sameMonth && sameYear) {
                return `${shortMonth(from)} ${day(from)} – ${day(to)} ${year(to)}`;
            }

            return `${shortMonth(from)} ${day(from)} – ${shortMonth(to)} ${day(to)} ${year(to)}`;
        }

        if (value?.from) {
            const from = new Date(value.from);
            return `${shortMonth(from)} ${day(from)} → …`;
        }

        return "Pick date range";
    };

    const handleSelect = (selected) => {
        if (!selected) return;

        if (!tempRange.from || (tempRange.from && tempRange.to)) {
            setTempRange({ from: selected, to: null });
        } else {
            const from = tempRange.from < selected ? tempRange.from : selected;
            const to = tempRange.from < selected ? selected : tempRange.from;

            onChange({
                from: from.toLocaleDateString("en-CA"),
                to: to.toLocaleDateString("en-CA"),
            });

            setTempRange({ from: null, to: null });
            setShow(false);
        }
    };

    return (
        <div
            ref={ref}
            className="relative w-full sm:w-auto"
        >
            <button
                type="button"
                onClick={() => {
                    setShow((prev) => !prev);
                    setTempRange({ from: null, to: null });
                }}
                className={`flex h-[38px] w-full items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium shadow-sm transition-all sm:w-auto ${
                    show
                        ? "border-transparent bg-[#69cab1] text-white hover:bg-[#5fbba7]"
                        : "border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                }`}
            >
                <CalendarIcon className="h-4 w-4 text-[#69cab1] dark:text-[#3DD9B6]" />
                {formatRange()}
            </button>

            {show && (
                <div className="absolute z-20 mt-2 rounded-md border border-slate-300 bg-white p-2 shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50">
                    <DayPicker
                        mode="range"
                        selected={{
                            from: tempRange.from || (value?.from ? new Date(value.from) : undefined),
                            to: tempRange.to || (value?.to ? new Date(value.to) : undefined),
                        }}
                        onDayClick={handleSelect}
                        modifiersClassNames={{
                            selected: "bg-[#008B76] text-white",
                            today: "border border-[#008B76]",
                            range_start: "bg-[#008B76] text-white",
                            range_end: "bg-[#008B76] text-white",
                            range_middle: "bg-[#008B76]/10 text-[#005f4e]/80",
                        }}
                        classNames={{
                            day: "w-8 h-8 hover:bg-slate-100 dark:hover:bg-slate-800",
                            nav_button: "p-1 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
                            nav_icon: "w-[14px] h-[14px]",
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default CustomDateInput;
