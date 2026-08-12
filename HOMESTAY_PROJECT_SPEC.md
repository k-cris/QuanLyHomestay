# Hệ Thống Quản Lý Homestay — Đặc tả dự án (dùng cho Vibecoding)

> File này tổng hợp toàn bộ nghiệp vụ, actor, class diagram, ERD và business rules
> từ file StarUML (`HeThongQuanLyHomestay.mdj`) và báo cáo niên luận, viết lại dưới
> dạng spec kỹ thuật để AI code (Claude Code, Cursor, v.v.) có thể đọc và sinh code
> chính xác, nhất quán xuyên suốt dự án. Dán file này vào đầu mỗi phiên vibecoding.

---

## 1. Tổng quan hệ thống

**Tên đề tài:** Hệ thống quản lý Homestay (đặt phòng trực tuyến kiểu Airbnb thu nhỏ)

**Mục tiêu:**
- Tự động hóa quy trình đăng/tìm/đặt phòng Homestay, thanh toán, hoàn tiền, đánh giá.
- Phân quyền rõ ràng theo 4 vai trò: `GUEST → USER → HOST → ADMIN`.
- Có tác nhân hệ thống (`SYSTEM`) chạy ngầm để tự hủy đơn quá hạn và tự hoàn tiền.

**Kiến trúc:** Client – Server, tách 3 lớp Frontend / Backend / Database, giao tiếp qua REST API.

---

## 2. Tech Stack (bám theo lộ trình đã làm)

| Layer | Công nghệ |
|---|---|
| Frontend | ReactJS (Vite), React Router, Axios |
| Backend | Spring Boot, Spring Data JPA, Spring Security (JWT) |
| Database | MySQL |
| Bản đồ | VietMap SDK (hiển thị vị trí Homestay, tìm theo khu vực) |
| Lưu trữ ảnh | Cloudinary |
| Thống kê | Java Stream API (backend) + Recharts (frontend, Admin/Host Dashboard) |

---

## 3. Actor & phân quyền (Role-Based Access Control)

| Actor | Role code | Mô tả / quyền hạn |
|---|---|---|
| Khách vãng lai | `GUEST` (chưa đăng nhập) | Xem trang chủ, tìm kiếm/lọc Homestay, xem chi tiết, xem bản đồ, đăng ký tài khoản. Không đặt phòng được. |
| Khách hàng | `ROLE_USER` (mặc định sau đăng ký) | Mọi quyền Guest + đặt phòng, ghi chú, thanh toán, xem lịch sử đơn, nhận hoàn tiền, gửi yêu cầu trở thành Host, đánh giá sau khi hoàn thành lưu trú. |
| Chủ Homestay | `ROLE_HOST` (User được Admin duyệt hồ sơ) | Mọi quyền User + truy cập Host Dashboard, thêm/sửa/xóa Homestay của mình, đọc ghi chú khách, duyệt/từ chối đơn đặt phòng, xem thống kê Homestay của mình. |
| Quản trị viên | `ROLE_ADMIN` (khởi tạo sẵn) | Mọi quyền User + Admin Dashboard: thống kê toàn hệ thống, khóa/mở tài khoản, duyệt/từ chối hồ sơ xin lên Host. |
| Hệ thống | `SYSTEM` (cron job / scheduler) | Tự động hủy đơn `PENDING` quá hạn thanh toán/quá hạn duyệt; tự động gọi API hoàn tiền. |

**Quy tắc phân quyền chung:**
- Đăng ký mới luôn nhận `ROLE_USER`.
- Chuyển `USER → HOST` chỉ qua quy trình `HostRequest` được Admin duyệt.
- Điều hướng Dashboard dựa trên role lấy từ JWT token.

---

## 4. Mô hình dữ liệu (Class Diagram → Entity)

### 4.1 Entity: `User`
| Field | Type | Ghi chú |
|---|---|---|
| id | Long | PK |
| email | String | unique |
| password | String | hashed (BCrypt) |
| fullName | String | |
| phone | String | |
| avatar | String | Cloudinary URL |
| role | RoleEnum | USER / HOST / ADMIN |
| bankName | String | dùng khi hoàn tiền |
| bankHolder | String | |
| bankAccount | String | |

