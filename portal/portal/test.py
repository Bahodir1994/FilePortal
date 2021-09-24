import datetime
date1 = datetime.datetime(2020, 7, 1)
date2 = datetime.datetime.now()
delta = date2 - date1
p = delta.days//365
bor = 5 - p
if p >= 5:
    print(p)
else:
    print('xali', bor, 'yil vaqt bor', date1)
