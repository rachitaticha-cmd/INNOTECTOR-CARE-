# InnoTector Care - AI Smart Triage & Hospital Queue

ระบบคัดกรองอาการอัจฉริยะ (AI Smart Triage) และจองคิวโรงพยาบาลแบบเรียลไทม์ พร้อมแดชบอร์ดสุขภาพส่วนบุคคล

## 🛠 วิธีติดตั้งและรันโปรเจกต์ (Getting Started)

1. **ติดตั้ง Dependencies:**
   ```bash
   npm install
   ```

2. **ตั้งค่า Environment Variables:**
   คัดลอกไฟล์ `.env.example` เป็น `.env`
   ```bash
   cp .env.example .env
   ```
   ใส่ `GEMINI_API_KEY` หากต้องการใช้งาน AI ฟีเจอร์

3. **รันเซิร์ฟเวอร์สำหรับการพัฒนา (Development):**
   ```bash
   npm run dev
   ```
   เปิดเบราว์เซอร์ที่ [http://localhost:3000](http://localhost:3000)

4. **บิลด์สำหรับ Production:**
   ```bash
   npm run build
   npm run preview
   ```

## 📱 เทคโนโลยีที่ใช้
- **React 19** + **TypeScript**
- **Vite**
- **Tailwind CSS v4**
- **Lucide Icons**
- **Motion (Framer Motion)**
- **Leaflet Map** (แผนที่โรงพยาบาลและระยะทาง)
- **@google/genai** (AI Gemini API)
