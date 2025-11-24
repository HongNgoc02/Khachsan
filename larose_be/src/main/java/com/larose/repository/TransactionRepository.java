package com.larose.repository;

import com.larose.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    Optional<Transaction> getByBookingId(Long bookingId);
    
    Page<Transaction> findAllByStatus(Transaction.Status status, Pageable pageable);
    
    Page<Transaction> findAllByProvider(String provider, Pageable pageable);
    
    Page<Transaction> findAllByStatusAndProvider(Transaction.Status status, String provider, Pageable pageable);
    
    // Query để lấy transactions với status = success trong khoảng thời gian
    // Sử dụng >= và <= để bao gồm cả startDateTime và endDateTime
    @Query("SELECT t FROM Transaction t WHERE t.status = :status " +
           "AND t.createdAt >= :startDateTime AND t.createdAt <= :endDateTime " +
           "ORDER BY t.createdAt DESC")
    List<Transaction> findAllByStatusAndCreatedAtBetween(
        @Param("status") Transaction.Status status,
        @Param("startDateTime") LocalDateTime startDateTime,
        @Param("endDateTime") LocalDateTime endDateTime
    );
    
    // Query để tính tổng doanh thu từ transactions với status = success trong khoảng thời gian
    // Sử dụng >= và <= để bao gồm cả startDateTime và endDateTime
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
           "WHERE t.status = :status " +
           "AND t.createdAt >= :startDateTime AND t.createdAt <= :endDateTime")
    java.math.BigDecimal sumAmountByStatusAndCreatedAtBetween(
        @Param("status") Transaction.Status status,
        @Param("startDateTime") LocalDateTime startDateTime,
        @Param("endDateTime") LocalDateTime endDateTime
    );
}