Method nghiệp vụ: `register()`, `login()`, `updateProfile()`, `submitHostRequest()`

### 4.2 Entity: `HostRequest`
| Field | Type | Ghi chú |
|---|---|---|
| id | Long | PK |
| userId | Long | FK → User |
| idCardNumber | String | CCCD |
| licenseImageUrl | String | ảnh giấy tờ, upload Cloudinary |
| status | RequestStatusEnum | PENDING / APPROVED / REJECTED |
| adminNote | String | ghi chú khi duyệt/từ chối |

Method: `approve(adminId)`, `reject(adminId, note)`

### 4.3 Entity: `Homestay`
| Field | Type | Ghi chú |
|---|---|---|
| id | Long | PK |
| hostId | Long | FK → User (chủ nhà) |
| title | String | |
| description | String | |
| address | String | |
| city | String | dùng để lọc theo thành phố |
| pricePerNight | Decimal | giá/đêm |
| maxGuests | Integer | |
| status | HomestayStatusEnum | ACTIVE / INACTIVE |
| averageRating | Double | cập nhật tự động từ Review |
| latitude / longitude | Double | phục vụ VietMap SDK (bổ sung so với bản gốc để hiển thị bản đồ) |

Method: `createHomestay()`, `updateHomestay()`, `updateAverageRating()`

### 4.4 Entity: `HomestayImage`
| Field | Type | Ghi chú |
|---|---|---|
| id | Long | PK |
| homestayId | Long | FK → Homestay |
| imageUrl | String | Cloudinary URL |
| isPrimary | Boolean | ảnh đại diện |

### 4.5 Entity: `Amenity`
| Field | Type | Ghi chú |
|---|---|---|
| id | Long | PK |
| name | String | vd: Wifi, Bãi đỗ xe, Hồ bơi |
| icon | String | tên icon (lucide-react hoặc tương tự) |

### 4.6 Bảng trung gian: `HomestayAmenities`
- Many-to-many giữa `Homestay` và `Amenity`.

### 4.7 Entity: `Booking`
| Field | Type | Ghi chú |
|---|---|---|
| id | Long | PK |
| bookingCode | String | mã đơn hiển thị cho khách |
| guestId | Long | FK → User |
| homestayId | Long | FK → Homestay |
| checkinDate | LocalDate | |
| checkoutDate | LocalDate | |
| totalGuests | Integer | |
| totalPrice | Double | |
| note | String | ghi chú của khách (vd: mang thú cưng, check-in muộn) |
| status | BookingStatusEnum | PENDING / CONFIRM / REJECTED / CANCELLED / COMPLETED |

Method: `createBooking()`, `confirmBooking()`, `rejectBooking()`, `cancelBooking()`

### 4.8 Entity: `Payment`
| Field | Type | Ghi chú |
|---|---|---|
| id | Long | PK |
| bookingId | Long | FK → Booking (1-1) |
| paymentMethod | String | |
| transactionCode | String | |
| amount | Double | |
| status | PaymentStatusEnum | UNPAID / PAID / REFUNDED |
| paidAt | LocalDateTime | |

Method: `processPayment()`, `executeRefund()`

### 4.9 Entity: `Review`
| Field | Type | Ghi chú |
|---|---|---|
| id | Long | PK |
| bookingId | Long | FK → Booking (1-1, chỉ tạo được sau khi COMPLETED) |
| guestId | Long | FK → User |
| homestayId | Long | FK → Homestay |
| rating | Integer | 1–5 sao |
| comment | String | |

Method: `createReview()`

### 4.10 Enum tổng hợp
```
RoleEnum:            USER, HOST, ADMIN
RequestStatusEnum:   PENDING, APPROVED, REJECTED
HomestayStatusEnum:  ACTIVE, INACTIVE
BookingStatusEnum:   PENDING, CONFIRM, REJECTED, CANCELLED, COMPLETED
PaymentStatusEnum:   UNPAID, PAID, REFUNDED
```

