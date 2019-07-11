import tensorflow as tf
import cv2
import numpy as np
import json
import base64
import sys
from PIL import Image
import io

# set threshold for accuracy of face recognition
threshold = 70      # subject to change as testing continues

# load json data from node
lines = sys.stdin.readline()
data = json.loads(lines)


def predict():
    # load model
    model = tf.keras.models.load_model(data['model'])

    # convert data url to byte like object
    img64 = str.encode(data['image'])

    # if img64 missing padding, add padding to base64 file
    missing_padding = len(data) % 4
    if missing_padding:
        img64 += b'='* (4 - missing_padding)

    # decode image data
    decode = base64.b64decode(img64)

    # open decoded data
    imgObj = Image.open(io.BytesIO(decode))

    # convert to color numpy array
    image = cv2.cvtColor(np.array(imgObj), cv2.COLOR_BGR2RGB)

    resize = cv2.resize(image, (160, 160))
    img = resize[np.newaxis, :, :, :]

    # make prediction
    prediction = model.predict(img, steps=1)
    percentage = prediction[0][0] * 100

    if percentage >= threshold:
        authentication = True
        print("[FACE MATCH] Face detected is predicted to match " + data['name'] + "'s ==> " + str(percentage))
    else:
        authentication = False
        print("[FACE CONFLICT] Face detected does not match " + data['name'] + "'s ==> " + str(percentage))
    return authentication


if __name__ == '__main__':
    predict()
