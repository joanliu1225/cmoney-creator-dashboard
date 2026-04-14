"""
Fetch creator data from Anya and save as JSON for the dashboard.
Usage: python scripts/fetch_anya.py
"""
import json
import time
import secrets
import requests

ANYA_BASE = "https://anya.cmoney.tw"
TX_DATE = "2026-04-14 00:00:00"
CREATORS = [29475, 3158198, 348444]
OUTPUT = "src/data/creators.json"

# Traffic source grouping (entry_page -> category)
SOURCE_MAP = {
    "StockAllRecommend_viewed": "recommend",
    "BuzzPopularRecommend_viewed": "recommend",
    "MarketAllRecommend_viewed": "recommend",
    "MarketAllHot_viewed": "recommend",
    "MarketAllLatest_viewed": "recommend",
    "StockDiscussLatest_viewed": "recommend",
    "StockDiscussHot_viewed": "recommend",
    "BuzzFollowLatest_viewed": "following",
    "SearchResultAll_viewed": "search",
    "SomebodyAll_viewed": "profile",
    "StockNews_viewed": "news",
}
SOURCE_LABELS = {
    "recommend": "推薦動態",
    "search": "搜尋",
    "profile": "個人主頁",
    "following": "追蹤動態",
    "news": "新聞",
    "other": "其他",
}

session = requests.Session()
session.verify = False  # Anya internal cert

import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


