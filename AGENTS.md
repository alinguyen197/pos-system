# Quy ước & Nội quy Dự án Sky Coffee Management (POS System)

Tài liệu này là **Hiến pháp chung (Global Instructions)** cho Antigravity IDE khi hỗ trợ phát triển dự án này.

## 1. Nguyên tắc Cốt lõi
- **Đọc tài liệu trước khi viết code**: Trước khi thực hiện bất kỳ nhiệm vụ nào, BẮT BUỘC phải tra cứu các tài liệu thiết kế và quy chuẩn tại `.agents/docs/`.
- **Phân tầng rõ ràng**:
  - **Backend**: `Route` (nhận đường dẫn/middleware) → `Controller` (nhận req, trả res envelope, không chứa logic) → `Service` (chứa toàn bộ business logic, không đụng req/res) → `Model` (schema DB).
  - **Frontend**: Tách biệt giữa UI Component và API Calls/Custom Hooks.
- **API Response Envelope**:
  - Response thành công: `success(res, data)`
  - Response lỗi validation: HTTP 400 kèm `errors[]`
  - Response lỗi hệ thống/phân quyền: 401, 403, 404, 500 với body phù hợp chuẩn tài liệu.

## 2. Quy trình làm việc (Workflows & Skills)
Bất kỳ công việc nào đều tuân theo 2 quy trình đóng gói dưới dạng Skill trong `.agents/skills/`:
1. **`/sky-implement`**: Quy trình 6 bước thực hiện nhiệm vụ (nghiên cứu tài liệu `.agents/docs/`, đối chiếu UI Stitch, lập kế hoạch, code theo template, tự verify, đồng bộ tài liệu).
2. **`/sky-review`**: Quy trình review 2 lớp (Lớp 1: Nghiệp vụ & UI/UX; Lớp 2: Code Quality, Convention, Architecture & Security).

## 3. Tài liệu Tham chiếu Cốt lõi (`.agents/docs/`)
- `05_Project_Structure.md`: Cấu trúc thư mục & phân tầng code
- `01_API_Response_Standard.md` & `02_API_Error_Handling.md`: Chuẩn API Response & Lỗi
- `03_Common_Validation.md`: Rules validate dữ liệu
- `06_Coding_Convention.md` & `08_Database_Convention.md`: Quy chuẩn đặt tên & DB
- `15_FE_Skeleton_Templates.md` & `16_BE_Skeleton_Templates.md`: Template mẫu code FE & BE
- `18_Stitch_UI_Prompts.md` & `20_Screen_Docs_SC001_SC010.md`: Thiết kế UI & Màn hình
