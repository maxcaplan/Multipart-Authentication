import pyaudio
import wave
import os
import sys
import time
import json
import pickle
import numpy as np
from scipy.io.wavfile import read

from feature_extraction import extract_features

# HYPERPARAMETERS
FORMAT = pyaudio.paInt16
CHANNELS = 2
RATE = 44100
CHUNK = 1024
RECORD_SECONDS = 4
FILE_NAME = "./test.wav"

# fetch data passed through PythonShell from app.js
lines = sys.stdin.readline()
data_passed = json.loads(lines)
name = str(data_passed['name'])


# todo fetch .wav files recorded from application
def recognize_voice(name):
    audio = pyaudio.PyAudio()

    # begin recording speaker
    stream = audio.open(format=FORMAT, channels=CHANNELS, rate=RATE, input=True, frames_per_buffer=CHUNK)

    time.sleep(2.0)
    print("Recording...")
    frames = []

    for i in range(0, int(RATE/CHUNK*RECORD_SECONDS)):
        data = stream.read(CHUNK)
        frames.append(data)
    print("Recording finished")

    # end recording
    stream.stop_stream()
    stream.close()
    audio.terminate()

    # save recording to wav file
    # todo determine where files for comparing will be saved
    with wave.open(FILE_NAME, 'wb') as waveFile:
        waveFile.setnchannels(CHANNELS)
        waveFile.setsampwidth(audio.get_sample_size(FORMAT))
        waveFile.setframerate(RATE)
        waveFile.writeframes(b''.join(frames))
        waveFile.close()

    modelpath = "./users" + name + "/gmm-model/" + name + ".gmm"
    if os.path.exists(modelpath):
        model = pickle.load(open(modelpath, 'rb'))
    else:
        print("There is no GMM in this specified path")
        return

    # read the test files
    sr, audio = read(FILE_NAME)

    # extract the mfcc features from the file
    vector = extract_features(audio, sr)

    score = model.score(vector)
    log_likelihood = score.sum()

    if log_likelihood >= np.log(0.75):
        authentication = True
    else:
        authentication = False

    if authentication:
        print("[ACCESS GRANTED] Voice matches the specified user")
    else:
        print("[ACCESS DENIED] Voice does not match the specified user")


if __name__ == '__main__':
    recognize_voice(name)
