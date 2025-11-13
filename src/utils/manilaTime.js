// utils/manilaTime.js

// Get current time in Manila timezone (GMT+8)
export const getManilaTime = (date = new Date()) => {
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    const manilaOffset = 8 * 60 * 60 * 1000; // GMT+8
    return new Date(utc + manilaOffset);
};

// Format to Manila ISO string (without timezone offset)
export const formatToManilaISOString = (date = new Date()) => {
    const manilaDate = getManilaTime(date);
    const year = manilaDate.getFullYear();
    const month = String(manilaDate.getMonth() + 1).padStart(2, '0');
    const day = String(manilaDate.getDate()).padStart(2, '0');
    const hours = String(manilaDate.getHours()).padStart(2, '0');
    const minutes = String(manilaDate.getMinutes()).padStart(2, '0');
    const seconds = String(manilaDate.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

// Add days to Manila time
export const addDaysManilaTime = (days, date = new Date()) => {
    const manilaDate = getManilaTime(date);
    const newDate = new Date(manilaDate.getTime() + days * 24 * 60 * 60 * 1000);
    return formatToManilaISOString(newDate);
};

// Get Manila date string for display
export const getManilaDateString = () => {
    return getManilaTime().toISOString().split('T')[0];
};

// Format Manila date for display
export const formatManilaDate = (date) => {
    return date.toLocaleDateString('en-US', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};

// Get start of Manila day
export const getStartOfManilaDay = () => {
    const manilaTime = getManilaTime();
    manilaTime.setHours(0, 0, 0, 0);
    return manilaTime;
};

// Get end of Manila day
export const getEndOfManilaDay = () => {
    const manilaTime = getManilaTime();
    manilaTime.setHours(23, 59, 59, 999);
    return manilaTime;
};

// Convert any date to Manila time
export const toManilaTime = (date) => {
    if (!date) return null;
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    const manilaOffset = 8 * 60 * 60 * 1000;
    return new Date(utc + manilaOffset);
};