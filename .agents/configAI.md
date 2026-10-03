# Hướng dẫn sử dụng AI trong dự án XXX

Tài liệu này mô tả **cách tổ chức và sử dụng các công cụ AI** (GitHub Copilot, Claude Code, Google Antigravity) trong dự án XXX, để mọi thành viên cấu hình và sử dụng AI theo cùng một quy ước, bất kể dùng công cụ nào.

> Cập nhật: 10/2026. Cấu hình của các công cụ AI thay đổi nhanh. Khi có nghi ngờ, đối chiếu với tài liệu chính thức ở mục 8.

## 1. Bốn khái niệm cốt lõi

| Thành phần | Vai trò | Ví dụ trong XXX |

| :--- | :--- | :--- |

| **Instruction** | "Hiến pháp" / nội quy chung, nạp vào **mọi** cuộc chat. Chỉ viết ngắn gọn, bao quát (ngôn ngữ giao tiếp, coding convention). Có thể kèm **rule theo phạm vi file**, chỉ nạp khi AI làm việc với file khớp pattern. | `AGENTS.md` |

| **Agent** | "Nhân sự ảo": một vai trò cụ thể, có system prompt, phạm vi tài liệu và **danh sách tool được phép dùng** riêng. | `dd-auditor`, `screen-designer` |

| **Skill** | Một kỹ năng hoặc quy trình tái sử dụng được, đóng gói dưới dạng thư mục chứa `SKILL.md` (kèm script, template nếu cần). Gọi thủ công bằng `/tên-skill` hoặc để AI tự nạp khi mô tả khớp với tác vụ. | `generate-api`, `create-screen` |

| **Workflow** | Quy trình nhiều bước để hoàn thành một nghiệp vụ từ A đến Z. **Trong dự án này, workflow được viết dưới dạng Skill** (xem giải thích bên dưới). | `create-screen` |

Quan hệ: **Instruction** quy định luật chung → **Agent** đóng vai một chuyên viên tuân theo luật đó → Agent dùng các **Skill** để làm từng tác vụ → một **Workflow** (cũng là skill) chỉ định thứ tự các bước, có thể chuyển giao giữa nhiều Agent.

**Vì sao Workflow viết bằng Skill?** Cả ba công cụ đều hỗ trợ chuẩn mở Agent Skills (`SKILL.md`, xem agentskills.io), trong khi khái niệm "workflow" riêng của từng công cụ hoặc không tồn tại (Copilot), hoặc mang nghĩa khác (Claude Code: script JavaScript điều phối subagent), hoặc đã bị khai tử (Antigravity: ngừng từ 01/11/2026). Viết bằng skill giúp nội dung quy trình chỉ cần viết **một lần** cho mọi công cụ.

## 2. Cấu trúc thư mục của dự án

```text

XXX/

├── AGENTS.md # Luật chung (cả 3 công cụ cùng đọc)

├── CLAUDE.md # (Tùy chọn) chỉ chứa dòng @AGENTS.md, xem mục 3.2

│

├── .agents/

│ ├── skills/ # NGUỒN GỐC của mọi skill/workflow

│ │ ├── create-screen/

│ │ │ └── SKILL.md # Workflow 4 bước: tạo màn hình + API mới

│ │ └── generate-api/

│ │ └── SKILL.md # Skill: sinh Endpoint API + cập nhật Interface List

│ ├── agents/ # Agent cho Antigravity

│ │ ├── dd-auditor.md

│ │ └── screen-designer.md

│ └── rules/ # (Tùy chọn) rule theo phạm vi file cho Antigravity

│

├── .claude/

│ ├── skills/ # Symlink hoặc bản sao từ .agents/skills/ (cho Claude Code)

│ ├── agents/ # Agent cho Claude Code

│ │ ├── dd-auditor.md

│ │ └── screen-designer.md

│ └── rules/ # (Tùy chọn) rule theo phạm vi file cho Claude Code

│

├── .github/

│ ├── agents/ # Agent cho GitHub Copilot

│ │ ├── dd-auditor.agent.md

│ │ └── screen-designer.agent.md

│ └── instructions/ # (Tùy chọn) rule theo phạm vi file cho Copilot

│ # Tên file BẮT BUỘC dạng *.instructions.md

│

├── Api/ # Code Controller/API

├── Screen/ # Code màn hình (component)

├── Batch&ETL/

├── 画面xx一覧.md # Danh sách màn hình (Screen ID)

├── xx.md # Định nghĩa endpoint theo từng màn hình

└── インターフェース一覧.md # Danh sách Interface ID (API) toàn hệ thống

```

