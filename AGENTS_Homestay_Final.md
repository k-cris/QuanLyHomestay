# AGENTS.md --- Homestay Management System

> File này dành cho AI coding agent (Antigravity, Cursor, Claude
> Code...) đọc và làm theo khi code dự án. Đặt file này ở **root của
> repo**. Antigravity và Cursor sẽ tự động nạp file `AGENTS.md` làm ngữ
> cảnh dự án ở mỗi phiên. Nguồn: `HeThongQuanLyHomestay.mdj` (UML) + báo
> cáo tiểu luận đồ án.

------------------------------------------------------------------------

## 0. Vai trò của bạn (agent)

Bạn là lập trình viên fullstack triển khai **Hệ thống Quản lý Homestay**
theo đúng đặc tả bên dưới. Đây là đồ án tốt nghiệp của một sinh viên
đang học --- hãy code từng phần rõ ràng, dễ hiểu, có comment tiếng Việt
ngắn gọn ở chỗ logic phức tạp (overlap booking, refund, phân quyền),
không lạm dụng abstraction thừa.

Khi thực hiện task, luôn: 1. Đọc kỹ mục **Business rules** trước khi
code, không tự suy diễn logic khác đi. 2. Nếu một quyết định kỹ thuật
không được đặc tả rõ (VD: chính sách hoàn tiền % cụ thể), **hỏi lại**
hoặc chọn phương án hợp lý nhất và ghi chú
`// TODO: xác nhận lại rule này với chủ dự án`. 3. Sau khi tạo/sửa
entity hoặc API, kiểm tra chéo với bảng DDL và danh sách endpoint bên
dưới để không lệch schema.

------------------------------------------------------------------------

## 1. Tech stack (cố định, không tự đổi)

  -----------------------------------------------------------------------
  Layer                               Công nghệ
  ----------------------------------- -----------------------------------
  Frontend                            ReactJS + Vite, React Router, Axios

  Backend                             Spring Boot, Spring Data JPA,
                                      Spring Security + JWT

  Database                            MySQL

  Map                                 VietMap SDK (JS)

  Ảnh                                 Cloudinary

  Thanh toán & Hoàn tiền              **Chuyển khoản ngân hàng thủ công**
                                      --- không tích hợp cổng thanh toán
                                      (VNPay/Momo). Hệ thống chỉ hiển thị
                                      thông tin STK và ghi nhận xác nhận
                                      qua lại giữa các bên.
  -----------------------------------------------------------------------

**Nguồn sự thật của phiên bản code:** thanh toán và hoàn tiền đều được
thực hiện bằng **chuyển khoản ngân hàng thủ công**. Không tích hợp
VNPay/Momo. Hệ thống chỉ lưu thông tin tài khoản, ghi nhận trạng thái và
xác nhận của các bên; việc chuyển tiền thực tế diễn ra ngoài hệ thống.

-   Thanh toán đặt phòng: User chuyển khoản cho Host → User báo đã
    chuyển → Host kiểm tra tài khoản và xác nhận.
-   Hoàn tiền: Host chuyển khoản cho User → Host báo đã chuyển → User
    kiểm tra tài khoản và xác nhận đã nhận.
-   Hệ thống **không tự động chuyển tiền** ở bất kỳ bước nào.

Không thêm framework/thư viện lớn khác (Redux, GraphQL, NestJS...) trừ
khi được yêu cầu rõ ràng.

------------------------------------------------------------------------

## 2. Actors & phân quyền

  -----------------------------------------------------------------------
  Actor                               Ghi chú
  ----------------------------------- -----------------------------------
  `GUEST`                             Chưa đăng nhập --- xem/tìm kiếm/lọc
                                      homestay, xem chi tiết, xem bản đồ,
                                      đăng ký

  `ROLE_USER`                         Mặc định sau đăng ký --- đặt phòng,
                                      thanh toán, hủy đơn, đánh giá, gửi
                                      yêu cầu làm Host

  `ROLE_HOST`                         Được Admin duyệt --- CRUD homestay
                                      của chính mình, duyệt/từ chối đơn

  `ROLE_ADMIN`                        Cao nhất --- duyệt Host, khóa/mở
                                      tài khoản, thống kê toàn hệ thống

  `SYSTEM`                            Job nền --- tự hủy đơn `PENDING`
                                      quá hạn; **không tự chuyển khoản
                                      thanh toán hoặc hoàn tiền**
  -----------------------------------------------------------------------