def login():
    r = session.post(
        f"{ANYA_BASE}/api/login",
        data={"username": "forumteam_srv", "password": "q8z5a4"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    print("Login:", r.text.strip())


def query(sql, limit=200):
    job_id = secrets.token_hex(4)
    r = session.post(
        f"{ANYA_BASE}/api/queryResult",
        json={"jobId": job_id, "limit": str(limit), "sql": sql, "txDate": TX_DATE, "droppedColumns": ""},
        headers={"Content-Type": "application/json"},
    )
    r.encoding = "utf-8"  # Anya returns UTF-8 but doesn't declare charset
    d = r.json()
    if d.get("error"):
        print(f"  ERROR: {d['error'][:150]}")
        return []
    cols = d.get("columns") or []
    rows = d.get("data") or []
    return [dict(zip(cols, row)) for row in rows]


def fetch_creator(cid):
    print(f"\n=== Creator {cid} ===")
    result = {"creatorId": str(cid)}

    # 1. Followers (60 days) — filter by ddate (table key) for performance
    print("  Fetching followers...")
    followers = query(
        f"SELECT creatorid, add_fans, accum_fans_cnt, ddate "
        f"FROM trans_follow_stat_day WHERE creatorid = {cid} "
        f"AND ddate >= date_sub('{TX_DATE[:10]}', 60) "
        f"ORDER BY ddate DESC LIMIT 60"
    )
    result["followers"] = int(followers[0]["accum_fans_cnt"]) if followers else 0
    result["followerHistory"] = [
        {"date": f["ddate"], "addFans": int(f["add_fans"] or 0), "accumFans": int(f["accum_fans_cnt"] or 0)}
        for f in reversed(followers)
    ]
    time.sleep(2)

    # 2. Posts first — get latest 15 articles by this creator
    #    (more than 10 so we have buffer after dedup)
    print("  Fetching recent posts...")
    posts = query(
        f"SELECT articleid, title, commoditytags, createtime "
        f"FROM trans_post_latest_all WHERE creatorid = {cid} "
        f"ORDER BY createtime DESC LIMIT 15",
        limit=15,
    )
    # Deduplicate and take top 10
    seen = set()
    unique_posts = []
    for p in posts:
        if p["articleid"] not in seen:
            seen.add(p["articleid"])
            unique_posts.append(p)
    posts = unique_posts[:10]
    top_ids = [p["articleid"] for p in posts]
    ids_str = ",".join(top_ids)
    print(f"  Got {len(posts)} articles (latest: {posts[0]['createtime'][:10] if posts else 'N/A'})")
    time.sleep(2)

    # 3. Display stats for these articles (try both week and month)
    print("  Fetching display stats...")
    display = query(
        f"SELECT articleid, user_cnt, kind "
        f"FROM trans_displayed_stat WHERE articleid IN ({ids_str}) "
        f"AND kind IN ('week', 'month') ",
        limit=100,
    )
    disp_map = {}
    for d in display:
        aid = d["articleid"]
        cnt = int(d["user_cnt"] or 0)
        # Keep the larger value (month > week usually)
        if cnt > disp_map.get(aid, 0):
            disp_map[aid] = cnt
    time.sleep(2)

    # 4. Interactions for these articles (group by kind to avoid double-counting)
    print("  Fetching interactions...")
    interactions = query(
        f"SELECT articleid, kind, interaction_type, SUM(CAST(cnt AS INT)) as total "
        f"FROM trans_interaction_stat WHERE articleid IN ({ids_str}) "
        f"AND kind IN ('week', 'month') "
        f"GROUP BY articleid, kind, interaction_type",
        limit=200,
    )
    # Per article+type, take the max across week/month (not sum)
    inter_map = {}
    for i in interactions:
        aid = i["articleid"]
        if aid not in inter_map:
            inter_map[aid] = {"emoji": 0, "comment": 0, "share": 0, "donate": 0, "total": 0}
        cnt = int(i["total"] or 0)
        itype = i["interaction_type"]
        if cnt > inter_map[aid].get(itype, 0):
            inter_map[aid][itype] = cnt
    # Recalculate totals after all rows processed
    for aid in inter_map:
        inter_map[aid]["total"] = sum(v for k, v in inter_map[aid].items() if k != "total")
    time.sleep(2)

    # 5. Traffic sources
    print("  Fetching traffic sources...")
    traffic = query(
        f"SELECT articleid, entry_page, COUNT(DISTINCT memberid) as user_cnt "
        f"FROM trans_article_displayed_source WHERE articleid IN ({ids_str}) "
        f"GROUP BY articleid, entry_page",
        limit=500,
    )
    traf_map = {}
    for t in traffic:
        aid = t["articleid"]
        if aid not in traf_map:
            traf_map[aid] = {}
        group = SOURCE_MAP.get(t["entry_page"], "other")
        traf_map[aid][group] = traf_map[aid].get(group, 0) + int(t["user_cnt"] or 0)
    time.sleep(2)

    # 6. Daily reach — from trans_article_displayed_source (batch all articles)
    print("  Fetching daily reach...")
    daily_reach_rows = query(
        f"SELECT articleid, displayed_date, COUNT(DISTINCT memberid) as daily_reach "
        f"FROM trans_article_displayed_source WHERE articleid IN ({ids_str}) "
        f"GROUP BY articleid, displayed_date "
        f"ORDER BY articleid, displayed_date",
        limit=500,
    )
    daily_reach_map = {}  # {articleid: [{date, reach}]}
    for r in daily_reach_rows:
        aid = r["articleid"]
        if aid not in daily_reach_map:
            daily_reach_map[aid] = []
        daily_reach_map[aid].append({
            "date": r["displayed_date"],
            "reach": int(r["daily_reach"] or 0),
        })
    time.sleep(2)

    # 7. Daily interactions — from trans_forum_article_interactions (batch all articles)
    print("  Fetching daily interactions...")
    daily_inter_rows = query(
        f"SELECT articleid, event_date, event_type, COUNT(*) as cnt "
        f"FROM trans_forum_article_interactions WHERE articleid IN ({ids_str}) "
        f"GROUP BY articleid, event_date, event_type "
        f"ORDER BY articleid, event_date",
        limit=500,
    )
    daily_inter_map = {}  # {articleid: {date: {emoji:n, comment:n, ...}}}
    for r in daily_inter_rows:
        aid = r["articleid"]
        if aid not in daily_inter_map:
            daily_inter_map[aid] = {}
        d = r["event_date"]
        if d not in daily_inter_map[aid]:
            daily_inter_map[aid][d] = {"emoji": 0, "comment": 0, "share": 0, "donate": 0, "collect": 0}
        etype = r["event_type"]
        if etype in daily_inter_map[aid][d]:
            daily_inter_map[aid][d][etype] = int(r["cnt"] or 0)
    time.sleep(2)

    # Build articles
    articles = []
    for p in posts:
        aid = p["articleid"]
        tags = []
        try:
            raw = json.loads(p.get("commoditytags") or "[]")
            tags = [
                {"code": t.get("key") or t.get("Key", ""), "name": t.get("name") or t.get("Name", "")}
                for t in raw
                if (t.get("type") or t.get("Type")) == "Stock"
            ][:5]
        except Exception:
            pass

        # Total reach: sum daily reach if available, else fall back to aggregated stat
        daily_r = daily_reach_map.get(aid, [])
        reach_from_daily = sum(d["reach"] for d in daily_r)
        reach = reach_from_daily if reach_from_daily > 0 else disp_map.get(aid, 0)

        inter = inter_map.get(aid, {"emoji": 0, "comment": 0, "share": 0, "donate": 0, "total": 0})
        traf = traf_map.get(aid, {})
        total_t = sum(traf.values()) or 1
        traffic_sources = sorted(
            [
                {"source": s, "label": SOURCE_LABELS.get(s, s), "count": c, "percent": round(c / total_t * 100)}
                for s, c in traf.items()
            ],
            key=lambda x: -x["count"],
        )

        # Build daily metrics from real data
        daily_dates = sorted(set(
            [d["date"] for d in daily_r] +
            list((daily_inter_map.get(aid) or {}).keys())
        ))
        daily_metrics = []
        for dd in daily_dates:
            dr = next((d["reach"] for d in daily_r if d["date"] == dd), 0)
            di = (daily_inter_map.get(aid) or {}).get(dd, {})
            daily_metrics.append({
                "date": dd,
                "reach": dr,
                "clicks": round(dr * 0.18),  # estimate
                "interactions": sum(di.get(k, 0) for k in ("emoji", "comment", "share", "donate")),
            })

        articles.append(
            {
                "id": aid,
                "title": (p.get("title") or "")[:100] or "(無標題)",
                "publishedAt": (p.get("createtime") or "")[:10],
                "reach": reach,
                "clicks": round(reach * 0.18),  # estimate until reads table is fast enough
                "interactions": inter["total"],
                "stockTags": tags,
                "engagementBreakdown": {
                    "emoji": inter["emoji"],
                    "comment": inter["comment"],
                    "share": inter["share"],
                    "donate": inter["donate"],
                },
                "trafficSources": traffic_sources,
                "dailyMetrics": daily_metrics,
            }
        )

    articles.sort(key=lambda a: a["publishedAt"], reverse=True)
    result["articles"] = articles

    print(f"  Done: {result['followers']} followers, {len(articles)} articles")
    return result


def main():
    login()
    all_data = {}
    for cid in CREATORS:
        all_data[cid] = fetch_creator(cid)

    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)

    print(f"\nSaved to {OUTPUT}")


if __name__ == "__main__":
    main()
