import tensorflow as tf
import cv2
import numpy as np
import json
import base64
import sys
from PIL import Image
import io

import os, random

print("TensorFlow version is " + str(tf.__version__))

# load json data from node
lines = sys.stdin.readline()
data = json.loads(lines)

# load model
model = tf.keras.models.load_model(data['model'])
print("model loaded!")
model.summary()

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

# make prediction
prediction = model.predict(image, steps=1)  # todo fix error occuring at this line of code "ValueError: Error when checking input: expected mobilenetv2_1.00_160_input to have 4 dimensions, but got array with shape (79, 79, 3)"
print("Likelihood that this is " + data['name'] + ": " + str(prediction[0][0] * 100) + "%")