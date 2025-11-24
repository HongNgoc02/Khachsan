package com.larose.service;

import com.larose.dto.DailyRevenueDto;
import com.larose.dto.OccupancyRateDto;
import com.larose.dto.WeeklyRevenueDto;
import com.larose.entity.Transaction;
import com.larose.repository.BookingRepository;
import com.larose.repository.RoomRepository;
import com.larose.repository.TransactionRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Date; // ← QUAN TRỌNG: import đúng java.sql.Date
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class StatisticalService {
    RoomRepository roomRepository;
    BookingRepository bookingRepository;
    TransactionRepository transactionRepository;

    public Long countAllRooms() {
        return roomRepository.countAllRooms();
    }

    public Long countRoomsHasBeenBooked(LocalDate minDate, LocalDate maxDate) {
        return bookingRepository.countRoomsHasBeenBooked(minDate, maxDate);
    }

    public BigDecimal sumTotalPrice(Integer days, LocalDate startDate, LocalDate endDate) {
        // Tính doanh thu từ transactions với status = success (đã thanh toán)
        final LocalDateTime startDateTime;
        final LocalDateTime endDateTime;
        
        if (startDate != null && endDate != null) {
            // Tính theo khoảng thời gian
            startDateTime = startDate.atStartOfDay();
            endDateTime = endDate.atTime(23, 59, 59);
        } else if (days != null) {
            // Tính theo số ngày
            endDateTime = LocalDateTime.now();
            startDateTime = endDateTime.minusDays(days);
        } else {
            // Mặc định 30 ngày
            endDateTime = LocalDateTime.now();
            startDateTime = endDateTime.minusDays(30);
        }
        
        // Sử dụng query trực tiếp trong database để tính tổng doanh thu
        BigDecimal totalRevenue = transactionRepository.sumAmountByStatusAndCreatedAtBetween(
            Transaction.Status.success,
            startDateTime,
            endDateTime
        );
        
        return totalRevenue != null ? totalRevenue : BigDecimal.ZERO;
    }

    public List<DailyRevenueDto> getDailyRevenue(Integer lastDays, LocalDate startDate, LocalDate endDate) {
        // Tính doanh thu từ transactions với status = success (đã thanh toán)
        final LocalDateTime startDateTime;
        final LocalDateTime endDateTime;
        
        if (startDate != null && endDate != null) {
            // Tính theo khoảng thời gian
            startDateTime = startDate.atStartOfDay();
            endDateTime = endDate.atTime(23, 59, 59);
        } else if (lastDays != null) {
            // Tính theo số ngày
            endDateTime = LocalDateTime.now();
            startDateTime = endDateTime.minusDays(lastDays);
        } else {
            // Mặc định 30 ngày
            endDateTime = LocalDateTime.now();
            startDateTime = endDateTime.minusDays(30);
        }
        
        // Sử dụng query trực tiếp trong database để lấy transactions
        List<Transaction> transactions = transactionRepository.findAllByStatusAndCreatedAtBetween(
            Transaction.Status.success,
            startDateTime,
            endDateTime
        );
        
        // Nhóm theo ngày và tính tổng
        return transactions.stream()
            .collect(Collectors.groupingBy(
                t -> t.getCreatedAt().toLocalDate(),
                Collectors.reducing(
                    BigDecimal.ZERO,
                    Transaction::getAmount,
                    BigDecimal::add
                )
            ))
            .entrySet()
            .stream()
            .map(entry -> new DailyRevenueDto(
                entry.getKey(),
                entry.getValue().setScale(2, RoundingMode.HALF_UP)
            ))
            .sorted((a, b) -> a.date().compareTo(b.date()))
            .collect(Collectors.toList());
    }

    public List<WeeklyRevenueDto> getWeeklyRevenue(Integer lastWeeks) {
        int weeks = lastWeeks == null ? 12 : lastWeeks;
        return bookingRepository.findWeeklyRevenue(weeks)
                .stream()
                .map(row -> {
                    Integer weekNumber = (Integer) row[0];
                    LocalDate startDate = ((Date) row[1]).toLocalDate();
                    LocalDate endDate = ((Date) row[2]).toLocalDate();
                    BigDecimal revenue = ((BigDecimal) row[3]).setScale(2, RoundingMode.HALF_UP);
                    return new WeeklyRevenueDto(weekNumber, startDate, endDate, revenue);
                })
                .collect(Collectors.toList());
    }

    public OccupancyRateDto getOccupancyRate(LocalDate minDate, LocalDate maxDate) {
        Long total = roomRepository.countAllRooms();
        Long booked = bookingRepository.countRoomsHasBeenBooked(minDate, maxDate);
        double rate = total > 0 ? (booked.doubleValue() / total.doubleValue()) * 100 : 0.0;
        return new OccupancyRateDto(booked, total, BigDecimal.valueOf(rate).setScale(2, RoundingMode.HALF_UP));
    }
}