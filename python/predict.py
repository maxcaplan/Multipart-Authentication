import tensorflow as tf
import argparse
import matplotlib.pyplot as plt
import cv2
import numpy as np

import os, random

print("TensorFlow version is " + str(tf.__version__))

ap = argparse.ArgumentParser()
ap.add_argument("-m", "--model", required=True,
                help="Path to an existing model to continue training")

args = vars(ap.parse_args())

# load model
model = tf.keras.models.load_model(str(args['model']))
print("model loaded!")
model.summary()

# get random image and process
folder = random.choice(os.listdir("./training_images/validation/"))
file = random.choice(os.listdir("./training_images/validation/" + folder))

image = cv2.imread("./training_images/validation/" + folder + "/" + file)
resize = cv2.resize(image, (160, 160))
cv2.imshow('image',image)
image = np.expand_dims(resize, axis=0)

# make prediction
prediction = model.predict(image, steps=1)
print(str(prediction[0][0] * 100) + " percent sure this is Max")

predicting = True

# grab random images when space pressed until esc pressed
while predicting:
    key = cv2.waitKey(20)
    if(key == 27):
        predicting = False
    if(key == 32):
        print("~Getting new image~")
        folder = random.choice(os.listdir("./training_images/validation/"))
        file = random.choice(os.listdir("./training_images/validation/" + folder))

        image = cv2.imread("./training_images/validation/" + folder + "/" + file)
        resize = cv2.resize(image, (160, 160))
        cv2.imshow('image',image)
        image = np.expand_dims(resize, axis=0)

        prediction = model.predict(image, steps=1)
        print(str(prediction[0][0] * 100) + " percent sure this is Max")

cv2.destroyAllWindows()