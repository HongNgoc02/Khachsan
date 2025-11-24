package com.larose.service;

import com.larose.dto.BookingQRRequest;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.io.ByteArrayOutputStream;
import java.io.UnsupportedEncodingException;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.Locale;
import java.util.UUID;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import java.awt.image.BufferedImage;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.ClassPathResource;
import java.io.InputStream;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {
    private final JavaMailSender mailSender;

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    @Value("${app.frontend.base-url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${app.email.from:noreply@larose.com}")
    private String fromEmail;

    @Value("${app.name:Larose Hotel}")
    private String appName;

    @Async
    public void sendVerificationEmail(String to, String name, String verificationToken) {
        String subject = "Xác thực email - " + appName;
        String verificationUrl = baseUrl + "/api/auth/verify?token=" + verificationToken;

        String body = buildVerificationEmailHtml(name, verificationUrl);

        sendHtmlEmail(to, subject, body);
        log.info("Verification email sent to: {}", to);
    }

    @Async
    public void sendPasswordResetEmail(String to, String name, String resetToken) {
        String subject = "Đặt lại mật khẩu - " + appName;
        String resetUrl = baseUrl + "/reset-password?token=" + resetToken;

        String body = buildPasswordResetEmailHtml(name, resetUrl, resetToken);

        sendHtmlEmail(to, subject, body);
        log.info("Password reset email sent to: {}", to);
    }

    @Async
    public void sendWelcomeEmail(String to, String name) {
        String subject = "Chào mừng đến với " + appName;

        String body = buildWelcomeEmailHtml(name);

        sendHtmlEmail(to, subject, body);
        log.info("Welcome email sent to: {}", to);
    }

    @Async
    public void sendBookingConfirmationEmail(String to, String name, String bookingCode) {
        String subject = "Xác nhận đặt phòng - " + appName;

        String body = buildBookingConfirmationEmailHtml(name, bookingCode);

        sendHtmlEmail(to, subject, body);
        log.info("Booking confirmation email sent to: {}", to);
    }

    public void sendHtmlEmail(String to, String subject, String body) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, appName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true); // true indicates HTML

            mailSender.send(message);
            log.debug("HTML email sent successfully to: {}", to);

        } catch (MessagingException e) {
            log.error("Failed to send HTML email to {}: {}", to, e.getMessage(), e);
            throw new RuntimeException("Failed to send email: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error sending email to {}: {}", to, e.getMessage(), e);
            throw new RuntimeException("Failed to send email: " + e.getMessage(), e);
        }
    }

    public void sendHtmlEmailWithAttachment(String to, String subject, String body, byte[] imageBytes, String cid, String imageName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, appName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true); // true indicates HTML

            // Attach QR code image với CID - đảm bảo imageBytes không null và có dữ liệu
            if (imageBytes != null && imageBytes.length > 0) {
                ByteArrayResource imageResource = new ByteArrayResource(imageBytes) {
                    @Override
                    public String getFilename() {
                        return imageName != null ? imageName : "qrcode.png";
                    }
                };
                helper.addInline(cid, imageResource, "image/png");
                log.debug("QR code image attached with CID: {}", cid);
            } else {
                log.warn("QR code image bytes is null or empty, skipping attachment");
            }

            mailSender.send(message);
            log.debug("HTML email with QR code attachment sent successfully to: {}", to);

        } catch (MessagingException e) {
            log.error("Failed to send HTML email with attachment to {}: {}", to, e.getMessage(), e);
            throw new RuntimeException("Failed to send email: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error sending email with attachment to {}: {}", to, e.getMessage(), e);
            throw new RuntimeException("Failed to send email: " + e.getMessage(), e);
        }
    }

    /**
     * Gửi email HTML với nhiều inline attachments (logo + QR code)
     */
    public void sendHtmlEmailWithAttachments(String to, String subject, String body, 
                                             byte[] qrCodeBytes, String qrCodeCid,
                                             byte[] logoBytes, String logoCid) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, appName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true); // true indicates HTML

            // Attach QR code image
            if (qrCodeBytes != null && qrCodeBytes.length > 0 && qrCodeCid != null) {
                ByteArrayResource qrCodeResource = new ByteArrayResource(qrCodeBytes) {
                    @Override
                    public String getFilename() {
                        return "qrcode.png";
                    }
                };
                helper.addInline(qrCodeCid, qrCodeResource, "image/png");
                log.debug("QR code image attached with CID: {}", qrCodeCid);
            }

            // Attach logo image
            if (logoBytes != null && logoBytes.length > 0 && logoCid != null) {
                ByteArrayResource logoResource = new ByteArrayResource(logoBytes) {
                    @Override
                    public String getFilename() {
                        return "logo.jpg";
                    }
                };
                helper.addInline(logoCid, logoResource, "image/png");
                log.debug("Logo image attached with CID: {}", logoCid);
            }

            mailSender.send(message);
            log.debug("HTML email with attachments sent successfully to: {}", to);

        } catch (MessagingException e) {
            log.error("Failed to send HTML email with attachments to {}: {}", to, e.getMessage(), e);
            throw new RuntimeException("Failed to send email: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error sending email with attachments to {}: {}", to, e.getMessage(), e);
            throw new RuntimeException("Failed to send email: " + e.getMessage(), e);
        }
    }

    /**
     * Đọc logo từ resources
     */
    private byte[] loadLogoFromResources() {
        try {
            ClassPathResource logoResource = new ClassPathResource("image/logo.jpg");
            if (logoResource.exists()) {
                try (InputStream inputStream = logoResource.getInputStream()) {
                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    byte[] buffer = new byte[1024];
                    int bytesRead;
                    while ((bytesRead = inputStream.read(buffer)) != -1) {
                        baos.write(buffer, 0, bytesRead);
                    }
                    log.debug("Logo loaded successfully, size: {} bytes", baos.size());
                    return baos.toByteArray();
                }
            } else {
                log.warn("Logo file not found in resources/image/logo.jpg");
                return null;
            }
        } catch (Exception e) {
            log.error("Error loading logo from resources: {}", e.getMessage(), e);
            return null;
        }
    }

    // Giữ lại phương thức cũ cho tương thích
    public void sendPlainTextEmail(String to, String subject, String body) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "utf-8");
            try {
                InternetAddress fromAddress = new InternetAddress(fromEmail, appName, "UTF-8");
                helper.setFrom(fromAddress);
            } catch (UnsupportedEncodingException e) {
                // Fallback: chỉ dùng email không có personal name
                log.warn("Unsupported encoding for from address, using email only: {}", e.getMessage());
                helper.setFrom(fromEmail);
            }
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, false); // false indicates plain text
            mailSender.send(message);
            log.debug("Plain text email sent successfully to: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send plain text email to {}: {}", to, e.getMessage(), e);
            throw new RuntimeException("Failed to send email: " + e.getMessage(), e);
        }
    }

    private String buildVerificationEmailHtml(String name, String verificationUrl) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Chào mừng đến với %s</h1>
                    </div>
                    <div class="content">
                        <h2>Xin chào %s,</h2>
                        <p>Cảm ơn bạn đã đăng ký tài khoản tại %s. Để hoàn tất đăng ký, vui lòng xác thực địa chỉ email của bạn bằng cách nhấp vào nút bên dưới:</p>
                        
                        <div style="text-align: center;">
                            <a href="%s" class="button">Xác Thực Email</a>
                        </div>
                        
                        <p>Nếu nút không hoạt động, bạn có thể sao chép và dán đường link sau vào trình duyệt:</p>
                        <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">%s</p>
                        
                        <p>Liên kết xác thực sẽ hết hạn sau 24 giờ.</p>
                        <p>Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email này.</p>
                    </div>
                    <div class="footer">
                        <p>© 2024 %s. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(appName, name, appName, verificationUrl, verificationUrl, appName);
    }

    private String buildPasswordResetEmailHtml(String name, String resetUrl, String resetToken) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 12px 30px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                    .token { font-family: monospace; background: #eee; padding: 10px; border-radius: 5px; margin: 10px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Đặt Lại Mật Khẩu</h1>
                    </div>
                    <div class="content">
                        <h2>Xin chào %s,</h2>
                        <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại %s.</p>
                        
                        <div style="text-align: center;">
                            <a href="%s" class="button">Đặt Lại Mật Khẩu</a>
                        </div>
                        
                        <p>Nếu bạn không thể nhấp vào nút trên, hãy sử dụng mã token sau:</p>
                        <div class="token">%s</div>
                        
                        <p>Hoặc sao chép và dán đường link sau vào trình duyệt:</p>
                        <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">%s</p>
                        
                        <p><strong>Lưu ý:</strong> Liên kết đặt lại mật khẩu sẽ hết hạn sau 1 giờ.</p>
                        <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
                    </div>
                    <div class="footer">
                        <p>© 2024 %s. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(name, appName, resetUrl, resetToken, resetUrl, appName);
    }

    private String buildWelcomeEmailHtml(String name) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #4facfe; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Chào Mừng Đến Với %s</h1>
                    </div>
                    <div class="content">
                        <h2>Xin chào %s,</h2>
                        <p>Chúc mừng! Tài khoản của bạn đã được xác thực thành công và bạn đã chính thức trở thành thành viên của %s.</p>
                        
                        <h3>Bạn có thể:</h3>
                        <div class="feature">
                            <strong>🎯 Đặt phòng dễ dàng</strong>
                            <p>Tìm và đặt phòng khách sạn phù hợp với nhu cầu của bạn</p>
                        </div>
                        <div class="feature">
                            <strong>📱 Quản lý đặt chỗ</strong>
                            <p>Theo dõi và quản lý các đặt phòng của bạn một cách thuận tiện</p>
                        </div>
                        <div class="feature">
                            <strong>⭐ Đánh giá dịch vụ</strong>
                            <p>Chia sẻ trải nghiệm của bạn sau mỗi lần lưu trú</p>
                        </div>
                        
                        <p>Bắt đầu trải nghiệm ngay bây giờ:</p>
                        <div style="text-align: center; margin: 20px 0;">
                            <a href="%s" style="display: inline-block; padding: 12px 30px; background: #4facfe; color: white; text-decoration: none; border-radius: 5px;">Khám Phá Ngay</a>
                        </div>
                        
                        <p>Nếu bạn có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với chúng tôi.</p>
                    </div>
                    <div class="footer">
                        <p>© 2024 %s. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(appName, name, appName, baseUrl, appName);
    }

    private String buildBookingConfirmationEmailHtml(String name, String bookingCode) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg,rgb(233, 4, 202) 0%,rgb(202, 144, 179) 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .booking-info { background: white; padding: 20px; border-radius: 5px; margin: 15px 0; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Đặt Phòng Thành Công</h1>
                    </div>
                    <div class="content">
                        <h2>Xin chào %s,</h2>
                        <p>Cảm ơn bạn đã đặt phòng tại %s. Đơn đặt của bạn đã được xác nhận.</p>
                        
                        <div class="booking-info">
                            <h3>Thông tin đặt phòng:</h3>
                            <p><strong>Mã đặt phòng:</strong> %s</p>
                            <p><strong>Trạng thái:</strong> Đã xác nhận</p>
                        </div>
                        
                        <p>Bạn có thể theo dõi trạng thái đặt phòng trong tài khoản của mình.</p>
                        
                        <div style="text-align: center; margin: 20px 0;">
                            <a href="%s/profile/bookings" style="display: inline-block; padding: 12px 30px; background: #5ee7df; color: white; text-decoration: none; border-radius: 5px;">Xem Đặt Phòng</a>
                        </div>
                        
                        <p>Chúng tôi rất mong được đón tiếp bạn!</p>
                    </div>
                    <div class="footer">
                        <p>© 2024 %s. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(name, appName, bookingCode, baseUrl, appName);
    }

    @Async
    public void sendBookingConfirmationFromQR(String to, String name, BookingQRRequest booking) {
        String subject = "Xác nhận đặt phòng từ QR Code - " + appName;
        try {
            // Tạo QR code image
            String qrCodeUrl = generateQRCodeUrl(booking);
            byte[] qrCodeImageBytes = generateQRCodeImage(qrCodeUrl);
            String qrCodeCid = "qrCode_" + UUID.randomUUID().toString().replace("-", "");
            
            // Load logo từ resources
            byte[] logoBytes = loadLogoFromResources();
            String logoCid = "logo_" + UUID.randomUUID().toString().replace("-", "");
            
            // Build HTML với CID references cho cả logo và QR code
            String body = buildBookingConfirmationFromQRHtml(name, booking, qrCodeCid, logoCid);
            
            // Gửi email với cả logo và QR code
            sendHtmlEmailWithAttachments(to, subject, body, qrCodeImageBytes, qrCodeCid, logoBytes, logoCid);
            log.info("Booking confirmation email from QR sent to: {}", to);
        } catch (Exception e) {
            log.error("Error sending booking confirmation email with QR: {}", e.getMessage(), e);
            // Fallback: gửi email không có QR code và logo
            String body = buildBookingConfirmationFromQRHtml(name, booking, null, null);
            sendHtmlEmail(to, subject, body);
        }
    }

    private String buildBookingConfirmationFromQRHtml(String name, BookingQRRequest booking, String qrCodeCid, String logoCid) {
        NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(new Locale("vi", "VN"));
        
        String amountPaid = booking.getAmountPaid() != null 
            ? currencyFormat.format(booking.getAmountPaid()) 
            : "0₫";
        String amountToPay = booking.getAmountToPay() != null 
            ? currencyFormat.format(booking.getAmountToPay()) 
            : "0₫";
        String remainingDue = booking.getRemainingDue() != null 
            ? currencyFormat.format(booking.getRemainingDue()) 
            : "0₫";
        
        String paymentMethodText = "cash".equalsIgnoreCase(booking.getPaymentMethod()) 
            ? "Thanh toán tại quầy" 
            : "VNPay";
        
        String paymentStatus = booking.getAmountPaid() != null && booking.getAmountPaid().compareTo(BigDecimal.ZERO) > 0
            ? "Đã thanh toán"
            : "Chưa thanh toán";
        
        // Đảm bảo tất cả giá trị không null
        String bookingId = booking.getBookingId() != null ? booking.getBookingId() : "N/A";
        String roomType = booking.getRoomType() != null ? booking.getRoomType() : "N/A";
        String roomNumber = booking.getRoomNumber() != null ? booking.getRoomNumber() : "Chưa xác định";
        String checkin = booking.getCheckin() != null ? booking.getCheckin() : "N/A";
        String checkout = booking.getCheckout() != null ? booking.getCheckout() : "N/A";
        String customer = booking.getCustomer() != null ? booking.getCustomer() : "N/A";
        // Format createdAt sang timezone Việt Nam (UTC+7)
        String createdAt = formatDateTimeToVietnam(booking.getCreatedAt());
        String paymentDetails = buildPaymentDetailsHtml(booking, amountPaid, amountToPay, remainingDue);
        
        // Tạo logo HTML
        String logoImageHtml = "";
        if (logoCid != null && !logoCid.isEmpty()) {
            logoImageHtml = String.format(
                "<img src=\"cid:%s\" alt=\"%s Logo\" style=\"max-width: 150px; height: auto; display: block; margin: 0 auto 20px;\" />",
                logoCid, appName
            );
            log.debug("Using CID for logo: {}", logoCid);
        }
        
        // Tạo QR code image HTML
        String qrCodeUrl = generateQRCodeUrl(booking);
        String qrCodeImageHtml;
        
        if (qrCodeCid != null && !qrCodeCid.isEmpty()) {
            // Dùng CID để embed image từ attachment
            // Format: <img src="cid:xxx" /> - Gmail yêu cầu format này
            qrCodeImageHtml = String.format(
                "<img src=\"cid:%s\" alt=\"QR Code\" style=\"max-width: 200px; height: auto; border: 2px solid #5ee7df; border-radius: 8px; padding: 10px; background: white; display: block; margin: 0 auto;\" />",
                qrCodeCid
            );
            log.debug("Using CID for QR code: {}", qrCodeCid);
        } else {
            // Fallback: dùng QR code API online (hiển thị tốt hơn base64 trong Gmail)
            String encodedUrl = java.net.URLEncoder.encode(qrCodeUrl, java.nio.charset.StandardCharsets.UTF_8);
            String qrCodeApiUrl = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + encodedUrl;
            qrCodeImageHtml = String.format(
                "<img src=\"%s\" alt=\"QR Code\" style=\"max-width: 200px; height: auto; border: 2px solid #5ee7df; border-radius: 8px; padding: 10px; background: white; display: block; margin: 0 auto;\" />",
                qrCodeApiUrl
            );
            log.debug("Using QR code API URL as fallback");
        }
        
        // Sử dụng String.format thay vì .formatted() để tránh lỗi với CSS colors
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg,rgb(231, 94, 199) 0%%,rgb(202, 144, 183) 100%%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .booking-info { background: white; padding: 20px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #5ee7df; }
                    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
                    .info-label { font-weight: bold; color: #666; }
                    .info-value { color: #333; }
                    .payment-info { background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 15px 0; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        %s
                        <h1>Xác Nhận Đặt Phòng</h1>
                    </div>
                    <div class="content">
                        <h2>Xin chào %s,</h2>
                        <p>Cảm ơn bạn đã đặt phòng tại %s. Thông tin đặt phòng của bạn:</p>
                        
                        <div class="booking-info">
                            <h3>Thông tin đặt phòng</h3>
                            <div class="info-row">
                                <span class="info-label">Mã đặt phòng:</span>
                                <span class="info-value"><strong>%s</strong></span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Loại phòng:</span>
                                <span class="info-value">%s</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Số phòng:</span>
                                <span class="info-value">%s</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Ngày nhận phòng:</span>
                                <span class="info-value">%s</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Ngày trả phòng:</span>
                                <span class="info-value">%s</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Khách hàng:</span>
                                <span class="info-value">%s</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Ngày tạo:</span>
                                <span class="info-value">%s</span>
                            </div>
                        </div>
                        
                        <div class="payment-info">
                            <h3>Thông tin thanh toán</h3>
                            <div class="info-row">
                                <span class="info-label">Phương thức:</span>
                                <span class="info-value">%s</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Trạng thái:</span>
                                <span class="info-value">%s</span>
                            </div>
                            %s
                        </div>
                        
                        <div style="text-align: center; margin: 20px 0; padding: 20px; background: white; border-radius: 10px; border: 2px solid #5ee7df;">
                            <h3 style="color: #333; margin-bottom: 15px;">Mã QR Đặt Phòng</h3>
                            <p style="color: #666; font-size: 14px; margin-bottom: 15px;">Quét mã QR để xem thông tin đặt phòng</p>
                            %s
                            <p style="color: #666; font-size: 12px; margin-top: 10px;">Mã đặt phòng: <strong>%s</strong></p>
                            <p style="color: #666; font-size: 12px; margin-top: 5px;">Ngày tạo: <strong>%s</strong></p>
                        </div>
                        
                        <div style="text-align: center; margin: 20px 0;">
                            <a href="%s" style="display: inline-block; padding: 12px 30px; background: #5ee7df; color: white; text-decoration: none; border-radius: 5px;">Xem Trang Chủ</a>
                        </div>
                        
                        <p>Chúng tôi rất mong được đón tiếp bạn!</p>
                    </div>
                    <div class="footer">
                        <p>© 2024 %s. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """,
                logoImageHtml,
                name != null ? name : "Quý khách",
                appName,
                bookingId,
                roomType,
                roomNumber,
                checkin,
                checkout,
                customer,
                createdAt,
                paymentMethodText,
                paymentStatus,
                paymentDetails,
                qrCodeImageHtml,
                bookingId,
                createdAt,
                baseUrl,
                appName
            );
    }

    /**
     * Tạo QR code URL từ booking data
     */
    private String generateQRCodeUrl(BookingQRRequest booking) {
        String bookingId = booking.getBookingId() != null ? booking.getBookingId() : "N/A";
        String roomType = booking.getRoomType() != null ? booking.getRoomType() : "N/A";
        String roomNumber = booking.getRoomNumber() != null ? booking.getRoomNumber() : "N/A";
        String checkin = booking.getCheckin() != null ? booking.getCheckin().toString() : "N/A";
        String checkout = booking.getCheckout() != null ? booking.getCheckout().toString() : "N/A";
        String customer = booking.getCustomer() != null ? booking.getCustomer() : "N/A";
        
        StringBuilder jsonBuilder = new StringBuilder();
        jsonBuilder.append("{");
        jsonBuilder.append("\"bookingId\":\"").append(escapeJson(bookingId)).append("\",");
        jsonBuilder.append("\"roomType\":\"").append(escapeJson(roomType)).append("\",");
        jsonBuilder.append("\"roomNumber\":\"").append(escapeJson(roomNumber)).append("\",");
        jsonBuilder.append("\"checkin\":\"").append(escapeJson(checkin)).append("\",");
        jsonBuilder.append("\"checkout\":\"").append(escapeJson(checkout)).append("\",");
        jsonBuilder.append("\"customer\":\"").append(escapeJson(customer)).append("\",");
        jsonBuilder.append("\"paymentMethod\":\"").append(booking.getPaymentMethod() != null ? booking.getPaymentMethod() : "vnpay").append("\",");
        jsonBuilder.append("\"amountPaid\":").append(booking.getAmountPaid() != null ? booking.getAmountPaid() : "0").append(",");
        jsonBuilder.append("\"amountToPay\":").append(booking.getAmountToPay() != null ? booking.getAmountToPay() : "0").append(",");
        jsonBuilder.append("\"remainingDue\":").append(booking.getRemainingDue() != null ? booking.getRemainingDue() : "0");
        if (booking.getCustomerEmail() != null && !booking.getCustomerEmail().isEmpty()) {
            jsonBuilder.append(",\"customerEmail\":\"").append(escapeJson(booking.getCustomerEmail())).append("\"");
        }
        if (booking.getCreatedAt() != null && !booking.getCreatedAt().isEmpty()) {
            jsonBuilder.append(",\"createdAt\":\"").append(escapeJson(booking.getCreatedAt())).append("\"");
        }
        jsonBuilder.append("}");
        
        return frontendUrl + "/booking-detail?data=" + 
            java.net.URLEncoder.encode(jsonBuilder.toString(), java.nio.charset.StandardCharsets.UTF_8);
    }

    /**
     * Tạo QR code image bytes từ URL
     */
    private byte[] generateQRCodeImage(String url) throws Exception {
        log.debug("Generating QR code for URL: {}", url);
        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        BitMatrix bitMatrix = qrCodeWriter.encode(url, BarcodeFormat.QR_CODE, 200, 200);
        
        BufferedImage bufferedImage = MatrixToImageWriter.toBufferedImage(bitMatrix);
        
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        javax.imageio.ImageIO.write(bufferedImage, "png", baos);
        byte[] imageBytes = baos.toByteArray();
        log.debug("QR code image generated, size: {} bytes", imageBytes.length);
        return imageBytes;
    }

    /**
     * Escape JSON string để tránh lỗi format
     */
    private String escapeJson(String str) {
        if (str == null) return "";
        return str.replace("\\", "\\\\")
                  .replace("\"", "\\\"")
                  .replace("\n", "\\n")
                  .replace("\r", "\\r")
                  .replace("\t", "\\t");
    }

    /**
     * Tạo QR code image từ URL và convert sang base64
     */
    private String generateQRCodeBase64(String url) {
        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(url, BarcodeFormat.QR_CODE, 200, 200);
            
            BufferedImage bufferedImage = MatrixToImageWriter.toBufferedImage(bitMatrix);
            
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            javax.imageio.ImageIO.write(bufferedImage, "png", baos);
            byte[] imageBytes = baos.toByteArray();
            
            return Base64.getEncoder().encodeToString(imageBytes);
        } catch (Exception e) {
            log.error("Error generating QR code: {}", e.getMessage(), e);
            // Trả về empty string nếu lỗi, email vẫn gửi được nhưng không có QR code
            return "";
        }
    }

    private String buildPaymentDetailsHtml(BookingQRRequest booking, String amountPaid, String amountToPay, String remainingDue) {
        StringBuilder details = new StringBuilder();
        
        if ("cash".equalsIgnoreCase(booking.getPaymentMethod())) {
            // Thanh toán tại quầy
            if (booking.getAmountToPay() != null && booking.getAmountToPay().compareTo(BigDecimal.ZERO) > 0) {
                details.append(String.format(
                    "<div class=\"info-row\"><span class=\"info-label\">Số tiền cần thanh toán tại quầy:</span><span class=\"info-value\"><strong>%s</strong></span></div>",
                    amountToPay
                ));
            }
            // Nếu đã đặt cọc, hiển thị số tiền đã đặt cọc
            if (booking.getAmountPaid() != null && booking.getAmountPaid().compareTo(BigDecimal.ZERO) > 0) {
                details.append(String.format(
                    "<div class=\"info-row\"><span class=\"info-label\">Số tiền đã đặt cọc:</span><span class=\"info-value\">%s</span></div>",
                    amountPaid
                ));
            }
            // Hiển thị số tiền còn lại nếu có
            if (booking.getRemainingDue() != null && booking.getRemainingDue().compareTo(BigDecimal.ZERO) > 0) {
                details.append(String.format(
                    "<div class=\"info-row\"><span class=\"info-label\">Số tiền còn lại cần thanh toán:</span><span class=\"info-value\"><strong>%s</strong></span></div>",
                    remainingDue
                ));
            }
            // Thêm lưu ý cho thanh toán tại quầy
            details.append("<div style=\"margin-top: 15px; padding: 10px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;\">");
            details.append("<p style=\"margin: 0; color: #856404; font-size: 14px;\"><strong>Lưu ý:</strong> Vui lòng đến khách sạn để hoàn tất thủ tục thanh toán trước khi nhận phòng.</p>");
            details.append("</div>");
        } else {
            // Thanh toán VNPay
            if (booking.getAmountPaid() != null && booking.getAmountPaid().compareTo(BigDecimal.ZERO) > 0) {
                details.append(String.format(
                    "<div class=\"info-row\"><span class=\"info-label\">Số tiền đã thanh toán:</span><span class=\"info-value\"><strong>%s</strong></span></div>",
                    amountPaid
                ));
            }
            if (booking.getRemainingDue() != null && booking.getRemainingDue().compareTo(BigDecimal.ZERO) > 0) {
                details.append(String.format(
                    "<div class=\"info-row\"><span class=\"info-label\">Số tiền còn lại:</span><span class=\"info-value\">%s</span></div>",
                    remainingDue
                ));
            }
        }
        
        return details.toString();
    }

    /**
     * Format datetime string sang timezone Việt Nam (UTC+7)
     * Hỗ trợ nhiều format: ISO 8601 (UTC), LocalDateTime string, etc.
     */
    private String formatDateTimeToVietnam(String dateTimeStr) {
        if (dateTimeStr == null || dateTimeStr.isEmpty() || "N/A".equals(dateTimeStr)) {
            return "N/A";
        }
        
        try {
            // Thử parse ISO 8601 format (UTC) - ví dụ: "2025-11-07T15:10:08.473Z"
            if (dateTimeStr.contains("T")) {
                Instant instant;
                if (dateTimeStr.endsWith("Z")) {
                    // ISO 8601 với Z (UTC)
                    instant = Instant.parse(dateTimeStr);
                } else if ((dateTimeStr.contains("+") || (dateTimeStr.contains("-") && dateTimeStr.length() > 19)) && dateTimeStr.matches(".*[+-]\\d{2}:\\d{2}")) {
                    // ISO 8601 với timezone offset
                    instant = Instant.parse(dateTimeStr);
                } else {
                    // LocalDateTime format - giả định là UTC
                    instant = Instant.parse(dateTimeStr + "Z");
                }
                
                ZonedDateTime vietnamTime = instant.atZone(ZoneId.of("Asia/Ho_Chi_Minh"));
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss", Locale.forLanguageTag("vi-VN"));
                return vietnamTime.format(formatter);
            }
            
            // Nếu không parse được, trả về nguyên bản
            return dateTimeStr;
        } catch (Exception e) {
            log.warn("Error formatting datetime to Vietnam timezone: {}", dateTimeStr, e);
            return dateTimeStr;
        }
    }
}