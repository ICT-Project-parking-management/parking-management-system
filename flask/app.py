from flask import Flask
from flask_restful import Api
from resources.verification import Verification

app = Flask(__name__)
api = Api(app)

api.add_resource(Verification, '/verifications')

@app.route('/')
def index():
	return 'Running Flask Application Server!'

if __name__ == '__main__':
	app.run(debug=True, host='0.0.0.0', port=5000)