### 4.11 Quan hệ chính (ERD)
- User (1) — (N) HostRequest
- User/Host (1) — (N) Homestay
- Homestay (1) — (N) HomestayImage
- Homestay (N) — (N) Amenity qua HomestayAmenities
- User (1) — (N) Booking, Homestay (1) — (N) Booking
- Booking (1) — (1) Payment
- Booking (1) — (0..1) Review (chỉ khi COMPLETED)

---

## 5. Business Rules quan trọng (bắt buộc AI code phải tuân thủ)

1. **Đăng ký/đăng nhập:** email & username unique; tài khoản mới luôn `ROLE_USER`; JWT xác định điều hướng (Admin → Admin Dashboard, Host/User → trang chủ); tài khoản bị khóa → chặn đăng nhập với message rõ ràng.
2. **Đặt phòng:** phải kiểm tra **trùng lịch (date overlap)** giữa `checkinDate`/`checkoutDate` với các Booking khác cùng Homestay đang ở trạng thái `PENDING`/`CONFIRM`/`COMPLETED`.
3. **Duyệt Host:** chỉ `ROLE_USER` mới gửi được `HostRequest`; Admin duyệt → cập nhật `role = HOST`; từ chối → lưu `adminNote`.
4. **Quản lý Homestay:** Host chỉ CRUD được Homestay của chính mình; không được xóa Homestay đang có đơn `PENDING`/`CONFIRM`.
5. **Xử lý đơn:** Host chỉ duyệt/từ chối đơn thuộc Homestay mình sở hữu; khi **Reject** → tự động trigger **Auto Refund**.
6. **Auto Refund (SYSTEM):** chỉ hoàn tiền khi `payment.status = PAID` và `booking.status` vừa chuyển sang `REJECTED`/`CANCELLED`; hoàn về đúng `bankAccount` của User; sau khi hoàn xong đổi `payment.status = REFUNDED`.
7. **Hủy đơn (khách hàng):** User chỉ hủy được đơn của chính mình, thường giới hạn ở trạng thái `PENDING`/`CONFIRM` trước ngày check-in; hủy xong cũng trigger Auto Refund nếu đã thanh toán.
8. **Đánh giá:** chỉ tạo được Review khi Booking đã `COMPLETED`; mỗi Booking chỉ được review 1 lần; sau khi tạo review → gọi `Homestay.updateAverageRating()`.
9. **Cron job (SYSTEM):** định kỳ quét đơn `PENDING` quá hạn thanh toán hoặc quá hạn Host duyệt → tự động chuyển `CANCELLED` + trigger Auto Refund nếu cần.
10. **Thống kê:** Host chỉ xem thống kê Homestay của mình; Admin xem toàn hệ thống; lọc theo khoảng thời gian (tuần/tháng/năm); không có dữ liệu → trả về 0, không lỗi.

---

## 6. Danh sách chức năng theo Use Case (UC-01 → UC-10)

| # | Use case | Actor chính |
|---|---|---|
| UC-01 | Đăng ký & Đăng nhập | Guest, User, Host, Admin |
| UC-02 | Tìm kiếm & Lọc Homestay | Guest, User |
| UC-03 | Đặt phòng & Thanh toán | User |
| UC-04 | Đăng ký & duyệt làm Chủ Homestay | User, Admin |
| UC-05 | Quản lý Homestay (thêm/sửa/xóa) | Host |
| UC-06 | Xử lý đơn đặt phòng (duyệt/từ chối) + Auto Refund | Host, System |
| UC-07 | Đánh giá & bình luận | User |
| UC-08 | Khách hàng hủy đặt phòng | User |
| UC-09 | Quản lý thông tin cá nhân | User, Host, Admin |
| UC-10 | Thống kê & báo cáo | Host, Admin |

---

## 7. Đề xuất REST API endpoints

