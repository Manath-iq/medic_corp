"""Publish an explicit runtime allowlist without switching the source worktree.

Run npm run build first. Requires an authenticated gh CLI and a source commit.
Never copies private documents, ignored JPG originals or the whole public folder.
"""
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parent.parent


def git(*args, data=None):
    return subprocess.check_output(['git', *args], cwd=ROOT, input=data)


remote = git('remote', 'get-url', 'origin').decode().strip()
if remote not in ('https://github.com/Manath-iq/medic_corp.git', 'git@github.com:Manath-iq/medic_corp.git'):
    raise SystemExit('Unexpected origin; confirm the deployment target first.')
if git('branch', '--show-current').decode().strip() != 'main':
    raise SystemExit('Run from the main source branch, not the deployment branch.')
if git('status', '--porcelain', '--untracked-files=no').strip():
    raise SystemExit('Commit source changes before publishing a build.')

dist = ROOT / 'dist'
paths = [dist / 'index.html']
paths.extend(path for path in (dist / 'assets').glob('*') if path.is_file() and path.suffix in {'.js', '.css', '.woff2', '.webp', '.png', '.avif'})
public = git('ls-files', '-z', 'public').decode().split('\0')
paths.extend(dist / name.removeprefix('public/') for name in public if name)
paths = sorted(set(paths))
if not paths or any(not path.is_file() or path.is_symlink() for path in paths):
    raise SystemExit('Missing or unsafe build file; run npm run build from the committed source.')

tree = {}
secret = re.compile(rb'(gh[pousr]_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9_-]{20,}|-----BEGIN (?:RSA |OPENSSH )?PRIVATE KEY-----)')
for path in paths:
    raw = path.read_bytes()
    if path.suffix in {'.html', '.js', '.css'} and secret.search(raw):
        raise SystemExit(f'Credential-like content in {path.name}; publication blocked.')
    parts = path.relative_to(dist).parts
    node = tree
    for part in parts[:-1]:
        node = node.setdefault(part, {})
    node[parts[-1]] = git('hash-object', '-w', '--stdin', data=raw).decode().strip()
tree['.nojekyll'] = git('hash-object', '-w', '--stdin', data=b'').decode().strip()


def make_tree(node):
    entries = []
    for name, value in sorted(node.items()):
        mode, kind, sha = ('040000', 'tree', make_tree(value)) if isinstance(value, dict) else ('100644', 'blob', value)
        entries.append(f'{mode} {kind} {sha}\t{name}\0'.encode())
    return git('mktree', '-z', data=b''.join(entries)).decode().strip()


parent = []
if git('ls-remote', '--heads', 'origin', 'gh-pages').strip():
    git('fetch', 'origin', 'gh-pages')
    parent = ['-p', git('rev-parse', 'FETCH_HEAD').decode().strip()]
source = git('rev-parse', '--short', 'HEAD').decode().strip()
commit = git('commit-tree', make_tree(tree), *parent, '-m', f'Deploy clinic concept from {source}').decode().strip()
print(f'Publishing {len(paths) + 1} runtime files from source {source}; deploy commit {commit}', flush=True)
subprocess.run(['git', '-c', 'credential.helper=', '-c', 'credential.helper=!gh auth git-credential', 'push', 'origin', f'{commit}:refs/heads/gh-pages'], cwd=ROOT, check=True)
print('Runtime branch pushed. Verify GitHub Pages build and public URL before announcing success.')
