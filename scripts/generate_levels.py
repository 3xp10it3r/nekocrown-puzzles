#!/usr/bin/env python3
"""
Deterministic Constraint-Satisfaction Level Generator & Uniqueness Verifier
Generates:
  1. 120 Uniquely Solvable Crown Queens (Star Battle 1-Crown) levels across 4 tiers:
     - Easy (6x6), Medium (7x7), Hard (8x8), Master (9x9)
     - Every colored region is guaranteed 4-connected (contiguous).
     - Every puzzle is verified by backtracking to have EXACTLY 1 solution.
  2. 80 Uniquely Solvable Binary Tango (Sun & Moon) 6x6 levels:
     - Equal 0s and 1s per row/col (3 each), no 3 identical adjacent,
       with '=' (same) and 'x' (opposite) edge constraints + initial clues.
     - Verified to have EXACTLY 1 solution.
"""

import json
import os
import random
from collections import deque

def place_valid_queens(n, rng):
    """Find a valid placement of N queens on an NxN board (no row, col, or 8-neighbor overlap)."""
    cols = list(range(n))
    def backtrack(r, chosen):
        if r == n:
            return chosen
        rng.shuffle(cols)
        for c in range(n):
            col = (c + r * 3) % n
        candidates = list(range(n))
        rng.shuffle(candidates)
        for c in candidates:
            if c in chosen:
                continue
            if r > 0 and abs(chosen[-1] - c) <= 1:
                continue
            res = backtrack(r + 1, chosen + [c])
            if res is not None:
                return res
        return None
    return backtrack(0, [])

def generate_connected_regions(n, queens, rng):
    """Grow N contiguous 4-connected regions starting from the N queen positions."""
    grid = [[-1] * n for _ in range(n)]
    frontiers = [[] for _ in range(n)]
    for reg_id, c in enumerate(queens):
        grid[reg_id][c] = reg_id
        for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
            nr, nc = reg_id + dr, c + dc
            if 0 <= nr < n and 0 <= nc < n:
                frontiers[reg_id].append((nr, nc))

    unassigned = n * n - n
    # Weight some regions to be small/tight (1-3 cells) to create crisp logical deductions
    region_weights = [rng.choice([1, 1, 2, 3, 5, 8]) for _ in range(n)]

    while unassigned > 0:
        progress = False
        reg_order = list(range(n))
        rng.shuffle(reg_order)
        reg_order.sort(key=lambda r: region_weights[r])
        for reg_id in reg_order:
            valid_f = [(r, c) for (r, c) in frontiers[reg_id] if grid[r][c] == -1]
            frontiers[reg_id] = valid_f
            if not valid_f:
                continue
            r, c = rng.choice(valid_f)
            grid[r][c] = reg_id
            unassigned -= 1
            progress = True
            for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
                nr, nc = r + dr, c + dc
                if 0 <= nr < n and 0 <= nc < n and grid[nr][nc] == -1:
                    frontiers[reg_id].append((nr, nc))
            if rng.random() < 0.45:
                break
        if not progress:
            # Assign any remaining isolated cell to an adjacent region
            for r in range(n):
                for c in range(n):
                    if grid[r][c] == -1:
                        neighbors = []
                        for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
                            nr, nc = r + dr, c + dc
                            if 0 <= nr < n and 0 <= nc < n and grid[nr][nc] != -1:
                                neighbors.append(grid[nr][nc])
                        if neighbors:
                            grid[r][c] = rng.choice(neighbors)
                            unassigned -= 1
    return grid

def count_crown_solutions(n, regions, limit=2):
    """Count solutions up to `limit` using fast bitmask backtracking."""
    # Group valid columns per row by region
    row_cols = [list(range(n)) for _ in range(n)]
    solutions = 0

    def solve(r, used_cols, used_regs, prev_c):
        nonlocal solutions
        if r == n:
            solutions += 1
            return
        for c in row_cols[r]:
            if (used_cols & (1 << c)) != 0:
                continue
            if prev_c != -2 and abs(c - prev_c) <= 1:
                continue
            reg = regions[r][c]
            if (used_regs & (1 << reg)) != 0:
                continue
            solve(r + 1, used_cols | (1 << c), used_regs | (1 << reg), c)
            if solutions >= limit:
                return

    solve(0, 0, 0, -2)
    return solutions

