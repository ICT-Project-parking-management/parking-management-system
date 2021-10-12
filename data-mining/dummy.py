import numpy as np
import random
import os
import random
import pandas as pd
from pandas.tseries.offsets import Minute

classNumber = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]

classCharacter = ["가", "나", "다", "라", "마", "거", "너", "더", "러",
              "머", "버", "서", "어", "저", "고", "노", "도", "로",
              "모", "보", "소", "오", "조", "구", "누", "두", "루",
              "무", "부", "수", "우", "주", "허", "하", "호"]

def my_seed_everywhere(seed: int = 42):
    random.seed(seed) # random
    np.random.seed(seed) # numpy
    os.environ["PYTHONHASHSEED"] = str(seed)

def makePlateNumber(length=7):
    plateNumber = ""
    for i in range(length):
        if i == length-5:
        index = random.randint(0, len(classCharacter)-1)
        plateNumber += classCharacter[index]
        else:
        index = random.randint(0, len(classNumber)-1)
        plateNumber += str(classNumber[index])
    return plateNumber

def makeTimeFormat(duration=30):
    ts_ms = pd.date_range(start = '2021-09-20',
                            end = None,
                            periods = 48,
                            freq = Minute(duration))
    return ts_ms

# 22 ~ 06 : 80
# 07 ~ 08 : 70
# 09 ~ 18 : 30
# 19 ~ 21 : 60
def getProbability(duration):
    prob = [9 , 8 , 4 , 7]
    index = 0
    if (duration >= 22/24 or duration < 7/24):
        index = 0
    elif duration < 9/24:
        index = 1
    elif duration < 19/24:
        index = 2
    else:
        index = 3
    rand = random.randint(1,10)
    return prob[index] > rand if True else False

def possession(day=1, freq=30):
    duration = int(24 * 60 / freq)
    pos = [None] * day * duration
    for d in range(day):
        for i in range(duration):
        t = i/duration
        if i == 0:
            if (getProbability(t)):
            pos[d*duration+i] = makePlateNumber()
            else:
            pos[d*duration+i] = None
        else:
            if pos[d*duration+i-1] == None:
            if (getProbability(t)):
                pos[d*duration+i] = makePlateNumber()
            else:
                pos[d*duration+i] = None
            else:
            if (getProbability(t)):
                if random.randint(1,10) >= 2 if True else False:
                pos[d*duration+i] = pos[d*duration+i-1]
                else:
                pos[d*duration+i] = makePlateNumber()
            else:
                pos[d*duration+i] = None 
    return pos