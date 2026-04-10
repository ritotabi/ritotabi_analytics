import json

base_pv_old = [
    {"m": "Apr'26", "mp": "4月", "pv": {"jp_ishigaki": 21, "jp_miyako": 15, "jp_yoron": 6, "jp_kume": 6, "jp_aka": 3, "jp_other": 9, "cjp": 20, "cen": 0, "hjp": 0, "hen": 0}},
    {"m": "May'26", "mp": "5月", "pv": {"jp_ishigaki": 42, "jp_miyako": 30, "jp_yoron": 12, "jp_kume": 12, "jp_aka": 6, "jp_other": 18, "cjp": 20, "cen": 5, "hjp": 30, "hen": 5}},
    {"m": "Jun'26", "mp": "6月", "pv": {"jp_ishigaki": 98, "jp_miyako": 70, "jp_yoron": 28, "jp_kume": 28, "jp_aka": 14, "jp_other": 42, "cjp": 80, "cen": 30, "hjp": 80, "hen": 30}},
    {"m": "Jul'26", "mp": "7月", "pv": {"jp_ishigaki": 245, "jp_miyako": 175, "jp_yoron": 70, "jp_kume": 70, "jp_aka": 35, "jp_other": 105, "cjp": 150, "cen": 80, "hjp": 150, "hen": 80}},
    {"m": "Aug'26", "mp": "8月", "pv": {"jp_ishigaki": 420, "jp_miyako": 300, "jp_yoron": 120, "jp_kume": 120, "jp_aka": 60, "jp_other": 180, "cjp": 250, "cen": 150, "hjp": 250, "hen": 150}},
    {"m": "Sep'26", "mp": "9月", "pv": {"jp_ishigaki": 262, "jp_miyako": 188, "jp_yoron": 75, "jp_kume": 75, "jp_aka": 38, "jp_other": 112, "cjp": 300, "cen": 200, "hjp": 300, "hen": 200}},
    {"m": "Oct'26", "mp": "10月", "pv": {"jp_ishigaki": 385, "jp_miyako": 275, "jp_yoron": 110, "jp_kume": 110, "jp_aka": 55, "jp_other": 165, "cjp": 400, "cen": 300, "hjp": 400, "hen": 300}},
    {"m": "Nov'26", "mp": "11月", "pv": {"jp_ishigaki": 525, "jp_miyako": 375, "jp_yoron": 150, "jp_kume": 150, "jp_aka": 75, "jp_other": 225, "cjp": 500, "cen": 400, "hjp": 500, "hen": 400}},
    {"m": "Dec'26", "mp": "12月", "pv": {"jp_ishigaki": 630, "jp_miyako": 450, "jp_yoron": 180, "jp_kume": 180, "jp_aka": 90, "jp_other": 270, "cjp": 600, "cen": 500, "hjp": 600, "hen": 500}},
    {"m": "Jan'27", "mp": "1月", "pv": {"jp_ishigaki": 420, "jp_miyako": 300, "jp_yoron": 120, "jp_kume": 120, "jp_aka": 60, "jp_other": 180, "cjp": 700, "cen": 700, "hjp": 800, "hen": 700}},
    {"m": "Feb'27", "mp": "2月", "pv": {"jp_ishigaki": 560, "jp_miyako": 400, "jp_yoron": 160, "jp_kume": 160, "jp_aka": 80, "jp_other": 240, "cjp": 900, "cen": 900, "hjp": 1000, "hen": 900}},
    {"m": "Mar'27", "mp": "3月", "pv": {"jp_ishigaki": 980, "jp_miyako": 700, "jp_yoron": 280, "jp_kume": 280, "jp_aka": 140, "jp_other": 420, "cjp": 1100, "cen": 1200, "hjp": 1300, "hen": 1200}},
    {"m": "Apr'27", "mp": "4月", "pv": {"jp_ishigaki": 1400, "jp_miyako": 1000, "jp_yoron": 400, "jp_kume": 400, "jp_aka": 200, "jp_other": 600, "cjp": 1400, "cen": 1800, "hjp": 1800, "hen": 1800}},
    {"m": "May'27", "mp": "5月", "pv": {"jp_ishigaki": 1925, "jp_miyako": 1375, "jp_yoron": 550, "jp_kume": 550, "jp_aka": 275, "jp_other": 825, "cjp": 1800, "cen": 2500, "hjp": 2500, "hen": 2500}},
    {"m": "Jun'27", "mp": "6月", "pv": {"jp_ishigaki": 1575, "jp_miyako": 1125, "jp_yoron": 450, "jp_kume": 450, "jp_aka": 225, "jp_other": 675, "cjp": 2000, "cen": 3000, "hjp": 3000, "hen": 3000}},
    {"m": "Jul'27", "mp": "7月", "pv": {"jp_ishigaki": 2625, "jp_miyako": 1875, "jp_yoron": 750, "jp_kume": 750, "jp_aka": 375, "jp_other": 1125, "cjp": 2200, "cen": 3500, "hjp": 3500, "hen": 3500}},
    {"m": "Aug'27", "mp": "8月", "pv": {"jp_ishigaki": 3150, "jp_miyako": 2250, "jp_yoron": 900, "jp_kume": 900, "jp_aka": 450, "jp_other": 1350, "cjp": 2400, "cen": 4000, "hjp": 4000, "hen": 4000}},
    {"m": "Sep'27", "mp": "9月", "pv": {"jp_ishigaki": 2275, "jp_miyako": 1625, "jp_yoron": 650, "jp_kume": 650, "jp_aka": 325, "jp_other": 975, "cjp": 2600, "cen": 4500, "hjp": 4500, "hen": 4500}},
    {"m": "Oct'27", "mp": "10月", "pv": {"jp_ishigaki": 2800, "jp_miyako": 2000, "jp_yoron": 800, "jp_kume": 800, "jp_aka": 400, "jp_other": 1200, "cjp": 2800, "cen": 5000, "hjp": 5000, "hen": 5000}},
    {"m": "Nov'27", "mp": "11月", "pv": {"jp_ishigaki": 3500, "jp_miyako": 2500, "jp_yoron": 1000, "jp_kume": 1000, "jp_aka": 500, "jp_other": 1500, "cjp": 3000, "cen": 5500, "hjp": 5500, "hen": 5500}},
    {"m": "Dec'27", "mp": "12月", "pv": {"jp_ishigaki": 3780, "jp_miyako": 2700, "jp_yoron": 1080, "jp_kume": 1080, "jp_aka": 540, "jp_other": 1620, "cjp": 3200, "cen": 6000, "hjp": 6000, "hen": 6000}},
    {"m": "Jan'28", "mp": "1月", "pv": {"jp_ishigaki": 2625, "jp_miyako": 1875, "jp_yoron": 750, "jp_kume": 750, "jp_aka": 375, "jp_other": 1125, "cjp": 3200, "cen": 6000, "hjp": 6000, "hen": 6000}},
    {"m": "Feb'28", "mp": "2月", "pv": {"jp_ishigaki": 3150, "jp_miyako": 2250, "jp_yoron": 900, "jp_kume": 900, "jp_aka": 450, "jp_other": 1350, "cjp": 3400, "cen": 6500, "hjp": 6500, "hen": 6500}},
    {"m": "Mar'28", "mp": "3月", "pv": {"jp_ishigaki": 4480, "jp_miyako": 3200, "jp_yoron": 1280, "jp_kume": 1280, "jp_aka": 640, "jp_other": 1920, "cjp": 3600, "cen": 7000, "hjp": 7000, "hen": 7000}},
]

