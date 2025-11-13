// utils/manilaTime.js
export const getManilaTime = () => {
    // Create date in Manila time (UTC+8)
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const manilaOffset = 8; // UTC+8
    const manilaTime = new Date(utc + (3600000 * manilaOffset));
    return manilaTime;
};

export const getManilaDateString = () => {
    return getManilaTime().toISOString().split('T')[0];
};

export const formatManilaDate = (date) => {
    return date.toLocaleDateString('en-US', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};

export const getStartOfManilaDay = () => {
    const manilaTime = getManilaTime();
    manilaTime.setHours(0, 0, 0, 0);
    return manilaTime;
};

export const getEndOfManilaDay = () => {
    const manilaTime = getManilaTime();
    manilaTime.setHours(23, 59, 59, 999);
    return manilaTime;
};