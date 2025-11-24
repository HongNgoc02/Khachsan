package com.larose.controller;


import com.larose.dto.BookingQRRequest;
import com.larose.service.VnpayService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/vnpay")
public class VnpayController {

    @Autowired
    private VnpayService vnpayService;

    @PostMapping("/submit-order")
    public ResponseEntity<String> submitOrder(
    		   @RequestParam("amount") BigDecimal amount,
    	        @RequestParam("orderInfo") String orderInfo,
    	        @RequestParam("roomId") String roomId,
    	        @RequestParam("txnRef") String txnRef){

        String paymentUrl = vnpayService.createOrder(amount, orderInfo, roomId, txnRef);
        return ResponseEntity.ok(paymentUrl);
    }


    @PostMapping("/vnpay_return/qr")
    public ResponseEntity<String> processBookingFromQR(@RequestBody BookingQRRequest bookingRequest) {
        try {
            String email = vnpayService.processBookingFromQR(bookingRequest);
            if (email != null) {
                return ResponseEntity.ok("Thông tin đặt phòng đã được xử lý và email đã được gửi tới " + email);
            } else {
                return ResponseEntity.badRequest().body("Không thể xử lý thông tin đặt phòng từ QR code.");
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Lỗi khi xử lý: " + e.getMessage());
        }
    }

}
