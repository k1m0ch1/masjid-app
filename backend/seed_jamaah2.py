import httpx

BASE = "http://localhost:8004/api/v1"

missing = [
  {"full_name":"Eko Prasetyo","gender":"male","role":"jamaah","phone":"081234561005","occupation":"Petani","education_level":"Tidak Disebutkan","economic_status":"tidak_disebutkan","date_of_birth":"1970-06-30","address":"Jl. Anggrek No. 5"},
  {"full_name":"Habib Syarif Al-Attas","gender":"male","role":"ustadz","phone":"081234566001","occupation":"Ustadz","education_level":"Pesantren","economic_status":"menengah","date_of_birth":"1970-05-09","address":"Jl. Ilmu No. 50","skills":["Hafidz Al-Quran","Da'i","Ahli Fiqih","Khatib"]},
  {"full_name":"Ustadz Salim Bajuri","gender":"male","role":"ustadz","phone":"081234566002","occupation":"Ustadz","education_level":"S2","economic_status":"mampu","date_of_birth":"1975-10-14","address":"Jl. Ilmu No. 51","skills":["Guru Mengaji","Da'i","Guru TPQ"]},
  {"full_name":"Ustadzah Maryam Solehah","gender":"female","role":"ustadz","phone":"081234566003","occupation":"Ustadzah","education_level":"S1","economic_status":"menengah","date_of_birth":"1982-01-30","address":"Jl. Ilmu No. 52","skills":["Guru Mengaji","Guru TPQ","Qari/Qariah"]},
  {"full_name":"Ustadz Hamdan Yunus","gender":"male","role":"ustadz","phone":"081234566004","occupation":"Ustadz","education_level":"Pesantren","economic_status":"menengah","date_of_birth":"1978-08-07","address":"Jl. Ilmu No. 53","skills":["Khatib","Da'i","Ahli Fiqih"]},
  {"full_name":"Ustadz Zulkifli Hasan","gender":"male","role":"ustadz","phone":"081234566005","occupation":"Ustadz","education_level":"S1","economic_status":"menengah","date_of_birth":"1984-04-22","address":"Jl. Ilmu No. 54","skills":["Guru Mengaji","Da'i"]},
]

ok = fail = 0
for d in missing:
    d.setdefault("skills", [])
    d.setdefault("needs", [])
    d.setdefault("is_active", True)
    d.setdefault("join_date", "2024-01-01")
    d.setdefault("health_status", "sehat")
    d.setdefault("monthly_honorarium", 0)
    r = httpx.post(f"{BASE}/jamaah", json=d)
    if r.status_code == 201:
        ok += 1
        print(f"OK  {d['role']:12} {d['full_name']}")
    else:
        fail += 1
        print(f"FAIL {d['full_name']}: {r.status_code} {r.text[:200]}")

print(f"\nTotal: {ok} created, {fail} failed")
