import os, requests, json
from flask_restful import Resource, reqparse
from utils.s3 import s3_connection, s3_connection_bucket, s3_get_object
from ocr.predict import getCarNumber
from config import TARGET_URL, TARGET_PORT, TARGET_API

s3 = s3_connection()
bucket = s3_connection_bucket()
targetUrl = '{0}:{1}/{2}'.format(TARGET_URL, TARGET_PORT, TARGET_API)

class Verification(Resource):
    parser = reqparse.RequestParser()
    parser.add_argument('filename', type=str, required=True)

    def post(self):
        data = Verification.parser.parse_args()
        filename = data['filename']

        # 500
        jsonToDic = json.loads(bucket.Object(filename).get()['Body'].read().decode('utf-8'))
        jsonInfo = jsonToDic['info'] # dict
        jsonData = jsonToDic['data'] # list

        sendInfo = { 'type': jsonInfo['type'], 'createdAt': jsonInfo['createdAt'] }
        sendData = []
        for d in jsonData:
            parkLocation = '{0}-{1}{2}'.format(jsonInfo['parkingLotIndex'], jsonInfo['section'], d['location'])
            newData = {"parkLocation": parkLocation, "inOut": d['inOut']}
            if d["inOut"] == "in":
                newData['electric'] = int(d['electric'])
                newData['disabled'] = int(d['disabled'])
                credit = d['credit']
                if credit >= 0.5:
                    newData['carNum'] = d['carNum']
                else:
                    img = jsonInfo['imgUrl']
                    s3_get_object(s3, img, img)
                    carNum = getCarNumber(img)
                    os.remove(img)
                    newData['carNum'] = carNum
            sendData.append(newData)

        # data = {'info': sendInfo, 'data': sendData}
        # return {'data': data} , 200
        res = requests.post(targetUrl, data=data)
        return {}, 200