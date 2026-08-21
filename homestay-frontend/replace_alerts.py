import os
import re

files = [
    'src/pages/Login.jsx',
    'src/pages/Register.jsx',
    'src/pages/Profile.jsx',
    'src/pages/MyBookings.jsx',
    'src/pages/HostDashboard.jsx',
    'src/pages/HostBookings.jsx',
    'src/pages/AdminDashboard.jsx',
    'src/pages/BecomeHost.jsx',
    'src/pages/AdminHostRequestDetail.jsx'
]

for filepath in files:
    if not os.path.exists(filepath): continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    if 'import toast from' not in content:
        # Find the first import statement and put it after
        content = re.sub(r"(import .*?;)", r"\1\nimport toast from 'react-hot-toast';", content, count=1)

    # 1. Replace setMessage({ type: 'error', text: X }) with toast.error(X)
    content = re.sub(r"setMessage\(\{\s*type:\s*['\"]error['\"],\s*text:\s*(.+?)\s*\}\);", r"toast.error(\1);", content)
    # 2. Replace setMessage({ type: 'success', text: X }) with toast.success(X)
    content = re.sub(r"setMessage\(\{\s*type:\s*['\"]success['\"],\s*text:\s*(.+?)\s*\}\);", r"toast.success(\1);", content)
    # 3. Replace setError(X) with toast.error(X) (except setError(''))
    content = re.sub(r"setError\((?!['\"]['\"])(.+?)\);", r"toast.error(\1);", content)

    # 4. Remove empty resets
    content = re.sub(r"setMessage\(\{\s*type:\s*['\"]['\"],\s*text:\s*['\"]['\"]\s*\}\);", "", content)
    content = re.sub(r"setError\(['\"]['\"]\);", "", content)

    # 5. Remove page-alert JSX
    content = re.sub(r"\{message\.text\s*&&\s*\(\s*<div[^>]*page-alert[^>]*>.*?</div>\s*\)\}", "", content, flags=re.DOTALL)
    
    # 6. Remove error-msg JSX
    content = re.sub(r"\{error\s*&&\s*<div[^>]*error-msg[^>]*>.*?</div>\}", "", content, flags=re.DOTALL)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

print("Replacement complete.")