**Quy tắc bắt buộc khi code phân quyền:** - Mọi endpoint ghi dữ liệu
(POST/PUT/DELETE) phải có `@PreAuthorize` hoặc filter JWT kiểm tra role
tương ứng --- không để hở endpoint. - Host chỉ thao tác được resource có
`host_id`/`homestay.hostId` khớp với `userId` trong token --- luôn so
khớp ownership ở service layer, không chỉ dựa vào role.

------------------------------------------------------------------------

## 3. Business rules --- PHẢI tuân thủ khi code

1.  **Đăng ký/Đăng nhập:** email + username unique; user mới luôn
    `ROLE_USER`; JWT cấp sau login; tài khoản bị khóa
    (`is_active=false`) → chặn đăng nhập.
2.  **Tìm kiếm/Lọc:** không cần login; chỉ trả homestay `status=ACTIVE`;
    giá lọc phải là số dương.
3.  **Đặt phòng & thanh toán (chuyển khoản thủ công):**
    -   check-in ≥ hôm nay; check-out \> check-in; số khách ≤
        `max_guests`.
    -   **PHẢI check overlap ở backend** với các booking `CONFIRMED`
        cùng homestay (query kiểu
        `check_in < :newCheckout AND check_out > :newCheckin`). Không
        được chỉ check ở frontend.
    -   Tạo `Booking` (`status=PENDING`) + tạo `Payment`
        (`status=UNPAID`) kèm snapshot STK ngân hàng của Host tại thời
        điểm đặt (để nếu Host đổi STK sau này không ảnh hưởng đơn cũ) →
        trả về cho FE hiển thị thông tin chuyển khoản.
    -   User tự chuyển khoản **ngoài hệ thống**, sau đó bấm "Đã chuyển
        khoản" → API cập nhật `Payment.status=AWAITING_CONFIRMATION`,
        `Payment.notice_at=now()` → thông báo cho Host. Booking vẫn giữ
        `status=PENDING` (chỉ Payment đổi trạng thái).
4.  **Upgrade Host:** chỉ `ROLE_USER`; tối đa 1 request `PENDING` cùng
    lúc; upload ảnh CCCD/GPKD qua Cloudinary.
5.  **Admin duyệt Host:** duyệt → đổi `users.role = HOST`; từ chối → bắt
    buộc có `admin_note`.
6.  **Quản lý Homestay (Host):** chỉ Host mới có quyền thêm, sửa và
    ngừng bán Homestay của chính mình; luôn kiểm tra ownership ở service
    layer.
    -   Khi thêm Homestay: thông tin bắt buộc phải đầy đủ và hợp lệ; giá
        phải hợp lệ; Homestay phải gắn với Host đang thao tác.
    -   Host phải thiết lập **chính sách hoàn tiền riêng cho từng
        Homestay** gồm một hoặc nhiều mốc thời gian trước check-in và tỷ
        lệ hoàn tương ứng.
    -   Các mốc thời gian của cùng một Homestay không được trùng nhau;
        `hours_before_checkin >= 0`; `refund_percent` từ `0` đến `100`.
    -   Khi sửa Homestay, Host chỉ được sửa resource thuộc mình.
    -   Khi ngừng bán, đổi `Homestay.status` từ `ACTIVE` sang
        `INACTIVE`; Homestay không xuất hiện trong tìm kiếm và không
        nhận Booking mới nhưng **không bị xóa khỏi Database**.
    -   Không sử dụng hard delete Homestay trong nghiệp vụ thông thường;
        lịch sử Booking, Payment, Refund và Review phải được bảo toàn.
