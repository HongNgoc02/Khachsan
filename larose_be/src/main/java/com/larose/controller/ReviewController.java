// ReviewController.java
package com.larose.controller;

import com.larose.dto.ReviewDTO;
import com.larose.dto.request.ReqReviewResponse;
import com.larose.dto.response.ResReviewResponse;
import com.larose.service.ReviewResponseService;
import com.larose.service.ReviewService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@Slf4j
public class ReviewController {
    private final ReviewService reviewService;
    private final ReviewResponseService reviewResponseService;

    // Thêm endpoint GET để lấy all reviews (public)
    @GetMapping
    public ResponseEntity<List<ReviewDTO>> getAllReviews() {
        List<ReviewDTO> reviews = reviewService.getAllReviews(); // Thêm method này vào service
        return ResponseEntity.ok(reviews);
    }

    // Endpoint cho admin: lấy tất cả reviews với phân trang và filter
    @GetMapping("/admin")
    public ResponseEntity<Page<ReviewDTO>> getAllReviewsForAdmin(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ReviewDTO> reviews = reviewService.getAllReviewsForAdmin(status, pageable);
        return ResponseEntity.ok(reviews);
    }

    // Lấy review theo ID
    @GetMapping("/{id}")
    public ResponseEntity<ReviewDTO> getReviewById(@PathVariable Long id) {
        ReviewDTO review = reviewService.getReviewById(id);
        if (review != null) {
            return ResponseEntity.ok(review);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // Lấy review theo bookingId
    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<ReviewDTO> getReviewByBookingId(@PathVariable Long bookingId) {
        ReviewDTO review = reviewService.getReviewByBookingId(bookingId);
        if (review != null) {
            return ResponseEntity.ok(review);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/response")
    public ResponseEntity<ResReviewResponse> createResponse(@Valid @RequestBody ReqReviewResponse reqReviewResponse, HttpServletRequest request) {
        ResReviewResponse response = reviewResponseService.create(reqReviewResponse, request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/response")
    public ResponseEntity<ResReviewResponse> updateResponse(@Valid @RequestBody ReqReviewResponse reqReviewResponse) {
        ResReviewResponse response = reviewResponseService.update(reqReviewResponse);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/response/{id}")
    public ResponseEntity<String> deleteResponse(@Valid @PathVariable Long id) {
        reviewResponseService.delete(id);
        return ResponseEntity.ok("Xóa thành công");
    }

    @PostMapping
    public ResponseEntity<ReviewDTO> create(@Valid @RequestBody ReviewDTO reviewDTO, HttpServletRequest request) {
        ReviewDTO response = reviewService.create(reviewDTO, request);
        return ResponseEntity.ok(response);
    }

    @PutMapping
    public ResponseEntity<ReviewDTO> update(@Valid @RequestBody ReviewDTO reviewDTO) {
        ReviewDTO response = reviewService.update(reviewDTO);
        return ResponseEntity.ok(response);
    }

    // Endpoint riêng để cập nhật status
    @PutMapping("/{id}/status")
    public ResponseEntity<ReviewDTO> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        ReviewDTO response = reviewService.updateStatus(id, status);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@Valid @PathVariable Long id) {
        reviewService.delete(id);
        return ResponseEntity.ok("Xóa thành công");
    }
}