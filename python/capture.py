import cv2
import numpy
import time 

cv2.namedWindow("preview")
vc = cv2.VideoCapture(0)
index = 1

directory = "./training_images"
    
if vc.isOpened():  # try to get the first frame
    rval, frame = vc.read()
else:
    rval = False

while rval:
    rval, frame = vc.read()

    width = frame.shape[1]
    height = frame.shape[0]

    w = 480
    h = 480
    x = (width - w)/2
    y = (height - w)/2
    reFrame = frame[y:y+h, x:x+w].copy()
    cv2.imshow("preview", reFrame)
    key = cv2.waitKey(20)

    if key == 27:  # exit on ESC
        break

    if key == 32:
        print("[INFO] Capturing frame " + str(index))
        if index % 2 == 0:
            cv2.imwrite("./training_images/train/usr/" + str(time.time()) + ".jpg", reFrame)
        else:
            cv2.imwrite("./training_images/validation/usr/" + str(time.time()) + ".jpg", reFrame)
        index += 1
cv2.destroyWindow("preview")