```
# Auth
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

# Homestay (public + host)
GET    /api/homestays                 # tìm kiếm/lọc: city, price, guests, amenities, keyword
GET    /api/homestays/{id}
POST   /api/homestays                 # ROLE_HOST
PUT    /api/homestays/{id}            # ROLE_HOST (chỉ chủ sở hữu)
DELETE /api/homestays/{id}            # ROLE_HOST (chỉ chủ sở hữu, chặn nếu có đơn active)
POST   /api/homestays/{id}/images     # upload Cloudinary

# Amenity
GET    /api/amenities

# Host request
POST   /api/host-requests             # ROLE_USER gửi yêu cầu
GET    /api/host-requests             # ROLE_ADMIN xem danh sách
PUT    /api/host-requests/{id}/approve
PUT    /api/host-requests/{id}/reject

# Booking
POST   /api/bookings                  # ROLE_USER, check overlap ngày
GET    /api/bookings/me               # lịch sử đơn của User
GET    /api/bookings/host             # đơn thuộc Homestay của Host
PUT    /api/bookings/{id}/confirm     # ROLE_HOST
PUT    /api/bookings/{id}/reject      # ROLE_HOST -> trigger refund
PUT    /api/bookings/{id}/cancel      # ROLE_USER -> trigger refund nếu đã PAID

# Payment
POST   /api/payments                  # thanh toán cho 1 booking
POST   /api/payments/{id}/refund      # gọi nội bộ bởi SYSTEM/HOST reject

# Review
POST   /api/reviews                   # chỉ khi booking COMPLETED
GET    /api/homestays/{id}/reviews

# User profile
PUT    /api/users/me
PUT    /api/users/{id}/lock           # ROLE_ADMIN

# Dashboard / Statistics
GET    /api/stats/host?range=week|month|year
GET    /api/stats/admin?range=week|month|year
```

---

## 8. Gợi ý cấu trúc thư mục

**Backend (Spring Boot – 4 lớp: Controller / Service / Repository / Entity):**
```
src/main/java/com/homestay/
 ├── config/          (SecurityConfig, CorsConfig, CloudinaryConfig)
 ├── controller/
 ├── service/
 ├── repository/
 ├── entity/
 ├── enums/
 ├── dto/
 ├── security/        (JWT filter, provider)
 ├── scheduler/        (cron: auto-cancel, auto-refund)
 └── exception/        (GlobalExceptionHandler)
```

**Frontend (React + Vite):**
```
src/
 ├── pages/            (Home, HomestayDetail, Booking, Dashboard/Admin, Dashboard/Host, Profile)
 ├── components/
 ├── routes/           (React Router + PrivateRoute theo role)
 ├── services/          (axios instance + apiHomestay.js, apiBooking.js, ...)
 ├── context/           (AuthContext lưu JWT + role)
 ├── hooks/
 └── utils/
```

---

## 9. Ghi chú kỹ thuật khi tích hợp

- **JWT:** lưu role trong claim, FE dùng `PrivateRoute` kiểm tra role trước khi render Dashboard tương ứng.
- **VietMap SDK:** cần `latitude`/`longitude` trên Homestay (đã bổ sung ở mục 4.3) để hiển thị marker và tìm theo bán kính.
- **Cloudinary:** upload ảnh Homestay và ảnh giấy tờ HostRequest qua unsigned upload preset hoặc backend proxy ký request.
- **Scheduler:** dùng `@Scheduled` của Spring để định kỳ quét đơn quá hạn.
- **Thống kê:** dùng Java Stream API để group/aggregate ở Service, trả JSON cho Recharts vẽ biểu đồ cột/tròn.

---

## 10. Cách dùng file này để vibecoding

1. Dán nguyên file này vào đầu context của AI code (Claude Code / Cursor / Copilot Chat).
2. Yêu cầu AI code sinh **Entity + Enum** trước (mục 4), sau đó **Repository/Service/Controller** cho từng nghiệp vụ (mục 5, 7).
3. Với mỗi tính năng mới, luôn nhắc AI: *"tuân thủ đúng Business Rules ở mục 5"* để tránh sinh sai logic (đặc biệt là overlap ngày đặt phòng và auto refund).
4. Sinh Frontend theo từng use case ở mục 6, ưu tiên UC-01 → UC-03 trước vì đây là luồng lõi (đăng nhập → tìm phòng → đặt phòng).
