-- Create services table
CREATE TABLE IF NOT EXISTS services (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(12, 2) NOT NULL,
    unit VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    image_url VARCHAR(500),
    category VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create booking_services table (junction table)
CREATE TABLE IF NOT EXISTS booking_services (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    service_id BIGINT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price_per_unit DECIMAL(12, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- Insert sample services
INSERT INTO services (name, description, price, unit, is_active, category) VALUES
('Ăn sáng buffet', 'Bữa sáng buffet phong phú với nhiều món Á - Âu', 150000, 'người/bữa', TRUE, 'FOOD'),
('Ăn sáng phòng', 'Bữa sáng phục vụ tại phòng', 200000, 'người/bữa', TRUE, 'FOOD'),
('Spa massage toàn thân', 'Dịch vụ massage toàn thân thư giãn 90 phút', 500000, 'người/lần', TRUE, 'SPA'),
('Spa chăm sóc da mặt', 'Chăm sóc da mặt chuyên sâu 60 phút', 400000, 'người/lần', TRUE, 'SPA'),
('Đưa đón sân bay', 'Dịch vụ đưa đón sân bay bằng xe riêng', 300000, 'lượt', TRUE, 'TRANSPORT'),
('Thuê xe máy', 'Thuê xe máy theo ngày', 150000, 'xe/ngày', TRUE, 'TRANSPORT'),
('Giặt ủi', 'Dịch vụ giặt ủi quần áo', 50000, 'kg', TRUE, 'OTHER'),
('Minibar', 'Nước uống và đồ ăn nhẹ trong minibar', 100000, 'phần', TRUE, 'BEVERAGE');