> **Thay tên 3 file dữ liệu tiếng Nhật ở trên bằng tên thật** của dự án. Đây là nguồn dữ liệu tham chiếu cho `dd-auditor` , `screen-designer` và skill `create-screen` . Agent tham chiếu theo **đường dẫn chính xác** , nên **không đổi tên/di chuyển** các file này nếu không cập nhật lại đường dẫn ở mọi nơi tham chiếu (xem mục 6, quy ước số 6).

### Vai trò của từng Agent

- ** `dd-auditor` ** (chỉ đọc): chỉ tra cứu 3 file dữ liệu trên, đối soát Screen ID ↔ Endpoint ↔ Interface ID, trả về bảng `[Mã màn hình | Tên màn hình | Endpoint | Khớp/Lệch | Hướng xử lý]`. **Không được sửa file**: điều này được khóa bằng danh sách tool chỉ đọc trong front-matter, không chỉ bằng lời dặn.

- ** `screen-designer` **: nhận tên màn hình → tra Screen ID → kiểm tra endpoint cần có → kiểm tra trùng lặp Interface ID → viết code Controller trong `Api/` và cập nhật tài liệu liên quan → chuyển giao cho `dd-auditor` để đối soát cuối.

### Các Skill

- ** `create-screen` ** (workflow): khi có yêu cầu "Tạo mới màn hình [Tên màn hình]", AI tuân theo đúng 4 bước: (1) khởi tạo Screen ID → (2) khai báo Endpoint/Interface ID → (3) viết code → (4) đối soát theo checklist.

- ** `generate-api` **: sinh nhanh DTO + Controller + dòng cập nhật cho `インターフェース一覧.md`.

## 3. Cấu hình theo từng công cụ

### 3.1. Bảng tương đương

| Thành phần | GitHub Copilot | Claude Code | Antigravity |

| :--- | :--- | :--- | :--- |

| Luật chung | `AGENTS.md` (hoặc `.github/copilot-instructions.md`) | `AGENTS.md` (hoặc `CLAUDE.md`) | `AGENTS.md` (hoặc `GEMINI.md`) |

| Rule theo phạm vi file | `.github/instructions/*.instructions.md` (front-matter `applyTo`) | `.claude/rules/*.md` (front-matter `paths`) | `.agents/rules/*.md` (front-matter `trigger` **bắt buộc**) |

| Agent | `.github/agents/*.agent.md` | `.claude/agents/*.md` | `.agents/agents/<tên>.md` |

| Skill / Workflow | `.agents/skills/<tên>/SKILL.md` (Copilot cũng đọc `.github/skills/`, `.claude/skills/`) | `.claude/skills/<tên>/SKILL.md` | `.agents/skills/<tên>/SKILL.md` |

Những thứ **không** dùng trong dự án (dễ nhầm):

| Đường dẫn | Lý do không dùng |

| :--- | :--- |

| `.github/instructions/*.md` cho workflow | Thư mục này chỉ dành cho rule theo phạm vi file, tên phải là `*.instructions.md`. File đặt sai tên sẽ không được nạp. |

| `.github/prompts/*.prompt.md` | Vẫn hoạt động, nhưng dự án dùng skill để dùng chung được với Claude Code và Antigravity. |

| `.claude/commands/*.md` | Định dạng cũ, đã gộp vào skills. |

| `.claude/workflows/` | Dành cho "dynamic workflow" (script JavaScript điều phối nhiều subagent, không cho người dùng nhập giữa chừng). Không phải nơi đặt quy trình Markdown. |

| `.agents/workflows/` (Antigravity) | Đã deprecate, **ngừng hoạt động từ 01/11/2026**. |

| `.antigravity/...`, file `*.yaml` | Antigravity không dùng thư mục hay định dạng này. |

### 3.2. GitHub Copilot (VS Code)

