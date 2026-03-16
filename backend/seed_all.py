"""One-shot seed script: jamaah (missing 6) + zakat fitrah + ziswaf + keuangan + kegiatan"""
import httpx
from datetime import date, timedelta
import random

BASE = "http://localhost:8004/api/v1"
client = httpx.Client(timeout=30)

ok = fail = 0

def post(path, data):
    global ok, fail
    r = client.post(f"{BASE}{path}", json=data)
    if r.status_code in (200, 201):
        ok += 1
        return r.json()
    else:
        fail += 1
        print(f"FAIL {path} {data.get('full_name') or data.get('title') or ''}: {r.status_code} {r.text[:120]}")
        return None

# ── 1. Missing jamaah (6) ───────────────────────────────────────────────────
print("=== Jamaah ===")
missing_jamaah = [
    {"full_name":"Eko Prasetyo","gender":"male","role":"jamaah","phone":"081234561005","occupation":"Petani","education_level":"Tidak Disebutkan","economic_status":"tidak_disebutkan","date_of_birth":"1970-06-30","address":"Jl. Anggrek No. 5"},
    {"full_name":"Habib Syarif Al-Attas","gender":"male","role":"ustadz","phone":"081234566001","occupation":"Ustadz","education_level":"Pesantren","economic_status":"menengah","date_of_birth":"1970-05-09","address":"Jl. Ilmu No. 50","skills":["Hafidz Al-Quran","Khatib","Ahli Fiqih"]},
    {"full_name":"Ustadz Salim Bajuri","gender":"male","role":"ustadz","phone":"081234566002","occupation":"Ustadz","education_level":"S2","economic_status":"mampu","date_of_birth":"1975-10-14","address":"Jl. Ilmu No. 51","skills":["Guru Mengaji","Guru TPQ"]},
    {"full_name":"Ustadzah Maryam Solehah","gender":"female","role":"ustadz","phone":"081234566003","occupation":"Ustadzah","education_level":"S1","economic_status":"menengah","date_of_birth":"1982-01-30","address":"Jl. Ilmu No. 52","skills":["Guru Mengaji","Qari/Qariah"]},
    {"full_name":"Ustadz Hamdan Yunus","gender":"male","role":"ustadz","phone":"081234566004","occupation":"Ustadz","education_level":"Pesantren","economic_status":"menengah","date_of_birth":"1978-08-07","address":"Jl. Ilmu No. 53","skills":["Khatib","Ahli Fiqih"]},
    {"full_name":"Ustadz Zulkifli Hasan","gender":"male","role":"ustadz","phone":"081234566005","occupation":"Ustadz","education_level":"S1","economic_status":"menengah","date_of_birth":"1984-04-22","address":"Jl. Ilmu No. 54","skills":["Guru Mengaji"]},
]
created_jamaah = []
for d in missing_jamaah:
    d.setdefault("skills", [])
    d.setdefault("needs", [])
    d.setdefault("is_active", True)
    d.setdefault("join_date", "2024-01-01")
    d.setdefault("health_status", "sehat")
    d.setdefault("monthly_honorarium", 0)
    r = post("/jamaah", d)
    if r:
        created_jamaah.append(r)
        print(f"  OK {d['role']} {d['full_name']}")

# Get all jamaah to pick IDs for zakat fitrah
all_j = client.get(f"{BASE}/jamaah?limit=500").json()
jamaah_ids = [j["id"] for j in all_j if j.get("id")]

