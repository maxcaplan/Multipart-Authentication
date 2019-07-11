# importing necessary packages
import os
import sys
import wave
import numpy as np
from matplotlib import pyplot as plt

from data_processing import normalizeSoundTraining, eliminateAmbienceTraining

# Paths to key directories
ROOT_DIR = os.path.dirname(os.path.dirname(__file__)) + '/'
DATABASE_DIR = ROOT_DIR + 'users/'


def visualize_audio(username):

    for i in os.listdir(DATABASE_DIR + username + '/audio/'):
        wav_file = wave.open(DATABASE_DIR + username + '/audio/' + str(i), 'r')

        # Extract raw audio from wav file
        signal = wav_file.readframes(-1)
        signal = np.fromstring(signal, 'Int16')

        # Plot
        plt.figure(1)
        plt.title('Original Signal ' + str(i))
        plt.plot(signal)
        plt.show()

    eliminateAmbienceTraining(username)
    normalizeSoundTraining(username)

    for i in os.listdir(DATABASE_DIR + username + '/audio/'):
        wav_file = wave.open(DATABASE_DIR + username + '/audio/' + str(i), 'r')

        # Extract raw audio from wav file
        signal = wav_file.readframes(-1)
        signal = np.fromstring(signal, 'Int16')

        # Plot
        plt.figure(1)
        plt.title('Processed Signal ' + str(i))
        plt.plot(signal)
        plt.show()


if __name__ == '__main__':
    visualize_audio("JohnDoe")

