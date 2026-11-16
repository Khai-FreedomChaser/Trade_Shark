from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

OUT = r'D:\document\ki6\TT\Bao_cao_CICD_Trade_Shark_nhom_2.docx'

def shade(cell, fill):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = tcPr.find(qn('w:shd'))
    if shd is None:
        shd = OxmlElement('w:shd'); tcPr.append(shd)
    shd.set(qn('w:fill'), fill)

def borders(table, color='D9D9D9'):
    tblPr = table._tbl.tblPr
    b = tblPr.first_child_found_in('w:tblBorders')
    if b is None:
        b = OxmlElement('w:tblBorders'); tblPr.append(b)
    for edge in ('top','left','bottom','right','insideH','insideV'):
        tag = 'w:' + edge; el = b.find(qn(tag))
        if el is None: el = OxmlElement(tag); b.append(el)
        el.set(qn('w:val'), 'single'); el.set(qn('w:sz'), '6'); el.set(qn('w:space'), '0'); el.set(qn('w:color'), color)

def cell_text(cell, text, bold=False, color='000000', size=10.5):
    cell.text = ''; p = cell.paragraphs[0]; p.paragraph_format.space_after = Pt(2)
    r = p.add_run(text); r.bold = bold; r.font.name = 'Aptos'; r.font.size = Pt(size); r.font.color.rgb = RGBColor.from_string(color)
    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER

doc = Document(); sec = doc.sections[0]
sec.top_margin = Inches(.75); sec.bottom_margin = Inches(.7); sec.left_margin = Inches(.85); sec.right_margin = Inches(.85)
styles = doc.styles; styles['Normal'].font.name = 'Aptos'; styles['Normal'].font.size = Pt(11); styles['Normal'].font.color.rgb = RGBColor(0,0,0); styles['Normal'].paragraph_format.line_spacing = 1.15; styles['Normal'].paragraph_format.space_after = Pt(6)
for name, size in [('Title',19), ('Heading 1',14), ('Heading 2',12)]:
    st=styles[name]; st.font.name='Aptos Display' if name=='Title' else 'Aptos'; st.font.size=Pt(size); st.font.bold=True; st.font.color.rgb=RGBColor(0,0,0)

p=doc.add_paragraph(style='Title'); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.add_run('BÁO CÁO TRIỂN KHAI QUY TRÌNH CI/CD')
p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; r=p.add_run('Tự động hóa build và kiểm thử API cho dự án Trade Shark'); r.bold=True; r.font.size=Pt(12); r.font.color.rgb=RGBColor(70,70,70)

info=doc.add_table(rows=3, cols=2); info.alignment=WD_TABLE_ALIGNMENT.CENTER; info.autofit=False
for row in info.rows: row.cells[0].width=Inches(1.65); row.cells[1].width=Inches(4.8)
for idx,(a,b) in enumerate([('Dự án','Trade Shark'),('Nội dung','Tích hợp Jenkins, Docker và Postman CLI'),('Kho mã nguồn','Khai-FreedomChaser/Trade_Shark')]):
    cell_text(info.rows[idx].cells[0],a,True); cell_text(info.rows[idx].cells[1],b); shade(info.rows[idx].cells[0],'EAF1F8')
borders(info); doc.add_paragraph()

doc.add_heading('1. Mục tiêu và phạm vi', level=1)
doc.add_paragraph('Báo cáo trình bày cách xây dựng một quy trình CI/CD có khả năng tự lấy mã nguồn, chuẩn bị môi trường, đóng gói Frontend và kiểm tra các API của dự án Trade Shark. Jenkins đóng vai trò điều phối, Docker cung cấp các dịch vụ cần thiết, còn Postman CLI thực hiện phần kiểm thử tự động.')
doc.add_paragraph('Phạm vi thực hành tập trung vào việc kết nối các thành phần trong môi trường cục bộ. Backend NodeJS được chạy trên máy Host và sử dụng MySQL trong Docker; Pipeline của Jenkins sau đó truy cập Backend thông qua địa chỉ host.docker.internal.')

doc.add_heading('2. Mô hình thành phần', level=1)
t=doc.add_table(rows=1, cols=3); t.alignment=WD_TABLE_ALIGNMENT.CENTER
for i,h in enumerate(['Thành phần','Vai trò trong quy trình','Cách kết nối']): cell_text(t.rows[0].cells[i],h,True,'FFFFFF'); shade(t.rows[0].cells[i],'365F91')
for row in [('GitHub và nhánh main','Lưu Jenkinsfile, Collection và Environment của Postman','Jenkins lấy mã qua Pipeline from SCM'),('Jenkins Controller','Điều phối các stage và ghi nhận trạng thái chạy','Docker Compose, cổng 8080 và 50000'),('MySQL','Cung cấp cơ sở dữ liệu cho Backend','Chạy song song trong Docker Compose'),('Backend NodeJS','Cung cấp các endpoint cho bộ kiểm thử','Chạy trên Host ở cổng 3636'),('Postman CLI','Gửi request và đánh giá assertion của API','Được cài trong Pipeline')]:
    cells=t.add_row().cells
    for i,txt in enumerate(row): cell_text(cells[i],txt)
borders(t)