7.  **Host xử lý đơn (xác nhận thủ công):**
    -   Host tự kiểm tra tài khoản ngân hàng thực tế (ngoài hệ thống),
        rồi:
    -   **Xác nhận đã nhận tiền** → `Payment.status=PAID`,
        `Payment.confirmed_at=now()`, `Booking.status=CONFIRMED` → thông
        báo User.
    -   **Từ chối đơn** → `Booking.status=REJECTED` → **nếu
        `Payment.status` đang là `AWAITING_CONFIRMATION` hoặc `PAID`**
        (tức User đã báo/đã chuyển tiền) thì **tự động tạo bản ghi
        `Refund`** (`status=PENDING`, `reason=REJECTED`) → thông báo
        Host có yêu cầu hoàn tiền cần xử lý.
8.  **Hoàn tiền thủ công (Refund module --- tách riêng khỏi Payment):**
    -   Refund được tạo tự động khi: Host reject đơn đã có tiền, hoặc
        User hủy đơn đã có tiền (xem rule 10).
    -   Snapshot STK ngân hàng của **User** (người nhận hoàn) vào
        `Refund` tại thời điểm tạo.
    -   Host chuyển khoản hoàn tiền **ngoài hệ thống**, sau đó bấm "Đã
        chuyển khoản hoàn tiền" trên hệ thống →
        `Refund.status: PENDING → SENT`, `sent_at=now()` → thông báo
        User.
    -   User tự kiểm tra tài khoản, nếu đã nhận → bấm "Xác nhận đã nhận
        tiền" → `Refund.status: SENT → CONFIRMED`, `confirmed_at=now()`.
        Nếu chưa nhận → không làm gì, tiếp tục ở trạng thái `SENT` chờ
        xử lý (không có trạng thái lỗi tự động --- nếu phát sinh tranh
        chấp là xử lý ngoài luồng, Admin can thiệp thủ công).
9.  **Review:** chỉ khi booking `COMPLETED`; 1 booking = tối đa 1 review
    (enforce bằng UNIQUE constraint, không chỉ check code); sau khi tạo
    → tính lại `average_rating` của homestay (AVG rating).
10. **User hủy đơn và chính sách hoàn tiền:**
    -   Không được hủy khi đã tới hoặc qua thời điểm check-in theo rule
        của hệ thống.
    -   Với Booking `PENDING`: User được hủy. Nếu Payment là `UNPAID`
        thì không tạo Refund; nếu Payment là `AWAITING_CONFIRMATION`
        hoặc `PAID` thì tạo Refund theo nghiệp vụ hủy và **hoàn 100% số
        tiền đã thanh toán**.
    -   Với Booking `CONFIRMED`: hệ thống lấy `RefundPolicy` của chính
        Homestay, tính số giờ còn lại trước check-in, chọn mốc có
        `hours_before_checkin` lớn nhất nhưng không vượt quá số giờ còn
        lại, rồi tính
        `refund_amount = amount_paid * refund_percent / 100`.
    -   Trước khi xác nhận hủy, hệ thống phải trả/hiển thị cho User tỷ
        lệ và số tiền hoàn dự kiến. Chỉ sau khi User xác nhận, Booking
        mới chuyển sang `CANCELLED` và Refund mới được tạo nếu số tiền
        hoàn \> 0.
    -   Chính sách hoàn tiền do Host cấu hình **riêng cho từng
        Homestay**, không dùng một mức mặc định chung cho toàn hệ thống.
    -   Nếu tỷ lệ hoàn theo policy bằng `0%` thì Booking vẫn được hủy
        nhưng không tạo Refund.
11. **Profile:** validate phone/bank_account không chứa ký tự đặc biệt;
    đổi password cần hash lại (BCrypt), không lưu plaintext.
12. **Thống kê:** Admin xem toàn hệ thống; Host chỉ xem thống kê của
    homestay mình sở hữu --- luôn filter theo `hostId` ở query, không
    trả toàn bộ rồi filter ở FE.


### 3.2. Xem lịch đặt phòng của Homestay

Chức năng lịch đặt phòng dành cho Host phải hỗ trợ cả **xem tổng quan theo tháng** và **xem Booking theo từng ngày**:

