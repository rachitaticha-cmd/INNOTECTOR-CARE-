import shutil
import os
import zipfile

src = 'public/assets/aistudio/index_dacfce75.html'
shutil.copyfile(src, 'public/innotector-care.html')
shutil.copyfile(src, 'public/innotector_care_vscode.html')

os.makedirs('vscode_html_project', exist_ok=True)
shutil.copyfile(src, 'vscode_html_project/index.html')

readme_content = """# InnoTector Care (HTML Version for VS Code)

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
"""

with open('vscode_html_project/README.md', 'w', encoding='utf-8') as f:
    f.write(readme_content)

# 1. HTML zip
zip_html_path = 'public/innotector-care-vscode-html.zip'
with zipfile.ZipFile(zip_html_path, 'w', zipfile.ZIP_DEFLATED) as zf:
    zf.write('vscode_html_project/index.html', 'index.html')
    zf.write('vscode_html_project/README.md', 'README.md')

# 2. Full source zip
zip_full_path = 'public/innotector-care-source.zip'
exclude_dirs = {'.git', 'node_modules', 'dist', '.aistudio', '.tempmediaStorage'}
exclude_files = {'innotector-care-source.zip', 'innotector-care-vscode-html.zip', 'bun.lock'}

with zipfile.ZipFile(zip_full_path, 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('.')]
        for f in files:
            if f in exclude_files or f.endswith('.pyc'):
                continue
            full_path = os.path.join(root, f)
            arcname = os.path.relpath(full_path, '.')
            zf.write(full_path, arcname)

print('Updated both zip archives successfully!')
