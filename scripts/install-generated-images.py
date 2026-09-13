"""Resize explicitly requested compact website assets; never generate or retouch images.

Usage: python scripts/install-generated-images.py output/generated-manifest.json
The manifest is produced by the built-in Imagegen tool and includes local source paths.
"""
import hashlib
import json
from pathlib import Path
import sys
from PIL import Image

root = Path(__file__).resolve().parents[1]
manifest = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8-sig"))
careers = json.loads((root / "src/careers.json").read_text(encoding="utf-8-sig"))
by_id = {item["id"]: item for item in manifest}
if set(by_id) != {c["id"] for c in careers}:
    raise ValueError("Exactly one generated image is required for each of the 60 careers")
prompts = []
for career in careers:
    item = by_id[career["id"]]
    source = Path(item["path"])
    target = root / "public/images" / (career["id"] + ".webp")
    with Image.open(source) as original:
        if abs(original.width / original.height - 1.5) > 0.02:
            raise ValueError(f"Unexpected aspect ratio: {career['id']}: {original.size}")
        original.convert("RGB").resize((768, 512), Image.Resampling.LANCZOS).save(target, "WEBP", quality=82, method=6)
    digest = hashlib.sha256(target.read_bytes()).hexdigest()[:12]
    career["image"] = {
        "kind": "generated", "path": "images/" + target.name,
        "title": "Beispielhafte Tätigkeit: " + career["title"],
        "author": "OpenAI Imagegen", "generated": "2026-09-13",
        "alt": "KI-generiertes Tätigkeitsbild: " + career["title"],
        "width": 768, "height": 512, "version": digest,
    }
    prompts.append({"id": career["id"], "tool": "OpenAI Imagegen (built-in)", "date": "2026-09-13", "prompt": item["prompt"], "path": "public/images/" + target.name, "width": 768, "height": 512})
    old = root / "public/images" / (career["id"] + ".jpg")
    if old.is_file():
        old.unlink()
(root / "src/careers.json").write_text(json.dumps(careers, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
(root / "docs/image-prompts.json").write_text(json.dumps(prompts, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Installed {len(prompts)} landscape assets, total {sum((root / p['path']).stat().st_size for p in prompts) / 1024 / 1024:.2f} MiB")
