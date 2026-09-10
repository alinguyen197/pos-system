# Checklist Bảo mật

| Hạng mục   | Nội dung                       |
| :--------- | :----------------------------- |
| Hệ thống   | Coffee Trade Management System |
| Phiên bản  | 1.0                            |
| Ngày tạo   | 2026-08-26                     |
| Tham chiếu | OWASP Top 10 (2021)            |

### Lịch sử phiên bản

| Ver | Ngày       | Nội dung thay đổi | Người thực hiện |
| :-: | :--------- | :---------------- | :-------------- |
| 1.0 | 2026-08-26 | Tạo mới           | KhoaNA15        |

---

## Cách sử dụng

## Dùng khi **review bảo mật** trước khi deploy hoặc khi **review code** có liên quan đến xác thực, phân quyền, xử lý dữ liệu người dùng.

## 1. Authentication (Xác thực) — OWASP A07

|  #  | Mục kiểm tra                                                           |  Mức độ  |  ✓  |
| :-: | :--------------------------------------------------------------------- | :------: | :-: |
| S01 | Mật khẩu hash bằng bcrypt (saltRounds ≥ 12)?                           | Critical |  ☐  |
| S02 | KHÔNG lưu mật khẩu dạng plaintext?                                     | Critical |  ☐  |
| S03 | JWT secret key lấy từ env variable, KHÔNG hardcode?                    | Critical |  ☐  |
| S04 | Access Token TTL ≤ 15 phút?                                            |   High   |  ☐  |
| S05 | Refresh Token lưu trong DB, có thể revoke?                             |   High   |  ☐  |
| S06 | Token KHÔNG lưu trong localStorage? (dùng memory hoặc httpOnly cookie) |   High   |  ☐  |
| S07 | Rate limiting cho login endpoint (≤ 5 lần/phút/IP)?                    |   High   |  ☐  |
| S08 | Lock account sau N lần login sai liên tiếp?                            |  Medium  |  ☐  |

## 2. Authorization (Phân quyền) — OWASP A01

|  #  | Mục kiểm tra                                                         |  Mức độ  |  ✓  |
| :-: | :------------------------------------------------------------------- | :------: | :-: |
| S09 | Mọi API endpoint có middleware `authenticate`?                       | Critical |  ☐  |
| S10 | Mọi API endpoint có middleware `authorize` với roles phù hợp?        | Critical |  ☐  |
| S11 | Kiểm tra quyền sở hữu resource? (VD: user chỉ sửa đơn hàng của mình) | Critical |  ☐  |
| S12 | FE route guard kiểm tra auth + role?                                 |   High   |  ☐  |
| S13 | FE ẩn/disable UI theo role? (nhưng KHÔNG phụ thuộc chỉ vào FE)       |  Medium  |  ☐  |
| S14 | API không trả dữ liệu vượt phạm vi quyền?                            | Critical |  ☐  |

## 3. Injection — OWASP A03

|  #  | Mục kiểm tra                                                              |  Mức độ  |  ✓  |
| :-: | :------------------------------------------------------------------------ | :------: | :-: |
| S15 | KHÔNG nối chuỗi SQL trực tiếp? Dùng ORM / parameterized query?            | Critical |  ☐  |
| S16 | Input user được validate trước khi xử lý?                                 | Critical |  ☐  |
| S17 | KHÔNG dùng `eval()`, `Function()`, `child_process.exec()` với input user? | Critical |  ☐  |
| S18 | NoSQL injection: KHÔNG truyền object trực tiếp vào query condition?       |   High   |  ☐  |
| S19 | Command injection: KHÔNG truyền input user vào system command?            | Critical |  ☐  |

## 4. XSS (Cross-Site Scripting) — OWASP A03

|  #  | Mục kiểm tra                                                       |  Mức độ  |  ✓  |
| :-: | :----------------------------------------------------------------- | :------: | :-: |
| S20 | KHÔNG dùng `v-html` với dữ liệu từ user/API?                       | Critical |  ☐  |
| S21 | Output được encode trước khi render? (Vue.js auto-escape mặc định) |   High   |  ☐  |
| S22 | Content-Security-Policy (CSP) header được set?                     |  Medium  |  ☐  |
| S23 | HttpOnly + Secure flag cho cookie?                                 |   High   |  ☐  |