# ── 2. Zakat Fitrah (10, beda tanggal) ─────────────────────────────────────
print("\n=== Zakat Fitrah ===")
zakat_data = [
    {"idx": 0, "jiwa": 4, "uang": 160000, "paid": True,  "date_offset": -20},
    {"idx": 1, "jiwa": 2, "uang": 80000,  "paid": True,  "date_offset": -18},
    {"idx": 2, "jiwa": 6, "uang": 240000, "paid": True,  "date_offset": -15},
    {"idx": 3, "jiwa": 3, "uang": 120000, "paid": False, "date_offset": -12},
    {"idx": 4, "jiwa": 5, "uang": 200000, "paid": True,  "date_offset": -10},
    {"idx": 5, "jiwa": 1, "uang": 40000,  "paid": True,  "date_offset": -8},
    {"idx": 6, "jiwa": 7, "uang": 280000, "paid": False, "date_offset": -6},
    {"idx": 7, "jiwa": 2, "uang": 80000,  "paid": True,  "date_offset": -4},
    {"idx": 8, "jiwa": 4, "uang": 160000, "paid": False, "date_offset": -2},
    {"idx": 9, "jiwa": 3, "uang": 120000, "paid": True,  "date_offset": -1},
]
today = date.today()
zakat_ids = []
for z in zakat_data:
    jid = jamaah_ids[z["idx"] % len(jamaah_ids)]
    payload = {
        "jamaah_id": jid,
        "year": "2026",
        "jumlah_jiwa": z["jiwa"],
        "payment_type": "uang",
        "amount_uang": z["uang"],
        "rate_per_jiwa": 40000,
        "is_paid": False,
    }
    r = post("/zakat-fitrah", payload)
    if r:
        zakat_ids.append((r["id"], z["paid"]))
        print(f"  OK zakat_fitrah id={r['id'][:8]}... jiwa={z['jiwa']} paid={z['paid']}")

# Mark paid ones
for zid, is_paid in zakat_ids:
    if is_paid:
        rp = client.post(f"{BASE}/zakat-fitrah/{zid}/pay")
        if rp.status_code in (200, 201):
            print(f"  PAID {zid[:8]}...")
        else:
            print(f"  PAY FAIL {zid[:8]}: {rp.status_code}")

# ── 3. ZISWAF (10 per jenis × 7 jenis = terlalu banyak, so 10 beda jenis beda tgl) ──
# User said: 10 data ziswaf beda tanggal DAN 10 data per jenis
# Interpret: 10 entries, varied types and dates
print("\n=== ZISWAF ===")
ziswaf_types = ["zakat_mal", "zakat_profesi", "infaq", "shadaqah", "wakaf_tunai"]
ziswaf_data = [
    {"type": "zakat_mal",     "amount": 2500000, "donor": "H. Mahmud",      "days": -25, "note": "Zakat mal tahunan"},
    {"type": "zakat_profesi", "amount": 350000,  "donor": "Suryadi Kusuma", "days": -22, "note": "Zakat profesi bulanan"},
    {"type": "infaq",         "amount": 500000,  "donor": "Ridwan Hakim",   "days": -20, "note": "Infaq pembangunan"},
    {"type": "shadaqah",      "amount": 200000,  "donor": "Fatimah Zahra",  "days": -17, "note": "Shadaqah sunnah"},
    {"type": "wakaf_tunai",   "amount": 5000000, "donor": "H. Soeharto",    "days": -14, "note": "Wakaf tunai masjid"},
    {"type": "zakat_mal",     "amount": 1800000, "donor": "Nur Aini",       "days": -12, "note": "Zakat mal"},
    {"type": "infaq",         "amount": 300000,  "donor": "Dewi Lestari",   "days": -9,  "note": "Infaq jumat"},
    {"type": "zakat_profesi", "amount": 450000,  "donor": "Ahmad Fauzan",   "days": -6,  "note": "Zakat profesi"},
    {"type": "shadaqah",      "amount": 150000,  "donor": "Siti Rahayu",    "days": -4,  "note": "Shadaqah"},
    {"type": "wakaf_tunai",   "amount": 3000000, "donor": "Haji Mahmud",    "days": -2,  "note": "Wakaf tunai"},
]
for z in ziswaf_data:
    tgl = (today + timedelta(days=z["days"])).isoformat()
    payload = {
        "type": z["type"],
        "amount": z["amount"],
        "donor_name": z["donor"],
        "transaction_date": tgl,
        "notes": z["note"],
        "is_anonymous": False,
        "is_verified": False,
    }
    r = post("/ziswaf", payload)
    if r:
        print(f"  OK {z['type']:15} Rp{z['amount']:>9,} {tgl}")

