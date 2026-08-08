import markdown as md
from datetime import datetime


def export_as_markdown(title: str, messages: list) -> str:
    lines = [f"# {title}", f"*Exported from ChatNemo — {datetime.now().strftime('%Y-%m-%d %H:%M')}*\n---\n"]
    for msg in messages:
        role = "**You**" if msg.role == "user" else "**ChatNemo**"
        lines.append(f"### {role}\n{msg.content}\n")
    return "\n".join(lines)


def export_as_html(title: str, messages: list) -> str:
    """HTML suitable for WeasyPrint → PDF."""
    body_parts = []
    for msg in messages:
        role_label = "You" if msg.role == "user" else "ChatNemo"
        role_class = "user" if msg.role == "user" else "assistant"
        content_html = md.markdown(msg.content, extensions=["fenced_code", "tables"])
        body_parts.append(
            f'<div class="message {role_class}">'
            f'<span class="role">{role_label}</span>'
            f'<div class="content">{content_html}</div>'
            f"</div>"
        )

    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>{title}</title>
<style>
  body {{ font-family: 'Inter', sans-serif; max-width: 800px; margin: 40px auto; color: #1a1a2e; }}
  h1 {{ font-size: 22px; margin-bottom: 4px; }}
  .meta {{ color: #666; font-size: 13px; margin-bottom: 32px; }}
  .message {{ margin-bottom: 24px; padding: 16px; border-radius: 8px; }}
  .user {{ background: #f0f4ff; }}
  .assistant {{ background: #f8f8f8; border-left: 3px solid #76b900; }}
  .role {{ font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #555; display: block; margin-bottom: 8px; }}
  pre {{ background: #1e1e2e; color: #cdd6f4; padding: 12px; border-radius: 6px; overflow-x: auto; font-size: 13px; }}
  code {{ font-family: monospace; }}
</style>
</head>
<body>
<h1>{title}</h1>
<p class="meta">Exported from ChatNemo &middot; {datetime.now().strftime('%B %d, %Y')}</p>
{"".join(body_parts)}
</body>
</html>"""
