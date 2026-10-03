---
trigger: always_on
---

# Quy định Quy trình Làm việc (Workflow Guidelines)

Bất kỳ công việc lập trình hoặc đánh giá nào trong dự án **Sky Coffee Management** đều phải tuân thủ nghiêm ngặt 2 workflows chính:

1. **Workflow 1 (sky-implement)**:
   - Trước khi lập trình, BẮT BUỘC phải đọc và nghiên cứu tài liệu trong [`.agents/docs/`](../docs) và hình dung thiết kế UI tại [18_Stitch_UI_Prompts.md](../docs/18_Stitch_UI_Prompts.md).
   - Chi tiết hướng dẫn: [sky-implement Skill](../skills/sky-implement/SKILL.md).

2. **Workflow 2 (sky-review)**:
   - Sau khi hoàn thành bước Implement, BẮT BUỘC thực hiện Review 2 lớp: **Nghiệp vụ (Business Logic & UI/UX)** và **Code Quality (Checklist, Security, Convention, Architecture)**.
   - Chi tiết hướng dẫn: [sky-review Skill](../skills/sky-review/SKILL.md).