- Host chỉ được xem lịch của Homestay thuộc quyền quản lý của mình; Backend phải kiểm tra ownership ở service layer.
- Hệ thống hiển thị lịch theo tháng, đánh dấu các ngày có Booking đang chiếm phòng.
- Một Booking kéo dài nhiều đêm phải được đánh dấu trên toàn bộ các ngày từ ngày check-in đến **trước ngày check-out**.
- Chỉ Booking ở trạng thái `CONFIRMED` được xem là lịch đã đặt/đang chiếm phòng. Booking `CANCELLED`, `REJECTED` không được tính là ngày đã đặt.
- Khi Host nhấn/chọn một ngày trên lịch, hệ thống phải tải và hiển thị danh sách các Booking liên quan đến ngày đó.
- Host có thể chọn một Booking trong danh sách để xem thông tin chi tiết.
- Thông tin tối thiểu khi xem Booking theo ngày: mã Booking, User, ngày check-in, ngày check-out, số khách, trạng thái và tổng tiền.
- Nếu ngày được chọn không có Booking, hệ thống hiển thị trạng thái "Không có đặt phòng".
- Dữ liệu lịch và danh sách Booking phải được lọc theo đúng `homestay_id` và Host hiện tại; không trả dữ liệu của Homestay khác.

Luồng:

```text
Host
  ↓
Chọn Homestay
  ↓
Mở lịch đặt phòng
  ↓
Chọn tháng
  ↓
Backend trả dữ liệu lịch
  ↓
Hiển thị các ngày có Booking CONFIRMED
  ↓
Host nhấn một ngày
  ↓
GET /api/homestays/{id}/bookings?date=YYYY-MM-DD
  ↓
Hiển thị các Booking của ngày được chọn
  ↓
Host chọn Booking
  ↓
Xem chi tiết Booking
```

### 3.1. Quy tắc tính RefundPolicy

Mỗi Homestay có một tập chính sách hoàn tiền riêng. Ví dụ:

``` text
72 giờ trước check-in → 95%
48 giờ trước check-in → 90%
24 giờ trước check-in → 85%
0 giờ trước check-in  → 80%
```

Cách chọn policy: 1. Tính `hoursBeforeCheckin` từ thời điểm hủy đến thời
điểm check-in. 2. Trong các policy của đúng Homestay, chọn policy có
`hours_before_checkin` **lớn nhất nhưng không vượt quá**
`hoursBeforeCheckin`. 3.
`refundAmount = amountPaid * refundPercent / 100`. 4. Làm tròn tiền theo
kiểu tiền tệ của hệ thống. 5. Nếu không có policy phù hợp hoặc
`refundPercent = 0`, không tạo Refund. 6. Không được lấy policy của
Homestay khác và không được hardcode một policy chung.

Host có thể thêm/sửa/xóa các mức policy trong lúc quản lý Homestay,
nhưng phải luôn giữ dữ liệu hợp lệ. Việc xóa một mức policy không được
làm mất lịch sử Refund đã phát sinh trước đó.

------------------------------------------------------------------------

## 4. Enum (giữ nguyên tên, dùng cho cả DB và code)

``` java
enum RoleEnum { USER, HOST, ADMIN }
enum RequestStatusEnum { PENDING, APPROVED, REJECTED }
enum HomestayStatusEnum { ACTIVE, INACTIVE }
enum BookingStatusEnum { PENDING, CONFIRMED, REJECTED, CANCELLED, COMPLETED }
enum PaymentStatusEnum { UNPAID, AWAITING_CONFIRMATION, PAID }   // đã bỏ REFUNDED/REFUND_FAILED — chuyển sang RefundStatusEnum riêng
enum RefundStatusEnum { PENDING, SENT, CONFIRMED }               // MỚI — vòng đời của 1 yêu cầu hoàn tiền
enum RefundReasonEnum { REJECTED, CANCELLED }                    // lý do phát sinh refund
```

