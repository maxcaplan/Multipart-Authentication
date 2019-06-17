import sys
import json
import os
import io
import base64
import numpy as np
from PIL import Image
import cv2

lines = sys.stdin.readline()
data = json.loads(lines)
img64 = data['image']


def data_uri_to_cv2_img(uri):
    encoded_data = uri.split(',')[1]
    nparr = np.fromstring(encoded_data.decode('base64'), np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return img

# imgBytes = io.BytesIO(base64.b64decode(img64))
# img = Image.open(imgBytes)
# arr = np.array(img)[:, :, 0]

img = data_uri_to_cv2_img(img64)

cv2.imshow('image', img)
cv2.waitKey(0)
cv2.destroyAllWindows()

print("done")
