package com.starwash.authservice.security;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Date;

public class ManilaTimeUtil {
    
    private static final ZoneId MANILA_ZONE = ZoneId.of("Asia/Manila");
    
    public static LocalDateTime now() {
        return LocalDateTime.now(MANILA_ZONE);
    }
    
    public static ZonedDateTime nowZoned() {
        return ZonedDateTime.now(MANILA_ZONE);
    }
    
    public static LocalDateTime toManilaTime(LocalDateTime dateTime) {
        if (dateTime == null) return null;
        return dateTime.atZone(ZoneId.systemDefault())
                      .withZoneSameInstant(MANILA_ZONE)
                      .toLocalDateTime();
    }
    
    public static LocalDateTime toManilaTime(Date date) {
        if (date == null) return null;
        return date.toInstant()
                  .atZone(MANILA_ZONE)
                  .toLocalDateTime();
    }
    
    public static Date toDate(LocalDateTime dateTime) {
        if (dateTime == null) return null;
        return Date.from(dateTime.atZone(MANILA_ZONE).toInstant());
    }
    
    public static boolean isPast(LocalDateTime dateTime) {
        if (dateTime == null) return false;
        return now().isAfter(dateTime);
    }
    
    public static boolean isFuture(LocalDateTime dateTime) {
        if (dateTime == null) return false;
        return now().isBefore(dateTime);
    }
    
    public static ZoneId getManilaZone() {
        return MANILA_ZONE;
    }
}