> Lưu ý: `PaymentStatusEnum` giờ chỉ mô tả trạng thái của **khoản thanh
> toán đặt phòng ban đầu**. Việc hoàn tiền được theo dõi độc lập ở
> bảng/entity `Refund` (mục 5, 6) vì 1 booking có thể phát sinh refund
> sau khi payment đã `PAID`, và refund có vòng đời xác nhận riêng (Host
> gửi → User xác nhận nhận) không nằm chung vòng đời với payment ban
> đầu.

------------------------------------------------------------------------

## 5. Database schema (MySQL) --- nguồn sự thật (source of truth)

``` sql
CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  phone VARCHAR(20),
  avatar VARCHAR(500),
  role VARCHAR(20) NOT NULL DEFAULT 'USER',
  bank_name VARCHAR(100),
  bank_account VARCHAR(50),
  bank_holder VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE host_requests (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  id_card_number VARCHAR(50),
  license_image_url VARCHAR(500),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  admin_note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE homestays (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  host_id BIGINT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  address VARCHAR(500),
  city VARCHAR(100),
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  price_per_night DECIMAL(12,2) NOT NULL,
  max_guests INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  average_rating DECIMAL(3,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (host_id) REFERENCES users(id)
);

-- Chính sách hoàn tiền riêng cho từng Homestay.
-- Mỗi dòng là một mốc thời gian trước check-in và tỷ lệ hoàn tương ứng.
CREATE TABLE refund_policies (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  homestay_id BIGINT NOT NULL,
  hours_before_checkin INT NOT NULL,
  refund_percent DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_refund_policy_homestay_hours (homestay_id, hours_before_checkin),
  CHECK (hours_before_checkin >= 0),
  CHECK (refund_percent >= 0 AND refund_percent <= 100),
  FOREIGN KEY (homestay_id) REFERENCES homestays(id) ON DELETE CASCADE
);

CREATE TABLE homestay_images (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  homestay_id BIGINT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (homestay_id) REFERENCES homestays(id) ON DELETE CASCADE
);

CREATE TABLE amenities (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(100)
);

CREATE TABLE homestay_amenities (
  homestay_id BIGINT NOT NULL,
  amenity_id BIGINT NOT NULL,
  PRIMARY KEY (homestay_id, amenity_id),
  FOREIGN KEY (homestay_id) REFERENCES homestays(id) ON DELETE CASCADE,
  FOREIGN KEY (amenity_id) REFERENCES amenities(id) ON DELETE CASCADE
);

CREATE TABLE bookings (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  booking_code VARCHAR(50) NOT NULL UNIQUE,
  guest_id BIGINT NOT NULL,
  homestay_id BIGINT NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  total_guests INT NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  note TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (guest_id) REFERENCES users(id),
  FOREIGN KEY (homestay_id) REFERENCES homestays(id)
);

-- Payment mô tả khoản THANH TOÁN ĐẶT PHÒNG ban đầu, thực hiện bằng chuyển khoản thủ công.
CREATE TABLE payments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  booking_id BIGINT NOT NULL UNIQUE,
  amount DECIMAL(12,2) NOT NULL,
  -- Snapshot STK của Host tại thời điểm đặt phòng (để user chuyển khoản vào đúng chỗ,
  -- không bị ảnh hưởng nếu Host đổi STK sau này)
  receiver_bank_name VARCHAR(100),
  receiver_bank_account VARCHAR(50),
  receiver_bank_holder VARCHAR(255),
  status VARCHAR(30) NOT NULL DEFAULT 'UNPAID',   -- UNPAID | AWAITING_CONFIRMATION | PAID
  notice_at TIMESTAMP NULL,                        -- lúc User bấm "Đã chuyển khoản"
  confirmed_at TIMESTAMP NULL,                      -- lúc Host xác nhận đã nhận tiền
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- MỚI: Refund tách riêng khỏi Payment vì có vòng đời xác nhận 2 chiều (Host gửi -> User nhận)
-- và có thể phát sinh từ 2 nguồn: Host reject đơn, hoặc User tự hủy đơn.
CREATE TABLE refunds (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  booking_id BIGINT NOT NULL UNIQUE,
  user_id BIGINT NOT NULL,                          -- người nhận hoàn tiền (= guest_id của booking)
  amount DECIMAL(12,2) NOT NULL,
  -- Snapshot STK của User tại thời điểm tạo refund
  receiver_bank_name VARCHAR(100),
  receiver_bank_account VARCHAR(50),
  receiver_bank_holder VARCHAR(255),
  reason VARCHAR(20) NOT NULL,                      -- REJECTED | CANCELLED
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',    -- PENDING | SENT | CONFIRMED
  host_note TEXT,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP NULL,                           -- lúc Host xác nhận đã chuyển khoản hoàn tiền
  confirmed_at TIMESTAMP NULL,                      -- lúc User xác nhận đã nhận được tiền
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE reviews (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  booking_id BIGINT NOT NULL UNIQUE,
  guest_id BIGINT NOT NULL,
  homestay_id BIGINT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  FOREIGN KEY (guest_id) REFERENCES users(id),
  FOREIGN KEY (homestay_id) REFERENCES homestays(id)
);
```