- **Luật chung:** Copilot đọc `AGENTS.md`. Nếu vẫn giữ `.github/copilot-instructions.md` thì chỉ để những gì riêng cho Copilot, không lặp lại nội dung của `AGENTS.md`.

- **Chọn agent:** mở dropdown **Agent** trong khung chat và chọn `dd-auditor` hoặc `screen-designer`. **Không dùng `@workspace` ** cho việc này: `@workspace` là chat participant riêng, chỉ chạy ở Ask mode và không gọi được tool, nên không sinh/sửa code được. Muốn hỏi về toàn bộ codebase trong agent mode thì dùng `#codebase`.

- **Gọi skill:** gõ `/create-screen` hoặc `/generate-api` trong khung chat. Copilot cũng có thể tự nạp skill khi yêu cầu khớp với `description`.

- **Chuyển giao giữa agent:** `screen-designer.agent.md` khai báo `handoffs` sang `dd-auditor`, nên sau khi xong bước 3 sẽ có nút chuyển sang bước đối soát.

- **Kiểm tra file đã được nạp chưa:** xem phần references của câu trả lời chat.

### 3.3. Claude Code

- **Luật chung:** Claude Code (v2.1.277 trở lên) đọc trực tiếp `AGENTS.md` **khi repo không có `CLAUDE.md` **. Nếu repo có `CLAUDE.md` (ví dụ để hỗ trợ phiên bản cũ hơn), file đó chỉ cần chứa:

```markdown
@AGENTS.md
```

- **Skill:** Claude Code chỉ đọc `.claude/skills/`. Mỗi thư mục trong đó là **symlink** tới thư mục tương ứng trong `.agents/skills/`:

```bash

mkdir -p .claude/skills

ln -s ../../.agents/skills/create-screen .claude/skills/create-screen

ln -s ../../.agents/skills/generate-api .claude/skills/generate-api

```

**Lưu ý Windows:** Git trên Windows checkout symlink thành file text thường nếu chưa bật `core.symlinks` (và tạo symlink cần quyền Administrator hoặc Developer Mode). Nếu team có người dùng Windows, thay symlink bằng script đồng bộ sao chép `.agents/skills/` sang `.claude/skills/`, và chỉ sửa ở `.agents/skills/`.

- **Gọi agent:** gõ `@` rồi chọn agent (ví dụ `@"dd-auditor (agent)"`), hoặc nêu tên trong câu lệnh ("Dùng dd-auditor để đối soát màn hình X").

- **Gọi skill:** `/create-screen <Tên màn hình>`, `/generate-api`.

- **Kiểm tra:** `/context` để xem instruction và rule nào đã nạp. `/skills` để xem danh sách skill.

- **Chuyển đổi nhanh từ Copilot:** `/init` đọc được `.github/copilot-instructions.md`, `/import` mang commands, subagents và skills từ công cụ khác sang.

### 3.4. Google Antigravity

- **Luật chung:** Antigravity đọc `AGENTS.md` ở gốc (và ở thư mục con, nếu có).

- **Agent:** đặt ở `.agents/agents/`. Hiện chỉ dùng được trên **Antigravity 2.0 và Antigravity CLI**, chưa có trên Antigravity IDE. Chọn agent qua lệnh `/agents`.

- **Skill:** đọc trực tiếp từ `.agents/skills/`, gọi bằng `/create-screen`, `/generate-api`.

- **Rule theo phạm vi file:** mỗi file trong `.agents/rules/` **phải** có front-matter với `trigger` hợp lệ (`always_on`, `model_decision`, `glob`, `manual`). Thiếu front-matter thì rule bị bỏ qua mà không báo lỗi.

## 4. Mẫu file

### 4.1. Skill: `.agents/skills/create-screen/SKILL.md`

Front-matter chỉ dùng các trường thuộc chuẩn Agent Skills (`name`, `description`) để mọi công cụ đều đọc được.