multipliers = {
    "jp_ishigaki": 18000 / 4480,
    "jp_miyako": 16000 / 3200,
    "jp_yoron": 1500 / 1280,
    "jp_kume": 1500 / 1280,
    "jp_aka": 1000 / 640,
    "jp_other": 2000 / 1920,
    "cjp": 1200 / 3600,
    "cen": 2500 / 7000,
    "hjp": 4500 / 7000,
    "hen": 10000 / 7000,
}

new_data = []
for row in base_pv_old:
    new_row = {"m": row["m"], "mp": row["mp"], "pv": {}}
    for k, v in row["pv"].items():
        if k in multipliers:
            new_row["pv"][k] = int(round(v * multipliers[k]))
        else:
            new_row["pv"][k] = v
    
    # Inject English counterparts
    new_row["pv"]["en_ishigaki"] = int(round(new_row["pv"]["jp_ishigaki"] * 0.33))
    new_row["pv"]["en_miyako"] = int(round(new_row["pv"]["jp_miyako"] * 0.31))
    new_row["pv"]["en_yoron"] = int(round(new_row["pv"]["jp_yoron"] * 0.33))
    new_row["pv"]["en_kume"] = int(round(new_row["pv"]["jp_kume"] * 0.33))
    new_row["pv"]["en_aka"] = int(round(new_row["pv"]["jp_aka"] * 0.3))
    new_row["pv"]["en_other"] = int(round(new_row["pv"]["jp_other"] * 0.5)) # Other can be 0.5
    
    new_data.append(new_row)

print("export const BASE_PV_OBJ: BasePVRow[] = [")
for row in new_data:
    print(f"  {json.dumps(row, ensure_ascii=False)},")
print("];")
