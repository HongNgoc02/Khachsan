// /src/main/java/com/larose/repository/ReviewRepository.java

package com.larose.repository;

import com.larose.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    Page<Review> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    @Query("SELECT r FROM Review r WHERE r.user.id = :userId AND r.status = :status ORDER BY r.createdAt DESC")
    Page<Review> findByUserIdAndStatusOrderByCreatedAtDesc(@Param("userId") Long userId,
                                                           @Param("status") Review.ReviewStatus status,
                                                           Pageable pageable);

    List<Review> findByRoomIdAndStatusOrderByCreatedAtDesc(Long roomId, Review.ReviewStatus status);

    boolean existsByBookingIdAndUserId(Long bookingId, Long userId);
    
    // Tìm review theo bookingId
    Optional<Review> findByBookingId(Long bookingId);

    // --- PHẦN THÊM MỚI ---
    /**
     * Tìm tất cả các đánh giá theo trạng thái (ví dụ: 'published', 'pending').
     * Cần thiết cho phương thức getAllReviews() trong ReviewService.
     */
    List<Review> findByStatus(Review.ReviewStatus status);
    
    // --- KẾT THÚC PHẦN THÊM MỚI ---
    
    // Bạn cũng có thể thêm phương thức này nếu cần lấy cả Page và Status
    Page<Review> findByStatus(Review.ReviewStatus status, Pageable pageable);
    
    // Lấy tất cả reviews với sorting theo createdAt DESC
    Page<Review> findAllByOrderByCreatedAtDesc(Pageable pageable);
    
    // Lấy reviews theo status với sorting theo createdAt DESC
    Page<Review> findByStatusOrderByCreatedAtDesc(Review.ReviewStatus status, Pageable pageable);
}