# ── 4. Keuangan (10 transaksi) ──────────────────────────────────────────────
print("\n=== Keuangan ===")
finance_data = [
    {"type": "income",  "cat_i": "infaq_jumat",        "amt": 1200000, "desc": "Infaq Sholat Jumat",           "days": -28, "method": "cash"},
    {"type": "expense", "cat_e": "listrik",             "amt": 450000,  "desc": "Tagihan Listrik Maret",        "days": -25, "method": "transfer"},
    {"type": "income",  "cat_i": "donasi_pembangunan",  "amt": 5000000, "desc": "Donasi Pembangunan Mushola",   "days": -21, "method": "transfer"},
    {"type": "expense", "cat_e": "gaji_marbot",         "amt": 700000,  "desc": "Honor Marbot Februari",       "days": -18, "method": "cash"},
    {"type": "income",  "cat_i": "infaq_harian",        "amt": 350000,  "desc": "Kotak Infaq Harian",          "days": -14, "method": "cash"},
    {"type": "expense", "cat_e": "pemeliharaan",        "amt": 250000,  "desc": "Servis Sound System",         "days": -11, "method": "cash"},
    {"type": "expense", "cat_e": "konsumsi",            "amt": 800000,  "desc": "Konsumsi Pengajian Bulanan",  "days": -9,  "method": "cash"},
    {"type": "income",  "cat_i": "sewa_fasilitas",      "amt": 1500000, "desc": "Sewa Aula Walimahan",         "days": -7,  "method": "transfer"},
    {"type": "expense", "cat_e": "atk",                 "amt": 120000,  "desc": "Pembelian ATK Sekretariat",   "days": -4,  "method": "cash"},
    {"type": "income",  "cat_i": "hasil_usaha",         "amt": 600000,  "desc": "Hasil Penjualan Buku Islami", "days": -2,  "method": "cash"},
]
for f in finance_data:
    tgl = (today + timedelta(days=f["days"])).isoformat()
    payload = {
        "transaction_type": f["type"],
        "transaction_date": tgl,
        "amount": f["amt"],
        "description": f["desc"],
        "payment_method": f["method"],
    }
    if f["type"] == "income":
        payload["income_category"] = f["cat_i"]
    else:
        payload["expense_category"] = f["cat_e"]
    r = post("/transactions", payload)
    if r:
        print(f"  OK {f['type']:7} {f['desc'][:35]:35} Rp{f['amt']:>9,} {tgl}")

# ── 5. Kegiatan (3) ─────────────────────────────────────────────────────────
print("\n=== Kegiatan ===")
events = [
    {
        "title": "Pengajian Ahad Pagi",
        "event_type": "pengajian",
        "description": "Kajian rutin mingguan membahas Tafsir Al-Quran Juz 30",
        "start_datetime": f"{(today + timedelta(days=3)).isoformat()}T08:00:00",
        "end_datetime":   f"{(today + timedelta(days=3)).isoformat()}T10:00:00",
        "location": "Masjid Al-Ikhlas",
        "speaker": "Ustadz Hamdan Yunus",
        "organizer": "Takmir Masjid",
        "is_recurring": True,
        "recurrence_pattern": "weekly",
        "recurrence_days": ["sunday"],
    },
    {
        "title": "Rapat Pengurus Bulanan",
        "event_type": "meeting",
        "description": "Rapat koordinasi pengurus masjid membahas program bulan April 2026",
        "start_datetime": f"{(today + timedelta(days=7)).isoformat()}T19:30:00",
        "end_datetime":   f"{(today + timedelta(days=7)).isoformat()}T21:30:00",
        "location": "Ruang Sekretariat Masjid",
        "organizer": "H. Soeharto Wibowo",
        "is_recurring": False,
    },
    {
        "title": "Khataman Al-Quran & Doa Bersama",
        "event_type": "kajian",
        "description": "Acara khataman Al-Quran bersama jamaah dan santri TPQ dalam rangka menyambut Ramadhan",
        "start_datetime": f"{(today + timedelta(days=14)).isoformat()}T16:00:00",
        "end_datetime":   f"{(today + timedelta(days=14)).isoformat()}T18:30:00",
        "location": "Masjid Al-Ikhlas",
        "speaker": "KH. Abdurrahman Wahid",
        "organizer": "Panitia TPQ & Takmir",
        "registration_required": True,
        "max_participants": 100,
        "is_recurring": False,
    },
]
for e in events:
    e.setdefault("recurrence_days", [])
    e.setdefault("is_recurring", False)
    e.setdefault("registration_required", False)
    r = post("/events", e)
    if r:
        print(f"  OK {e['event_type']:12} {e['title']}")

print(f"\n{'='*50}")
print(f"Total: {ok} berhasil, {fail} gagal")
client.close()
