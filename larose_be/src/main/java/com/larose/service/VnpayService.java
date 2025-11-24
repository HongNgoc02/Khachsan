package com.larose.service;


import com.larose.config.VnpayConfig;
import com.larose.dto.BookingQRRequest;
import com.larose.entity.Booking;
import com.larose.entity.Transaction;
import com.larose.repository.BookingRepository;
import com.larose.repository.TransactionRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class VnpayService {
    private final VnpayConfig vnpayConfig;
    private final BookingRepository bookingRepository;
    private final TransactionRepository transactionRepository;
    private final InvoiceService invoiceService;
    private final EmailService emailService;

    public String createOrder(BigDecimal total, String orderInfo, String roomId, String txnRef) {

        String vnp_Version = "2.1.0";
        String vnp_Command = "pay";
        String vnp_IpAddr = "127.0.0.1";
        String vnp_TmnCode = vnpayConfig.getVnpTmnCode();
        String orderType = "order-type";

        Map<String, String> vnp_Params = new HashMap<>();

        vnp_Params.put("vnp_Version", vnp_Version);
        vnp_Params.put("vnp_Command", vnp_Command);
        vnp_Params.put("vnp_TmnCode", vnp_TmnCode);
        vnp_Params.put("vnp_Amount", total.multiply(BigDecimal.valueOf(100)).toPlainString());
        vnp_Params.put("vnp_CurrCode", "VND");
        // Sử dụng txnRef làm vnp_TxnRef (phải duy nhất cho mỗi giao dịch)
        // Nếu txnRef null hoặc rỗng, tạo mới từ roomId + timestamp để đảm bảo tính duy nhất
        if (txnRef == null || txnRef.trim().isEmpty()) {
            txnRef = roomId + "_" + System.currentTimeMillis();
        }
        vnp_Params.put("vnp_TxnRef", txnRef);
        vnp_Params.put("vnp_OrderInfo", orderInfo);
        vnp_Params.put("vnp_OrderType", orderType);
//        vnp_Params.put("vnp_BankCode", "NCB");

        String locate = "vn";
        vnp_Params.put("vnp_Locale", locate);

        String vnp_ReturnUrl = "http://localhost:5173/booking";
        vnp_Params.put("vnp_ReturnUrl", vnp_ReturnUrl);
        vnp_Params.put("vnp_IpAddr", vnp_IpAddr);

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        String vnp_CreateDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_CreateDate", vnp_CreateDate);

        cld.add(Calendar.MINUTE, 15);
        String vnp_ExpireDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);

        List fieldNames = new ArrayList(vnp_Params.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        Iterator itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = (String) itr.next();
            String fieldValue = vnp_Params.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                //Build hash data
                hashData.append(fieldName);
                hashData.append('=');
                try {
                    hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                    //Build query
                    query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII.toString()));
                    query.append('=');
                    query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                } catch (UnsupportedEncodingException e) {
                    e.printStackTrace();
                }
                if (itr.hasNext()) {
                    query.append('&');
                    hashData.append('&');
                }
            }
        }
        String queryUrl = query.toString();
        String vnp_SecureHash = VnpayConfig.hmacSHA512(vnpayConfig.getVnpHashSecret(), hashData.toString());
        queryUrl += "&vnp_SecureHash=" + vnp_SecureHash;
        String paymentUrl = vnpayConfig.getVnpPayUrl() + "?" + queryUrl;
        return paymentUrl;
    }


    /**
     * Xử lý thông tin booking từ QR code và gửi email cho người dùng
     */
    public String processBookingFromQR(BookingQRRequest request) {
        try {
            log.info("Processing booking from QR code: {}", request.getBookingId());
            // Lấy email từ request hoặc tìm booking trong database
            String email = request.getCustomerEmail();
            Booking booking = bookingRepository.findByBookingCode(request.getBookingId())
                    .orElseThrow(() -> new NoSuchElementException("Booking not found with code: " + request.getBookingId()));
            Transaction transaction = transactionRepository.getByBookingId(booking.getId())
                    .orElseThrow(() -> new NoSuchElementException("Transaction not found for booking id: " + booking.getId()));
            // Chỉ set status thành success nếu payment method là VNPay
            // Với cash booking, status sẽ giữ nguyên (pending hoặc deposit_pending)
            if ("vnpay".equalsIgnoreCase(request.getPaymentMethod())) {
            transaction.setStatus(Transaction.Status.success);
            transactionRepository.save(transaction);
            }
            // Nếu không có email trong request, thử tìm booking trong database
            if (email == null || email.isEmpty()) {
                try {
                    if (booking != null && booking.getUser() != null) {
                        email = booking.getUser().getEmail();
                    }
                } catch (Exception e) {
                    log.warn("Could not find booking in database: {}", e.getMessage());
                }
            }
            
            // Nếu vẫn không có email, sử dụng email mặc định hoặc bỏ qua
            if (email == null || email.isEmpty()) {
                log.warn("No email found for booking QR: {}", request.getBookingId());
                return null;
            }
            
            // Thêm createdAt vào request nếu chưa có
            if (request.getCreatedAt() == null || request.getCreatedAt().isEmpty()) {
                if (booking.getCreatedAt() != null) {
                    request.setCreatedAt(booking.getCreatedAt().toString());
                } else {
                    request.setCreatedAt(java.time.LocalDateTime.now().toString());
                }
            }
            
            // Gửi email xác nhận đặt phòng
            String customerName = request.getCustomer() != null ? request.getCustomer() : "Quý khách";
            emailService.sendBookingConfirmationFromQR(
                email,
                customerName,
                request
            );
            
            log.info("Booking confirmation email sent to {} for booking {}", email, request.getBookingId());
            return email;
            
        } catch (Exception e) {
            log.error("Error processing booking from QR code: {}", e.getMessage(), e);
            return null;
        }
    }
}

