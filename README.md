# Arc

**เวอร์ชัน: 1.0.0**

Arc คือ IDE สำหรับนักเขียนนิยาย (Novel Writing IDE) ที่ออกแบบมาเพื่อช่วยให้นักเขียนจัดการโครงการนิยายของตนได้อย่างมีประสิทธิภาพ พัฒนาด้วย Tauri และ Angular

---

## 📖 Arc คืออะไร?

Arc (เดิมชื่อ Tales IDE) คือเครื่องมือสำหรับเขียนนิยายที่รวมฟีเจอร์ต่างๆ ไว้ในที่เดียว ช่วยให้นักเขียนสามารถ:

- **เขียนและจัดการบทต่างๆ** ได้อย่างเป็นระบบ
- **จัดเก็บข้อมูลโลกและตัวละคร** ในคลังข้อมูล (Codex Library)
- **ค้นหาเนื้อหา** ในโปรเจกต์ได้อย่างรวดเร็ว
- **จัดการไฟล์และโฟลเดอร์** ด้วยระบบไฟล์ที่ใช้งานง่าย
- **ควบคุมเวอร์ชัน** แบบ Git เพื่อติดตามการเปลี่ยนแปลงและสร้าง timeline แบบต่างๆ

---

## ✨ ฟีเจอร์หลัก

### 🎯 ฟีเจอร์ที่พร้อมใช้งานแล้ว (v1.0.0)

1. **โปรเจกต์และไฟล์**
   - สร้าง/เปิด/บันทึกโปรเจกต์นิยาย
   - จัดการไฟล์และโฟลเดอร์ในโครงสร้างแบบ tree
   - รองรับไฟล์นามสกุล `.arc` (ไฟล์นิยายของ Arc)
   - สร้างไฟล์และโฟลเดอร์ใหม่ได้ง่ายดาย

2. **ตัวแก้ไขข้อความ (Editor)**
   - ใช้ Tiptap Editor ที่มีความสามารถสูง
   - รองรับการจัดรูปแบบข้อความ (Bold, Italic, Underline)
   - จัดตำแหน่งข้อความ (Text Alignment)
   - มี Placeholder เพื่อช่วยเหลือผู้ใช้

3. **การจัดการบท (Chapters)**
   - จัดเรียงบทใหม่ด้วยการลากและวาง (Drag & Drop)
   - จัดกลุ่มบทเป็นเล่ม/ภาค (Grouping)
   - เลือกหลายบทพร้อมกัน (Multi-selection)
   - ไฟล์ใหม่จะปรากฏด้านบน

4. **คลังข้อมูล (Codex Library)**
   - เก็บข้อมูลตัวละคร, สถานที่, เหตุการณ์
   - สร้างหมวดหมู่ (Categories) ได้
   - จัดเก็บเป็นโฟลเดอร์ `codex/` ในโปรเจกต์

5. **ค้นหาข้อมูล (Search)**
   - ค้นหาข้อความในทุกไฟล์ของโปรเจกต์
   - แสดงผลลัพธ์พร้อมบริบท
   - นำทางไปยังตำแหน่งที่พบ

6. **การตั้งค่า (Settings)**
   - เปลี่ยนธีม/สีของ Editor
   - ปรับแต่งขนาดฟอนต์
   - ตั้งค่าต่างๆ ตามความต้องการ

7. **โปรเจกต์ล่าสุด (Recent Projects)**
   - เปิดโปรเจกต์ที่ใช้งานล่าสุดได้อย่างรวดเร็ว
   - จัดเก็บประวัติโปรเจกต์

### 🚧 ฟีเจอร์ที่กำลังพัฒนา

- **Version Control System**: ระบบควบคุมเวอร์ชันแบบ Git
  - Commits (บันทึกเวอร์ชันพร้อมข้อความ)
  - Branches (สร้าง timeline ทางเลือก)
  - History (ประวัติการเปลี่ยนแปลง)
  - Diff (เปรียบเทียบเวอร์ชัน)
  - Merge (รวม branches)
  - Stash (เก็บการเปลี่ยนแปลงชั่วคราว)

