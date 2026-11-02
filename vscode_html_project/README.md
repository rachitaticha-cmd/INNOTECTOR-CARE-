# InnoTector Care (HTML Version for VS Code)

ไฟล์นี้เป็นโครงสร้าง HTML + CSS + JavaScript แบบ Standalone สามารถเปิดใช้งานและแก้ไขใน VS Code ได้ทันทีโดยไม่ต้องติดตั้ง Node.js หรือ npm

## 🚀 วิธีเปิดใช้งานใน VS Code:
1. เปิดโปรแกรม **Visual Studio Code**
2. เลือก **File > Open Folder...** แล้วเลือกโฟลเดอร์นี้ หรือลากไฟล์ `index.html` เข้ามาใน VS Code
3. วิธีรันเพื่อดูหน้าตาเว็บ:
   - **วิธีที่ 1 (แนะนำ):** ติดตั้ง Extension ชื่อ **Live Server** ใน VS Code แล้วคลิกขวาที่ไฟล์ `index.html` เลือก **Open with Live Server**
   - **วิธีที่ 2:** ดับเบิลคลิกที่ไฟล์ `index.html` เพื่อเปิดผ่านเว็บเบราว์เซอร์ (Google Chrome, Edge, Safari) ได้โดยตรงทันที

## 📝 ส่วนประกอบสำคัญในไฟล์ index.html:
- `<head>`: ดึงฟอนต์ Noto Sans Thai / Inter และ Leaflet CSS
- `<style>`: CSS ดีไซน์จำลอง Smartphone Frame, สไตล์ธีมโรงพยาบาลและระบบสุขภาพ, Responsive UI
- `<body>`: โครงสร้างหน้าจอทั้งหมด (Login, Home, Triage ประเมินอาการ, Map แผนที่โรงพยาบาล, Queues คิวตรวจ, Profile)
- `<script>`: ระบบการทำงาน Logic, การคำนวณระดับความเร่งด่วน, ระบบคิว, และ Leaflet Maps
