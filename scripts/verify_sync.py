#!/usr/bin/env python3
"""Verify end-to-end sync: all 4 surfaces + event store."""
import json, urllib.request

BASE = "http://localhost:3001/rest/v1"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
RID = "00000000-0000-0000-0000-000000000100"
HDR = {"apikey": KEY, "Authorization": f"Bearer {KEY}"}

def get(path):
    req = urllib.request.Request(f"{BASE}/{path}", headers=HDR)
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

print("=" * 60)
print("SYNC VERIFICATION")
print("=" * 60)

# 1. Products (TPV / Mini TPV / Public Page source)
prods = get(f"gm_products?restaurant_id=eq.{RID}&available=eq.true&select=id")
print(f"\n1. gm_products (available): {len(prods)}")

# 2. Catalog items (Menu Visual / future Uber/Glovo)
cats = get("gm_catalog_items?select=id,title,is_available")
avail = [c for c in cats if c["is_available"]]
print(f"2. gm_catalog_items total: {len(cats)}, available: {len(avail)}")

# 3. ID overlap (should be 100% for Sofia products)
prod_ids = set(p["id"] for p in prods)
cat_ids = set(c["id"] for c in cats)
overlap = prod_ids & cat_ids
print(f"3. ID overlap (products ∩ catalog): {len(overlap)} / {len(prod_ids)} products")

# 4. Catalog categories
cat_cats = get("gm_catalog_categories?select=title")
print(f"4. Catalog categories: {len(cat_cats)}")
for cc in sorted(cat_cats, key=lambda x: x["title"]):
    print(f"   - {cc['title']}")

# 5. Event store
events = get("event_store?stream_type=eq.PRODUCT&select=event_type")
from collections import Counter
ec = Counter(e["event_type"] for e in events)
print(f"5. Product events: {dict(ec)}, total: {len(events)}")

# 6. Sample sync check
sample = get(f"gm_products?restaurant_id=eq.{RID}&select=id,name,price_cents,photo_url&limit=3")
for s in sample:
    ci = get(f"gm_catalog_items?id=eq.{s['id']}&select=id,title,price_cents,image_url")
    if ci:
        match = ci[0]
        ok = match["title"] == s["name"] and match["price_cents"] == s["price_cents"] and match["image_url"] == s["photo_url"]
        status = "OK" if ok else "MISMATCH"
        print(f"6. [{status}] {s['name']} -> catalog title={match['title']}, price={match['price_cents']}, img={'yes' if match['image_url'] else 'no'}")
    else:
        print(f"6. [MISSING] {s['name']} not in catalog")

print("\n" + "=" * 60)
if len(overlap) == len(prod_ids) and len(prod_ids) > 0:
    print("RESULT: ALL SURFACES IN SYNC")
else:
    print(f"RESULT: PARTIAL SYNC ({len(overlap)}/{len(prod_ids)})")
print("=" * 60)
