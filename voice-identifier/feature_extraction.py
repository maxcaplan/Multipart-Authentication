import numpy as np
from scipy import signal
import python_speech_features
from sklearn import preprocessing

SILENCE_WINDOW_SIZE = 0.0125  # Seconds


# Calculate and returns the delta of given feature vector matrix
def calculate_delta(array):
    rows, cols = array.shape
    deltas = np.zeros((rows, 25))
    N = 2
    for i in range(rows):
        index = []
        j = 1
        while j <= N:
            if i-j < 0:
                first = 0
            else:
                first = i-j
            if i+j > rows - 1:
                second = rows - 1
            else:
                second = i+j
            index.append((second, first))
            j = j + 1
        deltas[i] = (array[index[0][0]]-array[index[0][1]] + (2 * (array[index[1][0]]-array[index[1][1]]))) / 10
    return deltas


# convert audio to mfcc features
def extract_features(audio, rate):
    mfcc_feat = python_speech_features.mfcc(audio, rate, 0.025, 0.01, 25, appendEnergy=True, nfft=1103)
    mfcc_feat = preprocessing.scale(mfcc_feat)
    delta = calculate_delta(mfcc_feat)

    # combining both mfcc features and delta
    combined = np.hstack((mfcc_feat, delta))
    return combined


def strip_init_err(s, freq):
    ''' Strip initial recording error - 1.2s '''
    return s[int(freq*1.2):]


# normalize the input data
def normalize(x):
    return (x - x.mean()) / (x.max() - x.min())


# apply median filtering to input audio
def denoise(audio):
    return signal.medfilt(audio, 3)  # Apply median filtering


def energy(samples):
    return np.sum(np.power(samples, 2)) / float(len(samples))


# removing any time in the audio file in which there is no sounds detected
def remove_silence(audio, freq):
    output = np.array([])
    base_e = energy(audio)
    win_size = int(freq * SILENCE_WINDOW_SIZE)
    i = 0
    while (i + 1) * win_size < audio.shape[0]:
        window = audio[i*win_size:(i+1)*win_size]
        e = energy(window)
        if e > base_e * 0.2:
            output = np.append(output, window)
        i += 1
    return output
