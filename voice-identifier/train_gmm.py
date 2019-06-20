import pyaudio
import os
import pickle
import numpy as np
import filetype
import subprocess
import sys
import json
from scipy.io.wavfile import read
from sklearn.mixture import GaussianMixture as GMM

from feature_extraction import extract_features

# HYPERPARAMETERS
ROOT_DIR = os.path.dirname(os.path.dirname(__file__)) + '/'
DATABASE_DIR = './users/'
FORMAT = pyaudio.paInt16
CHANNELS = 2
RATE = 44100
CHUNK = 1024
RECORD_SECONDS = 3

# fetch data passed through PythonShell from app.js
lines = sys.stdin.readline()
data = json.loads(lines)
name = str(data['name'])


def train_gmm(name):
    # setting paths to database directory and .gmm files in models
    source = DATABASE_DIR + name + '/audio/'
    destination = DATABASE_DIR + name + '/gmm-model/'

    count = 1

    for path in os.listdir(source):
        path = os.path.join(source, path)
        fname = os.path.basename(path)

        # check that the audio files are saved under the correct extension
        # if file extension is not '.wav' then convert to '.wav' format
        kind = filetype.guess(path)
        if kind.extension != "wav":
            command = "ffmpeg -i " + path + " -ab 160k -ac 2 -ar 44100 -vn " + fname
            subprocess.call(command, shell=True)
            os.remove(path)
            os.rename('./' + fname, path)

        features = np.array([])

        # reading audio files of speaker
        sr, audio = read(path)

        # extract 40 dim MFCC and delta MFCC features
        vector = extract_features(audio, sr)

        if features.size == 0:
            features = vector
        else:
            features = np.vstack((features, vector))

        # when features of the 3 speaker files are concatenated, then train the model
        if count == 3:
            gmm = GMM(n_components=16, max_iter=200, covariance_type='diag', n_init=3)
            gmm.fit(features)

            # save the trained Gaussian Model
            pickle.dump(gmm, open(destination + name + '.gmm', 'wb'))
            print("Model for " + name + "'s voice has successfully been trained")

            features = np.asarray(())
            count = 0
        count = count + 1


if __name__ == '__main__':
    train_gmm(name)