def generate_crown_level(n, seed):
    rng = random.Random(seed)
    attempts = 0
    while True:
        attempts += 1
        queens = place_valid_queens(n, rng)
        if not queens:
            continue
        regions = generate_connected_regions(n, queens, rng)
        if count_crown_solutions(n, regions, limit=2) == 1:
            return {
                "size": n,
                "regions": regions,
                "solution": queens
            }

# ---------------- BINARY TANGO (6x6 Sun & Moon) ---------------- #

def get_valid_tango_lines(n=6):
    """All binary lines of length n with n/2 0s, n/2 1s, and no 3 identical adjacent."""
    lines = []
    half = n // 2
    for mask in range(1 << n):
        line = [(mask >> i) & 1 for i in range(n)]
        if sum(line) != half:
            continue
        ok = True
        for i in range(n - 2):
            if line[i] == line[i+1] == line[i+2]:
                ok = False
                break
        if ok:
            lines.append(tuple(line))
    return lines

VALID_6_LINES = get_valid_tango_lines(6)
VALID_6_SET = set(VALID_6_LINES)

def generate_tango_solution(rng):
    n = 6
    lines = list(VALID_6_LINES)
    def backtrack(r, rows):
        if r == n:
            for c in range(n):
                col = tuple(rows[rr][c] for rr in range(n))
                if col not in VALID_6_SET:
                    return None
            return [list(row) for row in rows]
        rng.shuffle(lines)
        for line in lines:
            valid_so_far = True
            for c in range(n):
                ones = sum(rows[rr][c] for rr in range(r)) + line[c]
                zeros = (r + 1) - ones
                if ones > 3 or zeros > 3:
                    valid_so_far = False
                    break
                if r >= 2 and rows[r-2][c] == rows[r-1][c] == line[c]:
                    valid_so_far = False
                    break
            if not valid_so_far:
                continue
            res = backtrack(r + 1, rows + [line])
            if res is not None:
                return res
        return None
    return backtrack(0, [])

def count_tango_solutions(clues, edges, limit=2):
    """
    clues: dict of (r,c) -> 0 or 1
    edges: list of (r1,c1,r2,c2,type) where type is '=' or 'x'
    """
    n = 6
    edge_map = {}
    for r1, c1, r2, c2, t in edges:
        edge_map.setdefault((r1, c1), []).append((r2, c2, t))
        edge_map.setdefault((r2, c2), []).append((r1, c1, t))

    # Pre-filter valid lines per row
    row_candidates = []
    for r in range(n):
        cands = []
        for line in VALID_6_LINES:
            ok = True
            for c in range(n):
                if (r, c) in clues and line[c] != clues[(r, c)]:
                    ok = False
                    break
                for nr, nc, t in edge_map.get((r, c), []):
                    if nr == r and nc < c:
                        if t == '=' and line[c] != line[nc]:
                            ok = False
                            break
                        if t == 'x' and line[c] == line[nc]:
                            ok = False
                            break
            if ok:
                cands.append(line)
        row_candidates.append(cands)

    solutions = 0
    def solve(r, rows):
        nonlocal solutions
        if r == n:
            for c in range(n):
                col = tuple(rows[rr][c] for rr in range(n))
                if col not in VALID_6_SET:
                    return
            solutions += 1
            return

        for line in row_candidates[r]:
            ok = True
            for c in range(n):
                # Check vertical edges to r-1
                for nr, nc, t in edge_map.get((r, c), []):
                    if nr == r - 1 and nc == c:
                        if t == '=' and line[c] != rows[r-1][c]:
                            ok = False
                            break
                        if t == 'x' and line[c] == rows[r-1][c]:
                            ok = False
                            break
                if not ok:
                    break
                ones = sum(rows[rr][c] for rr in range(r)) + line[c]
                zeros = (r + 1) - ones
                if ones > 3 or zeros > 3:
                    ok = False
                    break
                if r >= 2 and rows[r-2][c] == rows[r-1][c] == line[c]:
                    ok = False
                    break
            if not ok:
                continue
            solve(r + 1, rows + [line])
            if solutions >= limit:
                return

    solve(0, [])
    return solutions