---

## 🚀 การใช้งาน

### การติดตั้ง

```bash
# ติดตั้ง dependencies
npm install

# รัน development mode
npm run start

# หรือรัน Tauri app
npm run tauri dev
```

### การสร้างโปรเจกต์ใหม่

1. เปิดแอปพลิเคชัน Arc
2. คลิก "New Project" หรือกด `Ctrl/Cmd + N`
3. เลือกตำแหน่งที่ต้องการบันทึกโปรเจกต์
4. ตั้งชื่อโปรเจกต์

### การเขียนบท

1. คลิกที่ไฟล์บทในแถบด้านซ้าย (Sidebar)
2. เริ่มเขียนในตัวแก้ไขข้อความ
3. ใช้ toolbar เพื่อจัดรูปแบบข้อความ
4. บันทึกอัตโนมัติเมื่อมีการเปลี่ยนแปลง

### การจัดการบท

- **สร้างบทใหม่**: คลิกปุ่ม "New File" ในแถบด้านซ้าย
- **เรียงลำดับบท**: ลากและวางบทไปยังตำแหน่งที่ต้องการ
- **จัดกลุ่มบท**: เลือกหลายบท (Shift+Click) แล้วคลิก "Group"

### การใช้งาน Codex Library

1. คลิกแท็บ "Codex" ในแถบด้านซ้าย
2. สร้างหมวดหมู่ใหม่ (เช่น Characters, Locations, Events)
3. เพิ่มรายการในแต่ละหมวดหมู่
4. ข้อมูลจะถูกบันทึกในโฟลเดอร์ `codex/` ของโปรเจกต์

### การค้นหา

1. คลิกแท็บ "Search" หรือกด `Ctrl/Cmd + F`
2. พิมพ์คำที่ต้องการค้นหา
3. คลิกที่ผลลัพธ์เพื่อนำทางไปยังตำแหน่งนั้น

---

## 📁 โครงสร้างไฟล์โปรเจกต์

```
my-novel/
├── chapters/           # บทต่างๆ ของนิยาย
│   ├── chapter-01.md
│   ├── chapter-02.md
│   └── ...
├── codex/             # คลังข้อมูล
│   ├── characters/    # ข้อมูลตัวละคร
│   ├── locations/     # ข้อมูลสถานที่
│   └── events/        # ข้อมูลเหตุการณ์
├── config.arc      # ข้อมูลโปรเจกต์
└── ...
```

---

## 🛠️ เทคโนโลยีที่ใช้

- **Tauri**: สร้าง Desktop Application ที่เบาและรวดเร็ว
- **Angular 20**: Framework สำหรับสร้าง UI
- **Tiptap**: Rich Text Editor
- **TailwindCSS + DaisyUI**: Styling
- **TypeScript**: Type-safe JavaScript

---

## 💻 การพัฒนา

### คำสั่งที่ใช้บ่อย

```bash
# รัน development server
npm run start

# รัน Tauri development
npm run tauri dev

# Build production
npm run build
npm run tauri build

# Watch mode
npm run watch
```

### Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/)
- Extensions:
  - [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
  - [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
  - [Angular Language Service](https://marketplace.visualstudio.com/items?itemName=Angular.ng-template)

---

## 📝 License

Copyright © 2024 L2S. All rights reserved.

---

## 🔮 อนาคตของ Arc

Arc มุ่งเป้าที่จะเป็นเครื่องมือที่ครบครันที่สุดสำหรับนักเขียนนิยาย โดยในอนาคตจะมีฟีเจอร์เพิ่มเติมอย่าง:

- Timeline Visualization
- Character Relationship Maps
- Export to various formats (PDF, EPUB, DOCX)
- Cloud Synchronization
- Collaboration Features
- Writing Statistics and Analytics

---

**Have fun writing with Arc! 🎉**