> **Cập nhật DB/ERD theo phiên bản nghiệp vụ mới:** -
> `latitude/longitude` trong `homestays` dùng cho VietMap. - `status`
> của `homestays` dùng `ACTIVE/INACTIVE`; ngừng bán là đổi trạng thái,
> không xóa cứng. - `payments` không tích hợp cổng thanh toán; lưu
> snapshot STK Host tại thời điểm đặt và các mốc User báo chuyển/Host
> xác nhận. - `refunds` tách riêng khỏi `payments`, có vòng đời
> `PENDING → SENT → CONFIRMED`. - **`refund_policies` là bảng mới:**
> `Homestay 1 - N RefundPolicy`, dùng để lưu chính sách hoàn tiền riêng
> của từng Homestay. - `RefundPolicy.hours_before_checkin` là số giờ tối
> thiểu trước check-in để áp dụng mức hoàn; khi tính refund, chọn mốc
> phù hợp nhất theo thời gian còn lại. - `refund_percent` nằm trong
> khoảng `0..100`.
>
> 👉 Khi cập nhật Class Diagram/ERD trong StarUML, cần phản ánh ít nhất
> quan hệ `Homestay 1-N RefundPolicy` và các entity `Payment`, `Refund`
> tách riêng.

------------------------------------------------------------------------

