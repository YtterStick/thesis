package com.starwash.authservice.security;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Date;

/**
 * Utility class for Manila timezone operations
 * GMT+8 (Philippines)
 */
public class ManilaTimeUtil {
    
    private static final ZoneId MANILA_ZONE = ZoneId.of("Asia/Manila");
    
    /**
     * Get current date and time in Manila timezone
     */
    public static LocalDateTime now() {
        return LocalDateTime.now(MANILA_ZONE);
    }
    
    /**
     * Get current zoned date time in Manila timezone
     */
    public static ZonedDateTime nowZoned() {
        return ZonedDateTime.now(MANILA_ZONE);
    }
    
    /**
     * Convert any LocalDateTime to Manila timezone
     */
    public static LocalDateTime toManilaTime(LocalDateTime dateTime) {
        if (dateTime == null) return null;
        return dateTime.atZone(ZoneId.systemDefault())
                      .withZoneSameInstant(MANILA_ZONE)
                      .toLocalDateTime();
    }
    
    /**
     * Convert Date to Manila LocalDateTime
     */
    public static LocalDateTime toManilaTime(Date date) {
        if (date == null) return null;
        return date.toInstant()
                  .atZone(MANILA_ZONE)
                  .toLocalDateTime();
    }
    
    /**
     * Convert Manila LocalDateTime to Date
     */
    public static Date toDate(LocalDateTime dateTime) {
        if (dateTime == null) return null;
        return Date.from(dateTime.atZone(MANILA_ZONE).toInstant());
    }
    
    /**
     * Check if a date is in the past (Manila time)
     */
    public static boolean isPast(LocalDateTime dateTime) {
        if (dateTime == null) return false;
        return now().isAfter(dateTime);
    }
    
    /**
     * Check if a date is in the future (Manila time)
     */
    public static boolean isFuture(LocalDateTime dateTime) {
        if (dateTime == null) return false;
        return now().isBefore(dateTime);
    }
    
    /**
     * Get Manila timezone ID
     */
    public static ZoneId getManilaZone() {
        return MANILA_ZONE;
    }
}