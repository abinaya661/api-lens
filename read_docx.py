import zipfile
import xml.etree.ElementTree as ET
import sys

def extract_text_from_docx(file_path):
    try:
        with zipfile.ZipFile(file_path) as docx:
            xml_content = docx.read('word/document.xml')
        
        tree = ET.fromstring(xml_content)
        ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        text = []
        for paragraph in tree.findall('.//w:p', ns):
            texts = [node.text for node in paragraph.findall('.//w:t', ns) if node.text]
            if texts:
                text.append(''.join(texts))
        
        print('\n'.join(text))
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)

if __name__ == '__main__':
    extract_text_from_docx(sys.argv[1])
