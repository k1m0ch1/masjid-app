import httpx

BASE = "http://localhost:8004/api/v1"

dummy = [
  # jamaah (5)
  {"full_name":"Ahmad Fauzan","gender":"male","role":"jamaah","phone":"081234561001","occupation":"Pedagang","education_level":"SMA","economic_status":"menengah","date_of_birth":"1985-03-10","address":"Jl. Mawar No. 1"},
  {"full_name":"Siti Rahayu","gender":"female","role":"jamaah","phone":"081234561002","occupation":"Ibu Rumah Tangga","education_level":"SMP","economic_status":"menengah","date_of_birth":"1990-07-22","address":"Jl. Melati No. 2"},
  {"full_name":"Budi Santoso","gender":"male","role":"jamaah","phone":"081234561003","occupation":"Buruh","education_level":"SD","economic_status":"kurang_mampu","date_of_birth":"1978-11-05","address":"Jl. Dahlia No. 3"},
  {"full_name":"Dewi Lestari","gender":"female","role":"jamaah","phone":"081234561004","occupation":"Karyawan Swasta","education_level":"S1","economic_status":"mampu","date_of_birth":"1995-01-18","address":"Jl. Kenanga No. 4"},
  {"full_name":"Eko Prasetyo","gender":"male","role":"jamaah","phone":"081234561005","occupation":"Petani","education_level":"Tidak Disebutkan","economic_status":"tidak_disebutkan","date_of_birth":"1970-06-30","address":"Jl. Anggrek No. 5"},
  # pengurus (5)
  {"full_name":"Haji Mahmud","gender":"male","role":"pengurus","phone":"081234562001","occupation":"Wiraswasta","education_level":"S1","economic_status":"mampu","date_of_birth":"1965-04-15","address":"Jl. Jati No. 10"},
  {"full_name":"Suryadi Kusuma","gender":"male","role":"pengurus","phone":"081234562002","occupation":"PNS","education_level":"S2","economic_status":"mampu","date_of_birth":"1972-09-20","address":"Jl. Pinus No. 11"},
  {"full_name":"Fatimah Zahra","gender":"female","role":"pengurus","phone":"081234562003","occupation":"Guru","education_level":"S1","economic_status":"menengah","date_of_birth":"1980-12-03","address":"Jl. Cemara No. 12"},
  {"full_name":"Ridwan Hakim","gender":"male","role":"pengurus","phone":"081234562004","occupation":"Dokter","education_level":"S2","economic_status":"mampu","date_of_birth":"1975-05-28","address":"Jl. Beringin No. 13"},
  {"full_name":"Nur Aini","gender":"female","role":"pengurus","phone":"081234562005","occupation":"Bidan","education_level":"D3","economic_status":"menengah","date_of_birth":"1983-08-14","address":"Jl. Akasia No. 14"},
  # imam (5)
  {"full_name":"KH. Abdurrahman Wahid","gender":"male","role":"imam","phone":"081234563001","occupation":"Imam Masjid","education_level":"Pesantren","economic_status":"menengah","date_of_birth":"1960-02-17","address":"Jl. Surau No. 20","monthly_honorarium":1500000,"skills":["Hafidz Al-Quran","Imam","Ahli Fiqih"]},
  {"full_name":"Ustadz Zainal Abidin","gender":"male","role":"imam","phone":"081234563002","occupation":"Imam Masjid","education_level":"S2","economic_status":"menengah","date_of_birth":"1968-10-08","address":"Jl. Surau No. 21","monthly_honorarium":1500000,"skills":["Hafidz Al-Quran","Imam"]},
  {"full_name":"Hasan Basri","gender":"male","role":"imam","phone":"081234563003","occupation":"Imam Masjid","education_level":"Pesantren","economic_status":"menengah","date_of_birth":"1975-03-25","address":"Jl. Surau No. 22","monthly_honorarium":1200000,"skills":["Imam","Khatib"]},
  {"full_name":"Muhammad Yusuf","gender":"male","role":"imam","phone":"081234563004","occupation":"Imam Pengganti","education_level":"Pesantren","economic_status":"menengah","date_of_birth":"1982-07-11","address":"Jl. Surau No. 23","monthly_honorarium":1000000,"skills":["Imam","Guru Mengaji"]},
  {"full_name":"Ali Mustofa","gender":"male","role":"imam","phone":"081234563005","occupation":"Imam Pengganti","education_level":"S1","economic_status":"menengah","date_of_birth":"1988-01-29","address":"Jl. Surau No. 24","monthly_honorarium":1000000,"skills":["Imam","Muadzin"]},
  # muadzin (5)
  {"full_name":"Anwar Sholeh","gender":"male","role":"muadzin","phone":"081234564001","occupation":"Muadzin","education_level":"SMA","economic_status":"menengah","date_of_birth":"1980-04-12","address":"Jl. Subuh No. 30","monthly_honorarium":800000,"skills":["Muadzin","Qari/Qariah"]},
  {"full_name":"Faisal Rahman","gender":"male","role":"muadzin","phone":"081234564002","occupation":"Muadzin","education_level":"SMA","economic_status":"menengah","date_of_birth":"1985-09-03","address":"Jl. Subuh No. 31","monthly_honorarium":800000,"skills":["Muadzin"]},
  {"full_name":"Irfan Maulana","gender":"male","role":"muadzin","phone":"081234564003","occupation":"Muadzin","education_level":"SMP","economic_status":"menengah","date_of_birth":"1990-12-20","address":"Jl. Subuh No. 32","monthly_honorarium":750000,"skills":["Muadzin"]},
  {"full_name":"Syaiful Amri","gender":"male","role":"muadzin","phone":"081234564004","occupation":"Muadzin","education_level":"SMA","economic_status":"kurang_mampu","date_of_birth":"1987-06-16","address":"Jl. Subuh No. 33","monthly_honorarium":750000,"skills":["Muadzin","Qari/Qariah"]},
  {"full_name":"Daud Firmansyah","gender":"male","role":"muadzin","phone":"081234564005","occupation":"Muadzin Pengganti","education_level":"SMA","economic_status":"menengah","date_of_birth":"1993-02-08","address":"Jl. Subuh No. 34","monthly_honorarium":600000,"skills":["Muadzin"]},
  # marbot (5)
  {"full_name":"Pardi Suwito","gender":"male","role":"marbot","phone":"081234565001","occupation":"Marbot","education_level":"SD","economic_status":"kurang_mampu","date_of_birth":"1975-08-18","address":"Jl. Kebersihan No. 40","monthly_honorarium":700000},
  {"full_name":"Slamet Riyadi","gender":"male","role":"marbot","phone":"081234565002","occupation":"Marbot","education_level":"SD","economic_status":"kurang_mampu","date_of_birth":"1980-11-27","address":"Jl. Kebersihan No. 41","monthly_honorarium":700000},
  {"full_name":"Bambang Sutrisno","gender":"male","role":"marbot","phone":"081234565003","occupation":"Marbot","education_level":"SMP","economic_status":"kurang_mampu","date_of_birth":"1985-04-05","address":"Jl. Kebersihan No. 42","monthly_honorarium":650000},
  {"full_name":"Suparman","gender":"male","role":"marbot","phone":"081234565004","occupation":"Marbot","education_level":"SD","economic_status":"kurang_mampu","date_of_birth":"1970-07-14","address":"Jl. Kebersihan No. 43","monthly_honorarium":650000},
  {"full_name":"Wagiman Prayitno","gender":"male","role":"marbot","phone":"081234565005","occupation":"Marbot","education_level":"SD","economic_status":"tidak_mampu","date_of_birth":"1968-03-21","address":"Jl. Kebersihan No. 44","monthly_honorarium":600000},
  # ustadz (5)
  {"full_name":"Habib Syarif Al-Attas","gender":"male","role":"ustadz","phone":"081234566001","occupation":"Ustadz","education_level":"Pesantren","economic_status":"menengah","date_of_birth":"1970-05-09","address":"Jl. Ilmu No. 50","skills":["Hafidz Al-Quran","Da'i","Ahli Fiqih","Khatib"]},
  {"full_name":"Ustadz Salim Bajuri","gender":"male","role":"ustadz","phone":"081234566002","occupation":"Ustadz","education_level":"S2","economic_status":"mampu","date_of_birth":"1975-10-14","address":"Jl. Ilmu No. 51","skills":["Guru Mengaji","Da'i","Guru TPQ"]},
  {"full_name":"Ustadzah Maryam Solehah","gender":"female","role":"ustadz","phone":"081234566003","occupation":"Ustadzah","education_level":"S1","economic_status":"menengah","date_of_birth":"1982-01-30","address":"Jl. Ilmu No. 52","skills":["Guru Mengaji","Guru TPQ","Qari/Qariah"]},
  {"full_name":"Ustadz Hamdan Yunus","gender":"male","role":"ustadz","phone":"081234566004","occupation":"Ustadz","education_level":"Pesantren","economic_status":"menengah","date_of_birth":"1978-08-07","address":"Jl. Ilmu No. 53","skills":["Khatib","Da'i","Ahli Fiqih"]},
  {"full_name":"Ustadz Zulkifli Hasan","gender":"male","role":"ustadz","phone":"081234566005","occupation":"Ustadz","education_level":"S1","economic_status":"menengah","date_of_birth":"1984-04-22","address":"Jl. Ilmu No. 54","skills":["Guru Mengaji","Da'i"]},
  # bendahara (3)
  {"full_name":"H. Rachmat Hidayat","gender":"male","role":"bendahara","phone":"081234567001","occupation":"Akuntan","education_level":"S1","economic_status":"mampu","date_of_birth":"1968-07-03","address":"Jl. Keuangan No. 60","bank_account":"BCA 1234567890"},
  {"full_name":"Indah Permatasari","gender":"female","role":"bendahara","phone":"081234567002","occupation":"Bendahara","education_level":"D3","economic_status":"mampu","date_of_birth":"1978-02-19","address":"Jl. Keuangan No. 61","bank_account":"Mandiri 0987654321"},
  {"full_name":"Wahyu Nugroho","gender":"male","role":"bendahara","phone":"081234567003","occupation":"Bendahara","education_level":"S1","economic_status":"mampu","date_of_birth":"1982-11-08","address":"Jl. Keuangan No. 62","bank_account":"BRI 1122334455"},
  # ketua (1)
  {"full_name":"H. Soeharto Wibowo","gender":"male","role":"ketua","phone":"081234568001","occupation":"Pengusaha","education_level":"S2","economic_status":"mampu","date_of_birth":"1960-09-12","address":"Jl. Pemimpin No. 70","notes":"Ketua Takmir terpilih periode 2024-2027"},
]

ok = fail = 0
for d in dummy:
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
        print(f"FAIL {d['full_name']}: {r.status_code} {r.text[:150]}")

print(f"\nTotal: {ok} created, {fail} failed")
