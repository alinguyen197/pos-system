# Quy trình Thực hiện (Implement Workflow)

Workflow này hướng dẫn các bước thực hiện nhiệm vụ phát triển phần mềm trong dự án Sky Coffee.

## 📌 Các Bước Thực Hiện

### Bước 1: Đọc & Thấu hiểu Tài liệu Nghiệp vụ
Đọc kĩ các tài liệu trong [`.agents/docs/`](file:///Users/apple/Desktop/SKY/sky/.agents/docs):
- Kiến trúc & Phân tầng: [05_Project_Structure.md](file:///Users/apple/Desktop/SKY/sky/.agents/docs/05_Project_Structure.md)
- Mô tả màn hình: [20_Screen_Docs_SC001_SC010.md](file:///Users/apple/Desktop/SKY/sky/.agents/docs/20_Screen_Docs_SC001_SC010.md)
- Thiết kế UI Stitch: [18_Stitch_UI_Prompts.md](file:///Users/apple/Desktop/SKY/sky/.agents/docs/18_Stitch_UI_Prompts.md)
- Skeletons: [15_FE_Skeleton_Templates.md](file:///Users/apple/Desktop/SKY/sky/.agents/docs/15_FE_Skeleton_Templates.md) & [16_BE_Skeleton_Templates.md](file:///Users/apple/Desktop/SKY/sky/.agents/docs/16_BE_Skeleton_Templates.md)
- Chuẩn API: [01_API_Response_Standard.md](file:///Users/apple/Desktop/SKY/sky/.agents/docs/01_API_Response_Standard.md), [02_API_Error_Handling.md](file:///Users/apple/Desktop/SKY/sky/.agents/docs/02_API_Error_Handling.md), [03_Common_Validation.md](file:///Users/apple/Desktop/SKY/sky/.agents/docs/03_Common_Validation.md), [04_Sort_And_Paging.md](file:///Users/apple/Desktop/SKY/sky/.agents/docs/04_Sort_And_Paging.md)

### Bước 2: Hình dung Giao diện & Trải nghiệm
- Xem mẫu giao diện trên Stitch và quy định UI/UX.
- Nắm rõ màu sắc: Primary `#5D4037`, Accent `#FF9800`, Success `#4CAF50`, Error `#F44336`.

### Bước 3: Viết Code & Tuân thủ Convention
- Thực hiện phân tầng rõ ràng (Route -> Controller -> Service -> Model cho BE; Pages/Components/Hooks cho FE).
- Áp dụng các skeleton mẫu chuẩn.

### Bước 4: Tự Kiểm tra
- Đảm bảo app chạy không lỗi syntax/runtime.

### Bước 5: Cập nhật & Đồng bộ Tài liệu `.agents/docs/` theo Source Code
- Khi thực hiện sửa đổi source code (Database schema, API parameters/response, UI/UX behavior, Configs/Constants) khác với mô tả hiện tại trong [`.agents/docs/`](file:///Users/apple/Desktop/SKY/sky/.agents/docs), **bắt buộc** phải cập nhật các file tài liệu tương ứng tại `.agents/docs/`.
- Mục đích: Giữ cho source code và tài liệu hệ thống luôn đồng nhất 100%.

