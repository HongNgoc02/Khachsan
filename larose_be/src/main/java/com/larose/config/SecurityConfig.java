package com.larose.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod; // ✅ SỬA: Thêm import này
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;

import java.util.Arrays;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthFilter jwtAuthFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(request -> {
                CorsConfiguration config = new CorsConfiguration();
                config.setAllowedOriginPatterns(Arrays.asList("http://localhost:5173", "http://localhost:3000"));
                config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
                config.setAllowedHeaders(Arrays.asList("*"));
                config.setAllowCredentials(true);
                config.setMaxAge(3600L);
                return config;
            }))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                // 1. CÁC ENDPOINT CÔNG KHAI (permitAll)
                .requestMatchers(
                    "/api/auth/**",
                    "/api/statistical/**",
                    // "/api/rooms/**", // ✅ SỬA: Xóa dòng này đi, đưa xuống dưới
                    "/api/public/**",
                    "/api/email/**",
                    "/api/health",
                    "/api/config",
                    "/api/room-types/**", // Giữ lại, vì booking.service dùng
                    "/api/booking/check-availability",
                    "/api/vnpay/submit-order",
                    "/api/vnpay/vnpay_return",
                    "/api/vnpay/**",
                    "/api/vnpay/vnpay_return/qr",
                    "/api/payments/webhook/**",
                    "/uploads/**", // ✅ SỬA: Cho phép truy cập static files (ảnh/video đã upload)
                    "/images/**", // ✅ Cho phép truy cập logo và images từ resources
                    "/v3/api-docs/**",
                    "/v3/api-docs",
                    "/swagger-ui/**",
                    "/swagger-ui.html"
                ).permitAll()

                // ✅ SỬA: Thêm khối này để cho phép xem (GET)
                // Đây là API cho HomePage, RoomsPage, AboutPage
                .requestMatchers(HttpMethod.GET,
                		"/api/rooms",
                	    "/api/rooms/*",
                	    "/api/rooms/**",
                	    "/api/reviews",
                	    "/api/reviews/*",
                	    "/api/reviews/**",
                	    "/api/booking/booking-date/**",
                	    "/api/services/active" // Cho phép xem dịch vụ công khai
                ).permitAll()
                
                // ✅ SỬA: Cho phép OPTIONS (CORS preflight) cho tất cả endpoints
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // 2. CÁC ENDPOINT CỦA USER (Yêu cầu xác thực)
                // Đặt phòng (POST), hủy phòng (PUT), xem lịch sử (GET) mới cần đăng nhập
                .requestMatchers(
                    "/api/users/profile/**",
                    "/api/users/bookings/**",
                    "/api/users/reviews/**",
                    "/api/users/change-password",
                    "/api/booking/**", // ✅ SỬA: Rule này BẢO VỆ việc đặt phòng (POST/PUT)
                    "/api/notifications/**",
                    "/api/conversations/**",
                    "/api/payments/create",
                    "/api/payments/transactions",
                    "/api/upload/**", // ✅ SỬA: Yêu cầu authentication cho upload
                    "/api/users/**",
                    "/api/transaction",
                    "/api/transaction/**",
                    "/api/services/booking/**", // Quản lý dịch vụ trong booking
                    "/api/services/booking-service/**" // Cập nhật/xóa dịch vụ
                ).hasAnyRole("USER", "ADMIN")
                
                // POST review cũng cần đăng nhập
                .requestMatchers(HttpMethod.POST, "/api/reviews").hasAnyRole("USER", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/reviews").hasAnyRole("USER", "ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/reviews/**").hasAnyRole("USER", "ADMIN")


                // 3. CÁC ENDPOINT CỦA ADMIN
                .requestMatchers(
                    "/api/reviews/admin",
                    "/api/reviews/response/**",
                    "/api/staff/**",
                    "/api.admin/**",
                    "/api/manager/**"
                ).hasRole("ADMIN")
                
                // Admin cập nhật status của review
                .requestMatchers(HttpMethod.PUT, "/api/reviews/*/status").hasRole("ADMIN")
                
                // Admin quản lý danh mục dịch vụ
                .requestMatchers(HttpMethod.POST, "/api/services").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/services/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/services/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/services").hasRole("ADMIN")

                // 4. MỌI REQUEST KHÁC
                .anyRequest().authenticated()
            )
            .httpBasic(httpBasic -> httpBasic.disable())
            .formLogin(form -> form.disable())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            UserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return new ProviderManager(provider);
    }
}