## 6. API contract (bám theo khi code cả FE và BE để không lệch nhau)

    # Auth
    POST   /api/auth/register
    POST   /api/auth/login                             -> trả { token, role }; FE lưu token vào localStorage

    # Users
    GET    /api/users/me
    PUT    /api/users/profile
    PUT    /api/users/password                          -> body { currentPassword, newPassword }
    POST   /api/users/host-request

    # Admin
    GET    /api/admin/host-requests                     ?status=PENDING
    PUT    /api/admin/host-requests/{id}/approve
    PUT    /api/admin/host-requests/{id}/reject          body { note }
    GET    /api/admin/users
    PUT    /api/admin/users/{id}/lock
    GET    /api/reports/revenue                          ?month=&year=  [ADMIN toàn hệ thống / HOST chỉ của mình]

    # Homestays
    GET    /api/homestays/search                        ?location=&minPrice=&maxPrice=&guests=&page=
    GET    /api/homestays/{id}
    POST   /api/homestays                                [HOST]  multipart form-data, ảnh upload qua Cloudinary
    PUT    /api/homestays/{id}                           [HOST - owner]
    PUT    /api/homestays/{id}/status                    [HOST - owner]  -- ACTIVE/INACTIVE; ngừng bán không xóa DB
    GET    /api/homestays/host/{hostId}                  [HOST]
    GET    /api/homestays/{id}/calendar                  ?month=&year=  [HOST - owner]  -- xem lịch đặt phòng theo tháng

    # Refund policies — chính sách riêng của từng Homestay
    GET    /api/homestays/{id}/refund-policies             [HOST - owner]
    PUT    /api/homestays/{id}/refund-policies             [HOST - owner]
                                                                        -- body: [{ hoursBeforeCheckin, refundPercent }, ...]
                                                                        -- validate mốc không trùng, hours >= 0, percent 0..100

    # Bookings
    POST   /api/bookings                                 [USER]  -> check overlap, tạo Booking(PENDING) + Payment(UNPAID),
                                                                     trả kèm thông tin STK để chuyển khoản
    GET    /api/bookings/{id}
    GET    /api/bookings/{id}/refund-preview               [USER - owner]  -- xem tỷ lệ + số tiền hoàn trước khi xác nhận hủy
    GET    /api/bookings/me                              [USER]
    GET    /api/bookings/host                            [HOST]
    PUT    /api/bookings/{id}/payment-notice              [USER - owner]  -- MỚI, User bấm "Đã chuyển khoản"
                                                                              -> Payment.status=AWAITING_CONFIRMATION
    PUT    /api/bookings/{id}/confirm                     [HOST - owner]  -- Host xác nhận đã nhận tiền
                                                                              -> Payment=PAID, Booking=CONFIRMED
    PUT    /api/bookings/{id}/reject                      [HOST - owner]  -> Booking=REJECTED,
                                                                              tự tạo Refund nếu đã có Payment notice/PAID
    PUT    /api/bookings/{id}/cancel                      [USER - owner]  -> kiểm tra điều kiện + tính preview refund
    PUT    /api/bookings/{id}/cancel/confirm               [USER - owner]  -> sau khi User xác nhận, Booking=CANCELLED,
                                                                              tạo Refund theo policy nếu cần

    # Refunds — MODULE MỚI, thay thế hoàn toàn phần "Payments/refund" cũ
    GET    /api/refunds/host                             [HOST]  -- danh sách yêu cầu hoàn tiền cần xử lý
    GET    /api/refunds/{id}                              [HOST hoặc USER liên quan tới refund đó]
    PUT    /api/refunds/{id}/confirm-sent                  [HOST - owner]  -- Host xác nhận đã chuyển khoản hoàn tiền
                                                                              -> status PENDING -> SENT
    GET    /api/refunds/my                                [USER]  -- danh sách refund của chính mình
    PUT    /api/refunds/{id}/confirm-received              [USER - owner]  -- User xác nhận đã nhận được tiền
                                                                              -> status SENT -> CONFIRMED

    # Reviews
    POST   /api/reviews                                   [USER]  -> chỉ khi booking COMPLETED
    GET    /api/homestays/{id}/reviews

Response mặc định: JSON, lỗi trả `{ "message": "...", "code": "..." }`
với HTTP status phù hợp (400 validate, 401/403 auth, 404 not found, 409
conflict --- VD overlap booking hoặc xung đột trạng thái).

------------------------------------------------------------------------

## 7. Cấu trúc thư mục

    backend/src/main/java/.../homestay/
      config/         SecurityConfig, JwtConfig, CorsConfig
      controller/
      service/
      repository/
      entity/
      dto/
      enums/
      exception/      GlobalExceptionHandler
      scheduler/      job tự hủy đơn PENDING quá hạn

    frontend/src/
      api/            axios instance + service theo module
      components/     Navbar, HomestayCard, BookingForm, MapView...
      pages/          Home, HomestayDetail, Booking, HostDashboard, AdminDashboard...
      context/        AuthContext (JWT, role)
      hooks/
      routes/         PrivateRoute theo role
      utils/

------------------------------------------------------------------------

## 8. Lộ trình build gợi ý (làm theo thứ tự, mỗi phase là 1 lần trao đổi/commit)

-   [ ] **Phase 0 --- Setup:** khởi tạo repo BE (Spring Initializr) + FE
    (Vite React), kết nối MySQL, cấu hình CORS, `.env`/`application.yml`
    mẫu.
-   [ ] **Phase 1 --- Auth:** entity `User`, đăng ký/đăng nhập, JWT
    filter, `AuthContext` FE, `PrivateRoute`.
-   [ ] **Phase 2 --- Homestay CRUD (Host):** entity `Homestay`,
    `HomestayImage`, `Amenity`, `RefundPolicy`; API thêm/sửa/ngừng bán;
    cấu hình chính sách hoàn tiền; upload ảnh Cloudinary; Host Dashboard
    FE cơ bản.
