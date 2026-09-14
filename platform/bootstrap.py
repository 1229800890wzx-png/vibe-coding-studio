"""Fetch pinned upstream source and apply this repository's reviewed overlays."""
import io,json,pathlib,shutil,urllib.request,zipfile
root=pathlib.Path(__file__).resolve().parent
manifest=json.loads((root/'upstream.json').read_text())
for entry in manifest.values():
    destination=root/'vendor'/entry['directory']
    if destination.exists():
        raise SystemExit(f'Refusing to overwrite existing source: {destination}')
for entry in manifest.values():
    destination=root/'vendor'/entry['directory']
    url=f"https://codeload.github.com/{entry['repository']}/zip/{entry['revision']}"
    with urllib.request.urlopen(url,timeout=120) as response:
        archive=zipfile.ZipFile(io.BytesIO(response.read()))
    if archive.comment.decode()!=entry['revision']:
        raise RuntimeError('Archive revision does not match manifest')
    destination.mkdir(parents=True)
    for member in archive.infolist():
        relative=pathlib.PurePosixPath(member.filename).parts[1:]
        if not relative: continue
        output=destination.joinpath(*relative).resolve()
        if not output.is_relative_to(destination.resolve()): raise RuntimeError('Invalid archive path')
        if member.is_dir(): output.mkdir(parents=True,exist_ok=True)
        else:
            output.parent.mkdir(parents=True,exist_ok=True)
            with archive.open(member) as source,output.open('wb') as target: shutil.copyfileobj(source,target)
    shutil.copytree(root/'overlays'/entry['directory'],destination,dirs_exist_ok=True)
    print('Prepared '+entry['directory'])
