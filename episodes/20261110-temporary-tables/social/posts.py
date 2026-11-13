# X thread posts for episode 196 and their X character counts (a link counts as 23; limit 280).
# The texts are read from x-thread.md (the code blocks under the "### N/" headings), so the two cannot drift.
import re, pathlib
md = pathlib.Path(__file__).with_name("x-thread.md").read_text()
for k, t in re.findall(r"^### (\d+)/.*?\n```\n(.*?)\n```", md, re.S | re.M):
    n = len(re.sub(r"https?://\S+", "x" * 23, t))
    print(f"post {k}: {n} chars{'  OVER 280' if n > 280 else ''}")
