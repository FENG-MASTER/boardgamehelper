"""将每行一词的 Markdown 词库转换成网页静态数据。"""
import argparse
import json
import re
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('source', type=Path)
args = parser.parse_args()
banks = []
for path in sorted(args.source.glob('*.md')):
    lines = path.read_text(encoding='utf-8-sig').splitlines()
    metadata = dict(line[1:].split('=', 1) for line in lines if line.startswith('#') and '=' in line)
    words = list(dict.fromkeys(line.strip() for line in lines if line.strip() and not line.lstrip().startswith('#')))
    if words:
        banks.append(dict(id=path.stem, name=re.sub(r'\(\d+\)$', '', path.stem), description=metadata.get('description', ''), words=words))
if not banks:
    raise SystemExit('没有找到有效词库')
output = Path(__file__).resolve().parents[1] / 'data' / 'words.json'
output.write_text(json.dumps(banks, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
print(f'已导入 {len(banks)} 个词库，共 {sum(len(b["words"]) for b in banks)} 个词条（各库内去重）')
