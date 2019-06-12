# import the necessary packages
import pyaudio
import wave
import os
import time
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


def add_voice():
    # have user input the name that they will be recognized under for the Database
    name = input("Enter Name: ")

    # check that the input name does not yet exist in the names database
    try:
        os.mkdir(DATABASE_DIR + name)
        print("Database directory for user: ", name, ", has been created")
    except FileExistsError:
        print("Directory for user: ", name, ", already exists...")
        return

    # list all available audio input devices
    print("Device list for audio recordings")
    devices = pyaudio.PyAudio()
    for i in range(devices.get_device_count()):
        dev = devices.get_device_info_by_index(i)
        print(("Index: %d" % i, dev['name'], dev['maxInputChannels']))

    index = input("Please select the preferred device for audio input (index will default to device at index 0): ")
    if index == "":
        index = "0"

    source = DATABASE_DIR + name

    # get the user to say their name, multiple times to collect passphrase data to train/test and validate against
    # inform the user of what to do next
    for i in range(3):
        audio = pyaudio.PyAudio()
        if i == 0:
            j = 3
            while j >= 0:
                time.sleep(1.0)
                os.system('cls' if os.name == 'nt' else 'clear')
                print("Please say your name in {} seconds".format(j))
                j = j - 1
        elif i == 1:
            time.sleep(1.0)
            print("Please say your name once again")
            time.sleep(0.8)
        else:
            time.sleep(1.0)
            print("Please say your name one last time")
            time.sleep(0.8)

        # begin recording to capture the users voice
        stream = audio.open(format=FORMAT, channels=CHANNELS, rate=RATE, input=True, input_device_index=int(index),
                            frames_per_buffer=CHUNK)
        print("Recording... ")
        frames =[]

        for x in range(0, int(RATE/CHUNK*RECORD_SECONDS)):
            data = stream.read(CHUNK)
            frames.append(data)

        # end the recording
        stream.stop_stream()
        stream.close()
        audio.terminate()

        # save the collected speaker data to .wav file
        with wave.open(source + '/' + str((i+1)) + '.wav', 'wb') as waveFile:
            waveFile.setnchannels(CHANNELS)
            waveFile.setsampwidth(audio.get_sample_size(FORMAT))
            waveFile.setframerate(RATE)
            waveFile.writeframes(b''.join(frames))
            waveFile.close()
        print("Finished converting to .wav file format")

    destination = relative_path('./models/gmm/')
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
            print(name + ' Successfully added voice to database')

            features = np.asarray(())
            count = 0
        count = count + 1


if __name__ == '__main__':
    add_voice()
