from flask import Flask
from flask_restful import Api
from resources.verification import Verification
from config import HOST, PORT

app = Flask(__name__)
api = Api(app)

api.add_resource(Verification, '/verifications')

@app.route('/')
def index():
	return 'Running Flask Application Server!'

if __name__ == '__main__':
	app.run(debug=True, host=HOST, port=PORT)