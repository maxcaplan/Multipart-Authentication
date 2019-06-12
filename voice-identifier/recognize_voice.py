import pyaudio
import wave
import os
import time
import pickle
import numpy as np
from scipy.io.wavfile import read

from feature_extraction import extract_features
from retrain_gmm import retrain_gmm

# HYPERPARAMETERS
FORMAT = pyaudio.paInt16
CHANNELS = 2
RATE = 44100
CHUNK = 1024
RECORD_SECONDS = 4
FILE_NAME = "./test.wav"    # todo if the identification is correct save './test.wav' as a file in the database


def recognize_voice():
    # get user to input name they would like to sign in under
    name = input("Please enter the name you would like to sign into: ")

    audio = pyaudio.PyAudio()

    # list all possible devices to record audio input
    print("Device list for audio input")
    for i in range(audio.get_device_count()):
        dev = audio.get_device_info_by_index(i)
        print(("Index: %d" % i, dev['name'], dev['maxInputChannels']))

    # have user select the preferred device for audio input
    index = input("Please select the preferred device for audio input (index will default to device at index 0): ")
    if index == "":
        index = 0

    # begin recording speaker
    stream = audio.open(format=FORMAT, channels=CHANNELS, rate=RATE, input=True, input_device_index=int(index),
                        frames_per_buffer=CHUNK)

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
    with wave.open(FILE_NAME, 'wb') as waveFile:
        waveFile.setnchannels(CHANNELS)
        waveFile.setsampwidth(audio.get_sample_size(FORMAT))
        waveFile.setframerate(RATE)
        waveFile.writeframes(b''.join(frames))
        waveFile.close()

    modelpath = "./models/gmm"
    models = []
    gmm_file = [os.path.join(modelpath, fname) for fname in os.listdir(modelpath) if fname.endswith('.gmm')]
    for fname in gmm_file:
        models.append(pickle.load(open(fname, 'rb')))
    speakers = [fname.split("/")[-1].split(".gmm")[0] for fname in gmm_file]

    if len(models) == 0:
        print("There are no users registered in the Database!")
        return

    # read the test files
    sr, audio = read(FILE_NAME)

    # extract the mfcc features from the file
    vector = extract_features(audio, sr)
    log_likelihood = np.zeros(len(models))

    # check against each of the models one by one
    for i in range(len(models)):
        gmm = models[i]
        scores = np.array(gmm.score(vector))
        log_likelihood[i] = scores.sum()

    pred = np.argmax(log_likelihood)
    identify = speakers[pred]

    # if voice is not recognized then terminate the process
    # todo change to 'Unknown once testing is complete
    if identify == 'unknown':
        print("Voice not recognized, please try again...")
        return

    # cut off the 'gmm/' from the beginning of predictions
    if identify.startswith("gmm"):
        identify = identify[4:]

    # print out the predicted identity of speaker
    print("Recognized as - ", identify)

    if name == identify:
        print("[ACCESS GRANTED] Voice authentication matches")
        add_data = input("Would you like to add identification file to database (y/n)?")
        if add_data == "":
            add_data = 'n'

        if add_data == 'y':
            retrain_gmm(identify)
    else:
        print("[ACCESS DENIED] Voice authentication does not match")

    return identify


if __name__ == '__main__':
    recognize_voice()
