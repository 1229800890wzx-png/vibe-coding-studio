package cn.iocoder.yudao.module.edu.service;

import cn.iocoder.yudao.framework.common.exception.ServiceException;
import org.junit.jupiter.api.Test;
import java.time.*;
import static org.junit.jupiter.api.Assertions.*;

class EduRulesTest {
    @Test void adjacentLessonsDoNotConflictButRealOverlapDoes(){
        LocalDateTime start=LocalDateTime.of(2026,10,1,10,0),end=start.plusHours(1);
        assertFalse(EduRules.overlaps(start,end,end,end.plusHours(1)));
        assertTrue(EduRules.overlaps(start,end,end.minusMinutes(1),end.plusHours(1)));
        assertTrue(EduRules.overlaps(start,end,start.minusMinutes(5),end.plusMinutes(5)));
    }
    @Test void refundReservationsCountTowardsTheLimit(){
        assertDoesNotThrow(()->EduRules.validateRefund(10000,2000,3000,5000));
        assertThrows(ServiceException.class,()->EduRules.validateRefund(10000,2000,3000,5001));
        assertThrows(ServiceException.class,()->EduRules.validateRefund(10000,0,0,0));
        assertThrows(ServiceException.class,()->EduRules.validateRefund(Integer.MAX_VALUE,Integer.MAX_VALUE,10,1));
    }
    @Test void transferRequiresSameVersionPriceAndFutureStart(){
        LocalDateTime now=LocalDateTime.of(2026,9,1,10,0);
        assertDoesNotThrow(()->EduRules.validateTransfer("v2","v2",9900,9900,now.plusDays(1),now));
        assertThrows(ServiceException.class,()->EduRules.validateTransfer("v1","v2",9900,9900,now.plusDays(1),now));
        assertThrows(ServiceException.class,()->EduRules.validateTransfer("v2","v2",9900,10000,now.plusDays(1),now));
        assertThrows(ServiceException.class,()->EduRules.validateTransfer("v2","v2",9900,9900,now,now));
    }
    @Test void monthBasedAgeUsesTheClassStartDate(){
        assertEquals(9,EduRules.age("2016-10",LocalDate.of(2026,9,30)));
        assertEquals(10,EduRules.age("2016-10",LocalDate.of(2026,10,1)));
        assertThrows(ServiceException.class,()->EduRules.age("2026-13",LocalDate.of(2026,10,1)));
        assertThrows(ServiceException.class,()->EduRules.age("2027-01",LocalDate.of(2026,10,1)));
    }
    @Test void timestampsAndIsoDatesAgreeInBusinessTimezone(){
        var expected=LocalDateTime.of(2026,10,1,9,30);
        long millis=expected.atZone(ZoneId.of("Asia/Shanghai")).toInstant().toEpochMilli();
        assertEquals(expected,EduRules.time(millis));assertEquals(expected,EduRules.time("2026-10-01T09:30:00"));
    }
}
