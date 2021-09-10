import boto3
from config import ACCESS_KEY, SECRET_KEY, BUCKET_REGION, BUCKET_NAME

def s3_connection():
    try:
        s3 = boto3.client(
            service_name='s3',
            region_name=BUCKET_REGION,
            aws_access_key_id=ACCESS_KEY,
            aws_secret_access_key=SECRET_KEY
        )
    except Exception as e:
        print(e)
    else:
        return s3

def s3_connection_bucket():
    try:
        s3 = boto3.resource(
            service_name='s3',
            aws_access_key_id=ACCESS_KEY,
            aws_secret_access_key=SECRET_KEY
        )
        bucket = s3.Bucket(BUCKET_NAME)
    except Exception as e:
        print(e)
    else:
        return bucket
    
def s3_get_object(s3, object_name, file_name):
    try:
        s3.download_file(BUCKET_NAME, object_name, file_name)
    except Exception as e:
        print(e)
        return False
    return True