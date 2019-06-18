import pyaudio
import os
import pickle
import numpy as np
from scipy.io.wavfile import read
from sklearn.mixture import GaussianMixture as GMM

from feature_extraction import extract_features
from functionality import relative_path

# HYPERPARAMETERS
DATABASE_DIR = '/Multipart-Authentication/users/'
FORMAT = pyaudio.paInt16
CHANNELS = 2
RATE = 44100
CHUNK = 1024
RECORD_SECONDS = 3


def train_gmm(name):
    # setting paths to database directory and .gmm files in models
    source = DATABASE_DIR + name + '/audio/'
    destination = DATABASE_DIR + name + '/gmm_model/'

    count = 1

    for path in os.listdir(source):
        path = os.path.join(source, path)

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
            print(name + ' Successfully retained voice to database')

            features = np.asarray(())
            count = 0
        count = count + 1