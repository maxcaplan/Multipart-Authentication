import json
import numpy as np
import base64
import sys
from PIL import Image
import io
import cv2

# load data from node
lines = sys.stdin.readline()
data = json.loads(lines)

# convert data url to byte like object
img64 = str.encode(data['image'])

# decode image data
decode = base64.b64decode(img64)
# open decoded data
imgObj = Image.open(io.BytesIO(decode))
# convert to color numpy array
image = cv2.cvtColor(np.array(imgObj), cv2.COLOR_BGR2RGB)

# display finale image
cv2.imshow('image', image)
cv2.waitKey(0)
cv2.destroyAllWindows()
print("done")