doc.add_heading('3. Quy trình thực hiện', level=1)
doc.add_heading('3.1 Chuẩn bị mã nguồn và hạ tầng', level=2)
doc.add_paragraph('Nhóm tạo nhánh CICD để phát triển các tệp phục vụ tự động hóa. Sau khi kiểm tra, các thay đổi được hợp nhất vào nhánh main để Jenkins có thể lấy một phiên bản thống nhất của dự án.')
doc.add_paragraph('Docker Compose được dùng để khởi chạy Jenkins từ image jenkins/jenkins:lts-jdk21 và dịch vụ MySQL. Jenkins mở các cổng 8080 và 50000; volume jenkins-home được mount để giữ lại cấu hình khi container khởi động lại.')
doc.add_heading('3.2 Thiết lập Jenkins', level=2)
doc.add_paragraph('Sau khi truy cập Jenkins tại http://localhost:8080 và hoàn tất thiết lập ban đầu, công cụ NodeJS được khai báo trong Manage Jenkins > Tools. Việc này giúp Pipeline có sẵn môi trường để chạy các lệnh npm trong giai đoạn build.')
doc.add_heading('3.3 Xây dựng bộ kiểm thử API', level=2)
doc.add_paragraph('Collection Trade_Shark_API gồm 5 request, bao phủ các thao tác CRUD đối với thực thể Stock. Mỗi request có assertion để kiểm tra kết quả trả về thay vì chỉ dựa vào việc request được gửi thành công.')
doc.add_paragraph('Collection và Environment được xuất dưới dạng YAML rồi đặt trong repository. Biến base_url được sử dụng làm địa chỉ nền, nhờ đó Pipeline có thể truyền địa chỉ Backend phù hợp khi chạy.')
doc.add_heading('3.4 Định nghĩa Pipeline', level=2)
doc.add_paragraph('Jenkinsfile được đặt tại thư mục gốc của repository. Luồng xử lý gồm ba stage liên tiếp:')
for title,body in [('Cài đặt Postman CLI','Tải và cài đặt công cụ để Jenkins có thể chạy bộ kiểm thử.'),('Build Frontend','Chạy npm ci nhằm cài dependency theo cách sạch và ổn định, sau đó chạy npm run build để tạo bản đóng gói.'),('Kiểm thử API','Gọi Postman CLI với Collection và Environment đã lưu trong repository, đồng thời tổng hợp kết quả assertion.')]:
    p=doc.add_paragraph(style='List Bullet'); p.add_run(title+': ').bold=True; p.add_run(body)
doc.add_heading('3.5 Tạo Job và kích hoạt chạy', level=2)
doc.add_paragraph('Một Item kiểu Pipeline được tạo trên Jenkins. Trong phần cấu hình, lựa chọn Pipeline script from SCM, khai báo repository GitHub, chọn nhánh */main và đặt Script Path là Jenkinsfile. Sau khi lưu, lệnh Build Now được dùng để khởi chạy quy trình.')

doc.add_heading('4. Kết quả và minh chứng', level=1)
doc.add_paragraph('Để Pipeline có thể gọi được API, Backend NodeJS được khởi động thủ công bằng npm run dev trên máy Host và kết nối đến MySQL đang chạy trong Docker. Jenkins Container truy cập Backend qua địa chỉ bridge http://host.docker.internal:3636.')
rt=doc.add_table(rows=1, cols=2); rt.alignment=WD_TABLE_ALIGNMENT.CENTER
for i,h in enumerate(['Hạng mục kiểm tra','Kết quả ghi nhận']): cell_text(rt.rows[0].cells[i],h,True,'FFFFFF'); shade(rt.rows[0].cells[i],'365F91')
for a,b in [('Kết nối Jenkins và Backend','Thành công qua host.docker.internal:3636'),('Build Frontend','Hoàn tất, không phát sinh lỗi'),('Số request Postman','5 request thuộc các thao tác CRUD của Stock'),('Assertion','5/5 assertion Pass'),('Trạng thái Pipeline','Finished: SUCCESS')]:
    cells=rt.add_row().cells; cell_text(cells[0],a); cell_text(cells[1],b)
borders(rt)

doc.add_heading('5. Nhận xét', level=1)
doc.add_paragraph('Quy trình đã tách được ba nhiệm vụ quan trọng của một lần tích hợp: chuẩn bị công cụ, đóng gói ứng dụng và xác nhận hành vi API. Việc lưu Jenkinsfile cùng cấu hình Postman trong repository giúp quy trình có thể được truy vết và chạy lại theo cùng một cấu hình.')
doc.add_paragraph('Kết quả Finished: SUCCESS cùng 5 assertion Pass cho thấy Pipeline đã hoàn thành đúng luồng dự kiến trong môi trường thực hành. Điểm cần lưu ý khi tái hiện là Backend phải được bật trước khi chạy Job và địa chỉ base_url phải trỏ đúng tới cổng mà Jenkins Container có thể truy cập.')
doc.add_heading('6. Kết luận', level=1)
doc.add_paragraph('Bài thực hành đã triển khai thành công quy trình CI/CD cho Trade Shark với Jenkins làm bộ điều phối, Docker làm lớp hạ tầng và Postman CLI làm công cụ kiểm thử API. Mô hình này tạo ra một bước kiểm tra tự động sau mỗi lần cập nhật mã nguồn, từ đó giảm phụ thuộc vào việc kiểm tra thủ công và cung cấp tín hiệu rõ ràng về trạng thái của bản build.')
doc.save(OUT); print(OUT)
