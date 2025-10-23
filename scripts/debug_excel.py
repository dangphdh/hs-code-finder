import openpyxl

wb = openpyxl.load_workbook('public/data/harmonized-system/data/BIEU-THUE-XNK-2025.xlsx')
ws = wb['BT2025']

print("Xem 20 dòng đầu tiên từ hàng 20:")
print("-" * 150)
for i, row in enumerate(ws.iter_rows(min_row=20, max_row=40, values_only=True), start=20):
    print(f"Row {i}: L={row[4]:^3} | Code={str(row[5])[:10]:^12} | VI={str(row[6])[:40]:^42} | EN={str(row[7])[:40]}")
