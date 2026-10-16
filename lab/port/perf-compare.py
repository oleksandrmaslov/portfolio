#!/usr/bin/env python3
"""Before -> after per state, the budget's columns: python3 perf-compare.py perf-before.json perf-after.json
Per state: requests / wire KB (cumulative, unique), GLB and KTX2 groups, contexts made/live, heap, and for every renderer
that drew: programs, draws/frame, tris/frame, render median/p95 ms, tex/geo/RT MB. tex MB is printed as given and as
'tex-RT', the textures that are not render targets (r160's PMREM texture is an RT and the harness counts it twice)."""
import json, sys
def load(f):
    d = json.load(open(f)); return {s["state"]: s for s in d["states"]}
B, A = load(sys.argv[1]), load(sys.argv[2])
def net(s, k="cumulative"):
    n = s["network"][k]; g = n["byKind"].get("glb", {}); x = n["byKind"].get("ktx2", {})
    return f'{n["total"]["uniqN"]} / {n["total"]["uniqWire"]/1024:.0f}K · glb {g.get("uniqN",0)}/{g.get("uniqWire",0)/1024:.0f}K · ktx2 {x.get("uniqN",0)}/{x.get("uniqWire",0)/1024:.0f}K'
def rows(s):
    out = []
    for r in s["renderers"]:
        dr = r.get("drawn") or {}
        if not r.get("frames"): continue
        rtTex = sum(float(t.split()[-1][:-2]) for t in dr.get("topTex", []) if t.startswith("rt "))
        out.append((r["by"].split(" < ")[0][:22], r["info"]["programs"], r.get("callsPerFrame"), r.get("trisPerFrame"),
                    f'{r["cpuMs"]["median"]}/{r["cpuMs"]["p95"]}', dr.get("texMB"), round((dr.get("texMB") or 0) - rtTex, 2), dr.get("geoMB"), dr.get("rtMB")))
    return out
print("| state | side | req / wire | contexts made/live | heap MB |")
print("|---|---|---|---|---|")
for k in A:
    for side, S in (("before", B), ("after", A)):
        s = S.get(k)
        if not s: continue
        extra = "  (delta " + net(s, "delta") + ")" if k in ("landing-board", "iskra-menu") else ""
        print(f'| {k} | {side} | {net(s)}{extra} | {s["contexts"]["created"]}/{s["contexts"]["live"]} | {s["heapMB"]} |')
print()
print("| state | side | renderer | programs | draws/f | tris/f | render ms med/p95 | tex MB | tex-RT MB | geo MB | RT MB |")
print("|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|")
for k in A:
    for side, S in (("before", B), ("after", A)):
        s = S.get(k)
        if not s: continue
        for r in rows(s):
            print(f"| {k} | {side} | " + " | ".join(str(x) for x in r) + " |")
