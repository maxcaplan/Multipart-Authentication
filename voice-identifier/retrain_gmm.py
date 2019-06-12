import pyaudio
import os
import pickle
import numpy as np
from scipy.io.wavfile import read
from sklearn.mixture import GaussianMixture as GMM

from feature_extraction import extract_features
from functionality import relative_path

# HYPERPARAMETERS
DATABASE_DIR = relative_path('./data/database/')
FORMAT = pyaudio.paInt16
CHANNELS = 2
RATE = 44100
CHUNK = 1024
RECORD_SECONDS = 3


def retrain_gmm(name):
    # setting paths to database directory and .gmm files in models
    source = DATABASE_DIR + name
    destination = relative_path('./models/gmm/')

    # relocate the 'test.wav' file into the users name directory in database
    # change the name of the wav file to the respective number
    file_name_num = len(os.listdir(source)) + 1
    file_name = str(file_name_num) + '.wav'

    # destination of the most recent recognition test
    src = relative_path('./test.wav')
    dest = relative_path(source + "/") + file_name
    os.rename(src, dest)

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

