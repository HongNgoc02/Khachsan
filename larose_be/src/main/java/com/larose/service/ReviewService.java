// /src/main/java/com/larose/service/ReviewService.java

package com.larose.service;

import com.larose.config.JwtTokenUtil;
import com.larose.dto.ReviewDTO;
import com.larose.dto.ReviewResponseDTO;
import com.larose.entity.Booking;
import com.larose.entity.Review;
import com.larose.entity.ReviewResponse;
import com.larose.entity.Room;
import com.larose.entity.User;
import com.larose.maptruct.ReviewMapper;
import com.larose.repository.BookingRepository;
import com.larose.repository.ReviewRepository;
import com.larose.repository.ReviewResponseRepository;
import com.larose.repository.RoomRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserService userService;
    private final ReviewMapper reviewMapper;
    private final BookingRepository bookingRepository;
    private final RoomRepository roomRepository;
    private final ReviewResponseRepository reviewResponseRepository;
    private final JwtTokenUtil jwtTokenUtil; // Đảm bảo đã inject JwtTokenUtil
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Lấy tất cả các review đã được 'published' để hiển thị công khai.
     */
    public List<ReviewDTO> getAllReviews() {
        List<Review> publishedReviews = reviewRepository.findByStatus(Review.ReviewStatus.published);
        
        return publishedReviews.stream()
                .map(this::convertToReviewDTO)
                .collect(Collectors.toList());
    }

    /**
     * Lấy tất cả reviews cho admin với phân trang và filter theo status
     * Sắp xếp theo thời gian tạo mới nhất trước
     */
    public Page<ReviewDTO> getAllReviewsForAdmin(String status, Pageable pageable) {
        Page<Review> reviews;
        
        if (status != null && !status.isEmpty()) {
            try {
                Review.ReviewStatus reviewStatus = Review.ReviewStatus.valueOf(status.toLowerCase());
                reviews = reviewRepository.findByStatusOrderByCreatedAtDesc(reviewStatus, pageable);
            } catch (IllegalArgumentException e) {
                // Nếu status không hợp lệ, lấy tất cả với sorting
                reviews = reviewRepository.findAllByOrderByCreatedAtDesc(pageable);
            }
        } else {
            // Lấy tất cả reviews với sorting theo thời gian mới nhất
            reviews = reviewRepository.findAllByOrderByCreatedAtDesc(pageable);
        }
        
        return reviews.map(this::convertToReviewDTO);
    }


    /**
     * TẠO MỚI MỘT REVIEW
     */
    @Transactional
    public ReviewDTO create(ReviewDTO reviewDTO, HttpServletRequest request) {
        // 1. Lấy thông tin user từ token
        String email = getEmailFromRequest(request);
        User user = userService.findByEmailAndActive(email);

        // 2. Chuyển DTO sang Entity
        Review review = reviewMapper.toReview(reviewDTO);
        review.setUser(user);
        review.setCreatedAt(LocalDateTime.now());
        
        // --- SỬA ĐỔI TẠI ĐÂY ---
        // Thay vì 'pending', chúng ta đổi thành 'published'
        review.setStatus(Review.ReviewStatus.pending); // Tự động duyệt và hiển thị ngay
        // --- KẾT THÚC SỬA ĐỔI ---

        // Convert images and videos lists to JSON
        try {
            if (reviewDTO.getImages() != null && !reviewDTO.getImages().isEmpty()) {
                review.setImages(objectMapper.writeValueAsString(reviewDTO.getImages()));
            }
            if (reviewDTO.getVideos() != null && !reviewDTO.getVideos().isEmpty()) {
                review.setVideos(objectMapper.writeValueAsString(reviewDTO.getVideos()));
            }
        } catch (Exception e) {
            throw new RuntimeException("Error converting media files to JSON: " + e.getMessage());
        }

        // 3. XỬ LÝ LOGIC BOOKING/ROOM (Đã sửa ở bước trước)
        if (reviewDTO.getBookingId() != null) {
             Booking booking = bookingRepository.findById(reviewDTO.getBookingId())
                .orElseThrow(() -> new IllegalArgumentException("Booking not found with id: " + reviewDTO.getBookingId()));
             
             if (!booking.getUser().equals(user)) {
                 throw new SecurityException("User not authorized for this booking");
             }
             
             review.setBooking(booking);
             review.setRoom(booking.getRoom());
        } 
        else if (reviewDTO.getRoomId() != null) {
            Room room = roomRepository.findById(reviewDTO.getRoomId())
                    .orElseThrow(() -> new IllegalArgumentException("Room not found with id: " + reviewDTO.getRoomId()));
            review.setRoom(room);
            review.setBooking(null);
        }
        else {
            review.setBooking(null);
            review.setRoom(null);
        }
        
        // 4. Lưu vào database
        Review savedReview = reviewRepository.save(review);
        return convertToReviewDTO(savedReview); // Trả về DTO sau khi save
    }

    /**
     * Cập nhật review (đã tồn tại)
     */
    @Transactional
    public ReviewDTO update(ReviewDTO reviewDTO) {
        if (reviewDTO.getId() == null) {
            throw new IllegalArgumentException("Review ID is required for update");
        }
        
        Review review = reviewRepository.findById(reviewDTO.getId())
                .orElseThrow(() -> new IllegalArgumentException("Review not found"));
        
        review.setRating(reviewDTO.getRating());
        review.setTitle(reviewDTO.getTitle());
        review.setContent(reviewDTO.getContent());
        review.setUpdatedAt(LocalDateTime.now());
        
        if (reviewDTO.getStatus() != null) {
            try {
                review.setStatus(Review.ReviewStatus.valueOf(reviewDTO.getStatus()));
            } catch (IllegalArgumentException e) {
                // Bỏ qua
            }
        }

        Review updatedReview = reviewRepository.save(review);
        return convertToReviewDTO(updatedReview);
    }

    /**
     * Cập nhật status của review
     */
    @Transactional
    public ReviewDTO updateStatus(Long id, String status) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Review not found with id: " + id));
        
        try {
            Review.ReviewStatus reviewStatus = Review.ReviewStatus.valueOf(status.toLowerCase());
            review.setStatus(reviewStatus);
            review.setUpdatedAt(LocalDateTime.now());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid status: " + status);
        }

        Review updatedReview = reviewRepository.save(review);
        return convertToReviewDTO(updatedReview);
    }

    /**
     * Xóa review
     */
    @Transactional
    public void delete(Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Review not found"));
        reviewRepository.delete(review);
    }

    // Lấy email từ JWT Token
    private String getEmailFromRequest(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            return jwtTokenUtil.getEmailFromToken(token);
        }
        throw new IllegalArgumentException("No JWT token found in request");
    }

    // (Phương thức cũ của bạn)
    public List<ReviewDTO> getReviewsByStatus(String status, Pageable pageable) {
        try {
            Review.ReviewStatus reviewStatus = Review.ReviewStatus.valueOf(status);
            Page<Review> reviews = reviewRepository.findByStatus(reviewStatus, pageable);

            return reviews.stream()
                    .map(this::convertToReviewDTO)
                    .collect(Collectors.toList());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid status: " + status);
        }
    }


    // === PHƯƠNG THỨC MỚI ĐƯỢC THÊM VÀO ĐỂ FIX LỖI ===
    /**
     * Lấy danh sách review CỦA MỘT USER CỤ THỂ theo trạng thái (có phân trang)
     * Phương thức này được gọi từ UserController.
     */
    public List<ReviewDTO> getUserReviewsByStatus(String email, String status, int page, int size) {
        // 1. Tìm User
        User user = userService.findByEmailAndActive(email);

        // 2. Chuyển đổi status
        Review.ReviewStatus reviewStatus;
        try {
            // Thêm .toLowerCase() để đảm bảo khớp với enum (ví dụ: "published" hoặc "PUBLISHED" đều được)
            reviewStatus = Review.ReviewStatus.valueOf(status.toLowerCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid status: " + status);
        }

        // 3. Tạo Pageable
        Pageable pageable = PageRequest.of(page, size);

        // 4. Gọi Repository (Sử dụng phương thức đã có sẵn trong ReviewRepository.java)
        Page<Review> reviewsPage = reviewRepository.findByUserIdAndStatusOrderByCreatedAtDesc(user.getId(), reviewStatus, pageable);

        // 5. Chuyển đổi sang List<ReviewDTO>
        return reviewsPage.stream()
                .map(this::convertToReviewDTO)
                .collect(Collectors.toList());
    }
    // === KẾT THÚC PHẦN THÊM MỚI ===

    /**
     * Lấy review theo ID
     */
    public ReviewDTO getReviewById(Long id) {
        return reviewRepository.findById(id)
                .map(this::convertToReviewDTO)
                .orElse(null);
    }

    /**
     * Lấy review theo bookingId
     */
    public ReviewDTO getReviewByBookingId(Long bookingId) {
        return reviewRepository.findByBookingId(bookingId)
                .map(this::convertToReviewDTO)
                .orElse(null);
    }

    // (Phương thức cũ của bạn)
    private ReviewDTO convertToReviewDTO(Review review) {
        ReviewDTO dto = new ReviewDTO();
        dto.setId(review.getId());
        dto.setRating(review.getRating());
        dto.setTitle(review.getTitle());
        dto.setContent(review.getContent());
        dto.setStatus(review.getStatus().name());
        dto.setCreatedAt(review.getCreatedAt());
        dto.setUpdatedAt(review.getUpdatedAt());

        // Parse images and videos from JSON
        try {
            if (review.getImages() != null && !review.getImages().trim().isEmpty() && !review.getImages().equals("null")) {
                List<String> images = objectMapper.readValue(review.getImages(), new TypeReference<List<String>>() {});
                if (images != null && !images.isEmpty()) {
                    dto.setImages(images);
                }
            }
            if (review.getVideos() != null && !review.getVideos().trim().isEmpty() && !review.getVideos().equals("null")) {
                List<String> videos = objectMapper.readValue(review.getVideos(), new TypeReference<List<String>>() {});
                if (videos != null && !videos.isEmpty()) {
                    dto.setVideos(videos);
                }
            }
        } catch (Exception e) {
            // Log error but don't fail the conversion
            System.err.println("Error parsing media files for review " + review.getId() + ": " + e.getMessage());
            e.printStackTrace();
        }

        if (review.getBooking() != null) {
            dto.setBookingId(review.getBooking().getId());
            dto.setBookingCode(review.getBooking().getBookingCode());
        }
        if (review.getRoom() != null) {
            dto.setRoomId(review.getRoom().getId());
            dto.setRoomCode(review.getRoom().getCode());
            dto.setRoomTitle(review.getRoom().getTitle());
        }
        if (review.getUser() != null) {
            dto.setUserId(review.getUser().getId());
            dto.setUserEmail(review.getUser().getEmail());
            dto.setUserFullName(review.getUser().getFullName()); 
        }
        
        // Fetch và thêm responses
        List<ReviewResponse> responses = reviewResponseRepository.findByReviewIdOrderByCreatedAtDesc(review.getId());
        if (responses != null && !responses.isEmpty()) {
            List<ReviewResponseDTO> responseDTOs = responses.stream()
                    .map(this::convertToReviewResponseDTO)
                    .collect(Collectors.toList());
            dto.setResponses(responseDTOs);
        }
        
        return dto;
    }
    
    private ReviewResponseDTO convertToReviewResponseDTO(ReviewResponse response) {
        ReviewResponseDTO dto = new ReviewResponseDTO();
        dto.setId(response.getId());
        dto.setContent(response.getContent());
        dto.setCreatedAt(response.getCreatedAt());
        
        if (response.getResponder() != null) {
            dto.setResponderId(response.getResponder().getId());
            dto.setResponderName(response.getResponder().getFullName());
            dto.setResponderEmail(response.getResponder().getEmail());
        }
        
        return dto;
    }
}