```markdown
---
name: create-screen

description: Quy trình 4 bước tạo mới một màn hình và API tương ứng trong dự án XXX. Dùng khi người dùng yêu cầu "Tạo mới màn hình [Tên màn hình]".
---

# Tạo mới màn hình

Thực hiện tuần tự, không bỏ bước. Sau mỗi bước, báo kết quả ngắn gọn trước khi sang bước tiếp theo.

## Bước 1: Khởi tạo Screen ID

- Tra `画面xx一覧.md`, xác định Screen ID tiếp theo theo quy tắc đánh số hiện có.

- Nếu tên màn hình đã tồn tại: dừng lại và hỏi người dùng.

## Bước 2: Khai báo Endpoint / Interface ID

- Thêm endpoint vào `xx.md`.

- Kiểm tra trùng lặp trong `インターフェース一覧.md` trước khi cấp Interface ID mới.

## Bước 3: Viết code

- Controller trong `Api/`, component trong `Screen/`, theo convention trong `AGENTS.md`.

## Bước 4: Đối soát (checklist)

- [ ] Screen ID có trong `画面xx一覧.md`

- [ ] Endpoint có trong `xx.md` và khớp với code trong `Api/`

- [ ] Interface ID có trong `インターフェース一覧.md`, không trùng

- [ ] Trả về bảng `[Mã màn hình | Tên màn hình | Endpoint | Khớp/Lệch | Hướng xử lý]`
```

### 4.2. Agent `dd-auditor` cho từng công cụ

Phần thân (system prompt) **giống nhau** ở cả ba file. Chỉ front-matter khác nhau, vì tên tool khác nhau giữa các công cụ.

**Phần thân dùng chung:**

```markdown
Bạn là chuyên viên đối soát thiết kế của dự án XXX.

Chỉ đọc 3 file: `画面xx一覧.md`, `xx.md`, `インターフェース一覧.md` và code trong `Api/`.

Không suy diễn ngoài phạm vi các file này. Không sửa bất kỳ file nào.

Kết quả luôn là bảng: [Mã màn hình | Tên màn hình | Endpoint | Khớp/Lệch | Hướng xử lý].
```

**Front-matter Copilot** (`.github/agents/dd-auditor.agent.md`):

```yaml
---
name: dd-auditor

description: Đối soát tính nhất quán giữa Màn hình, Endpoint và Interface ID. Chỉ đọc, không sửa file.

tools: ["search", "read"]

---
```

**Front-matter Claude Code** (`.claude/agents/dd-auditor.md`):

```yaml
---
name: dd-auditor

description: Đối soát tính nhất quán giữa Màn hình, Endpoint và Interface ID. Chỉ đọc, không sửa file.

tools: Read, Grep, Glob

---
```

**Front-matter Antigravity** (`.agents/agents/dd-auditor.md`):

```yaml
---
name: dd-auditor

description: Đối soát tính nhất quán giữa Màn hình, Endpoint và Interface ID. Chỉ đọc, không sửa file.

tools:
  - view_file

  - grep_search

---
```

> Tên tool của Copilot thay đổi theo phiên bản VS Code. Dùng nút cấu hình tool khi mở file `.agent.md` trong VS Code để chọn đúng tên, sau đó kiểm tra agent không có quyền sửa file.

### 4.3. Handoff từ `screen-designer` sang `dd-auditor` (Copilot)

```yaml
---
name: screen-designer

description: Thiết kế màn hình và API mới theo skill create-screen.

handoffs:
  - label: Đối soát với dd-auditor

agent: dd-auditor

prompt: Đối soát màn hình vừa tạo theo checklist bước 4.

send: false

---
```

## 5. Quy ước khi thêm mới

**Thêm Skill hoặc Workflow mới:** tạo thư mục `.agents/skills/<tên>/` chứa `SKILL.md`.

- Front-matter chỉ gồm `name` (chữ thường, nối bằng gạch ngang, trùng tên thư mục) và `description` (nêu rõ skill làm gì và **khi nào** dùng).

- Phần thân mô tả rõ input cần gì, output gồm những khối nào (code / Markdown update).

- Nếu là workflow: trình bày các bước tuần tự bắt buộc, có bước checklist/đối soát ở cuối.

- Giữ `SKILL.md` dưới khoảng 500 dòng. Tài liệu tham khảo dài, script, template thì đặt thành file riêng trong cùng thư mục.

- Sau đó tạo symlink (hoặc chạy script đồng bộ) sang `.claude/skills/`.

**Thêm Agent mới:** tạo **đủ 3 file** (`.github/agents/<tên>.agent.md`, `.claude/agents/<tên>.md`, `.agents/agents/<tên>.md`) với cùng phần thân.