-   [ ] **Phase 3 --- Tìm kiếm & bản đồ:** API search/filter; tích hợp
    VietMap hiển thị marker.
-   [ ] **Phase 4 --- Booking:** entity `Booking`; API tạo đơn + check
    overlap; trang đặt phòng FE.
-   [ ] **Phase 5 --- Payment (chuyển khoản thủ công):** entity
    `Payment`; API tạo booking trả kèm STK Host; endpoint
    `payment-notice`; UI hiển thị hướng dẫn chuyển khoản + nút "Đã
    chuyển khoản".
-   [ ] **Phase 6 --- Host xử lý đơn + Refund module:** confirm/reject
    booking; entity `Refund` riêng; API `/api/refunds/*`; UI Host xác
    nhận đã hoàn tiền, UI User xác nhận đã nhận hoàn tiền.
-   [ ] **Phase 7 --- Cancel & Review:** preview policy + tính refund;
    User xác nhận hủy; tạo Refund nếu cần; review + cập nhật
    `average_rating`.
-   [ ] **Phase 8 --- Upgrade Host + Admin duyệt:** `HostRequest`; Admin
    Dashboard duyệt/từ chối.
-   [ ] **Phase 9 --- Thống kê + Scheduler:** dashboard thống kê
    Admin/Host; job tự hủy đơn quá hạn.
-   [ ] **Phase 10 --- Polish:** validate lỗi đồng bộ FE/BE, responsive
    UI, loading/error state.

Khi bắt đầu 1 phase mới, agent nên tóm tắt lại phase đó cần đụng đến
bảng nào, endpoint nào (đối chiếu mục 5, 6) trước khi viết code.

------------------------------------------------------------------------

## 9. Rules dành riêng cho agent (Antigravity / Cursor)

-   **KHÔNG** tự ý đổi tên field/bảng khác với mục 5 --- nếu thấy cần
    đổi, hỏi trước.
-   **KHÔNG** dùng hard delete Homestay trong nghiệp vụ thông thường;
    dùng `ACTIVE/INACTIVE`.
-   **KHÔNG** tích hợp VNPay/Momo hoặc tự động chuyển khoản hoàn tiền.
-   **LUÔN** lấy `RefundPolicy` theo `homestay_id` khi tính số tiền hoàn
    cho Booking `CONFIRMED`.
-   **KHÔNG** hardcode secret (JWT secret, Cloudinary key/API secret)
    trong code --- luôn đọc từ biến môi trường.
-   **LUÔN** validate ở backend (service layer), kể cả khi FE đã
    validate rồi --- FE validate chỉ để UX.
-   **LUÔN** viết theo đúng enum ở mục 4 (chữ hoa, đúng tên) để tránh
    lệch giữa DB, backend, frontend.
-   Khi sửa 1 file, chỉ động vào phần liên quan tới task hiện tại, không
    refactor lan man sang phần khác trừ khi được yêu cầu.
-   Nếu phát hiện đặc tả trong file này mâu thuẫn với những gì đã code
    trước đó trong repo, ưu tiên hỏi lại người dùng thay vì tự quyết.

------------------------------------------------------------------------

*File đặc tả dành cho AI coding agent, được chuẩn hóa theo phiên bản
nghiệp vụ/UML mới nhất của hệ thống Quản lý Homestay. Đặt ở root repo và
xem đây là source of truth khi vibecoding. Nếu code thực tế phát sinh
thay đổi nghiệp vụ, phải cập nhật đặc tả trước khi tiếp tục triển khai
các module phụ thuộc.*


## Quy tắc bổ sung cho Agent — Calendar Booking

- Khi triển khai chức năng quản lý Homestay của Host, **không được chỉ làm lịch hiển thị theo tháng**.
- Phải có thao tác **nhấn/chọn ngày → tải danh sách Booking của ngày đó → xem chi tiết Booking**.
- Không được coi Booking `CANCELLED` hoặc `REJECTED` là ngày đang được đặt.
- Không được cho Host xem lịch/Booking của Homestay không thuộc quyền quản lý.
