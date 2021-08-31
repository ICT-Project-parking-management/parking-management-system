from flask_restful import Resource, reqparse

class Verification(Resource):
    parser = reqparse.RequestParser()
    parser.add_argument('filename', type=str, required=True)
    
    def post(self):
        data = Verification.parser.parse_args()
        filename = data['filename']

        # Todo
        # 1. req 파라미터 설정 및 2차 검증 로직
        # 2. node로 요청하기
        
        return {"filename": filename}, 200
