import subprocess
import pyaudio
import os
import sys
import json
import pickle
import warnings
import filetype
from scipy.io.wavfile import read

from data_processing import normalizeSoundRecognizing, eliminateAmbienceRecognizing
from feature_extraction import extract_features

warnings.simplefilter("ignore")

# HYPERPARAMETERS
ROOT_DIR = os.path.dirname(os.path.dirname(__file__)) + '/'
DATABASE_DIR = './users/'
FORMAT = pyaudio.paInt16
CHANNELS = 2
RATE = 44100
CHUNK = 1024
RECORD_SECONDS = 3.5
threshold = 0.20   # subject to change later in development

# fetch data passed through PythonShell from app.js
lines = sys.stdin.readline()
data_passed = json.loads(lines)
name = str(data_passed['name'])


def recognize_voice(name):
    # setting paths to database directory and .gmm files in models
    test_file_dir = DATABASE_DIR + name + '/audioComparison/'
    modelpath = DATABASE_DIR + str(name) + "/gmm-model/" + str(name) + ".gmm"

    if os.path.exists(modelpath):
        model = pickle.load(open(modelpath, 'rb'))
    else:
        print("There is no GMM in this specified path")
        return

    for path in os.listdir(test_file_dir):
        path = os.path.join(test_file_dir, path)
        fname = os.path.basename(path)

        # check that the audio files are saved under the correct extension
        # if file extension is not '.wav' then convert to '.wav' format
        kind = filetype.guess(path)
        if kind.extension != "wav":
            command = "ffmpeg -i " + path + " -ab 160k -ac 2 -ar 44100 -vn " + fname
            subprocess.call(command, shell=True)
            os.remove(path)
            os.rename('./' + fname, path)

    # data preprocessing
    eliminateAmbienceRecognizing(name)
    normalizeSoundRecognizing(name)

    # read the test files
    sr, audio = read(test_file_dir + "loginAttempt.wav")

    # extract the mfcc features from the file
    vector = extract_features(audio, sr)

    # get the likelihood score that 'loginAttempt.wav' matches the GMM (outputs a log() value of the score)
    prob = model.predict_proba(vector)[:, 1].mean()

    # if log_likelihood is greater than threshold grant access
    if prob >= threshold:
        authentication = True
        print("[VOICE MATCH] Voice matches the specified user ==> " + str(prob))
    else:
        authentication = False
        print("[VOICE CONFLICT] Voice does not match the specified user ==> " + str(prob))
    return authentication


if __name__ == '__main__':
    recognize_voice(name)