## 5. Data Exposure — OWASP A02

|  #  | Mục kiểm tra                                                     |  Mức độ  |  ✓  |
| :-: | :--------------------------------------------------------------- | :------: | :-: |
| S24 | API KHÔNG trả về password, token, secret trong response?         | Critical |  ☐  |
| S25 | Log KHÔNG chứa thông tin nhạy cảm?                               | Critical |  ☐  |
| S26 | Error response KHÔNG leak stack trace, DB schema, internal path? |   High   |  ☐  |
| S27 | `.env` file có trong `.gitignore`?                               | Critical |  ☐  |
| S28 | HTTPS bắt buộc trên mọi môi trường (trừ local)?                  | Critical |  ☐  |
| S29 | CORS chỉ whitelist domain FE?                                    |   High   |  ☐  |

## 6. File Upload — OWASP A08

|  #  | Mục kiểm tra                                                        | Mức độ |  ✓  |
| :-: | :------------------------------------------------------------------ | :----: | :-: |
| S30 | Validate file type ở cả FE và BE?                                   |  High  |  ☐  |
| S31 | Kiểm tra magic bytes (file signature), không chỉ dựa vào extension? |  High  |  ☐  |
| S32 | Giới hạn kích thước file (≤ 50MB)?                                  |  High  |  ☐  |
| S33 | Giới hạn số lượng file (≤ 10 / request)?                            | Medium |  ☐  |
| S34 | Rename file upload (không dùng tên gốc từ user)?                    |  High  |  ☐  |
| S35 | Lưu file ngoài thư mục web root?                                    |  High  |  ☐  |
| S36 | Scan virus/malware cho file upload?                                 | Medium |  ☐  |

## 7. Rate Limiting & DoS Protection — OWASP A05

|  #  | Mục kiểm tra                                                                   | Mức độ |  ✓  |
| :-: | :----------------------------------------------------------------------------- | :----: | :-: |
| S37 | Rate limiting cho tất cả API?                                                  |  High  |  ☐  |
| S38 | Rate limiting nghiêm ngặt hơn cho auth endpoints?                              |  High  |  ☐  |
| S39 | Request body size limit được set? (Express: `express.json({ limit: '10mb' })`) | Medium |  ☐  |
| S40 | Pagination max pageSize ≤ 100? (tránh trả quá nhiều data)                      | Medium |  ☐  |
| S41 | Query timeout được set ở DB level?                                             | Medium |  ☐  |

## 8. Dependency & Configuration — OWASP A06

|  #  | Mục kiểm tra                                                    |  Mức độ  |  ✓  |
| :-: | :-------------------------------------------------------------- | :------: | :-: |
| S42 | Chạy `npm audit` định kỳ, không có vulnerability critical/high? |   High   |  ☐  |
| S43 | Lock file (`package-lock.json`) được commit?                    |  Medium  |  ☐  |
| S44 | Không dùng dependency deprecated hoặc không còn maintain?       |  Medium  |  ☐  |
| S45 | Helmet middleware được sử dụng (security headers)?              |   High   |  ☐  |
| S46 | Debug mode tắt trên production?                                 | Critical |  ☐  |
| S47 | Error stack trace KHÔNG hiển thị trên production?               | Critical |  ☐  |

---

## Tổng hợp theo mức độ

| Mức độ       | Mô tả                                          | Hành động                       |
| :----------- | :--------------------------------------------- | :------------------------------ |
| **Critical** | Lỗ hổng nghiêm trọng, có thể bị khai thác ngay | PHẢI fix trước khi merge/deploy |
| **High**     | Rủi ro cao, cần xử lý sớm                      | Fix trong sprint hiện tại       |
| **Medium**   | Rủi ro trung bình                              | Lên kế hoạch fix                |
