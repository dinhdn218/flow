# Flow — công cụ quản lý công việc

Dự án concept portfolio bằng tiếng Việt dành cho freelancer và nhóm nhỏ. Có landing page, dashboard tổng quan, bảng Kanban, danh sách công việc và form thêm/sửa. Giao diện sáng/tối với nút toggle, ghi nhớ lựa chọn qua localStorage.

## Chạy trên máy

Yêu cầu Node.js 20 trở lên. Chạy `npm start` rồi mở http://127.0.0.1:4174. Không cần cài thư viện. Chạy `npm test` để kiểm tra logic.

## Chức năng

- Tạo, sửa, xóa và hoàn tác xóa công việc.
- Đổi trạng thái bằng kéo thả hoặc menu chọn trạng thái có hỗ trợ bàn phím.
- Tìm kiếm tiếng Việt có/không dấu, lọc theo dự án, ưu tiên và trạng thái; sắp xếp theo hạn, tên hoặc ưu tiên.
- Dashboard và biểu đồ tính từ dữ liệu công việc trong trình duyệt.
- Dữ liệu công việc và theme được lưu ở `flow.workspace.v1` và `flow.theme.v1` trong localStorage. Nếu trình duyệt chặn lưu trữ, app giữ thao tác trong phiên hiện tại và thông báo giới hạn.
- Khôi phục dữ liệu mẫu qua bước xác nhận.

## Cấu trúc

`dist/index.html` khởi tạo theme sớm và khai báo favicon. `dist/styles.css` chứa token của hai theme và bố cục responsive. `dist/model.mjs` quản lý dữ liệu/kiểm tra/lọc. `dist/theme.mjs` quản lý lựa chọn theme. `dist/ui.mjs` render giao diện. `dist/app.mjs` nối sự kiện và lưu trữ. `server.mjs` phục vụ bản local.

Không có tài khoản thực, email, thông báo đến thành viên, đồng bộ máy chủ hay thanh toán. Các dự án và thành viên mẫu là giả định. Google Fonts tải từ Google; toàn bộ icon và favicon là SVG tại ứng dụng, không phụ thuộc ảnh bên ngoài. Dùng hash routes để chạy trên static hosting.

Khi đưa vào portfolio, ghi rõ “Dự án concept tự thực hiện”. Các đường dẫn chia sẻ công khai cần bật quyền truy cập tương ứng trên hosting.
