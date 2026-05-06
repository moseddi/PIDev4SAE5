import urllib.request, json

data = {
  "user": {
    "userId": 1,
    "specialty": "INFO",
    "registeredEventTypes": ["Workshop"],
    "totalRegistrations": 3
  },
  "events": [
    {"id":1,"title":"AI Workshop 2026","type":"Workshop","status":"PLANNED","maxParticipants":50,"currentParticipants":25,"estimatedCost":0},
    {"id":2,"title":"Tech Conference","type":"Conference","status":"PLANNED","maxParticipants":200,"currentParticipants":80,"estimatedCost":10},
    {"id":3,"title":"Coding Competition","type":"Competition","status":"PLANNED","maxParticipants":100,"currentParticipants":60,"estimatedCost":5},
    {"id":4,"title":"Business Seminar","type":"Seminar","status":"PLANNED","maxParticipants":80,"currentParticipants":10,"estimatedCost":0}
  ],
  "topN": 4
}

req = urllib.request.Request(
    "http://localhost:5050/recommend",
    json.dumps(data).encode(),
    {"Content-Type": "application/json"}
)
res = urllib.request.urlopen(req)
result = json.loads(res.read())

print("=== RECOMMENDATION RESULTS ===")
print("Engagement Level:", result["userEngagementLevel"])
print("Algorithm:", result["algorithm"])
print("Total Analyzed:", result["totalAnalyzed"])
print()
for i, r in enumerate(result["recommendations"], 1):
    print(f"{i}. {r['badge']} - {r['title']}")
    print(f"   Score: {r['score']} ({r['percentage']}%)")
    print(f"   Reason: {r['reason']}")
    print(f"   Tag: {r['engagementTag']}")
    print()