- Front-matter luôn có `name` và `description` (bắt buộc với Claude Code và Antigravity).

- Khai rõ phạm vi tài liệu được phép đọc trong phần thân.

- **Giới hạn tool bằng front-matter `tools` **: agent chỉ đọc thì không cấp tool sửa file. Lời dặn trong văn bản chỉ là ràng buộc mềm, AI có thể không tuân theo.

**Thêm rule theo phạm vi file** (ví dụ quy tắc riêng cho `Api/**`): chỉ thêm khi thật cần, và tạo đủ 3 file:

- Copilot: `.github/instructions/<tên>.instructions.md` với `applyTo: "Api/**"`

- Claude Code: `.claude/rules/<tên>.md` với `paths: ["Api/**"]`

- Antigravity: `.agents/rules/<tên>.md` với `trigger: glob` và `globs: "Api/**"`

**Sửa luật chung** (`AGENTS.md`): chỉ thêm quy tắc mang tính **bao quát, ít thay đổi** (ngôn ngữ, naming convention, chuẩn response API). Giữ file dưới khoảng 200 dòng. Không nhồi chi tiết nghiệp vụ hoặc quy trình nhiều bước vào đây; việc đó thuộc về Agent/Skill.

**Ràng buộc bắt buộc** (ví dụ: cấm AI sửa 3 file dữ liệu tiếng Nhật): dùng cơ chế permission/hook của từng công cụ, không chỉ ghi trong instruction.

**Khi di chuyển hoặc đổi tên 3 file dữ liệu tiếng Nhật:** tìm và cập nhật đường dẫn trong toàn bộ `AGENTS.md`, `.agents/`, `.claude/`, `.github/`.

## 6. Kiểm tra cấu hình

| Công cụ | Cách kiểm tra |

| :--- | :--- |

| GitHub Copilot | Xem references trong câu trả lời chat để biết instruction nào đã nạp. Gõ `/` để thấy danh sách skill. Mở dropdown Agent để thấy agent. |

| Claude Code | `/context` (instruction, rule đã nạp), `/skills` (danh sách skill), `@` (danh sách agent). |

| Antigravity | `/agents` (danh sách agent). Gõ `/` để thấy skill. Hỏi trực tiếp "Which rules and skills are installed?". |

## 7. Ghi chú chuyển đổi từ cấu hình cũ

Việc cần làm khi chuyển từ cấu hình cũ (chỉ có `.github/`):

- [ ] Chuyển nội dung chung từ `.github/copilot-instructions.md` sang `AGENTS.md`. Xóa file cũ, hoặc chỉ giữ lại phần riêng cho Copilot.

- [ ] Chuyển `.github/instructions/create-screen-workflow.md` thành `.agents/skills/create-screen/SKILL.md`, rồi xóa file cũ. File cũ thiếu đuôi `.instructions.md` nên nhiều khả năng **chưa từng được Copilot nạp**.

- [ ] Chuyển `.github/prompts/generate-api.prompt.md` thành `.agents/skills/generate-api/SKILL.md`.

- [ ] Thêm `tools` chỉ đọc cho `dd-auditor` và `handoffs` cho `screen-designer` trong `.github/agents/`.

- [ ] Tạo symlink hoặc script đồng bộ cho `.claude/skills/`.

- [ ] Tạo bản agent cho `.claude/agents/` và `.agents/agents/`.

- [ ] Nếu ai đó đã dùng workflow trong `.agents/workflows/` của Antigravity: chạy `/migrate-workflows` **trước 01/11/2026**.

## 8. Tài liệu chính thức

- GitHub Copilot (VS Code): https://code.visualstudio.com/docs/agent-customization/custom-instructions, https://code.visualstudio.com/docs/agent-customization/custom-agents, https://code.visualstudio.com/docs/agent-customization/agent-skills

- Claude Code: https://code.claude.com/docs/en/memory, https://code.claude.com/docs/en/skills, https://code.claude.com/docs/en/sub-agents

- Antigravity: https://antigravity.google/docs/rules/, https://antigravity.google/docs/skills/, https://antigravity.google/docs/subagents

- Chuẩn Agent Skills: https://agentskills.io
