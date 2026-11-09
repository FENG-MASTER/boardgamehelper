"""Extract the supplied TTS ZIP (named .rar) into web assets. Requires Pillow."""
import argparse, hashlib, io, json, re, zipfile
from pathlib import Path
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument('archive', type=Path)
parser.add_argument('--sarah', type=Path, help='Optional 10-column/7-row Sarah card atlas')
parser.add_argument('--output', type=Path, default=Path('games/great-western-trail-new-zealand'))
args = parser.parse_args()
out = args.output
(out / 'assets').mkdir(parents=True, exist_ok=True)
archive = zipfile.ZipFile(args.archive)
source = json.loads(archive.read('Mods/Workshop/3023692927.json'))
files = {Path(n).stem: n for n in archive.namelist() if n.startswith('Mods/Images/')}
cache, images = {}, {}
def asset(url, crop=None, limit=650):
    if not url: return None
    key = re.sub(r'[^a-zA-Z0-9]', '', url)
    if key not in files: raise ValueError('Missing texture: ' + url)
    ident = hashlib.sha256((url + str(crop)).encode()).hexdigest()[:16]
    if ident in images: return images[ident]
    if key not in cache: cache[key] = Image.open(io.BytesIO(archive.read(files[key]))).convert('RGB')
    im = cache[key]
    if crop:
        col, row, cols, rows = crop
        im = im.crop((round(col*im.width/cols),round(row*im.height/rows),round((col+1)*im.width/cols),round((row+1)*im.height/rows)))
    else: im = im.copy()
    im.thumbnail((limit, limit))
    name = f'assets/{ident}.webp'
    im.save(out / name, quality=86)
    images[ident] = name
    return name
objects = {o['GUID']: o for o in source['ObjectStates']}
catalog = {'cards': {}, 'tiles': {}, 'groups': {}, 'source': args.archive.name}
def deck(o, group):
    ids = []
    decks = o['CustomDeck']
    for child in o['ContainedObjects']:
        cid = child['CardID']; key = str(cid); meta = decks[str(cid//100)]
        cols, rows = meta['NumWidth'], meta['NumHeight']
        catalog['cards'][key] = {'id':key, 'name':group, 'group':group, 'image':asset(meta['FaceURL'],(cid%100%cols,cid%100//cols,cols,rows)), 'sourceCardId':cid}
        ids.append(key)
    catalog['groups'][group] = ids

def tile(o, group):
    cid = o['GUID']; meta = o['CustomImage']
    catalog['tiles'][cid] = {'id':cid,'name':o.get('Nickname') or group,'group':group,'image':asset(meta['ImageURL']),'back':asset(meta.get('ImageSecondaryURL'))}
    return cid
for guid,group in [('20c5ec','starter'),('96d3e4','sheep'),('289f92','objective'),('127f04','dog'),('ef5f80','romney'),('88307f','bird'),('1ed2d8','ferry')]: deck(objects[guid],group)
for o in objects['67c2d5']['ContainedObjects']: deck(o,'bonus'+o['Nickname'])
for guid,group in [('ea160c','harbourmaster'),('ee1aaf','neutral'),('b74ca4','bagA'),('5c8c23','bagB')]:
    catalog['groups'][group] = [tile(o,group) for o in objects[guid]['ContainedObjects']]
# Four workers already sit on the job market in the source save.
catalog['groups']['initialWorkers'] = [tile(objects[g],'worker') for g in ['2c83f3','0a4b6e','9c3059','7cd222']]
private = ['7d5060','6501cf','8c5a7e','0805c8','7b002e','f1b66e','a29ab7','d19767','1deae0','3b8c04']
catalog['groups']['private'] = [tile(objects[g],'private') for g in private]
for i,k in enumerate(catalog['groups']['private']): catalog['tiles'][k]['name'] = f'私有建筑 {i+1}'
for key,guid,limit in [('board','3d8288',3000),('playerBoard','f5a63a',1500),('reference','0e87f4',1400)]:
    catalog[key] = asset(objects[guid]['CustomImage']['ImageURL'],limit=limit)
for name,needle in [('rulebook','5006615294'),('appendix','5006616616')]:
    n=next(n for n in archive.namelist() if n.startswith('Mods/PDF/') and needle in n)
    (out / 'assets' / (name+'.pdf')).write_bytes(archive.read(n))
(out / 'catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,separators=(',',':')))
print(f'Extracted {len(images)} images, {len(catalog["cards"])} card faces and {len(catalog["tiles"])} tiles.')

if args.sarah:
    atlas = Image.open(args.sarah).convert('RGB')
    for number in range(1, 19):
        col, row = (number - 1) % 10, (number - 1) // 10
        card = atlas.crop((round(col * atlas.width / 10), round(row * atlas.height / 7), round((col + 1) * atlas.width / 10), round((row + 1) * atlas.height / 7)))
        card.save(out / 'assets' / f'sarah-{number:02d}.webp', quality=94)
    print('Extracted 17 Sarah cards and the card back.')