def generate_tango_level(seed, difficulty_tier=0):
    rng = random.Random(seed)
    sol = generate_tango_solution(rng)
    n = 6

    # Candidate edges
    all_edges = []
    for r in range(n):
        for c in range(n):
            if c + 1 < n:
                t = '=' if sol[r][c] == sol[r][c+1] else 'x'
                all_edges.append((r, c, r, c+1, t))
            if r + 1 < n:
                t = '=' if sol[r][c] == sol[r+1][c] else 'x'
                all_edges.append((r, c, r+1, c, t))

    rng.shuffle(all_edges)
    target_edge_count = [10, 9, 8, 7][min(difficulty_tier, 3)]
    edges = all_edges[:target_edge_count]

    # Start with all cells as clues, then prune while keeping unique solution
    cells = [(r, c) for r in range(n) for c in range(n)]
    rng.shuffle(cells)
    clues = {pos: sol[pos[0]][pos[1]] for pos in cells}

    min_clues = [10, 8, 7, 6][min(difficulty_tier, 3)]
    for pos in cells:
        if len(clues) <= min_clues:
            break
        val = clues.pop(pos)
        if count_tango_solutions(clues, edges, limit=2) != 1:
            clues[pos] = val

    clue_grid = [[-1] * n for _ in range(n)]
    for (r, c), v in clues.items():
        clue_grid[r][c] = v

    return {
        "size": n,
        "clues": clue_grid,
        "edges": [[r1, c1, r2, c2, t] for (r1, c1, r2, c2, t) in edges],
        "solution": sol
    }

def main():
    print("Generating verified Crown Queens levels...")
    crown_levels = {
        "easy": [],
        "medium": [],
        "hard": [],
        "master": []
    }
    configs = [
        ("easy", 6, 30, 1000),
        ("medium", 7, 30, 2000),
        ("hard", 8, 30, 3000),
        ("master", 9, 30, 4000)
    ]
    for tier_name, size, count, base_seed in configs:
        for i in range(count):
            lvl = generate_crown_level(size, base_seed + i * 17)
            lvl["id"] = f"crown_{tier_name}_{i+1}"
            lvl["tier"] = tier_name
            lvl["number"] = i + 1
            crown_levels[tier_name].append(lvl)
        print(f"  ✓ {tier_name.upper()} ({size}x{size}): {count} levels verified unique")

    print("Generating verified Binary Tango (Sun & Moon) levels...")
    tango_levels = []
    for i in range(80):
        tier = i // 20
        lvl = generate_tango_level(9000 + i * 31, difficulty_tier=tier)
        lvl["id"] = f"tango_{i+1}"
        lvl["number"] = i + 1
        lvl["tier"] = ["easy", "medium", "hard", "master"][tier]
        tango_levels.append(lvl)
    print(f"  ✓ BINARY TANGO (6x6): {len(tango_levels)} levels verified unique")

    out_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "www", "js")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "levels-data.js")

    js_content = (
        "// Auto-generated by scripts/generate_levels.py — 200 Mathematically Verified Unique Levels\n"
        "window.NEON_CROWN_LEVELS = " + json.dumps({
            "crown": crown_levels,
            "tango": tango_levels
        }, separators=(',', ':')) + ";\n"
    )
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(js_content)

    size_kb = os.path.getsize(out_path) / 1024.0
    print(f"Saved {out_path} ({size_kb:.1f} KB)")

if __name__ == "__main__":
    main()
