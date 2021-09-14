import argparse
from time import time

import numpy as np
import cv2
import tensorflow as tf

from ocr.model import LPRNet
from ocr.loader import resize_and_normailze

classnames = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
              "가", "나", "다", "라", "마", "거", "너", "더", "러",
              "머", "버", "서", "어", "저", "고", "노", "도", "로",
              "모", "보", "소", "오", "조", "구", "누", "두", "루",
              "무", "부", "수", "우", "주", "허", "하", "호"
              ]

weight_fath = 'ocr/weights_best.pb'

def getCarNumber(license_plate):
    args = {'image' : license_plate, 'weights' : weight_fath}

    #tf.compat.v1.enable_eager_execution()
    net = LPRNet(len(classnames) + 1)
    net.load_weights(args["weights"])

    img = cv2.imread(args["image"])
    #img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    x = np.expand_dims(resize_and_normailze(img), axis=0)
    
    carNum, score = net.predict(x, classnames)
    return carNum[0]