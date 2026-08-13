#!/usr/bin/env python3
"""
Local-only dev server for the content authoring/admin tool (tools/admin/).

Serves the whole project exactly like `python3 -m http.server` does (so it's
a drop-in replacement for everyday dev use too — and unlike the plain
stdlib server, it disables caching, which sidesteps the "browser is still
running yesterday's JS" class of confusion during active development), plus
one write endpoint the admin UI uses to save an edited question straight
back into the real js/data/questions/*.js source files.

This is a developer tool, not something ever deployed anywhere — it writes
directly to the local filesystem. Only run it against your own working copy.

Usage:
    python3 tools/admin_server.py [port]     (default port 8090)
    open http://localhost:8090/               for the game itself
    open http://localhost:8090/tools/admin/   for the content admin tool
"""
import http.server
import json
import os
import sys
from urllib.parse import urlparse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
QUESTIONS_DIR = os.path.join(ROOT, "js", "data", "questions")

SUBJECT_FILES = {
    "english": "english.js",
    "math": "math.js",
    "reading": "reading.js",
    "science": "science.js",
}


def find_top_level_objects(content, start, end):
    """Return [(obj_start, obj_end), ...] for each top-level {...} object
    found in content[start:end], tracking string literals (with escape
    handling) so a stray brace inside a quoted string can't desync the scan."""
    objects = []
    i = start
    in_string = False
    string_char = None
    escaped = False
    depth = 0
    obj_start = None
    while i < end:
        c = content[i]
        if in_string:
            if escaped:
                escaped = False
            elif c == "\\":
                escaped = True
            elif c == string_char:
                in_string = False
        else:
            if c in ('"', "'", "`"):
                in_string = True
                string_char = c
            elif c == "{":
                if depth == 0:
                    obj_start = i
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    objects.append((obj_start, i + 1))
        i += 1
    return objects


def find_array_span(content, key):
    """Find `"<key>": [ ... ]` and return (inner_start, inner_end) — the
    span strictly between the [ and its matching ], string-aware."""
    marker = '"%s": [' % key
    idx = content.find(marker)
    if idx == -1:
        raise ValueError("skill key %r not found in this file" % key)
    start = idx + len(marker)
    i = start
    depth = 1
    in_string = False
    string_char = None
    escaped = False
    while i < len(content):
        c = content[i]
        if in_string:
            if escaped:
                escaped = False
            elif c == "\\":
                escaped = True
            elif c == string_char:
                in_string = False
        else:
            if c in ('"', "'", "`"):
                in_string = True
                string_char = c
            elif c == "[":
                depth += 1
            elif c == "]":
                depth -= 1
                if depth == 0:
                    return start, i
        i += 1
    raise ValueError("unterminated array for %r" % key)


def js_string(value):
    escaped = str(value).replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n")
    return '"%s"' % escaped


def serialize_question(q):
    # No leading indentation on the opening brace: it gets inserted at the
    # exact byte offset of the original `{`, and content[:obj_start] already
    # includes whatever indentation preceded that `{` on its line — adding
    # more here would double it up.
    lines = ["{"]
    if q.get("passageId"):
        lines.append("      passageId: %s," % js_string(q["passageId"]))
    if q.get("stimulusId"):
        lines.append("      stimulusId: %s," % js_string(q["stimulusId"]))
    lines.append("      q: %s," % js_string(q["q"]))
    lines.append("      choices: [")
    for c in q["choices"]:
        lines.append("        %s," % js_string(c))
    lines.append("      ],")
    lines.append("      answer: %d," % int(q["answer"]))
    lines.append("      explain: %s," % js_string(q["explain"]))
    lines.append("    }")
    return "\n".join(lines)


class AdminHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def _send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path != "/api/save-question":
            self._send_json(404, {"error": "not found"})
            return
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
            subject_id = body["subjectId"]
            skill_id = body["skillId"]
            bank_index = int(body["bankIndex"])
            question = body["question"]

            filename = SUBJECT_FILES.get(subject_id)
            if not filename:
                raise ValueError("unknown subject %r" % subject_id)
            filepath = os.path.join(QUESTIONS_DIR, filename)

            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()

            arr_start, arr_end = find_array_span(content, skill_id)
            objects = find_top_level_objects(content, arr_start, arr_end)
            if bank_index < 0 or bank_index >= len(objects):
                raise ValueError(
                    "bankIndex %d out of range (skill has %d questions)" % (bank_index, len(objects))
                )
            obj_start, obj_end = objects[bank_index]
            new_text = serialize_question(question)
            new_content = content[:obj_start] + new_text + content[obj_end:]

            with open(filepath, "w", encoding="utf-8") as f:
                f.write(new_content)

            self._send_json(200, {"ok": True})
        except Exception as e:
            self._send_json(400, {"error": str(e)})

    def end_headers(self):
        # Local-only tool, content changes on every save — never let the
        # browser serve a stale cached copy of a file this same tool just
        # rewrote (or of anything else, while we're at it).
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write("[admin] " + (fmt % args) + "\n")


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8090
    server = http.server.ThreadingHTTPServer(("localhost", port), AdminHandler)
    print("Game:       http://localhost:%d/" % port)
    print("Admin tool: http://localhost:%d/tools/admin/" % port)
    print("(serving + saving against %s)" % ROOT)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
